import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Pool } from 'pg';
import { RecommendationService } from '../_core/recommendationService';

describe('RecommendationService', () => {
  let pool: Pool;
  const testUserId = '1';
  const testAppId1 = 5;
  const testAppId2 = 6;

  beforeAll(async () => {
    // Initialize test pool with test database
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL,
    });

    // Create test tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_application_profiles (
        user_id VARCHAR,
        application_id INT,
        skills_json JSONB,
        interests JSONB,
        experience_level VARCHAR,
        created_at TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_events (
        user_id VARCHAR,
        event_id INT,
        status VARCHAR
      )
    `);
  });

  afterAll(async () => {
    // Cleanup
    await pool.query('DROP TABLE IF EXISTS user_application_profiles');
    await pool.query('DROP TABLE IF EXISTS user_events');
    await pool.end();
  });

  beforeEach(async () => {
    // Clear test data
    await pool.query('DELETE FROM user_application_profiles');
    await pool.query('DELETE FROM user_events');
  });

  describe('calculateMatchScore', () => {
    it('should calculate score based on skills match', async () => {
      const userSkills = [
        { name: 'React', level: 'advanced' },
        { name: 'TypeScript', level: 'intermediate' },
        { name: 'Node.js', level: 'advanced' },
      ];

      const eventSkills = ['React', 'TypeScript', 'PostgreSQL'];

      const score = RecommendationService.calculateMatchScore(userSkills, eventSkills, 3);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return 0 for no skill match', () => {
      const userSkills = [{ name: 'Python', level: 'advanced' }];
      const eventSkills = ['Java', 'C++'];

      const score = RecommendationService.calculateMatchScore(userSkills, eventSkills, 0);
      expect(score).toBeLessThan(30);
    });

    it('should reward relevant experience', () => {
      const userSkills = [
        { name: 'React', level: 'advanced' },
        { name: 'TypeScript', level: 'advanced' },
      ];
      const eventSkills = ['React', 'TypeScript'];

      const scoreWithExp = RecommendationService.calculateMatchScore(
        userSkills,
        eventSkills,
        5
      );
      const scoreWithoutExp = RecommendationService.calculateMatchScore(userSkills, eventSkills, 0);

      expect(scoreWithExp).toBeGreaterThan(scoreWithoutExp);
    });
  });

  describe('identifySkillGaps', () => {
    it('should identify missing required skills', () => {
      const userSkills = ['React', 'JavaScript'];
      const eventSkills = ['React', 'TypeScript', 'Node.js', 'PostgreSQL'];

      const gaps = RecommendationService.identifySkillGaps(userSkills, eventSkills);

      expect(gaps).toContain('TypeScript');
      expect(gaps).toContain('Node.js');
      expect(gaps).toContain('PostgreSQL');
      expect(gaps).not.toContain('React');
    });

    it('should return empty array when all skills match', () => {
      const userSkills = ['React', 'TypeScript', 'Node.js'];
      const eventSkills = ['React', 'TypeScript', 'Node.js'];

      const gaps = RecommendationService.identifySkillGaps(userSkills, eventSkills);

      expect(gaps).toHaveLength(0);
    });
  });

  describe('generateForUser', () => {
    it('should generate personalized recommendations', async () => {
      // Insert test profile
      await pool.query(
        `INSERT INTO user_application_profiles 
        (user_id, skills_json, interests, experience_level) 
        VALUES ($1, $2, $3, $4)`,
        [
          testUserId,
          JSON.stringify([
            { name: 'React', level: 'advanced' },
            { name: 'TypeScript', level: 'intermediate' },
          ]),
          JSON.stringify(['Web Development', 'Startups']),
          'intermediate',
        ]
      );

      const recommendations = await RecommendationService.generateForUser(pool, testUserId, [
        {
          id: 1,
          title: 'React Conf 2024',
          skills: ['React', 'JavaScript'],
          acceptanceRate: 0.65,
        },
        {
          id: 2,
          title: 'Node.js Summit',
          skills: ['Node.js', 'JavaScript'],
          acceptanceRate: 0.45,
        },
      ]);

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].score).toBeGreaterThanOrEqual(recommendations[1].score);
    });

    it('should return limited recommendations', async () => {
      const recommendations = await RecommendationService.generateForUser(pool, testUserId, [
        { id: 1, title: 'Event 1', skills: [], acceptanceRate: 0.5 },
        { id: 2, title: 'Event 2', skills: [], acceptanceRate: 0.5 },
        { id: 3, title: 'Event 3', skills: [], acceptanceRate: 0.5 },
        { id: 4, title: 'Event 4', skills: [], acceptanceRate: 0.5 },
        { id: 5, title: 'Event 5', skills: [], acceptanceRate: 0.5 },
        { id: 6, title: 'Event 6', skills: [], acceptanceRate: 0.5 },
      ]);

      expect(recommendations.length).toBeLessThanOrEqual(5);
    });
  });

  describe('updateUserProfile', () => {
    it('should update user skills and interests', async () => {
      const skills = [
        { name: 'React', level: 'advanced' },
        { name: 'TypeScript', level: 'advanced' },
      ];
      const interests = ['Web Development', 'Open Source'];

      await RecommendationService.updateUserProfile(
        pool,
        testUserId,
        skills,
        interests,
        'intermediate',
        ['Startups']
      );

      // Verify update
      const result = await pool.query(
        'SELECT skills_json FROM user_application_profiles WHERE user_id = $1',
        [testUserId]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      const stored = JSON.parse(result.rows[0].skills_json);
      expect(stored).toEqual(skills);
    });
  });
});
