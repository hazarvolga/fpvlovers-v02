import { NextResponse } from 'next/server';
import { generateSeoMetadata, generateSitemapEntries } from '@/lib/seo/seo-pipeline';
import { requireAdmin } from '@/lib/server/admin-auth-guard';

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'metadata';

    if (type === 'sitemap') {
      const entries = generateSitemapEntries();
      return NextResponse.json({ success: true, entries, count: entries.length });
    }

    const metadata = generateSeoMetadata();
    return NextResponse.json({
      success: true,
      metadata,
      stats: {
        total: metadata.length,
        totalWords: metadata.reduce((sum, m) => sum + m.wordCount, 0),
        avgReadingTime: metadata.length > 0
          ? `${Math.round(metadata.reduce((sum, m) => sum + parseInt(m.readingTime), 0) / metadata.length)} min`
          : '0 min',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
