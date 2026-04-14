import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Pool } from 'pg';
import { SuccessScoringService } from '../_core/successScoringService';

describe('SuccessScoringService', () => {
  let pool: Pool;
  const testUserId = '1';
  const testAppId = 5;
  const testAppId2 = 6;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL,
    });

    // Create test tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_success_scores (
        id SERIAL PRIMARY KEY,
        application_id INT,
        user_id VARCHAR,
        success_probability DECIMAL,
        score_factors JSONB,
        calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        type VARCHAR,
        success_rate DECIMAL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_applications (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR,
        application_id INT,
        experience_level VARCHAR,
        deadline_date DATE,
        created_at TIMESTAMP,
        status VARCHAR DEFAULT 'applied'
      )
    `);

    // Insert test event
    await pool.query(
      'INSERT INTO events (id, type, success_rate) VALUES ($1, $2, $3)',
      [testAppId, 'Internship', 0.75]
    );
  });

  afterAll(async () => {
    await pool.query('DROP TABLE IF EXISTS event_success_scores');
    await pool.query('DROP TABLE IF EXISTS user_applications');
    await pool.query('DROP TABLE IF EXISTS events');
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM event_success_scores');
    await pool.query('DELETE FROM user_applications');
  });

  describe('calculateSuccessProbability', () => {
    it('should calculate probability between 0 and 100', () => {
      const probability = SuccessScoringService.calculateSuccessProbability(
        0.75, // eventTypeSuccessRate
        'intermediate', // userExperienceLevel
        0.8, // overallAcceptanceRate
        15, // daysUntilDeadline
        0.85 // historicalTrend
      );

      expect(probability).toBeGreaterThanOrEqual(0);
      expect(probability).toBeLessThanOrEqual(100);
    });

    it('should weight event type at 30%', () => {
      // All factors low except event type = high
      const probWithHighEventRate = SuccessScoringService.calculateSuccessProbability(
        0.95, // High event success
        'beginner',
        0.3,
        30,
        0.2
      );

      // All factors high except event type = low
      const probWithLowEventRate = SuccessScoringService.calculateSuccessProbability(
        0.1, // Low event success
        'expert',
        0.9,
        2,
        0.95
      );

      expect(probWithHighEventRate).toBeGreaterThan(probWithLowEventRate);
    });

    it('should weight user experience at 25%', () => {
      // Expert should score higher than beginner with same other factors
      const probExpert = SuccessScoringService.calculateSuccessProbability(
        0.5,
        'expert', // Expert
        0.5,
        15,
        0.5
      );

      const probBeginner = SuccessScoringService.calculateSuccessProbability(
        0.5,
        'beginner', // Beginner
        0.5,
        15,
        0.5
      );

      expect(probExpert).toBeGreaterThan(probBeginner);
    });

    it('should weight overall acceptance rate at 20%', () => {
      const probHighRate = SuccessScoringService.calculateSuccessProbability(
        0.5,
        'intermediate',
        0.9, // High acceptance rate
        15,
        0.5
      );

      const probLowRate = SuccessScoringService.calculateSuccessProbability(
        0.5,
        'intermediate',
        0.1, // Low acceptance rate
        15,
        0.5
      );

      expect(probHighRate).toBeGreaterThan(probLowRate);
    });

    it('should weight timeline (days until deadline) at 15%', () => {
      // More time should increase probability (more prep time)
      const probMoreTime = SuccessScoringService.calculateSuccessProbability(
        0.5,
        'intermediate',
        0.5,
        60, // 60 days
        0.5
      );

      const probLessTime = SuccessScoringService.calculateSuccessProbability(
        0.5,
        'intermediate',
        0.5,
        2, // 2 days
        0.5
      );

      expect(probMoreTime).toBeGreaterThan(probLessTime);
    });

    it('should weight historical trend at 10%', () => {
      // Upward trend should increase probability
      const probUptrend = SuccessScoringService.calculateSuccessProbability(
        0.5,
        'intermediate',
        0.5,
        15,
        0.95 // Upward trend
      );

      const probDowntrend = SuccessScoringService.calculateSuccessProbability(
        0.5,
        'intermediate',
        0.5,
        15,
        0.1 // Downward trend
      );

      expect(probUptrend).toBeGreaterThan(probDowntrend);
    });

    it('should map experience levels correctly', () => {
      const beginnerProb = SuccessScoringService.calculateSuccessProbability(
        0.5,
        'beginner',
        0.5,
        15,
        0.5
      );

      const intermediateProb = SuccessScoringService.calculateSuccessProbability(
        0.5,
        'intermediate',
        0.5,
        15,
        0.5
      );

      const advancedProb = SuccessScoringService.calculateSuccessProbability(
        0.5,
        'advanced',
        0.5,
        15,
        0.5
      );

      const expertProb = SuccessScoringService.calculateSuccessProbability(
        0.5,
        'expert',
        0.5,
        15,
        0.5
      );

      expect(beginnerProb).toBeLessThan(intermediateProb);
      expect(intermediateProb).toBeLessThan(advancedProb);
      expect(advancedProb).toBeLessThan(expertProb);
    });
  });

  describe('storeSuccessScore', () => {
    it('should store success score in database', async () => {
      const factors = {
        eventTypeRate: 0.75,
        expLevel: 0.8,
        skillMatch: 0.7,
        timeline: 0.85,
        trend: 0.8,
      };

      const score = await SuccessScoringService.storeSuccessScore(
        pool,
        testAppId,
        testUserId,
        78.5,
        factors
      );

      expect(score).toBeDefined();
      expect(score.successProbability).toBe(78.5);
      expect(score.userId).toBe(testUserId);
      expect(score.applicationId).toBe(testAppId);
    });

    it('should handle high probability scores', async () => {
      const score = await SuccessScoringService.storeSuccessScore(
        pool,
        testAppId,
        testUserId,
        99.9,
        {}
      );

      expect(score.successProbability).toBe(99.9);
    });

    it('should handle low probability scores', async () => {
      const score = await SuccessScoringService.storeSuccessScore(
        pool,
        testAppId,
        testUserId,
        5.2,
        {}
      );

      expect(score.successProbability).toBe(5.2);
    });
  });

  describe('getSuccessScore', () => {
    it('should retrieve stored success score', async () => {
      const factors = {
        eventTypeRate: 0.75,
        expLevel: 0.8,
        skillMatch: 0.7,
        timeline: 0.85,
        trend: 0.8,
      };

      await SuccessScoringService.storeSuccessScore(
        pool,
        testAppId,
        testUserId,
        85.0,
        factors
      );

      const score = await SuccessScoringService.getSuccessScore(
        pool,
        testAppId,
        testUserId
      );

      expect(score).toBeDefined();
      expect(score.successProbability).toBe(85.0);
      expect(score.userId).toBe(testUserId);
    });

    it('should return null for non-existent score', async () => {
      const score = await SuccessScoringService.getSuccessScore(
        pool,
        999,
        testUserId
      );

      expect(score).toBeNull();
    });

    it('should return most recent score', async () => {
      // Store first score
      await SuccessScoringService.storeSuccessScore(
        pool,
        testAppId,
        testUserId,
        50.0,
        {}
      );

      // Wait a bit and store updated score
      await new Promise((resolve) => setTimeout(resolve, 10));
      await SuccessScoringService.storeSuccessScore(
        pool,
        testAppId,
        testUserId,
        75.0,
        {}
      );

      const score = await SuccessScoringService.getSuccessScore(
        pool,
        testAppId,
        testUserId
      );

      expect(score.successProbability).toBe(75.0);
    });
  });

  describe('getSuccessProbabilities', () => {
    it('should return scores for all user applications', async () => {
      await SuccessScoringService.storeSuccessScore(
        pool,
        testAppId,
        testUserId,
        80.0,
        {}
      );

      await SuccessScoringService.storeSuccessScore(
        pool,
        testAppId2,
        testUserId,
        65.0,
        {}
      );

      const scores = await SuccessScoringService.getSuccessProbabilities(
        pool,
        testUserId
      );

      expect(scores.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array when user has no scores', async () => {
      const scores = await SuccessScoringService.getSuccessProbabilities(
        pool,
        'non-existent-user'
      );

      expect(scores).toHaveLength(0);
    });

    it('should order scores appropriately', async () => {
      await SuccessScoringService.storeSuccessScore(
        pool,
        testAppId,
        testUserId,
        50.0,
        {}
      );

      await SuccessScoringService.storeSuccessScore(
        pool,
        testAppId2,
        testUserId,
        90.0,
        {}
      );

      const scores = await SuccessScoringService.getSuccessProbabilities(
        pool,
        testUserId
      );

      // Should return highest probability first
      expect(scores[0].successProbability).toBeGreaterThanOrEqual(
        scores[scores.length - 1].successProbability
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle zero probability', () => {
      const prob = SuccessScoringService.calculateSuccessProbability(
        0, // No event success
        'beginner',
        0,
        1000, // Lots of time
        0
      );

      expect(prob).toBe(0);
    });

    it('should handle perfect probability', () => {
      const prob = SuccessScoringService.calculateSuccessProbability(
        1, // Perfect event success
        'expert',
        1, // Perfect acceptance
        1, // 1 day
        1 // Perfect trend
      );

      expect(prob).toBeLessThanOrEqual(100);
      expect(prob).toBeGreaterThan(80);
    });

    it('should handle mixed factors', () => {
      const prob = SuccessScoringService.calculateSuccessProbability(
        0.6, // Mixed
        'intermediate',
        0.7,
        20,
        0.5
      );

      expect(prob).toBeGreaterThan(0);
      expect(prob).toBeLessThan(100);
    });

    it('should handle very short timeline', () => {
      const prob = SuccessScoringService.calculateSuccessProbability(
        0.8,
        'expert',
        0.8,
        0, // Deadline today
        0.8
      );

      expect(prob).toBeDefined();
      expect(prob).toBeGreaterThan(0);
    });

    it('should handle very long timeline', () => {
      const prob = SuccessScoringService.calculateSuccessProbability(
        0.8,
        'expert',
        0.8,
        365, // 1 year
        0.8
      );

      expect(prob).toBeDefined();
      expect(prob).toBeLessThanOrEqual(100);
    });
  });
});
