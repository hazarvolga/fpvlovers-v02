import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { loadContentJobsNew, saveContentJobsNew } from '@/lib/content-automation/queue';
import { enqueueBestBriefs } from '@/lib/content-automation/brief-from-source';
import { enqueueRacingBriefs } from '@/lib/content-automation/racing-to-content';
import { generateContentViaDify } from '@/lib/content-automation/dify-generation';
import { publishGeneratedContentArtifact } from '@/lib/content-automation/publish-artifact';
import { firstWaveContentPlan } from '@/lib/content-plan';
import { authorizeCronRequest } from '@/lib/cron-auth';
import { getPublishedSlugs } from '@/lib/content-automation/content-reader';
import type { ContentJob } from '@/lib/content-automation/types';
import { logAutomationRun } from '@/lib/server/automation-runs-store';
import { readRacingIntelligenceStore } from '@/lib/racing-intelligence-store';

const LAST_RUN_FILE = path.join(process.cwd(), 'data', 'content-last-auto-run.json');
const MAX_AUTO_GENERATE_PER_RUN = 1;

function getBatchCount(req: Request): number {
  const url = new URL(req.url);
  const count = parseInt(url.searchParams.get('count') || url.searchParams.get('batch') || '1', 10);
  return Math.min(Math.max(1, Number.isFinite(count) ? count : 1), 10);
}

type LastRunPayload = {
  generated_at: string;
  action: string;
  count?: number;
  job?: {
    id: string;
    title: string;
    status: string;
    publishedPath?: string;
  };
  briefs?: Array<{ id: string; title: string }>;
  error?: string;
};

function writeLastRun(payload: Omit<LastRunPayload, 'generated_at'>): void {
  fs.writeFileSync(
    LAST_RUN_FILE,
    JSON.stringify({ generated_at: new Date().toISOString(), ...payload }, null, 2),
  );
}

function isDryRun(req: Request): boolean {
  const url = new URL(req.url);
  return url.searchParams.get('dry_run') === 'true' || url.searchParams.get('dryRun') === 'true';
}

function buildExistingSlugSet(jobs: ContentJob[]): Set<string> {
  const existing = new Set<string>();
  for (const job of jobs) {
    existing.add(job.briefSlug);
    if (job.seo.slug) existing.add(job.seo.slug);
  }
  for (const slug of getPublishedSlugs()) {
    existing.add(slug);
  }
  return existing;
}

