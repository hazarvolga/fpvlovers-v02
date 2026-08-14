import assert from 'node:assert/strict';
import {
  PRODUCT_REVIEW_EDITOR,
  classifyEditorialContent,
  evaluatePublicationReadiness,
  isApprovedHandsOnReview,
  type EditorialReviewRecord,
} from '../src/lib/content-automation/editorial-governance';
import { prepareGeneratedPublication } from '../src/lib/content-automation/generated-publication';
import type { ContentJob } from '../src/lib/content-automation/types';
import type { GeneratedContent } from '../src/lib/content-automation/parse-generated-content';
import {
  isIndexablePublishedArtifact,
  type PublishedArtifact,
} from '../src/lib/content-automation/content-reader';

const reviewClassification = classifyEditorialContent({
  category: 'Reviews',
  contentType: 'review',
  template: 'tech-article',
});
assert.equal(reviewClassification.contentClass, 'product-review');
assert.equal(reviewClassification.requiresHumanApproval, true);

for (const input of [
  { category: 'Comparisons', contentType: 'comparison' as const, template: 'comparison' as const },
  { category: 'Buyer Guides', contentType: 'buyer-guide' as const, template: 'tech-article' as const },
  { category: 'Academy', contentType: 'tutorial' as const, template: 'build-guide' as const },
]) {
  const classification = classifyEditorialContent(input);
  assert.equal(classification.contentClass, 'autonomous');
  assert.equal(classification.requiresHumanApproval, false);
}

const approvedReview: EditorialReviewRecord = {
  contentClass: 'product-review',
  approvalStatus: 'approved',
  editorName: PRODUCT_REVIEW_EDITOR,
  reviewedAt: '2026-06-19T12:00:00.000Z',
  testingMethod: 'hands-on',
  productRelationship: 'purchased',
  compensationReceived: false,
  evidenceSources: [
    'https://manufacturer.example/product-specification',
    'fpvlovers://test-notes/2026-06-19/example-product',
  ],
  disclosure: 'The test unit was purchased by FPVLovers. Links may be affiliate links.',
};

const approvedDecision = evaluatePublicationReadiness({
  classification: reviewClassification,
  review: approvedReview,
});
assert.equal(approvedDecision.canPublish, true);
assert.deepEqual(approvedDecision.blockers, []);
assert.equal(isApprovedHandsOnReview(approvedReview), true);
assert.equal(isApprovedHandsOnReview(undefined), false);

const missingEvidenceDecision = evaluatePublicationReadiness({
  classification: reviewClassification,
  review: {
    ...approvedReview,
    evidenceSources: [],
  },
});
assert.equal(missingEvidenceDecision.canPublish, false);
assert.ok(missingEvidenceDecision.blockers.includes('Product reviews require evidence sources.'));

const wrongEditorDecision = evaluatePublicationReadiness({
  classification: reviewClassification,
  review: {
    ...approvedReview,
    editorName: 'Automated Pipeline',
  },
});
assert.equal(wrongEditorDecision.canPublish, false);
assert.ok(wrongEditorDecision.blockers.includes(`Product reviews require approval by ${PRODUCT_REVIEW_EDITOR}.`));

const suppliedWithoutDisclosure = evaluatePublicationReadiness({
  classification: reviewClassification,
  review: {
    ...approvedReview,
    productRelationship: 'supplied',
    disclosure: '',
  },
});
assert.equal(suppliedWithoutDisclosure.canPublish, false);
assert.ok(suppliedWithoutDisclosure.blockers.includes('Supplied, loaned, or compensated reviews require a disclosure.'));

const specAnalysisDecision = evaluatePublicationReadiness({
  classification: reviewClassification,
  review: {
    ...approvedReview,
    testingMethod: 'spec-analysis',
    productRelationship: 'none',
    disclosure: 'This assessment is based on published specifications and cited sources, not hands-on testing.',
  },
});
assert.equal(specAnalysisDecision.canPublish, true);
assert.equal(specAnalysisDecision.allowNumericScore, false);
assert.equal(isApprovedHandsOnReview({
  ...approvedReview,
  testingMethod: 'spec-analysis',
}), false);

