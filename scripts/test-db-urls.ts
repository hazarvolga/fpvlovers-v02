import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local manually
try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const firstEqual = trimmed.indexOf('=');
      if (firstEqual === -1) continue;
      const key = trimmed.slice(0, firstEqual).trim();
      let value = trimmed.slice(firstEqual + 1).trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
} catch (e) {
  console.error('Error loading .env.local manually:', e);
}

async function main() {
  console.log('Connecting to database...');
  console.log('Host:', process.env.DB_HOST);
  console.log('Database:', process.env.DB_DATABASE);

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionTimeoutMillis: 5000,
  });

  try {
    const result = await pool.query(
      `SELECT url, length(markdown) as md_len, status 
       FROM content_engine.raw_content 
       WHERE status = 'completed'
       LIMIT 50`
    );
    console.log(`Found ${result.rows.length} completed crawl rows:`);
    for (const row of result.rows) {
      console.log(`- ${row.url} (${row.md_len} bytes)`);
    }
  } catch (err) {
    console.error('Database connection failed:', err);
  } finally {
    await pool.end();
  }
}

main();
