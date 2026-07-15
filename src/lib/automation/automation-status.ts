import { query } from '@/lib/server/db';

const DEFAULT_DAILY_PUBLISH_TARGET = 4;
const HOUR_MS = 60 * 60 * 1000;

type CountRow = {
  status: string | null;
  count: string | number;
  latest_updated_at: Date | string | null;
  latest_completed_at: Date | string | null;
};

type AutomationRunRow = {
  kind: string | null;
  status: string | null;
  count: string | number;
  latest_started_at: Date | string | null;
  latest_finished_at: Date | string | null;
};

type RecentContentJobRow = {
  id: string;
  status: string;
  title: string | null;
  updated_at: Date | string | null;
  completed_at: Date | string | null;
  error_message: string | null;
};

type RecentCrawlJobRow = {
  id: string;
  status: string;
  url: string;
  dataset_key: string | null;
  updated_at: Date | string | null;
  completed_at: Date | string | null;
  error_message: string | null;
};

type PublishedSummaryRow = {
  total: string | number;
  latest_published_at: Date | string | null;
  latest_updated_at: Date | string | null;
  published_last_24h: string | number;
  published_last_14d: string | number;
  observed_days_14d: string | number;
};

type CrawlIssueRow = {
  unresolved_failed: string | number;
  unresolved_pending: string | number;
};

type RecentPublishedRow = {
  slug: string;
  title: string | null;
  published_at: Date | string | null;
  updated_at: Date | string | null;
};

type StaleJobsRow = {
  stale_generating: string | number;
  stale_queued: string | number;
};

export type AutomationSeverity = 'ok' | 'warning' | 'critical';

export type AutomationFinding = {
  severity: AutomationSeverity;
  code: string;
  message: string;
};

export type StatusBucket = {
  count: number;
  latestUpdatedAt: string | null;
  latestCompletedAt: string | null;
};

export type AutomationStatusReport = {
  generatedAt: string;
  dailyPublishTarget: number;
  overall: AutomationSeverity;
  contentJobs: {
    total: number;
    byStatus: Record<string, StatusBucket>;
    staleGenerating: number;
    staleQueued: number;
    recent: RecentContentJobRow[];
  };
  crawlJobs: {
    total: number;
    byStatus: Record<string, StatusBucket>;
    throttled: number;
    retired: number;
    unresolvedFailed: number;
    unresolvedPending: number;
    recent: RecentCrawlJobRow[];
  };
  automationRuns: {
    byKindStatus: Record<string, {
      count: number;
      latestStartedAt: string | null;
      latestFinishedAt: string | null;
    }>;
  };
  publishing: {
    totalShadowArticles: number;
    publishedLast24h: number;
    publishedLast14d: number;
    observedDays14d: number;
    dailyAverage14d: number;
    targetMet14d: boolean;
    latestPublishedAt: string | null;
    latestUpdatedAt: string | null;
    recent: RecentPublishedRow[];
  };
  findings: AutomationFinding[];
};

