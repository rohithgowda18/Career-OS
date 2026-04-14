import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Pool } from 'pg';
import { TeamService } from '../_core/teamService';

describe('TeamService', () => {
  let pool: Pool;
  const testUserId = '1';
  const testUserId2 = '2';
  const testUserId3 = '3';
  const testAppId = 5;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL,
    });

    // Create test tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        application_id INT,
        created_by VARCHAR,
        max_members INT DEFAULT 5,
        status VARCHAR DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        team_id INT,
        user_id VARCHAR,
        role VARCHAR DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255)
      )
    `);

    // Insert test users
    await pool.query(
      'INSERT INTO users (id, name, email) VALUES ($1, $2, $3), ($4, $5, $6), ($7, $8, $9)',
      [
        testUserId,
        'Test User 1',
        'user1@test.com',
        testUserId2,
        'Test User 2',
        'user2@test.com',
        testUserId3,
        'Test User 3',
        'user3@test.com',
      ]
    );
  });

  afterAll(async () => {
    await pool.query('DROP TABLE IF EXISTS team_members');
    await pool.query('DROP TABLE IF EXISTS teams');
    await pool.query('DROP TABLE IF EXISTS users');
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM team_members');
    await pool.query('DELETE FROM teams');
  });

  describe('createTeam', () => {
    it('should create a new team with creator as lead', async () => {
      const team = await TeamService.createTeam(
        pool,
        testAppId,
        testUserId,
        'Frontend Warriors',
        'Team for frontend development',
        5
      );

      expect(team).toBeDefined();
      expect(team.name).toBe('Frontend Warriors');
      expect(team.createdBy).toBe(testUserId);
      expect(team.status).toBe('active');
      expect(team.maxMembers).toBe(5);

      // Verify creator is added as lead
      const members = await pool.query('SELECT * FROM team_members WHERE team_id = $1', [
        team.id,
      ]);
      expect(members.rows[0].role).toBe('lead');
    });

    it('should set default max_members to 5', async () => {
      const team = await TeamService.createTeam(
        pool,
        testAppId,
        testUserId,
        'Dev Team'
      );

      expect(team.maxMembers).toBe(5);
    });
  });

  describe('addTeamMember', () => {
    it('should add a member to team', async () => {
      const team = await TeamService.createTeam(
        pool,
        testAppId,
        testUserId,
        'Dev Team'
      );

      const result = await TeamService.addTeamMember(pool, team.id, testUserId2, 'member');

      expect(result.success).toBe(true);

      // Verify member added
      const members = await pool.query('SELECT * FROM team_members WHERE team_id = $1', [
        team.id,
      ]);
      expect(members.rows).toHaveLength(2); // Creator + new member
    });

    it('should prevent adding member when team is full', async () => {
      const team = await TeamService.createTeam(
        pool,
        testAppId,
        testUserId,
        'Small Team',
        '',
        2
      );

      // Add one member (will have 2 including creator)
      await TeamService.addTeamMember(pool, team.id, testUserId2, 'member');

      // Try to add another (should fail - team full)
      const result = await TeamService.addTeamMember(pool, team.id, testUserId3, 'member');

      expect(result.success).toBe(false);
      expect(result.message).toContain('full');
    });

    it('should prevent duplicate member addition', async () => {
      const team = await TeamService.createTeam(
        pool,
        testAppId,
        testUserId,
        'Dev Team'
      );

      await TeamService.addTeamMember(pool, team.id, testUserId2, 'member');

      // Try to add same member again
      const result = await TeamService.addTeamMember(pool, team.id, testUserId2, 'member');

      expect(result.success).toBe(false);
      expect(result.message).toContain('already');
    });
  });

  describe('getTeamWithMembers', () => {
    it('should return team with all members', async () => {
      const team = await TeamService.createTeam(
        pool,
        testAppId,
        testUserId,
        'Dev Team'
      );

      await TeamService.addTeamMember(pool, team.id, testUserId2, 'member');
      await TeamService.addTeamMember(pool, team.id, testUserId3, 'member');

      const fullTeam = await TeamService.getTeamWithMembers(pool, team.id);

      expect(fullTeam).toBeDefined();
      expect(fullTeam.members).toHaveLength(3);
      expect(fullTeam.isFull).toBe(false);
    });

    it('should correctly compute isFull', async () => {
      const team = await TeamService.createTeam(
        pool,
        testAppId,
        testUserId,
        'Small Team',
        '',
        2
      );

      await TeamService.addTeamMember(pool, team.id, testUserId2, 'member');

      const fullTeam = await TeamService.getTeamWithMembers(pool, team.id);

      expect(fullTeam.isFull).toBe(true);
    });
  });

  describe('getEventTeams', () => {
    it('should return all teams for an application', async () => {
      await TeamService.createTeam(pool, testAppId, testUserId, 'Team 1');
      await TeamService.createTeam(pool, testAppId, testUserId2, 'Team 2');

      const teams = await TeamService.getEventTeams(pool, testAppId);

      expect(teams).toHaveLength(2);
    });

    it('should return empty array when no teams exist', async () => {
      const teams = await TeamService.getEventTeams(pool, 999);

      expect(teams).toHaveLength(0);
    });
  });

  describe('getUserTeams', () => {
    it('should return all teams for a user', async () => {
      const team1 = await TeamService.createTeam(pool, testAppId, testUserId, 'Team 1');
      const team2 = await TeamService.createTeam(pool, testAppId + 1, testUserId, 'Team 2');

      const teams = await TeamService.getUserTeams(pool, testUserId);

      expect(teams).toHaveLength(2);
    });

    it('should only return teams user is member of', async () => {
      const team1 = await TeamService.createTeam(pool, testAppId, testUserId, 'Team 1');
      await TeamService.createTeam(pool, testAppId + 1, testUserId2, 'Team 2');

      const teams = await TeamService.getUserTeams(pool, testUserId);

      expect(teams).toHaveLength(1);
      expect(teams[0].id).toBe(team1.id);
    });
  });

  describe('removeTeamMember', () => {
    it('should remove a team member', async () => {
      const team = await TeamService.createTeam(
        pool,
        testAppId,
        testUserId,
        'Dev Team'
      );

      await TeamService.addTeamMember(pool, team.id, testUserId2, 'member');
      const result = await TeamService.removeTeamMember(pool, team.id, testUserId2);

      expect(result.success).toBe(true);

      const members = await pool.query('SELECT * FROM team_members WHERE team_id = $1', [
        team.id,
      ]);
      expect(members.rows).toHaveLength(1); // Only creator remains
    });

    it('should return error for non-existent member', async () => {
      const team = await TeamService.createTeam(
        pool,
        testAppId,
        testUserId,
        'Dev Team'
      );

      const result = await TeamService.removeTeamMember(pool, team.id, testUserId2);

      expect(result.success).toBe(false);
    });
  });

  describe('deleteTeam', () => {
    it('should delete team and its members', async () => {
      const team = await TeamService.createTeam(
        pool,
        testAppId,
        testUserId,
        'Dev Team'
      );

      await TeamService.addTeamMember(pool, team.id, testUserId2, 'member');
      await TeamService.deleteTeam(pool, team.id);

      const result = await pool.query('SELECT * FROM teams WHERE id = $1', [team.id]);
      expect(result.rows).toHaveLength(0);

      const members = await pool.query('SELECT * FROM team_members WHERE team_id = $1', [
        team.id,
      ]);
      expect(members.rows).toHaveLength(0);
    });
  });

  describe('updateTeam', () => {
    it('should update team properties', async () => {
      const team = await TeamService.createTeam(
        pool,
        testAppId,
        testUserId,
        'Old Name'
      );

      const updated = await TeamService.updateTeam(pool, team.id, {
        name: 'New Name',
        maxMembers: 10,
      });

      expect(updated.name).toBe('New Name');
      expect(updated.maxMembers).toBe(10);
    });
  });
});
