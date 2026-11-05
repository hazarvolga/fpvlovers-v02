import assert from 'node:assert/strict';
import { assertUsableCrawlContent } from '../src/lib/content-automation/crawl-content-quality';
import { isPermanentCrawlBlock } from '../src/lib/content-automation/crawl-worker';

const challenge = '![Icon](https://www.fai.org/favicon.ico) # www.fai.org ## Performing security verification This website uses a security service to protect against malicious bots.';
assert.throws(() => assertUsableCrawlContent(challenge), /anti-bot/i);
assert.throws(() => assertUsableCrawlContent('# Short page\n\nTiny.'), /thin content/i);
assert.doesNotThrow(() => assertUsableCrawlContent(`# PID tuning guide\n\n${'Betaflight PID tuning explanation. '.repeat(40)}`));

for (const text of [challenge, '# x']) {
  try {
    assertUsableCrawlContent(text);
  } catch (error) {
    assert.equal(isPermanentCrawlBlock((error as Error).message), true, 'rejected pages fail permanently instead of retrying');
  }
}

console.log('Crawl content quality regression test passed.');
