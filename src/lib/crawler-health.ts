export type CrawlerStatus = 'online' | 'offline' | 'error';

export type CrawlerHealthResult = {
  name: string;
  role: 'primary' | 'backup';
  status: CrawlerStatus;
  checkedUrl: string;
  version: string;
  latencyMs: number;
  httpStatus?: number;
  error?: string;
};

type CrawlerConfig = {
  name: string;
  role: 'primary' | 'backup';
  healthUrl: string;
};

const PRIMARY_HEALTH_URL = 'http://crawler-proxy:3002/health';
const BACKUP_HEALTH_URL = 'http://crawler-backup:3002/health'; // Should be overridden by CRAWL4AI_BACKUP_HEALTH_URL in production

function getCrawlerConfigs(): CrawlerConfig[] {
  return [
    {
      name: 'Crawl4AI Primary (B)',
      role: 'primary',
      healthUrl: process.env.CRAWL4AI_PRIMARY_HEALTH_URL || PRIMARY_HEALTH_URL,
    },
    {
      name: 'Crawl4AI Backup (C)',
      role: 'backup',
      healthUrl: process.env.CRAWL4AI_BACKUP_HEALTH_URL || BACKUP_HEALTH_URL,
    },
  ];
}

function readHealthPayload(data: unknown): { ok: boolean; version: string; detail?: string } {
  if (!data || typeof data !== 'object') {
    return { ok: false, version: '-', detail: 'Invalid health payload' };
  }

  const record = data as Record<string, unknown>;
  const status = typeof record.status === 'string' ? record.status.toLowerCase() : '';
  const version = typeof record.version === 'string' ? record.version : '-';

  return {
    ok: status === 'ok' || status === 'healthy',
    version,
    detail: status ? `status=${status}` : 'Missing status field',
  };
}

export async function checkCrawlerHealth(timeoutMs = 5000): Promise<CrawlerHealthResult[]> {
  const configs = getCrawlerConfigs();

  return Promise.all(configs.map(async (crawler) => {
    const startedAt = Date.now();

    try {
      const resp = await fetch(crawler.healthUrl, { signal: AbortSignal.timeout(timeoutMs) });
      const latencyMs = Date.now() - startedAt;
      const data = await resp.json().catch((): unknown => null);
      const payload = readHealthPayload(data);
      const online = resp.ok && payload.ok;

      return {
        name: crawler.name,
        role: crawler.role,
        status: online ? 'online' : 'error',
        checkedUrl: crawler.healthUrl,
        version: payload.version,
        latencyMs,
        httpStatus: resp.status,
        error: online ? undefined : payload.detail || `HTTP ${resp.status}`,
      } satisfies CrawlerHealthResult;
    } catch (err: unknown) {
      return {
        name: crawler.name,
        role: crawler.role,
        status: 'offline',
        checkedUrl: crawler.healthUrl,
        version: '-',
        latencyMs: Date.now() - startedAt,
        error: err instanceof Error ? err.message : 'Health check failed',
      } satisfies CrawlerHealthResult;
    }
  }));
}
