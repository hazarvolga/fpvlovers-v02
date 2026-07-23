import assert from 'node:assert/strict';
import {
  buildBlockingJobKeySet,
  removeJobsSupersededByIncomingBriefs,
} from '../src/lib/content-automation/job-selection';
import type { ContentJob } from '../src/lib/content-automation/types';

function makeJob(slug: string, status: ContentJob['status']): ContentJob {
  const now = new Date('2026-07-23T00:00:00.000Z').toISOString();
  return {
    id: `brief-${slug}`,
    briefSlug: slug,
    title: slug.replace(/-/g, ' '),
    category: 'Build Guides',
    status,
    topic: `Autonomous FPV brief for ${slug}`,
    language: 'en',
    template: 'build-guide',
    promptVersion: 'v2',
    sourceHints: ['https://betaflight.com/docs/wiki'],
    seo: {
      slug,
      metaDescription: `Autonomous FPV brief for ${slug}`,
      keywords: [slug],
    },
    createdAt: now,
    updatedAt: now,
  };
}

const failed = makeJob('analog-vs-digital-fpv-for-beginners', 'failed');
const published = makeJob('fpv-esc-buying-guide-current-rating-firmware-and-stack-fit', 'published');
const queued = makeJob('fpv-stack-mounting-and-vibration-isolation-guide', 'queued');

const normalBlockingKeys = buildBlockingJobKeySet([failed, published, queued]);
assert.equal(normalBlockingKeys.has(failed.id), false, 'failed job id must not block autonomous brief selection');
assert.equal(normalBlockingKeys.has(failed.briefSlug), false, 'failed job slug must not block autonomous brief selection');
assert.equal(normalBlockingKeys.has(published.id), true, 'published job id must block duplicate generation');
assert.equal(normalBlockingKeys.has(queued.briefSlug), true, 'queued job slug must block duplicate generation');

const racingBlockingKeys = buildBlockingJobKeySet([failed], { includeFailedJobs: true });
assert.equal(racingBlockingKeys.has(failed.briefSlug), true, 'racing selection can still treat failed jobs as blocking');

const incomingRetry = makeJob(failed.briefSlug, 'queued');
const retained = removeJobsSupersededByIncomingBriefs([failed, published, queued], [incomingRetry]);

assert.equal(retained.some((job) => job.id === failed.id), false, 'incoming retry should supersede old failed duplicate');
assert.equal(retained.some((job) => job.id === published.id), true, 'unrelated published jobs must be retained');
assert.equal(retained.some((job) => job.id === queued.id), true, 'unrelated queued jobs must be retained');

console.log('content job selection regression passed');
