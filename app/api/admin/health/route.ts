import { NextResponse } from 'next/server';

const CRAWLERS = [
  { name: 'Crawl4AI B', url: process.env.CRAWL4AI_PRIMARY_HEALTH_URL || 'http://crawler-proxy:3002/health' },
  { name: 'Crawl4AI C', url: process.env.CRAWL4AI_BACKUP_HEALTH_URL || 'http://141.148.206.187/c4ai/health' },
];

const DIFY_PAGES = [
  { name: 'Dify API Gateway', url: process.env.DIFY_BASE_URL || 'https://dify.affexai.tr/v1', redirect: 'manual' as const },
  { name: 'Dify Web', url: process.env.DIFY_WEB_URL || 'https://dify.affexai.tr' },
];

export async function GET() {
  const services: { name: string; status: 'up' | 'down'; latency: number; version?: string; detail?: string }[] = [];
  const startedAt = Date.now();

  for (const c of CRAWLERS) {
    try {
      const t0 = Date.now();
      const resp = await fetch(c.url, { signal: AbortSignal.timeout(5000) });
      const data = await resp.json().catch(() => ({}));
      services.push({ name: c.name, status: resp.ok && data.status === 'ok' ? 'up' : 'down', latency: Date.now() - t0, version: data.version });
    } catch {
      services.push({ name: c.name, status: 'down', latency: 5000 });
    }
  }

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

  const totalLatency = Date.now() - startedAt;
  const upCount = services.filter(s => s.status === 'up').length;

  return NextResponse.json({
    status: upCount >= services.length - 1 ? 'healthy' : upCount > 0 ? 'degraded' : 'critical',
    services,
    collectedAt: new Date().toISOString(),
    collectionMs: totalLatency,
  });
}
