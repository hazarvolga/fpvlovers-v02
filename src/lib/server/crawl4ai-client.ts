import { getOptionalEnv } from '@/lib/env';

// Shared Crawl4AI client used by every crawl call site (URL Ingest,
// the crawl-queue worker, and the image-backfill route). Consolidated here
// after finding — via a live SSH session against the Crawl4AI containers —
// that every call site used the /crawl endpoint's raw_markdown field
// (the full, unfiltered page), which was confirmed to embed site
// navigation, GitHub UI chrome, and even unrelated pages (a parked-domain
// sale page, an off-topic B2B site) into the RAG datasets as if they were
// real FPV content. Crawl4AI's /md endpoint with f="fit" runs a
// Readability-style content filter that strips exactly this boilerplate —
// confirmed live against real pages before this change shipped.

export type CrawlRole = 'primary' | 'backup';

export type CrawlOutcome =
  | { ok: true; markdown: string; crawler: CrawlRole }
  | { ok: false; errors: string[] };

export type CrawlMediaOutcome =
  | { ok: true; markdown: string; mediaMarkup: string; crawler: CrawlRole }
  | { ok: false; errors: string[] };

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

// /md's response is a flat {url, filter, query, cache, markdown, success}
// object — markdown is a plain string.
function readMarkdown(payload: unknown): string {
  const markdown = asRecord(payload)?.markdown;
  return typeof markdown === 'string' ? markdown : '';
}

// /crawl's legacy response nests markdown under results[0].markdown.raw_markdown.
function readLegacyMarkdown(payload: unknown): string {
  const root = asRecord(payload);
  const results = Array.isArray(root?.results) ? root.results : [];
  const first = asRecord(results[0]);
  const markdown = first?.markdown;
  if (typeof markdown === 'string') return markdown;
  const markdownRecord = asRecord(markdown);
  return typeof markdownRecord?.raw_markdown === 'string' ? markdownRecord.raw_markdown : '';
}

function htmlAttributeValue(value: unknown): string {
  return typeof value === 'string'
    ? value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
    : '';
}

/**
 * Convert Crawl4AI's rich /crawl response into markup understood by the
 * existing image harvester. Synthetic tags are placed before page HTML so
 * media/metadata survive the bounded payload even on very large pages.
 */
export function readLegacyMediaMarkup(payload: unknown): string {
  const root = asRecord(payload);
  const results = Array.isArray(root?.results) ? root.results : [];
  const first = asRecord(results[0]);
  if (!first) return '';

  const media = asRecord(first.media);
  const images = Array.isArray(media?.images) ? media.images : [];
  const imageTags = images.slice(0, 100).flatMap((value) => {
    const image = asRecord(value);
    const src = htmlAttributeValue(image?.src ?? image?.url);
    if (!src) return [];
    const alt = htmlAttributeValue(image?.alt ?? image?.desc);
    const srcset = htmlAttributeValue(image?.srcset);
    return [`<img src="${src}" alt="${alt}"${srcset ? ` srcset="${srcset}"` : ''}>`];
  });

  const metadata = asRecord(first.metadata);
  const metadataTags = Object.entries(metadata ?? {}).flatMap(([key, value]) => {
    if (!key.toLowerCase().includes('image')) return [];
    const content = htmlAttributeValue(value);
    return content ? [`<meta property="${htmlAttributeValue(key)}" content="${content}">`] : [];
  });

  const html = [first.cleaned_html, first.fit_html, first.html]
    .find((value): value is string => typeof value === 'string' && value.length > 0) ?? '';

  return [...imageTags, ...metadataTags, html].join('\n').slice(0, 2_000_000);
}

function readErrorDetail(payload: unknown, rawBody: string): string {
  const record = asRecord(payload);
  for (const key of ['detail', 'error', 'message']) {
    const value = record?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 240);
  }
  return rawBody.replace(/\s+/g, ' ').trim().slice(0, 240);
}

function toMdEndpoint(crawlUrl: string): string {
  return crawlUrl.replace(/\/crawl\/?$/, '/md');
}

// Derived from the existing /crawl URL env vars rather than new ones —
// production's two crawler URLs don't share a host/path shape (primary is
// an internal Docker alias, backup is a public IP behind an /c4ai/ path
// prefix), so a hardcoded new default would be wrong for one of them.
export function crawlerEndpoints(): Array<{ role: CrawlRole; mdUrl: string; legacyCrawlUrl: string }> {
  const primaryCrawlUrl = getOptionalEnv('CRAWL4AI_PRIMARY_CRAWL_URL', 'http://crawler-proxy:3002/crawl');
  const backupCrawlUrl = getOptionalEnv('CRAWL4AI_BACKUP_CRAWL_URL', 'http://crawler-backup:3002/crawl');
  return [
    { role: 'primary', mdUrl: toMdEndpoint(primaryCrawlUrl), legacyCrawlUrl: primaryCrawlUrl },
    { role: 'backup', mdUrl: toMdEndpoint(backupCrawlUrl), legacyCrawlUrl: backupCrawlUrl },
  ];
}

