import { NextResponse } from 'next/server';

const BASE = process.env.DIFY_BASE_URL || 'https://dify.affexai.tr/v1';
const KEY = process.env.DIFY_API_KEY || 'dataset-57xGhkCvaQKR2YoSljA94NVu';

type LogEntry = {
  id: string;
  name: string;
  dataset: string;
  status: string;
  tokens: number;
  createdAt: string;
  sourceUrl: string;
  error: string;
};

export async function GET() {
  try {
    const resp = await fetch(`${BASE}/datasets?limit=50`, {
      headers: { Authorization: `Bearer ${KEY}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) return NextResponse.json({ error: `Dify API ${resp.status}` }, { status: 502 });

    const { data: datasets } = await resp.json() as { data: any[] };
    const fpv = (datasets || []).filter((d: any) => d.name?.startsWith('fpv-'));
    const logs: LogEntry[] = [];

    for (const ds of fpv.slice(0, 9)) {
      const docResp = await fetch(`${BASE}/datasets/${ds.id}/documents?limit=10`, {
        headers: { Authorization: `Bearer ${KEY}` },
        signal: AbortSignal.timeout(8000),
      });
      if (!docResp.ok) continue;

      const docs = await docResp.json() as any;
      for (const doc of docs.data || []) {
        logs.push({
          id: doc.id,
          name: doc.name?.slice(0, 20) || '-',
          dataset: ds.name,
          status: doc.indexing_status || 'unknown',
          tokens: doc.tokens || 0,
          createdAt: doc.created_at ? new Date(doc.created_at * 1000).toISOString() : '-',
          sourceUrl: doc.doc_metadata?.source_url || '-',
          error: doc.error?.slice(0, 100) || '',
        });
      }
    }

    logs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return NextResponse.json({ logs: logs.slice(0, 50), total: logs.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
