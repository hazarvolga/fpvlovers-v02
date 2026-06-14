import { NextRequest, NextResponse } from 'next/server';
import { enqueueUrls, getQueueStatus } from '@/lib/crawl-queue';
import { getCrawlerCatalogSummary } from '@/lib/tools/crawler-product-catalog';
import {
  applyQueueStatusToProductSourcePack,
  getProductSourceStatusCounts,
  groupProductSourcesByDataset,
  readProductSourcePack,
} from '@/lib/tools/product-source-pack';
import { requireAdmin } from '@/lib/server/admin-auth-guard';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const queue = getQueueStatus();
  const pack = applyQueueStatusToProductSourcePack(readProductSourcePack(), queue.jobs);
  const pending = pack.sources.filter((source) => source.status === 'pending');

  return NextResponse.json({
    pack,
    pending: pending.length,
    statusCounts: getProductSourceStatusCounts(pack.sources),
    grouped: groupProductSourcesByDataset(pending),
    catalog: getCrawlerCatalogSummary(),
    queue: queue.stats,
  });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const action = typeof body.action === 'string' ? body.action : 'enqueue';
  if (action !== 'enqueue') {
    return NextResponse.json({ error: 'Invalid action. Use enqueue.' }, { status: 400 });
  }

  const queueBefore = getQueueStatus();
  const pack = applyQueueStatusToProductSourcePack(readProductSourcePack(), queueBefore.jobs);
  const pending = pack.sources.filter((source) => source.status === 'pending');
  const grouped = groupProductSourcesByDataset(pending);
  let enqueued = 0;

  for (const [dataset, sources] of Object.entries(grouped)) {
    enqueued += enqueueUrls(sources.map((source) => source.url), dataset).length;
  }

  const queue = getQueueStatus();
  const updatedPack = applyQueueStatusToProductSourcePack(readProductSourcePack(), queue.jobs);

  return NextResponse.json({
    enqueued,
    grouped,
    pack: updatedPack,
    pending: updatedPack.sources.filter((source) => source.status === 'pending').length,
    statusCounts: getProductSourceStatusCounts(updatedPack.sources),
    catalog: getCrawlerCatalogSummary(),
    queue: queue.stats,
  });
}