const autonomousClassification = classifyEditorialContent({
  category: 'Buyer Guides',
  contentType: 'buyer-guide',
  template: 'tech-article',
});
const autonomousDecision = evaluatePublicationReadiness({
  classification: autonomousClassification,
  autonomousQuality: {
    sourceCount: 3,
    unsupportedClaimCount: 0,
    duplicateScore: 0.18,
    metadataComplete: true,
    linksValid: true,
    disclosurePresent: true,
    seoScore: 85,
  },
});
assert.equal(autonomousDecision.canPublish, true);

const weakAutonomousDecision = evaluatePublicationReadiness({
  classification: autonomousClassification,
  autonomousQuality: {
    sourceCount: 0,
    unsupportedClaimCount: 2,
    duplicateScore: 0.91,
    metadataComplete: false,
    linksValid: false,
    disclosurePresent: false,
    seoScore: 40,
  },
});
assert.equal(weakAutonomousDecision.canPublish, false);
assert.ok(weakAutonomousDecision.blockers.length >= 6);

// CLAUDE.md: "SEO skoru >= 80 olmadan yayın yasak" — this must block on its
// own even when every other quality signal passes.
const lowSeoScoreDecision = evaluatePublicationReadiness({
  classification: autonomousClassification,
  autonomousQuality: {
    sourceCount: 3,
    unsupportedClaimCount: 0,
    duplicateScore: 0.18,
    metadataComplete: true,
    linksValid: true,
    disclosurePresent: true,
    seoScore: 79,
  },
});
assert.equal(lowSeoScoreDecision.canPublish, false);
assert.ok(lowSeoScoreDecision.blockers.some((b) => /SEO score/.test(b)));

// Regulation/legal content needs 2+ sources even though everything else
// about the draft is otherwise publication-ready with only 1 source.
const regulationClassification = classifyEditorialContent({
  category: 'Regulations',
  contentType: 'guide',
  template: 'regulation-guide',
});
const regulationDecision = evaluatePublicationReadiness({
  classification: regulationClassification,
  autonomousQuality: {
    sourceCount: 1,
    unsupportedClaimCount: 0,
    duplicateScore: 0.1,
    metadataComplete: true,
    linksValid: true,
    disclosurePresent: true,
    seoScore: 90,
  },
  classificationInput: { category: 'Regulations', template: 'regulation-guide' },
});
assert.equal(regulationDecision.canPublish, false);
assert.ok(regulationDecision.blockers.some((b) => /Regulation\/legal content requires at least 2/.test(b)));

const regulationWithEnoughSources = evaluatePublicationReadiness({
  classification: regulationClassification,
  autonomousQuality: {
    sourceCount: 2,
    unsupportedClaimCount: 0,
    duplicateScore: 0.1,
    metadataComplete: true,
    linksValid: true,
    disclosurePresent: true,
    seoScore: 90,
  },
  classificationInput: { category: 'Regulations', template: 'regulation-guide' },
});
assert.equal(regulationWithEnoughSources.canPublish, true);

const now = '2026-06-19T12:00:00.000Z';
const baseJob: ContentJob = {
  id: 'job-1',
  briefSlug: 'source-backed-guide',
  title: 'Source-backed guide',
  category: 'Buyer Guides',
  status: 'generating',
  topic: 'Guide topic',
  language: 'en',
  template: 'tech-article',
  promptVersion: 'v2',
  sourceHints: ['https://manufacturer.example/source'],
  seo: { slug: 'source-backed-guide', metaDescription: 'Useful description', keywords: ['fpv'] },
  createdAt: now,
  updatedAt: now,
};
// Long enough, with a controlled keyword rate, to clear the SEO-score gate
// on its own merits — see seo-score.ts. Each section uses a distinct index
// so sections don't collide with the duplicate-content check.
function buildLongBody(sectionCount: number, wordsPerSection: number, keyword: string, keywordEvery: number) {
  const sections: GeneratedContent['bodySections'] = [];
  for (let s = 0; s < sectionCount; s += 1) {
    const words: string[] = [];
    for (let w = 0; w < wordsPerSection; w += 1) {
      words.push(w % keywordEvery === 0 ? keyword : `detail${s}_${w}`);
    }
    sections.push({ id: `sec-${s}`, title: `FPV section ${s}`, content: words.join(' ') });
  }
  return sections;
}

