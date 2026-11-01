import { runWorkflow as runDifyWorkflow } from '@/lib/dify-client';
import { validateContentMetadata, type ContentMetadata } from '@/lib/content-metadata';
import type { ContentMediaAsset } from './types';
import {
  getArtifactWordCount,
  hasLanguageMismatch,
  type PublishedArtifact,
} from './content-reader';
import { computeSeoScore } from './seo-score';
import { parseGeneratedContent, extractJsonBlock, type GeneratedContent } from './parse-generated-content';
import { isRetryableWorkflowFailure } from './dify-generation';

export const LOCALIZER_WORKFLOW_ID = 'content-localizer-tr';
export const LOCALIZER_PROMPT_VERSION = 'localizer-v1';
const MAX_WORKFLOW_ATTEMPTS = 3;
const MIN_WORDS = 1200;
const MIN_SEO_SCORE = 80;

export type LocalizerSource = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  contentType?: string;
  metadata?: ContentMetadata;
  bodySections: Array<{
    id: string;
    title: string;
    content: string;
    imageMatch?: ContentMediaAsset;
  }>;
  internalLinks: string[];
  sourceReferences: string[];
};

export type ParsedLocalizedRewrite = {
  content: GeneratedContent;
  metadata: ContentMetadata;
  metadataValid: boolean;
  metadataErrors: string[];
  localizationNotes: string[];
  rawAnswer: string;
};

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function buildLocalizerInputs(source: LocalizerSource): Record<string, string> {
  return {
    source_slug: source.slug,
    source_title: source.title,
    source_excerpt: source.excerpt,
    source_category: source.category,
    content_type: source.contentType || 'guide',
    source_body: source.bodySections
      .map((section) => `## ${section.title}\n\n${section.content}`)
      .join('\n\n'),
    source_internal_links: JSON.stringify(source.internalLinks),
    source_references: source.sourceReferences.join('\n'),
    target_locale: 'tr',
  };
}

export function parseLocalizedRewriteOutput(answer: string): ParsedLocalizedRewrite | null {
  const content = parseGeneratedContent(answer);
  const jsonText = extractJsonBlock(answer);
  if (!content || !jsonText) return null;

  let raw: { metadata?: unknown; localization_notes?: unknown };
  try {
    raw = JSON.parse(jsonText) as { metadata?: unknown; localization_notes?: unknown };
  } catch {
    return null;
  }

  const metadata = validateContentMetadata(raw.metadata);
  return {
    content,
    metadata: metadata.metadata || {},
    metadataValid: metadata.isValid,
    metadataErrors: metadata.errors,
    localizationNotes: Array.isArray(raw.localization_notes)
      ? raw.localization_notes.filter((note): note is string => typeof note === 'string' && note.trim().length > 0)
      : [],
    rawAnswer: answer,
  };
}

export function validateLocalizedRewrite(
  source: LocalizerSource,
  parsed: ParsedLocalizedRewrite,
): { ok: boolean; blockers: string[] } {
  const blockers: string[] = [];
  const content = parsed.content;

  if (content.seo.slug !== source.slug) {
    blockers.push(`Slug mismatch: expected ${source.slug}, got ${content.seo.slug || '(empty)'}.`);
  }

  const sourceIds = source.bodySections.map((section) => section.id);
  const outputIds = content.bodySections.map((section) => section.id);
  if (sourceIds.length !== outputIds.length || sourceIds.some((id, index) => id !== outputIds[index])) {
    blockers.push(`Section ids drifted from ${JSON.stringify(sourceIds)} to ${JSON.stringify(outputIds)}.`);
  }

  if (hasLanguageMismatch(content, 'tr')) {
    blockers.push('Body still reads as English.');
  }

  const words = getArtifactWordCount(content as Pick<PublishedArtifact, 'bodySections'>);
  if (words < MIN_WORDS) {
    blockers.push(`Body has ${words} words; ${MIN_WORDS} required.`);
  }

  const seo = computeSeoScore(content);
  if (seo.score < MIN_SEO_SCORE) {
    blockers.push(`SEO score ${seo.score} is below ${MIN_SEO_SCORE}: ${seo.reasons.join(' ')}`);
  }

  if (!parsed.metadataValid) {
    blockers.push(`Metadata invalid: ${parsed.metadataErrors.join('; ')}`);
  }
  if (source.metadata?.contentType && parsed.metadata.contentType !== source.metadata.contentType) {
    blockers.push(`contentType drifted from ${source.metadata.contentType} to ${parsed.metadata.contentType || '(missing)'}.`);
  }
  if (source.metadata?.difficulty && parsed.metadata.difficulty !== source.metadata.difficulty) {
    blockers.push(`difficulty drifted from ${source.metadata.difficulty} to ${parsed.metadata.difficulty || '(missing)'}.`);
  }

  return { ok: blockers.length === 0, blockers };
}

export function buildLocalizedContent(
  parsed: GeneratedContent,
  source: Pick<LocalizerSource, 'bodySections'>,
): GeneratedContent {
  const images = new Map(
    source.bodySections
      .filter((section) => section.imageMatch)
      .map((section) => [section.id, section.imageMatch as ContentMediaAsset]),
  );

  return {
    ...parsed,
    bodySections: parsed.bodySections.map((section) => {
      const imageMatch = images.get(section.id);
      return imageMatch ? { ...section, imageMatch } : section;
    }),
  };
}

export async function runLocalizedRewrite(
  source: LocalizerSource,
): Promise<ParsedLocalizedRewrite & { workflowRunId: string | null }> {
  const token = process.env.DIFY_WORKFLOW_TOKEN_LOCALIZER;
  if (!token) {
    throw new Error('DIFY_WORKFLOW_TOKEN_LOCALIZER is not configured.');
  }

  const inputs = buildLocalizerInputs(source);
  let workflow = await runDifyWorkflow(LOCALIZER_WORKFLOW_ID, inputs, token, 'content_gen', 180000);
  for (let attempt = 1; attempt < MAX_WORKFLOW_ATTEMPTS && isRetryableWorkflowFailure(workflow); attempt += 1) {
    await delay(attempt * 5000);
    workflow = await runDifyWorkflow(LOCALIZER_WORKFLOW_ID, inputs, token, 'content_gen', 180000);
  }

  if (!workflow.success) {
    throw new Error(`DIFY_WORKFLOW_${workflow.status}: ${workflow.error || 'Localizer workflow did not succeed'}`);
  }

  const rawAnswer = typeof workflow.outputs.localized_article === 'string'
    ? workflow.outputs.localized_article
    : JSON.stringify(workflow.outputs);
  const parsed = parseLocalizedRewriteOutput(rawAnswer);
  if (!parsed) {
    throw new Error('Localizer output is not a JSON object; check the workflow output variable.');
  }

  return { ...parsed, workflowRunId: workflow.workflowRunId || null };
}
