import type { GeneratedContent } from '@/lib/content-automation/parse-generated-content';
import type {
  AutonomousEditorialRecord,
  ContentJob,
  EditorialReviewRecord,
} from '@/lib/content-automation/types';
import {
  classifyEditorialContent,
  evaluatePublicationReadiness,
  type PublicationReadinessDecision,
} from '@/lib/content-automation/editorial-governance';
import { computeSeoScore } from '@/lib/content-automation/seo-score';

const AFFILIATE_DISCLOSURE = 'Disclosure: FPVLovers may earn a commission from qualifying purchases made through affiliate links, at no additional cost to the reader.';
const UNSUPPORTED_EXPERIENCE_PATTERNS = [
  /\bwe tested\b/i,
  /\bour tests?\b/i,
  /\bhands-on testing\b/i,
  /\bpersonally tested\b/i,
  /\bverified performance\b/i,
  /\bguaranteed results?\b/i,
];

type GenerationSource = {
  source: string;
};

type PreparedBase = {
  content: GeneratedContent;
  decision: PublicationReadinessDecision;
};

export type PreparedGeneratedPublication =
  | (PreparedBase & {
      action: 'publish';
      editorial: AutonomousEditorialRecord;
    })
  | (PreparedBase & {
      action: 'hold-for-quality';
      editorial: AutonomousEditorialRecord;
    })
  | (PreparedBase & {
      action: 'await-product-editor';
      editorial: EditorialReviewRecord;
    });

function isSourceReference(value: string): boolean {
  try {
    const url = new URL(value);
    return ['http:', 'https:', 'fpvlovers:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function isCommercial(job: ContentJob): boolean {
  const category = job.category.toLowerCase();
  return job.template === 'comparison'
    || job.template === 'product-review'
    || category.includes('buyer')
    || category.includes('review')
    || category.includes('component');
}

function withCommercialDisclosure(job: ContentJob, content: GeneratedContent): GeneratedContent {
  if (!isCommercial(job)) return content;
  const alreadyPresent = content.publishNotes.some((note) => /affiliate|commission|disclosure/i.test(note));
  if (alreadyPresent) return content;
  return {
    ...content,
    publishNotes: [...content.publishNotes, AFFILIATE_DISCLOSURE],
  };
}

function duplicateScore(content: GeneratedContent): number {
  const normalized = content.bodySections
    .map((section) => section.content.toLowerCase().replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  if (normalized.length < 2) return 0;
  return 1 - (new Set(normalized).size / normalized.length);
}

function unsupportedClaimCount(content: GeneratedContent): number {
  const text = content.bodySections.map((section) => section.content).join('\n');
  return UNSUPPORTED_EXPERIENCE_PATTERNS.reduce(
    (count, pattern) => count + (pattern.test(text) ? 1 : 0),
    0,
  );
}

function linksAreValid(content: GeneratedContent): boolean {
  return content.internalLinks.every((link) => {
    if (link.startsWith('/') && !link.startsWith('//')) return true;
    try {
      const url = new URL(link);
      return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
      return false;
    }
  });
}

function metadataIsComplete(content: GeneratedContent): boolean {
  return Boolean(
    content.title.trim()
    && content.seo.slug.trim()
    && content.seo.metaDescription.trim()
    && content.excerpt.trim()
    && content.bodySections.length > 0
    && content.bodySections.every((section) => section.title.trim() && section.content.trim()),
  );
}

export function prepareGeneratedPublication(
  job: ContentJob,
  generatedContent: GeneratedContent,
  now: string,
  generationSources: readonly GenerationSource[] = [],
): PreparedGeneratedPublication {
  const classification = classifyEditorialContent({
    category: job.category,
    template: job.template,
  });
  const content = withCommercialDisclosure(job, generatedContent);
  const verifiedGenerationSources = Array.from(new Set(
    generationSources
      .map((source) => source.source)
      .filter(isSourceReference),
  ));

  if (classification.contentClass === 'product-review') {
    const editorial: EditorialReviewRecord = {
      contentClass: 'product-review',
      approvalStatus: 'pending',
      compensationReceived: false,
      // Prompt/source hints describe generation intent, not proof that the
      // model retrieved or used a source. Only returned generation evidence
      // may satisfy the editorial evidence requirement.
      evidenceSources: verifiedGenerationSources,
    };
    return {
      action: 'await-product-editor',
      content,
      editorial,
      decision: evaluatePublicationReadiness({ classification, review: editorial }),
    };
  }

  const sourceCount = verifiedGenerationSources.length;
  const quality = {
    sourceCount,
    unsupportedClaimCount: unsupportedClaimCount(content),
    duplicateScore: duplicateScore(content),
    metadataComplete: metadataIsComplete(content),
    linksValid: linksAreValid(content),
    disclosurePresent: !isCommercial(job)
      || content.publishNotes.some((note) => /affiliate|commission|disclosure/i.test(note)),
    seoScore: computeSeoScore(content).score,
  };
  const editorial: AutonomousEditorialRecord = {
    contentClass: 'autonomous',
    checkedAt: now,
    ...quality,
  };
  const decision = evaluatePublicationReadiness({
    classification,
    autonomousQuality: quality,
    classificationInput: { category: job.category, template: job.template },
  });

  return {
    action: decision.canPublish ? 'publish' : 'hold-for-quality',
    content,
    editorial,
    decision,
  };
}
