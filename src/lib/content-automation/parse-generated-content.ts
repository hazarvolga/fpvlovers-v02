import type { ContentMedia, ContentMediaAsset } from './types';

export type GeneratedContent = {
  title: string;
  seo: {
    slug: string;
    metaDescription: string;
    keywords: string[];
  };
  excerpt: string;
  bodySections: Array<{
    id: string;
    title: string;
    content: string;
    imageMatch?: ContentMediaAsset;
  }>;
  internalLinks: string[];
  publishNotes: string[];
  media?: ContentMedia;
};

const extractJsonBlock = (answer: string): string | null => {
  const trimmed = answer.trim();
  if (!trimmed) return null;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1).trim();
  }

  return null;
};

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value.trim() : fallback;

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => (typeof entry === 'string' ? entry.trim() : '')).filter(Boolean);
};

const asMediaAsset = (value: unknown, fallbackAlt: string) => {
  if (typeof value === 'string') {
    return {
      src: value.trim(),
      alt: fallbackAlt,
    };
  }

  if (!value || typeof value !== 'object') return null;

  const asset = value as {
    src?: unknown;
    alt?: unknown;
    caption?: unknown;
    source?: unknown;
    sourceUrl?: unknown;
    credit?: unknown;
    license?: unknown;
  };

  const src = asString(asset.src);
  if (!src) return null;

  return {
    src,
    alt: asString(asset.alt, fallbackAlt),
    caption: asString(asset.caption),
    source: asString(asset.source),
    sourceUrl: asString(asset.sourceUrl),
    credit: asString(asset.credit),
    license: asString(asset.license),
  };
};

export function parseGeneratedContent(answer: string): GeneratedContent | null {
  const jsonText = extractJsonBlock(answer);
  if (!jsonText) return null;

  try {
    const parsed = JSON.parse(jsonText) as {
      title?: unknown;
      excerpt?: unknown;
      seo?: {
        slug?: unknown;
        meta_description?: unknown;
        metaDescription?: unknown;
        keywords?: unknown;
      };
      body_sections?: unknown;
      bodySections?: unknown;
      sections?: unknown;
      internal_links?: unknown;
      internalLinks?: unknown;
      publish_notes?: unknown;
      publishNotes?: unknown;
      media?: unknown;
    };
    const rawSections = Array.isArray(parsed.body_sections)
      ? parsed.body_sections
      : Array.isArray(parsed.bodySections)
        ? parsed.bodySections
        : Array.isArray(parsed.sections)
          ? parsed.sections
          : [];

    const bodySections = rawSections
      .map((section: unknown, index: number) => {
        const sectionObj = (section && typeof section === 'object' ? section : {}) as {
          id?: unknown;
          title?: unknown;
          content?: unknown;
        };
        return {
          id: asString(sectionObj.id, `section-${index + 1}`),
          title: asString(sectionObj.title, `Section ${index + 1}`),
          content: asString(sectionObj.content),
        };
      })
      .filter((section) => section.title && section.content);

    return {
      title: asString(parsed.title),
      seo: {
        slug: asString(parsed.seo?.slug),
        metaDescription: asString(parsed.seo?.meta_description || parsed.seo?.metaDescription),
        keywords: asStringArray(parsed.seo?.keywords),
      },
      excerpt: asString(parsed.excerpt),
      bodySections,
      internalLinks: asStringArray(parsed.internal_links || parsed.internalLinks),
      publishNotes: asStringArray(parsed.publish_notes || parsed.publishNotes),
      media: (() => {
        if (!parsed.media || typeof parsed.media !== 'object') return undefined;
        const media = parsed.media as {
          cover_image?: unknown;
          coverImage?: unknown;
          gallery?: unknown;
          figure_captions?: unknown;
          figureCaptions?: unknown;
          image_sources?: unknown;
          imageSources?: unknown;
          attribution?: unknown;
        };

        const coverImage = asMediaAsset(media.cover_image || media.coverImage, 'Published article cover');
        const gallery = Array.isArray(media.gallery)
          ? media.gallery
              .map((asset, index) => asMediaAsset(asset, `Figure ${index + 1}`))
              .filter((asset): asset is NonNullable<ReturnType<typeof asMediaAsset>> => Boolean(asset))
          : [];

        if (!coverImage && gallery.length === 0) return undefined;

        return {
          coverImage: coverImage || gallery[0]!,
          gallery,
          figureCaptions: asStringArray(media.figure_captions || media.figureCaptions),
          imageSources: asStringArray(media.image_sources || media.imageSources),
          attribution: asStringArray(media.attribution),
        };
      })(),
    };
  } catch {
    return null;
  }
}
