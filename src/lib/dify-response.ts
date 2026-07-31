function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

export function stripDifyReasoningBlocks(value: string): string {
  return value
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim();
}

export type DifyCitation = {
  title: string;
  score: number;
  datasetName?: string;
};

export function extractDifyCitations(value: unknown): DifyCitation[] {
  const data = asRecord(value);
  const nestedData = asRecord(data?.data);
  const resources = data?.retriever_resources ?? nestedData?.retriever_resources;
  if (!Array.isArray(resources)) return [];
  const results: DifyCitation[] = [];
  for (const r of resources) {
    const rec = asRecord(r);
    if (!rec) continue;
    const title = asString(rec.document_name) ?? asString(rec.title) ?? 'Unknown source';
    const score = typeof rec.score === 'number' ? rec.score : 0;
    const datasetName = asString(rec.dataset_name) ?? asString(rec.segment_id);
    results.push({ title, score, ...(datasetName ? { datasetName } : {}) });
  }
  return results;
}

export function extractDifyMarkdown(value: unknown): string | undefined {
  const data = asRecord(value);
  const nestedData = asRecord(data?.data);
  const outputs = asRecord(data?.outputs) ?? asRecord(nestedData?.outputs);

  const answer = asString(data?.answer)
    ?? asString(nestedData?.answer)
    ?? asString(outputs?.answer)
    ?? asString(outputs?.markdown)
    ?? asString(outputs?.result);

  return answer ? stripDifyReasoningBlocks(answer) : undefined;
}
