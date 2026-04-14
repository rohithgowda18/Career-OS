/**
 * Success Scoring Service
 * Calculates probability of success for each application
 */

import { getPool } from '../db';

export interface SuccessFactors {
  eventTypeSuccessRate: number;
  userExperienceLevel: number;
  skillMatchPercentage: number;
  timelineScore: number;
  historicalTrend: number;
}

export interface SuccessScore {
  applicationId: number;
  eventName: string;
  probability: number;
  factors: SuccessFactors;
}

export class SuccessScoringService {
  /**
   * Calculate probability of success for an application
   * Factors:
   * - Event type success rate (30%)
   * - User experience level (25%)
   * - Overall success rate (20%)
   * - Timeline/urgency (15%)
   * - Historical trend (10%)
   */
  static async calculateSuccessProbability(
    userId: number,
    applicationId: number,
    eventType: string
  ): Promise<{ probability: number; factors: SuccessFactors }> {
    const pool = await getPool();

    // Get event type success rate for this user
    const eventSuccessQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'Accepted' THEN 1 END) as accepted
      FROM applications
      WHERE user_id = $1 AND event_type = $2 AND status != 'Withdrawn';
    `;

    const eventResult = await pool.query(eventSuccessQuery, [userId, eventType]);
    const eventStats = eventResult.rows[0];

    const eventTypeSuccessRate =
      eventStats.total > 0 ? (eventStats.accepted / eventStats.total) * 100 : 65;

    // Get user experience level
    const userQuery = `
      SELECT experience_level FROM user_application_profiles WHERE user_id = $1;
    `;

    const userResult = await pool.query(userQuery, [userId]);
    const experienceMap: Record<string, number> = {
      beginner: 60,
      intermediate: 75,
      advanced: 85,
      expert: 95,
    };

    const userExperienceLevel =
      experienceMap[userResult.rows[0]?.experience_level || 'intermediate'] || 75;

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
      WHERE user_id = $1 AND status != 'Withdrawn';
    `;

    const statsResult = await pool.query(statsQuery, [userId]);
    const stats = statsResult.rows[0];

    const totalSuccessRate = stats.total_apps > 0 ? stats.total_accepted / stats.total_apps : 0.5;
    const recentSuccessRate = stats.recent_apps > 0 ? stats.recent_accepted / stats.recent_apps : totalSuccessRate;

    // Calculate trend (improving or declining)
    const historicalTrend =
      recentSuccessRate > totalSuccessRate
        ? 95 // Improving trend
        : recentSuccessRate === totalSuccessRate
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
      daysUntilDeadline > 21 ? 90 : daysUntilDeadline > 7 ? 70 : daysUntilDeadline > 0 ? 40 : 20;

    // Skill match percentage (simplified from user profile)
    const skillMatchPercentage = (totalSuccessRate * 100) * 0.8 + 20;

    // Calculate final probability (weighted average)
    const probability =
      eventTypeSuccessRate * 0.3 +
      userExperienceLevel * 0.25 +
      totalSuccessRate * 100 * 0.2 +
      timelineScore * 0.15 +
      historicalTrend * 0.1;

    const factors: SuccessFactors = {
      eventTypeSuccessRate: Math.round(eventTypeSuccessRate),
      userExperienceLevel: Math.round(userExperienceLevel),
      skillMatchPercentage: Math.round(skillMatchPercentage),
      timelineScore: Math.round(timelineScore),
      historicalTrend: Math.round(historicalTrend),
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

  /**
   * Get success probabilities for all user applications
   */
  static async getSuccessProbabilities(userId: number): Promise<SuccessScore[]> {
    const pool = await getPool();

    const query = `
      SELECT 
        ess.application_id,
        a.event_name,
        ess.success_probability as probability,
        ess.score_factors as factors
      FROM event_success_scores ess
      JOIN applications a ON ess.application_id = a.id
      WHERE ess.user_id = $1
      ORDER BY ess.success_probability DESC;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows.map((row) => ({
      applicationId: row.application_id,
      eventName: row.event_name,
      probability: row.probability,
      factors: row.factors,
    }));
  }

  /**
   * Get success score for a specific application
   */
  static async getSuccessScore(userId: number, applicationId: number) {
    const pool = await getPool();

    const query = `
      SELECT 
        success_probability,
        score_factors
      FROM event_success_scores
      WHERE user_id = $1 AND application_id = $2;
    `;

    const result = await pool.query(query, [userId, applicationId]);
    return result.rows[0] || null;
  }
}
