import fs from 'node:fs';
import path from 'node:path';
import type { SocialJob } from '@/lib/social/types';

const STORE_PATH = path.join(process.cwd(), 'data', 'social-jobs.json');

export function readSocialJobs(): SocialJob[] {
  try {
    if (!fs.existsSync(STORE_PATH)) return [];
    const parsed: unknown = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    return Array.isArray(parsed) ? parsed as SocialJob[] : [];
  } catch {
    return [];
  }
}

export function upsertSocialJob(job: SocialJob): SocialJob[] {
  const jobs = readSocialJobs();
  const index = jobs.findIndex((existing) => existing.id === job.id);
  if (index >= 0) jobs[index] = job;
  else jobs.unshift(job);
  const temporary = `${STORE_PATH}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(jobs, null, 2)}\n`, 'utf8');
  fs.renameSync(temporary, STORE_PATH);
  return jobs;
}
