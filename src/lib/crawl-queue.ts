import fs from 'fs';
import path from 'path';
import { safeReadJson } from '@/lib/utils/json';
import {
  enqueueUrlsAsync,
  getNextBatchAsync,
  updateJobAsync,
  getQueueStatusAsync,
  clearQueueAsync
} from './server/crawl-queue-store';

const QUEUE_FILE = path.join(process.cwd(), 'data', 'crawl-queue.json');

// ─── TYPES ───

export interface CrawlJob {
  id: string;
  url: string;
  dataset?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'throttled';
  priority: number;
  retries: number;
  maxRetries: number;
  error?: string;
  tokens?: number;
  docId?: string;
  createdAt: string;
  updatedAt: string;
  nextRetryAt?: string;
}

export interface CrawlQueue {
  jobs: CrawlJob[];
  config: {
    batchSize: number;
    batchDelayMs: number;
    maxConcurrent: number;
    retryDelaysMs: number[];
  };
  stats: {
    total: number;
    pending: number;
    completed: number;
    failed: number;
    throttled: number;
  };
}

// ─── SYNCHRONOUS BACKWARD COMPATIBILITY APIs (Files Only) ───

function calculateStats(jobs: CrawlJob[]): CrawlQueue['stats'] {
  return {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    throttled: jobs.filter(j => j.status === 'throttled').length,
  };
}

function load(): CrawlQueue {
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      const queue = safeReadJson<any>(QUEUE_FILE, null) as CrawlQueue;
      return {
        ...queue,
        stats: calculateStats(queue.jobs || []),
      };
    }
  } catch (err: unknown) {
    console.error('[CrawlQueue] Error loading queue:', err instanceof Error ? err.message : String(err));
  }
  return {
    jobs: [], config: {
      batchSize: 3, batchDelayMs: 60000,
      maxConcurrent: 1,
      retryDelaysMs: [60000, 300000, 900000],
    }, stats: { total: 0, pending: 0, completed: 0, failed: 0, throttled: 0 },
  };
}

function save(q: CrawlQueue) {
  q.stats = calculateStats(q.jobs);
  try { fs.writeFileSync(QUEUE_FILE, `${JSON.stringify(q, null, 2)}\n`); } catch (err: unknown) {
    console.error('[CrawlQueue] Error saving queue:', err instanceof Error ? err.message : String(err));
  }
}

export function enqueueUrls(urls: string[], dataset?: string): CrawlJob[] {
  const q = load();
  const newJobs: CrawlJob[] = [];

  for (const url of urls) {
    const existing = q.jobs.find(j => j.url === url && j.status === 'pending');
    if (existing) continue;

    const job: CrawlJob = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      url,
      dataset,
      status: 'pending',
      priority: 0,
      retries: 0,
      maxRetries: q.config.retryDelaysMs.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    q.jobs.unshift(job);
    newJobs.push(job);
  }

  save(q);
  return newJobs;
}

export function getNextBatch(): CrawlJob[] {
  const q = load();
  const now = Date.now();

  const pending = q.jobs
    .filter(j => j.status === 'pending' || (j.status === 'throttled' && j.nextRetryAt && new Date(j.nextRetryAt).getTime() <= now))
    .sort((a, b) => b.priority - a.priority || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return pending.slice(0, q.config.batchSize);
}

export function updateJob(id: string, update: Partial<CrawlJob>) {
  const q = load();
  const job = q.jobs.find(j => j.id === id);
  if (!job) return;

  Object.assign(job, { ...update, updatedAt: new Date().toISOString() });

  if (update.status === 'throttled' && job.retries < job.maxRetries) {
    const delay = q.config.retryDelaysMs[job.retries] || q.config.retryDelaysMs[q.config.retryDelaysMs.length - 1];
    job.nextRetryAt = new Date(Date.now() + delay).toISOString();
    job.retries++;
  }

  save(q);
}

export function getQueueStatus(): CrawlQueue {
  return load();
}

export function getQueueStats() {
  const q = load();
  return q.stats;
}

export function clearQueue() {
  save({ jobs: [], config: load().config, stats: { total: 0, pending: 0, completed: 0, failed: 0, throttled: 0 } });
}

export function getBatchConfig() {
  return load().config;
}

// ─── ASYNCHRONOUS ORCHESTRATED APIs (Files / Dual / Postgres Mode) ───

export async function enqueueUrlsNew(urls: string[], dataset?: string): Promise<CrawlJob[]> {
  return enqueueUrlsAsync(urls, dataset);
}

export async function getNextBatchNew(): Promise<CrawlJob[]> {
  return getNextBatchAsync();
}

export async function updateJobNew(id: string, update: Partial<CrawlJob>): Promise<void> {
  return updateJobAsync(id, update);
}

export async function getQueueStatusNew(): Promise<CrawlQueue> {
  return getQueueStatusAsync();
}

export async function clearQueueNew(): Promise<void> {
  return clearQueueAsync();
}
