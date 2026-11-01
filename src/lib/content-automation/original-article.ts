import { validateContentMetadata, type ContentMetadata } from '@/lib/content-metadata';
import type { ContentTemplate } from './types';
import type { GeneratedContent } from './parse-generated-content';
import { getArtifactWordCount, hasLanguageMismatch } from './content-reader';
import { computeSeoScore } from './seo-score';

const MIN_WORDS = 1200;
const MIN_SEO_SCORE = 80;
const TEMPLATES: readonly ContentTemplate[] = [
  'tech-article',
  'product-review',
  'build-guide',
  'comparison',
  'troubleshooting',
  'regulation-guide',
  'community-roundup',
];

export type OriginalArticleInput = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  template: ContentTemplate;
  seo: { metaDescription: string; keywords: string[] };
  bodySections: Array<{ id: string; title: string; content: string }>;
  internalLinks?: string[];
  publishNotes?: string[];
  metadata?: ContentMetadata;
  sourceReferences: string[];
};

export function toGeneratedContent(input: OriginalArticleInput): GeneratedContent {
  return {
    title: input.title,
    seo: {
      slug: input.slug,
      metaDescription: input.seo.metaDescription,
      keywords: input.seo.keywords,
    },
    excerpt: input.excerpt,
    bodySections: input.bodySections.map((section) => ({
      id: section.id,
      title: section.title,
      content: section.content,
    })),
    internalLinks: input.internalLinks || [],
    publishNotes: input.publishNotes || [],
  };
}

export function validateOriginalArticle(
  input: OriginalArticleInput,
): { ok: boolean; blockers: string[] } {
  const blockers: string[] = [];
  const content = toGeneratedContent(input);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
    blockers.push(`Invalid slug: ${input.slug || '(empty)'}.`);
  }
  if (!input.title.trim()) blockers.push('Title is empty.');
  if (!input.excerpt.trim()) blockers.push('Excerpt is empty.');
  if (!input.category.trim()) blockers.push('Category is empty.');
  if (!TEMPLATES.includes(input.template)) {
    blockers.push(`Unknown template: ${String(input.template)}.`);
  }
  if (input.template === 'product-review') {
    blockers.push('The product-review template requires a human editor in the target language.');
  }
  if (input.category.trim().toLowerCase() === 'reviews') {
    blockers.push('Product reviews require a human editor and cannot be published as originals.');
  }
  if (input.bodySections.length === 0) blockers.push('No body sections.');

  const ids = input.bodySections.map((section) => section.id);
  if (new Set(ids).size !== ids.length) blockers.push('Section ids must be unique.');
  if (ids.some((id) => !/^[a-z0-9-]+$/.test(id))) {
    blockers.push('Section ids must be lowercase kebab-case.');
  }

  const words = getArtifactWordCount(content);
  if (words < MIN_WORDS) blockers.push(`Body has ${words} words; ${MIN_WORDS} required.`);

  if (hasLanguageMismatch(content, 'tr')) blockers.push('Body does not read as Turkish.');

  const seo = computeSeoScore(content);
  if (seo.score < MIN_SEO_SCORE) {
    blockers.push(`SEO score ${seo.score} is below ${MIN_SEO_SCORE}: ${seo.reasons.join(' ')}`);
  }

  const metadata = validateContentMetadata(input.metadata || {});
  if (!metadata.isValid) blockers.push(`Metadata invalid: ${metadata.errors.join('; ')}`);

  const references = (input.sourceReferences || []).filter((value) => /^https:\/\//i.test(value));
  if (references.length === 0) {
    blockers.push('At least one https source reference is required.');
  } else if (references.length !== input.sourceReferences.length) {
    blockers.push('Every source reference must be an https URL.');
  }

  return { ok: blockers.length === 0, blockers };
}
