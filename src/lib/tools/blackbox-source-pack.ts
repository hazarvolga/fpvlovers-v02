import fs from 'fs';
import path from 'path';

export type BlackboxSourceStatus = 'pending' | 'queued' | 'crawled' | 'failed';

export type BlackboxSource = {
  url: string;
  title: string;
  dataset: string;
  tag: string;
  priority: 'p0' | 'p1' | 'p2';
  expected_coverage: string;
  status: BlackboxSourceStatus;
};

export type BlackboxSourcePack = {
  generated_at: string;
  purpose: string;
  ingestion_mode: string;
  notes: string[];
  sources: BlackboxSource[];
};

type QueueJobSnapshot = {
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'throttled';
  updatedAt?: string;
};

const PACK_FILE = path.join(process.cwd(), 'data', 'fpv-rag-source-pack.blackbox.json');

function isBlackboxSource(value: unknown): value is BlackboxSource {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.url === 'string' &&
    typeof record.title === 'string' &&
    typeof record.dataset === 'string' &&
    typeof record.tag === 'string' &&
    ['p0', 'p1', 'p2'].includes(String(record.priority)) &&
    typeof record.expected_coverage === 'string' &&
    ['pending', 'queued', 'crawled', 'failed'].includes(String(record.status))
  );
}

export function readBlackboxSourcePack(): BlackboxSourcePack {
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(PACK_FILE, 'utf-8'));
  } catch (error) {
    console.error(`Failed to parse blackbox source pack at ${PACK_FILE}:`, error);
    throw error;
  }
  
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid Blackbox source pack shape.');
  }

  const record = raw as Record<string, unknown>;
  const sources = Array.isArray(record.sources) ? record.sources.filter(isBlackboxSource) : [];

  return {
    generated_at: typeof record.generated_at === 'string' ? record.generated_at : new Date(0).toISOString(),
    purpose: typeof record.purpose === 'string' ? record.purpose : '',
    ingestion_mode: typeof record.ingestion_mode === 'string' ? record.ingestion_mode : 'queue_only',
    notes: Array.isArray(record.notes) ? record.notes.filter((note): note is string => typeof note === 'string') : [],
    sources,
  };
}

export function groupBlackboxSourcesByDataset(sources: BlackboxSource[]): Record<string, BlackboxSource[]> {
  return sources.reduce<Record<string, BlackboxSource[]>>((groups, source) => {
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

function sourceStatusFromJob(job: QueueJobSnapshot): BlackboxSourceStatus {
  if (job.status === 'completed') return 'crawled';
  if (job.status === 'failed') return 'failed';
  return 'queued';
}

export function applyQueueStatusToBlackboxSourcePack(
  pack: BlackboxSourcePack,
  jobs: QueueJobSnapshot[],
): BlackboxSourcePack {
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

export function getBlackboxSourceStatusCounts(sources: BlackboxSource[]) {
  return sources.reduce<Record<BlackboxSourceStatus, number>>((counts, source) => {
    counts[source.status] += 1;
    return counts;
  }, {
    pending: 0,
    queued: 0,
    crawled: 0,
    failed: 0,
  });
}
