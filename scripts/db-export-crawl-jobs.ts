import { query, getPool } from '../src/lib/server/db';
import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_FILE = path.join(process.cwd(), 'data', 'crawl-queue.json');

async function dbExportCrawlJobs() {
  console.log('[Export Crawl Jobs] Querying crawl queue from PostgreSQL...');

  try {
    await query('SELECT 1');
  } catch (err: any) {
    console.warn('\n[Export Crawl Jobs] PostgreSQL database is offline. Skipping export gracefully.');
    console.log(`Database health detail: ${err.message}`);
    return;
  }

  try {
    const res = await query<any>(`
      SELECT 
        id, url, dataset_key as dataset, status, priority, retry_count as retries,
        created_at as "createdAt", updated_at as "updatedAt", next_attempt_at as "nextRetryAt",
        metadata->>'tokens' as tokens, metadata->>'docId' as "docId", error_message as error
      FROM fpvlovers_app.crawl_jobs
      ORDER BY created_at DESC
    `);

    const config = {
      batchSize: 3,
      batchDelayMs: 60000,
      maxConcurrent: 1,
      retryDelaysMs: [60000, 300000, 900000],
    };

    const jobs = res.rows.map(row => ({
      id: row.id,
      url: row.url,
      dataset: row.dataset || undefined,
      status: row.status,
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

    const stats = {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      throttled: jobs.filter(j => j.status === 'throttled').length,
    };

    const queueData = {
      jobs,
      config,
      stats
    };

    const dir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(queueData, null, 2) + '\n', 'utf-8');
    console.log(`[Export Crawl Jobs] Successfully exported ${jobs.length} crawl jobs to ${OUTPUT_FILE}`);
  } catch (err) {
    console.error('[Export Crawl Jobs] Export failed:', err);
  } finally {
    try {
      const pool = getPool();
      await pool.end();
      console.log('[Export Crawl Jobs] Database connection pool closed.');
    } catch (endError) {
      console.error('[Export Crawl Jobs] Error closing connection pool:', endError);
    }
  }
}

dbExportCrawlJobs();
