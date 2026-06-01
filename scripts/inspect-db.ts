import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

async function main() {
  loadEnvLocal();
  console.log('Connecting to PostgreSQL at:', process.env.DB_HOST);

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionTimeoutMillis: 5000,
  });

  try {
    // 1. Get column names and types
    const columnsRes = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'content_engine' AND table_name = 'raw_content';
    `);
    console.log('\n--- Columns of content_engine.raw_content ---');
    console.log(columnsRes.rows);

    // 2. Count records by status or active
    const countRes = await pool.query(`
      SELECT COUNT(*) as total FROM content_engine.raw_content;
    `);
    console.log('\nTotal records in raw_content:', countRes.rows[0].total);

    // Try counting where status = 'failed' if status column exists
    const hasStatus = columnsRes.rows.some(col => col.column_name === 'status');
    if (hasStatus) {
      const failedRes = await pool.query(`
        SELECT status, COUNT(*) as count 
        FROM content_engine.raw_content 
        GROUP BY status;
      `);
      console.log('\nCounts grouped by status:');
      console.log(failedRes.rows);
    } else {
      console.log('\nNo "status" column found.');
    }

  } catch (error) {
    console.error('Error during database inspection:', error);
  } finally {
    await pool.end();
  }
}

main();
