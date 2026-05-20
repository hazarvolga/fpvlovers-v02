import { NextResponse } from 'next/server';
import { getPublishedContentBySlug } from '@/lib/content-automation/content-reader';
import { buildCoverImageSvg } from '@/lib/content-automation/content-media';
import { firstWaveContentPlan } from '@/lib/content-plan';

const registryBySlug = new Map<string, (typeof firstWaveContentPlan)[number]>(
  firstWaveContentPlan.map((entry) => [entry.slug, entry]),
);

function humanizeSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const published = getPublishedContentBySlug(slug);
  const registry = registryBySlug.get(slug);

  const title = published?.title || registry?.title || humanizeSlug(slug);
  const category = published?.category || registry?.category || 'FPV Reference';
  const excerpt =
    published?.excerpt ||
    registry?.summary ||
    'Copyright-safe media generated locally for the FPVLovers content engine.';

  const svg = buildCoverImageSvg({ slug, title, category, excerpt });

  return new NextResponse(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800',
    },
  });
}
