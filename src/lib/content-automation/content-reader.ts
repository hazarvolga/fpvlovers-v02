import fs from 'fs';
import path from 'path';
import type { GeneratedContent } from './parse-generated-content';
import type { ContentMedia } from './content-media';
import { buildContentMedia, buildCoverImageUrl } from './content-media';
import { matchImagesToSections } from './crawl-image-match';

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

  // Dynamically split sections that contain H2 headings to enable beautiful inline image scattering!
  let bodySections = parsed.bodySections || [];
  const splitSections: Array<{ id: string; title: string; content: string; imageMatch?: any }> = [];
  
  for (const sec of bodySections) {
    const rawContent = sec.content || '';
    if (rawContent.includes('\n## ') || rawContent.startsWith('## ')) {
      const parts = rawContent.split(/(?=\n## |^## )/g);
      let partIndex = 1;
      for (const part of parts) {
        const trimmedPart = part.trim();
        if (!trimmedPart) continue;
        
        const lines = trimmedPart.split('\n');
        const firstLine = lines[0].trim();
        let sectionTitle = sec.title;
        let sectionContent = trimmedPart;
        
        if (firstLine.startsWith('## ')) {
          sectionTitle = firstLine.replace(/^##\s+/, '');
          sectionContent = lines.slice(1).join('\n').trim();
        }
        
        splitSections.push({
          id: `${sec.id}-sub-${partIndex++}`,
          title: sectionTitle,
          content: sectionContent,
          imageMatch: sec.imageMatch,
        });
      }
    } else {
      splitSections.push(sec);
    }
  }
  bodySections = splitSections;

  // 1. Load FPV Product Catalog dynamically for real hardware image matching!
  let catalogProducts: any[] = [];
  try {
    const catalogPath = path.join(process.cwd(), 'data', 'fpv-products.catalog.json');
    if (fs.existsSync(catalogPath)) {
      const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
      catalogProducts = catalogData.products || [];
    }
  } catch (e) {
    console.error('Failed to load product catalog for image mapping:', e);
  }

  // 2. Map real hardware images from catalog to bodySections based on keyword presence
  if (catalogProducts.length > 0) {
    bodySections = bodySections.map((section) => {
      // If already has a matched image from upstream, keep it
      if (section.imageMatch) return section;

      const haystack = `${section.title} ${section.content}`.toLowerCase();
      
      // Sort products by length descending to match more specific names first
      const sortedProds = [...catalogProducts].sort((a, b) => b.name.length - a.name.length);
      
      for (const prod of sortedProds) {
        if (!prod.imageUrl || !prod.name) continue;
        
        const prodNameLower = prod.name.toLowerCase();
        
        // Exact product name matching with clean word boundary checks or direct inclusion
        if (haystack.includes(prodNameLower)) {
          return {
            ...section,
            imageMatch: {
              src: prod.imageUrl,
              alt: prod.name,
              caption: `${prod.name} - ${prod.brand} FPV Hardware`,
              source: prod.brand,
              sourceUrl: prod.url || '',
              license: 'Brand Catalog Asset'
            }
          };
        }
        
        // Fallback to key brand + model keywords
        const keywords = prod.keywords || [];
        if (keywords.length >= 2) {
          const brandMatch = haystack.includes(prod.brand.toLowerCase());
          const modelMatch = keywords.some(kw => kw.length > 3 && haystack.includes(kw.toLowerCase()));
          if (brandMatch && modelMatch) {
            return {
              ...section,
              imageMatch: {
                src: prod.imageUrl,
                alt: prod.name,
                caption: `${prod.name} - ${prod.brand} FPV Hardware`,
                source: prod.brand,
                sourceUrl: prod.url || '',
                license: 'Brand Catalog Asset'
              }
            };
          }
        }
      }
      return section;
    });
  }

  // Runtime Fallback matching logic: if bodySections has no imageMatch, calculate it dynamically!
  const hasMatchedImages = bodySections.some(s => s.imageMatch);
  if (!hasMatchedImages && bodySections.length > 0 && media.gallery && media.gallery.length > 0) {
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

    const matchResult = matchImagesToSections(licensedImages, bodySections);
    const matchesMap = new Map(matchResult.matches.map(m => [m.sectionId, m.image]));

    bodySections = bodySections.map((section) => {
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

  return {
    ...(parsed as PublishedArtifact),
    title,
    category,
    bodySections,
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
