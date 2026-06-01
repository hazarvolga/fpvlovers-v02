import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { query, getPool } from '../src/lib/server/db';

interface ContentJob {
  id: string;
}

interface CrawlJob {
  id: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');

function calculateHash(obj: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

// Load .env.local variables programmatically into process.env to ensure connection details are present
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

async function compare() {
  console.log('[Compare] Starting database operational parity comparison...');
  loadEnvLocal();

  // Validate database connection
  try {
    await query('SELECT 1');
  } catch (err) {
    console.error('[Compare] CRITICAL: Failed to connect to database.', err);
    process.exit(1);
  }

  let isHealthy = true;

  // 1. Compare Content Jobs
  const contentJobsFile = path.join(DATA_DIR, 'content-jobs.json');
  if (fs.existsSync(contentJobsFile)) {
    const fileJobs = JSON.parse(fs.readFileSync(contentJobsFile, 'utf-8')) as ContentJob[];
    const dbJobsRes = await query<{ id: string; legacy_file_hash: string | null }>(
      'SELECT id, legacy_file_hash FROM fpvlovers_app.content_jobs'
    );
    
    const dbJobsMap = new Map<string, string | null>();
    for (const row of dbJobsRes.rows) {
      dbJobsMap.set(row.id, row.legacy_file_hash);
    }

    console.log(`\n--- Content Jobs Parity Audit ---`);
    console.log(`JSON File Count: ${fileJobs.length}`);
    console.log(`Database Count:  ${dbJobsRes.rowCount}`);

    if (fileJobs.length !== dbJobsRes.rowCount) {
      console.warn(`[Compare] WARNING: Count mismatch in Content Jobs! File: ${fileJobs.length}, DB: ${dbJobsRes.rowCount}`);
      isHealthy = false;
    }

    let hashMismatches = 0;
    let missingInDb = 0;

    for (const job of fileJobs) {
      const dbHash = dbJobsMap.get(job.id);
      if (dbHash === undefined) {
        missingInDb++;
        isHealthy = false;
        console.warn(`- Content Job ${job.id} is missing in the database!`);
      } else {
        const fileHash = calculateHash(job);
        if (dbHash !== fileHash) {
          hashMismatches++;
          isHealthy = false;
          console.warn(`- Content Job ${job.id} has a hash mismatch! File: ${fileHash}, DB: ${dbHash}`);
        }
      }
    }

    console.log(`Parity Result: ${missingInDb === 0 && hashMismatches === 0 ? '✓ PERFECT PARITY' : '✗ DISCREPANCIES DETECTED'}`);
    console.log(`- Missing in DB:   ${missingInDb}`);
    console.log(`- Hash Mismatches: ${hashMismatches}`);
  }

  // 2. Compare Crawl Jobs
  const crawlQueueFile = path.join(DATA_DIR, 'crawl-queue.json');
  if (fs.existsSync(crawlQueueFile)) {
    const queueData = JSON.parse(fs.readFileSync(crawlQueueFile, 'utf-8')) as { jobs?: CrawlJob[] };
    const fileJobs = queueData.jobs || [];
    const dbJobsRes = await query<{ id: string; legacy_file_hash: string | null }>(
      'SELECT id, legacy_file_hash FROM fpvlovers_app.crawl_jobs'
    );
    
    const dbJobsMap = new Map<string, string | null>();
    for (const row of dbJobsRes.rows) {
      dbJobsMap.set(row.id, row.legacy_file_hash);
    }

    console.log(`\n--- Crawl Queue Parity Audit ---`);
    console.log(`JSON File Count: ${fileJobs.length}`);
    console.log(`Database Count:  ${dbJobsRes.rowCount}`);

    if (fileJobs.length !== dbJobsRes.rowCount) {
      console.warn(`[Compare] WARNING: Count mismatch in Crawl Queue! File: ${fileJobs.length}, DB: ${dbJobsRes.rowCount}`);
      isHealthy = false;
    }

    let hashMismatches = 0;
    let missingInDb = 0;

    for (const job of fileJobs) {
      const dbHash = dbJobsMap.get(job.id);
      if (dbHash === undefined) {
        missingInDb++;
        isHealthy = false;
        console.warn(`- Crawl Job ${job.id} is missing in the database!`);
      } else {
        const fileHash = calculateHash(job);
        if (dbHash !== fileHash) {
          hashMismatches++;
          isHealthy = false;
          console.warn(`- Crawl Job ${job.id} has a hash mismatch! File: ${fileHash}, DB: ${dbHash}`);
        }
      }
    }

    console.log(`Parity Result: ${missingInDb === 0 && hashMismatches === 0 ? '✓ PERFECT PARITY' : '✗ DISCREPANCIES DETECTED'}`);
    console.log(`- Missing in DB:   ${missingInDb}`);
    console.log(`- Hash Mismatches: ${hashMismatches}`);
  }

  // Close database pool connection
  try {
    const pool = getPool();
    await pool.end();
  } catch (endError) {
    console.error('[Compare] Error closing connection pool:', endError);
  }

  console.log(`\n======================================================`);
  console.log(`[Compare] Parity Audit Complete! Overall Status: ${isHealthy ? '✓ HEALTHY' : '✗ DIVERGED'}`);
  console.log(`======================================================\n`);
  
  if (!isHealthy) process.exit(1);
}

compare();
