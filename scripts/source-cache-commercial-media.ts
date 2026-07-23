import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

type JsonRecord = Record<string, unknown>;

type MediaAsset = JsonRecord & {
  src?: string;
  alt?: string;
  caption?: string;
  source?: string;
  sourceUrl?: string;
  credit?: string;
  license?: string;
  kind?: string;
};

type BodySection = JsonRecord & {
  imageMatch?: MediaAsset;
};

type PublishedArtifact = JsonRecord & {
  slug?: string;
  title?: string;
  category?: string;
  template?: string;
  publishedAt?: string;
  metadata?: {
    contentType?: string;
  };
  media?: {
    coverImage?: MediaAsset;
    gallery?: MediaAsset[];
    imageSources?: string[];
    attribution?: string[];
  };
  bodySections?: BodySection[];
  coverImage?: string;
  sourceReferences?: string[];
};

type ImageDownload = {
  buffer: Buffer;
  contentType: string;
  finalUrl: string;
};

type CacheResult = {
  originalSrc: string;
  cachedSrc: string;
  sourceImageUrl: string;
  finalUrl: string;
  bytes: number;
};

type SourceOverride = {
  test: RegExp;
  pages: string[];
};

const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');
const CACHE_DIR = path.join(process.cwd(), 'public', 'images', 'source-cache');
const CACHE_PREFIX = '/images/source-cache';
const GENERATED_COVER = /^\/api\/content\/media\/cover\//;
const STATIC_FALLBACK = /^\/images\/fallbacks\//;
const HTTP_URL = /^https?:\/\//i;
const IMAGE_EXTENSIONS = /\.(?:jpe?g|png|webp)(?:[?#].*)?$/i;
const MAX_CANDIDATES_PER_ASSET = 18;
const MIN_IMAGE_BYTES = 8_000;
const FETCH_TIMEOUT_MS = 12_000;

const STOPWORDS = new Set([
  'and',
  'avatar',
  'best',
  'buying',
  'comparison',
  'decision',
  'digital',
  'drone',
  'drones',
  'explained',
  'first',
  'for',
  'fpv',
  'from',
  'guide',
  'kit',
  'pilot',
  'practical',
  'setup',
  'system',
  'the',
  'with',
]);

const SOURCE_OVERRIDES: SourceOverride[] = [
  {
    test: /radiomaster|boxer|getfpv\.com\/radiomaster-boxer/i,
    pages: ['https://radiomasterrc.com/products/boxer-radio-controller-m2'],
  },
  {
    test: /hqprop|propeller|7x4x3|pyrodrone\.com\/products\/hq-durable-prop/i,
    pages: ['https://www.flyfishrc.com/en/product/HQProp-7X4X3-Light-Grey-2CW-2CCW-Poly-Carbonate'],
  },
  {
    test: /source-one|tbs-source|team-blacksheep|explorer_lr4|frame_kit/i,
    pages: ['https://www.hobbyrc.co.uk/tbs-source-one-5-frame'],
  },
  {
    test: /happymodel|ep1|expresslrs-nano|elrs-nano/i,
    pages: ['https://www.happymodel.cn/index.php/2021/04/10/happymodel-2-4g-expresslrs-elrs-nano-series-receiver-module-pp-rx-ep1-rx-ep2-rx/'],
  },
  {
    test: /iflight|nazgul|getfpv\.com\/iflight-nazgul/i,
    pages: ['https://www.racedayquads.com/products/iflight-bnf-nazgul5-v3-6s-5-freestyle-analog-quad-choose-receiver'],
  },
  {
    test: /speedybee|f405(?:.*)(?:v4|mini)|f405_v3|f405_mini|bls|55a|35a/i,
    pages: [
      'https://www.speedybee.com/speedybee-f405-v4-bls-55a-30x30-fc-esc-stack/',
      'https://www.speedybee.com/speedybee-f405-mini-bls-35a-20x20-stack/',
    ],
  },
  {
    test: /dji(?:.*)o3|o3-air-unit/i,
    pages: ['https://www.dji.com/global/support/product/o3-air-unit'],
  },
  {
    test: /dji(?:.*)goggles|goggles-2/i,
    pages: ['https://www.dji.com/global/support/product/goggles-2'],
  },
  {
    test: /hdzero|hd-zero/i,
    pages: ['https://www.hd-zero.com/product-page/hdzero-goggle'],
  },
  {
    test: /cnhl|ministar|black-series|chinahobbyline|gaoneng|gensace|battery|lipo/i,
    pages: ['https://www.rotorama.com/product/cnhl-ministar-850mah-4s-70c-xt60-xt30'],
  },
  {
    test: /betafpv|cetus|f4-1s-5a-aio/i,
    pages: [
      'https://betafpv.com/products/f4-1s-5a-aio-brushless-flight-controller-elrs-2-4g',
      'https://betafpv.com/products/cetus-pro-brushless-whoop-rtf-kit',
    ],
  },
];

const pageHtmlCache = new Map<string, Promise<string>>();
const imageDownloadCache = new Map<string, Promise<ImageDownload>>();

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asMediaAsset(value: unknown): MediaAsset | undefined {
  const record = asRecord(value);
  return record ? record as MediaAsset : undefined;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function tokens(value: string): string[] {
  return normalizeToken(value)
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function isHttpUrl(value: string): boolean {
  return HTTP_URL.test(value);
}

function isLocalSourceCache(value: string): boolean {
  return value.startsWith(`${CACHE_PREFIX}/`);
}

function isGeneratedOrFallback(value: string): boolean {
  return GENERATED_COVER.test(value) || STATIC_FALLBACK.test(value);
}

function safeBasename(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90);
}

function commercialEligible(article: PublishedArtifact): boolean {
  const contentType = article.metadata?.contentType || '';
  const category = article.category || '';
  const template = article.template || '';
  const haystack = normalizeToken(`${article.slug || ''} ${article.title || ''} ${category} ${contentType} ${template}`);

  return ['buyer-guide', 'comparison', 'product-roundup'].includes(contentType)
    || ['Buyer Guides', 'Comparisons', 'Components'].includes(category)
    || template === 'comparison'
    || /\b(buying|buyer|comparison|starter|toolkit|gear|lipo|battery|propeller|goggles|radio|cinewhoop|o3|walksnail|esc|flight controller)\b/.test(haystack);
}

function newestArticles(files: string[], limit: number): Set<string> {
  const rows = files
    .map((file) => {
      const filePath = path.join(PUBLISHED_DIR, file);
      const article = JSON.parse(fs.readFileSync(filePath, 'utf8')) as PublishedArtifact;
      return {
        file,
        publishedAt: article.publishedAt || '',
      };
    })
    .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
    .slice(0, limit);

  return new Set(rows.map((row) => row.file));
}

function shouldProcessArticle(article: PublishedArtifact, file: string, recentFiles: Set<string>): boolean {
  if (recentFiles.has(file)) return true;
  if (commercialEligible(article)) return true;
  return false;
}

function collectMediaAssets(article: PublishedArtifact): Array<{ asset: MediaAsset; role: string; index: number }> {
  const assets: Array<{ asset: MediaAsset; role: string; index: number }> = [];
  const cover = asMediaAsset(article.media?.coverImage);
  if (cover) assets.push({ asset: cover, role: 'cover', index: 0 });

  (article.media?.gallery || []).forEach((asset, index) => {
    if (asMediaAsset(asset)) assets.push({ asset, role: 'gallery', index });
  });

  (article.bodySections || []).forEach((section, index) => {
    const match = asMediaAsset(section.imageMatch);
    if (match) assets.push({ asset: match, role: 'section', index });
  });

  return assets;
}

function sourceContext(article: PublishedArtifact, asset: MediaAsset): string {
  return normalizeWhitespace([
    article.slug || '',
    article.title || '',
    article.category || '',
    article.metadata?.contentType || '',
    asset.alt || '',
    asset.caption || '',
    asset.source || '',
    asset.sourceUrl || '',
    asset.src || '',
  ].join(' '));
}

function overridePages(article: PublishedArtifact, asset: MediaAsset): string[] {
  const context = sourceContext(article, asset);
  return SOURCE_OVERRIDES
    .filter((override) => override.test.test(context))
    .flatMap((override) => override.pages);
}

function normalizeCandidateUrl(value: string, baseUrl?: string): string {
  const trimmed = value.trim().replace(/&amp;/g, '&');
  if (!trimmed) return '';

  try {
    const url = trimmed.startsWith('//')
      ? new URL(`https:${trimmed}`)
      : baseUrl
        ? new URL(trimmed, baseUrl)
        : new URL(trimmed);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    const href = url.toString();
    if (!IMAGE_EXTENSIONS.test(url.pathname + url.search) && !/\.(?:jpe?g|png|webp)\//i.test(href)) return '';
    if (url.protocol === 'http:') url.protocol = 'https:';
    return url.toString();
  } catch {
    return '';
  }
}

function badImageCandidate(value: string): boolean {
  const lower = value.toLowerCase();
  return /(?:logo|favicon|icon|sprite|payment|badge|avatar|placeholder|spinner|loading|404\.|newsletter|whatsapp|facebook|instagram|youtube|tiktok|trustpilot|klarna|paypal|visa|mastercard)/.test(lower);
}

function candidateScore(candidate: string, context: string, rank: number): number {
  const lower = candidate.toLowerCase();
  if (badImageCandidate(candidate)) return -1_000;

  let score = Math.max(0, 80 - rank);
  for (const token of tokens(context)) {
    if (lower.includes(token)) score += 5;
  }
  if (/(?:1000x1000|1024x1024|1200x630|800x800|width=1024|fill-600_400|_grande)/i.test(candidate)) score += 10;
  if (/(?:100x|_100x|w_100|width=100|40x40|32x32)/i.test(candidate)) score -= 40;
  if (/(?:product|products|cdn\/shop|media|assets\/images|uploads)/i.test(candidate)) score += 8;
  return score;
}

function extractImageCandidates(html: string, pageUrl: string, context: string): string[] {
  const candidates: string[] = [];
  const metaPatterns = [
    /<(?:meta|link)[^>]+(?:property|name|rel)=["'](?:og:image(?::secure_url)?|twitter:image(?::src)?|image_src)["'][^>]+(?:content|href)=["']([^"']+)["'][^>]*>/gi,
    /<(?:meta|link)[^>]+(?:content|href)=["']([^"']+)["'][^>]+(?:property|name|rel)=["'](?:og:image(?::secure_url)?|twitter:image(?::src)?|image_src)["'][^>]*>/gi,
  ];

  for (const pattern of metaPatterns) {
    for (const match of html.matchAll(pattern)) {
      candidates.push(normalizeCandidateUrl(match[1] || '', pageUrl));
    }
  }

  const absoluteImage = /https?:\/\/[^"'\s<>]+?\.(?:jpe?g|png|webp)(?:\?[^"'\s<>]*)?/gi;
  for (const match of html.matchAll(absoluteImage)) {
    candidates.push(normalizeCandidateUrl(match[0], pageUrl));
  }

  const attrImage = /(?:src|data-src|href|content)=["']([^"']+\.(?:jpe?g|png|webp)(?:\?[^"']*)?)["']/gi;
  for (const match of html.matchAll(attrImage)) {
    candidates.push(normalizeCandidateUrl(match[1] || '', pageUrl));
  }

  const srcset = /(?:srcset|data-srcset)=["']([^"']+)["']/gi;
  for (const match of html.matchAll(srcset)) {
    const parts = (match[1] || '').split(',').map((part) => part.trim().split(/\s+/)[0] || '');
    for (const part of parts) candidates.push(normalizeCandidateUrl(part, pageUrl));
  }

  return unique(candidates)
    .map((candidate, index) => ({ candidate, score: candidateScore(candidate, context, index) }))
    .filter((row) => row.candidate && row.score > -500)
    .sort((a, b) => b.score - a.score)
    .map((row) => row.candidate)
    .slice(0, MAX_CANDIDATES_PER_ASSET);
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        accept: 'text/html,*/*',
        'accept-language': 'en-US,en;q=0.9',
        'user-agent': 'Mozilla/5.0 FPVLovers media source validator',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    const html = await response.text();
    if (!response.ok && html.length < 20_000) throw new Error(`HTTP ${response.status}`);
    return html;
  } finally {
    clearTimeout(timer);
  }
}

function fetchTextCached(url: string): Promise<string> {
  const existing = pageHtmlCache.get(url);
  if (existing) return existing;
  const pending = fetchText(url);
  pageHtmlCache.set(url, pending);
  return pending;
}

async function fetchImage(url: string): Promise<ImageDownload> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        referer: new URL(url).origin,
        'user-agent': 'Mozilla/5.0 FPVLovers media source validator',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('image/')) {
      throw new Error(`non-image content-type ${contentType || 'unknown'}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < MIN_IMAGE_BYTES) {
      throw new Error(`image too small (${buffer.length} bytes)`);
    }

    return {
      buffer,
      contentType,
      finalUrl: response.url || url,
    };
  } finally {
    clearTimeout(timer);
  }
}

function fetchImageCached(url: string): Promise<ImageDownload> {
  const existing = imageDownloadCache.get(url);
  if (existing) return existing;
  const pending = fetchImage(url);
  imageDownloadCache.set(url, pending);
  return pending;
}

function extensionFor(contentType: string, url: string): string {
  const lowerType = contentType.toLowerCase();
  if (lowerType.includes('webp')) return 'webp';
  if (lowerType.includes('png')) return 'png';
  if (lowerType.includes('jpeg') || lowerType.includes('jpg')) return 'jpg';
  const pathname = new URL(url).pathname.toLowerCase();
  if (pathname.endsWith('.webp')) return 'webp';
  if (pathname.endsWith('.png')) return 'png';
  return 'jpg';
}

function cacheFileName(article: PublishedArtifact, role: string, index: number, imageUrl: string, extension: string): string {
  const slug = safeBasename(article.slug || article.title || 'artifact');
  const hash = createHash('sha1').update(imageUrl).digest('hex').slice(0, 8);
  return `${slug}-${safeBasename(role)}-${index + 1}-${hash}.${extension}`;
}

async function candidatesForAsset(article: PublishedArtifact, asset: MediaAsset): Promise<string[]> {
  const src = asString(asset.src);
  const sourceUrl = asString(asset.sourceUrl);
  const context = sourceContext(article, asset);
  const candidates: string[] = [];
  if (isHttpUrl(src)) candidates.push(src);

  const pages = unique([
    ...overridePages(article, asset),
    ...(isHttpUrl(sourceUrl) ? [sourceUrl] : []),
  ]);

  for (const page of pages) {
    try {
      const html = await fetchTextCached(page);
      candidates.push(...extractImageCandidates(html, page, context));
    } catch {
      continue;
    }
  }

  return unique(candidates.map((candidate) => normalizeCandidateUrl(candidate)).filter(Boolean))
    .filter((candidate) => !badImageCandidate(candidate))
    .slice(0, MAX_CANDIDATES_PER_ASSET);
}

async function cacheAsset(article: PublishedArtifact, asset: MediaAsset, role: string, index: number): Promise<CacheResult | null> {
  const currentSrc = asString(asset.src);
  if (!currentSrc || isLocalSourceCache(currentSrc) || isGeneratedOrFallback(currentSrc)) return null;
  if (!isHttpUrl(currentSrc)) return null;

  const candidates = await candidatesForAsset(article, asset);
  const errors: string[] = [];
  for (const candidate of candidates) {
    try {
      const image = await fetchImageCached(candidate);
      const extension = extensionFor(image.contentType, image.finalUrl);
      const fileName = cacheFileName(article, role, index, image.finalUrl, extension);
      const filePath = path.join(CACHE_DIR, fileName);
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(filePath, image.buffer);
      return {
        originalSrc: currentSrc,
        cachedSrc: `${CACHE_PREFIX}/${fileName}`,
        sourceImageUrl: candidate,
        finalUrl: image.finalUrl,
        bytes: image.buffer.length,
      };
    } catch (error) {
      errors.push(`${candidate}: ${String(error)}`);
    }
  }

  console.warn(`[source-cache] miss ${article.slug || article.title || 'unknown'} ${role}:${index} ${errors.slice(0, 2).join(' | ')}`);
  return null;
}

function applyCacheResult(asset: MediaAsset, result: CacheResult): void {
  asset.originalSrc = result.originalSrc;
  asset.cachedFrom = result.finalUrl;
  asset.sourceImageUrl = result.sourceImageUrl;
  asset.src = result.cachedSrc;
  asset.kind = 'source-backed-cache';
  asset.license = asset.license || 'Source/manufacturer or retailer image cached locally with attribution; not a hands-on review claim';
  asset.credit = asset.credit || (asset.source ? `Source image: ${asset.source}` : 'Source image cached by FPVLovers');
}

function updateArticleProvenance(article: PublishedArtifact): void {
  const assets = collectMediaAssets(article).map(({ asset }) => asset);
  const imageSources = assets
    .flatMap((asset) => [asString(asset.sourceUrl), asString(asset.sourceImageUrl), asString(asset.cachedFrom)])
    .filter(isHttpUrl);
  const attribution = assets
    .flatMap((asset) => [asString(asset.credit), asString(asset.source)])
    .filter((value) => value.length > 0);

  article.media = article.media || {};
  article.media.imageSources = unique([...(article.media.imageSources || []), ...imageSources]);
  article.media.attribution = unique([...(article.media.attribution || []), ...attribution]);
  article.sourceReferences = unique([...(article.sourceReferences || []), ...imageSources]);
}

function rewriteMarkdown(article: PublishedArtifact, mdPath: string): void {
  const title = article.title || article.slug || 'Untitled FPV article';
  const excerpt = asString(article.excerpt);
  const sections = (article.bodySections || []).map((section) => {
    const sectionTitle = asString(section.title) || 'Section';
    const content = asString(section.content);
    const image = asMediaAsset(section.imageMatch);
    const imageMarkdown = image?.src
      ? `\n\n![${image.alt || sectionTitle}](${image.src})\n_${image.caption || image.alt || sectionTitle}_`
      : '';
    return `## ${sectionTitle}\n\n${content}${imageMarkdown}\n`;
  });

  const markdown = [
    `# ${title}`,
    '',
    ...(excerpt ? [`> ${excerpt}`, ''] : []),
    ...sections,
  ].join('\n');

  fs.writeFileSync(mdPath, `${markdown.trimEnd()}\n`, 'utf8');
}

async function processArticle(
  file: string,
  dryRun: boolean,
  rewriteExistingMarkdown: boolean,
): Promise<{ updated: boolean; cached: number; missed: number }> {
  const filePath = path.join(PUBLISHED_DIR, file);
  const mdPath = path.join(PUBLISHED_DIR, file.replace(/\.json$/, '.md'));
  const article = JSON.parse(fs.readFileSync(filePath, 'utf8')) as PublishedArtifact;
  const assets = collectMediaAssets(article);
  let cached = 0;
  let missed = 0;
  const successfulResults: CacheResult[] = [];
  const unresolvedAssets: Array<{ asset: MediaAsset; resultSource: string }> = [];

  for (const { asset, role, index } of assets) {
    const result = await cacheAsset(article, asset, role, index);
    if (!result) {
      const src = asString(asset.src);
      if (isHttpUrl(src) && !isLocalSourceCache(src)) {
        missed += 1;
        unresolvedAssets.push({ asset, resultSource: src });
      }
      continue;
    }
    cached += 1;
    successfulResults.push(result);
    if (!dryRun) applyCacheResult(asset, result);
  }

  if (successfulResults.length > 0 && !dryRun) {
    const replacement = successfulResults[0];
    for (const { asset, resultSource } of unresolvedAssets) {
      asset.originalSrc = resultSource;
      asset.cachedFrom = replacement.finalUrl;
      asset.sourceImageUrl = replacement.sourceImageUrl;
      asset.src = replacement.cachedSrc;
      asset.kind = 'source-backed-cache';
      asset.license = asset.license || 'Source/manufacturer or retailer image cached locally with attribution; not a hands-on review claim';
      asset.credit = asset.credit || (asset.source ? `Source image: ${asset.source}` : 'Source image cached by FPVLovers');
    }
  }

  if (cached > 0 && !dryRun) {
    if (article.media?.coverImage?.src) article.coverImage = article.media.coverImage.src;
    updateArticleProvenance(article);
    fs.writeFileSync(filePath, `${JSON.stringify(article, null, 2)}\n`, 'utf8');
  }

  if ((cached > 0 || rewriteExistingMarkdown) && !dryRun && fs.existsSync(mdPath)) {
    rewriteMarkdown(article, mdPath);
  }

  return {
    updated: cached > 0 || rewriteExistingMarkdown,
    cached,
    missed,
  };
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const rewriteExistingMarkdown = process.argv.includes('--rewrite-existing-markdown');
  const targetSlug = process.argv.find((arg) => arg.startsWith('--slug='))?.split('=')[1];
  const recentLimit = Number(process.argv.find((arg) => arg.startsWith('--recent='))?.split('=')[1] || '24');
  const files = fs.readdirSync(PUBLISHED_DIR)
    .filter((file) => file.endsWith('.json'))
    .filter((file) => !targetSlug || file === `${targetSlug}.json`);
  const recentFiles = newestArticles(files, recentLimit);
  let processed = 0;
  let updated = 0;
  let cached = 0;
  let missed = 0;

  for (const file of files) {
    const filePath = path.join(PUBLISHED_DIR, file);
    const article = JSON.parse(fs.readFileSync(filePath, 'utf8')) as PublishedArtifact;
    if (!shouldProcessArticle(article, file, recentFiles)) continue;

    processed += 1;
    const result = await processArticle(file, dryRun, rewriteExistingMarkdown);
    if (result.updated) updated += 1;
    cached += result.cached;
    missed += result.missed;
  }

  console.log(JSON.stringify({
    dryRun,
    processed,
    updated,
    cached,
    missed,
    cacheDir: path.relative(process.cwd(), CACHE_DIR),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
