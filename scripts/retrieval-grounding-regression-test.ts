import assert from 'node:assert/strict';

async function main(): Promise<void> {
  process.env.ENABLE_REAL_RAG = 'false';
  delete process.env.ENABLE_SIMULATED_RAG;
  const { getGroundingContext } = await import('../src/lib/tools/retrieval-grounding');
  const grounding = await getGroundingContext('propwash PID tuning', 'tuning');

  assert.equal(grounding.sources.length, 0);
  assert.equal(grounding.confidence, 0);
  assert.equal(grounding.grade, 'insufficient');
  assert.doesNotMatch(grounding.contextBlock, /answer only from general .* expertise/i);
  assert.match(grounding.contextBlock, /verified-source guidance is unavailable/i);
  assert.match(grounding.recommendation, /guidance is unavailable/i);

  console.log('Retrieval grounding regression test passed.');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
