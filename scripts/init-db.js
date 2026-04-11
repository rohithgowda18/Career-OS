import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Client } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("✅ Connected to database");

    // Read the SQL initialization script
    const sqlPath = path.join(__dirname, "../server/db-init.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    // Execute the SQL
    await client.query(sql);
    console.log("✅ Database initialized successfully");
    console.log("✅ All tables, enums, and indexes created");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error initializing database:");
    console.error("Error message:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initializeDatabase();
