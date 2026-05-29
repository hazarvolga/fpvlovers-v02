import { NextRequest, NextResponse } from 'next/server';
import { enqueueUrls } from '@/lib/crawl-queue';
import { getCrawlerCatalogSummary } from '@/lib/tools/crawler-product-catalog';
import { groupProductSourcesByDataset, readProductSourcePack } from '@/lib/tools/product-source-pack';

export async function GET() {
  const pack = readProductSourcePack();
  const pending = pack.sources.filter((source) => source.status === 'pending');

  return NextResponse.json({
    pack,
    pending: pending.length,
    grouped: groupProductSourcesByDataset(pending),
    catalog: getCrawlerCatalogSummary(),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const action = typeof body.action === 'string' ? body.action : 'enqueue';
  if (action !== 'enqueue') {
    return NextResponse.json({ error: 'Invalid action. Use enqueue.' }, { status: 400 });
  }

  const pack = readProductSourcePack();
  const pending = pack.sources.filter((source) => source.status === 'pending');
  const grouped = groupProductSourcesByDataset(pending);
  let enqueued = 0;

  for (const [dataset, sources] of Object.entries(grouped)) {
    enqueued += enqueueUrls(sources.map((source) => source.url), dataset).length;
  }

  return NextResponse.json({
    enqueued,
    grouped,
    catalog: getCrawlerCatalogSummary(),
  });
}
