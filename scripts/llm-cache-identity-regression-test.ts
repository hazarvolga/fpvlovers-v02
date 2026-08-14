import assert from 'node:assert/strict';
import { hashInput, type LlmCacheIdentity } from '../src/lib/llm-cache';

const base: LlmCacheIdentity = {
  model: 'gemini-2.5-flash',
  endpoint: '/datasets/dataset-a/retrieve',
  method: 'POST',
  baseUrl: 'https://dify.example/v1',
  appIdentity: 'key-fingerprint-a',
  knowledgeRevision: 'revision-1',
  body: { query: 'pid tuning' },
};

const hash = hashInput(base);
assert.equal(hash.length, 64);
assert.notEqual(hashInput({ ...base, endpoint: '/datasets/dataset-b/retrieve' }), hash);
assert.notEqual(hashInput({ ...base, appIdentity: 'key-fingerprint-b' }), hash);
assert.notEqual(hashInput({ ...base, knowledgeRevision: 'revision-2' }), hash);
assert.notEqual(hashInput({ ...base, body: { query: 'filter tuning' } }), hash);
assert.equal(hashInput({ ...base }), hash);

console.log('LLM cache identity regression test passed.');
