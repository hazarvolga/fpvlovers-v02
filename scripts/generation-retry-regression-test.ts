import assert from 'node:assert/strict';
import {
  MAX_TRANSIENT_ATTEMPTS,
  TRANSIENT_RETRY_DELAY_MS,
  hasPublishedWithin,
  isTransientGenerationError,
  planTransientRetry,
} from '../src/lib/content-automation/generation-retry';

const now = new Date('2026-11-05T03:00:00.000Z');

assert.equal(isTransientGenerationError('DIFY_WORKFLOW_error: [gemini] This model is currently experiencing high demand'), true);
assert.equal(isTransientGenerationError("ServerError: 503 UNAVAILABLE. {'status': 'UNAVAILABLE'}"), true);
assert.equal(isTransientGenerationError('The command on the server timed out after 300 seconds'), true);
assert.equal(isTransientGenerationError('Workflow app key is not configured'), false);
assert.equal(isTransientGenerationError('Invalid JSON in article output'), false);

const first = planTransientRetry('503 UNAVAILABLE', 0, now);
assert.equal(first.requeue, true);
if (first.requeue) {
  assert.equal(first.attemptCount, 1);
  assert.equal(Date.parse(first.scheduledFor), now.getTime() + TRANSIENT_RETRY_DELAY_MS);
}

assert.equal(planTransientRetry('503 UNAVAILABLE', MAX_TRANSIENT_ATTEMPTS - 1, now).requeue, false, 'gives up after the attempt cap');
assert.equal(planTransientRetry('schema validation failed', 0, now).requeue, false, 'permanent errors fail immediately');

const recent = [{ status: 'published', startedAt: '2026-11-05T02:30:00.000Z' }];
assert.equal(hasPublishedWithin(recent, 18, now), true);
assert.equal(hasPublishedWithin([{ status: 'published', startedAt: '2026-11-04T02:30:00.000Z' }], 18, now), false);
assert.equal(hasPublishedWithin([{ status: 'failed', startedAt: '2026-11-05T02:30:00.000Z' }], 18, now), false);

console.log('Generation retry regression test passed.');
