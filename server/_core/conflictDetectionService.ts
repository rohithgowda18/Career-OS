/**
 * Conflict Detection Service
 * Detects overlapping event deadlines and provides smart recommendations
 */

import { getPool } from '../db';

export interface DateConflict {
  id: number;
  applicationId1: number;
  applicationId2: number;
  eventName1: string;
  eventName2: string;
  deadline1: Date;
  deadline2: Date;
  recommendedApplicationId?: number;
  resolved: number;
}

export class ConflictDetectionService {
  /**
   * Detect overlapping events for a user
   * Events are conflicting if they have the same deadline date
   */
  static async detectConflicts(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<DateConflict[]> {
    const pool = await getPool();

    const query = `
      SELECT 
        a1.id as application_id_1,
        a2.id as application_id_2,
        a1.event_name as event_name_1,
        a2.event_name as event_name_2,
        a1.deadline as deadline_1,
        a2.deadline as deadline_2
      FROM applications a1
      JOIN applications a2 ON a1.user_id = a2.user_id
      WHERE a1.user_id = $1
        AND a2.user_id = $1
        AND a1.id < a2.id
        AND a1.deadline IS NOT NULL
        AND a2.deadline IS NOT NULL
        AND a1.deadline >= $2::TIMESTAMPTZ
        AND a2.deadline <= $3::TIMESTAMPTZ
        AND a1.status != 'Withdrawn'
        AND a2.status != 'Withdrawn'
        AND DATE(a1.deadline) = DATE(a2.deadline)
      ORDER BY a1.deadline, a2.deadline;
    `;

    const result = await pool.query(query, [userId, startDate, endDate]);
    return result.rows.map((row) => ({
      applicationId1: row.application_id_1,
      applicationId2: row.application_id_2,
      eventName1: row.event_name_1,
      eventName2: row.event_name_2,
      deadline1: row.deadline_1,
      deadline2: row.deadline_2,
    }));
  }

  /**
   * Get smart recommendation for which event to prioritize
   * Uses success rate and deadline urgency
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
        a.deadline,
        COUNT(CASE WHEN a.status = 'Accepted' THEN 1 END) 
          OVER (PARTITION BY a.event_type) as accepted_count,
        COUNT(*) OVER (PARTITION BY a.event_type) as total_count
      FROM applications a
      WHERE a.user_id = $1 AND (a.id = $2 OR a.id = $3);
    `;

    const result = await pool.query(statsQuery, [userId, app1Id, app2Id]);
    const apps = result.rows;

    if (apps.length < 2) return app1Id; // Fallback

    // Score based on success rate and deadline urgency
    const scores = apps.map((app) => {
      const successRate = app.total_count > 0 ? app.accepted_count / app.total_count : 0.5;
      const daysUntilDeadline =
        (new Date(app.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);

      // Closer deadlines get higher priority + success rate
      const urgency = Math.max(0, Math.min(1, 1 - daysUntilDeadline / 30));
      const finalScore = successRate * 0.6 + urgency * 0.4;

      return { id: app.id, score: finalScore };
    });

    return scores.sort((a, b) => b.score - a.score)[0].id;
  }

  /**
   * Store conflict information for later reference
   */
  static async storeConflict(
    userId: number,
    app1Id: number,
    app2Id: number,
    recommendedId?: number
  ): Promise<void> {
    const pool = await getPool();

    const appsQuery = `
      SELECT deadline FROM applications WHERE id = $1 OR id = $2;
    `;

    const appsResult = await pool.query(appsQuery, [app1Id, app2Id]);
    const dates = appsResult.rows.map((r) => r.deadline);

    const query = `
      INSERT INTO calendar_conflicts 
        (user_id, application_id_1, application_id_2, conflict_date_start, conflict_date_end, recommended_application_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, application_id_1, application_id_2) DO NOTHING;
    `;

    await pool.query(query, [
      userId,
      app1Id,
      app2Id,
      new Date(Math.min(...dates.map((d) => new Date(d).getTime()))),
      new Date(Math.max(...dates.map((d) => new Date(d).getTime()))),
      recommendedId,
    ]);
  }

  /**
   * Mark conflict as resolved
   */
  static async resolveConflict(conflictId: number): Promise<void> {
    const pool = await getPool();

    const query = `
      UPDATE calendar_conflicts 
      SET resolved = 1 
      WHERE id = $1;
    `;

    await pool.query(query, [conflictId]);
  }

  /**
   * Get all unresolved conflicts for a user
   */
  static async getUserConflicts(userId: number): Promise<DateConflict[]> {
    const pool = await getPool();

    const query = `
      SELECT 
        cc.id,
        cc.application_id_1,
        cc.application_id_2,
        a1.event_name as event_name_1,
        a2.event_name as event_name_2,
        a1.deadline as deadline_1,
        a2.deadline as deadline_2,
        cc.recommended_application_id,
        cc.resolved
      FROM calendar_conflicts cc
      JOIN applications a1 ON cc.application_id_1 = a1.id
      JOIN applications a2 ON cc.application_id_2 = a2.id
      WHERE cc.user_id = $1 AND cc.resolved = 0
      ORDER BY cc.created_at DESC;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }
}
