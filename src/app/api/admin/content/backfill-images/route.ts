import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/admin-auth-guard';
import {
  harvestImagesFromDatabase,
  harvestImagesFromMarkdown,
  type HarvestedImage,
} from '@/lib/content-automation/crawl-image-harvest';
import {
  classifyImageLicenses,
  isGenericStockImage,
} from '@/lib/content-automation/crawl-image-license';
import {
  MEDIA_MATCHER_VERSION,
  pickBestRelevantImageMatch,
} from '@/lib/content-automation/crawl-image-match';
import {
  buildSourceSearchUrls,
  extractRelevantSourcePages,
} from '@/lib/content-automation/source-page-discovery';
import { rerankImagesWithVision } from '@/lib/content-automation/vision-image-reranker';
import { persistRawCrawlContent } from '@/lib/server/raw-content-store';
import { upsertPublishedArtifact } from '@/lib/server/published-content-store';
import { isPublicHttpUrl } from '@/lib/server/url-safety';
import { crawlUrlForMedia } from '@/lib/server/crawl4ai-client';
import { revalidatePath } from 'next/cache';

// In-memory crawl cache keyed by URL — prevents re-crawling the same page
// for every article during a single backfill run.
const crawlCache = new Map<string, HarvestedImage[]>();

async function crawlAndHarvest(
  pageUrl: string,
  options: { persist: boolean } = { persist: true },
): Promise<HarvestedImage[]> {
  if (crawlCache.has(pageUrl)) return crawlCache.get(pageUrl)!;

  // /md (fit filter) also benefits image harvesting: Readability-style
  // extraction drops nav/header/footer images (site logos, category
  // thumbnails) along with the boilerplate text, leaving mostly in-article
  // images as candidates instead of flooding harvestImagesFromMarkdown with
  // irrelevant site-chrome images.
  const crawled = await crawlUrlForMedia(pageUrl, { timeoutMs: 40_000 });
  if (!crawled.ok) {
    crawlCache.set(pageUrl, []);
    return [];
  }

  const md = crawled.markdown;
  // A dry-run must remain read-only. Normal backfills persist the crawl so
  // future harvests can reuse it, while previews only evaluate in memory.
  if (options.persist) {
    void persistRawCrawlContent({ url: pageUrl, rawMarkdown: md, crawler: 'backfill' });
  }

  const images = harvestImagesFromMarkdown({
    url: pageUrl,
    markdown: `${md}\n${crawled.mediaMarkup}`,
  });
  crawlCache.set(pageUrl, images);
  return images;
}

async function discoverRelevantPages(
  sourceHints: ReadonlyArray<string>,
  query: string,
  options: { persist: boolean },
): Promise<string[]> {
  const discovered = new Set<string>();

  for (const sourceHint of sourceHints.slice(0, 3)) {
    for (const searchUrl of buildSourceSearchUrls(sourceHint, query)) {
      const crawled = await crawlUrlForMedia(searchUrl, { timeoutMs: 40_000 });
      if (!crawled.ok) continue;

      if (options.persist) {
        void persistRawCrawlContent({
          url: searchUrl,
          rawMarkdown: crawled.markdown,
          crawler: 'backfill-discovery',
        });
      }

      const pages = extractRelevantSourcePages({
        markdown: `${crawled.markdown}\n${crawled.mediaMarkup}`,
        sourceUrl: searchUrl,
        query,
        maxResults: 2,
      });
      for (const page of pages) discovered.add(page);
      if (pages.length > 0 || discovered.size >= 4) break;
    }
    if (discovered.size >= 4) break;
  }

  return [...discovered].slice(0, 4);
}

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

function needsMediaRefresh(src: string, kind?: string, matcherVersion?: string): boolean {
  if (matcherVersion !== MEDIA_MATCHER_VERSION) return true;
  if (!src) return true;
  if (src.startsWith('/images/fallbacks/')) return true;
  if (src.startsWith('/api/content/media/cover/')) return true;
  // Old static-path cache entries are broken (404 in Docker standalone) — re-process them.
  if (src.startsWith('/images/source-cache/')) return true;
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

const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15MB — generous for an editorial cover/gallery image.

async function downloadToSourceCache(
  externalUrl: string,
  slug: string,
  label: 'cover' | 'gallery',
  index: number,
): Promise<string | null> {
  // SSRF guard: block loopback/private/link-local targets, and refuse to
  // follow redirects (harvested image URLs from crawled markdown should be
  // direct CDN links; a 3xx here is treated as a failed download, not
  // silently followed to wherever it points).
  if (!isPublicHttpUrl(externalUrl)) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch(externalUrl, {
      signal: controller.signal,
      redirect: 'error',
      headers: { 'User-Agent': 'FPVLovers-MediaBot/1.0 (editorial image cache)' },
    });
    clearTimeout(timer);

    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return null;

    const declaredLength = Number(res.headers.get('content-length') || 0);
    if (declaredLength > MAX_IMAGE_BYTES) return null;

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) return null;

    const ext = contentType.includes('webp') ? 'webp'
      : contentType.includes('png') ? 'png'
      : imageExtFromUrl(externalUrl);

    const hash = slugHash8(slug, externalUrl);
    const filename = `${slug}-${label}-${index}-${hash}.${ext}`;

    if (!fs.existsSync(SOURCE_CACHE_DIR)) {
      fs.mkdirSync(SOURCE_CACHE_DIR, { recursive: true });
    }

    const destPath = path.join(SOURCE_CACHE_DIR, filename);
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(destPath, buffer);

    // Serve via API route — static /public/ path is unreliable in Docker standalone.
    return `/api/images/source-cache/${filename}`;
  } catch (err) {
    // Caller falls back to hotlinking the external URL directly when this
    // returns null — log so a permission/disk issue on SOURCE_CACHE_DIR
    // doesn't silently degrade every "updated" article to a hotlink.
    console.error(`[backfill-images] local cache write failed for ${externalUrl}:`, err);
    return null;
  }
}

