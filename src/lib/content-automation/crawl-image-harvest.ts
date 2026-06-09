import { createHash } from 'crypto';

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
const HOST_DENYLIST = ['gravatar.com', 'placeholder.com', 'placehold.it', 'doubleclick.net'];

/**
 * Filename / path fragments that indicate chrome (logos, icons, tracking
 * pixels, avatars, sprites) rather than editorial photography.
 */
const PATH_DENYLIST = [
  'logo',
  'icon',
  'favicon',
  'sprite',
  'avatar',
  'spacer',
  'pixel',
  'badge',
  'button',
  'placeholder',
  'thumbnail-default',
  'data:image',
];

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/\|/g, ' ').trim();
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
  if (!process.env.DB_HOST || !process.env.DB_DATABASE) return [];

  // Separate real URLs from keyword hints
  const urls = hints.filter((h) => extractDomain(h) !== null);
  const keywords = hints.filter((h) => extractDomain(h) === null);
  const domains = [...new Set(urls.map((u) => extractDomain(u)).filter(Boolean) as string[])];

  if (urls.length === 0 && domains.length === 0) return [];

  // Support SSH tunnel redirect: local dev connects via 127.0.0.1:5435
  const host =
    process.env.DB_HOST === '80.225.231.62' && process.env.NODE_ENV !== 'production'
      ? '127.0.0.1'
      : process.env.DB_HOST;
  const port =
    process.env.DB_HOST === '80.225.231.62' && process.env.NODE_ENV !== 'production'
      ? 5435
      : parseInt(process.env.DB_PORT || '5432', 10);

  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      host,
      port,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      connectionTimeoutMillis: 5000,
    });

    let rows: Array<{ url: string; raw_markdown: string }> = [];

    // Step 1: Try exact URL matches first
    if (urls.length > 0) {
      const exactResult = await pool.query<{ url: string; raw_markdown: string }>(
        `SELECT url, raw_markdown
         FROM content_engine.raw_content
         WHERE url = ANY($1) AND is_active = true`,
        [urls],
      );
      rows = exactResult.rows;
    }

    // Step 2: If no exact matches, fall back to domain-level matching
    if (rows.length === 0 && domains.length > 0) {
      const domainPatterns = domains.map((d) => `%${d}%`);
      // Build OR conditions for each domain
      const conditions = domainPatterns.map((_, i) => `url LIKE $${i + 1}`).join(' OR ');
      const domainResult = await pool.query<{ url: string; raw_markdown: string }>(
        `SELECT url, raw_markdown
         FROM content_engine.raw_content
         WHERE (${conditions}) AND is_active = true
         LIMIT 20`,
        domainPatterns,
      );
      rows = domainResult.rows;
    }

    await pool.end();

    if (rows.length === 0) return [];

    const store = harvestImagesFromCrawlRecords(rows);
    let images = store.images;

    // Step 3: If we have keyword hints, filter/boost images whose context matches any keyword
    if (keywords.length > 0 && images.length > 0) {
      const keywordLower = keywords.map((k) => k.toLowerCase());
      const scored = images.map((img) => {
        const contextLower = (img.context + ' ' + img.alt).toLowerCase();
        const matchCount = keywordLower.filter((kw) => contextLower.includes(kw)).length;
        return { img, matchCount };
      });
      // Sort by keyword match score (descending), keep all images but prioritize matching ones
      scored.sort((a, b) => b.matchCount - a.matchCount);
      images = scored.map((s) => s.img);
    }

    return images;
  } catch (err) {
    console.error('Error harvesting images from database:', err);
    return [];
  }
}

