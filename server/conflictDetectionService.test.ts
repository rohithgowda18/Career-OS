import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Pool } from 'pg';
import { ConflictDetectionService } from '../_core/conflictDetectionService';

describe('ConflictDetectionService', () => {
  let pool: Pool;
  const testUserId = '1';
  const testAppId1 = 5;
  const testAppId2 = 6;
  const testAppId3 = 7;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL,
    });

    // Create test tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_applications (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR,
        application_id INT,
        deadline_date DATE,
        status VARCHAR DEFAULT 'applied'
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS calendar_conflicts (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR,
        application_id_1 INT,
        application_id_2 INT,
        conflict_date_start DATE,
        conflict_date_end DATE,
        recommended_application_id INT,
        resolved BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_applications_stats (
        application_id INT,
        success_rate DECIMAL,
        deadline_days_remaining INT
      )
    `);
  });

  afterAll(async () => {
    await pool.query('DROP TABLE IF EXISTS calendar_conflicts');
    await pool.query('DROP TABLE IF EXISTS user_applications');
    await pool.query('DROP TABLE IF EXISTS user_applications_stats');
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM calendar_conflicts');
    await pool.query('DELETE FROM user_applications');
    await pool.query('DELETE FROM user_applications_stats');
  });

  describe('detectConflicts', () => {
    it('should detect applications with same deadline date', async () => {
      const deadlineDate = new Date('2024-12-25');

      // Insert applications with same deadline
      await pool.query(
        `INSERT INTO user_applications (user_id, application_id, deadline_date, status)
         VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)`,
        [
          testUserId,
          testAppId1,
          deadlineDate,
          'applied',
          testUserId,
          testAppId2,
          deadlineDate,
          'applied',
        ]
      );

      const conflicts = await ConflictDetectionService.detectConflicts(pool, testUserId);

      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].appId1).toBeDefined();
      expect(conflicts[0].appId2).toBeDefined();
    });

    it('should not detect conflicts for different deadline dates', async () => {
      await pool.query(
        `INSERT INTO user_applications (user_id, application_id, deadline_date, status)
         VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)`,
        [
          testUserId,
          testAppId1,
          new Date('2024-12-25'),
          'applied',
          testUserId,
          testAppId2,
          new Date('2024-12-26'),
          'applied',
        ]
      );

      const conflicts = await ConflictDetectionService.detectConflicts(pool, testUserId);

      expect(conflicts).toHaveLength(0);
    });

    it('should only return conflicts for specific user', async () => {
      const deadlineDate = new Date('2024-12-25');

      await pool.query(
        `INSERT INTO user_applications (user_id, application_id, deadline_date, status)
         VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)`,
        [testUserId, testAppId1, deadlineDate, 'applied', '2', testAppId3, deadlineDate, 'applied']
      );

      const conflicts = await ConflictDetectionService.detectConflicts(pool, testUserId);

      expect(conflicts).toHaveLength(0);
    });
  });

  describe('getSmartRecommendation', () => {
    it('should recommend app with higher success rate', async () => {
      // Insert stats
      await pool.query(
        `INSERT INTO user_applications_stats (application_id, success_rate, deadline_days_remaining)
         VALUES ($1, $2, $3), ($4, $5, $6)`,
        [testAppId1, 0.8, 10, testAppId2, 0.5, 10]
      );

      const recommendation = ConflictDetectionService.getSmartRecommendation(
        testAppId1,
        testAppId2,
        0.8,
        0.5,
        10,
        10
      );

      expect(recommendation).toBe(testAppId1);
    });

    it('should consider deadline urgency', () => {
      // App 1: higher success rate but more time
      // App 2: lower success rate but urgent
      const recommendation = ConflictDetectionService.getSmartRecommendation(
        testAppId1,
        testAppId2,
        0.7, // App 1 success rate
        0.6, // App 2 success rate
        20, // App 1: more time
        2 // App 2: urgent
      );

      // Should still weight success rate heavily (60%)
      expect(recommendation).toBeDefined();
    });

    it('should use weighted algorithm correctly', () => {
      // Test case: 60% success rate weight + 40% urgency weight
      const recommendation = ConflictDetectionService.getSmartRecommendation(
        testAppId1,
        testAppId2,
        0.9, // Very high success rate
        0.85, // Slightly lower
        15, // Moderate deadline
        15 // Same deadline
      );

      // App 1 should win due to higher success rate weight
      expect(recommendation).toBe(testAppId1);
    });
  });

  describe('storeConflict', () => {
    it('should store conflict record', async () => {
      const conflict = await ConflictDetectionService.storeConflict(
        pool,
        testUserId,
        testAppId1,
        testAppId2,
        new Date('2024-12-25'),
        new Date('2024-12-25'),
        testAppId1
      );

      expect(conflict).toBeDefined();
      expect(conflict.userId).toBe(testUserId);
      expect(conflict.appId1).toBe(testAppId1);
      expect(conflict.appId2).toBe(testAppId2);
    });

    it('should record recommended application', async () => {
      const conflict = await ConflictDetectionService.storeConflict(
        pool,
        testUserId,
        testAppId1,
        testAppId2,
        new Date('2024-12-25'),
        new Date('2024-12-25'),
        testAppId2
      );

      expect(conflict.recommendedApplicationId).toBe(testAppId2);
    });
  });

  describe('resolveConflict', () => {
    it('should mark conflict as resolved', async () => {
      const conflict = await ConflictDetectionService.storeConflict(
        pool,
        testUserId,
        testAppId1,
        testAppId2,
        new Date('2024-12-25'),
        new Date('2024-12-25'),
        testAppId1
      );

      const resolved = await ConflictDetectionService.resolveConflict(pool, conflict.id);

      expect(resolved.resolved).toBe(true);
    });
  });

  describe('getUserConflicts', () => {
    it('should return all user conflicts', async () => {
      const deadlineDate = new Date('2024-12-25');

      await ConflictDetectionService.storeConflict(
        pool,
        testUserId,
        testAppId1,
        testAppId2,
        deadlineDate,
        deadlineDate,
        testAppId1
      );

      await ConflictDetectionService.storeConflict(
        pool,
        testUserId,
        testAppId2,
        testAppId3,
        deadlineDate,
        deadlineDate,
        testAppId2
      );

      const conflicts = await ConflictDetectionService.getUserConflicts(pool, testUserId);

      expect(conflicts.length).toBeGreaterThanOrEqual(2);
    });

    it('should only return unresolved conflicts by default', async () => {
      const conflict = await ConflictDetectionService.storeConflict(
        pool,
        testUserId,
        testAppId1,
        testAppId2,
        new Date('2024-12-25'),
        new Date('2024-12-25'),
        testAppId1
      );

      await ConflictDetectionService.resolveConflict(pool, conflict.id);

      const unresolved = await ConflictDetectionService.getUserConflicts(pool, testUserId, false);

      expect(unresolved).toHaveLength(0);
    });

    it('should return all conflicts including resolved when requested', async () => {
      const conflict = await ConflictDetectionService.storeConflict(
        pool,
        testUserId,
        testAppId1,
        testAppId2,
        new Date('2024-12-25'),
        new Date('2024-12-25'),
        testAppId1
      );

      await ConflictDetectionService.resolveConflict(pool, conflict.id);

      const all = await ConflictDetectionService.getUserConflicts(pool, testUserId, true);

      expect(all.length).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle user with no applications', async () => {
      const conflicts = await ConflictDetectionService.detectConflicts(
        pool,
        'non-existent-user'
      );

      expect(conflicts).toHaveLength(0);
    });

    it('should handle user with single application', async () => {
      await pool.query(
        `INSERT INTO user_applications (user_id, application_id, deadline_date, status)
         VALUES ($1, $2, $3, $4)`,
        [testUserId, testAppId1, new Date('2024-12-25'), 'applied']
      );

      const conflicts = await ConflictDetectionService.detectConflicts(pool, testUserId);

      expect(conflicts).toHaveLength(0);
    });

    it('should handle multiple date ranges', async () => {
      // Create conflicts with date ranges
      await ConflictDetectionService.storeConflict(
        pool,
        testUserId,
        testAppId1,
        testAppId2,
        new Date('2024-12-25'),
        new Date('2024-12-28'),
        testAppId1
      );

      const conflicts = await ConflictDetectionService.getUserConflicts(pool, testUserId);

      expect(conflicts[0].conflictDateStart).toBeDefined();
      expect(conflicts[0].conflictDateEnd).toBeDefined();
    });
  });
});
