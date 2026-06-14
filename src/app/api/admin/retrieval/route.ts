import { NextRequest, NextResponse } from 'next/server';
import { getOptionalEnv } from '@/lib/env';
import { orchestrateRetrieval } from '@/lib/retrieval-orchestrator';
import { requireAdmin } from '@/lib/server/admin-auth-guard';

const BASE = getOptionalEnv('DIFY_BASE_URL', 'https://dify.affexai.tr/v1');

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { query, datasetId } = await req.json();
    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

    const targetId = datasetId || 'd1d5e44b-4dde-445a-a686-67a1cc0d926c'; // default flight-tuning

    // Local fallback: keep the admin smoke path useful even if Dify app auth is unavailable.
    const appKey = getOptionalEnv('DIFY_APP_KEY', '');
    if (!appKey) {
      const fallback = await orchestrateRetrieval(query, 'default');
      return NextResponse.json({
        query,
        answer: `Local retrieval fallback: ${fallback.stats.confidence >= 0.75 ? 'high confidence' : fallback.stats.confidence >= 0.55 ? 'medium confidence' : 'low confidence'}`,
        retrieverResources: fallback.chunks.slice(0, 5).map((c: any) => ({
          datasetName: c.datasetName,
          documentName: c.documentName,
          content: c.content.slice(0, 200),
          score: c.score,
        })),
        confidence: fallback.stats.confidence,
        fallback: true,
      });
    }

    const resp = await fetch(`${BASE}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${appKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        response_mode: 'blocking',
        user: 'admin-retrieval-test',
        inputs: {},
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => 'Unknown error');
      if (resp.status === 401 || resp.status === 403) {
        const fallback = await orchestrateRetrieval(query, 'default');
        return NextResponse.json({
          query,
          answer: `Local retrieval fallback after gateway auth failure (${resp.status})`,
          retrieverResources: fallback.chunks.slice(0, 5).map((c: any) => ({
            datasetName: c.datasetName,
            documentName: c.documentName,
            content: c.content.slice(0, 200),
            score: c.score,
          })),
          confidence: fallback.stats.confidence,
          fallback: true,
          difyError: errText.slice(0, 300),
        });
      }
      return NextResponse.json({
        error: `Chat API ${resp.status}`,
        detail: errText.slice(0, 300),
        hint: 'Embedding API rate limit may be exhausted (429). Try again later.',
      }, { status: 502 });
    }

    const data = await resp.json();

    return NextResponse.json({
      query,
      answer: data.answer?.slice(0, 500) || '(no answer)',
      retrieverResources: (data.metadata?.retriever_resources || []).slice(0, 5).map((r: any) => ({
        datasetName: r.dataset_name || '-',
        documentName: r.document_name || '-',
        content: (r.content || '').slice(0, 200),
        score: r.score || 0,
      })),
      conversationId: data.conversation_id,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
