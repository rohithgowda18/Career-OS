import pg from "pg";
const { Pool } = pg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  User, InsertUser, 
  Application, InsertApplication, 
  UserPreference, InsertUserPreferences, 
  Notification, InsertNotification, 
  UserProfile, InsertUserProfile,
  UserApplicationProfile, InsertUserApplicationProfile,
  DigestLog
} from "../shared/db-types";
import { ENV } from './_core/env';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { jsonDb } from './_core/jsonDb';

let _pool: pg.Pool | any = null;
let _initialized = false;

// Snake case to camel case converter for rows
function camelizeRow<T>(row: any): T {
  if (!row) return row;
  const result: any = {};
  for (const key in row) {
    const camelKey = key.replace(/([-_][a-z])/ig, ($1) => {
      return $1.toUpperCase()
        .replace('-', '')
        .replace('_', '');
    });
    result[camelKey] = row[key];
  }
  return result as T;
}

export async function getPool() {
  if (!_pool) {
    if (process.env.DATABASE_URL) {
      try {
        _pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          connectionTimeoutMillis: 2000,
        });
        
        // Test connection
        const client = await _pool.connect();
        client.release();
        console.log("[Database] Connected to PostgreSQL successfully");

        // Auto-initialize schema if not done
        if (!_initialized) {
          await initializeSchema();
        }
      } catch (error: any) {
        console.warn("[Database] PostgreSQL connection failed, falling back to JSON DB:", error.message);
        _pool = jsonDb;
      }
    } else {
      console.warn("[Database] No DATABASE_URL provided, using JSON DB fallback");
      _pool = jsonDb;
    }
  }
  return _pool;
}

async function initializeSchema() {
  if (!_pool) return;
  try {
    const sqlPath = path.join(__dirname, 'db-init.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await _pool.query(sql);
      console.log("[Database] Schema initialized successfully");
      _initialized = true;
    }
  } catch (error) {
    console.error("[Database] Schema initialization failed:", error);
  }
}

// User Queries
export async function upsertUser(user: InsertUser): Promise<void> {
  const pool = await getPool();
  if (!pool) return;

  const role = user.role || (user.openId === ENV.ownerOpenId ? 'admin' : 'user');
  const now = new Date();

  const query = `
    INSERT INTO users (open_id, name, email, login_method, role, last_signed_in, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (open_id) DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      login_method = EXCLUDED.login_method,
      role = EXCLUDED.role,
      last_signed_in = EXCLUDED.last_signed_in,
      updated_at = EXCLUDED.updated_at
  `;

  await pool.query(query, [
    user.openId,
    user.name ?? null,
    user.email ?? null,
    user.loginMethod ?? null,
    role,
    user.lastSignedIn || now,
    now
  ]);
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const pool = await getPool();
  if (!pool) return undefined;

  const result = await pool.query('SELECT * FROM users WHERE open_id = $1 LIMIT 1', [openId]);
  return result.rows.length > 0 ? camelizeRow<User>(result.rows[0]) : undefined;
}

