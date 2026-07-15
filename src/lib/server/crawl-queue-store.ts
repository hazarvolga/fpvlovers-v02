import { query, getClient } from './db';
import { resolveCrawlRetryStatus, type CrawlJob, type CrawlQueue } from '../crawl-queue';
import { getCrawlQueueStorageMode } from './storage-mode';
import * as fs from 'fs';
import * as path from 'path';
import { safeReadJson } from '@/lib/utils/json';

const QUEUE_FILE = path.join(process.cwd(), 'data', 'crawl-queue.json');

// --- FILE IMPLEMENTATIONS ---
function calculateFileStats(jobs: CrawlJob[]): CrawlQueue['stats'] {
  return {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    throttled: jobs.filter(j => j.status === 'throttled').length,
    retired: jobs.filter(j => j.status === 'retired').length,
  };
}

function fileLoad(): CrawlQueue {
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      const queue = safeReadJson<any>(QUEUE_FILE, null) as CrawlQueue;
      return {
        ...queue,
        stats: calculateFileStats(queue.jobs || []),
      };
    }
  } catch {}
  return {
    jobs: [], config: {
      batchSize: 3, batchDelayMs: 60000,
      maxConcurrent: 1,
      retryDelaysMs: [60000, 300000, 900000],
    }, stats: { total: 0, pending: 0, completed: 0, failed: 0, throttled: 0, retired: 0 },
  };
}

function fileSave(q: CrawlQueue) {
  q.stats = calculateFileStats(q.jobs);
  try { fs.writeFileSync(QUEUE_FILE, `${JSON.stringify(q, null, 2)}\n`); } catch {}
}

