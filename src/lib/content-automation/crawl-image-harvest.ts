import { createHash } from 'crypto';
import { query } from '@/lib/server/db';

/**
 * Crawl image harvest bridge.
 *
 * Generalizes the proven `collectImages()` logic from the product-catalog
 * extractor into an editorial-grade harvester: it pulls image candidates out of
 * crawled markdown together with their original source URL, host, alt text and
 * the surrounding paragraph context. The context is what later lets us match an
 * image to a specific body section (semantic matching) and respect copyright by
 * always carrying an attributable `sourceUrl`.
 *
 * This module is intentionally additive: it only reads crawled markdown and
 * produces a normalized list. License classification and content matching are
 * handled by separate, downstream modules.
 */

export type HarvestedImage = {
  /** Stable id derived from the absolute image URL. */
  id: string;
  /** Absolute image URL (resolved against the page URL). */
  src: string;
  /** Alt text as authored on the source page (may be empty). */
  alt: string;
  /** The page the image was crawled from — used for attribution links. */
  sourceUrl: string;
  /** Source hostname (www stripped) — used for attribution labels. */
  hostname: string;
  /** Surrounding text used downstream for semantic image↔section matching. */
  context: string;
};

export type HarvestInput = {
  /** The crawled page URL — used as the attribution source and URL base. */
  url: string;
  /** Raw markdown body returned by Crawl4AI. */
  markdown: string;
};

export type HarvestStore = {
  generatedAt: string;
  pages: number;
  images: HarvestedImage[];
};

/** Hostname fragments that never carry editorial value. */
const HOST_DENYLIST = [
  'gravatar.com', 'placeholder.com', 'placehold.it', 'doubleclick.net',
  'staticflickr.com', 'googlesyndication.com', 'googletagmanager.com',
  'facebook.com', 'twitter.com', 'instagram.com',
];

/**
 * Filename / path fragments that indicate chrome (logos, icons, tracking
 * pixels, avatars, sprites) rather than editorial photography.
 */
const PATH_DENYLIST = [
  'logo', 'icon', 'favicon', 'sprite', 'avatar', 'spacer', 'pixel',
  'badge', 'button', 'placeholder', 'thumbnail-default', 'data:image',
  // Forum / community chrome
  'smilies', 'smileys', 'emoticon', 'emoji',
  // Common vendor chrome patterns
  'blank.gif', 'transparent.gif', 'loading.gif', 'spinner.',
  'arrow', 'star.png', 'star.gif', 'checkmark',
  // CDN product thumbnails that are too small
  '_thumb', '_small', '_xs', '-xs.', '-sm.', '_mini',
];

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/\|/g, ' ').trim();
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

function absoluteUrl(url: string, baseUrl: string): string | undefined {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function inferHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'source';
  }
}

function hashId(url: string): string {
  return `img_${createHash('sha1').update(url).digest('hex').slice(0, 16)}`;
}