// Application Queries
export async function getApplicationsByUserId(userId: number): Promise<Application[]> {
  const pool = await getPool();
  if (!pool) return [];

  const result = await pool.query(
    'SELECT * FROM applications WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows.map(row => camelizeRow<Application>(row));
}

export async function getApplicationById(id: number, userId: number): Promise<Application | undefined> {
  const pool = await getPool();
  if (!pool) return undefined;

  const result = await pool.query(
    'SELECT * FROM applications WHERE id = $1 AND user_id = $2 LIMIT 1',
    [id, userId]
  );
  return result.rows.length > 0 ? camelizeRow<Application>(result.rows[0]) : undefined;
}

export async function createApplication(data: InsertApplication) {
  const pool = await getPool();
  if (!pool) throw new Error("Database not available");

  const query = `
    INSERT INTO applications (user_id, event_name, event_type, status, deadline, notes, url)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const result = await pool.query(query, [
    data.userId,
    data.eventName,
    data.eventType,
    data.status,
    data.deadline,
    data.notes,
    data.url
  ]);
  return camelizeRow<Application>(result.rows[0]);
}

export async function updateApplication(id: number, userId: number, data: Partial<InsertApplication>) {
  const pool = await getPool();
  if (!pool) throw new Error("Database not available");

  const fields = Object.keys(data).map((key, i) => {
    const sqlKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    return `${sqlKey} = $${i + 3}`;
  });
  
  const query = `UPDATE applications SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $1 AND user_id = $2`;
  return pool.query(query, [id, userId, ...Object.values(data)]);
}

export async function deleteApplication(id: number, userId: number) {
  const pool = await getPool();
  if (!pool) throw new Error("Database not available");
  return pool.query('DELETE FROM applications WHERE id = $1 AND user_id = $2', [id, userId]);
}

// Preferences Queries
export async function getUserPreferences(userId: number): Promise<UserPreference | undefined> {
  const pool = await getPool();
  if (!pool) return undefined;

  const result = await pool.query('SELECT * FROM user_preferences WHERE user_id = $1 LIMIT 1', [userId]);
  return result.rows.length > 0 ? camelizeRow<UserPreference>(result.rows[0]) : undefined;
}

export async function createUserPreferences(data: InsertUserPreferences) {
  const pool = await getPool();
  if (!pool) throw new Error("Database not available");

  const query = `
    INSERT INTO user_preferences (
      user_id, default_view, notifications_enabled, email_notifications_enabled, 
      email_deadline_reminders, email_status_updates, weekly_digest_enabled, digest_day
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `;
  return pool.query(query, [
    data.userId, data.defaultView, data.notificationsEnabled, data.emailNotificationsEnabled,
    data.emailDeadlineReminders, data.emailStatusUpdates, data.weeklyDigestEnabled, data.digestDay
  ]);
}

export async function updateUserPreferences(userId: number, data: Partial<InsertUserPreferences>) {
  const pool = await getPool();
  if (!pool) throw new Error("Database not available");

  const fields = Object.keys(data).map((key, i) => {
    const sqlKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    return `${sqlKey} = $${i + 2}`;
  });

  const query = `UPDATE user_preferences SET ${fields.join(', ')}, updated_at = NOW() WHERE user_id = $1`;
  return pool.query(query, [userId, ...Object.values(data)]);
}

// Notification Queries
export async function createNotification(data: InsertNotification) {
  const pool = await getPool();
  if (!pool) throw new Error("Database not available");

  const query = `
    INSERT INTO notifications (user_id, application_id, type, subject, message)
    VALUES ($1, $2, $3, $4, $5)
  `;
  return pool.query(query, [
    data.userId, data.applicationId, data.type, data.subject, data.message
  ]);
}

export async function getPendingNotifications(): Promise<Notification[]> {
  const pool = await getPool();
  if (!pool) return [];

  const result = await pool.query(
    'SELECT * FROM notifications WHERE sent = 0 ORDER BY created_at DESC'
  );
  return result.rows.map(row => camelizeRow<Notification>(row));
}

export async function markNotificationAsSent(id: number) {
  const pool = await getPool();
  if (!pool) throw new Error("Database not available");
  return pool.query(
    'UPDATE notifications SET sent = 1, sent_at = NOW() WHERE id = $1',
    [id]
  );
}

// Profile Queries
export async function getUserProfile(userId: number): Promise<UserProfile | undefined> {
  const pool = await getPool();
  if (!pool) return undefined;

  const result = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1 LIMIT 1', [userId]);
  return result.rows.length > 0 ? camelizeRow<UserProfile>(result.rows[0]) : undefined;
}

export async function getProfileByUsername(username: string): Promise<UserProfile | undefined> {
  const pool = await getPool();
  if (!pool) return undefined;

  const result = await pool.query('SELECT * FROM user_profiles WHERE username = $1 LIMIT 1', [username]);
  return result.rows.length > 0 ? camelizeRow<UserProfile>(result.rows[0]) : undefined;
}

export async function createOrUpdateProfile(userId: number, profile: Partial<InsertUserProfile>): Promise<void> {
  const pool = await getPool();
  if (!pool) throw new Error("Database not available");

  const existing = await getUserProfile(userId);
  if (existing) {
    const fields = Object.keys(profile).map((key, i) => {
      const sqlKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      return `${sqlKey} = $${i + 2}`;
    });
    const query = `UPDATE user_profiles SET ${fields.join(', ')}, updated_at = NOW() WHERE user_id = $1`;
    await pool.query(query, [userId, ...Object.values(profile)]);
  } else {
    const username = profile.username || `user-${userId}`;
    const query = `
      INSERT INTO user_profiles (
        user_id, username, bio, profile_visibility, show_accepted_only, 
        avatar_url, website_url, linkedin_url, twitter_handle
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    await pool.query(query, [
      userId, username, profile.bio || null, profile.profileVisibility || 'public', 
      profile.showAcceptedOnly || 0, profile.avatarUrl || null, profile.websiteUrl || null,
      profile.linkedinUrl || null, profile.twitterHandle || null
    ]);
  }
}

// Join Query for Deadline Reminders
export async function getUpcomingApplicationsWithUsers() {
  const pool = await getPool();
  if (!pool) return [];

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const query = `
    SELECT 
      a.*, 
      u.open_id, u.name as user_name, u.email as user_email, u.role as user_role,
      p.email_notifications_enabled, p.email_deadline_reminders
    FROM applications a
    JOIN users u ON a.user_id = u.id
    LEFT JOIN user_preferences p ON u.id = p.user_id
    WHERE a.deadline >= $1 AND a.deadline <= $2
  `;
  
  const result = await pool.query(query, [now, sevenDaysFromNow]);
  
  // Custom mapping for the join results
  return result.rows.map(row => ({
    app: camelizeRow<Application>(row),
    user: {
      id: row.user_id,
      openId: row.open_id,
      name: row.user_name,
      email: row.user_email,
      role: row.user_role
    },
    prefs: {
      emailNotificationsEnabled: row.email_notifications_enabled,
      emailDeadlineReminders: row.email_deadline_reminders
    }
  }));
}

export async function getUsersForDigest(day: string) {
  const pool = await getPool();
  if (!pool) return [];

  const query = `
    SELECT u.*, p.weekly_digest_enabled, p.digest_day
    FROM users u
    JOIN user_preferences p ON u.id = p.user_id
    WHERE p.weekly_digest_enabled = 1 AND p.digest_day = $1
  `;
  const result = await pool.query(query, [day]);
  return result.rows.map(row => ({
    user: camelizeRow<User>(row),
    preferences: camelizeRow<UserPreference>(row)
  }));
}

// Analytics Helpers
export async function getProfileStats(userId: number) {
  const apps = await getApplicationsByUserId(userId);
  if (!apps) return null;

  return {
    totalApplications: apps.length,
    acceptedCount: apps.filter(a => a.status === "Accepted").length,
    rejectedCount: apps.filter(a => a.status === "Rejected").length,
    underReviewCount: apps.filter(a => a.status === "Under Review").length,
    acceptanceRate: apps.length > 0 ? Math.round((apps.filter(a => a.status === "Accepted").length / apps.length) * 100) : 0,
    eventTypeBreakdown: {
      hackathons: apps.filter(a => a.eventType === "Hackathon").length,
      workshops: apps.filter(a => a.eventType === "Workshop").length,
      conferences: apps.filter(a => a.eventType === "Conference").length,
      other: apps.filter(a => a.eventType === "Other").length,
    },
  };
}

export async function getProfileApplications(userId: number, acceptedOnly: boolean = false): Promise<Application[]> {
  const pool = await getPool();
  if (!pool) return [];

  let query = 'SELECT * FROM applications WHERE user_id = $1';
  const params: any[] = [userId];

  if (acceptedOnly) {
    query += ' AND status = $2';
    params.push('Accepted');
  }

  query += ' ORDER BY created_at DESC';

  const result = await pool.query(query, params);
  return result.rows.map(row => camelizeRow<Application>(row));
}

// Application Profile Queries
export async function getUserApplicationProfile(userId: number): Promise<UserApplicationProfile | null> {
  const pool = await getPool();
  if (!pool) return null;

  const result = await pool.query(
    'SELECT * FROM user_application_profiles WHERE user_id = $1',
    [userId]
  );

  return result.rows.length > 0 ? camelizeRow<UserApplicationProfile>(result.rows[0]) : null;
}

export async function createOrUpdateUserApplicationProfile(
  userId: number,
  profile: Omit<InsertUserApplicationProfile, 'userId'>
): Promise<UserApplicationProfile> {
  const pool = await getPool();
  if (!pool) throw new Error('Database not initialized');

  const existing = await getUserApplicationProfile(userId);

  if (existing) {
    // Update
    const result = await pool.query(
      `UPDATE user_application_profiles 
       SET full_name = $1, college = $2, degree = $3, graduation_year = $4, 
           github_url = $5, portfolio_url = $6, resume_url = $7, skills = $8, 
           short_bio = $9, updated_at = NOW()
       WHERE user_id = $10
       RETURNING *`,
      [
        profile.fullName,
        profile.college,
        profile.degree,
        profile.graduationYear,
        profile.githubUrl,
        profile.portfolioUrl,
        profile.resumeUrl,
        profile.skills,
        profile.shortBio,
        userId,
      ]
    );

    return camelizeRow<UserApplicationProfile>(result.rows[0]);
  } else {
    // Create
    const result = await pool.query(
      `INSERT INTO user_application_profiles 
       (user_id, full_name, college, degree, graduation_year, github_url, portfolio_url, resume_url, skills, short_bio)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        userId,
        profile.fullName,
        profile.college,
        profile.degree,
        profile.graduationYear,
        profile.githubUrl,
        profile.portfolioUrl,
        profile.resumeUrl,
        profile.skills,
        profile.shortBio,
      ]
    );

    return camelizeRow<UserApplicationProfile>(result.rows[0]);
  }
}
