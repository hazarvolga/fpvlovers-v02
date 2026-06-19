import assert from 'node:assert/strict';
import { buildSocialFactPack, createSocialJob } from '../src/lib/social/social-orchestrator';
import {
  buildPrivateYouTubeUploadPayload,
  validateVideoManifest,
  type VideoManifest,
} from '../src/lib/video/video-manifest';
import type { PublishedArtifact } from '../src/lib/content-automation/content-reader';

const article: PublishedArtifact = {
  slug: 'dji-o3-vs-walksnail-source-guide',
  jobId: 'social-source-1',
  title: 'DJI O3 vs Walksnail: Choose by Mission',
  category: 'Comparisons',
  template: 'comparison',
  publishedAt: '2026-06-19T12:00:00.000Z',
  promptVersion: 'v2',
  jobStatus: 'published',
  seo: {
    slug: 'dji-o3-vs-walksnail-source-guide',
    metaDescription: 'A source-aware ecosystem comparison.',
    keywords: ['DJI O3', 'Walksnail'],
  },
  excerpt: 'Choose a digital FPV ecosystem by aircraft fit, goggles, recording needs, and upgrade path.',
  bodySections: [
    {
      id: 'decision',
      title: 'Decision rule',
      content: 'The ecosystem decision affects goggles, air units, cameras, and future upgrades. Verify current compatibility before buying.',
    },
  ],
  internalLinks: ['/article/the-ultimate-fpv-video-ecosystem-guide-in-2026-dji-vs-walksnail-vs-hdzero-vs-analog'],
  publishNotes: [],
  metadata: {
    contentType: 'comparison',
    comparison: {
      productA: 'DJI O3 Air Unit',
      productB: 'Walksnail Avatar',
      comparisonCategory: 'Digital FPV video',
      winner: 'tie',
    },
  },
};

const factPack = buildSocialFactPack(article);
assert.equal(factPack.sourceSlug, article.slug);
assert.ok(factPack.facts.length >= 3);
assert.ok(factPack.facts.every((fact) => fact.id && fact.text));

const socialJob = createSocialJob(article, ['facebook', 'instagram', 'linkedin', 'youtube-shorts']);
assert.equal(socialJob.status, 'draft');
assert.equal(socialJob.requiresHumanApproval, false);
assert.deepEqual(socialJob.platforms, ['facebook', 'instagram', 'linkedin', 'youtube-shorts']);
assert.equal(socialJob.variants.length, 4);
assert.ok(socialJob.variants.every((variant) => variant.text.length > 40));
assert.ok(socialJob.variants.every((variant) => variant.disclosure?.includes('affiliate')));

const reviewJob = createSocialJob({
  ...article,
  category: 'Reviews',
  metadata: {
    contentType: 'review',
    review: {
      productBrand: 'Example',
      productModel: 'Review Unit',
      releaseYear: 2026,
      productCategory: 'FPV',
      reviewScore: 90,
      pros: ['Documented'],
      cons: ['Approval required'],
      bestFor: 'Policy tests',
    },
  },
}, ['youtube-shorts']);
assert.equal(reviewJob.requiresHumanApproval, true);

const manifest: VideoManifest = {
  version: 1,
  sourceSlug: article.slug,
  contentClass: 'comparison',
  requiresHumanApproval: false,
  language: 'en',
  aspectRatio: '9:16',
  targetDurationSeconds: 45,
  facts: factPack.facts,
  scenes: [
    {
      id: 'hook',
      startSeconds: 0,
      endSeconds: 8,
      narration: 'DJI O3 versus Walksnail is an ecosystem decision, not a universal winner.',
      onScreenText: 'Choose the ecosystem, not the hype',
      factIds: [factPack.facts[0].id],
      assetRefs: ['brand://comparison-grid'],
    },
    {
      id: 'decision',
      startSeconds: 8,
      endSeconds: 40,
      narration: 'Check aircraft fit, goggles, recording needs, and your future upgrade path before buying.',
      onScreenText: 'Fit / Goggles / Recording / Upgrade path',
      factIds: factPack.facts.slice(1, 3).map((fact) => fact.id),
      assetRefs: ['brand://decision-matrix'],
    },
    {
      id: 'cta',
      startSeconds: 40,
      endSeconds: 45,
      narration: 'Read the sourced comparison on FPVLovers.',
      onScreenText: 'Full guide: FPVLovers',
      factIds: [],
      assetRefs: ['brand://end-card'],
    },
  ],
  cta: 'Read the full comparison on FPVLovers.',
  disclosures: ['Specification-based comparison; not presented as hands-on testing.'],
  containsSyntheticMedia: true,
  paidProductPlacement: false,
  uploadVisibility: 'private',
};

const valid = validateVideoManifest(manifest, factPack);
assert.equal(valid.valid, true);
assert.deepEqual(valid.errors, []);

const unsupported = validateVideoManifest({
  ...manifest,
  scenes: [{ ...manifest.scenes[0], factIds: ['fact-does-not-exist'] }],
}, factPack);
assert.equal(unsupported.valid, false);
assert.ok(unsupported.errors.some((error) => error.includes('fact-does-not-exist')));

const publicUpload = validateVideoManifest({ ...manifest, uploadVisibility: 'public' }, factPack);
assert.equal(publicUpload.valid, false);

const uploadPayload = buildPrivateYouTubeUploadPayload(manifest, {
  title: article.title,
  description: article.excerpt,
  tags: article.seo.keywords,
});
assert.equal(uploadPayload.status.privacyStatus, 'private');
assert.equal(uploadPayload.status.containsSyntheticMedia, true);
assert.equal(uploadPayload.status.selfDeclaredMadeForKids, false);

console.log('Social and video contract regression test passed.');
