import { NextResponse } from 'next/server';
import { checkCrawlerHealth } from '@/lib/crawler-health';
import { healthCheck } from '@/lib/server/db';
import { getStorageMode } from '@/lib/server/storage-mode';

const DIFY_PAGES = [
  { name: 'Workflow API Gateway', url: process.env.DIFY_BASE_URL || 'https://dify.affexai.tr/v1', redirect: 'manual' as const },
  { name: 'Workflow Console', url: process.env.DIFY_WEB_URL || 'https://dify.affexai.tr' },
];

export async function GET() {
  const services: { name: string; status: 'up' | 'down'; latency: number; version?: string; detail?: string }[] = [];
  const startedAt = Date.now();

  // 1. Check Crawler Health
  const crawlerHealth = await checkCrawlerHealth();
  for (const crawler of crawlerHealth) {
    const statusDetail = [
      crawler.checkedUrl,
      crawler.httpStatus ? `HTTP ${crawler.httpStatus}` : null,
      crawler.error,
    ].filter(Boolean).join(' · ');

    services.push({
      name: crawler.name,
      status: crawler.status === 'online' ? 'up' : 'down',
      latency: crawler.latencyMs,
      version: crawler.version !== '-' ? crawler.version : undefined,
      detail: statusDetail,
    });
  }

  // 2. Check Dify Pages
  for (const d of DIFY_PAGES) {
    try {
      const t0 = Date.now();
      const resp = await fetch(d.url, {
        redirect: d.redirect || 'follow',
        signal: AbortSignal.timeout(8000),
      });
      const isGatewayAlive = d.redirect === 'manual' && [200, 301, 302, 307, 308].includes(resp.status);
      services.push({
        name: d.name,
        status: resp.ok || isGatewayAlive ? 'up' : 'down',
        latency: Date.now() - t0,
        version: resp.headers.get('x-version') || undefined,
        detail: resp.ok || isGatewayAlive ? undefined : `HTTP ${resp.status}`,
      });
    } catch {
      services.push({ name: d.name, status: 'down', latency: 8000 });
    }
  }

  // 3. Check PostgreSQL Database Health
  const storageMode = getStorageMode();
  const dbHealth = await healthCheck();
  services.push({
    name: `PostgreSQL (${storageMode} mode)`,
    status: dbHealth.ok ? 'up' : (storageMode === 'files' ? 'up' : 'down'),
    latency: dbHealth.latencyMs || 0,
    detail: dbHealth.error ? `DB Error: ${dbHealth.error}` : `Connection active`,
  });

  const totalLatency = Date.now() - startedAt;
  const upCount = services.filter(s => s.status === 'up').length;

  return NextResponse.json({
    status: upCount >= services.length - 1 ? 'healthy' : upCount > 0 ? 'degraded' : 'critical',
    services,
    collectedAt: new Date().toISOString(),
    collectionMs: totalLatency,
  });
}

