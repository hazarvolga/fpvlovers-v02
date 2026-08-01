import { difyRequest } from '@/lib/dify-client';
import { getNextBatchNew, updateJobNew, type CrawlJob } from '@/lib/crawl-queue';
import { findDataset } from '@/lib/master-routing-tables';
import { persistRawCrawlContent } from '@/lib/server/raw-content-store';
import { crawlUrlToMarkdown } from '@/lib/server/crawl4ai-client';

type QueueUpdate = Partial<CrawlJob>;

type DifyUploadResponse = {
  ok: boolean;
  status: 'success' | 'error' | 'throttled' | 'dry_run' | 'budget_exceeded';
  data?: unknown;
  error?: string;
};

type CrawlWorkerDependencies = {
  getNextBatch: () => Promise<CrawlJob[]>;
  updateJob: (id: string, update: QueueUpdate) => Promise<void>;
  fetchCrawler: typeof fetch;
  uploadToDify: (endpoint: string, options: {
    method: 'POST';
    body: Record<string, unknown>;
    timeout: number;
    tokens: number;
  }) => Promise<DifyUploadResponse>;
  persistRawContent: (input: {
    url: string;
    rawMarkdown: string;
    crawler: 'primary' | 'backup';
    metadata?: Record<string, unknown>;
  }) => Promise<boolean>;
};

export type CrawlWorkerItemResult = {
  jobId: string;
  url: string;
  dataset: string;
  action: 'would_process' | 'completed' | 'throttled' | 'failed';
  crawler?: 'primary' | 'backup';
  documentId?: string;
  contentCharacters?: number;
  error?: string;
};

export type CrawlWorkerResult = {
  enabled: boolean;
  dryRun: boolean;
  processed: number;
  items: CrawlWorkerItemResult[];
};

const DEFAULT_DEPENDENCIES: CrawlWorkerDependencies = {
  getNextBatch: getNextBatchNew,
  updateJob: updateJobNew,
  fetchCrawler: fetch,
  uploadToDify: (endpoint, options) => difyRequest(endpoint, options),
  persistRawContent: persistRawCrawlContent,
};

const MAX_DIFY_UPLOAD_CHARACTERS = 1_500;

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function readDocumentId(payload: unknown): string | undefined {
  const root = asRecord(payload);
  const document = asRecord(root?.document);
  return typeof document?.id === 'string' ? document.id : undefined;
}

export function isPermanentCrawlBlock(message: string): boolean {
  return /(anti[- ]bot|blocked by|cloudflare|captcha|robots\.txt|http 403)/i.test(message);
}

function assertPublicHttpUrl(value: string): void {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only HTTP(S) crawl URLs are allowed.');
  }

  const hostname = url.hostname.toLowerCase();
  if (['localhost', '0.0.0.0', '::1'].includes(hostname)) {
    throw new Error('Private crawl targets are not allowed.');
  }

  const match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$/);
  if (!match) return;

  const first = Number(match[1]);
  const second = Number(match[2]);
  if (first === 10
    || first === 127
    || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168)) {
    throw new Error('Private crawl targets are not allowed.');
  }
}

async function crawlUrl(
  url: string,
  dependencies: CrawlWorkerDependencies,
): Promise<{ markdown: string; crawler: 'primary' | 'backup' }> {
  const outcome = await crawlUrlToMarkdown(url, { fetchImpl: dependencies.fetchCrawler });
  if (!outcome.ok) {
    throw new Error(`All crawler providers failed. ${outcome.errors.join('; ')}`);
  }
  return { markdown: outcome.markdown, crawler: outcome.crawler };
}

function failureStatus(job: CrawlJob): 'throttled' | 'failed' {
  return job.retries < job.maxRetries ? 'throttled' : 'failed';
}

