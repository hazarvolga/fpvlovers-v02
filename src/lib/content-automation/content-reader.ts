import fs from 'fs';
import path from 'path';
import { cache } from 'react';
import type { GeneratedContent } from './parse-generated-content';
import type { ContentMedia } from './content-media';
import { buildContentMedia, buildCoverImageUrl } from './content-media';
import { matchImagesToSections } from './crawl-image-match';
import { safeReadJson } from '@/lib/utils/json';
import { resolveDisplayCover, resolveFallbackCover } from './fallback-cover';

const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');

const TURKISH_LANGUAGE_MARKERS = [
  'başlangıç',
  'öğren',
  'uçuş',
  'gökyüz',
  'satın alma',
  'yeni başlayan',
  'pratik ipucu',
  'tavsiye edilir',
  'türkiye',
  'şiddetle',
  'kumandanız',
  'drone\'unuz',
  'dronunuzu',
  'gözlüğ',
  'piller',
  'uçur',
] as const;

const TURKISH_SPECIFIC_CHARS = /[ğĞıİşŞüÜöÖçÇ]/g;

function getArtifactLanguageText(article: PublishedArtifact): string {
  return [
    article.title,
    article.excerpt,
    ...(article.bodySections || []).map((section) => `${section.title}\n${section.content}`),
  ].join('\n');
}

export function hasTurkishLanguageLeak(article: PublishedArtifact): boolean {
  const text = getArtifactLanguageText(article);
  const lower = text.toLocaleLowerCase('tr-TR');
  const markerHits = TURKISH_LANGUAGE_MARKERS.filter((marker) => lower.includes(marker)).length;
  const specificCharHits = text.match(TURKISH_SPECIFIC_CHARS)?.length || 0;

  return markerHits >= 2 || specificCharHits >= 12;
}

function shouldExposePublishedArtifact(article: PublishedArtifact): boolean {
  if (process.env.ALLOW_NON_ENGLISH_PUBLISHED === 'true') return true;
  return !hasTurkishLanguageLeak(article);
}

import type { ContentMetadata } from '../content-metadata';
import type { EditorialRecord } from './types';

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
  metadata?: ContentMetadata;
  editorial?: EditorialRecord;
  sourceHints?: string[];
  sourceReferences?: string[];
};

export function getArtifactWordCount(article: PublishedArtifact): number {
  return (article.bodySections || [])
    .flatMap((section) => section.content.split(/\s+/))
    .filter(Boolean)
    .length;
}

export function isCommercialArtifact(article: PublishedArtifact): boolean {
  return ['review', 'comparison', 'buyer-guide', 'product-roundup']
    .includes(article.metadata?.contentType || '');
}

export function isIndexablePublishedArtifact(article: PublishedArtifact): boolean {
  if (!isCommercialArtifact(article)) return true;
  if (article.metadata?.contentType === 'review') {
    return article.editorial?.contentClass === 'product-review'
      && article.editorial.approvalStatus === 'approved'
      && article.editorial.evidenceSources.length > 0;
  }
  return getArtifactWordCount(article) >= 600;
}

