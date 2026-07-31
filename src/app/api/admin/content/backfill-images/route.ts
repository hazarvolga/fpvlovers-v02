import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/admin-auth-guard';
import { harvestImagesFromDatabase } from '@/lib/content-automation/crawl-image-harvest';
import {
  classifyImageLicenses,
  isGenericStockImage,
} from '@/lib/content-automation/crawl-image-license';
import { pickBestRelevantImage } from '@/lib/content-automation/crawl-image-match';
import { upsertPublishedArtifact } from '@/lib/server/published-content-store';
import { revalidatePath } from 'next/cache';

const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');
const SOURCE_CACHE_DIR = path.join(process.cwd(), 'public', 'images', 'source-cache');

// Per-category editorial FPV sites that carry real photography.
const CATEGORY_SOURCE_HINTS: Record<string, string[]> = {
  'Flight Guides':    ['https://oscarliang.com/', 'https://www.rotorriot.com/'],
  'Build Guides':     ['https://oscarliang.com/', 'https://www.fpvknowitall.com/'],
  'Troubleshooting':  ['https://oscarliang.com/', 'https://www.rotorriot.com/'],
  'Components':       ['https://oscarliang.com/', 'https://pyrodrone.com/'],
  'Racing':           ['https://www.rotorriot.com/', 'https://www.multigp.com/'],
  'Regulations':      ['https://oscarliang.com/', 'https://www.rotorriot.com/'],
  'News and Reviews': ['https://www.rotorriot.com/', 'https://oscarliang.com/'],
};

function isFallbackOrHotlink(src: string, kind?: string): boolean {
  if (!src) return true;
  if (src.startsWith('/images/fallbacks/')) return true;
  if (src.startsWith('/api/content/media/cover/')) return true;
  if (src.startsWith('http') && kind !== 'source-backed-cache') return true;
  return false;
}

function imageExtFromUrl(url: string): string {
  try {
    const p = new URL(url).pathname.toLowerCase();
    if (p.endsWith('.webp')) return 'webp';
    if (p.endsWith('.png')) return 'png';
    if (p.endsWith('.gif')) return 'gif';
  } catch { /* ignore */ }
  return 'jpg';
}

function slugHash8(slug: string, suffix: string): string {
  return createHash('sha1').update(`${slug}:${suffix}`).digest('hex').slice(0, 8);
}

async function downloadToSourceCache(
  externalUrl: string,
  slug: string,
  label: 'cover' | 'gallery',
  index: number,
): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch(externalUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'FPVLovers-MediaBot/1.0 (editorial image cache)' },
    });
    clearTimeout(timer);

    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return null;

    const ext = contentType.includes('webp') ? 'webp'
      : contentType.includes('png') ? 'png'
      : imageExtFromUrl(externalUrl);

    const hash = slugHash8(slug, externalUrl);
    const filename = `${slug}-${label}-${index}-${hash}.${ext}`;

    if (!fs.existsSync(SOURCE_CACHE_DIR)) {
      fs.mkdirSync(SOURCE_CACHE_DIR, { recursive: true });
    }

    const destPath = path.join(SOURCE_CACHE_DIR, filename);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buffer);

    return `/images/source-cache/${filename}`;
  } catch {
    return null;
  }
}

