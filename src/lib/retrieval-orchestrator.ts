// Retrieval Orchestrator — Multi-dataset merge + dedup + rerank
// Centralizes retrieval intelligence across 9 Dify datasets

import { DATASETS } from '@/lib/master-routing-tables';

// ─── FEATURE FLAG ───

const USE_REAL_RAG = process.env.ENABLE_REAL_RAG === 'true';
const USE_SIMULATED_RAG = !USE_REAL_RAG
  && process.env.NODE_ENV !== 'production'
  && process.env.ENABLE_SIMULATED_RAG === 'true';

const DATASET_DIRECTORY_CACHE_TTL_MS = 5 * 60 * 1_000;

type DatasetDirectoryCache = {
  baseUrl: string;
  expiresAt: number;
  idsByName: Readonly<Record<string, string>>;
};

let datasetDirectoryCache: DatasetDirectoryCache | null = null;

function boundedTimeout(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.round(parsed), min), max) : fallback;
}

export const RETRIEVAL_REQUEST_TIMEOUT_MS = boundedTimeout(
  process.env.DIFY_RETRIEVAL_REQUEST_TIMEOUT_MS,
  6_000,
  1_000,
  15_000,
);

export const RETRIEVAL_GROUNDING_TIMEOUT_MS = boundedTimeout(
  process.env.RAG_GROUNDING_TIMEOUT_MS,
  20_000,
  RETRIEVAL_REQUEST_TIMEOUT_MS + 1_000,
  45_000,
);

// ─── TYPES ───

export interface RetrievalChunk {
  id: string;
  content: string;
  datasetName: string;
  datasetId: string;
  documentName: string;
  score: number;
  semanticScore?: number;
  keywordScore?: number;
  rerankScore?: number;
  trustScore?: number;
  metadata?: Record<string, any>;
  position: number; // original rank position
}

export interface RetrievalConfig {
  primaryDatasets: string[];
  fallbackDatasets: string[];
  retrievalMode: 'hybrid' | 'semantic' | 'keyword';
  scoreThreshold: number;
  topK: number;
  semanticWeight: number;
  keywordWeight: number;
  useReranking: boolean;
  maxChunksPerDataset: number;
  dedupStrategy: 'strict' | 'fuzzy' | 'none';
  minConfidenceForFallback: number;
  requiredContentTerms?: string[];
  metadataFilters?: {
    logicalOperator: 'and' | 'or';
    conditions: Array<{
      name: string;
      comparisonOperator: 'contains' | 'not contains' | 'is' | 'is not' | 'in' | 'not in';
      value: string | string[];
    }>;
  };
}

export interface RetrievalResult {
  traceId: string;
  chunks: RetrievalChunk[];
  config: RetrievalConfig;
  observations: RetrievalDatasetObservation[];
  stats: {
    totalRetrieved: number;
    afterDedup: number;
    afterRerank: number;
    datasetsQueried: number;
    fallbackTriggered: boolean;
    confidence: number;
    averageScore: number;
    datasetErrors: number;
    durationMs: number;
  };
}

export type RetrievalDatasetObservation = {
  datasetName: string;
  role: 'primary' | 'fallback';
  status: 'success' | 'no_match' | 'error' | 'simulated' | 'disabled';
  durationMs: number;
  returnedChunks: number;
  error?: string;
};

// ─── DEFAULT CONFIGS PER INTENT ───

