import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Pool } from 'pg';
import { getQueueStatus, updateJob, type CrawlJob } from '../src/lib/crawl-queue';
import {
  getRacingArtifactDir,
  readRacingCrawlArtifact,
  writeRacingCrawlArtifact,
} from '../src/lib/racing-crawl-artifacts';
import { readRacingSourcePack } from '../src/lib/racing-source-pack';

const ENV_FILE = path.join(process.cwd(), '.env.local');
const DATASET = 'fpv-racing-events';
const PRIMARY_ENDPOINT = 'http://161.118.171.201:3002/crawl';
const BACKUP_ENDPOINT = 'http://141.148.206.187/c4ai/crawl';

function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) return;
  for (const line of fs.readFileSync(ENV_FILE, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    process.env[key] = value;
  }
}

loadEnv();

function parseLimit() {
  const arg = process.argv.find((item) => item.startsWith('--limit='));
  const parsed = arg ? Number(arg.split('=')[1]) : 3;
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 10) : 3;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sourceNameForUrl(url: string) {
  return readRacingSourcePack().sources.find((source) => source.url === url)?.name;
}

function extractMarkdown(crawlData: unknown): { markdown: string; title?: string } {
  const record = crawlData && typeof crawlData === 'object' ? crawlData as Record<string, unknown> : {};
  const results = Array.isArray(record.results) ? record.results : [];
  const first = results[0] && typeof results[0] === 'object' ? results[0] as Record<string, unknown> : {};
  const markdownValue = first.markdown;
  let markdown = '';

  if (typeof markdownValue === 'string') {
    markdown = markdownValue;
  } else if (markdownValue && typeof markdownValue === 'object') {
    const markdownRecord = markdownValue as Record<string, unknown>;
    markdown = typeof markdownRecord.raw_markdown === 'string'
      ? markdownRecord.raw_markdown
      : typeof markdownRecord.markdown === 'string'
        ? markdownRecord.markdown
        : '';
  }

  const title = typeof first.title === 'string' ? first.title : undefined;
  return { markdown, title };
}

async function crawlWithEndpoint(job: CrawlJob, endpoint: string) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls: [job.url], priority: 10, markdown: true }),
    signal: AbortSignal.timeout(75000),
  });

  if (!response.ok) {
    throw new Error(`Crawler HTTP ${response.status}`);
  }

  const data = await response.json() as unknown;
  const record = data && typeof data === 'object' ? data as Record<string, unknown> : {};
  if (record.success === false) {
    throw new Error('Crawler returned success=false');
  }

  const { markdown, title } = extractMarkdown(data);
  if (markdown.trim().length < 200) {
    throw new Error(`Crawler content too short (${markdown.length} chars)`);
  }

  return { markdown, title };
}

async function crawlJob(job: CrawlJob) {
  const endpoints = [
    process.env.CRAWL4AI_PRIMARY_URL ? `${process.env.CRAWL4AI_PRIMARY_URL.replace(/\/$/, '')}/crawl` : PRIMARY_ENDPOINT,
    process.env.CRAWL4AI_BACKUP_URL ? `${process.env.CRAWL4AI_BACKUP_URL.replace(/\/$/, '')}/crawl` : BACKUP_ENDPOINT,
  ];

  let lastError: Error | undefined;
  for (const endpoint of endpoints) {
    try {
      console.log(`  crawling via ${endpoint}`);
      const result = await crawlWithEndpoint(job, endpoint);
      return { ...result, endpoint };
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error('Unknown crawler failure');
      console.log(`  endpoint failed: ${lastError.message}`);
    }
  }

  throw lastError || new Error('All crawler endpoints failed');
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

async function main() {
  const statusOnly = process.argv.includes('--status');
  const includeFailed = process.argv.includes('--include-failed');
  const limit = parseLimit();
  const queue = getQueueStatus();
  const racingJobs = queue.jobs.filter((job) => job.dataset === DATASET);
  const pendingJobs = racingJobs.filter((job) => job.status === 'pending' || (includeFailed && job.status === 'failed'));
  const completedJobs = racingJobs.filter((job) => job.status === 'completed');
  const failedJobs = racingJobs.filter((job) => job.status === 'failed');
  const artifactCount = racingJobs.filter((job) => readRacingCrawlArtifact(job.url)).length;

  console.log('\nFPVLovers Racing Crawl Queue Processor\n');
  console.log(`Queue: racing=${racingJobs.length}, pending=${racingJobs.filter((job) => job.status === 'pending').length}, completed=${completedJobs.length}, failed=${failedJobs.length}, artifacts=${artifactCount}`);
  console.log(`Retry failed jobs: ${includeFailed ? 'yes' : 'no'}`);
  console.log(`Artifact directory: ${getRacingArtifactDir()}`);

  if (statusOnly) return;
  if (pendingJobs.length === 0) {
    console.log('No pending racing jobs.');
    return;
  }

  const jobs = pendingJobs.slice(0, limit);
  console.log(`Processing ${jobs.length} racing job(s).`);

  for (const job of jobs) {
    console.log(`\n[${job.id}] ${job.url}`);
    updateJob(job.id, { status: 'processing' });

    try {
      const result = await crawlJob(job);
      
      // Save raw content to Dify PostgreSQL database
      await saveRawContentToDatabase(job.url, DATASET, result.markdown);

      const artifact = writeRacingCrawlArtifact({
        url: job.url,
        sourceName: sourceNameForUrl(job.url),
        dataset: DATASET,
        markdown: result.markdown,
        title: result.title,
        crawledAt: new Date().toISOString(),
        crawlerEndpoint: result.endpoint,
        contentLength: result.markdown.length,
      });

      updateJob(job.id, {
        status: 'completed',
        docId: `artifact-${artifact.url.slice(0, 18)}`,
        tokens: artifact.contentLength,
        error: undefined,
      });
      console.log(`  artifact saved (${artifact.contentLength} chars)`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown racing crawl failure';
      updateJob(job.id, { status: 'failed', error: message });
      console.log(`  failed: ${message}`);
    }

    await sleep(1500);
  }

  const updated = getQueueStatus();
  const updatedRacing = updated.jobs.filter((job) => job.dataset === DATASET);
  console.log('\nUpdated racing queue:', {
    pending: updatedRacing.filter((job) => job.status === 'pending').length,
    completed: updatedRacing.filter((job) => job.status === 'completed').length,
    failed: updatedRacing.filter((job) => job.status === 'failed').length,
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown racing crawl processor failure';
  console.error(message);
  process.exit(1);
});
