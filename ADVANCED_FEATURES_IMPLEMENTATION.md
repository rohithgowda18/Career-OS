# Advanced Features Implementation Guide
## Event App Tracker - Production-Ready Implementation

---

## TABLE OF CONTENTS
1. [Database Schema Changes](#database-schema-changes)
2. [Feature 1: AI Personalized Recommendations](#feature-1-ai-personalized-recommendations)
3. [Feature 2: Team Formation System](#feature-2-team-formation-system)
4. [Feature 3: Smart Calendar with Conflict Detection](#feature-3-smart-calendar-with-conflict-detection)
5. [Feature 4: Predictive Success Scoring](#feature-4-predictive-success-scoring)
6. [Feature 5: Public Profile / Portfolio Mode](#feature-5-public-profile--portfolio-mode)
7. [Implementation Roadmap](#implementation-roadmap)

---

## DATABASE SCHEMA CHANGES

### 1. Add New Enums

```sql
-- Add new enum types
DO $$ BEGIN
    CREATE TYPE team_role AS ENUM ('lead', 'member', 'mentor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
```

### 2. Create New Tables

```sql
-- User Profiles Enhancement (Skills & Interests)
ALTER TABLE user_application_profiles 
ADD COLUMN IF NOT EXISTS skills_json JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS interests JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS experience_level skill_level DEFAULT 'intermediate',
ADD COLUMN IF NOT EXISTS preferred_event_types JSONB DEFAULT '["Hackathon", "Workshop"]',
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50);

-- Teams Table
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    max_members INTEGER DEFAULT 5,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role team_role DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(team_id, user_id)
);

-- Event Success Predictions
CREATE TABLE IF NOT EXISTS event_success_scores (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    success_probability DECIMAL(5, 2) NOT NULL,
    score_factors JSONB NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(application_id, user_id)
);

-- Calendar Conflicts
CREATE TABLE IF NOT EXISTS calendar_conflicts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id_1 INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    application_id_2 INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    conflict_date_start TIMESTAMPTZ NOT NULL,
    conflict_date_end TIMESTAMPTZ NOT NULL,
    recommended_application_id INTEGER REFERENCES applications(id),
    resolved INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_teams_application_id ON teams(application_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_event_success_scores_user_id ON event_success_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_conflicts_user_id ON calendar_conflicts(user_id);
```

---

## FEATURE 1: AI PERSONALIZED RECOMMENDATIONS

### Type Definitions

```typescript
// shared/db-types.ts (Add these)

export interface UserSkill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
}

export interface UserProfile {
  // ... existing fields
  skillsJson?: UserSkill[];
  interests?: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  preferredEventTypes?: string[];
  location?: string;
  timezone?: string;
}

export interface Recommendation {
  id: string;
  applicationId: number;
  eventName: string;
  eventType: EventType;
  score: number;
  matchReasons: string[];
  userFitPercentage: number;
  skillGaps?: string[];
}

export interface RecommendationInput {
  eventName: string;
  eventType: EventType;
  description?: string;
  requiredSkills?: UserSkill[];
  targetAudience?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}
```

### Backend Service

```typescript
// server/_core/recommendationService.ts

import { UserSkill, Recommendation } from "@shared/db-types";

export interface RecommendationContext {
  userSkills: UserSkill[];
  interests: string[];
  experienceLevel: string;
  pastApplications: any[];
  successRate: number;
  location?: string;
}

export class RecommendationEngine {
  /**
   * Calculate recommendation score based on user profile and event match
   */
  static calculateMatchScore(
    context: RecommendationContext,
    eventData: any
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Experience level match (weight: 25%)
    const expLevelMatch = this.calculateExperienceLevelMatch(
      context.experienceLevel,
      eventData.difficulty
    );
    score += expLevelMatch * 0.25;
    if (expLevelMatch > 0.8) {
      reasons.push("Matches your experience level");
    }

    // Skill match (weight: 35%)
    const skillMatch = this.calculateSkillMatch(
      context.userSkills,
      eventData.requiredSkills || []
    );
    score += skillMatch * 0.35;
    if (skillMatch > 0.7) {
      reasons.push("You have most required skills");
    }

    // Interest match (weight: 20%)
    const interestMatch = this.calculateInterestMatch(
      context.interests,
      eventData.topics || []
    );
    score += interestMatch * 0.2;
    if (interestMatch > 0.7) {
      reasons.push("Aligns with your interests");
    }

    // Historical success (weight: 20%)
    const historyScore = context.successRate / 100;
    score += historyScore * 0.2;
    if (context.successRate > 75) {
      reasons.push("High success rate in this event type");
    }

    return { score: Math.min(score, 100), reasons };
  }

  private static calculateExperienceLevelMatch(
    userLevel: string,
    eventDifficulty: string
  ): number {
    const levels = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
      expert: 4,
    };

    const userScore = levels[userLevel as keyof typeof levels] || 2;
    const eventScore = levels[eventDifficulty as keyof typeof levels] || 2;

    // Perfect match = 1.0, slight mismatch = 0.7
    const diff = Math.abs(userScore - eventScore);
    return Math.max(0.7, 1 - diff * 0.15);
  }

  private static calculateSkillMatch(
    userSkills: UserSkill[],
    requiredSkills: UserSkill[]
  ): number {
    if (requiredSkills.length === 0) return 0.8; // Default good match

    let matchedCount = 0;
    for (const required of requiredSkills) {
      const userSkill = userSkills.find(
        (s) => s.name.toLowerCase() === required.name.toLowerCase()
      );

      if (userSkill) {
        const levelScore = this.getSkillLevelScore(
          userSkill.level,
          required.level
        );
        matchedCount += levelScore;
      }
    }

    return matchedCount / requiredSkills.length;
  }

  private static calculateInterestMatch(
    userInterests: string[],
    eventTopics: string[]
  ): number {
    if (eventTopics.length === 0) return 0.6;

    const matchCount = userInterests.filter((interest) =>
      eventTopics.some((topic) =>
        topic.toLowerCase().includes(interest.toLowerCase())
      )
    ).length;

    return Math.min(matchCount / eventTopics.length, 1.0);
  }

  private static getSkillLevelScore(userLevel: string, required: string): number {
    const levels = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    const userScore = levels[userLevel as keyof typeof levels] || 1;
    const requiredScore = levels[required as keyof typeof levels] || 1;

    return userScore >= requiredScore ? 1.0 : 0.7;
  }

  /**
   * Generate personalized recommendations for user
   */
  static async generateRecommendations(
    context: RecommendationContext,
    availableEvents: any[]
  ): Promise<Recommendation[]> {
    const recommendations = availableEvents.map((event) => {
      const { score, reasons } = this.calculateMatchScore(context, event);

      return {
        id: `rec_${event.id}`,
        applicationId: event.id,
        eventName: event.eventName,
        eventType: event.eventType,
        score,
        matchReasons: reasons,
        userFitPercentage: Math.round(score),
        skillGaps: this.identifySkillGaps(context.userSkills, event.requiredSkills),
      };
    });

    // Sort by score descending
    return recommendations.sort((a, b) => b.score - a.score);
  }

  private static identifySkillGaps(
    userSkills: UserSkill[],
    requiredSkills: UserSkill[]
  ): string[] {
    return (requiredSkills || [])
      .filter(
        (req) =>
          !userSkills.some(
            (user) => user.name.toLowerCase() === req.name.toLowerCase()
          )
      )
      .map((s) => s.name);
  }
}
```

### tRPC Procedures

```typescript
// server/routers.ts (Add to appRouter)

recommendations: router({
  /**
   * Get personalized recommendations for the current user
   */
  getPersonalized: protectedProcedure.query(async ({ ctx }) => {
    const userProfile = await getUserProfile(ctx.user.id);
    if (!userProfile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User profile not found",
      });
    }

    const userApps = await getApplicationsByUserId(ctx.user.id);
    const stats = await getProfileStats(ctx.user.id);

    // Build recommendation context
    const context: RecommendationContext = {
      userSkills: userProfile.skillsJson || [],
      interests: userProfile.interests || [],
      experienceLevel: userProfile.experienceLevel || "intermediate",
      pastApplications: userApps,
      successRate: stats?.acceptanceRate || 0,
      location: userProfile.location,
    };

    // In production, fetch from your event database
    const availableEvents = [
      // Sample events - replace with real data
      {
        id: 1,
        eventName: "TechCrunch Disrupt 2024",
        eventType: "Conference",
        difficulty: "intermediate",
        requiredSkills: [
          { name: "React", level: "intermediate" },
          { name: "TypeScript", level: "intermediate" },
        ],
        topics: ["Web Development", "Startups"],
      },
    ];

    const recommendations = await RecommendationEngine.generateRecommendations(
      context,
      availableEvents
    );

    return recommendations.slice(0, 5); // Top 5 recommendations
  }),

  /**
   * Update user profile with skills and interests
   */
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
      // Update user_application_profiles table
      const query = `
        UPDATE user_application_profiles 
        SET skills_json = COALESCE($1, skills_json),
            interests = COALESCE($2, interests),
            experience_level = COALESCE($3, experience_level),
            preferred_event_types = COALESCE($4, preferred_event_types),
            location = COALESCE($5, location),
            timezone = COALESCE($6, timezone),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $7
        RETURNING *;
      `;

      const pool = await getPool();
      const result = await pool.query(query, [
        input.skillsJson ? JSON.stringify(input.skillsJson) : null,
        input.interests ? JSON.stringify(input.interests) : null,
        input.experienceLevel,
        input.preferredEventTypes ? JSON.stringify(input.preferredEventTypes) : null,
        input.location,
        input.timezone,
        ctx.user.id,
      ]);

      return result.rows[0];
    }),
}),
```

### Frontend Component

```typescript
// client/src/components/PersonalizedRecommendations.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, Zap } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { motion } from 'framer-motion';

export function PersonalizedRecommendations() {
  const { data: recommendations, isLoading } = trpc.recommendations.getPersonalized.useQuery();

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-slate-200 rounded-lg" />;
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Lightbulb className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Complete your profile with skills and interests to get personalized recommendations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="w-5 h-5 text-accent" />
        <h2 className="text-2xl font-bold">Recommended for You</h2>
      </div>

      <div className="grid gap-4">
        {recommendations.map((rec, index) => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{rec.eventName}</CardTitle>
                    <Badge className="mt-2">{rec.eventType}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-accent">
                      {rec.userFitPercentage}%
                    </div>
                    <p className="text-xs text-muted-foreground">Match</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Match Reasons */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Why recommended:</h4>
                  <ul className="space-y-1">
                    {rec.matchReasons.map((reason, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        • {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Skill Gaps */}
                {rec.skillGaps && rec.skillGaps.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">Skills to learn:</h4>
                    <div className="flex flex-wrap gap-2">
                      {rec.skillGaps.map((skill, i) => (
                        <Badge key={i} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button className="w-full">Apply to Event</Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
```

---

## FEATURE 2: TEAM FORMATION SYSTEM

### Type Definitions

```typescript
// shared/db-types.ts

export type TeamRole = 'lead' | 'member' | 'mentor';

export interface Team {
  id: number;
  name: string;
  description?: string;
  applicationId: number;
  createdBy: number;
  maxMembers: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: number;
  teamId: number;
  userId: number;
  role: TeamRole;
  joinedAt: Date;
  user?: User; // Populated for display
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
  memberCount: number;
  isFull: boolean;
}
```

### Backend Service

```typescript
// server/_core/teamService.ts

import { getPool } from '../db';

export class TeamService {
  /**
   * Create a new team for an event
   */
  static async createTeam(
    applicationId: number,
    createdBy: number,
    name: string,
    description?: string,
    maxMembers: number = 5
  ): Promise<Team> {
    const pool = await getPool();
    const query = `
      INSERT INTO teams (name, description, application_id, created_by, max_members)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const result = await pool.query(query, [
      name,
      description,
      applicationId,
      createdBy,
      maxMembers,
    ]);

    const team = result.rows[0];

    // Add creator as team lead
    await this.addTeamMember(team.id, createdBy, 'lead');

    return team;
  }

  /**
   * Add member to team
   */
  static async addTeamMember(
    teamId: number,
    userId: number,
    role: TeamRole = 'member'
  ): Promise<void> {
    const pool = await getPool();

    // Check if team is full
    const teamQuery = `
      SELECT tm.id FROM team_members tm 
      WHERE tm.team_id = $1;
    `;
    const teamResult = await pool.query(teamQuery, [teamId]);
    const team = await pool.query(
      `SELECT max_members FROM teams WHERE id = $1`,
      [teamId]
    );

    if (teamResult.rows.length >= team.rows[0].max_members) {
      throw new Error('Team is full');
    }

    const memberQuery = `
      INSERT INTO team_members (team_id, user_id, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (team_id, user_id) DO NOTHING;
    `;

    await pool.query(memberQuery, [teamId, userId, role]);
  }

  /**
   * Get team with members
   */
  static async getTeamWithMembers(teamId: number): Promise<TeamWithMembers | null> {
    const pool = await getPool();

    const teamQuery = `
      SELECT * FROM teams WHERE id = $1;
    `;

    const membersQuery = `
      SELECT tm.*, u.name, u.email FROM team_members tm
      LEFT JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1
      ORDER BY tm.role DESC, tm.joined_at ASC;
    `;

    const [teamResult, membersResult] = await Promise.all([
      pool.query(teamQuery, [teamId]),
      pool.query(membersQuery, [teamId]),
    ]);

    if (teamResult.rows.length === 0) return null;

    const team = teamResult.rows[0];
    const members = membersResult.rows;

    return {
      ...team,
      memberCount: members.length,
      isFull: members.length >= team.max_members,
      members,
    };
  }

  /**
   * Get all teams for an event
   */
  static async getEventTeams(applicationId: number): Promise<TeamWithMembers[]> {
    const pool = await getPool();

    const query = `
      SELECT t.*, COUNT(tm.id) as member_count, t.max_members
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      WHERE t.application_id = $1
      GROUP BY t.id
      ORDER BY t.created_at DESC;
    `;

    const result = await pool.query(query, [applicationId]);

    // Fetch members for each team
    const teamsWithMembers = await Promise.all(
      result.rows.map(async (team) => {
        const teamWithMembers = await this.getTeamWithMembers(team.id);
        return teamWithMembers!;
      })
    );

    return teamsWithMembers;
  }

  /**
   * Remove member from team
   */
  static async removeTeamMember(teamId: number, userId: number): Promise<void> {
    const pool = await getPool();

    const query = `
      DELETE FROM team_members 
      WHERE team_id = $1 AND user_id = $2;
    `;

    await pool.query(query, [teamId, userId]);
  }
}
```

### tRPC Procedures

```typescript
// server/routers.ts (Add to appRouter)

teams: router({
  /**
   * Create a new team
   */
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
      const team = await TeamService.createTeam(
        input.applicationId,
        ctx.user.id,
        input.name,
        input.description,
        input.maxMembers
      );
      return team;
    }),

  /**
   * Get all teams for an event
   */
  getByEvent: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(async ({ input }) => {
      return await TeamService.getEventTeams(input.applicationId);
    }),

  /**
   * Get specific team with members
   */
  getById: protectedProcedure
    .input(z.object({ teamId: z.number() }))
    .query(async ({ input }) => {
      const team = await TeamService.getTeamWithMembers(input.teamId);
      if (!team) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
      }
      return team;
    }),

  /**
   * Join a team
   */
  join: protectedProcedure
    .input(z.object({ teamId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await TeamService.addTeamMember(input.teamId, ctx.user.id, 'member');
      return { success: true };
    }),

  /**
   * Leave a team
   */
  leave: protectedProcedure
    .input(z.object({ teamId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await TeamService.removeTeamMember(input.teamId, ctx.user.id);
      return { success: true };
    }),
}),
```

### Frontend Component

```typescript
// client/src/components/TeamFormation.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, UserPlus, UserMinus } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TeamFormationProps {
  applicationId: number;
}

export function TeamFormation({ applicationId }: TeamFormationProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [teamName, setTeamName] = useState('');

  const { data: teams, refetch } = trpc.teams.getByEvent.useQuery({ applicationId });
  const createMutation = trpc.teams.create.useMutation();
  const joinMutation = trpc.teams.join.useMutation();

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    try {
      await createMutation.mutateAsync({
        applicationId,
        name: teamName,
      });
      toast.success('Team created successfully!');
      setTeamName('');
      setIsCreateOpen(false);
      refetch();
    } catch (error) {
      toast.error('Failed to create team');
    }
  };

  const handleJoinTeam = async (teamId: number) => {
    try {
      await joinMutation.mutateAsync({ teamId });
      toast.success('Joined team!');
      refetch();
    } catch (error) {
      toast.error('Failed to join team');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          <h3 className="text-xl font-bold">Teams</h3>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Create Team
        </Button>
      </div>

      <div className="grid gap-4">
        {teams?.map((team) => (
          <Card key={team.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{team.name}</span>
                <Badge variant="outline">
                  {team.memberCount}/{team.maxMembers}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {team.description && (
                <p className="text-sm text-muted-foreground">{team.description}</p>
              )}

              {/* Members List */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Members:</h4>
                <div className="space-y-2">
                  {team.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded"
                    >
                      <div>
                        <p className="font-sm font-medium">{member.user?.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                      <Badge variant="secondary">{member.role}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {!team.isFull && (
                <Button
                  onClick={() => handleJoinTeam(team.id)}
                  variant="outline"
                  className="w-full"
                  disabled={joinMutation.isPending}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Join Team
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Team Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <Input
              placeholder="Team name (e.g., 'FullStack Warriors')"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
            <Button type="submit" className="w-full">
              Create Team
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## FEATURE 3: SMART CALENDAR WITH CONFLICT DETECTION

### Backend Service

```typescript
// server/_core/conflictDetectionService.ts

import { getPool } from '../db';

export interface DateConflict {
  applicationId1: number;
  applicationId2: number;
  eventName1: string;
  eventName2: string;
  overlapStart: Date;
  overlapEnd: Date;
  recommendedEvent?: string;
}

export class ConflictDetectionService {
  /**
   * Detect overlapping events for a user
   */
  static async detectConflicts(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<DateConflict[]> {
    const pool = await getPool();

    const query = `
      SELECT 
        a1.id as id1,
        a2.id as id2,
        a1.event_name as event_name1,
        a2.event_name as event_name2,
        a1.deadline as deadline1,
        a2.deadline as deadline2,
        CASE 
          WHEN extract(epoch from (a1.deadline - $2::TIMESTAMPTZ)) > extract(epoch from (a2.deadline - $2::TIMESTAMPTZ))
          THEN a2.id
          ELSE a1.id
        END as recommended_id
      FROM applications a1
      JOIN applications a2 ON a1.user_id = a2.user_id
      WHERE a1.user_id = $1
        AND a2.user_id = $1
        AND a1.id < a2.id
        AND a1.deadline IS NOT NULL
        AND a2.deadline IS NOT NULL
        AND a1.status != 'Withdrawn'
        AND a2.status != 'Withdrawn'
        AND DATE(a1.deadline) = DATE(a2.deadline)
      ORDER BY a1.deadline;
    `;

    const result = await pool.query(query, [userId, startDate]);
    return result.rows;
  }

  /**
   * Store conflict information for later reference
   */
  static async storeConflict(
    userId: number,
    app1Id: number,
    app2Id: number,
    recommendedId: number
  ): Promise<void> {
    const pool = await getPool();

    const appsQuery = `
      SELECT deadline FROM applications WHERE id = $1 OR id = $2;
    `;

    const appsResult = await pool.query(appsQuery, [app1Id, app2Id]);
    const dates = appsResult.rows.map((r) => r.deadline);

    const query = `
      INSERT INTO calendar_conflicts (user_id, application_id_1, application_id_2, conflict_date_start, conflict_date_end, recommended_application_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING;
    `;

    await pool.query(query, [
      userId,
      app1Id,
      app2Id,
      Math.min(...dates),
      Math.max(...dates),
      recommendedId,
    ]);
  }

  /**
   * Get smart recommendation for which event to prioritize
   */
  static async getSmartRecommendation(
    userId: number,
    app1Id: number,
    app2Id: number
  ): Promise<number> {
    const pool = await getPool();

    const statsQuery = `
      SELECT 
        a.id,
        a.event_type,
        COUNT(CASE WHEN a.status = 'Accepted' THEN 1 END) as accepted_count,
        COUNT(*) as total_count,
        a.deadline
      FROM applications a
      WHERE a.user_id = $1 AND (a.id = $2 OR a.id = $3)
      GROUP BY a.id, a.event_type, a.deadline;
    `;

    const result = await pool.query(statsQuery, [userId, app1Id, app2Id]);
    const apps = result.rows;

    // Score based on success rate and deadline urgency
    const scores = apps.map((app) => {
      const successRate = app.total_count > 0 ? app.accepted_count / app.total_count : 0.5;
      const daysUntilDeadline = (new Date(app.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      
      // Closer deadlines get higher priority + success rate
      const urgency = Math.max(0, Math.min(1, 1 - daysUntilDeadline / 30));
      const finalScore = successRate * 0.6 + urgency * 0.4;

      return { id: app.id, score: finalScore };
    });

    return scores.sort((a, b) => b.score - a.score)[0].id;
  }
}
```

### tRPC Procedures

```typescript
// server/routers.ts (Add to appRouter)

calendar: router({
  /**
   * Detect conflicts in user's calendar
   */
  detectConflicts: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conflicts = await ConflictDetectionService.detectConflicts(
        ctx.user.id,
        input.startDate,
        input.endDate
      );

      return conflicts.map((conflict) => ({
        ...conflict,
        recommendations: conflict.recommended_id || null,
      }));
    }),

  /**
   * Get smart recommendation for conflicting events
   */
  getConflictRecommendation: protectedProcedure
    .input(
      z.object({
        app1Id: z.number(),
        app2Id: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const recommendedId = await ConflictDetectionService.getSmartRecommendation(
        ctx.user.id,
        input.app1Id,
        input.app2Id
      );

      return { recommendedApplicationId: recommendedId };
    }),

  /**
   * Resolve a conflict (mark as resolved)
   */
  resolveConflict: protectedProcedure
    .input(z.object({ conflictId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const pool = await getPool();
      const query = `
        UPDATE calendar_conflicts 
        SET resolved = 1 
        WHERE id = $1 AND user_id = $2;
      `;

      await pool.query(query, [input.conflictId, ctx.user.id]);
      return { success: true };
    }),
}),
```

### Frontend Component

```typescript
// client/src/components/ConflictDetectionBanner.tsx

import React from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { motion, AnimatePresence } from 'framer-motion';

interface ConflictDetectionBannerProps {
  userId: number;
}

export function ConflictDetectionBanner() {
  const { data: conflicts } = trpc.calendar.detectConflicts.useQuery({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  if (!conflicts || conflicts.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-6"
      >
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 dark:text-orange-200 mb-2">
                  {conflicts.length} Event{conflicts.length > 1 ? 's' : ''} Overlapping
                </h3>
                <p className="text-sm text-orange-800 dark:text-orange-300 mb-3">
                  You have applications with overlapping deadlines. We recommend focusing on:
                </p>
                {conflicts.map((conflict, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 p-3 rounded mb-2 last:mb-0">
                    <p className="text-sm font-medium mb-1">
                      {conflict.event_name1} vs {conflict.event_name2}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        Focus: {conflict.event_name1}
                      </Badge>
                      <p className="text-xs text-muted-foreground">Higher success rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## FEATURE 4: PREDICTIVE SUCCESS SCORING

### Backend Service

```typescript
// server/_core/successScoringService.ts

import { getPool } from '../db';

export interface SuccessFactors {
  eventTypeSuccessRate: number;
  userExperienceLevel: number;
  skillMatchpercentage: number;
  timelineScore: number;
  historicalTrend: number;
}

export class SuccessScoringService {
  /**
   * Calculate probability of success for an application
   */
  static async calculateSuccessProbability(
    userId: number,
    applicationId: number,
    eventType: string
  ): Promise<{ probability: number; factors: SuccessFactors }> {
    const pool = await getPool();

    // Get event type success rate for user
    const eventSuccessQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'Accepted' THEN 1 END) as accepted
      FROM applications
      WHERE user_id = $1 AND event_type = $2;
    `;

    const eventResult = await pool.query(eventSuccessQuery, [userId, eventType]);
    const eventStats = eventResult.rows[0];

    const eventTypeSuccessRate =
      (eventStats.total > 0 ? eventStats.accepted / eventStats.total : 0.5) * 100;

    // Get user experience level
    const userQuery = `
      SELECT experience_level FROM user_application_profiles WHERE user_id = $1;
    `;

    const userResult = await pool.query(userQuery, [userId]);
    const experienceMap = {
      beginner: 0.6,
      intermediate: 0.75,
      advanced: 0.85,
      expert: 0.95,
    };

    const userExperienceLevel =
      experienceMap[userResult.rows[0]?.experience_level || 'intermediate'] * 100;

    // Get overall application stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total_apps,
        COUNT(CASE WHEN status = 'Accepted' THEN 1 END) as total_accepted,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '6 months' THEN 1 END) as recent_apps,
        COUNT(CASE 
          WHEN created_at > NOW() - INTERVAL '6 months' AND status = 'Accepted' THEN 1 
        END) as recent_accepted
      FROM applications
      WHERE user_id = $1;
    `;

    const statsResult = await pool.query(statsQuery, [userId]);
    const stats = statsResult.rows[0];

    // Calculate trend (improving or declining)
    const overallSuccessRate = stats.total_apps > 0 ? stats.total_accepted / stats.total_apps : 0.5;
    const recentSuccessRate =
      stats.recent_apps > 0 ? stats.recent_accepted / stats.recent_apps : overallSuccessRate;

    const historicalTrend =
      recentSuccessRate > overallSuccessRate
        ? 95 // Improving trend
        : recentSuccessRate === overallSuccessRate
          ? 75 // Flat trend
          : 55; // Declining trend

    // Calculate time-to-deadline score
    const appQuery = `
      SELECT deadline FROM applications WHERE id = $1;
    `;

    const appResult = await pool.query(appQuery, [applicationId]);
    const app = appResult.rows[0];
    const daysUntilDeadline = app?.deadline
      ? (new Date(app.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      : 14;

    const timelineScore =
      daysUntilDeadline > 21 ? 90 : daysUntilDeadline > 7 ? 70 : daysUntilDeadline > 0 ? 40 : 0;

    // Calculate final probability (weighted average)
    const probability =
      eventTypeSuccessRate * 0.3 +
      userExperienceLevel * 0.25 +
      (overallSuccessRate * 100) * 0.2 +
      timelineScore * 0.15 +
      historicalTrend * 0.1;

    const factors: SuccessFactors = {
      eventTypeSuccessRate,
      userExperienceLevel,
      skillMatchpercentage: (overallSuccessRate * 100) * 0.8 + 20, // Simplified
      timelineScore,
      historicalTrend,
    };

    return {
      probability: Math.min(Math.max(probability, 0), 100),
      factors,
    };
  }

  /**
   * Store success score for later retrieval
   */
  static async storeSuccessScore(
    userId: number,
    applicationId: number,
    probability: number,
    factors: SuccessFactors
  ): Promise<void> {
    const pool = await getPool();

    const query = `
      INSERT INTO event_success_scores (application_id, user_id, success_probability, score_factors)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (application_id, user_id) DO UPDATE SET
        success_probability = EXCLUDED.success_probability,
        score_factors = EXCLUDED.score_factors,
        calculated_at = CURRENT_TIMESTAMP;
    `;

    await pool.query(query, [
      applicationId,
      userId,
      probability,
      JSON.stringify(factors),
    ]);
  }
}
```

### tRPC Procedures

```typescript
// server/routers.ts (Add to appRouter)

successScoring: router({
  /**
   * Get success probability for an application
   */
  getProbability: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const app = await getApplicationById(input.applicationId, ctx.user.id);
      if (!app) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });
      }

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

  /**
   * Get success probabilities for all user applications
   */
  getProbabilitiesForAll: protectedProcedure.query(async ({ ctx }) => {
    const apps = await getApplicationsByUserId(ctx.user.id);

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
```

### Frontend Component

```typescript
// client/src/components/SuccessProbabilityBadge.tsx

import React from 'react';
import { TrendingUp, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { trpc } from '@/lib/trpc';
import { Progress } from '@/components/ui/progress';

interface SuccessProbabilityProps {
  applicationId: number;
}

export function SuccessProbabilityBadge({ applicationId }: SuccessProbabilityProps) {
  const { data, isLoading } = trpc.successScoring.getProbability.useQuery({
    applicationId,
  });

  if (isLoading || !data) return null;

  const { probability, factors } = data;

  const getProbabilityColor = (prob: number) => {
    if (prob >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (prob >= 60) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    if (prob >= 40) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge className={`${getProbabilityColor(probability)} cursor-help`}>
          <Zap className="w-3 h-3 mr-1" />
          {Math.round(probability)}% Success
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="w-80 p-4">
        <div className="space-y-3">
          <h4 className="font-semibold">Success Probability Breakdown</h4>

          {/* Overall Probability */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Overall Probability</span>
              <span className="font-semibold">{Math.round(probability)}%</span>
            </div>
            <Progress value={probability} className="h-2" />
          </div>

          {/* Factors */}
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Event Type Success Rate</span>
                <span>{Math.round(factors.eventTypeSuccessRate)}%</span>
              </div>
              <Progress value={factors.eventTypeSuccessRate} className="h-1" />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Your Experience Level</span>
                <span>{Math.round(factors.userExperienceLevel)}%</span>
              </div>
              <Progress value={factors.userExperienceLevel} className="h-1" />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Timeline (Days to Deadline)</span>
                <span>{Math.round(factors.timelineScore)}%</span>
              </div>
              <Progress value={factors.timelineScore} className="h-1" />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Historical Trend</span>
                <span>{Math.round(factors.historicalTrend)}%</span>
              </div>
              <Progress value={factors.historicalTrend} className="h-1" />
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            Based on your past applications, skill level, and timeline.
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
```

---

## FEATURE 5: PUBLIC PROFILE / PORTFOLIO MODE

### Type Definitions

```typescript
// shared/db-types.ts

export interface PublicUserProfile {
  username: string;
  bio?: string;
  avatarUrl?: string;
  websiteUrl?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  stats: {
    totalApplications: number;
    acceptedCount: number;
    acceptanceRate: number;
    eventTypeBreakdown: Record<string, number>;
  };
  acceptedApplications: Application[];
  achievements?: string[];
}
```

### Backend Service & tRPC

```typescript
// server/routers.ts (Add to appRouter)

publicProfile: router({
  /**
   * Get public profile by username
   */
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

      // Get accepted applications
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

  /**
   * Update profile visibility
   */
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
```

### Frontend Components

```typescript
// client/src/pages/PublicProfile.tsx

import React from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Linkedin, Twitter, Globe } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { motion } from 'framer-motion';

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { data: profile, isLoading } = trpc.publicProfile.getByUsername.useQuery({
    username: username!,
  });

  if (isLoading) return <div className="animate-pulse h-96 bg-slate-200 rounded-lg" />;

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground">This user hasn't made their profile public</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Card>
          <CardContent className="pt-8">
            <div className="flex items-start gap-6 mb-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatarUrl} />
                <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{profile.username}</h1>
                {profile.bio && <p className="text-muted-foreground mb-4">{profile.bio}</p>}

                <div className="flex gap-2 flex-wrap">
                  {profile.websiteUrl && (
                    <Button variant="outline" size="sm">
                      <Globe className="w-4 h-4 mr-2" />
                      <a href={profile.websiteUrl} target="_blank">
                        Website
                      </a>
                    </Button>
                  )}
                  {profile.linkedinUrl && (
                    <Button variant="outline" size="sm">
                      <Linkedin className="w-4 h-4 mr-2" />
                      <a href={profile.linkedinUrl} target="_blank">
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {profile.twitterHandle && (
                    <Button variant="outline" size="sm">
                      <Twitter className="w-4 h-4 mr-2" />
                      <a href={`https://twitter.com/${profile.twitterHandle}`} target="_blank">
                        Twitter
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      >
        <StatCard
          label="Applications"
          value={profile.stats.totalApplications}
        />
        <StatCard
          label="Accepted"
          value={profile.stats.acceptedCount}
        />
        <StatCard
          label="Success Rate"
          value={`${profile.stats.acceptanceRate}%`}
        />
      </motion.div>

      {/* Accepted Applications */}
      {profile.acceptedApplications && profile.acceptedApplications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Accepted Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile.acceptedApplications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
                  >
                    <div>
                      <h4 className="font-semibold">{app.eventName}</h4>
                      <Badge className="mt-1">{app.eventType}</Badge>
                    </div>
                    {app.url && (
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// Helper component
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-accent">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

```typescript
// client/src/components/ProfileSettings.tsx

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Lock, Globe } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export function ProfileVisibilitySettings() {
  const [visibility, setVisibility] = React.useState<'public' | 'private'>('private');
  const [showAcceptedOnly, setShowAcceptedOnly] = React.useState(false);

  const updateMutation = trpc.publicProfile.updateVisibility.useMutation();

  const handleToggleVisibility = async () => {
    const newVisibility = visibility === 'public' ? 'private' : 'public';

    try {
      await updateMutation.mutateAsync({
        visibility: newVisibility,
        showAcceptedOnly,
      });

      setVisibility(newVisibility);
      toast.success(
        `Profile is now ${newVisibility === 'public' ? 'public and shareable!' : 'private'}`
      );
    } catch (error) {
      toast.error('Failed to update profile visibility');
    }
  };

  const profileUrl = `yourapp.com/profile/${visibility === 'public' ? 'username' : ''}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Visibility</CardTitle>
        <CardDescription>Make your achievements visible to the world</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visibility Toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <div className="flex items-center gap-3">
            {visibility === 'public' ? (
              <Globe className="w-5 h-5 text-blue-600" />
            ) : (
              <Lock className="w-5 h-5 text-slate-600" />
            )}
            <div>
              <h4 className="font-semibold">Profile Visibility</h4>
              <p className="text-sm text-muted-foreground">
                {visibility === 'public'
                  ? 'Your profile is visible to anyone with the link'
                  : 'Your profile is private'}
              </p>
            </div>
          </div>
          <Badge variant={visibility === 'public' ? 'default' : 'secondary'}>
            {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
          </Badge>
        </div>

        {/* Show Accepted Only */}
        {visibility === 'public' && (
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Show only accepted applications</h4>
              <p className="text-sm text-muted-foreground">
                Hide rejected and withdrawn applications
              </p>
            </div>
            <Switch checked={showAcceptedOnly} onCheckedChange={setShowAcceptedOnly} />
          </div>
        )}

        {/* Shareable Link */}
        {visibility === 'public' && (
          <div className="space-y-2">
            <label className="text-sm font-semibold">Shareable Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={profileUrl}
                readOnly
                className="flex-1 px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-sm"
              />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(profileUrl);
                  toast.success('Link copied!');
                }}
                variant="outline"
                size="sm"
              >
                Copy
              </Button>
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <Button
          onClick={handleToggleVisibility}
          disabled={updateMutation.isPending}
          className="w-full"
        >
          Make {visibility === 'public' ? 'Private' : 'Public'}
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## IMPLEMENTATION ROADMAP

### Phase 1: Database & Types (Week 1)
- [ ] Update database schema with enums and new tables
- [ ] Update shared type definitions
- [ ] Run migrations

### Phase 2: Backend Services (Week 2)
- [ ] Implement RecommendationEngine service
- [ ] Implement TeamService
- [ ] Implement ConflictDetectionService
- [ ] Implement SuccessScoringService
- [ ] Add all tRPC procedures and routes

### Phase 3: Frontend Components (Week 3)
- [ ] PersonalizedRecommendations component
- [ ] TeamFormation component
- [ ] ConflictDetectionBanner component
- [ ] SuccessProbabilityBadge component
- [ ] PublicProfile page
- [ ] ProfileVisibilitySettings component

### Phase 4: Integration & Testing (Week 4)
- [ ] Integrate components into existing pages
- [ ] Write E2E tests
- [ ] Performance testing
- [ ] User acceptance testing

### Phase 5: Deployment (Week 5)
- [ ] Database migrations on production
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Monitor and iterate

---

## TESTING STRATEGY

```typescript
// Example Jest test for RecommendationEngine
describe('RecommendationEngine', () => {
  it('should calculate match score correctly', () => {
    const context: RecommendationContext = {
      userSkills: [
        { name: 'React', level: 'advanced' },
        { name: 'TypeScript', level: 'intermediate' },
      ],
      interests: ['Web Development', 'AI'],
      experienceLevel: 'advanced',
      pastApplications: [],
      successRate: 80,
    };

    const eventData = {
      difficulty: 'intermediate',
      requiredSkills: [
        { name: 'React', level: 'intermediate' },
        { name: 'TypeScript', level: 'beginner' },
      ],
      topics: ['Web Development'],
    };

    const result = RecommendationEngine.calculateMatchScore(context, eventData);

    expect(result.score).toBeGreaterThan(70);
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});
```

---

## BEST PRACTICES SUMMARY

✅ **Clean Architecture**: Services separated from routes  
✅ **Type Safety**: Full TypeScript coverage  
✅ **Error Handling**: Proper tRPC error codes  
✅ **Performance**: Database indexes on frequently queried columns  
✅ **Scalability**: Modular, reusable components  
✅ **User Experience**: Toast notifications, loading states, animations  
✅ **Accessibility**: Proper semantic HTML, ARIA labels  
✅ **Security**: Protected procedures, input validation  