export const DEFAULT_CONFIGS: Record<string, RetrievalConfig> = {
  tuning: {
    primaryDatasets: ['fpv-flight-tuning'], fallbackDatasets: ['fpv-pid-profiles'],
    retrievalMode: 'hybrid', scoreThreshold: 0.60, topK: 5,
    semanticWeight: 0.7, keywordWeight: 0.3, useReranking: true,
    maxChunksPerDataset: 8, dedupStrategy: 'fuzzy', minConfidenceForFallback: 0.35,
    requiredContentTerms: ['pid', 'tuning', 'filter', 'gyro', 'd-term', 'feedforward', 'propwash', 'blackbox', 'betaflight'],
    metadataFilters: {
      logicalOperator: 'or',
      conditions: ['betaflight.com', 'edgetx.org', 'ardupilot.org', 'expresslrs.org', 'px4.io', 'am32.ca', 'github.com'].map((host) => ({
        name: 'source_url', comparisonOperator: 'contains' as const, value: host,
      })),
    },
  },
  build: {
    primaryDatasets: ['fpv-build-guides'], fallbackDatasets: ['fpv-components-specs', 'fpv-community-knowledge'],
    retrievalMode: 'hybrid', scoreThreshold: 0.50, topK: 4,
    semanticWeight: 0.7, keywordWeight: 0.3, useReranking: true,
    maxChunksPerDataset: 8, dedupStrategy: 'fuzzy', minConfidenceForFallback: 0.30,
  },
  parts: {
    primaryDatasets: ['fpv-components-specs'], fallbackDatasets: ['fpv-build-guides'],
    retrievalMode: 'hybrid', scoreThreshold: 0.60, topK: 4,
    semanticWeight: 0.4, keywordWeight: 0.6, useReranking: true,
    maxChunksPerDataset: 10, dedupStrategy: 'strict', minConfidenceForFallback: 0.40,
  },
  troubleshooting: {
    primaryDatasets: ['fpv-troubleshooting'], fallbackDatasets: ['fpv-community-knowledge', 'fpv-flight-tuning'],
    retrievalMode: 'hybrid', scoreThreshold: 0.55, topK: 5,
    semanticWeight: 0.6, keywordWeight: 0.4, useReranking: true,
    maxChunksPerDataset: 6, dedupStrategy: 'fuzzy', minConfidenceForFallback: 0.30,
  },
  regulations: {
    primaryDatasets: ['fpv-regulations'], fallbackDatasets: [], // ⛔ NO FALLBACK
    retrievalMode: 'hybrid', scoreThreshold: 0.70, topK: 4,
    semanticWeight: 0.3, keywordWeight: 0.7, useReranking: true,
    maxChunksPerDataset: 6, dedupStrategy: 'strict', minConfidenceForFallback: 1.0,
    requiredContentTerms: ['shgm', 'easa', 'regulation', 'remote id', 'registration', 'kayit', 'iha'],
    metadataFilters: {
      logicalOperator: 'or',
      conditions: ['shgm.gov.tr', 'easa.europa.eu', 'dronerules.eu'].map((host) => ({
        name: 'source_url', comparisonOperator: 'contains' as const, value: host,
      })),
    },
  },
  buying: {
    primaryDatasets: ['fpv-news-reviews'], fallbackDatasets: ['fpv-components-specs', 'fpv-build-guides'],
    retrievalMode: 'hybrid', scoreThreshold: 0.45, topK: 5,
    semanticWeight: 0.6, keywordWeight: 0.4, useReranking: true,
    maxChunksPerDataset: 8, dedupStrategy: 'fuzzy', minConfidenceForFallback: 0.25,
  },
  default: {
    primaryDatasets: ['fpv-community-knowledge'], fallbackDatasets: ['fpv-flight-tuning'],
    retrievalMode: 'hybrid', scoreThreshold: 0.50, topK: 4,
    semanticWeight: 0.7, keywordWeight: 0.3, useReranking: true,
    maxChunksPerDataset: 6, dedupStrategy: 'fuzzy', minConfidenceForFallback: 0.35,
  },
};

