// Retrieval Orchestrator — Multi-dataset merge + dedup + rerank
// Centralizes retrieval intelligence across 9 Dify datasets

import { DATASETS } from '@/lib/master-routing-tables';

// ─── FEATURE FLAG ───

const USE_REAL_RAG = process.env.ENABLE_REAL_RAG === 'true';

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
}

export interface RetrievalResult {
  chunks: RetrievalChunk[];
  config: RetrievalConfig;
  stats: {
    totalRetrieved: number;
    afterDedup: number;
    afterRerank: number;
    datasetsQueried: number;
    fallbackTriggered: boolean;
    confidence: number;
    averageScore: number;
  };
}

// ─── DEFAULT CONFIGS PER INTENT ───

export const DEFAULT_CONFIGS: Record<string, RetrievalConfig> = {
  tuning: {
    primaryDatasets: ['fpv-flight-tuning'], fallbackDatasets: ['fpv-pid-profiles'],
    retrievalMode: 'hybrid', scoreThreshold: 0.60, topK: 5,
    semanticWeight: 0.7, keywordWeight: 0.3, useReranking: true,
    maxChunksPerDataset: 8, dedupStrategy: 'fuzzy', minConfidenceForFallback: 0.35,
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

// ─── REAL RETRIEVAL (Dify Dataset API) ───

async function realRetrieval(query: string, config: RetrievalConfig): Promise<RetrievalChunk[]> {
  const allDatasets = [...config.primaryDatasets, ...config.fallbackDatasets];
  const chunks: RetrievalChunk[] = [];

  const apiKey = process.env.DIFY_API_KEY?.trim();
  if (!apiKey) {
    console.error('[Retrieval] DIFY_API_KEY not set — cannot call Dataset API');
    return [];
  }

  const baseUrl = process.env.DIFY_BASE_URL?.trim()
    || process.env.APP_API_URL?.trim()
    || 'https://dify.affexai.tr/v1';

  let idCounter = 0;

  for (const dsName of allDatasets) {
    const datasetInfo = DATASETS.find(ds => ds.name === dsName);
    const docCount = datasetInfo?.docCount ?? 0;
    if (docCount === 0) continue;

    const datasetId = datasetInfo?.uuid ?? dsName;
    const isPrimary = config.primaryDatasets.includes(dsName);

    try {
      const response = await fetch(`${baseUrl}/datasets/${datasetId}/document/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          top_k: Math.min(config.maxChunksPerDataset, 10),
          score_threshold: config.scoreThreshold,
          keyword_weight: config.keywordWeight,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        console.error(`[Retrieval] Dify API error for dataset ${dsName}: HTTP ${response.status}`);
        continue;
      }

      const result = await response.json();
      const documents: Record<string, unknown>[] = result?.data ?? [];

      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        const document = (doc.document ?? {}) as Record<string, unknown>;
        const chunk: RetrievalChunk = {
          id: String(doc.id ?? `chunk-${dsName}-${idCounter}`),
          content: String(doc.content ?? document.name ?? ''),
          datasetName: dsName,
          datasetId,
          documentName: String(document.name ?? `doc-${dsName}`),
          score: Number(doc.score ?? 0),
          position: i + 1,
          metadata: {
            is_primary: isPrimary,
            data_source_type: document.data_source_type,
            data_source_info: document.data_source_info,
          },
        };
        chunks.push(chunk);
        idCounter++;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[Retrieval] Error querying dataset ${dsName}:`, message);
    }
  }

  return chunks;
}

// ─── SIMULATED RETRIEVAL (fallback when ENABLE_REAL_RAG !== 'true') ───

export function simulateRetrieval(query: string, config: RetrievalConfig): RetrievalChunk[] {
  const allDatasets = [...config.primaryDatasets, ...config.fallbackDatasets];
  const chunks: RetrievalChunk[] = [];
  const queryTerms = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  let idCounter = 0;
  for (const dsName of allDatasets) {
    const isPrimary = config.primaryDatasets.includes(dsName);
    const maxChunks = isPrimary ? config.maxChunksPerDataset : Math.floor(config.maxChunksPerDataset / 2);
    const docCount = getDatasetDocCount(dsName);

    // Empty datasets should not fabricate retrieval evidence.
    if (docCount === 0) continue;

    // Sparse datasets can still answer, but they should be scored conservatively.
    const populationFactor =
      docCount >= 10 ? 1 :
      docCount >= 5 ? 0.8 :
      docCount >= 3 ? 0.6 :
      0.35;

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
      // Strict: same dataset + same document
      const key = `${chunk.datasetName}:${chunk.documentName}`;
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

// ─── CONFIDENCE ASSESSMENT ───

export function getRetrievalConfidence(chunks: RetrievalChunk[]): {
  confidence: number;
  grade: 'high' | 'medium' | 'low' | 'insufficient';
  recommendation: string;
} {
  if (chunks.length === 0) return { confidence: 0, grade: 'insufficient', recommendation: 'Expand dataset scope or add more source URLs.' };

  const avgScore = chunks.reduce((s, c) => s + c.score, 0) / chunks.length;
  const maxScore = Math.max(...chunks.map(c => c.score));
  const fromPrimary = chunks.filter(c => c.metadata?.is_primary).length;

  let confidence = avgScore * 0.6 + maxScore * 0.3 + Math.min(fromPrimary / 3, 1) * 0.1;

  let grade: 'high' | 'medium' | 'low' | 'insufficient';
  if (confidence >= 0.75) grade = 'high';
  else if (confidence >= 0.55) grade = 'medium';
  else if (confidence >= 0.35) grade = 'low';
  else grade = 'insufficient';

  const recommendations: Record<string, string> = {
    high: 'Retrieval quality is excellent. Proceed with confidence.',
    medium: 'Adequate retrieval. Consider adding keyword-specific sources for improvement.',
    low: 'Below optimal threshold. Expand dataset scope or add more target URLs.',
    insufficient: 'Insufficient data. Trigger fallback or clarify with user.',
  };

  return { confidence: Math.round(confidence * 100) / 100, grade, recommendation: recommendations[grade] };
}

// ─── MAIN ORCHESTRATOR ───

export async function orchestrateRetrieval(
  query: string,
  intent: string = 'default',
  customConfig?: Partial<RetrievalConfig>,
): Promise<RetrievalResult> {
  const baseConfig = DEFAULT_CONFIGS[intent] || DEFAULT_CONFIGS.default;
  const config: RetrievalConfig = { ...baseConfig, ...customConfig };

  let chunks: RetrievalChunk[];
  if (USE_REAL_RAG) {
    console.log('[Retrieval] Real RAG enabled — calling Dify Dataset API');
    chunks = await realRetrieval(query, config);
  } else {
    console.warn('[Retrieval] Using simulated fallback — set ENABLE_REAL_RAG=true for real RAG');
    chunks = simulateRetrieval(query, config);
  }

  // 2. Check primary quality — trigger fallback if needed
  const primaryChunks = chunks.filter(c => c.metadata?.is_primary);
  const primaryAvgScore = primaryChunks.length > 0
    ? primaryChunks.reduce((s, c) => s + c.score, 0) / primaryChunks.length
    : 0;
  const fallbackTriggered = primaryAvgScore < config.minConfidenceForFallback && config.fallbackDatasets.length > 0;

  if (fallbackTriggered) {
    // Fallback chunks already included in simulateRetrieval
  }

  // 3. DEDUP
  const totalRetrieved = chunks.length;
  chunks = mergeAndDedup(chunks, config.dedupStrategy);
  const afterDedup = chunks.length;

  // 4. RERANK
  chunks = globalRerank(chunks, query);

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

  return {
    chunks,
    config,
    stats: {
      totalRetrieved, afterDedup, afterRerank: chunks.length,
      datasetsQueried: new Set(chunks.map(c => c.datasetName)).size,
      fallbackTriggered,
      confidence: Math.round(adjustedConfidence * 100) / 100,
      averageScore: chunks.length > 0 ? Math.round(chunks.reduce((s, c) => s + c.score, 0) / chunks.length * 1000) / 1000 : 0,
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

function getDatasetDocCount(datasetName: string): number {
  return DATASETS.find(ds => ds.name === datasetName)?.docCount ?? 0;
}
