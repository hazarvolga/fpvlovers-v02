import assert from 'node:assert/strict';
import { resolveCrawlRetryStatus } from '../src/lib/crawl-queue';

assert.equal(resolveCrawlRetryStatus(0, 3), 'throttled');
assert.equal(resolveCrawlRetryStatus(2, 3), 'throttled');
assert.equal(resolveCrawlRetryStatus(3, 3), 'failed');
assert.equal(resolveCrawlRetryStatus(4, 3), 'failed');
assert.equal(resolveCrawlRetryStatus(0, 0), 'failed');

console.log('Crawl retry exhaustion regression test passed.');