export function buildDifyRetrievalModel(config: RetrievalConfig): Record<string, unknown> {
  const searchMethod = config.retrievalMode === 'keyword' ? 'keyword_search'
    : config.retrievalMode === 'semantic' ? 'semantic_search'
    : 'hybrid_search';
  const rerankingProvider = process.env.DIFY_RERANK_PROVIDER?.trim();
  const rerankingModel = process.env.DIFY_RERANK_MODEL?.trim();
  const embeddingProvider = process.env.DIFY_EMBEDDING_PROVIDER?.trim();
  const embeddingModel = process.env.DIFY_EMBEDDING_MODEL?.trim();
  const hasModelReranker = config.useReranking && Boolean(rerankingProvider && rerankingModel);
  const usesWeightedHybrid = config.useReranking
    && config.retrievalMode === 'hybrid'
    && !hasModelReranker
    && Boolean(embeddingProvider && embeddingModel);

  return {
    search_method: searchMethod,
    reranking_enable: hasModelReranker || usesWeightedHybrid,
    ...((hasModelReranker || usesWeightedHybrid) && {
      reranking_mode: hasModelReranker ? 'reranking_model' : 'weighted_score',
    }),
    ...(hasModelReranker && {
      reranking_model: {
        reranking_provider_name: rerankingProvider,
        reranking_model_name: rerankingModel,
      },
    }),
    ...(usesWeightedHybrid && {
      weights: {
      weight_type: 'customized',
      vector_setting: {
        vector_weight: config.semanticWeight,
        embedding_provider_name: embeddingProvider,
        embedding_model_name: embeddingModel,
      },
      keyword_setting: { keyword_weight: config.keywordWeight },
      },
    }),
    top_k: Math.min(config.maxChunksPerDataset, 10),
    score_threshold_enabled: true,
    score_threshold: config.scoreThreshold,
    ...(config.metadataFilters && {
      metadata_filtering_conditions: {
        logical_operator: config.metadataFilters.logicalOperator,
        conditions: config.metadataFilters.conditions.map((condition) => ({
          name: condition.name,
          comparison_operator: condition.comparisonOperator,
          value: condition.value,
        })),
      },
    }),
  };
}

type ResolveDifyDatasetIdOptions = {
  apiKey: string;
  baseUrl: string;
  fallbackId: string;
  fetchImpl?: typeof fetch;
  now?: number;
};

