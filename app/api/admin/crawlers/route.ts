import { NextResponse } from 'next/server';

export async function GET() {
  const crawlers = [
    { name: 'Crawl4AI Primary (B)', url: process.env.CRAWL4AI_PRIMARY_HEALTH_URL || 'http://crawler-proxy:3002/health' },
    { name: 'Crawl4AI Backup (C)', url: process.env.CRAWL4AI_BACKUP_HEALTH_URL || 'http://141.148.206.187/c4ai/health' },
  ];

  const results = [];
  for (const c of crawlers) {
    try {
      const resp = await fetch(c.url, { signal: AbortSignal.timeout(5000) });
      const data = await resp.json().catch(() => ({}));
      results.push({
        name: c.name,
        status: resp.ok && data.status === 'ok' ? 'online' : 'error',
        version: data.version || '-',
        latency: 'ok',
      });
    } catch {
      results.push({ name: c.name, status: 'offline', version: '-', latency: 'timeout' });
    }
  }

  return NextResponse.json({ crawlers: results });
}
