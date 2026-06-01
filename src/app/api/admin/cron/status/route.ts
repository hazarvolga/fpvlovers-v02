import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { authorizeCronRequest } from '@/lib/cron-auth';
import { getQueueStatusNew } from '@/lib/crawl-queue';
import { getRecentAutomationRuns } from '@/lib/server/automation-runs-store';

const CRAWL_RUN = path.join(process.cwd(), 'data', 'crawl-last-auto-run.json');
const CONTENT_RUN = path.join(process.cwd(), 'data', 'content-last-auto-run.json');

export async function GET(req: Request) {
  const auth = authorizeCronRequest(req);
  if (!auth.authorized) return auth.response;

  // File fallback status loading
  const crawlStatus = fs.existsSync(CRAWL_RUN)
    ? JSON.parse(fs.readFileSync(CRAWL_RUN, 'utf-8'))
    : { generated_at: null, enqueued: 0, failed: 0 };
  const contentStatus = fs.existsSync(CONTENT_RUN)
    ? JSON.parse(fs.readFileSync(CONTENT_RUN, 'utf-8'))
    : { generated_at: null, action: null };

  // Database run histories (with automatic file fallback)
  const [latestDbCrawl] = await getRecentAutomationRuns('crawl', 1);
  const [latestDbGenerate] = await getRecentAutomationRuns('generate', 1);

  const lastCrawlRun = latestDbCrawl 
    ? (latestDbCrawl.startedAt ? new Date(latestDbCrawl.startedAt).toISOString() : null)
    : crawlStatus.generated_at;

  const lastGenerateRun = latestDbGenerate
    ? (latestDbGenerate.startedAt ? new Date(latestDbGenerate.startedAt).toISOString() : null)
    : contentStatus.generated_at;

  const queueStats = (await getQueueStatusNew()).stats;

  return NextResponse.json({
    success: true,
    automation: {
      crawl: {
        endpoint: '/api/admin/cron/crawl',
        lastRun: lastCrawlRun,
        lastEnqueued: latestDbCrawl ? (latestDbCrawl.summary?.enqueued || 0) : (crawlStatus.enqueued || 0),
        lastFailed: latestDbCrawl ? (latestDbCrawl.status === 'failed' ? 1 : 0) : (crawlStatus.failed || 0),
        queue: queueStats,
        schedule: 'Recommended: every 6 hours via external cron (cron-job.org, Coolify scheduled task, or Vercel Cron)',
        source: latestDbCrawl ? 'database' : 'file',
      },
      generate: {
        endpoint: '/api/admin/cron/generate',
        lastRun: lastGenerateRun,
        lastAction: latestDbGenerate ? latestDbGenerate.status : contentStatus.action,
        schedule: 'Recommended: every 4 hours via external cron',
        source: latestDbGenerate ? 'database' : 'file',
      },
    },
    howToSetup: 'Call these endpoints via an external cron service (cron-job.org, Coolify scheduled tasks, Vercel Cron Jobs) at the recommended intervals.',
  });
}