export async function resolveDifyDatasetId(
  datasetName: string,
  options: ResolveDifyDatasetIdOptions,
): Promise<string> {
  const baseUrl = options.baseUrl.replace(/\/$/, '');
  const now = options.now ?? Date.now();
  const cachedId = datasetDirectoryCache?.baseUrl === baseUrl
    && datasetDirectoryCache.expiresAt > now
    ? datasetDirectoryCache.idsByName[datasetName]
    : undefined;
  if (cachedId) return cachedId;

  const fetchImpl = options.fetchImpl ?? fetch;
  try {
    const response = await fetchImpl(`${baseUrl}/datasets?page=1&limit=100`, {
      headers: { Authorization: `Bearer ${options.apiKey}` },
      signal: AbortSignal.timeout(RETRIEVAL_REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      console.error(`[Retrieval] Dify dataset directory request failed: HTTP ${response.status}`);
      return options.fallbackId;
    }

    const payload = await response.json() as { data?: Array<{ id?: unknown; name?: unknown }> };
    const idsByName = Object.fromEntries(
      (Array.isArray(payload.data) ? payload.data : []).flatMap((dataset) => (
        typeof dataset.name === 'string' && typeof dataset.id === 'string'
          ? [[dataset.name, dataset.id] as const]
          : []
      )),
    );
    datasetDirectoryCache = {
      baseUrl,
      expiresAt: now + DATASET_DIRECTORY_CACHE_TTL_MS,
      idsByName,
    };
    return idsByName[datasetName] ?? options.fallbackId;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Retrieval] Dify dataset directory lookup failed: ${message.slice(0, 160)}`);
    return options.fallbackId;
  }
}

// ─── REAL RETRIEVAL (Dify Dataset API) ───
// Uses the Dify Knowledge Base "hit testing" endpoint: POST /datasets/{id}/retrieve.
// Requires a Dataset-scoped API key (Dify Studio → Knowledge → API Access), NOT a
// chat-app key — DIFY_DATASET_API_KEY takes priority, falling back to DIFY_API_KEY
// for environments that only have the general-purpose key configured.

async function realRetrieval(
  query: string,
  config: RetrievalConfig,
  datasetNames: readonly string[],
  observations: RetrievalDatasetObservation[],
): Promise<RetrievalChunk[]> {
  const chunks: RetrievalChunk[] = [];

  const apiKey = (process.env.DIFY_DATASET_API_KEY || process.env.DIFY_API_KEY)?.trim();
  if (!apiKey) {
    console.error('[Retrieval] DIFY_DATASET_API_KEY / DIFY_API_KEY not set — cannot call Dataset API');
    return [];
  }

  const baseUrl = process.env.DIFY_BASE_URL?.trim()
    || process.env.APP_API_URL?.trim()
    || 'https://dify.affexai.tr/v1';

  let idCounter = 0;

  for (const dsName of datasetNames) {
    const datasetStartedAt = Date.now();
    const datasetInfo = DATASETS.find(ds => ds.name === dsName);
    // docCount is not tracked locally — skip the gate; Dify returns empty results for empty collections.
    const datasetId = await resolveDifyDatasetId(dsName, {
      apiKey,
      baseUrl,
      fallbackId: datasetInfo?.uuid ?? dsName,
    });
    const isPrimary = config.primaryDatasets.includes(dsName);

    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/datasets/${encodeURIComponent(datasetId)}/retrieve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          retrieval_model: buildDifyRetrievalModel(config),
        }),
        signal: AbortSignal.timeout(RETRIEVAL_REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        console.error(`[Retrieval] Dify API error for dataset ${dsName}: HTTP ${response.status} ${body.slice(0, 200)}`);
        observations.push({
          datasetName: dsName,
          role: isPrimary ? 'primary' : 'fallback',
          status: 'error',
          durationMs: Date.now() - datasetStartedAt,
          returnedChunks: 0,
          error: `HTTP ${response.status}`,
        });
        continue;
      }

      const result = await response.json();
      const records: Record<string, unknown>[] = Array.isArray(result?.records) ? result.records : [];

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const segment = (record.segment ?? {}) as Record<string, unknown>;
        const document = (segment.document ?? {}) as Record<string, unknown>;
        const chunk: RetrievalChunk = {
          id: String(segment.id ?? `chunk-${dsName}-${idCounter}`),
          content: String(segment.content ?? ''),
          datasetName: dsName,
          datasetId,
          documentName: String(document.name ?? `doc-${dsName}`),
          score: Number(record.score ?? 0),
          position: i + 1,
          metadata: {
            is_primary: isPrimary,
            data_source_type: document.data_source_type,
            doc_metadata: document.doc_metadata,
          },
        };
        chunks.push(chunk);
        idCounter++;
      }
      observations.push({
        datasetName: dsName,
        role: isPrimary ? 'primary' : 'fallback',
        status: records.length > 0 ? 'success' : 'no_match',
        durationMs: Date.now() - datasetStartedAt,
        returnedChunks: records.length,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[Retrieval] Error querying dataset ${dsName}:`, message);
      observations.push({
        datasetName: dsName,
        role: isPrimary ? 'primary' : 'fallback',
        status: 'error',
        durationMs: Date.now() - datasetStartedAt,
        returnedChunks: 0,
        error: message.slice(0, 160),
      });
    }
  }

  return chunks;
}

// ─── SIMULATED RETRIEVAL (fallback when ENABLE_REAL_RAG !== 'true') ───