export async function GET(req: Request) {
  const auth = authorizeCronRequest(req);
  if (!auth.authorized) return auth.response;

  try {
    const dryRun = isDryRun(req);
    const batchCount = getBatchCount(req);
    const jobs = await loadContentJobsNew();
    const existingSlugs = buildExistingSlugSet(jobs);

    // Process multiple queued jobs in batch
    const readyJobs = jobs.filter((j) => j.status === 'queued');
    const batch = readyJobs.slice(0, batchCount);
    const results: any[] = [];
    let batchError: string | null = null;

    for (const job of batch) {
      if (dryRun) {
        results.push({ job: { id: job.id, title: job.title }, action: 'would_generate' });
        continue;
      }

      if (!process.env.DIFY_APP_KEY?.trim()) {
        batchError = 'Workflow app key is not configured';
        break;
      }

      job.status = 'generating';
      job.updatedAt = new Date().toISOString();
      await saveContentJobsNew(jobs);

      try {
        const result = await generateContentViaDify({
          topic: job.topic,
          template: job.template,
          language: job.language,
          title: job.title,
          category: job.category,
          brief: {
            primaryKeyword: job.seo.keywords[0] || job.title,
            secondaryKeywords: job.seo.keywords.slice(1),
            summary: job.topic,
            outline: job.sourceHints,
          },
        });

        const latestJobs = await loadContentJobsNew();
        const index = latestJobs.findIndex((c) => c.id === job.id);
        if (index === -1) throw new Error('Job disappeared');

        const latestJob = latestJobs[index];
        if (!result.content) {
          latestJob.status = 'failed';
          latestJob.feedback = 'Workflow returned no publishable content.';
          latestJob.updatedAt = new Date().toISOString();
          await saveContentJobsNew(latestJobs);
          results.push({ job: { id: latestJob.id, title: latestJob.title }, action: 'failed' });
          continue;
        }

        latestJob.status = 'published';
        latestJob.updatedAt = new Date().toISOString();
        latestJob.publishedPath = await publishGeneratedContentArtifact(
          result.content.seo.slug || latestJob.seo.slug || latestJob.briefSlug,
          latestJob,
          result.content,
        );
        latestJobs[index] = latestJob;
        await saveContentJobsNew(latestJobs);
        results.push({
          job: { id: latestJob.id, title: latestJob.title, publishedPath: latestJob.publishedPath },
          action: 'published',
          workflowRunId: result.workflowRunId,
          totalTokens: result.totalTokens,
        });
      } catch (e: any) {
        job.status = 'failed';
        job.feedback = e.message;
        job.updatedAt = new Date().toISOString();
        await saveContentJobsNew(jobs);
        results.push({ job: { id: job.id, title: job.title }, action: 'failed', error: e.message });
      }
    }

    if (batch.length > 0) {
      writeLastRun({
        action: batch.length === 1 ? results[0]?.action : 'batch',
        count: results.filter((r) => r.action === 'published').length,
        briefs: results.map((r) => ({ id: r.job?.id, title: r.job?.title })),
      });

      return NextResponse.json({
        success: batchError ? false : true,
        action: batch.length > 1 ? 'batch_complete' : results[0]?.action,
        batch: { total: batch.length, published: results.filter((r) => r.action === 'published').length, failed: results.filter((r) => r.action === 'failed').length },
        results,
        queueRemaining: readyJobs.length - batch.length,
      });
    }

    // No queued jobs — enqueue new briefs
    const newBriefs = enqueueBestBriefs(firstWaveContentPlan, existingSlugs, MAX_AUTO_GENERATE_PER_RUN);

    // Also enqueue racing intelligence briefs
    let racingBriefs: ContentJob[] = [];
    try {
      const racingStore = readRacingIntelligenceStore();
      racingBriefs = enqueueRacingBriefs(racingStore.contentBriefs || [], 2);
      if (racingBriefs.length > 0) {
        for (const brief of racingBriefs) {
          existingSlugs.add(brief.briefSlug);
        }
      }
    } catch {
      // Racing store may not exist yet
    }

    if (newBriefs.length === 0 && racingBriefs.length === 0) {
      const briefJobs = jobs.filter((j) => j.status === 'brief');
      if (briefJobs.length > 0) {
        const brief = briefJobs[0];
        if (dryRun) {
          return NextResponse.json({
            success: true,
            dryRun: true,
            action: 'would_queue',
            job: { id: brief.id, title: brief.title, status: brief.status },
          });
        }

        brief.status = 'queued';
        brief.updatedAt = new Date().toISOString();
        await saveContentJobsNew(jobs);
        writeLastRun({
          action: 'queued',
          job: { id: brief.id, title: brief.title, status: brief.status },
        });

        // Log to database in background
        Promise.resolve().then(async () => {
          try {
            await logAutomationRun({
              kind: 'generate',
              status: 'queued',
              summary: { jobId: brief.id, title: brief.title }
            });
          } catch (dbErr) {
            console.warn('[DB Status Log] Failed to log generate queued brief run:', dbErr);
          }
        });

        return NextResponse.json({
          success: true,
          action: 'queued',
          job: { id: brief.id, title: brief.title },
          message: `Brief "${brief.title}" advanced to queued. Next cron run will trigger generation.`,
        });
      }

      // Log to database in background
      Promise.resolve().then(async () => {
        try {
          await logAutomationRun({
            kind: 'generate',
            status: 'noop',
            summary: { totalJobs: jobs.length, publishedJobs: jobs.filter((j) => j.status === 'published').length }
          });
        } catch (dbErr) {
          console.warn('[DB Status Log] Failed to log generate noop run:', dbErr);
        }
      });

      return NextResponse.json({
        success: true,
        action: 'noop',
        message: 'All content from the editorial plan has been enqueued. Nothing new to generate.',
        stats: { totalJobs: jobs.length, publishedJobs: jobs.filter((j) => j.status === 'published').length },
      });
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        action: 'would_enqueue',
        count: newBriefs.length,
        briefs: newBriefs.map((brief) => ({ id: brief.id, title: brief.title })),
      });
    }

    const allNewBriefs = [...newBriefs, ...racingBriefs];
    const draftJobs = await loadContentJobsNew();
    const combined = [...draftJobs.filter((j) => j.status !== 'queued'), ...allNewBriefs.map((b) => ({ ...b, status: 'queued' as const, updatedAt: new Date().toISOString() })), ...draftJobs.filter((j) => j.status === 'queued')];
    await saveContentJobsNew(combined);
    writeLastRun({
      action: 'enqueued',
      count: newBriefs.length + racingBriefs.length,
      briefs: allNewBriefs.map((brief) => ({ id: brief.id, title: brief.title })),
    });

    // Log to database in background
    Promise.resolve().then(async () => {
      try {
        await logAutomationRun({
          kind: 'generate',
          status: 'enqueued',
          summary: {
            count: newBriefs.length,
            briefs: newBriefs.map((brief) => ({ id: brief.id, title: brief.title }))
          }
        });
      } catch (dbErr) {
        console.warn('[DB Status Log] Failed to log generate enqueued run:', dbErr);
      }
    });

    return NextResponse.json({
      success: true,
      action: 'enqueued',
      count: newBriefs.length,
      briefs: newBriefs.map((brief) => ({ id: brief.id, title: brief.title })),
      message: `${newBriefs.length} new brief(s) enqueued. Next cron run will trigger generation.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown cron generate error';
    
    // Log to database in background
    Promise.resolve().then(async () => {
      try {
        await logAutomationRun({
          kind: 'generate',
          status: 'failed',
          errorMessage: message
        });
      } catch (dbErr) {
        console.warn('[DB Status Log] Failed to log generate error run:', dbErr);
      }
    });

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