function toIso(value: Date | string | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function toCount(value: string | number): number {
  if (typeof value === 'number') return value;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hoursSince(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return null;
  return (now.getTime() - time) / HOUR_MS;
}

function severityRank(severity: AutomationSeverity): number {
  if (severity === 'critical') return 2;
  if (severity === 'warning') return 1;
  return 0;
}

function summarizeCounts(rows: CountRow[]): {
  total: number;
  byStatus: Record<string, StatusBucket>;
} {
  const byStatus: Record<string, StatusBucket> = {};
  let total = 0;
  for (const row of rows) {
    const status = row.status ?? 'unknown';
    const count = toCount(row.count);
    total += count;
    byStatus[status] = {
      count,
      latestUpdatedAt: toIso(row.latest_updated_at),
      latestCompletedAt: toIso(row.latest_completed_at),
    };
  }
  return { total, byStatus };
}

export async function getAutomationStatusReport(
  options: { dailyPublishTarget?: number; now?: Date } = {},
): Promise<AutomationStatusReport> {
  const now = options.now ?? new Date();
  const dailyPublishTarget = options.dailyPublishTarget ?? DEFAULT_DAILY_PUBLISH_TARGET;

  const [
    contentCounts,
    crawlCounts,
    automationRuns,
    publishedSummary,
    recentPublished,
    recentContentJobs,
    recentCrawlJobs,
    staleJobs,
    crawlIssues,
  ] = await Promise.all([
    query<CountRow>(`
      SELECT
        status,
        COUNT(*) AS count,
        MAX(updated_at) AS latest_updated_at,
        MAX(completed_at) AS latest_completed_at
      FROM fpvlovers_app.content_jobs
      GROUP BY status
      ORDER BY status
    `),
    query<CountRow>(`
      SELECT
        status,
        COUNT(*) AS count,
        MAX(updated_at) AS latest_updated_at,
        MAX(completed_at) AS latest_completed_at
      FROM fpvlovers_app.crawl_jobs
      GROUP BY status
      ORDER BY status
    `),
    query<AutomationRunRow>(`
      SELECT
        kind,
        status,
        COUNT(*) AS count,
        MAX(started_at) AS latest_started_at,
        MAX(finished_at) AS latest_finished_at
      FROM fpvlovers_app.automation_runs
      GROUP BY kind, status
      ORDER BY kind, status
    `),
    query<PublishedSummaryRow>(`
      SELECT
        COUNT(*) AS total,
        MAX(published_at) AS latest_published_at,
        MAX(updated_at) AS latest_updated_at,
        COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '24 hours') AS published_last_24h,
        COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '14 days') AS published_last_14d,
        COUNT(DISTINCT published_at::date) FILTER (WHERE published_at >= NOW() - INTERVAL '14 days') AS observed_days_14d
      FROM fpvlovers_app.published_articles_shadow
    `),
    query<RecentPublishedRow>(`
      SELECT slug, title, published_at, updated_at
      FROM fpvlovers_app.published_articles_shadow
      ORDER BY GREATEST(COALESCE(updated_at, 'epoch'), COALESCE(published_at, 'epoch')) DESC
      LIMIT 10
    `),
    query<RecentContentJobRow>(`
      SELECT id, status, title, updated_at, completed_at, error_message
      FROM fpvlovers_app.content_jobs
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 10
    `),
    query<RecentCrawlJobRow>(`
      SELECT id, status, url, dataset_key, updated_at, completed_at, error_message
      FROM fpvlovers_app.crawl_jobs
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 10
    `),
    query<StaleJobsRow>(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'generating' AND updated_at < NOW() - INTERVAL '6 hours') AS stale_generating,
        COUNT(*) FILTER (WHERE status = 'queued' AND updated_at < NOW() - INTERVAL '24 hours') AS stale_queued
      FROM fpvlovers_app.content_jobs
    `),
    query<CrawlIssueRow>(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'failed' AND COALESCE(metadata->>'resolution', '') = '') AS unresolved_failed,
        COUNT(*) FILTER (WHERE status = 'pending' AND COALESCE(metadata->>'resolution', '') = '') AS unresolved_pending
      FROM fpvlovers_app.crawl_jobs
    `),
  ]);

  const content = summarizeCounts(contentCounts.rows);
  const crawl = summarizeCounts(crawlCounts.rows);
  const published = publishedSummary.rows[0] ?? {
    total: 0,
    latest_published_at: null,
    latest_updated_at: null,
    published_last_24h: 0,
    published_last_14d: 0,
    observed_days_14d: 0,
  };

  const byKindStatus: AutomationStatusReport['automationRuns']['byKindStatus'] = {};
  for (const row of automationRuns.rows) {
    const key = `${row.kind ?? 'unknown'}:${row.status ?? 'unknown'}`;
    byKindStatus[key] = {
      count: toCount(row.count),
      latestStartedAt: toIso(row.latest_started_at),
      latestFinishedAt: toIso(row.latest_finished_at),
    };
  }

  const stale = staleJobs.rows[0] ?? { stale_generating: 0, stale_queued: 0 };
  const staleGenerating = toCount(stale.stale_generating);
  const staleQueued = toCount(stale.stale_queued);
  const throttled = crawl.byStatus.throttled?.count ?? 0;
  const retired = crawl.byStatus.retired?.count ?? 0;
  const crawlIssue = crawlIssues.rows[0] ?? { unresolved_failed: 0, unresolved_pending: 0 };
  const unresolvedFailed = toCount(crawlIssue.unresolved_failed);
  const unresolvedPending = toCount(crawlIssue.unresolved_pending);
  const publishedLast24h = toCount(published.published_last_24h);
  const publishedLast14d = toCount(published.published_last_14d);
  const observedDays14d = toCount(published.observed_days_14d);
  const dailyAverage14d = Number((publishedLast14d / 14).toFixed(2));
  const latestPublishedAt = toIso(published.latest_published_at);
  const latestGenerateAt = Object.entries(byKindStatus)
    .filter(([key]) => key.startsWith('generate:'))
    .map(([, value]) => value.latestStartedAt)
    .filter((value): value is string => value !== null)
    .sort()
    .at(-1) ?? null;
  const latestCrawlAt = Object.entries(byKindStatus)
    .filter(([key]) => key.startsWith('crawl:'))
    .map(([, value]) => value.latestStartedAt)
    .filter((value): value is string => value !== null)
    .sort()
    .at(-1) ?? null;

  const findings: AutomationFinding[] = [];

  const publishAgeHours = hoursSince(latestPublishedAt, now);
  if (publishAgeHours === null || publishAgeHours > 48) {
    findings.push({
      severity: 'critical',
      code: 'publish_stale',
      message: `No published shadow article in the last 48 hours. Latest: ${latestPublishedAt ?? 'none'}.`,
    });
  }

  const generateAgeHours = hoursSince(latestGenerateAt, now);
  if (generateAgeHours === null || generateAgeHours > 12) {
    findings.push({
      severity: 'critical',
      code: 'generate_stale',
      message: `No generate automation run in the last 12 hours. Latest: ${latestGenerateAt ?? 'none'}.`,
    });
  }

  const crawlAgeHours = hoursSince(latestCrawlAt, now);
  if (crawlAgeHours === null || crawlAgeHours > 30) {
    findings.push({
      severity: 'warning',
      code: 'crawl_stale',
      message: `No crawl automation run in the last 30 hours. Latest: ${latestCrawlAt ?? 'none'}.`,
    });
  }

  if (publishedLast24h < dailyPublishTarget) {
    findings.push({
      severity: 'warning',
      code: 'daily_target_missed',
      message: `Published ${publishedLast24h}/${dailyPublishTarget} target articles in the last 24 hours.`,
    });
  }

  if (staleGenerating > 0 || staleQueued > 0) {
    findings.push({
      severity: 'critical',
      code: 'stale_jobs',
      message: `Stale content jobs detected: generating=${staleGenerating}, queued=${staleQueued}.`,
    });
  }

  if (throttled > 0) {
    findings.push({
      severity: 'warning',
      code: 'embedding_budget_throttled',
      message: `${throttled} crawl job(s) are throttled, likely due to embedding budget limits.`,
    });
  }

  if (unresolvedFailed > 0 || unresolvedPending > 0) {
    findings.push({
      severity: 'warning',
      code: 'crawl_queue_unresolved',
      message: `Unresolved crawl jobs detected: failed=${unresolvedFailed}, pending=${unresolvedPending}.`,
    });
  }

  const overall = findings.reduce<AutomationSeverity>(
    (current, finding) => severityRank(finding.severity) > severityRank(current) ? finding.severity : current,
    'ok',
  );

  return {
    generatedAt: now.toISOString(),
    dailyPublishTarget,
    overall,
    contentJobs: {
      total: content.total,
      byStatus: content.byStatus,
      staleGenerating,
      staleQueued,
      recent: recentContentJobs.rows.map((row) => ({
        ...row,
        updated_at: toIso(row.updated_at),
        completed_at: toIso(row.completed_at),
      })),
    },
    crawlJobs: {
      total: crawl.total,
      byStatus: crawl.byStatus,
      throttled,
      retired,
      unresolvedFailed,
      unresolvedPending,
      recent: recentCrawlJobs.rows.map((row) => ({
        ...row,
        updated_at: toIso(row.updated_at),
        completed_at: toIso(row.completed_at),
      })),
    },
    automationRuns: { byKindStatus },
    publishing: {
      totalShadowArticles: toCount(published.total),
      publishedLast24h,
      publishedLast14d,
      observedDays14d,
      dailyAverage14d,
      targetMet14d: publishedLast14d >= dailyPublishTarget * 14,
      latestPublishedAt,
      latestUpdatedAt: toIso(published.latest_updated_at),
      recent: recentPublished.rows.map((row) => ({
        ...row,
        published_at: toIso(row.published_at),
        updated_at: toIso(row.updated_at),
      })),
    },
    findings,
  };
}