export async function processCrawlQueueBatch(options: {
  enabled?: boolean;
  dryRun?: boolean;
  maxJobs?: number;
  dependencies?: Partial<CrawlWorkerDependencies>;
} = {}): Promise<CrawlWorkerResult> {
  const enabled = options.enabled ?? process.env.ENABLE_CRAWL_WORKER === 'true';
  const dryRun = options.dryRun ?? process.env.CRAWL_DRY_RUN === 'true';
  if (!enabled) return { enabled: false, dryRun, processed: 0, items: [] };

  const dependencies = { ...DEFAULT_DEPENDENCIES, ...options.dependencies };
  const maxJobs = Math.min(Math.max(options.maxJobs ?? 1, 1), 3);
  const jobs = (await dependencies.getNextBatch()).slice(0, maxJobs);
  const items: CrawlWorkerItemResult[] = [];

  for (const job of jobs) {
    const dataset = job.dataset || 'fpv-community-knowledge';
    if (dryRun) {
      items.push({ jobId: job.id, url: job.url, dataset, action: 'would_process' });
      continue;
    }

    try {
      assertPublicHttpUrl(job.url);
      const datasetInfo = findDataset(dataset);
      if (!datasetInfo) throw new Error(`Unknown dataset: ${dataset}`);

      await dependencies.updateJob(job.id, { status: 'processing' });
      const crawled = await crawlUrl(job.url, dependencies);
      try {
        // Keep the source markdown locally before Dify upload so image
        // provenance survives an embedding budget or API failure.
        const rawPersisted = await dependencies.persistRawContent({
          url: job.url,
          rawMarkdown: crawled.markdown,
          crawler: crawled.crawler,
          metadata: { jobId: job.id, dataset },
        });
        if (!rawPersisted) {
          throw new Error('Raw source persistence returned false; Dify upload was skipped.');
        }
      } catch (error: unknown) {
        console.warn(
          `[CrawlWorker] Raw source persistence failed for ${job.url}:`,
          error instanceof Error ? error.message : String(error),
        );
        throw error;
      }
      const uploadText = crawled.markdown.slice(0, MAX_DIFY_UPLOAD_CHARACTERS);
      const uploadTokens = Math.ceil(uploadText.length / 3);
      const urlHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(job.url));
      const hashHex = Array.from(new Uint8Array(urlHash))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');

      const upload = await dependencies.uploadToDify(
        `/datasets/${datasetInfo.uuid}/document/create-by-text`,
        {
          method: 'POST',
          timeout: 30_000,
          tokens: uploadTokens,
          body: {
            name: hashHex.slice(0, 32),
            text: uploadText,
            doc_metadata: { source_url: job.url, url_hash: hashHex },
            indexing_technique: 'high_quality',
            process_rule: { mode: 'automatic' },
          },
        },
      );

      if (!upload.ok) {
        const status = upload.status === 'throttled' || upload.status === 'budget_exceeded'
          ? 'throttled'
          : failureStatus(job);
        throw Object.assign(new Error(upload.error || `Dify upload ${upload.status}`), { queueStatus: status });
      }

      const documentId = readDocumentId(upload.data);
      await dependencies.updateJob(job.id, {
        status: 'completed',
        docId: documentId,
        tokens: uploadTokens,
        error: undefined,
      });
      items.push({
        jobId: job.id,
        url: job.url,
        dataset,
        action: 'completed',
        crawler: crawled.crawler,
        documentId,
        contentCharacters: crawled.markdown.length,
      });
    } catch (error: unknown) {
      const record = asRecord(error);
      const message = error instanceof Error ? error.message : 'Unknown crawl worker error';
      const status = record?.queueStatus === 'throttled'
        ? 'throttled'
        : isPermanentCrawlBlock(message) ? 'failed' : failureStatus(job);
      await dependencies.updateJob(job.id, { status, error: message.slice(0, 500) });
      items.push({ jobId: job.id, url: job.url, dataset, action: status, error: message });
    }
  }

  return { enabled: true, dryRun, processed: items.length, items };
}