// --- DATABASE IMPLEMENTATIONS ---
async function dbEnqueueUrls(urls: string[], dataset?: string): Promise<CrawlJob[]> {
  const newJobs: CrawlJob[] = [];
  const now = new Date();

  // Try to acquire client for transaction
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    for (const url of urls) {
      // Check if already pending/processing
      const checkRes = await client.query(
        'SELECT id FROM fpvlovers_app.crawl_jobs WHERE url = $1 AND dataset_key = $2 AND status = $3',
        [url, dataset || null, 'pending']
      );

      if (checkRes.rowCount && checkRes.rowCount > 0) continue;

      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const job: CrawlJob = {
        id,
        url,
        dataset,
        status: 'pending',
        priority: 0,
        retries: 0,
        maxRetries: 3, // default
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };

      await client.query(`
        INSERT INTO fpvlovers_app.crawl_jobs (
          id, url, dataset_id, dataset_key, status, priority, retry_count, next_attempt_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        job.id,
        job.url,
        dataset || null,
        dataset || null,
        job.status,
        job.priority,
        job.retries,
        now, // next attempt immediately
        now,
        now
      ]);

      newJobs.push(job);
    }
    
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[DB Store] Failed to enqueue URLs in database:', err);
  } finally {
    client.release();
  }

  return newJobs;
}

interface DbCrawlJobRow {
  id: string;
  url: string;
  dataset: string | null;
  status: string;
  priority: number | null;
  retries: number | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  nextRetryAt: string | Date | null;
  tokens?: string | null;
  docId?: string | null;
  error?: string | null;
}

async function dbGetNextBatch(batchSize: number, retryDelaysMs: number[]): Promise<CrawlJob[]> {
  const now = new Date();
  try {
    // Select eligible jobs with row lock to support multiple concurrent crawlers
    const res = await query<DbCrawlJobRow>(`
      SELECT 
        id, url, dataset_key as dataset, status, priority, retry_count as retries,
        created_at as "createdAt", updated_at as "updatedAt", next_attempt_at as "nextRetryAt"
      FROM fpvlovers_app.crawl_jobs
      WHERE status = 'pending' 
         OR (status = 'throttled' AND next_attempt_at <= $1)
      ORDER BY priority DESC, created_at ASC
      LIMIT $2
      FOR UPDATE SKIP LOCKED
    `, [now, batchSize]);

    return res.rows.map((row: DbCrawlJobRow) => ({
      id: row.id,
      url: row.url,
      dataset: row.dataset || undefined,
      status: row.status as CrawlJob['status'],
      priority: row.priority || 0,
      retries: row.retries || 0,
      maxRetries: retryDelaysMs.length,
      createdAt: new Date(row.createdAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString(),
      nextRetryAt: row.nextRetryAt ? new Date(row.nextRetryAt).toISOString() : undefined
    }));
  } catch (err) {
    console.error('[DB Store] Failed to fetch next crawl batch:', err);
    return [];
  }
}

async function dbUpdateJob(id: string, update: Partial<CrawlJob>, retryDelaysMs: number[]): Promise<void> {
  const now = new Date();
  
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Fetch existing job state for auto-retry logic
    const currentRes = await client.query(
      'SELECT retry_count FROM fpvlovers_app.crawl_jobs WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (currentRes.rowCount === 0) {
      await client.query('COMMIT');
      return;
    }

    const current = currentRes.rows[0];
    let nextAttemptAt: Date | null = null;
    let retries = current.retry_count;
    let effectiveStatus = update.status;

    if (update.status === 'throttled') {
      const maxRetries = retryDelaysMs.length;
      effectiveStatus = resolveCrawlRetryStatus(retries, maxRetries);
      if (effectiveStatus === 'throttled') {
        const delay = retryDelaysMs[retries] || retryDelaysMs[retryDelaysMs.length - 1];
        nextAttemptAt = new Date(Date.now() + delay);
        retries++;
      }
    }

    // Build update parameters dynamically
    const fieldsToUpdate: string[] = ['updated_at = $2'];
    const params: unknown[] = [id, now];
    let paramIndex = 3;

    if (effectiveStatus) {
      fieldsToUpdate.push(`status = $${paramIndex++}`);
      params.push(effectiveStatus);
    }
    if (update.error) {
      fieldsToUpdate.push(`error_message = $${paramIndex++}`);
      params.push(update.error);
    }
    let metadataExpression = `COALESCE(metadata, '{}'::jsonb)`;
    let metadataChanged = false;
    if (update.tokens !== undefined) {
      metadataExpression = `jsonb_set(${metadataExpression}, '{tokens}', to_jsonb($${paramIndex++}::integer), true)`;
      params.push(update.tokens);
      metadataChanged = true;
    }
    if (update.docId) {
      metadataExpression = `jsonb_set(${metadataExpression}, '{docId}', to_jsonb($${paramIndex++}::text), true)`;
      params.push(update.docId);
      metadataChanged = true;
    }
    if (metadataChanged) {
      fieldsToUpdate.push(`metadata = ${metadataExpression}`);
    }

    if (update.status === 'throttled') {
      fieldsToUpdate.push(`retry_count = $${paramIndex++}`);
      params.push(retries);
      if (nextAttemptAt) {
        fieldsToUpdate.push(`next_attempt_at = $${paramIndex++}`);
        params.push(nextAttemptAt);
      } else fieldsToUpdate.push('next_attempt_at = NULL');
    } else if (update.status === 'completed' || update.status === 'retired') {
      fieldsToUpdate.push(`completed_at = $${paramIndex++}`);
      params.push(now);
      fieldsToUpdate.push('next_attempt_at = NULL');
      if (update.status === 'completed') fieldsToUpdate.push('error_message = NULL');
    }

    await client.query(`
      UPDATE fpvlovers_app.crawl_jobs
      SET ${fieldsToUpdate.join(', ')}
      WHERE id = $1
    `, params);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`[DB Store] Failed to update crawl job ${id}:`, err);
    throw err;
  } finally {
    client.release();
  }
}

async function dbGetQueueStatus(config: CrawlQueue['config']): Promise<CrawlQueue> {
  try {
    const res = await query<DbCrawlJobRow>(`
      SELECT 
        id, url, dataset_key as dataset, status, priority, retry_count as retries,
        created_at as "createdAt", updated_at as "updatedAt", next_attempt_at as "nextRetryAt",
        metadata->>'tokens' as tokens, metadata->>'docId' as "docId", error_message as error
      FROM fpvlovers_app.crawl_jobs
      ORDER BY created_at DESC
    `);

    const jobs: CrawlJob[] = res.rows.map((row: DbCrawlJobRow) => ({
      id: row.id,
      url: row.url,
      dataset: row.dataset || undefined,
      status: row.status as CrawlJob['status'],
      priority: row.priority || 0,
      retries: row.retries || 0,
      maxRetries: config.retryDelaysMs.length,
      error: row.error || undefined,
      tokens: row.tokens ? parseInt(row.tokens, 10) : undefined,
      docId: row.docId || undefined,
      createdAt: new Date(row.createdAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString(),
      nextRetryAt: row.nextRetryAt ? new Date(row.nextRetryAt).toISOString() : undefined
    }));

    return {
      jobs,
      config,
      stats: calculateFileStats(jobs)
    };
  } catch (err) {
    console.error('[DB Store] Failed to get queue status from database:', err);
    return {
      jobs: [],
      config,
      stats: { total: 0, pending: 0, completed: 0, failed: 0, throttled: 0, retired: 0 }
    };
  }
}

async function dbClearQueue(): Promise<void> {
  try {
    await query('DELETE FROM fpvlovers_app.crawl_jobs');
    console.log('[DB Store] Crawl queue cleared successfully.');
  } catch (err) {
    console.error('[DB Store] Failed to clear crawl queue in database:', err);
  }
}

// --- ORCHESTRATED STORE API ---

export async function enqueueUrlsAsync(urls: string[], dataset?: string): Promise<CrawlJob[]> {
  const mode = getCrawlQueueStorageMode();
  
  if (mode === 'postgres') {
    return dbEnqueueUrls(urls, dataset);
  }

  if (mode === 'dual') {
    // 1. Write to files first
    const q = fileLoad();
    const newJobs: CrawlJob[] = [];
    
    for (const url of urls) {
      const existing = q.jobs.find(j => j.url === url && j.status === 'pending');
      if (existing) continue;

      const job: CrawlJob = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        url,
        dataset,
        status: 'pending',
        priority: 0,
        retries: 0,
        maxRetries: q.config.retryDelaysMs.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      q.jobs.unshift(job);
      newJobs.push(job);
    }
    
    fileSave(q);

    // 2. Dual-write to DB in background
    Promise.resolve().then(async () => {
      try {
        await dbEnqueueUrls(urls, dataset);
      } catch (dbErr) {
        console.warn('[DB Dual-Write] Crawl queue enqueue background write failed:', dbErr);
      }
    });

    return newJobs;
  }

  // default mode: files
  const q = fileLoad();
  const newJobs: CrawlJob[] = [];

  for (const url of urls) {
    const existing = q.jobs.find(j => j.url === url && j.status === 'pending');
    if (existing) continue;

    const job: CrawlJob = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      url,
      dataset,
      status: 'pending',
      priority: 0,
      retries: 0,
      maxRetries: q.config.retryDelaysMs.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    q.jobs.unshift(job);
    newJobs.push(job);
  }

  fileSave(q);
  return newJobs;
}

export async function getNextBatchAsync(): Promise<CrawlJob[]> {
  const mode = getCrawlQueueStorageMode();
  const q = fileLoad();

  if (mode === 'postgres') {
    return dbGetNextBatch(q.config.batchSize, q.config.retryDelaysMs);
  }

  // default: files (also used in dual mode for read safety)
  const now = Date.now();
  const pending = q.jobs
    .filter(j => j.status === 'pending' || (j.status === 'throttled' && j.nextRetryAt && new Date(j.nextRetryAt).getTime() <= now))
    .sort((a, b) => b.priority - a.priority || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return pending.slice(0, q.config.batchSize);
}

export async function updateJobAsync(id: string, update: Partial<CrawlJob>): Promise<void> {
  const mode = getCrawlQueueStorageMode();
  const q = fileLoad();

  // Log crawl events to database in background
  if (update.status === 'completed' || update.status === 'failed' || update.status === 'retired') {
    Promise.resolve().then(async () => {
      try {
        const { logAnalyticsEvent } = await import('./analytics-store');
        await logAnalyticsEvent({
          eventType: update.status === 'completed' ? 'crawl_complete' : update.status === 'retired' ? 'crawl_retired' : 'crawl_failed',
          source: 'crawler',
          metadata: {
            jobId: id,
            error: update.error,
            tokens: update.tokens
          }
        });
      } catch (dbErr) {
        console.warn('[DB Analytics] Failed to log crawl event in background:', dbErr);
      }
    });
  }

  if (mode === 'postgres') {
    return dbUpdateJob(id, update, q.config.retryDelaysMs);
  }

  if (mode === 'dual') {
    // 1. Update file first
    const job = q.jobs.find(j => j.id === id);
    if (job) {
      Object.assign(job, { ...update, updatedAt: new Date().toISOString() });
      if (update.status === 'throttled' && job.retries < job.maxRetries) {
        const delay = q.config.retryDelaysMs[job.retries] || q.config.retryDelaysMs[q.config.retryDelaysMs.length - 1];
        job.nextRetryAt = new Date(Date.now() + delay).toISOString();
        job.retries++;
      }
      fileSave(q);
    }

    // 2. Dual-write to DB in background
    Promise.resolve().then(async () => {
      try {
        await dbUpdateJob(id, update, q.config.retryDelaysMs);
      } catch (dbErr) {
        console.warn('[DB Dual-Write] Crawl job update background write failed:', dbErr);
      }
    });
    return;
  }

  // default mode: files
  const job = q.jobs.find(j => j.id === id);
  if (!job) return;

  Object.assign(job, { ...update, updatedAt: new Date().toISOString() });

  if (update.status === 'throttled' && job.retries < job.maxRetries) {
    const delay = q.config.retryDelaysMs[job.retries] || q.config.retryDelaysMs[q.config.retryDelaysMs.length - 1];
    job.nextRetryAt = new Date(Date.now() + delay).toISOString();
    job.retries++;
  }

  fileSave(q);
}

export async function getQueueStatusAsync(): Promise<CrawlQueue> {
  const mode = getCrawlQueueStorageMode();
  const q = fileLoad();
  
  if (mode === 'postgres') {
    return dbGetQueueStatus(q.config);
  }
  return q;
}

export async function clearQueueAsync(): Promise<void> {
  const mode = getCrawlQueueStorageMode();
  const q = fileLoad();

  if (mode === 'postgres') {
    return dbClearQueue();
  }

  if (mode === 'dual') {
    // 1. Clear files
    fileSave({ jobs: [], config: q.config, stats: { total: 0, pending: 0, completed: 0, failed: 0, throttled: 0, retired: 0 } });
    
    // 2. Dual-clear DB in background
    Promise.resolve().then(async () => {
      try {
        await dbClearQueue();
      } catch (dbErr) {
        console.warn('[DB Dual-Write] Clear queue background action failed:', dbErr);
      }
    });
    return;
  }

  // default: files
  fileSave({ jobs: [], config: q.config, stats: { total: 0, pending: 0, completed: 0, failed: 0, throttled: 0, retired: 0 } });
}
