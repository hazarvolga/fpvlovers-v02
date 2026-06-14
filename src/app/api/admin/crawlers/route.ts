import { NextResponse } from 'next/server';
import { checkCrawlerHealth } from '@/lib/crawler-health';
import { requireAdmin } from '@/lib/server/admin-auth-guard';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const crawlers = await checkCrawlerHealth();
  const primary = crawlers.find((crawler) => crawler.role === 'primary');
  const backup = crawlers.find((crawler) => crawler.role === 'backup');

  return NextResponse.json({
    crawlers,
    fallbackActive: primary?.status !== 'online' && backup?.status === 'online',
    online: crawlers.filter((crawler) => crawler.status === 'online').length,
    total: crawlers.length,
  });
}
