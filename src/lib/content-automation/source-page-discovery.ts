const DISCOVERY_STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'into', 'your', 'this', 'that',
  'fpv', 'drone', 'drones', 'guide', 'guides', 'explained', 'masterclass',
]);

const STRONG_TOPIC_TERMS = new Set([
  'acro', 'blackbox', 'betaflight', 'elrs', 'esc', 'filter', 'firmware',
  'gyro', 'motor', 'pid', 'telemetry', 'tuning', 'vtx',
]);

const NON_ARTICLE_PATHS = [
  '/author/', '/category/', '/tag/', '/search', '/cart', '/account',
  '/collections/', '/products/', '/wp-content/',
];

const ASSET_EXTENSIONS = /\.(?:avif|gif|jpe?g|png|svg|webp|css|js|xml|pdf)$/i;

type LinkCandidate = {
  url: string;
  label: string;
};

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !DISCOVERY_STOPWORDS.has(token));
}

function normalizedHost(url: URL): string {
  return url.hostname.toLowerCase().replace(/^www\./, '');
}

function compactQuery(query: string): string {
  return [...new Set(tokenize(query))].slice(0, 8).join(' ');
}

export function buildSourceSearchUrl(sourceUrl: string, query: string): string | undefined {
  try {
    const source = new URL(sourceUrl);
    if (!/^https?:$/.test(source.protocol)) return undefined;

    const searchQuery = compactQuery(query);
    if (!searchQuery) return undefined;

    const host = normalizedHost(source);
    source.hash = '';
    source.pathname = host === 'rotorriot.com' || host === 'pyrodrone.com'
      ? '/search'
      : '/';
    source.search = '';
    source.searchParams.set(host === 'rotorriot.com' || host === 'pyrodrone.com' ? 'q' : 's', searchQuery);
    return source.toString();
  } catch {
    return undefined;
  }
}

function extractLinks(markdown: string): LinkCandidate[] {
  const links: LinkCandidate[] = [];
  const markdownLink = /\[([^\]]{1,240})\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g;
  const htmlLink = /<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>([^<]{1,240})<\/a>/gi;

  for (const match of markdown.matchAll(markdownLink)) {
    links.push({ label: match[1], url: match[2] });
  }
  for (const match of markdown.matchAll(htmlLink)) {
    links.push({ label: match[2], url: match[1] });
  }
  return links;
}

export function extractRelevantSourcePages(input: {
  markdown: string;
  sourceUrl: string;
  query: string;
  maxResults?: number;
}): string[] {
  let source: URL;
  try {
    source = new URL(input.sourceUrl);
  } catch {
    return [];
  }

  const queryTokens = new Set(tokenize(input.query));
  if (queryTokens.size === 0) return [];

  const scored = new Map<string, number>();
  for (const candidate of extractLinks(input.markdown)) {
    let url: URL;
    try {
      url = new URL(candidate.url, source);
    } catch {
      continue;
    }

    if (!/^https?:$/.test(url.protocol)) continue;
    if (normalizedHost(url) !== normalizedHost(source)) continue;

    const path = url.pathname.toLowerCase();
    if (path === '/' || ASSET_EXTENSIONS.test(path)) continue;
    if (NON_ARTICLE_PATHS.some((fragment) => path.includes(fragment))) continue;

    url.hash = '';
    const identityTokens = new Set(tokenize(`${candidate.label} ${decodeURIComponent(path)}`));
    const overlap = [...identityTokens].filter((token) => queryTokens.has(token));
    const strongHits = overlap.filter((token) => STRONG_TOPIC_TERMS.has(token)).length;
    if (overlap.length < 2 && strongHits === 0) continue;

    const score = overlap.length * 2 + strongHits * 3;
    const canonical = url.toString();
    scored.set(canonical, Math.max(scored.get(canonical) || 0, score));
  }

  return [...scored.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, input.maxResults ?? 4)
    .map(([url]) => url);
}
