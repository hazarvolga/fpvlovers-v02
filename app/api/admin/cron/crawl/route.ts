import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BACKLOG_FILE = path.join(process.cwd(), 'data', 'fpv-rag-source-backlog.json');
const LAST_RUN_FILE = path.join(process.cwd(), 'data', 'crawl-last-auto-run.json');

const CRAWL4AI_BACKUP = 'http://141.148.206.187/c4ai/crawl';

type BacklogItem = {
  name: string;
  url: string;
  desired_dataset: string;
  priority: string;
  status: string;
};

export async function GET() {
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

    // Crawl up to 3 URLs in this batch
    const batch = missing.slice(0, 3);
    const results: { url: string; status: string; error?: string }[] = [];

    for (const item of batch) {
      try {
        const resp = await fetch(CRAWL4AI_BACKUP, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: [item.url], priority: 10 }),
          signal: AbortSignal.timeout(30000),
        });

        if (resp.ok) {
          item.status = 'present';
          results.push({ url: item.url, status: 'crawled' });
        } else {
          item.status = 'crawl_error';
          results.push({ url: item.url, status: 'failed', error: `HTTP ${resp.status}` });
        }
      } catch (e: any) {
        item.status = 'crawl_error';
        results.push({ url: item.url, status: 'failed', error: e.message });
      }
    }

    // Save updated backlog
    backlog.generated_at = new Date().toISOString();
    fs.writeFileSync(BACKLOG_FILE, JSON.stringify(backlog, null, 2));

    // Save last run
    fs.writeFileSync(
      LAST_RUN_FILE,
      JSON.stringify({
        generated_at: new Date().toISOString(),
        crawled: results.filter((r) => r.status === 'crawled').length,
        failed: results.filter((r) => r.status === 'failed').length,
        results,
      }, null, 2),
    );

    return NextResponse.json({
      success: true,
      action: 'crawled',
      crawled: results.filter((r) => r.status === 'crawled').length,
      failed: results.filter((r) => r.status === 'failed').length,
      remaining: missing.length - batch.length,
      results,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
