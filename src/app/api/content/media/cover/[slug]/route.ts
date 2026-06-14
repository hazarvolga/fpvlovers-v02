import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { getPublishedContentBySlugAsync } from '@/lib/content-automation/content-reader';
import { buildCoverImageSvg } from '@/lib/content-automation/content-media';
import { firstWaveContentPlan } from '@/lib/content-plan';

const registryBySlug = new Map<string, (typeof firstWaveContentPlan)[number]>(
  firstWaveContentPlan.map((entry) => [entry.slug, entry]),
);

export const runtime = 'nodejs';

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
  const published = await getPublishedContentBySlugAsync(slug);
  const registry = registryBySlug.get(slug);

  const title = published?.title || registry?.title || humanizeSlug(slug);
  const category = published?.category || registry?.category || 'FPV Reference';
  const excerpt =
    published?.excerpt ||
    registry?.summary ||
    'Copyright-safe media generated locally for the FPVLovers content engine.';

  const svg = buildCoverImageSvg({ slug, title, category, excerpt });
  const png = await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  return new NextResponse(new Uint8Array(png), {
    headers: {
      'content-type': 'image/png',
      'cache-control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800',
    },
  });
}
