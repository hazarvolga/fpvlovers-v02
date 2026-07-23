import fs from 'fs';
import path from 'path';
import {
  resolveHomepageFallbackCover,
  shouldPreferHomepageFallbackCover,
} from '../src/lib/homepage/homepage-media';
import type { ContentMetadata } from '../src/lib/content-metadata';

const ROOTS = ['src', 'scripts'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs']);
const STOCK_URL = /https?:\/\/[^\s"'`]*(?:picsum\.photos|(?:images\.)?unsplash\.com|(?:images\.)?pexels\.com)/gi;
const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');
const STATIC_FALLBACK = /^\/images\/fallbacks\//;
const GENERATED_COVER = /^\/api\/content\/media\/cover\//;
const ALLOWED_FILES = new Set([
  path.normalize('src/lib/content-automation/crawl-image-license.ts'),
]);

type PublishedMediaRow = {
  slug: string;
  file: string;
  category: string;
  template: string;
  contentType: string;
  publishedAt: string;
  coverSrc: string;
  homepageCoverSrc: string;
  galleryCount: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function generatedCover(src: string): boolean {
  return GENERATED_COVER.test(src);
}

function isCommercialMediaRow(row: PublishedMediaRow): boolean {
  if (row.contentType === 'review') return false;
  return ['buyer-guide', 'comparison', 'product-roundup'].includes(row.contentType)
    || ['Buyer Guides', 'Comparisons', 'Components'].includes(row.category)
    || row.template === 'comparison';
}

function listSourceFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];

  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(root, entry.name);
    if (entry.isDirectory()) return listSourceFiles(filePath);
    return EXTENSIONS.has(path.extname(entry.name)) ? [filePath] : [];
  });
}

const violations: string[] = [];

for (const root of ROOTS) {
  for (const filePath of listSourceFiles(path.join(process.cwd(), root))) {
    const relativePath = path.relative(process.cwd(), filePath);
    if (ALLOWED_FILES.has(path.normalize(relativePath))) continue;

    const source = fs.readFileSync(filePath, 'utf8');
    const matches = source.match(STOCK_URL) || [];
    for (const match of matches) {
      violations.push(`${relativePath}: ${match}`);
    }
  }
}

for (const filePath of listSourceFiles(path.join(process.cwd(), 'src', 'app'))) {
  if (!filePath.endsWith('.tsx')) continue;
  const source = fs.readFileSync(filePath, 'utf8');
  if (source.includes('SubpageHero') && /(?:image|src)=["']\/images\/fallbacks\//.test(source)) {
    violations.push(`${path.relative(process.cwd(), filePath)}: hub hero still hard-codes a fallback image`);
  }
}

if (violations.length > 0) {
  console.error('Generic stock image URLs are forbidden outside the media-policy denylist:');
  for (const violation of violations) console.error(`  - ${violation}`);
  process.exit(1);
}

console.log('Media policy audit passed: no Unsplash, Pexels, or Picsum runtime URLs found.');

const publishedCoverViolations: string[] = [];
const coverUsage = new Map<string, string[]>();
const publishedMediaRows: PublishedMediaRow[] = [];

if (fs.existsSync(PUBLISHED_DIR)) {
  for (const file of fs.readdirSync(PUBLISHED_DIR).filter((name) => name.endsWith('.json'))) {
    const filePath = path.join(PUBLISHED_DIR, file);
    try {
      const article = asRecord(JSON.parse(fs.readFileSync(filePath, 'utf8')));
      if (!article) {
        publishedCoverViolations.push(`${file}: invalid JSON shape`);
        continue;
      }
      const media = asRecord(article.media);
      const mediaCover = asRecord(media?.coverImage);
      const metadata = asRecord(article.metadata);
      const coverSrc =
        asString(mediaCover?.src) || asString(article.coverImage);
      if (!coverSrc) continue;
      const slug = asString(article.slug) || file.replace(/\.json$/, '');
      const title = asString(article.title);
      const category = asString(article.category);
      const homepageFallback = resolveHomepageFallbackCover({
        slug,
        title,
        category,
        metadata: metadata as unknown as ContentMetadata,
      });
      const homepageCoverSrc = shouldPreferHomepageFallbackCover(coverSrc)
        ? homepageFallback
        : coverSrc;
      publishedMediaRows.push({
        slug,
        file,
        category,
        template: asString(article.template),
        contentType: asString(metadata?.contentType),
        publishedAt: asString(article.publishedAt),
        coverSrc,
        homepageCoverSrc,
        galleryCount: Array.isArray(media?.gallery) ? media.gallery.length : 0,
      });
      if (STATIC_FALLBACK.test(coverSrc)) {
        publishedCoverViolations.push(`${file}: ${coverSrc}`);
      }
      const usages = coverUsage.get(coverSrc) || [];
      usages.push(slug);
      coverUsage.set(coverSrc, usages);
    } catch (error) {
      publishedCoverViolations.push(`${file}: invalid JSON (${String(error)})`);
    }
  }
}

if (publishedCoverViolations.length > 0) {
  console.error('Published artifacts still point at static fallback covers:');
  for (const violation of publishedCoverViolations) console.error(`  - ${violation}`);
  process.exit(1);
}

const repeatedStaticSources = [...coverUsage.entries()]
  .filter(([src, slugs]) => slugs.length > 1 && STATIC_FALLBACK.test(src))
  .map(([src, slugs]) => `${src} (${slugs.length}): ${slugs.join(', ')}`);

if (repeatedStaticSources.length > 0) {
  console.error('Static fallback cover reuse detected in published artifacts:');
  for (const source of repeatedStaticSources) console.error(`  - ${source}`);
  process.exit(1);
}

const recentRows = [...publishedMediaRows]
  .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
  .slice(0, 12);
const recentMediaViolations = recentRows
  .filter((row) => !row.homepageCoverSrc || generatedCover(row.homepageCoverSrc))
  .map((row) => `${row.slug}: homepageCover=${row.homepageCoverSrc || 'missing'}, artifactCover=${row.coverSrc || 'missing'}`);

if (recentMediaViolations.length > 0) {
  console.error('Recent homepage candidates must have a non-generated display cover:');
  for (const violation of recentMediaViolations) console.error(`  - ${violation}`);
  process.exit(1);
}

const commercialMediaViolations = publishedMediaRows
  .filter(isCommercialMediaRow)
  .filter((row) => generatedCover(row.coverSrc) || row.galleryCount === 0)
  .map((row) => `${row.slug}: cover=${row.coverSrc || 'missing'}, gallery=${row.galleryCount}`);

if (commercialMediaViolations.length > 0) {
  console.error('Commercial/buyer-intent artifacts need source-backed media before release:');
  for (const violation of commercialMediaViolations) console.error(`  - ${violation}`);
  process.exit(1);
}

const generatedCount = [...coverUsage.keys()].filter((src) => src.startsWith('/api/content/media/cover/')).length;
const homepageFallbackDisplayCount = recentRows.filter((row) => row.homepageCoverSrc !== row.coverSrc).length;
console.log(`Published media audit passed: ${coverUsage.size} unique primary covers (${generatedCount} non-commercial generated covers, ${homepageFallbackDisplayCount} recent display fallbacks).`);
