import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Pool } from 'pg';

const QUEUE_FILE = path.join(process.cwd(), 'data', 'crawl-queue.json');
const RACING_DIR = path.join(process.cwd(), 'data', 'racing-crawl-artifacts');

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

  if (!process.env.DB_HOST || !process.env.DB_DATABASE) {
    console.error('Error: DB environment variables not configured in .env.local.');
    process.exit(1);
  }

  // Connect to DB (support tunnel local redirection)
  const host = process.env.DB_HOST === '80.225.231.62' && process.env.NODE_ENV !== 'production' 
    ? '127.0.0.1' 
    : process.env.DB_HOST;
  const port = process.env.DB_HOST === '80.225.231.62' && process.env.NODE_ENV !== 'production'
    ? 5435
    : parseInt(process.env.DB_PORT || '5432', 10);

  console.log(`Connecting to Dify PostgreSQL at ${host}:${port}...`);
  const pool = new Pool({
    host,
    port,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionTimeoutMillis: 5000,
  });

  try {
    // 1. Backfill Racing Crawl Artifacts (Local JSON files)
    if (fs.existsSync(RACING_DIR)) {
      const files = fs.readdirSync(RACING_DIR).filter(f => f.endsWith('.json'));
      console.log(`Found ${files.length} racing crawl artifacts.`);
      for (const file of files) {
        const filePath = path.join(RACING_DIR, file);
        const art = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (art.url && art.markdown) {
          const urlHash = crypto.createHash('sha256').update(art.url).digest('hex');
          let domain = 'unknown';
          try {
            domain = new URL(art.url).hostname.replace(/^www\./, '');
          } catch {}

          console.log(`Backfilling racing artifact: ${art.url} (${urlHash.slice(0, 8)})`);
          await pool.query(
            `INSERT INTO content_engine.raw_content (
              url, url_hash, domain, dataset_target, raw_markdown, is_active, updated_at
            ) VALUES ($1, $2, $3, $4, $5, true, NOW())
            ON CONFLICT (url_hash) DO UPDATE SET
              raw_markdown = EXCLUDED.raw_markdown,
              is_active = true,
              updated_at = NOW()`,
            [art.url, urlHash, domain, 'fpv-racing-events', art.markdown]
          );
        }
      }
      console.log('✓ Racing crawl artifacts backfilled successfully.');
    } else {
      console.log('No racing crawl artifacts directory found.');
    }

    // 2. Reset other completed crawl queue jobs to pending (so they will be re-crawled and saved to DB)
    if (fs.existsSync(QUEUE_FILE)) {
      const q = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
      let resetCount = 0;

      for (const job of q.jobs) {
        // Skip racing events as we already backfilled them, and only reset non-racing completed jobs
        if (job.status === 'completed' && job.dataset !== 'fpv-racing-events') {
          console.log(`Resetting crawl queue job ${job.id}: ${job.url} (${job.dataset})`);
          job.status = 'pending';
          delete job.docId;
          delete job.tokens;
          job.updatedAt = new Date().toISOString();
          resetCount++;
        }
      }

      if (resetCount > 0) {
        q.stats = {
          total: q.jobs.length,
          pending: q.jobs.filter((j: any) => j.status === 'pending').length,
          completed: q.jobs.filter((j: any) => j.status === 'completed').length,
          failed: q.jobs.filter((j: any) => j.status === 'failed').length,
          throttled: q.jobs.filter((j: any) => j.status === 'throttled').length,
        };
        fs.writeFileSync(QUEUE_FILE, JSON.stringify(q, null, 2) + '\n');
        console.log(`✓ Reset ${resetCount} completed crawl jobs back to pending!`);
      } else {
        console.log('No completed non-racing crawl jobs found to reset.');
      }
    } else {
      console.error('Queue file not found:', QUEUE_FILE);
    }

  } catch (error) {
    console.error('Error during backfill/reset:', error);
  } finally {
    await pool.end();
  }
}

main();
