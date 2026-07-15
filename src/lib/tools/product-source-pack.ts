import fs from 'fs';
import path from 'path';
import { safeReadJson } from '@/lib/utils/json';

export type ProductSource = {
  name: string;
  url: string;
  dataset: string;
  priority: 'high' | 'medium' | 'low';
  productTypes: string[];
  reason: string;
  status: 'pending' | 'queued' | 'crawled' | 'failed';
};

export type ProductSourcePack = {
  generated_at: string;
  purpose: string;
  target_dataset: string;
  minimum_active_products_goal: number;
  minimum_real_image_coverage: number;
  sources: ProductSource[];
};

type QueueJobSnapshot = {
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'throttled' | 'retired';
  updatedAt?: string;
};

const PACK_FILE = path.join(process.cwd(), 'data', 'fpv-product-source-pack.json');

function isProductSource(value: unknown): value is ProductSource {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.name === 'string' &&
    typeof record.url === 'string' &&
    typeof record.dataset === 'string' &&
    ['high', 'medium', 'low'].includes(String(record.priority)) &&
    Array.isArray(record.productTypes) &&
    typeof record.reason === 'string' &&
    ['pending', 'queued', 'crawled', 'failed'].includes(String(record.status))
  );
}

export function readProductSourcePack(): ProductSourcePack {
  const raw = safeReadJson<any>(PACK_FILE, null) as unknown;
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid product source pack shape.');
  }

  const record = raw as Record<string, unknown>;
  const sources = Array.isArray(record.sources) ? record.sources.filter(isProductSource) : [];
  return {
    generated_at: typeof record.generated_at === 'string' ? record.generated_at : new Date(0).toISOString(),
    purpose: typeof record.purpose === 'string' ? record.purpose : '',
    target_dataset: typeof record.target_dataset === 'string' ? record.target_dataset : 'fpv-components-specs',
    minimum_active_products_goal: typeof record.minimum_active_products_goal === 'number' ? record.minimum_active_products_goal : 50,
    minimum_real_image_coverage: typeof record.minimum_real_image_coverage === 'number' ? record.minimum_real_image_coverage : 0.8,
    sources,
  };
}

export function groupProductSourcesByDataset(sources: ProductSource[]): Record<string, ProductSource[]> {
  return sources.reduce<Record<string, ProductSource[]>>((groups, source) => {
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

function sourceStatusFromJob(job: QueueJobSnapshot): ProductSource['status'] {
  if (job.status === 'completed') return 'crawled';
  if (job.status === 'failed' || job.status === 'retired') return 'failed';
  return 'queued';
}

export function applyQueueStatusToProductSourcePack(
  pack: ProductSourcePack,
  jobs: QueueJobSnapshot[],
): ProductSourcePack {
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

export function getProductSourceStatusCounts(sources: ProductSource[]) {
  return sources.reduce<Record<ProductSource['status'], number>>((counts, source) => {
    counts[source.status] += 1;
    return counts;
  }, {
    pending: 0,
    queued: 0,
    crawled: 0,
    failed: 0,
  });
}
