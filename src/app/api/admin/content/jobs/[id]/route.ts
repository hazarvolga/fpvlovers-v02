import { NextRequest, NextResponse } from 'next/server';
import { loadContentJobsNew, saveContentJobsNew } from '@/lib/content-automation/queue';
import type { ContentJobStatus } from '@/lib/content-automation/types';

type TransitionMap = Record<ContentJobStatus, ContentJobStatus[]>;

const VALID_TRANSITIONS: TransitionMap = {
  brief: ['queued', 'failed'],
  queued: ['generating', 'failed'],
  generating: ['generated', 'failed'],
  generated: ['reviewed', 'failed'],
  reviewed: ['approved', 'failed'],
  approved: ['published', 'failed'],
  published: [],
  failed: [],
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const jobs = await loadContentJobsNew();
    const job = jobs.find((j) => j.id === id);

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, job });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const target: ContentJobStatus | undefined = body.status;
    const feedback: string | undefined = body.feedback;

    if (!target) {
      return NextResponse.json(
        { success: false, error: 'status field is required' },
        { status: 400 },
      );
    }

    const jobs = await loadContentJobsNew();
    const index = jobs.findIndex((j) => j.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const job = jobs[index];
    const allowed = VALID_TRANSITIONS[job.status];

    if (!allowed || allowed.length === 0) {
      return NextResponse.json(
        { success: false, error: `Job is already ${job.status} — no further transitions allowed` },
        { status: 409 },
      );
    }

    if (!allowed.includes(target)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot transition from "${job.status}" to "${target}". Allowed: ${allowed.join(', ')}`,
        },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    job.status = target;
    job.updatedAt = now;

    if (feedback) {
      (job as any).feedback = feedback;
    }

    jobs[index] = job;
    await saveContentJobsNew(jobs);

    return NextResponse.json({ success: true, job });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
