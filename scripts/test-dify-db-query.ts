import { Pool } from 'pg';
import fs from 'fs';
const ENV_FILE = '.env.local';
if (fs.existsSync(ENV_FILE)) {
  const lines = fs.readFileSync(ENV_FILE, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const val = trimmed.slice(index + 1).trim();
    process.env[key] = val.replace(/^['"]|['"]$/g, '');
  }
}
const pool = new Pool({
  host: process.env.DB_HOST === '80.225.231.62' ? '127.0.0.1' : process.env.DB_HOST,
  port: process.env.DB_HOST === '80.225.231.62' ? 5435 : parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});
async function main() {
  const res = await pool.query("SELECT url, dataset_target FROM content_engine.raw_content WHERE status='failed'");
  console.log(res.rows);
  pool.end();
}
main();
