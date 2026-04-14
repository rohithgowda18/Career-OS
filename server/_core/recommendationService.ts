/**
 * Recommendation Engine Service
 * Handles AI-powered personalized recommendations based on user profile and history
 */

import { getPool } from '../db';
import { UserSkill, Recommendation } from "@shared/db-types";

export interface RecommendationContext {
  userSkills: UserSkill[];
  interests: string[];
  experienceLevel: string;
  pastApplications: any[];
  successRate: number;
  location?: string;
}

export interface RecommendationResult {
  probability: number;
  reasons: string[];
}

export class RecommendationService {
  /**
   * Calculate recommendation score based on user profile and event match
   */
  static calculateMatchScore(
    context: RecommendationContext,
    eventData: any
  ): RecommendationResult {
    let score = 0;
    const reasons: string[] = [];

    // Experience level match (weight: 25%)
    const expLevelMatch = this.calculateExperienceLevelMatch(
      context.experienceLevel,
      eventData.difficulty || 'intermediate'
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
      reasons.push("High success rate in similar events");
    }

    return {
      probability: Math.min(Math.max(score, 0), 100),
      reasons,
    };
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
    if (requiredSkills.length === 0) return 0.8;

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

    return Math.min(matchedCount / requiredSkills.length, 1.0);
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
   * Identify skill gaps between user and event requirements
   */
  static identifySkillGaps(
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

  /**
   * Generate personalized recommendations for a user
   */
  static async generateForUser(userId: number): Promise<Recommendation[]> {
    const pool = await getPool();

    // Get user profile
    const profileQuery = `
      SELECT skills_json, interests, experience_level 
      FROM user_application_profiles 
      WHERE user_id = $1;
    `;

    const profileResult = await pool.query(profileQuery, [userId]);
    if (profileResult.rows.length === 0) {
      return [];
    }

    const profile = profileResult.rows[0];

    // Get user's past applications and success rate
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'Accepted' THEN 1 END) as accepted
      FROM applications
      WHERE user_id = $1;
    `;

    const statsResult = await pool.query(statsQuery, [userId]);
    const stats = statsResult.rows[0];
    const successRate = stats.total > 0 ? (stats.accepted / stats.total) * 100 : 50;

    // Build recommendation context
    const context: RecommendationContext = {
      userSkills: profile.skills_json || [],
      interests: profile.interests || [],
      experienceLevel: profile.experience_level || 'intermediate',
      pastApplications: [],
      successRate,
    };

    // In production, fetch from your event database or external API
    // This is a placeholder - replace with actual event data
    const availableEvents = [
      {
        id: 1,
        eventName: 'TechCrunch Disrupt 2024',
        eventType: 'Conference',
        difficulty: 'intermediate',
        requiredSkills: [
          { name: 'React', level: 'intermediate' },
          { name: 'TypeScript', level: 'intermediate' },
        ],
        topics: ['Web Development', 'Startups'],
      },
    ];

    const recommendations = availableEvents
      .map((event) => {
        const { probability, reasons } = this.calculateMatchScore(context, event);

        return {
          id: `rec_${event.id}`,
          applicationId: event.id,
          eventName: event.eventName,
          eventType: event.eventType,
          score: probability,
          matchReasons: reasons,
          userFitPercentage: Math.round(probability),
          skillGaps: this.identifySkillGaps(context.userSkills, event.requiredSkills),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5

    return recommendations;
  }

  /**
   * Update user profile with skills and interests
   */
  static async updateUserProfile(
    userId: number,
    data: {
      skillsJson?: UserSkill[];
      interests?: string[];
      experienceLevel?: string;
      preferredEventTypes?: string[];
      location?: string;
      timezone?: string;
    }
  ): Promise<void> {
    const pool = await getPool();

    const query = `
      UPDATE user_application_profiles 
      SET skills_json = COALESCE($1::jsonb, skills_json),
          interests = COALESCE($2::jsonb, interests),
          experience_level = COALESCE($3::skill_level, experience_level),
          preferred_event_types = COALESCE($4::jsonb, preferred_event_types),
          location = COALESCE($5, location),
          timezone = COALESCE($6, timezone),
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $7;
    `;

    await pool.query(query, [
      data.skillsJson ? JSON.stringify(data.skillsJson) : null,
      data.interests ? JSON.stringify(data.interests) : null,
      data.experienceLevel,
      data.preferredEventTypes ? JSON.stringify(data.preferredEventTypes) : null,
      data.location,
      data.timezone,
      userId,
    ]);
  }
}
