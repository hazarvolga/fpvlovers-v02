import assert from 'node:assert/strict';

async function main(): Promise<void> {
  process.env.ENABLE_REAL_RAG = 'false';
  process.env.ENABLE_SIMULATED_RAG = 'true';
  delete process.env.DIFY_RERANK_PROVIDER;
  delete process.env.DIFY_RERANK_MODEL;
  delete process.env.DIFY_EMBEDDING_PROVIDER;
  delete process.env.DIFY_EMBEDDING_MODEL;

  const {
    DEFAULT_CONFIGS,
    buildDifyRetrievalModel,
    filterChunksByRequiredTerms,
    getRetrievalConfidence,
    mergeAndDedup,
    orchestrateRetrieval,
    resolveDifyDatasetId,
  } = await import('../src/lib/retrieval-orchestrator');

  const resolvedDatasetId = await resolveDifyDatasetId('fpv-flight-tuning', {
    apiKey: 'test-dataset-key',
    baseUrl: 'https://dify.example/v1/',
    fallbackId: 'stale-configured-uuid',
    now: 1_000,
    fetchImpl: async (input, init) => {
      assert.equal(String(input), 'https://dify.example/v1/datasets?page=1&limit=100');
      assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer test-dataset-key');
      return new Response(JSON.stringify({
        data: [{ id: 'current-runtime-uuid', name: 'fpv-flight-tuning' }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    },
  });
  assert.equal(resolvedDatasetId, 'current-runtime-uuid');

  const fallbackDatasetId = await resolveDifyDatasetId('missing-dataset', {
    apiKey: 'test-dataset-key',
    baseUrl: 'https://dify.example/v1/',
    fallbackId: 'configured-fallback-uuid',
    now: 1_001,
    fetchImpl: async () => {
      throw new Error('cache should satisfy this lookup');
    },
  });
  assert.equal(fallbackDatasetId, 'configured-fallback-uuid');

  const hybridModel = buildDifyRetrievalModel(DEFAULT_CONFIGS.default);
  assert.equal(hybridModel.search_method, 'hybrid_search');
  assert.equal(hybridModel.reranking_enable, false);
  assert.equal(hybridModel.reranking_mode, undefined);
  assert.equal(hybridModel.weights, undefined);

  process.env.DIFY_EMBEDDING_PROVIDER = 'test-provider';
  process.env.DIFY_EMBEDDING_MODEL = 'test-model';
  const weightedHybridModel = buildDifyRetrievalModel(DEFAULT_CONFIGS.default);
  assert.equal(weightedHybridModel.reranking_enable, true);
  assert.equal(weightedHybridModel.reranking_mode, 'weighted_score');
  assert.deepEqual(weightedHybridModel.weights, {
    weight_type: 'customized',
    vector_setting: {
      vector_weight: 0.7,
      embedding_provider_name: 'test-provider',
      embedding_model_name: 'test-model',
    },
    keyword_setting: { keyword_weight: 0.3 },
  });
  delete process.env.DIFY_EMBEDDING_PROVIDER;
  delete process.env.DIFY_EMBEDDING_MODEL;

  const tuningModel = buildDifyRetrievalModel(DEFAULT_CONFIGS.tuning);
  assert.deepEqual(tuningModel.metadata_filtering_conditions, {
    logical_operator: 'or',
    conditions: DEFAULT_CONFIGS.tuning.metadataFilters?.conditions.map((condition) => ({
      name: condition.name,
      comparison_operator: condition.comparisonOperator,
      value: condition.value,
    })),
  });

  const sameDocumentChunks = [
    {
      id: 'segment-1', content: 'First distinct section', datasetName: 'dataset-a',
      datasetId: 'dataset-a-id', documentName: 'guide.md', score: 0.9, position: 1,
    },
    {
      id: 'segment-2', content: 'Second distinct section', datasetName: 'dataset-a',
      datasetId: 'dataset-a-id', documentName: 'guide.md', score: 0.8, position: 2,
    },
    {
      id: 'segment-1', content: 'Duplicate API record', datasetName: 'dataset-a',
      datasetId: 'dataset-a-id', documentName: 'guide.md', score: 0.7, position: 3,
    },
  ];
  const strictDeduped = mergeAndDedup(sameDocumentChunks, 'strict');
  assert.deepEqual(strictDeduped.map((chunk) => chunk.id), ['segment-1', 'segment-2']);

  const contaminationGuard = filterChunksByRequiredTerms(sameDocumentChunks, ['pid', 'filter']);
  assert.deepEqual(contaminationGuard, []);

  const metadataFreeConfidence = getRetrievalConfidence([sameDocumentChunks[0]]);
  assert.ok(metadataFreeConfidence.confidence <= 0.49);

  const simulatedConfidence = getRetrievalConfidence([{
    ...sameDocumentChunks[0],
    metadata: { simulation: true, is_primary: true },
  }]);
  assert.ok(simulatedConfidence.confidence <= 0.25);

  const primaryOnly = await orchestrateRetrieval('pid tuning', 'default', {
    primaryDatasets: ['fpv-community-knowledge'],
    fallbackDatasets: ['fpv-flight-tuning'],
    minConfidenceForFallback: -1,
    scoreThreshold: -1,
    maxChunksPerDataset: 2,
    useReranking: false,
  });
  assert.equal(primaryOnly.stats.fallbackTriggered, false);
  assert.equal(primaryOnly.stats.datasetsQueried, 1);
  assert.equal(primaryOnly.observations.length, 1);
  assert.equal(primaryOnly.observations[0]?.status, 'simulated');
  assert.ok(primaryOnly.traceId.length > 0);
  assert.equal(primaryOnly.stats.datasetErrors, 0);
  assert.ok(primaryOnly.chunks.every((chunk) => chunk.datasetName === 'fpv-community-knowledge'));
  assert.ok(primaryOnly.chunks.every((chunk) => chunk.rerankScore === undefined));

  const withFallback = await orchestrateRetrieval('pid tuning', 'default', {
    primaryDatasets: ['fpv-community-knowledge'],
    fallbackDatasets: ['fpv-flight-tuning'],
    minConfidenceForFallback: 2,
    scoreThreshold: -1,
    topK: 10,
    maxChunksPerDataset: 2,
    useReranking: false,
  });
  assert.equal(withFallback.stats.fallbackTriggered, true);
  assert.equal(withFallback.stats.datasetsQueried, 2);
  assert.equal(withFallback.stats.totalRetrieved, 3);
  assert.equal(withFallback.observations.length, 2);
  assert.deepEqual(withFallback.observations.map((observation) => observation.role), ['primary', 'fallback']);

  console.log('Retrieval orchestrator regression test passed.');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
