import type { ContentType } from '@/lib/content-metadata';
import type {
  ContentTemplate,
  EditorialRecord,
  EditorialReviewRecord,
} from '@/lib/content-automation/types';

export const PRODUCT_REVIEW_EDITOR = 'Hazar Volga Ekiz';

export type EditorialContentClass = 'product-review' | 'autonomous';

export type EditorialClassification = {
  contentClass: EditorialContentClass;
  requiresHumanApproval: boolean;
  reason: string;
};

export type EditorialClassificationInput = {
  category?: string;
  contentType?: ContentType;
  template?: ContentTemplate;
};

export type AutonomousQualityGate = {
  sourceCount: number;
  unsupportedClaimCount: number;
  duplicateScore: number;
  metadataComplete: boolean;
  linksValid: boolean;
  disclosurePresent: boolean;
  seoScore: number;
};

// Regulatory/legal content (SHY/SHGM etc.) carries higher hallucination
// stakes than a build guide — CLAUDE.md's own YASAK list singles it out.
// Nothing previously enforced a stricter bar for it than any other
// category; this requires more corroborating sources before it can
// autonomously publish.
const REGULATION_MIN_SOURCE_COUNT = 2;
export function isRegulationContent(input: EditorialClassificationInput): boolean {
  const normalizedCategory = input.category?.trim().toLowerCase();
  return input.template === 'regulation-guide'
    || normalizedCategory === 'regulations'
    || normalizedCategory === 'yasal';
}

export type PublicationReadinessInput = {
  classification: EditorialClassification;
  review?: EditorialReviewRecord;
  autonomousQuality?: AutonomousQualityGate;
  // Needed (in addition to `classification`) to detect regulation/legal
  // content, since EditorialClassification itself only carries
  // contentClass/requiresHumanApproval/reason, not category/template.
  classificationInput?: EditorialClassificationInput;
};

export type PublicationReadinessDecision = {
  canPublish: boolean;
  allowNumericScore: boolean;
  blockers: string[];
};

function isValidIsoDate(value: string | undefined): boolean {
  return typeof value === 'string'
    && value.trim().length > 0
    && !Number.isNaN(Date.parse(value));
}

export function classifyEditorialContent(
  input: EditorialClassificationInput,
): EditorialClassification {
  const normalizedCategory = input.category?.trim().toLowerCase();
  const isReview = input.contentType === 'review'
    || (normalizedCategory === 'reviews' && input.template !== 'comparison');

  if (isReview) {
    return {
      contentClass: 'product-review',
      requiresHumanApproval: true,
      reason: 'Product reviews require recorded human editorial approval.',
    };
  }

  return {
    contentClass: 'autonomous',
    requiresHumanApproval: false,
    reason: 'Non-review content may publish after deterministic quality gates.',
  };
}

function reviewBlockers(review: EditorialReviewRecord | undefined): string[] {
  if (!review) return ['Product reviews require an editorial review record.'];

  const blockers: string[] = [];
  if (review.approvalStatus !== 'approved') {
    blockers.push('Product reviews require approved status.');
  }
  if (review.editorName !== PRODUCT_REVIEW_EDITOR) {
    blockers.push(`Product reviews require approval by ${PRODUCT_REVIEW_EDITOR}.`);
  }
  if (!isValidIsoDate(review.reviewedAt)) {
    blockers.push('Product reviews require a valid review timestamp.');
  }
  if (!review.testingMethod) {
    blockers.push('Product reviews require a testing method.');
  }
  if (!review.productRelationship) {
    blockers.push('Product reviews require a product relationship.');
  }
  if (review.testingMethod === 'hands-on' && review.productRelationship === 'none') {
    blockers.push('Hands-on reviews require an actual product relationship.');
  }
  if (review.evidenceSources.length === 0) {
    blockers.push('Product reviews require evidence sources.');
  }

  const requiresDisclosure = review.productRelationship === 'supplied'
    || review.productRelationship === 'loaned'
    || review.compensationReceived;
  if (requiresDisclosure && !review.disclosure?.trim()) {
    blockers.push('Supplied, loaned, or compensated reviews require a disclosure.');
  }

  return blockers;
}

function autonomousBlockers(
  quality: AutonomousQualityGate | undefined,
  classificationInput: EditorialClassificationInput | undefined,
): string[] {
  if (!quality) return ['Autonomous content requires a quality-gate record.'];

  const isRegulation = classificationInput ? isRegulationContent(classificationInput) : false;
  const minSourceCount = isRegulation ? REGULATION_MIN_SOURCE_COUNT : 1;

  const blockers: string[] = [];
  if (quality.sourceCount < minSourceCount) {
    blockers.push(
      isRegulation
        ? `Regulation/legal content requires at least ${REGULATION_MIN_SOURCE_COUNT} corroborating sources (found ${quality.sourceCount}).`
        : 'Autonomous content requires at least one source.',
    );
  }
  if (quality.unsupportedClaimCount > 0) blockers.push('Unsupported claims must be resolved.');
  if (quality.duplicateScore > 0.8) blockers.push('Duplicate-content score exceeds the allowed threshold.');
  if (!quality.metadataComplete) blockers.push('Required metadata is incomplete.');
  if (!quality.linksValid) blockers.push('Internal or CTA links are invalid.');
  if (!quality.disclosurePresent) blockers.push('Required disclosure is missing.');
  // CLAUDE.md: "SEO skoru >= 80 olmadan yayın yasak" — previously
  // undocumented in code (no score was ever computed). See seo-score.ts.
  if (quality.seoScore < 80) blockers.push(`SEO score ${quality.seoScore} is below the required 80.`);
  return blockers;
}

export function evaluatePublicationReadiness(
  input: PublicationReadinessInput,
): PublicationReadinessDecision {
  const blockers = input.classification.contentClass === 'product-review'
    ? reviewBlockers(input.review)
    : autonomousBlockers(input.autonomousQuality, input.classificationInput);
  const canPublish = blockers.length === 0;

  return {
    canPublish,
    allowNumericScore: canPublish
      && input.classification.contentClass === 'product-review'
      && input.review?.testingMethod === 'hands-on',
    blockers,
  };
}

export function isApprovedHandsOnReview(
  editorial: EditorialRecord | undefined,
): editorial is EditorialReviewRecord {
  return editorial?.contentClass === 'product-review'
    && editorial.approvalStatus === 'approved'
    && editorial.editorName === PRODUCT_REVIEW_EDITOR
    && editorial.testingMethod === 'hands-on'
    && Boolean(editorial.reviewedAt)
    && editorial.evidenceSources.length > 0;
}

export type { EditorialReviewRecord } from '@/lib/content-automation/types';
