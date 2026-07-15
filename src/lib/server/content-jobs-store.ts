import { query } from './db';
import type { ContentJob } from '../content-automation/types';
import { getContentJobsStorageMode } from './storage-mode';
import * as fs from 'fs';
import * as path from 'path';

const QUEUE_FILE = path.join(process.cwd(), 'data', 'content-jobs.json');

type ContentJobRow = {
  id: string;
  status: ContentJob['status'];
  topic: string | null;
  language: ContentJob['language'] | null;
  title: string | null;
  briefSlug: string | null;
  brief: Partial<ContentJob> | null;
  draft: Record<string, unknown> | null;
  publish_artifact: { publishedPath?: unknown } | null;
  error_message: string | null;
  attempt_count: number | null;
  scheduled_for: Date | string | null;
  started_at: Date | string | null;
  completed_at: Date | string | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
};

// --- FILE IMPLEMENTATIONS ---
function fileLoadContentJobs(): ContentJob[] {
  try {
    if (!fs.existsSync(QUEUE_FILE)) return [];
    const raw = fs.readFileSync(QUEUE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function fileSaveContentJobs(jobs: ContentJob[]): void {
  const dir = path.dirname(QUEUE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const sorted = [...jobs].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
}

// --- DATABASE IMPLEMENTATIONS ---
async function dbLoadContentJobs(): Promise<ContentJob[]> {
  try {
    const res = await query<ContentJobRow>(`
      SELECT 
        id, status, topic, keyword, intent, language, title, slug as "briefSlug",
        brief, draft, publish_artifact, error_message, attempt_count,
        scheduled_for, started_at, completed_at, created_at as "createdAt", updated_at as "updatedAt"
      FROM fpvlovers_app.content_jobs
      ORDER BY updated_at DESC
    `);
    
    return res.rows.map((row) => ({
      id: row.id,
      briefSlug: row.briefSlug || '',
      title: row.title || '',
      category: row.brief?.category || 'Flight Guides',
      status: row.status,
      topic: row.topic || '',
      language: row.language || 'en',
      template: row.brief?.template || 'tech-article',
      promptVersion: row.brief?.promptVersion || 'v2',
      sourceHints: Array.isArray(row.brief?.sourceHints) ? row.brief.sourceHints : [],
      seo: row.brief?.seo || {
        slug: row.briefSlug || '',
        metaDescription: row.topic || '',
        keywords: []
      },
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
      publishedPath: typeof row.publish_artifact?.publishedPath === 'string'
        ? row.publish_artifact.publishedPath
        : undefined,
      error_message: row.error_message || undefined,
      attempt_count: row.attempt_count || 0,
      scheduled_for: row.scheduled_for ? new Date(row.scheduled_for).toISOString() : undefined,
      started_at: row.started_at ? new Date(row.started_at).toISOString() : undefined,
      completed_at: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
    }));
  } catch (err) {
    console.error('[DB Store] Failed to load content jobs from database:', err);
    return []; // Return empty list on failure to prevent app lockups
  }
}

async function dbUpsertContentJob(job: ContentJob): Promise<void> {
  const now = new Date();
  await query(`
    INSERT INTO fpvlovers_app.content_jobs (
      id, status, topic, keyword, intent, language, title, slug,
      brief, draft, publish_artifact, error_message, attempt_count,
      scheduled_for, started_at, completed_at, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status,
      topic = EXCLUDED.topic,
      keyword = EXCLUDED.keyword,
      intent = EXCLUDED.intent,
      language = EXCLUDED.language,
      title = EXCLUDED.title,
      slug = EXCLUDED.slug,
      brief = EXCLUDED.brief,
      draft = EXCLUDED.draft,
      publish_artifact = EXCLUDED.publish_artifact,
      error_message = EXCLUDED.error_message,
      attempt_count = EXCLUDED.attempt_count,
      scheduled_for = EXCLUDED.scheduled_for,
      started_at = EXCLUDED.started_at,
      completed_at = EXCLUDED.completed_at,
      updated_at = EXCLUDED.updated_at;
  `, [
    job.id,
    job.status,
    job.topic || null,
    job.seo?.keywords?.[0] || null,
    null, // intent
    job.language || 'en',
    job.title || null,
    job.briefSlug || null,
    job, // Save the full job object inside the brief JSONB column
    job.draft || {},
    job.publishedPath ? { publishedPath: job.publishedPath } : {},
    job.error_message || null,
    job.attempt_count || 0,
    job.scheduled_for ? new Date(job.scheduled_for) : null,
    job.started_at ? new Date(job.started_at) : null,
    job.completed_at ? new Date(job.completed_at) : null,
    job.createdAt ? new Date(job.createdAt) : now,
    now
  ]);
}

// --- ORCHESTRATED STORE API ---

export async function loadContentJobsAsync(): Promise<ContentJob[]> {
  const mode = getContentJobsStorageMode();
  if (mode === 'postgres') {
    return dbLoadContentJobs();
  }
  if (mode === 'dual') {
    const fileJobs = fileLoadContentJobs();
    const dbJobs = await dbLoadContentJobs();
    const merged = new Map<string, ContentJob>();

    for (const job of [...fileJobs, ...dbJobs]) {
      const existing = merged.get(job.id);
      if (!existing || new Date(job.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
        merged.set(job.id, job);
      }
    }

    return [...merged.values()].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }
  return fileLoadContentJobs();
}

export async function saveContentJobsAsync(jobs: ContentJob[]): Promise<void> {
  const mode = getContentJobsStorageMode();
  
  if (mode === 'postgres') {
    try {
      for (const job of jobs) {
        await dbUpsertContentJob(job);
      }
    } catch (err) {
      console.error('[DB Store] Failed to save bulk content jobs to database:', err);
    }
    return;
  }

  if (mode === 'dual') {
    // 1. Write to canonical files first
    fileSaveContentJobs(jobs);
    
    // 2. Dual-write to DB in the background
    // We run this in a non-blocking try-catch to keep files resilient
    Promise.resolve().then(async () => {
      try {
        for (const job of jobs) {
          await dbUpsertContentJob(job);
        }
      } catch (dbErr) {
        console.warn('[DB Dual-Write] Content jobs background write failed (files are saved):', dbErr);
      }
    });
    return;
  }

  // default mode: files
  fileSaveContentJobs(jobs);
}

export async function enqueueContentJobAsync(job: ContentJob): Promise<ContentJob[]> {
  const mode = getContentJobsStorageMode();
  const nowStr = new Date().toISOString();
  
  const enriched: ContentJob = {
    ...job,
    status: job.status || 'brief',
    createdAt: job.createdAt || nowStr,
    updatedAt: nowStr,
  };

  if (mode === 'postgres') {
    try {
      await dbUpsertContentJob(enriched);
    } catch (err) {
      console.error('[DB Store] Failed to enqueue content job in database:', err);
    }
    return dbLoadContentJobs();
  }

  if (mode === 'dual') {
    // 1. Canonical file enqueue
    const jobs = fileLoadContentJobs();
    if (!jobs.some((j) => j.id === job.id)) {
      jobs.push(enriched);
      fileSaveContentJobs(jobs);
    }

    // 2. Dual-write to DB in background
    Promise.resolve().then(async () => {
      try {
        await dbUpsertContentJob(enriched);
      } catch (dbErr) {
        console.warn('[DB Dual-Write] Content job enqueue background write failed:', dbErr);
      }
    });

    return jobs;
  }

  // default mode: files
  const jobs = fileLoadContentJobs();
  if (jobs.some((j) => j.id === job.id)) return jobs;
  jobs.push(enriched);
  fileSaveContentJobs(jobs);
  return jobs;
}
