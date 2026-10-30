import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.CRAWL_DRY_RUN = 'false';
process.env.NODE_ENV = 'test';
process.env.DIFY_API_KEY = 'contract-test-key';
process.env.DIFY_BASE_URL = 'https://dify.invalid/v1';
delete process.env.DIFY_INTERNAL_BASE_URL;
delete process.env.APP_API_URL;
delete process.env.LLM_CACHE_ENABLED;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type FetchCall = { url: string; body: unknown };

function installFetchStub(responses: string[]) {
  const calls: FetchCall[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), body: init?.body ? JSON.parse(String(init.body)) : null });
    const body = responses[Math.min(calls.length - 1, responses.length - 1)];
    return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
  return { calls, restore: () => { globalThis.fetch = original; } };
}

const failedWorkflowResponse = JSON.stringify({
  workflow_run_id: 'run-failed',
  task_id: 'task-failed',
  data: {
    id: 'run-failed',
    workflow_id: 'wf',
    status: 'failed',
    error: '503 UNAVAILABLE. This model is currently experiencing high demand.',
    outputs: {},
    elapsed_time: 8.19,
    total_tokens: 0,
  },
});

const succeededWorkflowResponse = JSON.stringify({
  workflow_run_id: 'run-ok',
  task_id: 'task-ok',
  data: {
    id: 'run-ok',
    workflow_id: 'wf',
    status: 'succeeded',
    error: null,
    outputs: { article: 'contract-test-article' },
    elapsed_time: 12.5,
    total_tokens: 1200,
  },
});

async function main() {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fpvlovers-dify-contract-'));
  fs.mkdirSync(path.join(tmpRoot, 'data'), { recursive: true });
  process.chdir(tmpRoot);

  const { runWorkflow } = await import('../src/lib/dify-client');

  const failedStub = installFetchStub([failedWorkflowResponse]);
  try {
    const first = await runWorkflow('content-orchestrator', { keyword: 'contract-failed' }, 'contract-test-key', 'content_gen', 5000);
    assert.equal(first.success, false, 'HTTP 200 with workflow status "failed" must not count as success');
    assert.match(first.error ?? '', /503 UNAVAILABLE/, 'workflow error message must be surfaced');
    assert.deepEqual(first.outputs, {}, 'failed workflow must not expose outputs');

    await sleep(1600);
    const second = await runWorkflow('content-orchestrator', { keyword: 'contract-failed' }, 'contract-test-key', 'content_gen', 5000);
    assert.equal(second.success, false);
    assert.equal(failedStub.calls.length, 2, 'failed workflow responses must not be served from cache');
  } finally {
    failedStub.restore();
  }

  await sleep(1600);
  const okStub = installFetchStub([succeededWorkflowResponse]);
  try {
    const first = await runWorkflow('content-orchestrator', { keyword: 'contract-ok' }, 'contract-test-key', 'content_gen', 5000);
    assert.equal(first.success, true);
    assert.equal(first.outputs.article, 'contract-test-article');

    await sleep(1600);
    const second = await runWorkflow('content-orchestrator', { keyword: 'contract-ok' }, 'contract-test-key', 'content_gen', 5000);
    assert.equal(second.success, true);
    assert.equal(second.outputs.article, 'contract-test-article');
    assert.equal(okStub.calls.length, 1, 'successful workflow responses must be cached');
  } finally {
    okStub.restore();
  }

  fs.rmSync(tmpRoot, { recursive: true, force: true });
  console.log('dify-client workflow contract test passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
