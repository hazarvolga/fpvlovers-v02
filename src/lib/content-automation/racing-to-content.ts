import { loadContentJobs, saveContentJobs } from './queue';
import type { ContentJob, ContentJobStatus, ContentTemplate } from './types';
import type { RacingContentBrief } from '@/lib/racing-intelligence';

const BRIEF_TEMPLATE_MAP: Record<string, ContentTemplate> = {
  'event-preview': 'tech-article',
  'result-recap': 'tech-article',
  'pilot-profile': 'tech-article',
  'league-update': 'tech-article',
  'calendar-update': 'community-roundup',
  'race-tech': 'tech-article',
};

const TARGET_PRIORITY = ['high', 'medium'] as const;
const MAX_AUTO_ENQUEUE = 3;

export function racingBriefToContentJob(brief: RacingContentBrief): ContentJob {
  const now = new Date().toISOString();
  const template = BRIEF_TEMPLATE_MAP[brief.contentType] || 'tech-article';

  return {
    id: `racing-${brief.slug}`,
    briefSlug: brief.slug,
    title: brief.title,
    category: 'Racing',
    status: 'brief' as ContentJobStatus,
    topic: brief.angle,
    language: 'en',
    template,
    promptVersion: 'v2',
    sourceHints: [brief.sourceUrl, brief.targetSection],
    seo: {
      slug: brief.slug,
      metaDescription: brief.angle.slice(0, 160),
      keywords: ['fpv racing', 'drone racing', brief.targetSection],
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function enqueueRacingBriefs(
  briefs: RacingContentBrief[],
  maxCount: number = MAX_AUTO_ENQUEUE,
): ContentJob[] {
  const jobs = loadContentJobs();
  const existingSlugs = new Set(
    jobs.flatMap((job) => [job.id, job.briefSlug, job.seo?.slug].filter(Boolean) as string[]),
  );
  const newJobs = selectRacingBriefJobs(briefs, existingSlugs, maxCount);

  if (newJobs.length > 0) {
    const now = new Date().toISOString();
    for (const job of newJobs) {
      job.status = 'queued';
      job.updatedAt = now;
      jobs.push(job);
    }
    saveContentJobs(jobs);
  }

  return newJobs;
}

export function selectRacingBriefJobs(
  briefs: RacingContentBrief[],
  existingSlugsOrIds: Set<string>,
  maxCount: number = MAX_AUTO_ENQUEUE,
): ContentJob[] {
  const eligible = briefs
    .filter((brief) => TARGET_PRIORITY.includes(brief.priority as typeof TARGET_PRIORITY[number]))
    .filter((brief) => {
      const jobId = `racing-${brief.slug}`;
      return !existingSlugsOrIds.has(brief.slug) && !existingSlugsOrIds.has(jobId);
    })
    .slice(0, maxCount);

  return eligible.map(racingBriefToContentJob);
}
