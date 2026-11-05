import { buildContentMedia } from './content-media';
import type { GeneratedContent } from './parse-generated-content';

const KEYWORD_DENSITY_MIN = 0.015;
const KEYWORD_DENSITY_MAX = 0.025;
const META_MIN = 120;
const META_MAX = 160;
const META_FILLER = ' A practical, beginner-friendly FPV guide from FPVLovers.';
const CORE_INTERNAL_LINKS = ['/guides', '/academy'] as const;
const MAX_RELATED_LINKS = 3;
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'for', 'to', 'of', 'in', 'on', 'at', 'by', 'from', 'into', 'is', 'are',
  'with', 'your', 'you', 'how', 'what', 'why', 'vs', 'guide', 'beginner', 'beginners', 'best', 'first',
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

function countOccurrences(text: string, phrase: string): number {
  if (!phrase) return 0;
  return text.toLowerCase().split(phrase.toLowerCase()).length - 1;
}

function titleNgrams(title: string): string[] {
  const words = title.split(/[^A-Za-z0-9]+/).filter(Boolean);
  const grams: string[] = [];
  // Single words make poor focus keywords; they are only a fallback for very short titles.
  const sizes = words.length >= 2 ? [3, 2] : [1];
  for (const size of sizes) {
    for (let start = 0; start + size <= words.length; start += 1) {
      const slice = words.slice(start, start + size);
      const edgeIsStop = STOP_WORDS.has(slice[0].toLowerCase()) || STOP_WORDS.has(slice[slice.length - 1].toLowerCase());
      if (!edgeIsStop && slice.join('').length > 4) grams.push(slice.join(' '));
    }
  }
  return grams;
}

function keywordFit(keyword: string, title: string, body: string, wordCount: number): number {
  const density = countOccurrences(body, keyword) / Math.max(wordCount, 1);
  const distance = density < KEYWORD_DENSITY_MIN
    ? KEYWORD_DENSITY_MIN - density
    : Math.max(0, density - KEYWORD_DENSITY_MAX);
  const densityPoints = Math.max(0, 25 - distance * 1000);
  const titlePoints = title.toLowerCase().includes(keyword.toLowerCase()) ? 10 : 0;
  return densityPoints + titlePoints;
}

/**
 * Picks the focus keyword the article actually uses. Model-suggested phrases
 * that never occur in the text score zero; title phrases that do occur are
 * the honest alternative. Model keywords win ties.
 */
export function selectPrimaryKeyword(title: string, body: string, modelKeywords: readonly string[]): string {
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  const candidates = [...new Set([...modelKeywords, ...titleNgrams(title)].map((k) => k.trim()).filter(Boolean))];
  let best = modelKeywords[0] ?? '';
  let bestScore = best ? keywordFit(best, title, body, wordCount) : -1;
  for (const candidate of candidates) {
    const score = keywordFit(candidate, title, body, wordCount);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
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

  const body = content.bodySections.map((section) => `${section.title} ${section.content}`).join(' ');
  const primary = selectPrimaryKeyword(content.title, body, keywords);
  const orderedKeywords = primary
    ? [primary, ...keywords.filter((keyword) => keyword.toLowerCase() !== primary.toLowerCase())]
    : [...keywords];

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
    seo: { ...content.seo, keywords: orderedKeywords, metaDescription },
    excerpt: content.excerpt || metaDescription,
    internalLinks,
    media,
  };
}
