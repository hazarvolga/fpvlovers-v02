import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Pool } from 'pg';

const QUEUE_FILE = path.join(process.cwd(), 'data', 'crawl-queue.json');
const ENV_FILE = path.join(process.cwd(), '.env.local');

// ─── LOAD ENV VARIABLES ───
function loadEnv() {
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
}

loadEnv();

const DIFY_BASE = process.env.DIFY_BASE_URL || 'https://dify.affexai.tr/v1';
const DIFY_API_KEY = process.env.DIFY_API_KEY;
const CRAWLER_ENDPOINT = process.env.CRAWL4AI_PRIMARY_CRAWL_URL || 'http://161.118.171.201:3002/crawl';

const DATASET_IDS: Record<string, string> = {
  'fpv-flight-tuning': 'd1d5e44b-4dde-445a-a686-67a1cc0d926c',
  'fpv-news-reviews': '6a8a84c8-46ca-43f0-a3ea-3c19f32f5a17',
  'fpv-components-specs': '38bb7d60-b921-440c-b8f4-e49f9982a61f',
  'fpv-community-knowledge': '639af5aa-d424-4d0b-9633-a7ab541afcb2',
  'fpv-racing-events': 'cd17b1ea-a852-4d31-87d7-1b4c0bd46e7f',
  'fpv-build-guides': 'a733583a-5e50-4e00-8b50-759380da59db',
  'fpv-troubleshooting': '9b380b45-1be1-4ba6-b685-72e279e09ccc',
  'fpv-pid-profiles': '3eacd19f-ccd8-49ec-8482-51120918f0e0',
  'fpv-regulations': '229be183-217b-4f93-ba48-9cdabbd1e37f',
};

// ─── TYPES ───
interface CrawlJob {
  id: string;
  url: string;
  dataset?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'throttled';
  priority: number;
  retries: number;
  maxRetries: number;
  error?: string;
  tokens?: number;
  docId?: string;
  createdAt: string;
  updatedAt: string;
  nextRetryAt?: string;
}

interface CrawlQueue {
  jobs: CrawlJob[];
  config: {
    batchSize: number;
    batchDelayMs: number;
    maxConcurrent: number;
    retryDelaysMs: number[];
  };
  stats: {
    total: number;
    pending: number;
    completed: number;
    failed: number;
    throttled: number;
  };
}

function loadQueue(): CrawlQueue {
  if (fs.existsSync(QUEUE_FILE)) {
    return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
  }
  throw new Error('Crawl queue file not found.');
}

function saveQueue(q: CrawlQueue) {
  q.stats = {
    total: q.jobs.length,
    pending: q.jobs.filter(j => j.status === 'pending').length,
    completed: q.jobs.filter(j => j.status === 'completed').length,
    failed: q.jobs.filter(j => j.status === 'failed').length,
    throttled: q.jobs.filter(j => j.status === 'throttled').length,
  };
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(q, null, 2) + '\n');
}

async function sha256(text: string): Promise<string> {
  return crypto.createHash('sha256').update(text).digest('hex');
}

async function saveRawContentToDatabase(url: string, dataset: string, markdown: string) {
  if (!process.env.DB_HOST || !process.env.DB_DATABASE) {
    console.log('- [DB] Skipping raw content save: DB environment variables not configured.');
    return;
  }

  const host = process.env.DB_HOST === '80.225.231.62' && process.env.NODE_ENV !== 'production' 
    ? '127.0.0.1' 
    : process.env.DB_HOST;
  const port = process.env.DB_HOST === '80.225.231.62' && process.env.NODE_ENV !== 'production'
    ? 5435
    : parseInt(process.env.DB_PORT || '5432', 10);

  const pool = new Pool({
    host,
    port,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionTimeoutMillis: 5000,
  });

  try {
    const urlHash = crypto.createHash('sha256').update(url).digest('hex');
    let domain = 'unknown';
    try {
      domain = new URL(url).hostname.replace(/^www\./, '');
    } catch {}

    console.log(`- [DB] Saving raw content to Dify DB (host: ${host}:${port}, hash: ${urlHash.slice(0, 8)}...)`);
    await pool.query(
      `INSERT INTO content_engine.raw_content (
        url, url_hash, domain, dataset_target, raw_markdown, is_active, updated_at
      ) VALUES ($1, $2, $3, $4, $5, true, NOW())
      ON CONFLICT (url_hash) DO UPDATE SET
        raw_markdown = EXCLUDED.raw_markdown,
        is_active = true,
        updated_at = NOW()`,
      [url, urlHash, domain, dataset, markdown]
    );
    console.log('- [DB] Raw content saved successfully.');
  } catch (err: any) {
    console.error(`- [DB] Failed to save raw content: ${err.message}`);
  } finally {
    await pool.end();
  }
}

