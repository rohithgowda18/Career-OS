/**
 * Team Formation Service
 * Handles team creation, member management, and team queries
 */

import { getPool } from '../db';

export interface Team {
  id: number;
  name: string;
  description?: string;
  application_id: number;
  created_by: number;
  max_members: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface TeamMember {
  id: number;
  team_id: number;
  user_id: number;
  role: 'lead' | 'member' | 'mentor';
  joined_at: Date;
  name?: string;
  email?: string;
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
  memberCount: number;
  isFull: boolean;
}

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
      INSERT INTO teams (name, description, application_id, created_by, max_members, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
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
    role: 'lead' | 'member' | 'mentor' = 'member'
  ): Promise<void> {
    const pool = await getPool();

    // Check if user already in team
    const checkQuery = `
      SELECT id FROM team_members 
      WHERE team_id = $1 AND user_id = $2;
    `;
    const checkResult = await pool.query(checkQuery, [teamId, userId]);
    if (checkResult.rows.length > 0) {
      throw new Error('User already in team');
    }

    // Check if team is full
    const teamQuery = `
      SELECT 
        t.max_members,
        COUNT(tm.id) as current_members
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      WHERE t.id = $1
      GROUP BY t.id, t.max_members;
    `;

    const teamResult = await pool.query(teamQuery, [teamId]);
    if (teamResult.rows.length === 0) {
      throw new Error('Team not found');
    }

    const team = teamResult.rows[0];
    if (team.current_members >= team.max_members) {
      throw new Error('Team is full');
    }

    // Add member
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
      ORDER BY 
        CASE WHEN tm.role = 'lead' THEN 0 WHEN tm.role = 'mentor' THEN 1 ELSE 2 END,
        tm.joined_at ASC;
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
      SELECT t.* FROM teams t
      WHERE t.application_id = $1
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
   * Get all teams a user is member of
   */
  static async getUserTeams(userId: number): Promise<TeamWithMembers[]> {
    const pool = await getPool();

    const query = `
      SELECT DISTINCT t.* FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = $1
      ORDER BY tm.joined_at DESC;
    `;

    const result = await pool.query(query, [userId]);

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

  /**
   * Update team
   */
  static async updateTeam(
    teamId: number,
    data: {
      name?: string;
      description?: string;
      maxMembers?: number;
      status?: string;
    }
  ): Promise<Team> {
    const pool = await getPool();

    const query = `
      UPDATE teams
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          max_members = COALESCE($3, max_members),
          status = COALESCE($4, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *;
    `;

    const result = await pool.query(query, [
      data.name,
      data.description,
      data.maxMembers,
      data.status,
      teamId,
    ]);

    return result.rows[0];
  }

  /**
   * Delete team
   */
  static async deleteTeam(teamId: number): Promise<void> {
    const pool = await getPool();

    const query = `DELETE FROM teams WHERE id = $1;`;
    await pool.query(query, [teamId]);
  }
}
