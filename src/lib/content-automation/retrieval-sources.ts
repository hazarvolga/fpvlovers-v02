export type RetrievalSource = { dataset: string; source: string; score: number };

type RetrievalItem = {
  metadata?: {
    dataset_name?: unknown;
    score?: unknown;
    doc_metadata?: { source_url?: unknown };
  };
};

const MAX_SOURCES = 8;

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/**
 * Turns the workflow's knowledge-retrieval result into verifiable source
 * records. Only documents that carry a real source URL count, and the first
 * (highest-scoring as returned) hit per URL is kept.
 */
export function extractRetrievalSources(raw: unknown): RetrievalSource[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const sources: RetrievalSource[] = [];

  for (const item of raw as RetrievalItem[]) {
    const metadata = item && typeof item === 'object' ? item.metadata : undefined;
    const url = metadata?.doc_metadata?.source_url;
    if (!isHttpUrl(url) || seen.has(url)) continue;
    seen.add(url);
    sources.push({
      dataset: typeof metadata?.dataset_name === 'string' ? metadata.dataset_name : 'unknown',
      source: url,
      score: typeof metadata?.score === 'number' ? metadata.score : 0,
    });
    if (sources.length >= MAX_SOURCES) break;
  }
  return sources;
}
