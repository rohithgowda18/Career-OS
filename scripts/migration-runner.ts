import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

const env = process.env.NODE_ENV || 'development';
const isDev = env === 'development';

// Initialize database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(isDev && {
    // Connection pool config for development
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }),
});

// Migration tracking table
const MIGRATIONS_TABLE = 'schema_migrations';

interface Migration {
  filename: string;
  version: string;
}

/**
 * Ensure migrations table exists
 */
async function ensureMigrationsTable(): Promise<void> {
  const query = `
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      version VARCHAR(255) NOT NULL UNIQUE,
      filename VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await pool.query(query);
    console.log(`✓ Migrations table ready`);
  } catch (error) {
    console.error('Failed to create migrations table:', error);
    throw error;
  }
}

/**
 * Get list of already executed migrations
 */
async function getExecutedMigrations(): Promise<Set<string>> {
  try {
    const result = await pool.query(`
      SELECT version FROM ${MIGRATIONS_TABLE} ORDER BY executed_at
    `);
    return new Set(result.rows.map((row) => row.version));
  } catch {
    return new Set();
  }
}

/**
 * Get list of migration files to run
 */
function getMigrationFiles(): Migration[] {
  const migrationsDir = path.join(__dirname, '../migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.warn(`⚠ Migrations directory not found: ${migrationsDir}`);
    return [];
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  return files.map((filename) => ({
    filename,
    version: filename.replace('.sql', ''),
  }));
}

/**
 * Execute a single migration file
 */
async function executeMigration(migration: Migration): Promise<void> {
  const filePath = path.join(__dirname, '../migrations', migration.filename);

  // Read migration file
  const sql = fs.readFileSync(filePath, 'utf-8');

  // Start transaction
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Execute migration
    console.log(`  Running: ${migration.filename}...`);
    await client.query(sql);

    // Record migration
    await client.query(
      `INSERT INTO ${MIGRATIONS_TABLE} (version, filename) VALUES ($1, $2)`,
      [migration.version, migration.filename]
    );

    await client.query('COMMIT');
    console.log(`  ✓ ${migration.filename} executed successfully`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`  ✗ Failed to execute ${migration.filename}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Run all pending migrations
 */
async function runMigrations(): Promise<void> {
  try {
    console.log('🔄 Starting database migrations...\n');

    // Ensure migrations table exists
    await ensureMigrationsTable();

    // Get executed migrations
    const executed = await getExecutedMigrations();
    console.log(`Already executed: ${executed.size} migration(s)\n`);

    // Get migration files
    const migrations = getMigrationFiles();

    if (migrations.length === 0) {
      console.log('⚠ No migration files found');
      return;
    }

    // Filter pending migrations
    const pending = migrations.filter((m) => !executed.has(m.version));

    if (pending.length === 0) {
      console.log('✓ All migrations are up to date!');
      return;
    }

    console.log(`📋 Found ${pending.length} pending migration(s):\n`);

    // Execute pending migrations
    for (const migration of pending) {
      await executeMigration(migration);
    }

    console.log('\n✅ All migrations completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

/**
 * Rollback the last migration (development only)
 */
async function rollbackMigration(): Promise<void> {
  if (env === 'production') {
    console.error('❌ Rollbacks are disabled in production');
    process.exit(1);
  }

  try {
    console.log('🔄 Rolling back last migration...\n');

    const client = await pool.connect();

    try {
      // Get the last executed migration
      const result = await client.query(`
        SELECT version, filename FROM ${MIGRATIONS_TABLE}
        ORDER BY executed_at DESC
        LIMIT 1
      `);

      if (result.rows.length === 0) {
        console.log('ℹ No migrations to rollback');
        return;
      }

      const lastMigration = result.rows[0];
      console.log(`Rolling back: ${lastMigration.filename}...`);

      // Remove from migrations table
      await client.query(
        `DELETE FROM ${MIGRATIONS_TABLE} WHERE version = $1`,
        [lastMigration.version]
      );

      console.log(`✓ Rollback recorded: ${lastMigration.filename}`);
      console.log('⚠ Note: You may need to manually drop tables or undo schema changes');
    } finally {
      client.release();
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    process.exit(1);
  }
}

/**
 * Show migration status
 */
async function showStatus(): Promise<void> {
  try {
    console.log('📊 Migration Status\n');

    // Get executed migrations
    const result = await pool.query(`
      SELECT version, filename, executed_at
      FROM ${MIGRATIONS_TABLE}
      ORDER BY executed_at
    `);

    if (result.rows.length === 0) {
      console.log('No migrations have been executed yet.\n');
    } else {
      console.log('Executed migrations:');
      result.rows.forEach((row) => {
        const date = new Date(row.executed_at).toLocaleString();
        console.log(`  ✓ ${row.filename} (${date})`);
      });
      console.log(`\nTotal: ${result.rows.length} migration(s)\n`);
    }

    // Get pending migrations
    const executed = new Set(result.rows.map((r) => r.version));
    const all = getMigrationFiles();
    const pending = all.filter((m) => !executed.has(m.version));

    if (pending.length > 0) {
      console.log('Pending migrations:');
      pending.forEach((m) => {
        console.log(`  ⏳ ${m.filename}`);
      });
      console.log();
    } else {
      console.log('All migrations are up to date! ✅\n');
    }
  } catch (error) {
    console.error('Failed to get migration status:', error);
  } finally {
    await pool.end();
  }
}

// Main command handling
const command = process.argv[2] || 'migrate';

switch (command) {
  case 'migrate':
    runMigrations().catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
    break;

  case 'rollback':
    rollbackMigration().catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
    break;

  case 'status':
    showStatus().catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
    break;

  default:
    console.log(`
Usage: npm run migrate [command]

Commands:
  migrate  - Run all pending migrations (default)
  status   - Show migration status
  rollback - Rollback last migration (dev only)

Examples:
  npm run migrate
  npm run migrate status
  npm run migrate rollback
    `);
    process.exit(1);
}
