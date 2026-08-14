import assert from 'node:assert/strict';

async function main(): Promise<void> {
  process.env.ENABLE_REAL_RAG = 'false';
  delete process.env.ENABLE_SIMULATED_RAG;
  const { orchestrateRetrieval } = await import('../src/lib/retrieval-orchestrator');
  const result = await orchestrateRetrieval('pid tuning', 'tuning');

  assert.equal(result.chunks.length, 0);
  assert.ok(result.traceId.length > 0);
  assert.ok(result.observations.length >= 1);
  assert.ok(result.observations.every((observation) => observation.status === 'disabled'));
  assert.equal(result.stats.datasetErrors, 0);
  assert.ok(result.stats.durationMs >= 0);

  console.log('Retrieval disabled observability regression test passed.');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
