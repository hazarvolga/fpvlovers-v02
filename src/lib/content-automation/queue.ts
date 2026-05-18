import fs from 'fs';
import path from 'path';
import type { ContentJob } from './types';

const QUEUE_FILE = path.join(process.cwd(), 'data', 'content-jobs.json');

export function loadContentJobs(): ContentJob[] {
  try {
    const raw = fs.readFileSync(QUEUE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveContentJobs(jobs: ContentJob[]): void {
  const dir = path.dirname(QUEUE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const sorted = [...jobs].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
}

export function enqueueContentJob(job: ContentJob): ContentJob[] {
  const jobs = loadContentJobs();
  if (jobs.some((j) => j.id === job.id)) return jobs;
  const now = new Date().toISOString();
  const enriched: ContentJob = {
    ...job,
    status: job.status || 'brief',
    createdAt: job.createdAt || now,
    updatedAt: now,
  };
  jobs.push(enriched);
  saveContentJobs(jobs);
  return jobs;
}
