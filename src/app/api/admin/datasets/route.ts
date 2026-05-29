import { NextResponse } from 'next/server';
import { getOptionalEnv, getRequiredEnv } from '@/lib/env';

const BASE = getOptionalEnv('DIFY_BASE_URL', 'https://dify.affexai.tr/v1');

type DatasetStats = {
  id: string;
  name: string;
  description: string;
  docCount: number;
  completed: number;
  errors: number;
  tokens: number;
  embeddingModel: string;
  chunkSize: string;
  scoreThreshold: string;
};

export async function GET() {
  try {
    const key = getRequiredEnv('DIFY_API_KEY');
    const resp = await fetch(`${BASE}/datasets?limit=50`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      return NextResponse.json({ error: `Workflow API ${resp.status}` }, { status: 502 });
    }

    const { data: datasets } = await resp.json() as { data: any[] };
    const fpv = (datasets || []).filter((d: any) => d.name?.startsWith('fpv-'));

    const stats: DatasetStats[] = [];

    for (const ds of fpv) {
      let docCount = 0;
      let completed = 0;
      let errors = 0;
      let tokens = 0;

      try {
        const docResp = await fetch(`${BASE}/datasets/${ds.id}/documents?limit=100`, {
          headers: { Authorization: `Bearer ${key}` },
          signal: AbortSignal.timeout(8000),
        });
        if (docResp.ok) {
          const docs = await docResp.json() as any;
          const docList = docs.data || [];
          docCount = docList.length;
          for (const d of docList) {
            if (d.indexing_status === 'completed') completed++;
            if (d.indexing_status === 'error') errors++;
            tokens += d.tokens || 0;
          }
        }
      } catch {}

      stats.push({
        id: ds.id,
        name: ds.name,
        description: (ds.description || '').slice(0, 80),
        docCount,
        completed,
        errors,
        tokens,
        embeddingModel: ds.embedding_model || 'gemini-embedding-001',
        chunkSize: ds.retrieval_model?.weights ? 'custom' : 'default',
        scoreThreshold: ds.retrieval_model?.score_threshold || '-',
      });
    }

    return NextResponse.json({ datasets: stats, total: fpv.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