export function simulateRetrieval(
  query: string,
  config: RetrievalConfig,
  datasetNames: readonly string[] = [...config.primaryDatasets, ...config.fallbackDatasets],
): RetrievalChunk[] {
  const chunks: RetrievalChunk[] = [];
  const queryTerms = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  let idCounter = 0;
  for (const dsName of datasetNames) {
    const isPrimary = config.primaryDatasets.includes(dsName);
    const maxChunks = isPrimary ? config.maxChunksPerDataset : Math.floor(config.maxChunksPerDataset / 2);
    // docCount is not tracked locally; always attempt simulation with default factor.
    const populationFactor = 0.75;

    // Simulate retrieval quality based on dataset
    const datasetQualityMap: Record<string, number> = {
      'fpv-flight-tuning': 0.95, 'fpv-pid-profiles': 0.30, 'fpv-troubleshooting': 0.30,
      'fpv-components-specs': 0.30, 'fpv-build-guides': 0.30, 'fpv-news-reviews': 0.70,
      'fpv-racing-events': 0.30, 'fpv-community-knowledge': 0.85, 'fpv-regulations': 0.80,
    };
    const baseQuality = (datasetQualityMap[dsName] || 0.5) * populationFactor;

    for (let i = 0; i < Math.min(maxChunks, 8); i++) {
      const semanticScore = Math.min(baseQuality + Math.random() * 0.2 - i * 0.08, 1);
      const keywordScore = Math.min(Math.random() * 0.5 + queryTerms.length * 0.05, 1);

      const score = config.semanticWeight * semanticScore + config.keywordWeight * keywordScore;

      if (score < config.scoreThreshold && !isPrimary) continue;

      chunks.push({
        id: `chunk-${dsName}-${idCounter++}`,
        content: `[Simulated retrieval from ${dsName}] Content matching "${query}" with relevance score ${score.toFixed(3)}.`,
        datasetName: dsName, datasetId: dsName,
        documentName: `doc-${dsName}-${i + 1}`,
        score, semanticScore, keywordScore,
        position: i + 1,
        metadata: { is_primary: isPrimary, simulation: true },
      });
    }
  }

  return chunks;
}

// ─── DEDUP ENGINE ───

export function mergeAndDedup(chunks: RetrievalChunk[], strategy: 'strict' | 'fuzzy' | 'none' = 'fuzzy'): RetrievalChunk[] {
  if (strategy === 'none') return chunks;
  if (chunks.length === 0) return [];

  const deduped: RetrievalChunk[] = [];
  const seen = new Set<string>();

  for (const chunk of chunks.sort((a, b) => b.score - a.score)) {
    let isDuplicate = false;

    if (strategy === 'strict') {
      // Strict means the same indexed chunk, not every chunk from the same
      // document. Dify segment IDs are stable chunk identities.
      const key = `${chunk.datasetId}:${chunk.id}`;
      if (seen.has(key)) isDuplicate = true;
      seen.add(key);
    } else {
      // Fuzzy: content similarity check (>80% overlap)
      const simplified = chunk.content.slice(0, 100).replace(/\s+/g, ' ').toLowerCase();
      for (const existing of deduped) {
        const existingSimple = existing.content.slice(0, 100).replace(/\s+/g, ' ').toLowerCase();
        const overlap = jaccardSimilarity(simplified.split(' '), existingSimple.split(' '));
        if (overlap > 0.7) { isDuplicate = true; break; }
      }
    }

    if (!isDuplicate) deduped.push(chunk);
  }

  return deduped;
}

// ─── GLOBAL RERANK ───

export function globalRerank(chunks: RetrievalChunk[], query: string): RetrievalChunk[] {
  // TODO: Integrate actual Jina Reranker v2 API call here for production
  // as per AGENTS.md (Hybrid Search + Jina Reranker v2 + gemini-embedding-001)
  const queryTerms = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 2));

  return chunks.map(chunk => {
    const contentTerms = chunk.content.toLowerCase().split(/\s+/);
    const termMatches = contentTerms.filter(t => queryTerms.has(t)).length;
    
    // Optimized term bonus to simulate hybrid cross-encoder (Jina v2) behavior
    const termBonus = Math.min(termMatches / Math.max(queryTerms.size, 1) * 0.4, 0.4);

    const primaryBonus = chunk.metadata?.is_primary ? 0.15 : 0;
    const rerankScore = Math.min((chunk.score * 0.7) + termBonus + primaryBonus, 1.0);

    return { ...chunk, rerankScore, score: rerankScore };
  }).sort((a, b) => b.score - a.score);
}

