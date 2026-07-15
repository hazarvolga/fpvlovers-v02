import fs from 'fs';
import path from 'path';
import { safeReadJson } from '@/lib/utils/json';

export type RacingSourceStatus = 'pending' | 'queued' | 'crawled' | 'failed';

export type RacingSource = {
  name: string;
  url: string;
  dataset: string;
  priority: 'high' | 'medium' | 'low';
  sourceType: string;
  entityTargets: string[];
  reason: string;
  status: RacingSourceStatus;
};

export type RacingSourcePack = {
  generated_at: string;
  purpose: string;
  target_dataset: string;
  policy: {
    crawl_mode: string;
    primary_sources_first: boolean;
    claim_rule: string;
    secondary_sources: string;
  };
  sources: RacingSource[];
};

type QueueJobSnapshot = {
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'throttled' | 'retired';
  updatedAt?: string;
};

const PACK_FILE = path.join(process.cwd(), 'data', 'racing-source-pack.json');

function isRacingSource(value: unknown): value is RacingSource {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;

  return (
    typeof record.name === 'string' &&
    typeof record.url === 'string' &&
    typeof record.dataset === 'string' &&
    ['high', 'medium', 'low'].includes(String(record.priority)) &&
    typeof record.sourceType === 'string' &&
    Array.isArray(record.entityTargets) &&
    record.entityTargets.every((target) => typeof target === 'string') &&
    typeof record.reason === 'string' &&
    ['pending', 'queued', 'crawled', 'failed'].includes(String(record.status))
  );
}

export function readRacingSourcePack(): RacingSourcePack {
  const raw = safeReadJson<any>(PACK_FILE, null) as unknown;
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid racing source pack shape.');
  }

  const record = raw as Record<string, unknown>;
  const policy = record.policy && typeof record.policy === 'object'
    ? record.policy as Record<string, unknown>
    : {};

  return {
    generated_at: typeof record.generated_at === 'string' ? record.generated_at : new Date(0).toISOString(),
    purpose: typeof record.purpose === 'string' ? record.purpose : '',
    target_dataset: typeof record.target_dataset === 'string' ? record.target_dataset : 'fpv-racing-events',
    policy: {
      crawl_mode: typeof policy.crawl_mode === 'string' ? policy.crawl_mode : 'queue-only',
      primary_sources_first: typeof policy.primary_sources_first === 'boolean' ? policy.primary_sources_first : true,
      claim_rule: typeof policy.claim_rule === 'string' ? policy.claim_rule : '',
      secondary_sources: typeof policy.secondary_sources === 'string' ? policy.secondary_sources : '',
    },
    sources: Array.isArray(record.sources) ? record.sources.filter(isRacingSource) : [],
  };
}

export function groupRacingSourcesByDataset(sources: RacingSource[]): Record<string, RacingSource[]> {
  return sources.reduce<Record<string, RacingSource[]>>((groups, source) => {
    groups[source.dataset] = groups[source.dataset] ?? [];
    groups[source.dataset].push(source);
    return groups;
  }, {});
}

function isNewerJob(candidate: QueueJobSnapshot, current?: QueueJobSnapshot): boolean {
  if (!current) return true;
  const candidateTime = candidate.updatedAt ? new Date(candidate.updatedAt).getTime() : 0;
  const currentTime = current.updatedAt ? new Date(current.updatedAt).getTime() : 0;
  return candidateTime >= currentTime;
}

function sourceStatusFromJob(job: QueueJobSnapshot): RacingSourceStatus {
  if (job.status === 'completed') return 'crawled';
  if (job.status === 'failed' || job.status === 'retired') return 'failed';
  return 'queued';
}

export function applyQueueStatusToRacingSourcePack(
  pack: RacingSourcePack,
  jobs: QueueJobSnapshot[],
): RacingSourcePack {
  const latestByUrl = new Map<string, QueueJobSnapshot>();
  for (const job of jobs) {
    if (isNewerJob(job, latestByUrl.get(job.url))) {
      latestByUrl.set(job.url, job);
    }
  }

  return {
    ...pack,
    sources: pack.sources.map((source) => {
      const latestJob = latestByUrl.get(source.url);
      return latestJob
        ? { ...source, status: sourceStatusFromJob(latestJob) }
        : source;
    }),
  };
}

export function getRacingSourceStatusCounts(sources: RacingSource[]) {
  return sources.reduce<Record<RacingSourceStatus, number>>((counts, source) => {
    counts[source.status] += 1;
    return counts;
  }, {
    pending: 0,
    queued: 0,
    crawled: 0,
    failed: 0,
  });
}