type ArticleResult = {
  slug: string;
  status: 'updated' | 'updated_hotlink_fallback' | 'skipped' | 'no_images' | 'error';
  reason?: string;
  oldSrc?: string;
  newSrc?: string;
  visionStatus?: string;
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
    const coverMatcherVersion = (artifact as any)?.media?.coverImage?.matcherVersion;

    // Skip articles that already have a local source-backed-cache cover.
    if (!needsMediaRefresh(coverSrc, coverKind, coverMatcherVersion)) {
      results.push({ slug, status: 'skipped', reason: `already evaluated by ${MEDIA_MATCHER_VERSION}` });
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

    // Harvest crawled images: try DB first, fall back to live Crawl4AI.
    let crawledLicensed: import('@/lib/content-automation/crawl-image-license').LicensedImage[] = [];
    try {
      const dbImages = await harvestImagesFromDatabase(allHints);
      if (dbImages?.length) {
        crawledLicensed = classifyImageLicenses(dbImages).filter((img) => !isGenericStockImage(img));
      }
    } catch {
      // DB harvest failed — will try live crawl below.
    }

    // If DB was empty, crawl the hint pages directly.
    if (crawledLicensed.length === 0) {
      const liveImages: HarvestedImage[] = [];
      for (const hintUrl of allHints.slice(0, 3)) {
        const imgs = await crawlAndHarvest(hintUrl, { persist: !dryRun });
        liveImages.push(...imgs);
        if (liveImages.length >= 20) break;
      }
      if (liveImages.length > 0) {
        crawledLicensed = classifyImageLicenses(liveImages).filter((img) => !isGenericStockImage(img));
      }
    }

    // Pick best cover image via semantic matching.
    const bodySections: Array<{ id: string; title: string; content: string }> =
      ((artifact as any)?.bodySections || []).map((s: any, i: number) => ({
        id: s.id || `section-${i}`,
        title: s.title || '',
        content: s.content || '',
      }));

    const articleTitle = typeof (artifact as any)?.title === 'string'
      ? (artifact as any).title
      : slug.replace(/-/g, ' ');
    let visionStatus = 'not-needed';
    let bestCoverMatch = pickBestRelevantImageMatch(crawledLicensed, bodySections);

    // Broad category pages often yield generic images. If none passes the
    // strict cover gate, discover article-specific pages through each source's
    // own search results and crawl only the strongest same-host matches.
    if (!bestCoverMatch) {
      const discoveredPages = await discoverRelevantPages(allHints, articleTitle, {
        persist: !dryRun,
      });
      const discoveredImages: HarvestedImage[] = [];
      for (const pageUrl of discoveredPages) {
        discoveredImages.push(...await crawlAndHarvest(pageUrl, { persist: !dryRun }));
      }

      const additionalLicensed = classifyImageLicenses(discoveredImages)
        .filter((image) => !isGenericStockImage(image));
      const uniqueLicensed = new Map(
        [...crawledLicensed, ...additionalLicensed].map((image) => [image.src, image]),
      );
      crawledLicensed = [...uniqueLicensed.values()];
      bestCoverMatch = pickBestRelevantImageMatch(crawledLicensed, bodySections);
    }

    if (!bestCoverMatch) {
      const visionResult = await rerankImagesWithVision({
        images: crawledLicensed,
        articleTitle,
        sectionTitles: bodySections.map((section) => section.title),
        persistCache: !dryRun,
      });
      visionStatus = `${visionResult.status}:${visionResult.evaluated}`;
      if (visionResult.match) {
        bestCoverMatch = {
          sectionId: bodySections[0]?.id || 'vision-cover',
          image: visionResult.match.image,
          score: visionResult.match.score,
          reason: visionResult.match.reason,
        };
      }
    }

    const bestCover = bestCoverMatch?.image;
    if (!bestCover || !bestCoverMatch) {
      results.push({
        slug,
        status: 'no_images',
        reason: crawledLicensed.length === 0
          ? 'no crawled images found (DB + live discovery)'
          : 'no image passed relevance threshold after source-page discovery',
        visionStatus,
      });
      skipped++;
      continue;
    }

    if (dryRun) {
      results.push({
        slug,
        status: 'updated',
        reason: 'dry-run',
        oldSrc: coverSrc,
        newSrc: bestCover.src,
        visionStatus,
      });
      updated++;
      continue;
    }

    // Download to local source-cache.
    const localSrc = bestCover.canSelfHost
      ? await downloadToSourceCache(bestCover.src, slug, 'cover', 1)
      : null;
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
          matcherVersion: MEDIA_MATCHER_VERSION,
          selectionScore: bestCoverMatch.score,
          selectionReason: bestCoverMatch.reason,
        },
      },
    };

    try {
      fs.writeFileSync(jsonPath, JSON.stringify(patched, null, 2) + '\n', 'utf-8');
      await upsertPublishedArtifact(patched as any);
      results.push({
        slug,
        status: localSrc ? 'updated' : 'updated_hotlink_fallback',
        reason: localSrc
          ? undefined
          : bestCover.canSelfHost
            ? 'local source-cache write failed (permissions or disk) - using external hotlink instead'
            : 'license policy forbids self-hosting - using attributed external source',
        oldSrc: coverSrc,
        newSrc: finalSrc,
      });
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
