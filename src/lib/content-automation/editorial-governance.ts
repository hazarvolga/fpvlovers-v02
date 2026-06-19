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
};

export type PublicationReadinessInput = {
  classification: EditorialClassification;
  review?: EditorialReviewRecord;
  autonomousQuality?: AutonomousQualityGate;
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

function autonomousBlockers(quality: AutonomousQualityGate | undefined): string[] {
  if (!quality) return ['Autonomous content requires a quality-gate record.'];

  const blockers: string[] = [];
  if (quality.sourceCount < 1) blockers.push('Autonomous content requires at least one source.');
  if (quality.unsupportedClaimCount > 0) blockers.push('Unsupported claims must be resolved.');
  if (quality.duplicateScore > 0.8) blockers.push('Duplicate-content score exceeds the allowed threshold.');
  if (!quality.metadataComplete) blockers.push('Required metadata is incomplete.');
  if (!quality.linksValid) blockers.push('Internal or CTA links are invalid.');
  if (!quality.disclosurePresent) blockers.push('Required disclosure is missing.');
  return blockers;
}

export function evaluatePublicationReadiness(
  input: PublicationReadinessInput,
): PublicationReadinessDecision {
  const blockers = input.classification.contentClass === 'product-review'
    ? reviewBlockers(input.review)
    : autonomousBlockers(input.autonomousQuality);
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
