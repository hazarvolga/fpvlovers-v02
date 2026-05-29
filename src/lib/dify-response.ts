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
