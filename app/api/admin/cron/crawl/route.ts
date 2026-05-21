import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { authorizeCronRequest } from '@/lib/cron-auth';
import { enqueueUrls, getQueueStatus } from '@/lib/crawl-queue';

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
    const backlog = JSON.parse(fs.readFileSync(BACKLOG_FILE, 'utf-8'));
    const sources: BacklogItem[] = backlog.sources || [];
    const missing = sources.filter((s) => s.status === 'missing' || s.status === 'crawl_error');
    const deferred = sources.filter((s) => s.status === 'deferred');

    if (missing.length === 0 && deferred.length === 0) {
      return NextResponse.json({
        success: true,
        action: 'noop',
        message: 'No pending crawl jobs. Backlog is up to date.',
        stats: {
          total: sources.length,
          present: sources.filter((s) => s.status === 'present').length,
          missing: 0,
          errors: sources.filter((s) => s.status === 'crawl_error').length,
        },
      });
    }

    const batch = missing.slice(0, MAX_AUTO_ENQUEUE_PER_RUN);
    const grouped = groupByDataset(batch);
    const results: { url: string; dataset: string; status: string; jobId?: string }[] = [];

    for (const [dataset, urls] of grouped.entries()) {
      const jobs = enqueueUrls(urls, dataset);
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

    fs.writeFileSync(
      LAST_RUN_FILE,
      JSON.stringify({
        generated_at: new Date().toISOString(),
        action: 'enqueued',
        enqueued: results.filter((r) => r.status === 'enqueued').length,
        alreadyPending: results.filter((r) => r.status === 'already_pending').length,
        failed: 0,
        results,
        queue: getQueueStatus().stats,
      }, null, 2),
    );

    return NextResponse.json({
      success: true,
      action: 'enqueued',
      enqueued: results.filter((r) => r.status === 'enqueued').length,
      alreadyPending: results.filter((r) => r.status === 'already_pending').length,
      failed: 0,
      remaining: missing.length - batch.length,
      results,
      queue: getQueueStatus().stats,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown cron crawl error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
