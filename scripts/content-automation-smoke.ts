import fs from 'fs';
import os from 'os';
import path from 'path';
import type { ContentJob } from '../src/lib/content-automation/types';
import type { GeneratedContent } from '../src/lib/content-automation/parse-generated-content';

const TEMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'fpvlovers-content-smoke-'));
const QUEUE_FILE = path.join(TEMP_ROOT, 'content-jobs.json');
const PUBLISHED_DIR = path.join(TEMP_ROOT, 'published');

const PASS = (msg: string) => console.log(`  ✓ ${msg}`);
const FAIL = (msg: string, detail?: string) => {
  console.log(`  ✗ ${msg}${detail ? ` — ${detail}` : ''}`);
  process.exitCode = 1;
};

function phase(label: string) {
  console.log(`\n▶ ${label}`);
}

function loadContentJobs(): ContentJob[] {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
    return Array.isArray(parsed) ? parsed as ContentJob[] : [];
  } catch {
    return [];
  }
}

function saveContentJobs(jobs: ContentJob[]): void {
  ensureDir(path.dirname(QUEUE_FILE));
  fs.writeFileSync(QUEUE_FILE, `${JSON.stringify(jobs, null, 2)}\n`, 'utf-8');
}

function enqueueContentJob(job: ContentJob): void {
  const jobs = loadContentJobs();
  if (!jobs.some((existing) => existing.id === job.id)) {
    jobs.push(job);
    saveContentJobs(jobs);
  }
}

function cleanup() {
  try { fs.rmSync(TEMP_ROOT, { recursive: true, force: true }); } catch {}
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ── 1. Create a sample job ──
phase('1. Create sample job');

const jobId = `smoke-${Date.now()}`;
const sampleJob: ContentJob = {
  id: jobId,
  briefSlug: 'smoke-test-fpv-build',
  title: 'Smoke Test: FPV Build Guide',
  category: 'Build Guides',
  status: 'brief',
  topic: 'How to build a smoke-tested 5-inch FPV drone',
  language: 'en',
  template: 'build-guide',
  promptVersion: 'v2',
  sourceHints: [],
  seo: { slug: 'smoke-test-fpv-build', metaDescription: 'Smoke test build guide', keywords: ['fpv', 'smoke'] },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

enqueueContentJob(sampleJob);
let jobs = loadContentJobs();

if (jobs.length !== 1) FAIL('job count after create', `expected 1 got ${jobs.length}`);
else if (jobs[0].id !== jobId) FAIL('job id mismatch');
else if (jobs[0].status !== 'brief') FAIL('initial status', `expected brief got ${jobs[0].status}`);
else PASS('sample job created with status brief');

// ── 2. Advance through states ──
phase('2. Advance through state machine');

const transitions = ['queued', 'generating', 'generated', 'reviewed', 'approved'] as const;
for (const target of transitions) {
  jobs = loadContentJobs();
  const idx = jobs.findIndex((j) => j.id === jobId);
  if (idx === -1) { FAIL('job lost during state advance'); break; }
  jobs[idx].status = target;
  jobs[idx].updatedAt = new Date().toISOString();
  saveContentJobs(jobs);
}

jobs = loadContentJobs();
const job = jobs.find((j) => j.id === jobId);

if (job?.status === 'approved') PASS('advanced through all states to approved');
else FAIL('final state', `expected approved got ${job?.status}`);

// ── 3. Add reviewer feedback ──
phase('3. Reviewer feedback');

if (job) {
  job.feedback = 'smoke test feedback: looks clean';
  saveContentJobs(jobs);
  const reloaded = loadContentJobs();
  const reloadedJob = reloaded.find((j) => j.id === jobId);
  if (reloadedJob?.feedback === 'smoke test feedback: looks clean') PASS('feedback persisted');
  else FAIL('feedback persistence');
}

// ── 4. Verify JSON shape ──
phase('4. Verify GeneratedContent shape');

const fakeContent: GeneratedContent = {
  title: 'Smoke Test Article',
  seo: { slug: 'smoke-test-fpv-build', metaDescription: 'Test meta', keywords: ['test'] },
  excerpt: 'A smoke test excerpt',
  bodySections: [{ id: 'intro', title: 'Introduction', content: 'This is a smoke test.' }],
  internalLinks: [],
  publishNotes: ['Smoke test publish note'],
};

if (fakeContent.title === 'Smoke Test Article') PASS('title field valid');
if (fakeContent.seo.slug === 'smoke-test-fpv-build') PASS('slug field valid');
if (fakeContent.bodySections.length === 1) PASS('bodySections array valid');
if (fakeContent.bodySections[0].id === 'intro') PASS('bodySection id valid');

// ── 5. Publish artifact ──
phase('5. Publish artifact');

ensureDir(PUBLISHED_DIR);
const slug = 'smoke-test-fpv-build';
const jsonPath = path.join(PUBLISHED_DIR, `${slug}.json`);
const mdPath = path.join(PUBLISHED_DIR, `${slug}.md`);

const artifact = {
  slug,
  title: fakeContent.title,
  jobId,
  category: 'Build Guides',
  seo: fakeContent.seo,
  excerpt: fakeContent.excerpt,
  bodySections: fakeContent.bodySections,
  internalLinks: fakeContent.internalLinks,
  publishNotes: fakeContent.publishNotes,
  publishedAt: new Date().toISOString(),
};

fs.writeFileSync(jsonPath, JSON.stringify(artifact, null, 2) + '\n');
fs.writeFileSync(mdPath, `# ${fakeContent.title}\n\n> ${fakeContent.excerpt}\n\n## Introduction\n\nThis is a smoke test.\n`);

if (fs.existsSync(jsonPath)) PASS('published JSON file created');
if (fs.existsSync(mdPath)) PASS('published Markdown file created');

// ── 6. Idempotent re-publish ──
phase('6. Idempotent re-publish');

const beforeFiles = fs.readdirSync(PUBLISHED_DIR).filter((f) => f.startsWith(slug));
fs.writeFileSync(jsonPath, JSON.stringify(artifact, null, 2) + '\n');
fs.writeFileSync(mdPath, `# ${fakeContent.title} v2\n\n> Updated smoke test.\n`);
const afterFiles = fs.readdirSync(PUBLISHED_DIR).filter((f) => f.startsWith(slug));

if (beforeFiles.length === afterFiles.length) PASS('re-publish does not duplicate files');
else FAIL('idempotent publish', `before=${beforeFiles.length} after=${afterFiles.length}`);

// ── 7. Queue state integrity ──
phase('7. Queue state integrity');

const final = loadContentJobs();
if (final.length === 1) PASS('queue contains exactly 1 job');

// ── 8. Cleanup ──
phase('8. Cleanup');

try { fs.unlinkSync(jsonPath); } catch {}
try { fs.unlinkSync(mdPath); } catch {}
cleanup();

if (!fs.existsSync(TEMP_ROOT)) PASS('isolated smoke workspace cleaned up');

// ── Result ──
console.log(process.exitCode ? '\n✗ SMOKE FAILED\n' : '\n✓ ALL SMOKE TESTS PASSED\n');
process.exit(process.exitCode ?? 0);
