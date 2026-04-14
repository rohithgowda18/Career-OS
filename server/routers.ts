import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getApplicationsByUserId, getApplicationById, createApplication, updateApplication, deleteApplication, getUserPreferences, createUserPreferences, updateUserPreferences, getUserProfile, getProfileByUsername, createOrUpdateProfile, getProfileStats, getProfileApplications, getUserApplicationProfile, createOrUpdateUserApplicationProfile, getPool } from "./db";
import { handleApplicationStatusChange } from "./notificationHandlers";
import { generateRecommendations, calculateSuccessMetrics } from "./_core/recommendationEngine";
import { fetchEventMetadata } from "./_core/metadataService";
import type { Application } from "../shared/db-types";

// Calculate smart recommendations based on user's application history
function calculateDefaultRecommendations(applications: Application[]) {
  const eventTypeCounts = {
    Hackathon: 0,
    Workshop: 0,
    Conference: 0,
    Other: 0,
  };
  
  const eventTypeSuccess = {
    Hackathon: 0,
    Workshop: 0,
    Conference: 0,
    Other: 0,
  };
  
  // Analyze application history
  for (const app of applications) {
    eventTypeCounts[app.eventType]++;
    if (app.status === "Accepted") {
      eventTypeSuccess[app.eventType]++;
    }
  }
  
  // Calculate success rates
  const successRates = {
    Hackathon: eventTypeCounts.Hackathon > 0 ? (eventTypeSuccess.Hackathon / eventTypeCounts.Hackathon) * 100 : 75,
    Workshop: eventTypeCounts.Workshop > 0 ? (eventTypeSuccess.Workshop / eventTypeCounts.Workshop) * 100 : 85,
    Conference: eventTypeCounts.Conference > 0 ? (eventTypeSuccess.Conference / eventTypeCounts.Conference) * 100 : 70,
    Other: eventTypeCounts.Other > 0 ? (eventTypeSuccess.Other / eventTypeCounts.Other) * 100 : 60,
  };
  
  // Sort event types by success rate
  const sortedTypes = Object.entries(successRates)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => type);
  
  const recommendations = {
    Hackathon: {
      eventType: "Hackathon",
      reasoning: "Great for building projects, networking, and hands-on learning. You've shown interest in this area!",
      successRate: Math.round(successRates.Hackathon),
      suggestedEvents: [
        { name: "MLH Prime", url: "https://mlh.io" },
        { name: "Devpost Hackathons", url: "https://devpost.com/hackathons" },
        { name: "AngelHack", url: "https://www.angelhack.com" },
        { name: "TechCrunch Disrupt Hackathon", url: "https://disrupt.techcrunch.com" },
      ],
      bestTimeToApply: "2-4 weeks before event date",
      tips: [
        "Build a unique project idea before applying",
        "Highlight relevant past projects in your application",
        "Apply to multiple hackathons to increase chances",
        "Join communities like MLH to discover events early"
      ]
    },
    Workshop: {
      eventType: "Workshop",
      reasoning: "Perfect for deepening skills and learning new technologies with hands-on practice.",
      successRate: Math.round(successRates.Workshop),
      suggestedEvents: [
        { name: "Coursera Workshops", url: "https://www.coursera.org" },
        { name: "Udemy Tech Workshops", url: "https://www.udemy.com" },
        { name: "Frontend Masters", url: "https://frontendmasters.com" },
        { name: "LinkedIn Learning", url: "https://www.linkedin.com/learning" },
      ],
      bestTimeToApply: "1-3 weeks before workshop starts",
      tips: [
        "Choose workshops that align with your career goals",
        "Look for certifications that boost your resume",
        "Practice the skills learned immediately after",
        "Join cohort-based programs for community support"
      ]
    },
    Conference: {
      eventType: "Conference",
      reasoning: "Excellent opportunities for networking, learning industry trends, and career growth.",
      successRate: Math.round(successRates.Conference),
      suggestedEvents: [
        { name: "TechCrunch Disrupt", url: "https://disrupt.techcrunch.com" },
        { name: "Google I/O", url: "https://io.google/2024" },
        { name: "Web Summit", url: "https://websummit.com" },
        { name: "PyCon", url: "https://www.pycon.org" },
      ],
      bestTimeToApply: "2-3 months before conference",
      tips: [
        "Check for student or early-bird discounts",
        "Plan which talks and sessions to attend",
        "Network with other attendees in your field",
        "Apply for speaker slots if you have relevant experience"
      ]
    },
    Other: {
      eventType: "Other",
      reasoning: "Diverse opportunities for unique learning and networking experiences.",
      successRate: Math.round(successRates.Other),
      suggestedEvents: [
        { name: "Eventbrite Tech Events", url: "https://www.eventbrite.com" },
        { name: "Meetup.com Tech Groups", url: "https://www.meetup.com" },
        { name: "Local Networking Events", url: "https://www.eventbrite.com" },
      ],
      bestTimeToApply: "1-2 weeks before event",
      tips: [
        "Check local tech communities for events",
        "Network with people in your field",
        "Explore niche topics that interest you",
        "Build relationships with organizers"
      ]
    }
  };
  
  return sortedTypes.map(type => recommendations[type as keyof typeof recommendations]);
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  applications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getApplicationsByUserId(ctx.user.id);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const app = await getApplicationById(input.id, ctx.user.id);
      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });
      return app;
    }),
    create: protectedProcedure.input(z.object({
      eventName: z.string().min(1, "Event name is required"),
      eventType: z.enum(["Hackathon", "Workshop", "Conference", "Other"]),
      status: z.enum(["Interested", "Applied", "Under Review", "Accepted", "Rejected", "Withdrawn"]),
      deadline: z.date().optional(),
      notes: z.string().optional(),
      url: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return createApplication({ ...input, userId: ctx.user.id });
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      eventName: z.string().optional(),
      eventType: z.enum(["Hackathon", "Workshop", "Conference", "Other"]).optional(),
      status: z.enum(["Interested", "Applied", "Under Review", "Accepted", "Rejected", "Withdrawn"]).optional(),
      deadline: z.date().optional(),
      notes: z.string().optional(),
      url: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const app = await getApplicationById(input.id, ctx.user.id);
      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });
      
      const oldStatus = app.status;
      const updatedApp = await updateApplication(input.id, ctx.user.id, input);
      
      if (input.status && input.status !== oldStatus) {
        await handleApplicationStatusChange(ctx.user, input.id, input.eventName || app.eventName, app.eventType, oldStatus, input.status);
      }
      
      return updatedApp;
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const app = await getApplicationById(input.id, ctx.user.id);
      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });
      return deleteApplication(input.id, ctx.user.id);
    }),
    fetchMetadata: protectedProcedure.input(z.object({
      url: z.string().min(1, "URL is required"),
    })).mutation(async ({ input }) => {
      const result = await fetchEventMetadata(input.url);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
        };
      }
      
      return {
        success: true,
        data: result.data,
      };
    }),
  }),

  preferences: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const preferences = await getUserPreferences(ctx.user.id);
      if (preferences) return preferences;
      
      // Return default preferences if none exist
      return {
        id: 0,
        userId: ctx.user.id,
        defaultView: "dashboard" as const,
        notificationsEnabled: 1,
        emailNotificationsEnabled: 1,
        emailDeadlineReminders: 1,
        emailStatusUpdates: 0,
        weeklyDigestEnabled: 0,
        digestDay: "Monday",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),
    update: protectedProcedure.input(z.object({
      defaultView: z.enum(["dashboard", "kanban", "list", "calendar", "analytics"]).optional(),
      notificationsEnabled: z.boolean().optional(),
      emailNotificationsEnabled: z.boolean().optional(),
      emailDeadlineReminders: z.boolean().optional(),
      emailStatusUpdates: z.boolean().optional(),
      weeklyDigestEnabled: z.boolean().optional(),
      digestDay: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const preferences = await getUserPreferences(ctx.user.id);
      
      if (preferences) {
        return updateUserPreferences(ctx.user.id, {
          defaultView: input.defaultView,
          notificationsEnabled: input.notificationsEnabled !== undefined ? (input.notificationsEnabled ? 1 : 0) : undefined,
          emailNotificationsEnabled: input.emailNotificationsEnabled !== undefined ? (input.emailNotificationsEnabled ? 1 : 0) : undefined,
          emailDeadlineReminders: input.emailDeadlineReminders !== undefined ? (input.emailDeadlineReminders ? 1 : 0) : undefined,
          emailStatusUpdates: input.emailStatusUpdates !== undefined ? (input.emailStatusUpdates ? 1 : 0) : undefined,
          weeklyDigestEnabled: input.weeklyDigestEnabled !== undefined ? (input.weeklyDigestEnabled ? 1 : 0) : undefined,
          digestDay: input.digestDay,
        });
      } else {
        return createUserPreferences({
          userId: ctx.user.id,
          defaultView: input.defaultView || "dashboard",
          notificationsEnabled: input.notificationsEnabled !== undefined ? (input.notificationsEnabled ? 1 : 0) : 1,
          emailNotificationsEnabled: input.emailNotificationsEnabled !== undefined ? (input.emailNotificationsEnabled ? 1 : 0) : 1,
          emailDeadlineReminders: input.emailDeadlineReminders !== undefined ? (input.emailDeadlineReminders ? 1 : 0) : 1,
          emailStatusUpdates: input.emailStatusUpdates !== undefined ? (input.emailStatusUpdates ? 1 : 0) : 1,
          weeklyDigestEnabled: input.weeklyDigestEnabled !== undefined ? (input.weeklyDigestEnabled ? 1 : 0) : 1,
          digestDay: input.digestDay || "Monday",
        });
      }
    }),
  }),

  recommendations: router({
    generate: protectedProcedure.query(async ({ ctx }) => {
      const applications = await getApplicationsByUserId(ctx.user.id);
      
      if (applications.length === 0) {
        return {
          recommendations: [],
          message: "Start adding applications to get personalized recommendations",
        };
      }

      // Return smart default recommendations based on user's applications
      const recommendations = calculateDefaultRecommendations(applications);
      return {
        recommendations,
        message: "Recommendations based on your application history"
      };
    }),
    metrics: protectedProcedure.query(async ({ ctx }) => {
      const applications = await getApplicationsByUserId(ctx.user.id);
      const metrics = calculateSuccessMetrics(
        applications.map(app => ({
          eventName: app.eventName,
          eventType: app.eventType as "Hackathon" | "Workshop" | "Conference" | "Other",
          status: app.status,
          deadline: app.deadline || new Date(),
          notes: app.notes ? app.notes : undefined,
        }))
      );
      return metrics;
    }),
  }),

  profile: router({
    getByUsername: publicProcedure.input(z.object({ username: z.string() })).query(async ({ input }) => {
      const profile = await getProfileByUsername(input.username);
      if (!profile || profile.profileVisibility === "private") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
      }
      return profile;
    }),
    getStats: publicProcedure.input(z.object({ username: z.string() })).query(async ({ input }) => {
      const profile = await getProfileByUsername(input.username);
      if (!profile || profile.profileVisibility === "private") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
      }
      return getProfileStats(profile.userId);
    }),
    getApplications: publicProcedure.input(z.object({ username: z.string() })).query(async ({ input }) => {
      const profile = await getProfileByUsername(input.username);
      if (!profile || profile.profileVisibility === "private") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
      }
      return getProfileApplications(profile.userId, profile.showAcceptedOnly === 1);
    }),
    update: protectedProcedure.input(z.object({
      username: z.string().optional(),
      bio: z.string().optional(),
      profileVisibility: z.enum(["public", "private"]).optional(),
      showAcceptedOnly: z.boolean().optional(),
      avatarUrl: z.string().optional(),
      websiteUrl: z.string().optional(),
      linkedinUrl: z.string().optional(),
      twitterHandle: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      await createOrUpdateProfile(ctx.user.id, {
        ...input,
        showAcceptedOnly: input.showAcceptedOnly ? 1 : 0,
      });
      return { success: true };
    }),
  }),

  applicationProfile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getUserApplicationProfile(ctx.user.id);
    }),
    upsert: protectedProcedure.input(z.object({
      fullName: z.string().optional(),
      college: z.string().optional(),
      degree: z.string().optional(),
      graduationYear: z.number().optional(),
      githubUrl: z.string().optional(),
      portfolioUrl: z.string().optional(),
      resumeUrl: z.string().optional(),
      skills: z.string().optional(),
      shortBio: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const profile = await createOrUpdateUserApplicationProfile(ctx.user.id, {
        userId: ctx.user.id,
        ...input,
      });
      return profile;
    }),
  }),

  analytics: router({
    acceptanceRates: protectedProcedure.query(async ({ ctx }) => {
      const applications = await getApplicationsByUserId(ctx.user.id);
      
      const byType = {
        Hackathon: { total: 0, accepted: 0, rate: 0 },
        Workshop: { total: 0, accepted: 0, rate: 0 },
        Conference: { total: 0, accepted: 0, rate: 0 },
        Other: { total: 0, accepted: 0, rate: 0 },
      };

      applications.forEach(app => {
        const type = app.eventType as keyof typeof byType;
        if (byType[type]) {
          byType[type].total += 1;
          if (app.status === "Accepted") byType[type].accepted += 1;
        }
      });

      Object.keys(byType).forEach(type => {
        const data = byType[type as keyof typeof byType];
        data.rate = data.total > 0 ? Math.round((data.accepted / data.total) * 100) : 0;
      });

      return byType;
    }),

    seasonalTrends: protectedProcedure.query(async ({ ctx }) => {
      const applications = await getApplicationsByUserId(ctx.user.id);
      
      const monthlyData: Record<string, { month: string; applications: number; accepted: number }> = {};
      
      applications.forEach(app => {
        const date = new Date(app.createdAt);
        const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { month: monthKey, applications: 0, accepted: 0 };
        }
        
        monthlyData[monthKey].applications += 1;
        if (app.status === "Accepted") monthlyData[monthKey].accepted += 1;
      });

      return Object.values(monthlyData).sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
    }),

    statusDistribution: protectedProcedure.query(async ({ ctx }) => {
      const applications = await getApplicationsByUserId(ctx.user.id);
      
      const distribution: Record<string, number> = {
        Interested: 0,
        Applied: 0,
        "Under Review": 0,
        Accepted: 0,
        Rejected: 0,
        Withdrawn: 0,
      };

      applications.forEach(app => {
        const status = app.status as keyof typeof distribution;
        if (distribution.hasOwnProperty(status)) {
          distribution[status] += 1;
        }
      });

      return Object.entries(distribution).map(([status, count]) => ({
        status,
        count,
      }));
    }),

    summary: protectedProcedure.query(async ({ ctx }) => {
      const applications = await getApplicationsByUserId(ctx.user.id);
      
      const totalApplications = applications.length;
      const accepted = applications.filter(a => a.status === "Accepted").length;
      const rejected = applications.filter(a => a.status === "Rejected").length;
      const underReview = applications.filter(a => a.status === "Under Review").length;
      const overallAcceptanceRate = totalApplications > 0 ? Math.round((accepted / totalApplications) * 100) : 0;

      return {
        totalApplications,
        accepted,
        rejected,
        underReview,
        overallAcceptanceRate,
      };
    }),
  }),

  // =====================================================
  // ADVANCED FEATURES
  // =====================================================

  // Feature 1: AI Personalized Recommendations
  recommendations: router({
    getPersonalized: protectedProcedure.query(async ({ ctx }) => {
      // Import RecommendationService at the top of file
      const { RecommendationService } = await import('./_core/recommendationService');
      return RecommendationService.generateForUser(ctx.user.id);
    }),

    updateUserProfile: protectedProcedure
      .input(
        z.object({
          skillsJson: z.array(z.object({
            name: z.string(),
            level: z.enum(["beginner", "intermediate", "advanced", "expert"]),
            yearsOfExperience: z.number().optional(),
          })).optional(),
          interests: z.array(z.string()).optional(),
          experienceLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
          preferredEventTypes: z.array(z.string()).optional(),
          location: z.string().optional(),
          timezone: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { RecommendationService } = await import('./_core/recommendationService');
        await RecommendationService.updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // Feature 2: Team Formation System
  teams: router({
    create: protectedProcedure
      .input(
        z.object({
          applicationId: z.number(),
          name: z.string().min(1, "Team name required"),
          description: z.string().optional(),
          maxMembers: z.number().min(2).max(20).default(5),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { TeamService } = await import('./_core/teamService');
        const team = await TeamService.createTeam(
          input.applicationId,
          ctx.user.id,
          input.name,
          input.description,
          input.maxMembers
        );
        return team;
      }),

    getByEvent: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ input }) => {
        const { TeamService } = await import('./_core/teamService');
        return TeamService.getEventTeams(input.applicationId);
      }),

    getById: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        const { TeamService } = await import('./_core/teamService');
        const team = await TeamService.getTeamWithMembers(input.teamId);
        if (!team) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
        }
        return team;
      }),

    getUserTeams: protectedProcedure.query(async ({ ctx }) => {
      const { TeamService } = await import('./_core/teamService');
      return TeamService.getUserTeams(ctx.user.id);
    }),

    join: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { TeamService } = await import('./_core/teamService');
        await TeamService.addTeamMember(input.teamId, ctx.user.id, 'member');
        return { success: true };
      }),

    leave: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { TeamService } = await import('./_core/teamService');
        await TeamService.removeTeamMember(input.teamId, ctx.user.id);
        return { success: true };
      }),
  }),

  // Feature 3: Smart Calendar with Conflict Detection
  calendar: router({
    detectConflicts: protectedProcedure
      .input(
        z.object({
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(async ({ ctx, input }) => {
        const { ConflictDetectionService } = await import('./_core/conflictDetectionService');
        return ConflictDetectionService.detectConflicts(
          ctx.user.id,
          input.startDate,
          input.endDate
        );
      }),

    getConflictRecommendation: protectedProcedure
      .input(
        z.object({
          app1Id: z.number(),
          app2Id: z.number(),
        })
      )
      .query(async ({ ctx, input }) => {
        const { ConflictDetectionService } = await import('./_core/conflictDetectionService');
        const recommendedId = await ConflictDetectionService.getSmartRecommendation(
          ctx.user.id,
          input.app1Id,
          input.app2Id
        );
        return { recommendedApplicationId: recommendedId };
      }),

    getUserConflicts: protectedProcedure.query(async ({ ctx }) => {
      const { ConflictDetectionService } = await import('./_core/conflictDetectionService');
      return ConflictDetectionService.getUserConflicts(ctx.user.id);
    }),

    resolveConflict: protectedProcedure
      .input(z.object({ conflictId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { ConflictDetectionService } = await import('./_core/conflictDetectionService');
        await ConflictDetectionService.resolveConflict(input.conflictId);
        return { success: true };
      }),
  }),

  // Feature 4: Predictive Success Scoring
  successScoring: router({
    getProbability: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const app = await getApplicationById(input.applicationId, ctx.user.id);
        if (!app) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });
        }

        const { SuccessScoringService } = await import('./_core/successScoringService');
        const { probability, factors } = await SuccessScoringService.calculateSuccessProbability(
          ctx.user.id,
          input.applicationId,
          app.eventType
        );

        // Store for historical tracking
        await SuccessScoringService.storeSuccessScore(
          ctx.user.id,
          input.applicationId,
          probability,
          factors
        );

        return { probability, factors };
      }),

    getProbabilitiesForAll: protectedProcedure.query(async ({ ctx }) => {
      const apps = await getApplicationsByUserId(ctx.user.id);
      const { SuccessScoringService } = await import('./_core/successScoringService');

      const probabilities = await Promise.all(
        apps.map(async (app) => {
          const { probability, factors } = await SuccessScoringService.calculateSuccessProbability(
            ctx.user.id,
            app.id,
            app.eventType
          );

          return {
            applicationId: app.id,
            eventName: app.eventName,
            probability,
            factors,
          };
        })
      );

      return probabilities.sort((a, b) => b.probability - a.probability);
    }),
  }),

  // Feature 5: Public Profile / Portfolio Mode
  publicProfile: router({
    getByUsername: publicProcedure
      .input(z.object({ username: z.string() }))
      .query(async ({ input }) => {
        const profileQuery = `
          SELECT up.*, u.name, u.email FROM user_profiles up
          JOIN users u ON up.user_id = u.id
          WHERE up.username = $1 AND up.profile_visibility = 'public';
        `;

        const pool = await getPool();
        const result = await pool.query(profileQuery, [input.username]);

        if (result.rows.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Public profile not found",
          });
        }

        const profile = result.rows[0];
        const userId = profile.user_id;

        // Get stats
        const stats = await getProfileStats(userId);

        // Get accepted applications if show_accepted_only
        let acceptedApps: Application[] = [];
        if (profile.show_accepted_only) {
          acceptedApps = await getProfileApplications(userId, true);
        }

        return {
          username: profile.username,
          bio: profile.bio,
          avatarUrl: profile.avatar_url,
          websiteUrl: profile.website_url,
          linkedinUrl: profile.linkedin_url,
          twitterHandle: profile.twitter_handle,
          stats,
          acceptedApplications: acceptedApps,
        };
      }),

    updateVisibility: protectedProcedure
      .input(
        z.object({
          visibility: z.enum(['public', 'private']),
          showAcceptedOnly: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const pool = await getPool();
        const query = `
          UPDATE user_profiles
          SET profile_visibility = $1,
              show_accepted_only = COALESCE($2, show_accepted_only),
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $3
          RETURNING *;
        `;

        const result = await pool.query(query, [
          input.visibility,
          input.showAcceptedOnly ? 1 : 0,
          ctx.user.id,
        ]);

        return result.rows[0];
      }),
  }),
});

export type AppRouter = typeof appRouter;
