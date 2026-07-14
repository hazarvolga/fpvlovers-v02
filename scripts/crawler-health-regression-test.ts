import assert from 'node:assert/strict';
import { healthUrlFromCrawlUrl } from '../src/lib/crawler-health';

assert.equal(
  healthUrlFromCrawlUrl('http://crawler-proxy:3002/crawl', 'fallback'),
  'http://crawler-proxy:3002/health',
);
assert.equal(
  healthUrlFromCrawlUrl('http://141.148.206.187/c4ai/crawl', 'fallback'),
  'http://141.148.206.187/c4ai/health',
);
assert.equal(healthUrlFromCrawlUrl(undefined, 'fallback'), 'fallback');
assert.equal(healthUrlFromCrawlUrl('not-a-url', 'fallback'), 'fallback');

console.log('Crawler health URL fallback regression test passed.');
