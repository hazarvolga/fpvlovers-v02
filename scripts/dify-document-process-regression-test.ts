import assert from 'node:assert/strict';
import { buildDifyDocumentProcessRule } from '../src/lib/content-automation/dify-document-process';

const tuning = buildDifyDocumentProcessRule('fpv-flight-tuning');
assert.equal(tuning.mode, 'custom');
assert.equal(tuning.rules.segmentation.max_tokens, 512);
assert.equal(tuning.rules.segmentation.chunk_overlap, 50);
assert.equal(tuning.rules.segmentation.separator, '\n\n');
assert.equal(
  tuning.rules.pre_processing_rules.find((rule) => rule.id === 'remove_urls_emails')?.enabled,
  false,
);

const reviews = buildDifyDocumentProcessRule('fpv-news-reviews');
assert.equal(reviews.rules.segmentation.max_tokens, 1000);
assert.equal(reviews.rules.segmentation.chunk_overlap, 100);

assert.throws(
  () => buildDifyDocumentProcessRule('unknown-dataset'),
  /Unknown dataset process configuration/,
);

console.log('Dify document process regression test passed.');
