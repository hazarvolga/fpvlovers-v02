// Shared RAG grounding layer for user-facing tool routes (Part Matcher, Blackbox
// Tuning, Build Wizard, Flight Critic). Wraps retrieval-orchestrator's multi-dataset
// merge/dedup/rerank so every tool gets the same pre-fetch grounding context, source
// list, and trust signal instead of calling Dify blind.

import {
  getRetrievalConfidence,
  orchestrateRetrieval,
  RETRIEVAL_GROUNDING_TIMEOUT_MS,
  type RetrievalChunk,
} from '@/lib/retrieval-orchestrator';

export type RetrievalGrade = 'high' | 'medium' | 'low' | 'insufficient';

export type GroundingSource = {
  title: string;
  url?: string;
  dataset: string;
  score: number;
};

export type GroundingContext = {
  /** Ready-to-inject Markdown block describing the retrieved context (or its absence). */
  contextBlock: string;
  sources: GroundingSource[];
  /** 0-100 */
  confidence: number;
  grade: RetrievalGrade;
  recommendation: string;
};

const NO_CONTEXT_NOTICE = 'No verified RAG context was retrieved for this query. Do not generate new technical recommendations or factual claims from general model knowledge. Return only deterministic local checks, state that verified-source guidance is unavailable, and ask for a retry or additional evidence.';

function docMetadataValue(doc_metadata: unknown, key: string): string | undefined {
  if (!doc_metadata) return undefined;
  if (Array.isArray(doc_metadata)) {
    const match = doc_metadata.find((entry) => entry && typeof entry === 'object' && (entry as Record<string, unknown>).name === key);
    const value = match ? (match as Record<string, unknown>).value : undefined;
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }
  if (typeof doc_metadata === 'object') {
    const value = (doc_metadata as Record<string, unknown>)[key];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }
  return undefined;
}

function sourceUrlFromChunk(chunk: RetrievalChunk): string | undefined {
  return docMetadataValue(chunk.metadata?.doc_metadata, 'source_url');
}

function chunksToSources(chunks: RetrievalChunk[]): GroundingSource[] {
  return chunks.map((chunk) => ({
    title: chunk.documentName,
    url: sourceUrlFromChunk(chunk),
    dataset: chunk.datasetName,
    score: Math.round(chunk.score * 100) / 100,
  }));
}

function chunksToContextBlock(chunks: RetrievalChunk[]): string {
  if (!chunks.length) return NO_CONTEXT_NOTICE;

  return chunks
    .map((chunk, i) => {
      const url = sourceUrlFromChunk(chunk);
      const header = `[Source ${i + 1}] ${chunk.documentName}${url ? ` (${url})` : ''} — dataset: ${chunk.datasetName}, relevance: ${chunk.score.toFixed(2)}`;
      return `${header}\n${chunk.content.slice(0, 1500)}`;
    })
    .join('\n\n');
}

function emptyContext(recommendation: string): GroundingContext {
  return {
    contextBlock: NO_CONTEXT_NOTICE,
    sources: [],
    confidence: 0,
    grade: 'insufficient',
    recommendation,
  };
}

/**
 * Pre-fetches grounding context for a tool query via the full retrieval orchestrator
 * (multi-dataset merge + dedup + rerank), then filters out simulated/fake chunks —
 * a user-facing tool must never cite Math.random()-generated placeholder content as
 * a real source. If ENABLE_REAL_RAG is off or retrieval fails, this safely degrades
 * to an empty, explicitly-labeled context rather than hallucinated grounding.
 */
export async function getGroundingContext(query: string, intent: string): Promise<GroundingContext> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<null>((resolve) => {
      timeoutHandle = setTimeout(() => resolve(null), RETRIEVAL_GROUNDING_TIMEOUT_MS);
    });
    const retrieval = await Promise.race([orchestrateRetrieval(query, intent), timeout]);

    if (!retrieval) {
      return emptyContext('Retrieval timed out; verified-source guidance is unavailable.');
    }

    const realChunks = retrieval.chunks.filter((chunk) => !chunk.metadata?.simulation);
    if (!realChunks.length) {
      return emptyContext(
        retrieval.chunks.length > 0
          ? 'Only simulated retrieval was available; verified-source guidance is unavailable.'
          : 'No matching verified sources were found; source-dependent guidance is unavailable.',
      );
    }

    const confidenceInfo = getRetrievalConfidence(realChunks);

    return {
      contextBlock: chunksToContextBlock(realChunks),
      sources: chunksToSources(realChunks),
      confidence: Math.round(confidenceInfo.confidence * 100),
      grade: confidenceInfo.grade,
      recommendation: confidenceInfo.recommendation,
    };
  } catch (error) {
    console.error('[retrieval-grounding] getGroundingContext failed:', error instanceof Error ? error.message : error);
    return emptyContext('Retrieval failed; verified-source guidance is unavailable.');
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}
