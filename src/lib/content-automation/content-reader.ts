import fs from 'fs';
import path from 'path';
import type { GeneratedContent } from './parse-generated-content';
import type { ContentMedia } from './content-media';
import { buildContentMedia, buildCoverImageUrl } from './content-media';

const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');

export type PublishedArtifact = GeneratedContent & {
  slug: string;
  jobId: string;
  category: string;
  template: string;
  publishedAt: string;
  promptVersion: string;
  jobStatus: string;
  media?: ContentMedia;
  coverImage?: string;
};

function ensureMediaArtifact(parsed: Partial<PublishedArtifact>): PublishedArtifact | null {
  if (!parsed || typeof parsed.slug !== 'string') return null;
  const title = typeof parsed.title === 'string' && parsed.title ? parsed.title : parsed.slug;
  const category = typeof parsed.category === 'string' && parsed.category ? parsed.category : 'FPV Reference';
  const excerpt = typeof parsed.excerpt === 'string' ? parsed.excerpt : '';
  const resolvedMedia = buildContentMedia({ slug: parsed.slug, title, category, excerpt });
  
  // Eğer JSON dosyasındaki galeri boş ise, dinamik olarak en güncel lisanslı galeriyi enjekte et
  const media = {
    ...resolvedMedia,
    ...(parsed.media || {}),
    gallery: (parsed.media?.gallery && parsed.media.gallery.length > 0)
      ? parsed.media.gallery
      : resolvedMedia.gallery,
    attribution: (parsed.media?.attribution && parsed.media.attribution.length > 0)
      ? parsed.media.attribution
      : resolvedMedia.attribution,
    imageSources: (parsed.media?.imageSources && parsed.media.imageSources.length > 0)
      ? parsed.media.imageSources
      : resolvedMedia.imageSources
  };

  const coverImage = media.coverImage?.src?.startsWith('/api/content/media/cover/')
    ? resolvedMedia.coverImage || { ...media.coverImage, src: buildCoverImageUrl(parsed.slug) }
    : media.coverImage;

  return {
    ...(parsed as PublishedArtifact),
    title,
    category,
    media: {
      ...media,
      coverImage,
    },
  };
}

export function listPublishedContent(): PublishedArtifact[] {
  try {
    const files = fs.readdirSync(PUBLISHED_DIR).filter((f) => f.endsWith('.json'));
    return files
      .map((file) => {
        try {
          const raw = fs.readFileSync(path.join(PUBLISHED_DIR, file), 'utf-8');
          const parsed = JSON.parse(raw);
          return ensureMediaArtifact(parsed);
        } catch {
          return null;
        }
      })
      .filter((a): a is PublishedArtifact => a !== null && typeof a.slug === 'string')
      .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
  } catch {
    return [];
  }
}

export function getPublishedContentBySlug(slug: string): PublishedArtifact | null {
  const filePath = path.join(PUBLISHED_DIR, `${slug}.json`);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    const artifact = ensureMediaArtifact(parsed);
    if (artifact) return artifact;
    return null;
  } catch {
    return null;
  }
}

export function getPublishedSlugs(): string[] {
  return listPublishedContent().map((a) => a.slug);
}
