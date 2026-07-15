import { NextRequest, NextResponse } from 'next/server';
import { loadContentJobsNew, saveContentJobsNew } from '@/lib/content-automation/queue';
import { parseGeneratedContent } from '@/lib/content-automation/parse-generated-content';
import { publishGeneratedContentArtifact } from '@/lib/content-automation/publish-artifact';
import {
  PRODUCT_REVIEW_EDITOR,
  classifyEditorialContent,
  evaluatePublicationReadiness,
} from '@/lib/content-automation/editorial-governance';
import type {
  ContentJobStatus,
  EditorialReviewRecord,
  ProductRelationship,
  ReviewTestingMethod,
} from '@/lib/content-automation/types';
import { requireAdmin } from '@/lib/server/admin-auth-guard';

type TransitionMap = Record<ContentJobStatus, ContentJobStatus[]>;

const VALID_TRANSITIONS: TransitionMap = {
  'pending-approval': ['queued', 'failed'],
  brief: ['queued', 'failed'],
  queued: ['generating', 'failed'],
  generating: ['generated', 'failed'],
  generated: ['reviewed', 'failed'],
  reviewed: ['approved', 'failed'],
  approved: ['published', 'failed'],
  published: [],
  throttled: ['queued', 'failed'],
  failed: [],
};

const CONTENT_JOB_STATUSES = new Set<ContentJobStatus>([
  'pending-approval',
  'brief',
  'queued',
  'generating',
  'generated',
  'reviewed',
  'approved',
  'published',
  'throttled',
  'failed',
]);
const REVIEW_METHODS = new Set<ReviewTestingMethod>(['hands-on', 'spec-analysis']);
const PRODUCT_RELATIONSHIPS = new Set<ProductRelationship>(['purchased', 'supplied', 'loaned', 'none']);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function buildReviewRecord(
  value: unknown,
  now: string,
): { record: EditorialReviewRecord | null; error?: string } {
  const input = asRecord(value);
  if (!input) return { record: null, error: 'editorial review data is required' };
  if (input.editorName !== PRODUCT_REVIEW_EDITOR) {
    return { record: null, error: `editorName must be ${PRODUCT_REVIEW_EDITOR}` };
  }
  const testingMethod = input.testingMethod;
  if (typeof testingMethod !== 'string' || !REVIEW_METHODS.has(testingMethod as ReviewTestingMethod)) {
    return { record: null, error: 'testingMethod must be hands-on or spec-analysis' };
  }
  const productRelationship = input.productRelationship;
  if (typeof productRelationship !== 'string'
    || !PRODUCT_RELATIONSHIPS.has(productRelationship as ProductRelationship)) {
    return { record: null, error: 'productRelationship must be purchased, supplied, loaned, or none' };
  }

  return {
    record: {
      contentClass: 'product-review',
      approvalStatus: 'pending',
      editorName: PRODUCT_REVIEW_EDITOR,
      reviewedAt: now,
      testingMethod: testingMethod as ReviewTestingMethod,
      productRelationship: productRelationship as ProductRelationship,
      compensationReceived: input.compensationReceived === true,
      evidenceSources: asStringArray(input.evidenceSources),
      disclosure: typeof input.disclosure === 'string' ? input.disclosure.trim() : undefined,
    },
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const jobs = await loadContentJobsNew();
    const job = jobs.find((j) => j.id === id);

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, job });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown content job error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = asRecord(await req.json());
    const targetValue = body?.status;
    const target = typeof targetValue === 'string' && CONTENT_JOB_STATUSES.has(targetValue as ContentJobStatus)
      ? targetValue as ContentJobStatus
      : undefined;
    const feedback = typeof body?.feedback === 'string' ? body.feedback : undefined;

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

    const classification = classifyEditorialContent({
      category: job.category,
      template: job.template,
    });
    if (['reviewed', 'approved', 'published'].includes(target)
      && classification.contentClass !== 'product-review') {
      return NextResponse.json(
        { success: false, error: 'Only product reviews use the human editorial transition chain.' },
        { status: 409 },
      );
    }

    if (target === 'reviewed') {
      const parsed = buildReviewRecord(body?.editorial, now);
      if (!parsed.record) {
        return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
      }
      job.editorial = parsed.record;
    }

    if (target === 'approved') {
      if (job.editorial?.contentClass !== 'product-review') {
        return NextResponse.json(
          { success: false, error: 'Product review editorial record is missing.' },
          { status: 409 },
        );
      }
      const approvedRecord: EditorialReviewRecord = {
        ...job.editorial,
        approvalStatus: 'approved',
      };
      const decision = evaluatePublicationReadiness({
        classification,
        review: approvedRecord,
      });
      if (!decision.canPublish) {
        return NextResponse.json(
          { success: false, error: 'Product review is not publication-ready.', blockers: decision.blockers },
          { status: 409 },
        );
      }
      job.editorial = approvedRecord;
    }

    if (target === 'published') {
      if (job.editorial?.contentClass !== 'product-review') {
        return NextResponse.json(
          { success: false, error: 'Approved product review record is missing.' },
          { status: 409 },
        );
      }
      const decision = evaluatePublicationReadiness({ classification, review: job.editorial });
      if (!decision.canPublish) {
        return NextResponse.json(
          { success: false, error: 'Product review is not publication-ready.', blockers: decision.blockers },
          { status: 409 },
        );
      }
      const draft = job.draft
        ? parseGeneratedContent(JSON.stringify(job.draft))
        : null;
      if (!draft) {
        return NextResponse.json(
          { success: false, error: 'Product review draft is missing or invalid.' },
          { status: 409 },
        );
      }
      job.status = 'published';
      job.publishedPath = await publishGeneratedContentArtifact(
        draft.seo.slug || job.seo.slug || job.briefSlug,
        job,
        draft,
      );
    } else {
      job.status = target;
    }
    job.updatedAt = now;

    if (feedback) {
      job.feedback = feedback;
    }

    jobs[index] = job;
    await saveContentJobsNew(jobs);

    return NextResponse.json({ success: true, job });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown content job update error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
