import fs from 'fs';
import path from 'path';

const ROOTS = ['src', 'scripts'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs']);
const STOCK_URL = /https?:\/\/[^\s"'`]*(?:picsum\.photos|(?:images\.)?unsplash\.com|(?:images\.)?pexels\.com)/gi;
const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');
const STATIC_FALLBACK = /^\/images\/fallbacks\//;
const ALLOWED_FILES = new Set([
  path.normalize('src/lib/content-automation/crawl-image-license.ts'),
]);

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

if (fs.existsSync(PUBLISHED_DIR)) {
  for (const file of fs.readdirSync(PUBLISHED_DIR).filter((name) => name.endsWith('.json'))) {
    const filePath = path.join(PUBLISHED_DIR, file);
    try {
      const article = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
        slug?: string;
        coverImage?: unknown;
        media?: { coverImage?: { src?: unknown } };
      };
      const coverSrc =
        typeof article.media?.coverImage?.src === 'string'
          ? article.media.coverImage.src
          : typeof article.coverImage === 'string'
            ? article.coverImage
            : '';
      if (!coverSrc) continue;
      const slug = article.slug || file.replace(/\.json$/, '');
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

const generatedCount = [...coverUsage.keys()].filter((src) => src.startsWith('/api/content/media/cover/')).length;
console.log(`Published media audit passed: ${coverUsage.size} unique primary covers (${generatedCount} slug-specific generated covers).`);