type FetchResult = {
  ok: boolean;
  markdown: string;
  mediaMarkup?: string;
  status?: number;
  detail?: string;
};

async function fetchMd(
  fetchImpl: typeof fetch,
  endpointUrl: string,
  url: string,
  filter: 'fit' | 'raw',
  timeoutMs: number,
): Promise<FetchResult> {
  const response = await fetchImpl(endpointUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, f: filter }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const rawBody = await response.text();
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    payload = undefined;
  }
  if (!response.ok || payload === undefined) {
    return { ok: false, markdown: '', status: response.status, detail: readErrorDetail(payload, rawBody) };
  }
  return { ok: true, markdown: readMarkdown(payload) };
}

async function fetchLegacyCrawl(
  fetchImpl: typeof fetch,
  endpointUrl: string,
  url: string,
  timeoutMs: number,
): Promise<FetchResult> {
  const response = await fetchImpl(endpointUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls: [url], priority: 10, markdown: true }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const rawBody = await response.text();
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    payload = undefined;
  }
  if (!response.ok) {
    return { ok: false, markdown: '', status: response.status, detail: readErrorDetail(payload, rawBody) };
  }
  return {
    ok: true,
    markdown: readLegacyMarkdown(payload),
    mediaMarkup: readLegacyMediaMarkup(payload),
  };
}

/**
 * Crawl specifically for editorial media. Unlike crawlUrlToMarkdown, this
 * intentionally uses the rich self-hosted /crawl response so image metadata
 * and HTML attributes are retained. RAG and ingest callers remain on /md.
 */
export async function crawlUrlForMedia(
  url: string,
  options: { fetchImpl?: typeof fetch; timeoutMs?: number; minLength?: number } = {},
): Promise<CrawlMediaOutcome> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 45_000;
  const minLength = options.minLength ?? 200;
  const errors: string[] = [];

  for (const endpoint of crawlerEndpoints()) {
    try {
      const result = await fetchLegacyCrawl(
        fetchImpl,
        endpoint.legacyCrawlUrl,
        url,
        timeoutMs,
      );
      const mediaMarkup = result.mediaMarkup ?? '';
      if (result.ok && (result.markdown.length >= minLength || mediaMarkup.length > 0)) {
        return {
          ok: true,
          markdown: result.markdown,
          mediaMarkup,
          crawler: endpoint.role,
        };
      }
      if (!result.ok) {
        errors.push(`${endpoint.role}: /crawl HTTP ${result.status}${result.detail ? ` (${result.detail})` : ''}`);
      } else {
        errors.push(`${endpoint.role}: /crawl content too short (${result.markdown.length})`);
      }
    } catch (error: unknown) {
      errors.push(`${endpoint.role}: ${error instanceof Error ? error.message : 'request failed'}`);
    }
  }

  return { ok: false, errors };
}

/**
 * Crawl a single URL and return clean (Readability-filtered) markdown.
 * Tries each configured crawler role in order; within a role, tries /md
 * (fit, then raw if fit comes back too short), and only falls back to the
 * legacy /crawl endpoint for that same role if /md itself is unreachable
 * (e.g. a reverse-proxy route that doesn't forward /md) — never skips
 * straight to the other role while the current one still has options left.
 */
export async function crawlUrlToMarkdown(
  url: string,
  options: { fetchImpl?: typeof fetch; timeoutMs?: number; minLength?: number } = {},
): Promise<CrawlOutcome> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 45_000;
  const minLength = options.minLength ?? 200;
  const errors: string[] = [];

  for (const endpoint of crawlerEndpoints()) {
    try {
      const fit = await fetchMd(fetchImpl, endpoint.mdUrl, url, 'fit', timeoutMs);
      if (fit.ok) {
        let markdown = fit.markdown;
        if (markdown.length < minLength) {
          const raw = await fetchMd(fetchImpl, endpoint.mdUrl, url, 'raw', timeoutMs);
          if (raw.ok && raw.markdown.length > markdown.length) markdown = raw.markdown;
        }
        if (markdown.length >= minLength) return { ok: true, markdown, crawler: endpoint.role };
        errors.push(`${endpoint.role}: /md content too short (${markdown.length})`);
        continue;
      }

      errors.push(`${endpoint.role}: /md HTTP ${fit.status}${fit.detail ? ` (${fit.detail})` : ''}`);
      const legacy = await fetchLegacyCrawl(fetchImpl, endpoint.legacyCrawlUrl, url, timeoutMs);
      if (legacy.ok && legacy.markdown.length >= minLength) {
        return { ok: true, markdown: legacy.markdown, crawler: endpoint.role };
      }
      if (!legacy.ok) {
        errors.push(`${endpoint.role}: /crawl fallback HTTP ${legacy.status}${legacy.detail ? ` (${legacy.detail})` : ''}`);
      } else {
        errors.push(`${endpoint.role}: /crawl fallback content too short (${legacy.markdown.length})`);
      }
    } catch (error: unknown) {
      errors.push(`${endpoint.role}: ${error instanceof Error ? error.message : 'request failed'}`);
    }
  }

  return { ok: false, errors };
}