export function filterChunksByRequiredTerms(
  chunks: readonly RetrievalChunk[],
  requiredTerms: readonly string[] | undefined,
): RetrievalChunk[] {
  if (!requiredTerms?.length) return [...chunks];
  const normalizedTerms = requiredTerms.map((term) => term.toLowerCase());
  return chunks.filter((chunk) => {
    const content = chunk.content.toLowerCase();
    return normalizedTerms.some((term) => content.includes(term));
  });
}

// ─── CONFIDENCE ASSESSMENT ───

export function getRetrievalConfidence(chunks: RetrievalChunk[]): {
  confidence: number;
  grade: 'high' | 'medium' | 'low' | 'insufficient';
  recommendation: string;
} {
  if (chunks.length === 0) return { confidence: 0, grade: 'insufficient', recommendation: 'Expand dataset scope or add more source URLs.' };

  const avgScore = chunks.reduce((s, c) => s + c.score, 0) / chunks.length;
  const maxScore = Math.max(...chunks.map(c => c.score));
  const uniqueDocuments = new Set(chunks.map((chunk) => `${chunk.datasetId}:${chunk.documentName}`)).size;
  const sourceBacked = chunks.filter((chunk) => {
    const metadata = chunk.metadata?.doc_metadata;
    if (Array.isArray(metadata)) {
      return metadata.some((entry) => entry && typeof entry === 'object'
        && (entry as Record<string, unknown>).name === 'source_url'
        && Boolean((entry as Record<string, unknown>).value));
    }
    return Boolean(metadata && typeof metadata === 'object' && (metadata as Record<string, unknown>).source_url);
  }).length;
  const sourceCoverage = sourceBacked / chunks.length;
  const diversity = Math.min(uniqueDocuments / 3, 1);
  const sampleSize = Math.min(chunks.length / 3, 1);

  let confidence = avgScore * 0.5
    + maxScore * 0.15
    + sourceCoverage * 0.2
    + diversity * 0.1
    + sampleSize * 0.05;
  if (sourceCoverage === 0) confidence = Math.min(confidence, 0.49);
  if (uniqueDocuments < 2) confidence = Math.min(confidence, 0.69);
  if (chunks.every((chunk) => chunk.metadata?.simulation)) confidence = Math.min(confidence, 0.25);

  let grade: 'high' | 'medium' | 'low' | 'insufficient';
  if (confidence >= 0.75) grade = 'high';
  else if (confidence >= 0.55) grade = 'medium';
  else if (confidence >= 0.35) grade = 'low';
  else grade = 'insufficient';

  const recommendations: Record<string, string> = {
    high: 'Strong multi-source retrieval signal; preserve source citations in the response.',
    medium: 'Usable retrieval signal; keep claims bounded to the returned sources.',
    low: 'Weak retrieval signal; avoid unsupported recommendations and request better evidence.',
    insufficient: 'Verified evidence is insufficient; do not provide source-dependent guidance.',
  };

  return { confidence: Math.round(confidence * 100) / 100, grade, recommendation: recommendations[grade] };
}

// ─── MAIN ORCHESTRATOR ───

