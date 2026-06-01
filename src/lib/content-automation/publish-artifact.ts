import fs from 'fs';
import path from 'path';
import type { GeneratedContent } from './parse-generated-content';
import { buildContentMedia } from './content-media';
import type { ContentJob } from './types';
import { matchImagesToSections, pickBestRelevantImage } from './crawl-image-match';
import { harvestImagesFromDatabase } from './crawl-image-harvest';
import { classifyImageLicenses } from './crawl-image-license';

const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function publishGeneratedContentArtifact(
  slug: string,
  job: ContentJob,
  content: GeneratedContent,
): Promise<string> {
  ensureDir(PUBLISHED_DIR);
  const jsonPath = path.join(PUBLISHED_DIR, `${slug}.json`);
  const mdPath = path.join(PUBLISHED_DIR, `${slug}.md`);

  // 1. Asynchronously harvest crawled images from the database using sourceHints
  let crawledLicensed: any[] = [];
  if (job.sourceHints && job.sourceHints.length > 0) {
    const crawledImages = await harvestImagesFromDatabase(job.sourceHints);
    if (crawledImages && crawledImages.length > 0) {
      crawledLicensed = classifyImageLicenses(crawledImages);
    }
  }

  // 2. Resolve default stock media fallback
  const media = content.media || buildContentMedia({
    slug,
    title: content.title,
    category: job.category,
    excerpt: content.excerpt,
  });

  // 3. Prioritize crawled images over stock photos
  if (crawledLicensed.length > 0) {
    const crawledAssets = crawledLicensed.map((img) => ({
      src: img.src,
      alt: img.alt || `FPV crawled image from ${img.hostname}`,
      caption: img.alt || `Original asset crawled from ${img.hostname}`,
      source: img.hostname,
      sourceUrl: img.sourceUrl,
      credit: `Source: ${img.hostname} (${img.licenseReason})`,
      license: img.license,
    }));

    // Prepend crawled images to the gallery pool
    media.gallery = [...crawledAssets, ...media.gallery].slice(0, 6);

    // Pick the absolute best crawled image as the cover image if highly relevant
    const bestCrawlCover = pickBestRelevantImage(crawledLicensed, content.bodySections);
    if (bestCrawlCover) {
      media.coverImage = {
        src: bestCrawlCover.src,
        alt: bestCrawlCover.alt || content.title,
        caption: bestCrawlCover.alt || content.title,
        source: bestCrawlCover.hostname,
        sourceUrl: bestCrawlCover.sourceUrl,
        credit: `Source: ${bestCrawlCover.hostname} (${bestCrawlCover.licenseReason})`,
        license: bestCrawlCover.license,
      };
    }
  }

  // 4. Perform Jaccard semantic matching of gallery images to bodySections
  if (media && media.gallery && media.gallery.length > 0 && content.bodySections && content.bodySections.length > 0) {
    const licensedImages = media.gallery.map((asset, index) => ({
      id: `gallery_${index}`,
      src: asset.src,
      alt: asset.alt,
      sourceUrl: asset.sourceUrl || '',
      hostname: asset.source || 'stock',
      context: `${asset.caption || ''} ${asset.alt || ''}`,
      license: (asset.license as any) || 'open',
      canSelfHost: true,
      licenseReason: 'Gallery asset',
    }));

    const matchResult = matchImagesToSections(licensedImages, content.bodySections);
    const matchesMap = new Map(matchResult.matches.map(m => [m.sectionId, m.image]));

    content.bodySections = content.bodySections.map((section) => {
      const matched = matchesMap.get(section.id);
      if (matched) {
        const originalAsset = media.gallery.find(g => g.src === matched.src);
        if (originalAsset) {
          return {
            ...section,
            imageMatch: originalAsset,
          };
        }
      }
      return section;
    });
  }

  const filteredNotes = (content.publishNotes || []).filter(
    (note) =>
      note !== 'Schema generated' &&
      note !== 'Affiliate analysis generated' &&
      note !== 'SEO research generated'
  );

  const artifact = {
    slug,
    title: content.title,
    jobId: job.id,
    category: job.category,
    template: job.template,
    seo: content.seo,
    excerpt: content.excerpt,
    bodySections: content.bodySections,
    internalLinks: content.internalLinks,
    publishNotes: filteredNotes,
    media,
    jobStatus: job.status,
    publishedAt: new Date().toISOString(),
    promptVersion: job.promptVersion,
  };

  fs.writeFileSync(jsonPath, JSON.stringify(artifact, null, 2) + '\n', 'utf-8');

  // Convert to beautiful standard markdown representation including inline images
  const mdSections = content.bodySections.map((section) => {
    const imgMd = section.imageMatch
      ? `\n\n![${section.imageMatch.alt}](${section.imageMatch.src})\n_${section.imageMatch.caption || section.imageMatch.alt}_`
      : '';
    return `## ${section.title}\n\n${section.content}${imgMd}\n`;
  });

  const markdown = [
    `# ${content.title}`,
    '',
    `> ${content.excerpt}`,
    '',
    ...mdSections,
    ...(filteredNotes.length > 0
      ? ['', '---', '', ...filteredNotes.map((note) => `_${note}_`)]
      : []),
  ].join('\n');

  fs.writeFileSync(mdPath, markdown + '\n', 'utf-8');

  return `content/published/${slug}.json`;
}
