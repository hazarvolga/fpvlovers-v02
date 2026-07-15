import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/admin-auth-guard';
import { listRawCrawlContent } from '@/lib/server/raw-content-store';

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const domain = req.nextUrl.searchParams.get('domain');
  const dataset = req.nextUrl.searchParams.get('dataset');
  const limit = req.nextUrl.searchParams.get('limit') || '20';

  const rawContent = await listRawCrawlContent({
    domain,
    limit: Number.parseInt(limit, 10),
  });

  return NextResponse.json({
    raw_content: rawContent,
    schema: 'content_engine.raw_content',
    filters: { domain, dataset },
    note: 'Raw crawl markdown and media provenance are retained before Dify upload.',
  });
}
