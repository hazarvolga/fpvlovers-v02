import type { ContentJob } from './types';

type ExistingKeyOptions = {
  includeFailedJobs?: boolean;
};

function addJobKeys(keys: Set<string>, job: ContentJob): void {
  keys.add(job.id);
  keys.add(job.briefSlug);
  if (job.seo.slug) keys.add(job.seo.slug);
}

export function buildBlockingJobKeySet(
  jobs: ContentJob[],
  options: ExistingKeyOptions = {},
): Set<string> {
  const keys = new Set<string>();

  for (const job of jobs) {
    if (job.status === 'failed' && !options.includeFailedJobs) continue;
    addJobKeys(keys, job);
  }

  return keys;
}

export function removeJobsSupersededByIncomingBriefs(
  jobs: ContentJob[],
  incomingBriefs: ContentJob[],
): ContentJob[] {
  if (incomingBriefs.length === 0) return jobs;

  const incomingKeys = buildBlockingJobKeySet(incomingBriefs, { includeFailedJobs: true });
  return jobs.filter((job) => (
    !incomingKeys.has(job.id)
    && !incomingKeys.has(job.briefSlug)
    && !incomingKeys.has(job.seo.slug)
  ));
}