export async function orchestrateRetrieval(
  query: string,
  intent: string = 'default',
  customConfig?: Partial<RetrievalConfig>,
): Promise<RetrievalResult> {
  const traceId = crypto.randomUUID();
  const retrievalStartedAt = Date.now();
  const observations: RetrievalDatasetObservation[] = [];
  const baseConfig = DEFAULT_CONFIGS[intent] || DEFAULT_CONFIGS.default;
  const config: RetrievalConfig = { ...baseConfig, ...customConfig };

  const retrieveDatasets = (datasetNames: readonly string[]) => {
    if (USE_REAL_RAG) return realRetrieval(query, config, datasetNames, observations);
    if (USE_SIMULATED_RAG) {
      const simulated = simulateRetrieval(query, config, datasetNames);
      for (const datasetName of datasetNames) {
        observations.push({
          datasetName,
          role: config.primaryDatasets.includes(datasetName) ? 'primary' : 'fallback',
          status: 'simulated',
          durationMs: 0,
          returnedChunks: simulated.filter((chunk) => chunk.datasetName === datasetName).length,
        });
      }
      return Promise.resolve(simulated);
    }
    for (const datasetName of datasetNames) {
      observations.push({
        datasetName,
        role: config.primaryDatasets.includes(datasetName) ? 'primary' : 'fallback',
        status: 'disabled',
        durationMs: 0,
        returnedChunks: 0,
      });
    }
    return Promise.resolve([]);
  };

  let chunks: RetrievalChunk[];
  if (USE_REAL_RAG) {
    console.log('[Retrieval] Real RAG enabled — calling Dify Dataset API');
  } else if (USE_SIMULATED_RAG) {
    console.warn('[Retrieval] Explicit non-production simulation enabled');
  } else {
    console.error('[Retrieval] Real RAG is disabled; returning no retrieval evidence');
  }
  chunks = await retrieveDatasets(config.primaryDatasets);
  chunks = filterChunksByRequiredTerms(chunks, config.requiredContentTerms);

  // 2. Check primary quality — trigger fallback if needed
  const primaryChunks = [...chunks];
  const primaryAvgScore = primaryChunks.length > 0
    ? primaryChunks.reduce((s, c) => s + c.score, 0) / primaryChunks.length
    : 0;
  const fallbackTriggered = primaryAvgScore < config.minConfidenceForFallback && config.fallbackDatasets.length > 0;

  if (fallbackTriggered) {
    const fallbackChunks = await retrieveDatasets(config.fallbackDatasets);
    chunks = [...chunks, ...filterChunksByRequiredTerms(fallbackChunks, config.requiredContentTerms)];
  }

  // 3. DEDUP
  const totalRetrieved = chunks.length;
  chunks = mergeAndDedup(chunks, config.dedupStrategy);
  const afterDedup = chunks.length;

  // 4. RERANK
  if (config.useReranking && USE_SIMULATED_RAG) {
    chunks = globalRerank(chunks, query);
  }
  const afterRerank = chunks.length;

  // 5. LIMIT
  chunks = chunks.slice(0, config.topK);

  // 6. CONFIDENCE
  const confidence = getRetrievalConfidence(chunks);
  let adjustedConfidence = confidence.confidence;
  if (fallbackTriggered && primaryChunks.length === 0) {
    adjustedConfidence = Math.min(adjustedConfidence * 0.65, 0.65);
  } else if (fallbackTriggered) {
    adjustedConfidence = Math.min(adjustedConfidence * 0.85, 0.85);
  }

  const durationMs = Date.now() - retrievalStartedAt;
  console.info('[RetrievalObservation]', JSON.stringify({
    traceId,
    intent,
    fallbackTriggered,
    durationMs,
    observations,
  }));

  return {
    traceId,
    chunks,
    config,
    observations,
    stats: {
      totalRetrieved, afterDedup, afterRerank,
      datasetsQueried: config.primaryDatasets.length
        + (fallbackTriggered ? config.fallbackDatasets.length : 0),
      fallbackTriggered,
      confidence: Math.round(adjustedConfidence * 100) / 100,
      averageScore: chunks.length > 0 ? Math.round(chunks.reduce((s, c) => s + c.score, 0) / chunks.length * 1000) / 1000 : 0,
      datasetErrors: observations.filter((observation) => observation.status === 'error').length,
      durationMs,
    },
  };
}

// ─── UTILS ───

function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/** @deprecated docCount is not tracked locally; removed from DatasetInfo. Use live Qdrant to verify. */
function getDatasetDocCount(_datasetName: string): number {
  return 0;
}
