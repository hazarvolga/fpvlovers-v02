import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { query, getPool } from '../src/lib/server/db';

interface ContentJob {
  id: string;
  status: string;
  briefSlug?: string;
  topic?: string;
  keyword?: string;
  intent?: string;
  language?: string;
  title?: string;
  brief?: Record<string, unknown>;
  draft?: Record<string, unknown>;
  publish_artifact?: Record<string, unknown>;
  error_message?: string;
  attempt_count?: number;
  scheduled_for?: string;
  started_at?: string;
  completed_at?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedPath?: string;
}

interface CrawlJob {
  id: string;
  url: string;
  dataset?: string;
  status: string;
  priority?: number;
  retries?: number;
  maxRetries?: number;
  error?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AutoRunFile {
  lastRun?: string;
  status?: string;
  summary?: Record<string, unknown>;
  error?: string;
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

async function backfill() {
  console.log('[Backfill] Starting database operational backfill process...');
  loadEnvLocal();

  // Validate database connection
  try {
    await query('SELECT 1');
    console.log('[Backfill] Successful database connection established.');
  } catch (err) {
    console.error('[Backfill] CRITICAL: Failed to connect to database. Is FPV_DATABASE_URL correct?', err);
    process.exit(1);
  }

  // 1. Backfill Content Jobs
  const contentJobsFile = path.join(DATA_DIR, 'content-jobs.json');
  if (fs.existsSync(contentJobsFile)) {
    const contentJobs = JSON.parse(fs.readFileSync(contentJobsFile, 'utf-8')) as ContentJob[];
    console.log(`[Backfill] Found ${contentJobs.length} content jobs in JSON file.`);

    let contentSuccess = 0;
    for (const job of contentJobs) {
      try {
        const legacyHash = calculateHash(job);
        
        await query(`
          INSERT INTO fpvlovers_app.content_jobs (
            id, status, topic, keyword, intent, language, title, slug, 
            brief, draft, publish_artifact, error_message, attempt_count, 
            scheduled_for, started_at, completed_at, created_at, updated_at, legacy_file_hash
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            topic = EXCLUDED.topic,
            keyword = EXCLUDED.keyword,
            intent = EXCLUDED.intent,
            language = EXCLUDED.language,
            title = EXCLUDED.title,
            slug = EXCLUDED.slug,
            brief = EXCLUDED.brief,
            draft = EXCLUDED.draft,
            publish_artifact = EXCLUDED.publish_artifact,
            error_message = EXCLUDED.error_message,
            attempt_count = EXCLUDED.attempt_count,
            scheduled_for = EXCLUDED.scheduled_for,
            started_at = EXCLUDED.started_at,
            completed_at = EXCLUDED.completed_at,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at,
            legacy_file_hash = EXCLUDED.legacy_file_hash;
        `, [
          job.id,
          job.status,
          job.topic || null,
          job.keyword || null,
          job.intent || null,
          job.language || 'en',
          job.title || null,
          job.briefSlug || null,
          job.brief || {},
          job.draft || {},
          job.publish_artifact || {},
          job.error_message || null,
          job.attempt_count || 0,
          job.scheduled_for ? new Date(job.scheduled_for) : null,
          job.started_at ? new Date(job.started_at) : null,
          job.completed_at ? new Date(job.completed_at) : null,
          job.createdAt ? new Date(job.createdAt) : new Date(),
          job.updatedAt ? new Date(job.updatedAt) : new Date(),
          legacyHash
        ]);
        contentSuccess++;
      } catch (err) {
        console.error(`[Backfill] Failed to insert content job ${job.id}:`, err);
      }
    }
    console.log(`[Backfill] Successfully backfilled ${contentSuccess}/${contentJobs.length} content jobs.`);
  }

  // 2. Backfill Crawl Jobs
  const crawlQueueFile = path.join(DATA_DIR, 'crawl-queue.json');
  if (fs.existsSync(crawlQueueFile)) {
    const queueData = JSON.parse(fs.readFileSync(crawlQueueFile, 'utf-8')) as { jobs?: CrawlJob[] };
    const crawlJobs = queueData.jobs || [];
    console.log(`[Backfill] Found ${crawlJobs.length} crawl jobs in JSON file.`);

    let crawlSuccess = 0;
    for (const job of crawlJobs) {
      try {
        const legacyHash = calculateHash(job);
        
        await query(`
          INSERT INTO fpvlovers_app.crawl_jobs (
            id, url, dataset_id, dataset_key, status, priority, source, 
            source_pack, retry_count, next_attempt_at, last_attempt_at, 
            completed_at, error_message, metadata, created_at, updated_at, legacy_file_hash
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (id) DO UPDATE SET
            url = EXCLUDED.url,
            dataset_id = EXCLUDED.dataset_id,
            dataset_key = EXCLUDED.dataset_key,
            status = EXCLUDED.status,
            priority = EXCLUDED.priority,
            source = EXCLUDED.source,
            source_pack = EXCLUDED.source_pack,
            retry_count = EXCLUDED.retry_count,
            next_attempt_at = EXCLUDED.next_attempt_at,
            last_attempt_at = EXCLUDED.last_attempt_at,
            completed_at = EXCLUDED.completed_at,
            error_message = EXCLUDED.error_message,
            metadata = EXCLUDED.metadata,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at,
            legacy_file_hash = EXCLUDED.legacy_file_hash;
        `, [
          job.id,
          job.url,
          job.dataset || null, // map 'dataset' to dataset_id (and optionally key)
          job.dataset || null,
          job.status,
          job.priority || 100,
          null, // source
          null, // source_pack
          job.retries || 0,
          null, // next_attempt_at
          job.updatedAt ? new Date(job.updatedAt) : null, // last_attempt_at
          job.status === 'completed' && job.updatedAt ? new Date(job.updatedAt) : null,
          job.error || null,
          { maxRetries: job.maxRetries || 3 },
          job.createdAt ? new Date(job.createdAt) : new Date(),
          job.updatedAt ? new Date(job.updatedAt) : new Date(),
          legacyHash
        ]);
        crawlSuccess++;
      } catch (err) {
        console.error(`[Backfill] Failed to insert crawl job ${job.id}:`, err);
      }
    }
    console.log(`[Backfill] Successfully backfilled ${crawlSuccess}/${crawlJobs.length} crawl jobs.`);
  }

  // 3. Backfill Automation Runs
  const contentAutoRunFile = path.join(DATA_DIR, 'content-last-auto-run.json');
  if (fs.existsSync(contentAutoRunFile)) {
    try {
      const runData = JSON.parse(fs.readFileSync(contentAutoRunFile, 'utf-8')) as AutoRunFile;
      if (runData.lastRun) {
        await query(`
          INSERT INTO fpvlovers_app.automation_runs (
            kind, status, started_at, finished_at, summary, error_message
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          'content-generation',
          runData.status || 'completed',
          new Date(runData.lastRun),
          new Date(runData.lastRun),
          runData.summary || {},
          runData.error || null
        ]);
        console.log('[Backfill] Successfully backfilled content-generation automation run log.');
      }
    } catch (err) {
      console.error('[Backfill] Failed to insert content-generation log:', err);
    }
  }

  const crawlAutoRunFile = path.join(DATA_DIR, 'crawl-last-auto-run.json');
  if (fs.existsSync(crawlAutoRunFile)) {
    try {
      const runData = JSON.parse(fs.readFileSync(crawlAutoRunFile, 'utf-8')) as AutoRunFile;
      if (runData.lastRun) {
        await query(`
          INSERT INTO fpvlovers_app.automation_runs (
            kind, status, started_at, finished_at, summary, error_message
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          'crawl-queue',
          runData.status || 'completed',
          new Date(runData.lastRun),
          new Date(runData.lastRun),
          runData.summary || {},
          runData.error || null
        ]);
        console.log('[Backfill] Successfully backfilled crawl-queue automation run log.');
      }
    } catch (err) {
      console.error('[Backfill] Failed to insert crawl-queue log:', err);
    }
  }

  // Close database pool connection
  try {
    const pool = getPool();
    await pool.end();
    console.log('[Backfill] Database connection pool closed.');
  } catch (endError) {
    console.error('[Backfill] Error closing connection pool:', endError);
  }

  console.log('[Backfill] Operational backfill process completed successfully!');
}

backfill();
