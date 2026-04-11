const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

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
    console.error("❌ Error initializing database:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initializeDatabase();
