import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { loadContentJobs, saveContentJobs } from '@/lib/content-automation/queue';
import { enqueueBestBriefs } from '@/lib/content-automation/brief-from-source';
import { firstWaveContentPlan } from '@/lib/content-plan';
import { authorizeCronRequest } from '@/lib/cron-auth';

const LAST_RUN_FILE = path.join(process.cwd(), 'data', 'content-last-auto-run.json');
const MAX_AUTO_GENERATE_PER_RUN = 1;

export async function GET(req: Request) {
  const auth = authorizeCronRequest(req);
  if (!auth.authorized) return auth.response;

  try {
    const jobs = loadContentJobs();
    const existingSlugs = new Set(jobs.map((j) => j.briefSlug));

    // Find jobs ready for generation
    const readyJobs = jobs.filter((j) => j.status === 'queued');

    if (readyJobs.length > 0) {
      // Generate the first queued job
      const job = readyJobs[0];
      job.status = 'generating';
      job.updatedAt = new Date().toISOString();
      saveContentJobs(jobs);

      return NextResponse.json({
        success: true,
        action: 'generating',
        job: { id: job.id, title: job.title, status: 'generating' },
        message: `Started generation for "${job.title}". Content will appear in Content Jobs → Generated when complete.`,
      });
    }

    // No queued jobs — enqueue new briefs from content plan
    const newBriefs = enqueueBestBriefs(firstWaveContentPlan, existingSlugs, MAX_AUTO_GENERATE_PER_RUN);

    if (newBriefs.length === 0) {
      // Check for already enqueued but not yet queued jobs
      const briefJobs = jobs.filter((j) => j.status === 'brief');
      if (briefJobs.length > 0) {
        const brief = briefJobs[0];
        brief.status = 'queued';
        brief.updatedAt = new Date().toISOString();
        saveContentJobs(jobs);

        return NextResponse.json({
          success: true,
          action: 'queued',
          job: { id: brief.id, title: brief.title },
          message: `Brief "${brief.title}" advanced to queued. Next cron run will trigger generation.`,
        });
      }

      return NextResponse.json({
        success: true,
        action: 'noop',
        message: 'All content from the editorial plan has been enqueued. Nothing new to generate.',
        stats: { totalJobs: jobs.length, publishedJobs: jobs.filter((j) => j.status === 'published').length },
      });
    }

    // New briefs created — mark them as queued for next run
    const allJobs = loadContentJobs();
    for (const brief of newBriefs) {
      brief.status = 'queued';
      brief.updatedAt = new Date().toISOString();
    }
    saveContentJobs(allJobs);

    fs.writeFileSync(
      LAST_RUN_FILE,
      JSON.stringify({
        generated_at: new Date().toISOString(),
        action: 'enqueued',
        count: newBriefs.length,
        briefs: newBriefs.map((b) => ({ id: b.id, title: b.title })),
      }, null, 2),
    );

    return NextResponse.json({
      success: true,
      action: 'enqueued',
      count: newBriefs.length,
      briefs: newBriefs.map((b) => ({ title: b.title })),
      message: `${newBriefs.length} new brief(s) enqueued. Next cron run will trigger generation.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown cron generate error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