const baseContent: GeneratedContent = {
  title: 'Source-backed FPV guide',
  seo: {
    slug: 'source-backed-guide',
    metaDescription: 'A practical, source-backed FPV guide covering setup, tuning, and safety basics for pilots at every level.',
    keywords: ['fpv'],
  },
  excerpt: 'Useful source-backed guidance.',
  bodySections: buildLongBody(5, 400, 'fpv', 50),
  internalLinks: ['/academy/roadmap'],
  publishNotes: [],
};

const autonomousPreparation = prepareGeneratedPublication(
  baseJob,
  baseContent,
  now,
  [{ source: 'https://manufacturer.example/source' }],
);
assert.equal(autonomousPreparation.action, 'publish');
assert.equal(autonomousPreparation.editorial.contentClass, 'autonomous');

const sourceHintOnlyPreparation = prepareGeneratedPublication(baseJob, baseContent, now);
assert.equal(sourceHintOnlyPreparation.action, 'hold-for-quality');
assert.ok(sourceHintOnlyPreparation.decision.blockers.includes('Autonomous content requires at least one source.'));

const unsourcedPreparation = prepareGeneratedPublication(
  { ...baseJob, sourceHints: ['Editorial outline only'] },
  baseContent,
  now,
);
assert.equal(unsourcedPreparation.action, 'hold-for-quality');
assert.ok(unsourcedPreparation.decision.blockers.includes('Autonomous content requires at least one source.'));

const reviewPreparation = prepareGeneratedPublication(
  { ...baseJob, category: 'Reviews', template: 'product-review' },
  baseContent,
  now,
);
assert.equal(reviewPreparation.action, 'await-product-editor');
assert.equal(reviewPreparation.editorial.contentClass, 'product-review');
assert.equal(reviewPreparation.editorial.approvalStatus, 'pending');
assert.deepEqual(reviewPreparation.editorial.evidenceSources, []);

const sourcedReviewPreparation = prepareGeneratedPublication(
  { ...baseJob, category: 'Reviews', template: 'product-review' },
  baseContent,
  now,
  [{ source: 'https://manufacturer.example/source' }],
);
assert.deepEqual(
  sourcedReviewPreparation.editorial.evidenceSources,
  ['https://manufacturer.example/source'],
);

const baseArtifact: PublishedArtifact = {
  ...baseContent,
  // Short on purpose — the indexability assertions below test the
  // word-count threshold for commercial content types, independent of
  // baseContent's now-long body (which exists to satisfy the SEO-score
  // gate in the prepareGeneratedPublication tests above).
  bodySections: [{ id: 'one', title: 'What matters', content: 'A specific, sourced explanation for FPV pilots.' }],
  slug: 'legacy-review',
  jobId: 'legacy-review',
  category: 'Reviews',
  template: 'product-review',
  publishedAt: now,
  promptVersion: 'v1',
  jobStatus: 'published',
  metadata: {
    contentType: 'review',
    review: {
      productBrand: 'Example',
      productModel: 'Unit',
      releaseYear: 2026,
      productCategory: 'FPV',
      reviewScore: 95,
      pros: ['Compact'],
      cons: ['Unverified'],
      bestFor: 'Testing policy',
    },
  },
};
assert.equal(isIndexablePublishedArtifact(baseArtifact), false);
assert.equal(isIndexablePublishedArtifact({ ...baseArtifact, editorial: approvedReview }), true);
assert.equal(isIndexablePublishedArtifact({
  ...baseArtifact,
  metadata: { contentType: 'buyer-guide' },
}), false);
assert.equal(isIndexablePublishedArtifact({
  ...baseArtifact,
  bodySections: [{ id: 'long', title: 'Long guide', content: `${'evidence '.repeat(610)}` }],
  metadata: { contentType: 'buyer-guide' },
}), true);

console.log('Editorial governance regression test passed.');