type ArticleResult = {
  slug: string;
  status: 'updated' | 'skipped' | 'no_images' | 'error';
  reason?: string;
  oldSrc?: string;
  newSrc?: string;
};

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const targetSlugs: string[] | undefined = Array.isArray(body?.slugs) ? body.slugs : undefined;
  const dryRun: boolean = body?.dryRun === true;

  // Load all published JSON files.
  if (!fs.existsSync(PUBLISHED_DIR)) {
    return NextResponse.json({ success: false, error: 'Published directory not found' }, { status: 500 });
  }

  const jsonFiles = fs.readdirSync(PUBLISHED_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''));

  const slugsToProcess = targetSlugs
    ? jsonFiles.filter((s) => targetSlugs.includes(s))
    : jsonFiles;

  const results: ArticleResult[] = [];
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const slug of slugsToProcess) {
    const jsonPath = path.join(PUBLISHED_DIR, `${slug}.json`);
    let artifact: Record<string, unknown>;

    try {
      artifact = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    } catch {
      results.push({ slug, status: 'error', reason: 'Could not read JSON' });
      failed++;
      continue;
    }

    const coverSrc = (artifact as any)?.media?.coverImage?.src || '';
    const coverKind = (artifact as any)?.media?.coverImage?.kind;

    // Skip articles that already have a local source-backed-cache cover.
    if (!isFallbackOrHotlink(coverSrc, coverKind)) {
      results.push({ slug, status: 'skipped', reason: 'already source-backed-cache' });
      skipped++;
      continue;
    }

    // Build sourceHints: saved HTTP hints first, then category fallbacks.
    const savedHints: string[] = ((artifact as any)?.sourceHints || []).filter(
      (h: unknown): h is string => typeof h === 'string' && /^https?:\/\//i.test(h),
    );
    const category: string = (artifact as any)?.category || '';
    const categoryHints = CATEGORY_SOURCE_HINTS[category] || [
      'https://oscarliang.com/',
      'https://www.rotorriot.com/',
    ];
    const allHints = [...new Set([...savedHints, ...categoryHints])];

    // Harvest crawled images from DB using sourceHints.
    let crawledLicensed: import('@/lib/content-automation/crawl-image-license').LicensedImage[] = [];
    try {
      const crawledImages = await harvestImagesFromDatabase(allHints);
      if (crawledImages?.length) {
        crawledLicensed = classifyImageLicenses(crawledImages)
          .filter((img) => !isGenericStockImage(img));
      }
    } catch {
      results.push({ slug, status: 'error', reason: 'DB harvest failed' });
      failed++;
      continue;
    }

    if (crawledLicensed.length === 0) {
      results.push({ slug, status: 'no_images', reason: 'no crawled images found for hints' });
      skipped++;
      continue;
    }

    // Pick best cover image via semantic matching.
    const bodySections: Array<{ id: string; title: string; content: string }> =
      ((artifact as any)?.bodySections || []).map((s: any, i: number) => ({
        id: s.id || `section-${i}`,
        title: s.title || '',
        content: s.content || '',
      }));

    const bestCover = pickBestRelevantImage(crawledLicensed, bodySections);
    if (!bestCover) {
      results.push({ slug, status: 'no_images', reason: 'no image passed relevance threshold' });
      skipped++;
      continue;
    }

    if (dryRun) {
      results.push({ slug, status: 'updated', reason: 'dry-run', oldSrc: coverSrc, newSrc: bestCover.src });
      updated++;
      continue;
    }

    // Download to local source-cache.
    const localSrc = await downloadToSourceCache(bestCover.src, slug, 'cover', 1);
    const finalSrc = localSrc || bestCover.src;
    const finalKind = localSrc ? 'source-backed-cache' : 'source-backed';

    // Patch only the coverImage inside the artifact.
    const patched = {
      ...(artifact as any),
      media: {
        ...(artifact as any).media,
        coverImage: {
          src: finalSrc,
          alt: bestCover.alt || `FPV source image from ${bestCover.hostname}`,
          caption: bestCover.context || `Source image from ${bestCover.hostname}`,
          source: bestCover.hostname,
          sourceUrl: bestCover.sourceUrl,
          credit: `Source: ${bestCover.hostname} (${bestCover.licenseReason})`,
          license: bestCover.license,
          kind: finalKind,
        },
      },
    };

    try {
      fs.writeFileSync(jsonPath, JSON.stringify(patched, null, 2) + '\n', 'utf-8');
      await upsertPublishedArtifact(patched as any);
      results.push({ slug, status: 'updated', oldSrc: coverSrc, newSrc: finalSrc });
      updated++;
    } catch {
      results.push({ slug, status: 'error', reason: 'Failed to write JSON or upsert DB' });
      failed++;
    }
  }

  if (!dryRun && updated > 0) {
    revalidatePath('/');
    revalidatePath('/sitemap.xml');
  }

  return NextResponse.json({
    success: true,
    dryRun,
    total: slugsToProcess.length,
    updated,
    skipped,
    failed,
    results,
  });
}
