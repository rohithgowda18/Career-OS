import pg from "pg";
import "dotenv/config";

async function testDb() {
  console.log("Testing DB connection...");
  console.log("DATABASE_URL:", process.env.DATABASE_URL);
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    console.log("Connected to DB successfully");
    const res = await client.query('SELECT NOW()');
    console.log("Query result:", res.rows[0]);
    client.release();
  } catch (err) {
    console.error("DB connection error:", err);
  } finally {
    await pool.end();
  }
}

testDb();
