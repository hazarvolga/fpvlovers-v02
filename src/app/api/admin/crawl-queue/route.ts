import { NextRequest, NextResponse } from 'next/server';
import {
  enqueueUrlsNew,
  getQueueStatusNew,
  updateJobNew,
  clearQueueNew,
  getNextBatchNew
} from '@/lib/crawl-queue';

export async function GET() {
  return NextResponse.json(await getQueueStatusNew());
}

export async function POST(req: NextRequest) {
  const { action, urls, dataset, jobId, status } = await req.json();

  if (action === 'enqueue') {
    if (!urls?.length) return NextResponse.json({ error: 'No URLs' }, { status: 400 });
    const jobs = await enqueueUrlsNew(urls, dataset);
    return NextResponse.json({ enqueued: jobs.length, jobs, queue: await getQueueStatusNew() });
  }

  if (action === 'update') {
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 });
    await updateJobNew(jobId, { status });
    return NextResponse.json({ updated: jobId, queue: await getQueueStatusNew() });
  }

  if (action === 'clear') {
    await clearQueueNew();
    return NextResponse.json({ cleared: true });
  }

  if (action === 'next-batch') {
    const batch = await getNextBatchNew();
    return NextResponse.json({ batch, count: batch.length });
  }

  return NextResponse.json({ error: 'Invalid action. Use: enqueue, update, clear, next-batch' }, { status: 400 });
}

