import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { firstWaveContentPlan } from '../src/lib/content-plan';

const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');
const CONTENT_JOBS_FILE = path.join(process.cwd(), 'data', 'content-jobs.json');
const DEFAULT_TARGET = 56;
const DEFAULT_DAILY_CRON_RUNS = 8;

function parseNumberArg(name: string, fallback: number): number {
  const arg = process.argv.find((value) => value.startsWith(`--${name}=`));
  if (!arg) return fallback;
  const value = Number.parseInt(arg.split('=')[1] ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function readPublishedSlugs(): Set<string> {
  if (!fs.existsSync(PUBLISHED_DIR)) return new Set();

  const slugs = new Set<string>();
  for (const file of fs.readdirSync(PUBLISHED_DIR)) {
    if (!file.endsWith('.json')) continue;
    const fullPath = path.join(PUBLISHED_DIR, file);
    try {
      const artifact = JSON.parse(fs.readFileSync(fullPath, 'utf8')) as { slug?: unknown };
      slugs.add(typeof artifact.slug === 'string' ? artifact.slug : file.replace(/\.json$/, ''));
    } catch {
      slugs.add(file.replace(/\.json$/, ''));
    }
  }
  return slugs;
}

function readPublishedJobIds(): Set<string> {
  if (!fs.existsSync(PUBLISHED_DIR)) return new Set();

  const jobIds = new Set<string>();
  for (const file of fs.readdirSync(PUBLISHED_DIR)) {
    if (!file.endsWith('.json')) continue;
    const fullPath = path.join(PUBLISHED_DIR, file);
    try {
      const artifact = JSON.parse(fs.readFileSync(fullPath, 'utf8')) as { jobId?: unknown };
      if (typeof artifact.jobId === 'string' && artifact.jobId.trim()) jobIds.add(artifact.jobId);
    } catch {
      // Ignore invalid JSON here; content:audit owns artifact readability.
    }
  }
  return jobIds;
}

function readExistingJobSlugs(): Set<string> {
  if (!fs.existsSync(CONTENT_JOBS_FILE)) return new Set();

  const raw = JSON.parse(fs.readFileSync(CONTENT_JOBS_FILE, 'utf8')) as unknown;
  const jobs = Array.isArray(raw) ? raw : [];
  const slugs = new Set<string>();

  for (const job of jobs) {
    if (!job || typeof job !== 'object') continue;
    const record = job as Record<string, unknown>;
    for (const key of ['briefSlug', 'id']) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) slugs.add(value);
    }
    const seo = record.seo;
    if (seo && typeof seo === 'object') {
      const slug = (seo as Record<string, unknown>).slug;
      if (typeof slug === 'string' && slug.trim()) slugs.add(slug);
    }
  }

  return slugs;
}

const target = parseNumberArg('target', DEFAULT_TARGET);
const dailyCronRuns = parseNumberArg('daily-cron-runs', DEFAULT_DAILY_CRON_RUNS);
const publishedSlugs = readPublishedSlugs();
const publishedJobIds = readPublishedJobIds();
const existingJobSlugs = readExistingJobSlugs();
const existingSlugs = new Set([...publishedSlugs, ...publishedJobIds, ...existingJobSlugs]);
const plannedSlugs = firstWaveContentPlan.map((entry) => entry.slug);
const duplicateSlugs = plannedSlugs.filter((slug, index) => plannedSlugs.indexOf(slug) !== index);

const available = firstWaveContentPlan.filter((entry) => (
  !existingSlugs.has(entry.slug) &&
  !existingSlugs.has(`brief-${entry.slug}`)
));
const unsafeClaims = available.filter((entry) => (
  /hands[- ]on review|hands[- ]on tested|tested by us|we tested|our test|review score|affiliate partner|official partner|sponsored by|provided by|sent us/i.test([
    entry.title,
    entry.summary,
    entry.whyThisMatters,
    entry.metaDescription,
    ...entry.outline,
  ].join(' '))
));

const projectedDailyPublishes = Math.floor(dailyCronRuns / 2);
const projectedFourteenDayCapacity = projectedDailyPublishes * 14;

assert.equal(duplicateSlugs.length, 0, `Duplicate content-plan slugs: ${duplicateSlugs.join(', ')}`);
assert.equal(unsafeClaims.length, 0, `Unsafe autonomous review/affiliate claims: ${unsafeClaims.map((entry) => entry.slug).join(', ')}`);
assert.ok(
  available.length >= target,
  `Autonomous backlog has ${available.length}/${target} available briefs. Add more evergreen non-review briefs.`,
);
assert.ok(
  projectedFourteenDayCapacity >= target,
  `Cron cadence projects ${projectedFourteenDayCapacity}/${target} publishes over 14 days.`,
);

console.log(JSON.stringify({
  status: 'passed',
  target,
  plannedBriefs: firstWaveContentPlan.length,
  committedPublished: publishedSlugs.size,
  publishedJobIds: publishedJobIds.size,
  existingJobs: existingJobSlugs.size,
  availableBriefs: available.length,
  dailyCronRuns,
  projectedDailyPublishes,
  projectedFourteenDayCapacity,
  nextBriefs: available.slice(0, 12).map((entry) => ({
    slug: entry.slug,
    category: entry.category,
    intent: entry.searchIntent,
  })),
}, null, 2));
