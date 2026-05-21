import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CRAWL_RUN = path.join(process.cwd(), 'data', 'crawl-last-auto-run.json');
const CONTENT_RUN = path.join(process.cwd(), 'data', 'content-last-auto-run.json');

export async function GET() {
  const crawlStatus = fs.existsSync(CRAWL_RUN)
    ? JSON.parse(fs.readFileSync(CRAWL_RUN, 'utf-8'))
    : { generated_at: null, crawled: 0, failed: 0 };
  const contentStatus = fs.existsSync(CONTENT_RUN)
    ? JSON.parse(fs.readFileSync(CONTENT_RUN, 'utf-8'))
    : { generated_at: null, action: null };

  return NextResponse.json({
    success: true,
    automation: {
      crawl: {
        endpoint: '/api/admin/cron/crawl',
        lastRun: crawlStatus.generated_at,
        lastCrawled: crawlStatus.crawled || 0,
        lastFailed: crawlStatus.failed || 0,
        schedule: 'Recommended: every 6 hours via external cron (cron-job.org, Coolify scheduled task, or Vercel Cron)',
      },
      generate: {
        endpoint: '/api/admin/cron/generate',
        lastRun: contentStatus.generated_at,
        lastAction: contentStatus.action,
        schedule: 'Recommended: every 4 hours via external cron',
      },
    },
    howToSetup: 'Call these endpoints via an external cron service (cron-job.org, Coolify scheduled tasks, Vercel Cron Jobs) at the recommended intervals.',
  });
}