async function processQueue() {
  console.log('--- STARTING CRAWL QUEUE CONSUMER ---');
  if (!DIFY_API_KEY) {
    console.error('Error: DIFY_API_KEY is not configured in .env.local.');
    process.exit(1);
  }

  const isDryRun = process.env.CRAWL_DRY_RUN === 'true';
  if (isDryRun) {
    console.log('>>> CRAWL DRY RUN IS ACTIVE. DIFY UPLOAD WILL BE SKIPPED TO PRESERVE EMBEDDING BUDGET. <<<');
  }

  const queue = loadQueue();
  const pendingJobs = queue.jobs.filter(j => j.status === 'pending');

  if (pendingJobs.length === 0) {
    console.log('No pending crawl jobs found in the queue.');
    return;
  }

  console.log(`Found ${pendingJobs.length} pending job(s) in queue.`);
  const batchSize = 25;
  const jobsToProcess = pendingJobs.slice(0, batchSize);

  console.log(`Processing batch of ${jobsToProcess.length} job(s)...`);

  for (const job of jobsToProcess) {
    console.log(`\n[Job ${job.id}] URL: ${job.url}`);
    
    // Set status to processing
    job.status = 'processing';
    job.updatedAt = new Date().toISOString();
    saveQueue(queue);

    try {
      // 1. Crawl the URL using the backup crawler
      console.log(`- Crawling via Server C: ${CRAWLER_ENDPOINT}`);
      const crawlResp = await fetch(CRAWLER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: [job.url], priority: 10, markdown: true }),
        signal: AbortSignal.timeout(60000),
      });

      if (!crawlResp.ok) {
        throw new Error(`Crawler HTTP ${crawlResp.status}`);
      }

      const crawlData = await crawlResp.json();
      if (!crawlData.success || !crawlData.results?.length) {
        throw new Error('Crawler returned unsuccessful or empty result.');
      }

      const crawlResult = crawlData.results[0];
      const markdown = crawlResult.markdown?.raw_markdown || crawlResult.markdown || '';
      
      if (typeof markdown !== 'string' || markdown.length < 200) {
        throw new Error(`Crawl succeeded but content is too short (${markdown.length} chars)`);
      }

      console.log(`- Crawl succeeded! Length: ${markdown.length} characters.`);

      // Save raw content to Dify PostgreSQL database
      await saveRawContentToDatabase(job.url, job.dataset || 'fpv-community-knowledge', markdown);

      // 2. Route the dataset name to UUID
      const datasetName = job.dataset || 'fpv-community-knowledge';
      const dsId = DATASET_IDS[datasetName];

      if (!dsId) {
        throw new Error(`Unknown dataset name: ${datasetName}`);
      }

      console.log(`- Routing to dataset: "${datasetName}" (${dsId})`);

      // 3. Upsert to Dify Dataset
      const urlHash = await sha256(job.url);

      if (isDryRun) {
        console.log(`- [DRY RUN] Would upload to Dify: ${DIFY_BASE}/datasets/${dsId}/document/create-by-text`);
        console.log(`- [DRY RUN] Text Length: ${markdown.length} characters.`);
        console.log(`- [DRY RUN] Status set to COMPLETED (Dry Run).`);
        job.status = 'completed';
        job.docId = `dry-${urlHash.slice(0, 12)}`;
        job.tokens = markdown.length;
        job.error = undefined;
      } else {
        console.log(`- Uploading to Dify: ${DIFY_BASE}/datasets/${dsId}/document/create-by-text`);
        
        const difyResp = await fetch(`${DIFY_BASE}/datasets/${dsId}/document/create-by-text`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DIFY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: urlHash.slice(0, 32),
            text: markdown.slice(0, 8000), // safe Dify chunk size
            doc_metadata: { source_url: job.url, url_hash: urlHash },
            indexing_technique: 'high_quality',
            process_rule: { mode: 'automatic' },
          }),
          signal: AbortSignal.timeout(30000),
        });

        if (!difyResp.ok) {
          const errorText = await difyResp.text();
          throw new Error(`Dify upload failed (HTTP ${difyResp.status}): ${errorText}`);
        }

        const doc = await difyResp.json();
        const docId = doc.document?.id || 'unknown';
        console.log(`- Success! Ingested into Dify. Document ID: ${docId}`);

        // Update job to completed
        job.status = 'completed';
        job.docId = docId.slice(0, 16);
        job.tokens = markdown.length;
        job.error = undefined;
      }
    } catch (err: any) {
      console.error(`- Error processing job: ${err.message}`);
      job.status = 'failed';
      job.error = err.message;
    }

    job.updatedAt = new Date().toISOString();
    saveQueue(queue);
  }

  const updatedQueue = loadQueue();
  console.log(`\n--- BATCH COMPLETED ---`);
  console.log(`Queue Stats: total=${updatedQueue.stats.total}, pending=${updatedQueue.stats.pending}, completed=${updatedQueue.stats.completed}, failed=${updatedQueue.stats.failed}`);
}

processQueue();
