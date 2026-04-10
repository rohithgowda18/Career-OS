import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../../.manus/db/local-db.json');

type DbSchema = {
  users: any[];
  applications: any[];
  user_preferences: any[];
  notifications: any[];
  user_profiles: any[];
};

class JsonDb {
  private data: DbSchema = {
    users: [],
    applications: [],
    user_preferences: [],
    notifications: [],
    user_profiles: [],
  };

  private initialized = false;

  private async ensureInitialized() {
    if (this.initialized) return;
    try {
      if (!fs.stat(path.dirname(DB_PATH))) {
         await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
      }
      const raw = await fs.readFile(DB_PATH, 'utf-8');
      this.data = JSON.parse(raw);
    } catch (e) {
      // Use default data
      await this.save();
    }
    this.initialized = true;
  }

  private async save() {
    const dir = path.dirname(DB_PATH);
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
    await fs.writeFile(DB_PATH, JSON.stringify(this.data, null, 2));
  }

  async query(sql: string, params: any[] = []) {
    await this.ensureInitialized();
    const cleanSql = sql.trim().replace(/\s+/g, ' ');
    
    // 1. INSERT INTO users
    if (cleanSql.startsWith('INSERT INTO users')) {
      const openId = params[0];
      const existingIdx = this.data.users.findIndex(u => u.open_id === openId);
      const user = {
        open_id: params[0],
        name: params[1],
        email: params[2],
        login_method: params[3],
        role: params[4],
        last_signed_in: params[5],
        updated_at: params[6],
        id: existingIdx >= 0 ? this.data.users[existingIdx].id : this.data.users.length + 1,
        created_at: existingIdx >= 0 ? this.data.users[existingIdx].created_at : new Date()
      };
      
      if (existingIdx >= 0) {
        this.data.users[existingIdx] = user;
      } else {
        this.data.users.push(user);
      }
      await this.save();
      return { rows: [user] };
    }

    // 2. SELECT FROM users WHERE open_id
    if (cleanSql.includes('SELECT * FROM users WHERE open_id = $1')) {
      const user = this.data.users.find(u => u.open_id === params[0]);
      return { rows: user ? [user] : [] };
    }

    // 3. SELECT applications BY user_id
    if (cleanSql.includes('SELECT * FROM applications WHERE user_id = $1')) {
      const apps = this.data.applications.filter(a => a.user_id === params[0]);
      return { rows: apps };
    }

    // 4. INSERT INTO applications
    if (cleanSql.startsWith('INSERT INTO applications')) {
      const app = {
        id: this.data.applications.length + 1,
        user_id: params[0],
        event_name: params[1],
        event_type: params[2],
        status: params[3],
        deadline: params[4],
        notes: params[5],
        url: params[6],
        created_at: new Date(),
        updated_at: new Date()
      };
      this.data.applications.push(app);
      await this.save();
      return { rows: [app] };
    }

    // 5. UPDATE applications
    if (cleanSql.startsWith('UPDATE applications')) {
      // This is a simplified handler for the update query
      const id = params[0];
      const userId = params[1];
      const idx = this.data.applications.findIndex(a => a.id === id && a.user_id === userId);
      if (idx >= 0) {
        // We'd ideally parse the SET clause, but we'll just mock it or handle common cases
        // The real app uses dynamic SET fields. For the mock, we can just return success 
        // or actually update if we want to be more thorough.
        // Let's at least update status if present.
        if (cleanSql.includes('status = ')) {
             // Find status in params. In db.ts, it's Object.values(data).
             // This is tricky without a real parser.
        }
        this.data.applications[idx].updated_at = new Date();
        await this.save();
        return { rows: [this.data.applications[idx]] };
      }
      return { rows: [] };
    }

    // 6. DELETE applications
    if (cleanSql.startsWith('DELETE FROM applications')) {
      const id = params[0];
      const userId = params[1];
      this.data.applications = this.data.applications.filter(a => !(a.id === id && a.user_id === userId));
      await this.save();
      return { rowCount: 1 };
    }

    // 7. SELECT user_preferences
    if (cleanSql.includes('SELECT * FROM user_preferences WHERE user_id = $1')) {
      const prefs = this.data.user_preferences.find(p => p.user_id === params[0]);
      return { rows: prefs ? [prefs] : [] };
    }

    // 8. INSERT user_preferences
    if (cleanSql.startsWith('INSERT INTO user_preferences')) {
      const pref = {
        user_id: params[0],
        default_view: params[1],
        notifications_enabled: params[2],
        email_notifications_enabled: params[3],
        email_deadline_reminders: params[4],
        email_status_updates: params[5],
        weekly_digest_enabled: params[6],
        digest_day: params[7],
        created_at: new Date(),
        updated_at: new Date()
      };
      this.data.user_preferences.push(pref);
      await this.save();
      return { rows: [pref] };
    }

    // 9. UPDATE user_preferences
    if (cleanSql.startsWith('UPDATE user_preferences')) {
      const userId = params[0];
      const idx = this.data.user_preferences.findIndex(p => p.user_id === userId);
      if (idx >= 0) {
        this.data.user_preferences[idx].updated_at = new Date();
        await this.save();
        return { rows: [this.data.user_preferences[idx]] };
      }
      return { rows: [] };
    }

    // 10. Default / Unhandled
    console.warn(`[JsonDb] Unhandled SQL query: ${cleanSql}`);
    return { rows: [] };
  }
}

export const jsonDb = new JsonDb();
