import { NextRequest, NextResponse } from 'next/server';

const BASE = process.env.DIFY_BASE_URL || 'https://dify.affexai.tr/v1';
const KEY = process.env.DIFY_API_KEY || 'dataset-57xGhkCvaQKR2YoSljA94NVu';

export async function POST(req: NextRequest) {
  try {
    const { query, datasetId } = await req.json();
    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

    const targetId = datasetId || 'd1d5e44b-4dde-445a-a686-67a1cc0d926c'; // default flight-tuning

    // Use Dify chat API with FPV Expert app to test retrieval
    const appKey = process.env.DIFY_APP_KEY || 'app-C7zocan03yFGIbGtJCQG0iUs';

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