function htmlAttribute(tag: string, name: string): string {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(?:["']([^"']*)["']|([^\\s>]+))`, 'i');
  const match = tag.match(pattern);
  return cleanText(match?.[1] || match?.[2] || '');
}

function firstSrcsetUrl(value: string): string {
  return value.split(',')[0]?.trim().split(/\s+/)[0] || '';
}

function isLikelyEditorialImage(src: string): boolean {
  const lower = src.toLowerCase();
  if (lower.startsWith('data:')) return false;
  if (HOST_DENYLIST.some((host) => lower.includes(host))) return false;
  if (PATH_DENYLIST.some((fragment) => lower.includes(fragment))) return false;
  // Drop obvious sub-100px assets when the dimension is encoded in the URL.
  const dimensionMatch = lower.match(/[-_/](\d{2,4})x(\d{2,4})[._-]/);
  if (dimensionMatch) {
    const width = Number(dimensionMatch[1]);
    const height = Number(dimensionMatch[2]);
    if (width && height && (width < 200 || height < 150)) return false;
  }
  return true;
}

/**
 * Harvest editorial image candidates from a single crawled markdown page.
 * Captures alt text plus a window of surrounding lines as `context`.
 */
export function harvestImagesFromMarkdown(input: HarvestInput): HarvestedImage[] {
  const lines = input.markdown.split(/\r?\n/);
  const imageRegex = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  const harvested: HarvestedImage[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] || '';
    let match: RegExpExecArray | null;
    imageRegex.lastIndex = 0;

    while ((match = imageRegex.exec(line)) !== null) {
      const alt = cleanText(match[1] || '');
      const src = absoluteUrl(match[2] || '', input.url);
      if (!src || !isLikelyEditorialImage(src)) continue;
      if (seen.has(src)) continue;
      seen.add(src);

      const context = cleanText(
        [
          lines[index - 2] || '',
          lines[index - 1] || '',
          line,
          lines[index + 1] || '',
          lines[index + 2] || '',
        ].join(' '),
      );

      harvested.push({
        id: hashId(src),
        src,
        alt,
        sourceUrl: input.url,
        hostname: inferHostname(input.url),
        context,
      });
    }
  }

  // Crawl4AI may preserve HTML/lazy-loaded images instead of Markdown image
  // syntax. Capture those candidates too so a valid source page does not
  // incorrectly collapse to generated fallback media.
  const htmlImageRegex = /<img\b[^>]*>/gi;
  let htmlMatch: RegExpExecArray | null;
  while ((htmlMatch = htmlImageRegex.exec(input.markdown)) !== null) {
    const tag = htmlMatch[0];
    const rawSrc = htmlAttribute(tag, 'src')
      || htmlAttribute(tag, 'data-src')
      || htmlAttribute(tag, 'data-lazy-src')
      || firstSrcsetUrl(htmlAttribute(tag, 'srcset') || htmlAttribute(tag, 'data-srcset'));
    const src = absoluteUrl(rawSrc, input.url);
    if (!src || !isLikelyEditorialImage(src) || seen.has(src)) continue;
    seen.add(src);
    const context = cleanText(input.markdown.slice(
      Math.max(0, htmlMatch.index - 320),
      Math.min(input.markdown.length, htmlMatch.index + tag.length + 320),
    ));
    harvested.push({
      id: hashId(src),
      src,
      alt: htmlAttribute(tag, 'alt'),
      sourceUrl: input.url,
      hostname: inferHostname(input.url),
      context,
    });
  }

  return harvested;
}

/**
 * Harvest across many crawled pages and deduplicate by absolute image URL.
 * Accepts loosely-typed crawl records (Crawl4AI shape) and is tolerant of
 * snake_case / nested markdown payloads.
 */
export function harvestImagesFromCrawlRecords(
  records: ReadonlyArray<Record<string, unknown>>,
): HarvestStore {
  const images: HarvestedImage[] = [];
  const seen = new Set<string>();
  let pages = 0;

  for (const record of records) {
    const url = asString(record.url) || asString(record.source_url);
    const markdown = markdownFromRecord(record);
    if (!url || !markdown) continue;
    pages += 1;

    for (const image of harvestImagesFromMarkdown({ url, markdown })) {
      if (seen.has(image.src)) continue;
      seen.add(image.src);
      images.push(image);
    }
  }

  return { generatedAt: new Date().toISOString(), pages, images };
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function markdownFromRecord(record: Record<string, unknown>): string {
  const direct = asString(record.markdown);
  if (direct) return direct;
  const nested =
    record.markdown && typeof record.markdown === 'object'
      ? asString((record.markdown as Record<string, unknown>).raw_markdown)
      : undefined;
  return nested || asString(record.raw_markdown) || asString(record.text) || '';
}

/**
 * Extract domain from a URL string, stripping www prefix.
 * Returns null if the string is not a valid URL (e.g. keyword hints like "teams").
 */
function extractDomain(urlOrHint: string): string | null {
  try {
    const parsed = new URL(urlOrHint);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export async function harvestImagesFromDatabase(hints: string[]): Promise<HarvestedImage[]> {
  if (!hints || hints.length === 0) return [];
  const hasDatabaseConfig = Boolean(
    process.env.FPV_DATABASE_URL
    || (process.env.DB_HOST && process.env.DB_DATABASE),
  );
  if (!hasDatabaseConfig) return [];

  // Separate real URLs from keyword hints
  const urls = hints.filter((h) => extractDomain(h) !== null);
  const keywords = hints.filter((h) => extractDomain(h) === null);
  const domains = [...new Set(urls.map((u) => extractDomain(u)).filter(Boolean) as string[])];

  try {
    let rows: Array<{ url: string; raw_markdown: string }> = [];

    // Step 1: Try exact URL matches first.
    if (urls.length > 0) {
      const exactResult = await query<{ url: string; raw_markdown: string }>(
        `SELECT url, raw_markdown
         FROM content_engine.raw_content
         WHERE url = ANY($1) AND is_active = true`,
        [urls],
      );
      rows = exactResult.rows;
    }

    // Step 2: If exact rows contain no usable images, fall back to broader
    // domain records instead of treating an image-less exact page as success.
    const exactImageCount = rows.length > 0 ? harvestImagesFromCrawlRecords(rows).images.length : 0;
    if (exactImageCount === 0 && domains.length > 0) {
      const domainPatterns = domains.map((d) => `%${d}%`);
      // Build OR conditions for each domain
      const conditions = domainPatterns.map((_, i) => `url LIKE $${i + 1}`).join(' OR ');
      const domainResult = await query<{ url: string; raw_markdown: string }>(
        `SELECT url, raw_markdown
         FROM content_engine.raw_content
         WHERE (${conditions}) AND is_active = true
         ORDER BY crawled_at DESC NULLS LAST
         LIMIT 60`,
        domainPatterns,
      );
      rows = domainResult.rows;
    }

    // Keyword-only briefs used to return early and could never harvest media.
    // Search the stored crawl text with bounded, parameterized patterns.
    if (rows.length === 0 && keywords.length > 0) {
      const keywordPatterns = keywords.slice(0, 5).map((keyword) => `%${keyword}%`);
      const conditions = keywordPatterns.map((_, index) => `raw_markdown ILIKE $${index + 1}`).join(' OR ');
      const keywordResult = await query<{ url: string; raw_markdown: string }>(
        `SELECT url, raw_markdown
         FROM content_engine.raw_content
         WHERE (${conditions}) AND is_active = true
         ORDER BY crawled_at DESC NULLS LAST
         LIMIT 60`,
        keywordPatterns,
      );
      rows = keywordResult.rows;
    }

    if (rows.length === 0) return [];

    const store = harvestImagesFromCrawlRecords(rows);
    let images = store.images;

    // Step 3: If we have keyword hints, filter/boost images whose context matches any keyword
    if (keywords.length > 0 && images.length > 0) {
      const keywordTokens = [...new Set(
        keywords
          .flatMap((keyword) => tokenize(keyword))
          .filter((token) => token.length >= 4),
      )];
      const scored = images.map((img) => {
        const contextTokens = new Set(tokenize(`${img.context} ${img.alt}`));
        const matchCount = keywordTokens.filter((token) => contextTokens.has(token)).length;
        return { img, matchCount };
      });
      // Sort by article-specific overlap while retaining lower-confidence
      // candidates for section-level matching.
      scored.sort((a, b) => b.matchCount - a.matchCount);
      images = scored.map((s) => s.img);
    }

    return images;
  } catch (err) {
    console.error('Error harvesting images from database:', err);
    return [];
  }
}
