/**
 * scripts/db-inject-images-to-published.ts
 *
 * Retroactive image injection for all published articles.
 * Reads content_engine.raw_content from Dify DB, extracts images,
 * matches them to article bodySections using Jaccard similarity,
 * and rewrites the published JSON + MD artifacts.
 *
 * Usage:
 *   node --import tsx scripts/db-inject-images-to-published.ts
 *   node --import tsx scripts/db-inject-images-to-published.ts --dry-run
 *   node --import tsx scripts/db-inject-images-to-published.ts --slug my-article-slug
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Pool } from 'pg';

// ─── ENV ───────────────────────────────────────────────────────────────────
function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

loadEnvLocal();

// ─── TYPES ─────────────────────────────────────────────────────────────────
type HarvestedImage = {
  id: string;
  src: string;
  alt: string;
  sourceUrl: string;
  hostname: string;
  context: string;
};

type MediaAsset = {
  src: string;
  alt: string;
  caption?: string;
  source?: string;
  sourceUrl?: string;
  credit?: string;
  license?: string;
};

type BodySection = {
  id: string;
  title: string;
  content: string;
  imageMatch?: MediaAsset;
};

type PublishedArtifact = {
  slug: string;
  title: string;
  bodySections: BodySection[];
  media: {
    coverImage: MediaAsset;
    gallery: MediaAsset[];
    figureCaptions: string[];
    imageSources: string[];
    attribution: string[];
  };
  [key: string]: unknown;
};

// ─── IMAGE HELPERS ─────────────────────────────────────────────────────────
const HOST_DENYLIST = [
  'gravatar.com', 'placeholder.com', 'placehold.it', 'doubleclick.net',
  'staticflickr.com', 'googlesyndication.com', 'googletagmanager.com',
  'facebook.com', 'twitter.com', 'instagram.com',
];
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

function isEditorialImage(src: string): boolean {
  const lower = src.toLowerCase();
  if (lower.startsWith('data:')) return false;
  if (HOST_DENYLIST.some((h) => lower.includes(h))) return false;
  if (PATH_DENYLIST.some((f) => lower.includes(f))) return false;
  const dim = lower.match(/[-_/](\d{2,4})x(\d{2,4})[._-]/);
  if (dim) {
    const w = Number(dim[1]);
    const h = Number(dim[2]);
    if (w && h && (w < 200 || h < 150)) return false;
  }
  return true;
}

function extractImagesFromMarkdown(url: string, markdown: string): HarvestedImage[] {
  const lines = markdown.split(/\r?\n/);
  const imgRegex = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  const images: HarvestedImage[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] || '';
    let m: RegExpExecArray | null;
    imgRegex.lastIndex = 0;
    while ((m = imgRegex.exec(line)) !== null) {
      const alt = (m[1] || '').replace(/\s+/g, ' ').trim();
      let src: string;
      try {
        src = new URL(m[2] || '', url).toString();
      } catch {
        continue;
      }
      if (!isEditorialImage(src) || seen.has(src)) continue;
      seen.add(src);
      let hostname = 'source';
      try { hostname = new URL(src).hostname.replace(/^www\./, ''); } catch {}
      const context = [lines[i - 2], lines[i - 1], line, lines[i + 1], lines[i + 2]]
        .filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
      images.push({
        id: `img_${crypto.createHash('sha1').update(src).digest('hex').slice(0, 16)}`,
        src, alt, sourceUrl: url, hostname, context,
      });
    }
  }
  return images;
}

// ─── JACCARD MATCHING ──────────────────────────────────────────────────────
function tokenize(text: string): Set<string> {
  return new Set(text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection++;
  return intersection / (a.size + b.size - intersection);
}

function matchImagesToSections(
  images: HarvestedImage[],
  sections: BodySection[],
): Map<string, HarvestedImage> {
  const result = new Map<string, HarvestedImage>();
  const usedImages = new Set<string>();

  for (const section of sections) {
    const sectionTokens = tokenize(`${section.title} ${section.content.slice(0, 400)}`);
    let bestScore = 0;
    let bestImage: HarvestedImage | null = null;

    for (const img of images) {
      if (usedImages.has(img.id)) continue;
      const imgTokens = tokenize(`${img.alt} ${img.context}`);
      const score = jaccard(sectionTokens, imgTokens);
      if (score > bestScore) {
        bestScore = score;
        bestImage = img;
      }
    }

    // Only assign if score is meaningful
    if (bestImage && bestScore > 0.02) {
      result.set(section.id, bestImage);
      usedImages.add(bestImage.id);
    }
  }

  return result;
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const targetSlug = process.argv.find((a) => a.startsWith('--slug='))?.split('=')[1];

  if (!process.env.DB_HOST || !process.env.DB_DATABASE) {
    console.error('DB not configured. Set DB_HOST and DB_DATABASE in .env.local');
    process.exit(1);
  }

  const host =
    process.env.DB_HOST === '80.225.231.62' && process.env.NODE_ENV !== 'production'
      ? '127.0.0.1'
      : process.env.DB_HOST;
  const port =
    process.env.DB_HOST === '80.225.231.62' && process.env.NODE_ENV !== 'production'
      ? 5435
      : parseInt(process.env.DB_PORT || '5432', 10);

  console.log(`Connecting to Dify DB at ${host}:${port}...`);
  const pool = new Pool({
    host, port,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionTimeoutMillis: 5000,
  });

  // Load ALL crawled content from DB
  const dbResult = await pool.query<{ url: string; raw_markdown: string; domain: string }>(
    `SELECT url, raw_markdown, domain FROM content_engine.raw_content WHERE is_active = true`,
  );
  await pool.end();

  console.log(`Loaded ${dbResult.rows.length} crawled pages from DB.`);

  // Extract all images from all crawled pages, grouped by domain
  const imagesByDomain = new Map<string, HarvestedImage[]>();
  for (const row of dbResult.rows) {
    const images = extractImagesFromMarkdown(row.url, row.raw_markdown);
    if (images.length === 0) continue;
    const domain = row.domain || new URL(row.url).hostname.replace(/^www\./, '');
    const existing = imagesByDomain.get(domain) || [];
    imagesByDomain.set(domain, [...existing, ...images]);
  }

  // All images pool (deduped by src)
  const allImagesSeen = new Set<string>();
  const allImages: HarvestedImage[] = [];
  for (const imgs of imagesByDomain.values()) {
    for (const img of imgs) {
      if (!allImagesSeen.has(img.src)) {
        allImagesSeen.add(img.src);
        allImages.push(img);
      }
    }
  }
  console.log(`Total editorial images harvested: ${allImages.length}`);

  // Process published articles
  const publishedDir = path.join(process.cwd(), 'content', 'published');
  const files = fs.readdirSync(publishedDir)
    .filter((f) => f.endsWith('.json'))
    .filter((f) => !targetSlug || f === `${targetSlug}.json`);

  console.log(`Processing ${files.length} published article(s)...`);

  let updated = 0;
  let skipped = 0;

  for (const file of files) {
    const jsonPath = path.join(publishedDir, file);
    const mdPath = path.join(publishedDir, file.replace('.json', '.md'));
    const slug = file.replace('.json', '');

    let artifact: PublishedArtifact;
    try {
      artifact = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    } catch {
      console.warn(`  Skip ${slug}: cannot parse JSON`);
      skipped++;
      continue;
    }

    const sections: BodySection[] = artifact.bodySections || [];
    if (sections.length === 0) {
      console.log(`  Skip ${slug}: no bodySections`);
      skipped++;
      continue;
    }

    // Get sourceHints from content-jobs if available, else use domain from cover image
    let relevantImages = allImages;

    // Try to narrow by domain from existing cover image source
    const coverSource = artifact.media?.coverImage?.source;
    if (coverSource) {
      const domainImages = imagesByDomain.get(coverSource) || [];
      if (domainImages.length > 0) relevantImages = domainImages;
    }

    // Use full pool if we have few images
    if (relevantImages.length < 3) relevantImages = allImages;

    // Jaccard match
    const matchMap = matchImagesToSections(relevantImages, sections);

    if (matchMap.size === 0) {
      console.log(`  Skip ${slug}: no image matches found`);
      skipped++;
      continue;
    }

    console.log(`  ${slug}: matched ${matchMap.size}/${sections.length} sections`);

    // Update bodySections with imageMatch
    artifact.bodySections = sections.map((section) => {
      const matched = matchMap.get(section.id);
      if (!matched) return section;
      return {
        ...section,
        imageMatch: {
          src: matched.src,
          alt: matched.alt || `FPV image from ${matched.hostname}`,
          caption: matched.alt || `Source: ${matched.hostname}`,
          source: matched.hostname,
          sourceUrl: matched.sourceUrl,
          credit: `Source: ${matched.hostname}`,
          license: 'attribution',
        },
      };
    });

    // Also update gallery if empty
    const matched = [...matchMap.values()];
    if (!artifact.media) {
      (artifact as any).media = { gallery: [], figureCaptions: [], imageSources: [], attribution: [] };
    }
    if ((artifact.media.gallery || []).length === 0 && matched.length > 0) {
      artifact.media.gallery = matched.slice(0, 4).map((img) => ({
        src: img.src,
        alt: img.alt || `FPV image from ${img.hostname}`,
        caption: img.alt || `Source: ${img.hostname}`,
        source: img.hostname,
        sourceUrl: img.sourceUrl,
        credit: `Source: ${img.hostname}`,
        license: 'attribution',
      }));
    }

    if (!isDryRun) {
      fs.writeFileSync(jsonPath, JSON.stringify(artifact, null, 2) + '\n', 'utf-8');

      // Rewrite Markdown with inline images
      const mdSections = artifact.bodySections.map((section) => {
        const imgMd = section.imageMatch
          ? `\n\n![${section.imageMatch.alt}](${section.imageMatch.src})\n_${section.imageMatch.caption || section.imageMatch.alt}_`
          : '';
        return `## ${section.title}\n\n${section.content}${imgMd}\n`;
      });
      const markdown = [
        `# ${artifact.title}`,
        '',
        ...(artifact.excerpt ? [`> ${artifact.excerpt}`, ''] : []),
        ...mdSections,
      ].join('\n');
      fs.writeFileSync(mdPath, markdown + '\n', 'utf-8');
    }

    updated++;
  }

  console.log(`\n✓ Done! Updated: ${updated}, Skipped: ${skipped}, Dry run: ${isDryRun}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
