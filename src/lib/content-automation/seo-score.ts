import type { GeneratedContent } from './parse-generated-content';

export type SeoScoreResult = {
  score: number;
  reasons: string[];
};

const MIN_WORD_COUNT = 1200;
const TARGET_WORD_COUNT = MIN_WORD_COUNT * 1.5; // full credit once comfortably past the minimum
const MIN_KEYWORD_DENSITY = 0.015;
const MAX_KEYWORD_DENSITY = 0.025;
const MIN_META_LENGTH = 120;
const MAX_META_LENGTH = 160;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function bodyText(content: GeneratedContent): string {
  return content.bodySections.map((section) => `${section.title} ${section.content}`).join(' ');
}

function keywordDensity(text: string, keyword: string): number {
  if (!keyword.trim()) return 0;
  const normalizedText = text.toLowerCase();
  const normalizedKeyword = keyword.trim().toLowerCase();
  const totalWords = countWords(text) || 1;
  const occurrences = normalizedText.split(normalizedKeyword).length - 1;
  return occurrences / totalWords;
}

/**
 * Deterministic proxy for "SEO score" — CLAUDE.md documents a >=80 publish
 * gate that was previously aspirational-only (no code ever computed a
 * score). This checks the same criteria CLAUDE.md lists: word count,
 * keyword density, meta description length, alt text presence, internal
 * links, and keyword-in-title — not a replacement for a real SEO audit
 * tool, but enough to catch content that misses the documented minimums.
 */
export function computeSeoScore(content: GeneratedContent): SeoScoreResult {
  const reasons: string[] = [];
  let score = 0;

  const text = bodyText(content);
  const wordCount = countWords(text);
  const wordScore = Math.max(0, Math.min(1, (wordCount - 0) / TARGET_WORD_COUNT)) * 30;
  score += wordScore;
  if (wordCount < MIN_WORD_COUNT) {
    reasons.push(`Word count ${wordCount} is below the ${MIN_WORD_COUNT} minimum.`);
  }

  const primaryKeyword = content.seo.keywords[0] || '';
  const density = keywordDensity(text, primaryKeyword);
  if (primaryKeyword && density >= MIN_KEYWORD_DENSITY && density <= MAX_KEYWORD_DENSITY) {
    score += 25;
  } else if (primaryKeyword) {
    // Partial credit that decays the further outside the target band the density is.
    const distance = density < MIN_KEYWORD_DENSITY
      ? MIN_KEYWORD_DENSITY - density
      : density - MAX_KEYWORD_DENSITY;
    score += Math.max(0, 25 - distance * 1000);
    reasons.push(`Primary keyword density ${(density * 100).toFixed(2)}% is outside the 1.5-2.5% target.`);
  } else {
    reasons.push('No primary keyword set.');
  }

  const metaLength = content.seo.metaDescription.trim().length;
  if (metaLength >= MIN_META_LENGTH && metaLength <= MAX_META_LENGTH) {
    score += 15;
  } else if (metaLength > 0) {
    score += 7;
    reasons.push(`Meta description length ${metaLength} is outside the ${MIN_META_LENGTH}-${MAX_META_LENGTH} char target.`);
  } else {
    reasons.push('Meta description is empty.');
  }

  const imagesWithAlt = (content.media?.gallery || [])
    .concat(content.media?.coverImage ? [content.media.coverImage] : [])
    .filter((asset) => asset.alt?.trim());
  if (imagesWithAlt.length > 0) {
    score += 10;
  } else {
    reasons.push('No images with alt text found.');
  }

  if (content.internalLinks.length > 0) {
    score += 10;
  } else {
    reasons.push('No internal links found.');
  }

  const titleHasKeyword = primaryKeyword
    && content.title.toLowerCase().includes(primaryKeyword.toLowerCase());
  if (titleHasKeyword) {
    score += 10;
  } else if (primaryKeyword) {
    reasons.push('Title does not contain the primary keyword.');
  }

  return { score: Math.round(Math.max(0, Math.min(100, score))), reasons };
}
