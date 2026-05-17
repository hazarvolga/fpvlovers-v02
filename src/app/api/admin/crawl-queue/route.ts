import { NextRequest, NextResponse } from 'next/server';
import { enqueueUrls, getQueueStatus, updateJob, clearQueue, getNextBatch } from '@/lib/crawl-queue';

export async function GET() {
  return NextResponse.json(getQueueStatus());
}

export async function POST(req: NextRequest) {
  const { action, urls, dataset, jobId, status } = await req.json();

  if (action === 'enqueue') {
    if (!urls?.length) return NextResponse.json({ error: 'No URLs' }, { status: 400 });
    const jobs = enqueueUrls(urls, dataset);
    return NextResponse.json({ enqueued: jobs.length, jobs, queue: getQueueStatus() });
  }

  if (action === 'update') {
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 });
    updateJob(jobId, { status });
    return NextResponse.json({ updated: jobId, queue: getQueueStatus() });
  }

  if (action === 'clear') {
    clearQueue();
    return NextResponse.json({ cleared: true });
  }

  if (action === 'next-batch') {
    const batch = getNextBatch();
    return NextResponse.json({ batch, count: batch.length });
  }

  return NextResponse.json({ error: 'Invalid action. Use: enqueue, update, clear, next-batch' }, { status: 400 });
}
