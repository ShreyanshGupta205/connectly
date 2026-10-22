import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const sql = fs.readFileSync('docs/sql/002_agent_framework_schema.sql', 'utf-8');
  const client = await pool.connect();
  try {
    console.log('Running 002_agent_framework_schema.sql...');
    await client.query(sql);
    console.log('✅ Successfully applied 002_agent_framework_schema.sql migration to Supabase!');
    const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;");
    console.log('Current tables in Supabase:');
    for (const r of tables.rows) {
      console.log(`  * ${r.tablename}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
