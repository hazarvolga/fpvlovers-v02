import { NextResponse } from 'next/server';
import { checkCrawlerHealth } from '@/lib/crawler-health';
import { getBudgetStatus } from '@/lib/dify-client';
import { healthCheck as checkDatabaseHealth } from '@/lib/server/db';
import { getStorageMode } from '@/lib/server/storage-mode';

export const dynamic = 'force-dynamic';

type ReadinessCheck = {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
  latencyMs?: number;
};

function hasEnv(...names: string[]): boolean {
  return names.some((name) => typeof process.env[name] === 'string' && process.env[name].trim().length > 0);
}

function responseStatus(checks: ReadinessCheck[]): 'ready' | 'degraded' | 'not_ready' {
  if (checks.some((check) => check.status === 'fail')) return 'not_ready';
  if (checks.some((check) => check.status === 'warn')) return 'degraded';
  return 'ready';
}

export async function GET() {
  const checks: ReadinessCheck[] = [];
  const storageMode = getStorageMode();

  checks.push({
    name: 'critical-env',
    status: hasEnv('DIFY_APP_KEY') && hasEnv('DIFY_BASE_URL', 'DIFY_INTERNAL_BASE_URL', 'APP_API_URL')
      ? 'pass'
      : 'fail',
    detail: 'Requires DIFY_APP_KEY and a Dify base URL for autonomous publishing.',
  });

  const budget = getBudgetStatus();
  checks.push({
    name: 'dify-budget',
    status: budget.dry_run ? 'warn' : budget.remaining > 0 ? 'pass' : 'fail',
    detail: budget.dry_run
      ? 'CRAWL_DRY_RUN is active; external generation calls are simulated.'
      : `${budget.remaining}/${budget.daily_limit} daily token budget remaining.`,
  });

  const dbHealth = await checkDatabaseHealth();
  checks.push({
    name: 'database',
    status: dbHealth.ok || storageMode === 'files' ? 'pass' : 'fail',
    detail: dbHealth.ok
      ? `PostgreSQL reachable in ${dbHealth.latencyMs}ms.`
      : `Storage mode is ${storageMode}; database check failed: ${dbHealth.error || 'unknown error'}.`,
    latencyMs: dbHealth.latencyMs,
  });

  const crawlers = await checkCrawlerHealth(2500);
  const onlineCrawler = crawlers.find((crawler) => crawler.status === 'online');
  checks.push({
    name: 'crawler-provider',
    status: onlineCrawler ? 'pass' : 'warn',
    detail: onlineCrawler
      ? `${onlineCrawler.name} is online.`
      : `No crawler responded within readiness timeout. Checked: ${crawlers.map((crawler) => crawler.role).join(', ')}.`,
    latencyMs: onlineCrawler?.latencyMs,
  });

  const status = responseStatus(checks);

  return NextResponse.json(
    {
      status,
      service: 'fpvlovers-frontend',
      storageMode,
      checks,
      collectedAt: new Date().toISOString(),
    },
    { status: status === 'not_ready' ? 503 : 200 },
  );
}
