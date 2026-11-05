import { buildContentMedia } from './content-media';
import type { GeneratedContent } from './parse-generated-content';

const META_MIN = 120;
const META_MAX = 160;
const META_FILLER = ' A practical, beginner-friendly FPV guide from FPVLovers.';
const CORE_INTERNAL_LINKS = ['/guides', '/academy'] as const;
const MAX_RELATED_LINKS = 3;
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'for', 'to', 'of', 'in', 'on', 'with', 'your', 'how', 'guide',
  'beginner', 'beginners', 'best', 'first',
]);

export type RelatedCandidate = { slug: string; title: string };

function trimToWordBoundary(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : text.slice(0, max)).replace(/[\s,;:.-]+$/, '').trim();
}

/** Keeps meta descriptions inside the 120-160 character window the SEO gate scores. */
export function normalizeMetaDescription(meta: string): string {
  let text = meta.trim().replace(/\s+/g, ' ');
  if (text.length >= META_MIN && text.length <= META_MAX) return text;
  if (text.length > META_MAX) return trimToWordBoundary(text, META_MAX);

  if (text && !/[.!?]$/.test(text)) text += '.';
  text = `${text}${META_FILLER}`.trim();
  return trimToWordBoundary(text, META_MAX);
}

function tokens(text: string): Set<string> {
  return new Set(
    text.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2 && !STOP_WORDS.has(word)),
  );
}

export function pickRelatedArticles(
  title: string,
  candidates: readonly RelatedCandidate[],
  limit = MAX_RELATED_LINKS,
): RelatedCandidate[] {
  const own = tokens(title);
  return candidates
    .map((candidate) => {
      const theirs = tokens(candidate.title);
      const shared = [...own].filter((word) => theirs.has(word)).length;
      const union = new Set([...own, ...theirs]).size || 1;
      return { candidate, score: shared / union, shared };
    })
    .filter((entry) => entry.shared > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

export type CompletionContext = {
  category: string;
  /** Keywords from the editorial brief; used only when the model returned none. */
  keywords: readonly string[];
  relatedArticles: readonly RelatedCandidate[];
};

/**
 * Fills the mechanical fields small models tend to drop (keywords, meta
 * length, internal links, cover alt text) so the publish gate judges the
 * article itself. It never rewrites body text and never raises a score by
 * touching the content the reader sees.
 */
export function completeGeneratedContent(
  content: GeneratedContent,
  context: CompletionContext,
): GeneratedContent {
  const keywords = content.seo.keywords.length > 0
    ? content.seo.keywords
    : [...new Set(context.keywords.map((keyword) => keyword.trim()).filter(Boolean))];

  const metaDescription = normalizeMetaDescription(content.seo.metaDescription || content.excerpt);
  const related = pickRelatedArticles(content.title, context.relatedArticles)
    .map((article) => `/article/${article.slug}`);
  const internalLinks = [...new Set([...content.internalLinks, ...CORE_INTERNAL_LINKS, ...related])];

  const media = content.media ?? buildContentMedia({
    slug: content.seo.slug,
    title: content.title,
    category: context.category,
    excerpt: metaDescription,
  });

  return {
    ...content,
    seo: { ...content.seo, keywords, metaDescription },
    excerpt: content.excerpt || metaDescription,
    internalLinks,
    media,
  };
}
