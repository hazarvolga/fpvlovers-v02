import assert from 'node:assert/strict';
import type { CrawlJob } from '../src/lib/crawl-queue';
import { isPermanentCrawlBlock, processCrawlQueueBatch } from '../src/lib/content-automation/crawl-worker';
import { getCrawlQueueStorageMode } from '../src/lib/server/storage-mode';

const job: CrawlJob = {
  id: 'crawl-test-1',
  url: 'https://betaflight.com/docs/wiki/guides/current/PID-Tuning-Guide',
  dataset: 'fpv-pid-profiles',
  status: 'pending',
  priority: 0,
  retries: 0,
  maxRetries: 3,
  createdAt: '2026-06-19T00:00:00.000Z',
  updatedAt: '2026-06-19T00:00:00.000Z',
};

async function main(): Promise<void> {
  const originalGlobalMode = process.env.FPV_STORAGE_MODE;
  const originalQueueMode = process.env.FPV_CRAWL_QUEUE_STORAGE_MODE;
  process.env.FPV_STORAGE_MODE = 'dual';
  process.env.FPV_CRAWL_QUEUE_STORAGE_MODE = 'postgres';
  assert.equal(getCrawlQueueStorageMode(), 'postgres');
  if (originalGlobalMode === undefined) delete process.env.FPV_STORAGE_MODE;
  else process.env.FPV_STORAGE_MODE = originalGlobalMode;
  if (originalQueueMode === undefined) delete process.env.FPV_CRAWL_QUEUE_STORAGE_MODE;
  else process.env.FPV_CRAWL_QUEUE_STORAGE_MODE = originalQueueMode;

const dryRunUpdates: Array<Partial<CrawlJob>> = [];
const dryRun = await processCrawlQueueBatch({
  enabled: true,
  dryRun: true,
  dependencies: {
    getNextBatch: async () => [job],
    updateJob: async (_id, update) => { dryRunUpdates.push(update); },
    fetchCrawler: async () => { throw new Error('dry-run must not crawl'); },
    uploadToDify: async () => { throw new Error('dry-run must not upload'); },
  },
});
assert.equal(dryRun.items[0]?.action, 'would_process');
assert.equal(dryRunUpdates.length, 0);

const updates: Array<Partial<CrawlJob>> = [];
let crawlerCalls = 0;
let uploadEndpoint = '';
let uploadTokens = 0;
let uploadTextLength = 0;
const success = await processCrawlQueueBatch({
  enabled: true,
  dryRun: false,
  dependencies: {
    getNextBatch: async () => [job],
    updateJob: async (_id, update) => { updates.push(update); },
    fetchCrawler: async () => {
      crawlerCalls += 1;
      if (crawlerCalls === 1) return new Response(null, { status: 503 });
      return Response.json({
        success: true,
        results: [{ markdown: { raw_markdown: '# PID tuning\n'.repeat(1_000) } }],
      });
    },
    persistRawContent: async () => true,
    uploadToDify: async (endpoint, options) => {
      uploadEndpoint = endpoint;
      uploadTokens = options.tokens;
      uploadTextLength = String(options.body.text).length;
      return { ok: true, status: 'success', data: { document: { id: 'doc-test-1' } } };
    },
  },
});
assert.equal(success.items[0]?.action, 'completed');
assert.equal(success.items[0]?.crawler, 'backup');
assert.match(uploadEndpoint, /3eacd19f-ccd8-49ec-8482-51120918f0e0/);
assert.equal(uploadTextLength, 1_500);
assert.equal(uploadTokens, Math.ceil(uploadTextLength / 3));
assert.equal(updates.at(-1)?.tokens, uploadTokens);
assert.deepEqual(updates.map((update) => update.status), ['processing', 'completed']);

let uploadAfterRawFailure = false;
const rawFailureUpdates: Array<Partial<CrawlJob>> = [];
const rawFailure = await processCrawlQueueBatch({
  enabled: true,
  dryRun: false,
  dependencies: {
    getNextBatch: async () => [{ ...job, id: 'raw-failure', retries: 0 }],
    updateJob: async (_id, update) => { rawFailureUpdates.push(update); },
    fetchCrawler: async () => Response.json({ results: [{ markdown: { raw_markdown: '# source\\n'.repeat(100) } }] }),
    persistRawContent: async () => false,
    uploadToDify: async () => {
      uploadAfterRawFailure = true;
      return { ok: true, status: 'success' };
    },
  },
});
assert.equal(rawFailure.items[0]?.action, 'throttled');
assert.equal(rawFailureUpdates.at(-1)?.status, 'throttled');
assert.equal(uploadAfterRawFailure, false);

assert.equal(isPermanentCrawlBlock('All crawler providers failed. primary: HTTP 500 (Blocked by anti-bot protection: HTTP 403)'), true);
const antiBotUpdates: Array<Partial<CrawlJob>> = [];
const antiBot = await processCrawlQueueBatch({
  enabled: true,
  dryRun: false,
  dependencies: {
    getNextBatch: async () => [{ ...job, id: 'anti-bot', retries: 0 }],
    updateJob: async (_id, update) => { antiBotUpdates.push(update); },
    fetchCrawler: async () => Response.json(
      { detail: 'Blocked by anti-bot protection: HTTP 403 with HTML content' },
      { status: 500 },
    ),
    uploadToDify: async () => { throw new Error('anti-bot must not upload'); },
  },
});
assert.equal(antiBot.items[0]?.action, 'failed');
assert.equal(antiBotUpdates.at(-1)?.status, 'failed');

let privateFetchCalled = false;
const privateTarget = await processCrawlQueueBatch({
  enabled: true,
  dryRun: false,
  dependencies: {
    getNextBatch: async () => [{ ...job, id: 'private', url: 'http://127.0.0.1/admin' }],
    updateJob: async () => undefined,
    fetchCrawler: async () => {
      privateFetchCalled = true;
      return Response.json({});
    },
    uploadToDify: async () => ({ ok: true, status: 'success' }),
  },
});
assert.equal(privateTarget.items[0]?.action, 'throttled');
assert.equal(privateFetchCalled, false);

const disabled = await processCrawlQueueBatch({ enabled: false });
assert.equal(disabled.processed, 0);
assert.equal(disabled.enabled, false);

console.log('Crawl worker regression test passed.');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
