import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { safeReadJson } from '@/lib/utils/json';
import { authorizeCronRequest } from '@/lib/cron-auth';
import { enqueueUrlsNew, getQueueStatusNew } from '@/lib/crawl-queue';
import { logAutomationRun } from '@/lib/server/automation-runs-store';
import { processCrawlQueueBatch } from '@/lib/content-automation/crawl-worker';

const BACKLOG_FILE = path.join(process.cwd(), 'data', 'fpv-rag-source-backlog.json');
const LAST_RUN_FILE = path.join(process.cwd(), 'data', 'crawl-last-auto-run.json');
const MAX_AUTO_ENQUEUE_PER_RUN = 3;

type BacklogItem = {
  name: string;
  url: string;
  desired_dataset: string;
  priority: string;
  status: string;
};

function groupByDataset(items: BacklogItem[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  for (const item of items) {
    const urls = grouped.get(item.desired_dataset) || [];
    urls.push(item.url);
    grouped.set(item.desired_dataset, urls);
  }
  return grouped;
}

export async function GET(req: Request) {
  const auth = authorizeCronRequest(req);
  if (!auth.authorized) return auth.response;

  try {
    const requestUrl = new URL(req.url);
    const workerDryRun = requestUrl.searchParams.get('dry_run') === 'true';
    const backlog = safeReadJson<any>(BACKLOG_FILE, { sources: [] });
    const sources: BacklogItem[] = backlog.sources || [];
    const missing = sources.filter((s) => s.status === 'missing' || s.status === 'crawl_error');
    const deferred = sources.filter((s) => s.status === 'deferred');

    if (missing.length === 0 && deferred.length === 0) {
      const worker = await processCrawlQueueBatch({
        enabled: workerDryRun ? true : undefined,
        dryRun: workerDryRun,
        maxJobs: 1,
      });
      const summary = {
        total: sources.length,
        present: sources.filter((s) => s.status === 'present').length,
        missing: 0,
        errors: sources.filter((s) => s.status === 'crawl_error').length,
      };

      // Log to database in background
      Promise.resolve().then(async () => {
        try {
          await logAutomationRun({
            kind: 'crawl',
            status: 'noop',
            summary
          });
        } catch (dbErr) {
          console.warn('[DB Status Log] Failed to log crawl noop run:', dbErr);
        }
      });

      return NextResponse.json({
        success: true,
        action: 'noop',
        message: 'No pending crawl jobs. Backlog is up to date.',
        stats: summary,
        worker,
      });
    }

    const batch = missing.slice(0, MAX_AUTO_ENQUEUE_PER_RUN);
    const grouped = groupByDataset(batch);
    const results: { url: string; dataset: string; status: string; jobId?: string }[] = [];

    for (const [dataset, urls] of grouped.entries()) {
      const jobs = await enqueueUrlsNew(urls, dataset);
      const createdByUrl = new Map(jobs.map((job) => [job.url, job.id]));
      for (const url of urls) {
        results.push({
          url,
          dataset,
          status: createdByUrl.has(url) ? 'enqueued' : 'already_pending',
          jobId: createdByUrl.get(url),
        });
      }
    }

    const enqueuedCount = results.filter((r) => r.status === 'enqueued').length;
    const alreadyPendingCount = results.filter((r) => r.status === 'already_pending').length;
    const queueStats = (await getQueueStatusNew()).stats;
    const worker = await processCrawlQueueBatch({
      enabled: workerDryRun ? true : undefined,
      dryRun: workerDryRun,
      maxJobs: 1,
    });

    fs.writeFileSync(
      LAST_RUN_FILE,
      JSON.stringify({
        generated_at: new Date().toISOString(),
        action: 'enqueued',
        enqueued: enqueuedCount,
        alreadyPending: alreadyPendingCount,
        failed: 0,
        results,
        queue: queueStats,
      }, null, 2),
    );

    // Log to database in background
    Promise.resolve().then(async () => {
      try {
        await logAutomationRun({
          kind: 'crawl',
          status: 'enqueued',
          summary: {
            enqueued: enqueuedCount,
            alreadyPending: alreadyPendingCount,
            failed: 0,
            results,
            queue: queueStats
          }
        });
      } catch (dbErr) {
        console.warn('[DB Status Log] Failed to log crawl enqueued run:', dbErr);
      }
    });

    return NextResponse.json({
      success: true,
      action: 'enqueued',
      enqueued: enqueuedCount,
      alreadyPending: alreadyPendingCount,
      failed: 0,
      remaining: missing.length - batch.length,
      results,
      queue: queueStats,
      worker,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown cron crawl error';
    
    // Log error to database in background
    Promise.resolve().then(async () => {
      try {
        await logAutomationRun({
          kind: 'crawl',
          status: 'failed',
          errorMessage: message
        });
      } catch (dbErr) {
        console.warn('[DB Status Log] Failed to log crawl error run:', dbErr);
      }
    });

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
