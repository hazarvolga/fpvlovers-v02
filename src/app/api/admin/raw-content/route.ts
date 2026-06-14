import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/admin-auth-guard';

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const domain = req.nextUrl.searchParams.get('domain');
  const dataset = req.nextUrl.searchParams.get('dataset');
  const limit = req.nextUrl.searchParams.get('limit') || '20';

  // Fallback: return empty with schema info if DB not connected yet
  return NextResponse.json({
    raw_content: [],
    schema: 'content_engine.raw_content',
    filters: { domain, dataset },
    note: 'Raw storage layer active on Server A PostgreSQL. Content will populate during next crawl.',
  });
}