export function ensureMediaArtifact(parsed: Partial<PublishedArtifact>): PublishedArtifact | null {
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

  const coverImage = parsed.media?.coverImage || (parsed.coverImage ? {
    src: parsed.coverImage,
    alt: parsed.title || parsed.slug,
    caption: parsed.excerpt || 'FPVLovers editorial content',
    credit: 'FPVLovers generated artwork',
  } : null) || resolvedMedia.coverImage || {
    src: buildCoverImageUrl(parsed.slug),
    alt: parsed.title || parsed.slug,
    caption: parsed.excerpt || 'FPVLovers editorial content',
    credit: 'FPVLovers generated artwork',
  };

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
          imageMatch: partIndex === 2 ? sec.imageMatch : undefined,
        });
      }
    } else {
      splitSections.push(sec);
    }
  }
  bodySections = splitSections;

  // 1. Define high-fidelity real FPV hardware image overrides for 100% correct visual rendering
  const HARDWARE_IMAGE_OVERRIDES: Record<string, { imageUrl: string; name: string; brand: string; url: string }> = {
    'boxer': {
      imageUrl: 'https://www.radiomasterrc.com/cdn/shop/products/BoxerMainBlack_1024x1024.png?v=1672304917',
      name: 'RadioMaster Boxer Radio Transmitter (ELRS 2.4G)',
      brand: 'RadioMaster',
      url: 'https://www.radiomasterrc.com/products/boxer-radio-controller'
    },
    'ep1': {
      imageUrl: 'https://www.happymodel.cn/wp-content/uploads/2021/04/EP1-RX.jpg',
      name: 'Happymodel EP1 RX 2.4GHz ExpressLRS Receiver',
      brand: 'Happymodel',
      url: 'https://www.happymodel.cn/index.php/2021/04/10/happymodel-2-4g-expresslrs-elrs-nano-series-receiver-module-pp-rx-ep1/'
    },
    'ep2': {
      imageUrl: 'https://www.happymodel.cn/wp-content/uploads/2021/04/EP1-RX.jpg',
      name: 'Happymodel EP2 RX 2.4GHz ExpressLRS Receiver',
      brand: 'Happymodel',
      url: 'https://www.happymodel.cn/index.php/2021/04/10/happymodel-2-4g-expresslrs-elrs-nano-series-receiver-module-pp-rx-ep1/'
    },
    'lite': {
      imageUrl: 'https://betafpv.com/cdn/shop/products/1_3bf69b59-4bb4-4cf1-a4fb-51ab163be64a_800x.jpg',
      name: 'BETAFPV ELRS Lite 2.4GHz Receiver',
      brand: 'BETAFPV',
      url: 'https://betafpv.com/products/elrs-lite-receiver'
    },
    'jumper t-pro': {
      imageUrl: 'https://jumper-rc.com/wp-content/uploads/2022/01/T-Pro-2.jpg',
      name: 'Jumper T-Pro ELRS Radio Transmitter',
      brand: 'Jumper',
      url: 'https://jumper-rc.com/t-pro/'
    },
    'zorro': {
      imageUrl: 'https://www.radiomasterrc.com/cdn/shop/products/ZorroMainBlack_1024x1024.png?v=1641571439',
      name: 'RadioMaster Zorro ELRS Radio Transmitter',
      brand: 'RadioMaster',
      url: 'https://www.radiomasterrc.com/products/zorro-radio-controller'
    },
    'ranger': {
      imageUrl: 'https://www.radiomasterrc.com/cdn/shop/files/ranger-micro-1_1024x1024.jpg?v=1682664898',
      name: 'RadioMaster Ranger Micro ELRS TX Module',
      brand: 'RadioMaster',
      url: 'https://www.radiomasterrc.com/products/ranger-micro-2-4ghz-elrs-module'
    }
  };

  // 2. Load FPV Product Catalog dynamically for real hardware image matching!
  let catalogProducts: any[] = [];
  try {
    const catalogPath = path.join(process.cwd(), 'data', 'fpv-products.catalog.json');
    if (fs.existsSync(catalogPath)) {
      const catalogData = safeReadJson<any>(catalogPath, null);
      catalogProducts = catalogData.products || [];
    }
  } catch (e) {
    console.error('Failed to load product catalog for image mapping:', e);
  }

  // 3. Map real hardware images from catalog (with overrides) to bodySections based on keyword presence
  bodySections = bodySections.map((section) => {
    // If already has a matched image from upstream, keep it
    if (section.imageMatch) return section;

    const articleSubject = title.toLowerCase();
    const sectionSubject = section.title.toLowerCase();
    const isDeclaredSubject = (productName: string) =>
      articleSubject.includes(productName) || sectionSubject.includes(productName);
    
    // First, check explicit high-fidelity overrides
    for (const [key, ovr] of Object.entries(HARDWARE_IMAGE_OVERRIDES)) {
      if (isDeclaredSubject(key)) {
        return {
          ...section,
          imageMatch: {
            src: ovr.imageUrl,
            alt: ovr.name,
            caption: `${ovr.name} - ${ovr.brand} FPV Hardware`,
            source: ovr.brand,
            sourceUrl: ovr.url,
            license: 'Manufacturer Catalog Image'
          }
        };
      }
    }

    // Next, fallback to catalog database matching
    if (catalogProducts.length > 0) {
      // Sort products by length descending to match more specific names first
      const sortedProds = [...catalogProducts].sort((a, b) => b.name.length - a.name.length);
      
      for (const prod of sortedProds) {
        if (!prod.imageUrl || !prod.name) continue;
        
        const prodNameLower = prod.name.toLowerCase();
        
        // Exact product name matching with clean word boundary checks or direct inclusion
        if (isDeclaredSubject(prodNameLower)) {
          // If this matched product has a known override key, resolve to override instead!
          let finalSrc = prod.imageUrl;
          let finalCaption = `${prod.name} - ${prod.brand} FPV Hardware`;
          
          for (const [ovrKey, ovr] of Object.entries(HARDWARE_IMAGE_OVERRIDES)) {
            if (prodNameLower.includes(ovrKey)) {
              finalSrc = ovr.imageUrl;
              finalCaption = `${ovr.name} - ${ovr.brand} FPV Hardware`;
              break;
            }
          }

          return {
            ...section,
            imageMatch: {
              src: finalSrc,
              alt: prod.name,
              caption: finalCaption,
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

  // Runtime Fallback matching logic: if bodySections has no imageMatch, calculate it dynamically!
  const unmatchedSections = bodySections.filter((section) => !section.imageMatch);
  if (unmatchedSections.length > 0 && media.gallery && media.gallery.length > 0) {
    const usedSources = new Set(
      bodySections.map((section) => section.imageMatch?.src).filter(Boolean),
    );
    const licensedImages = media.gallery
      .filter((asset) => !usedSources.has(asset.src))
      .map((asset, index) => ({
      id: `gallery_${index}`,
      src: asset.src,
      alt: asset.alt,
      sourceUrl: asset.sourceUrl || '',
      hostname: asset.source || 'local-fallback',
      context: `${asset.caption || ''} ${asset.alt || ''}`,
      license: (asset.license as any) || 'open',
      canSelfHost: true,
      licenseReason: 'Gallery asset',
    }));

    const matchResult = matchImagesToSections(licensedImages, unmatchedSections);
    const matchesMap = new Map(matchResult.matches.map(m => [m.sectionId, m.image]));

    bodySections = bodySections.map((section) => {
      const matched = matchesMap.get(section.id);
      if (!section.imageMatch && matched) {
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

  // Preserve explicit article covers; promote section or gallery media only when none was provided.
  let finalCoverImage = coverImage;
  const firstMatchedSection = bodySections.find(s => s.imageMatch);
  const hasExplicitCover = Boolean(parsed.media?.coverImage?.src || parsed.coverImage);
  if (!hasExplicitCover && firstMatchedSection?.imageMatch) {
    finalCoverImage = {
      src: firstMatchedSection.imageMatch.src,
      alt: firstMatchedSection.imageMatch.alt || parsed.title || parsed.slug,
      caption: firstMatchedSection.imageMatch.caption || parsed.excerpt || '',
      credit: firstMatchedSection.imageMatch.source || 'FPVLovers hardware catalog',
      sourceUrl: firstMatchedSection.imageMatch.sourceUrl || '',
    };
  } else if (!hasExplicitCover && media.gallery && media.gallery.length > 0) {
    const firstGalleryImage = media.gallery[0];
    finalCoverImage = {
      src: firstGalleryImage.src,
      alt: firstGalleryImage.alt || parsed.title || parsed.slug,
      caption: firstGalleryImage.caption || parsed.excerpt || '',
      credit: firstGalleryImage.credit || 'FPVLovers gallery',
      sourceUrl: firstGalleryImage.sourceUrl || '',
    };
  }

  const fallbackCover = resolveFallbackCover({
    category,
    metadata: parsed.metadata,
    title,
    slug: parsed.slug,
  });
  const displayCoverSrc = resolveDisplayCover(finalCoverImage.src, fallbackCover, parsed.slug);
  if (displayCoverSrc !== finalCoverImage.src) {
    finalCoverImage = {
      ...finalCoverImage,
      src: displayCoverSrc,
      alt: `${title} topic cover`,
      source: 'FPVLovers local media layer',
      credit: 'FPVLovers generated editorial artwork',
      kind: 'generated-artwork',
      sourceUrl: undefined,
    };
  }

  return {
    ...(parsed as PublishedArtifact),
    title,
    category,
    bodySections,
    media: {
      ...media,
      coverImage: finalCoverImage,
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
      .filter(shouldExposePublishedArtifact)
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
    if (artifact && shouldExposePublishedArtifact(artifact)) return artifact;
    return null;
  } catch {
    return null;
  }
}

export function getPublishedSlugs(): string[] {
  return listPublishedContent().map((a) => a.slug);
}

// Wrapped with React's cache() below: a single page render (e.g. an article
// page + its related-content and next-steps sections) previously ran this
// full file-scan-plus-DB-query 2-3 times independently per request. cache()
// deduplicates repeated calls with the same arguments within one render
// pass — it does not persist across requests, so content freshness is
// unaffected, it just stops redoing the same work multiple times per view.
async function listPublishedContentAsyncUncached(): Promise<PublishedArtifact[]> {
  const files = listPublishedContent();

  try {
    const { loadPublishedArtifacts } = await import('@/lib/server/published-content-store');
    const database = await loadPublishedArtifacts();
    const merged = new Map<string, PublishedArtifact>();

    for (const artifact of [...files, ...database]) {
      const normalized = ensureMediaArtifact(artifact);
      if (!normalized) continue;
      if (!shouldExposePublishedArtifact(normalized)) continue;
      const existing = merged.get(normalized.slug);
      const existingTime = new Date(existing?.publishedAt || 0).getTime();
      const candidateTime = new Date(normalized.publishedAt || 0).getTime();
      if (!existing || candidateTime >= existingTime) {
        merged.set(normalized.slug, normalized);
      }
    }

    return [...merged.values()].sort(
      (a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime(),
    );
  } catch (error) {
    console.warn('[Published Content] Database read failed, using committed files:', error);
    return files;
  }
}
export const listPublishedContentAsync = cache(listPublishedContentAsyncUncached);

async function getPublishedContentBySlugAsyncUncached(slug: string): Promise<PublishedArtifact | null> {
  try {
    const { getPublishedArtifact } = await import('@/lib/server/published-content-store');
    const database = await getPublishedArtifact(slug);
    const normalized = database ? ensureMediaArtifact(database) : null;
    if (normalized && shouldExposePublishedArtifact(normalized)) return normalized;
  } catch (error) {
    console.warn(`[Published Content] Database lookup failed for ${slug}, using committed file:`, error);
  }

  return getPublishedContentBySlug(slug);
}
export const getPublishedContentBySlugAsync = cache(getPublishedContentBySlugAsyncUncached);

export async function getPublishedSlugsAsync(): Promise<string[]> {
  return (await listPublishedContentAsync()).map((artifact) => artifact.slug);
}

export async function getPublishedJobIdsAsync(): Promise<string[]> {
  return (await listPublishedContentAsync())
    .map((artifact) => artifact.jobId)
    .filter((jobId): jobId is string => typeof jobId === 'string' && jobId.trim().length > 0);
}
