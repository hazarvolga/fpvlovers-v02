import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { loadContentJobsNew, saveContentJobsNew } from '@/lib/content-automation/queue';
import { authorizeCronRequest } from '@/lib/cron-auth';
import { requireAdmin } from '@/lib/server/admin-auth-guard';
import { dispatchAgent } from '@/lib/agents';
import { logAutomationRun } from '@/lib/server/automation-runs-store';
import type { ContentJob, ContentTemplate } from '@/lib/content-automation/types';
import '@/lib/agents/ideationAgent'; // Ensure registered

type IdeationBrief = {
  briefSlug: string;
  title: string;
  category: string;
  template: ContentTemplate;
  topic: string;
  sourceHints: string[];
  seo: {
    slug: string;
    metaDescription: string;
    keywords: string[];
  };
};

const CONTENT_TEMPLATES = new Set<ContentTemplate>([
  'tech-article',
  'product-review',
  'build-guide',
  'comparison',
  'troubleshooting',
  'regulation-guide',
  'community-roundup',
]);

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function stringArrayValue(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map(stringValue).filter((item): item is string => Boolean(item))
    : [];
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function normalizeIdeationBrief(value: unknown): IdeationBrief | null {
  const source = objectValue(value);
  const seo = objectValue(source.seo);
  const briefSlug = stringValue(source.briefSlug) || stringValue(seo.slug);
  const title = stringValue(source.title);
  const topic = stringValue(source.topic);
  if (!briefSlug || !title || !topic) return null;

  const templateCandidate = stringValue(source.template);
  const template = templateCandidate && CONTENT_TEMPLATES.has(templateCandidate as ContentTemplate)
    ? templateCandidate as ContentTemplate
    : 'tech-article';

  return {
    briefSlug,
    title,
    category: stringValue(source.category) || 'Flight Guides',
    template,
    topic,
    sourceHints: stringArrayValue(source.sourceHints),
    seo: {
      slug: stringValue(seo.slug) || briefSlug,
      metaDescription: stringValue(seo.metaDescription) || topic,
      keywords: stringArrayValue(seo.keywords),
    },
  };
}

export async function GET(req: Request) {
  const auth = authorizeCronRequest(req);
  if (!auth.authorized) {
    const denied = await requireAdmin();
    if (denied) return denied;
  }

  try {
    const url = new URL(req.url);
    const count = parseInt(url.searchParams.get('count') || '10', 10);
    const dryRun = url.searchParams.get('dry_run') === 'true' || url.searchParams.get('dryRun') === 'true';

    // 1. Load existing content jobs to build duplicate prevention list
    const jobs = await loadContentJobsNew();
    const existingSlugs = new Set<string>();
    for (const job of jobs) {
      existingSlugs.add(job.briefSlug);
      if (job.seo?.slug) {
        existingSlugs.add(job.seo.slug);
      }
    }

    // 2. Dispatch Ideation Agent
    const dispatchResult = await dispatchAgent({
      agent: 'ideation',
      input: {
        existingSlugs: Array.from(existingSlugs),
        count
      }
    });

    if (dispatchResult.status === 'error') {
      throw new Error(dispatchResult.error || 'Ideation Agent failed without error message');
    }

    const output = objectValue(dispatchResult.output);
    const rawBriefs = Array.isArray(output.briefs)
      ? output.briefs
      : [];
    const briefs = rawBriefs
      .map(normalizeIdeationBrief)
      .filter((brief): brief is IdeationBrief => Boolean(brief));
    if (!Array.isArray(briefs) || briefs.length === 0) {
      return NextResponse.json({
        success: true,
        action: 'noop',
        message: 'Ideation Agent returned no new briefs.'
      });
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        action: 'would_enqueue',
        count: briefs.length,
        briefs
      });
    }

    // 3. Map briefs to ContentJobs with 'pending-approval' status
    const nowStr = new Date().toISOString();
    const newJobs: ContentJob[] = briefs
      .filter((b) => !existingSlugs.has(b.briefSlug))
      .map((b) => ({
        id: crypto.randomUUID(),
        briefSlug: b.briefSlug,
        title: b.title,
        category: b.category,
        status: 'pending-approval' as const,
        topic: b.topic,
        language: 'en' as const,
        template: b.template,
        promptVersion: 'v2',
        sourceHints: b.sourceHints,
        seo: {
          slug: b.seo.slug,
          metaDescription: b.seo.metaDescription,
          keywords: b.seo.keywords,
        },
        createdAt: nowStr,
        updatedAt: nowStr
      }));

    if (newJobs.length > 0) {
      // Add new ideas to the top/beginning of queue
      const combined = [...newJobs, ...jobs];
      await saveContentJobsNew(combined);
    }

    // Log automation run in background
    Promise.resolve().then(async () => {
      try {
        await logAutomationRun({
          kind: 'ideate',
          status: 'success',
          summary: {
            generatedCount: newJobs.length,
            briefs: newJobs.map(j => ({ id: j.id, title: j.title }))
          }
        });
      } catch (dbErr) {
        console.warn('[DB Status Log] Failed to log ideate success run:', dbErr);
      }
    });

    return NextResponse.json({
      success: true,
      action: 'enqueued',
      count: newJobs.length,
      briefs: newJobs.map(j => ({ id: j.id, title: j.title })),
      message: `${newJobs.length} new content ideas generated and enqueued with 'pending-approval' status.`
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown ideation cron error';

    // Log error in background
    Promise.resolve().then(async () => {
      try {
        await logAutomationRun({
          kind: 'ideate',
          status: 'failed',
          errorMessage: message
        });
      } catch (dbErr) {
        console.warn('[DB Status Log] Failed to log ideate error run:', dbErr);
      }
    });

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
