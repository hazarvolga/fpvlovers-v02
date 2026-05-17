// Dify Live Caller — orchestrator-aware, rate-limit safe
// lib/dify-client.ts üstünde çalışır; doğrudan fetch YAPMAZ.

import { difyRequest } from '@/lib/dify-client';

export interface DifyCallInput {
  appToken: string;
  appName: string;
  query: string;
  intent: string;
  context?: Record<string, unknown>;
}

export interface DifyCallResult {
  answer: string;
  tokens_used?: number;
  latency_ms?: number;
  error?: string;
}

export async function callDifyForIntent(input: DifyCallInput): Promise<DifyCallResult> {
  const start = Date.now();

  const resp = await difyRequest('/chat-messages', {
    method: 'POST',
    apiKey: input.appToken,
    body: {
      query: input.query,
      response_mode: 'blocking',
      user: 'master-orchestrator',
      inputs: { intent: input.intent },
    },
  });

  const latency_ms = Date.now() - start;

  if (!resp.ok || resp.status === 'throttled' || resp.status === 'budget_exceeded') {
    return {
      answer: resp.status === 'dry_run'
        ? '[Dry-run modu aktif — gerçek Dify çağrısı yapılmadı]'
        : `[Dify yanıt hatası: ${resp.error ?? resp.status}]`,
      error: resp.error ?? resp.status,
      latency_ms,
    };
  }

  const answer: string = (resp.data as { answer?: string })?.answer ?? '[Yanıt alınamadı]';
  const tokens_used: number | undefined = resp.tokens;

  return { answer, tokens_used, latency_ms };
}
