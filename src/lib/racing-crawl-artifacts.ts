import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { safeReadJson } from '@/lib/utils/json';

export type RacingCrawlArtifact = {
  url: string;
  sourceName?: string;
  dataset: 'fpv-racing-events';
  markdown: string;
  title?: string;
  crawledAt: string;
  crawlerEndpoint: string;
  contentLength: number;
};

const ARTIFACT_DIR = path.join(process.cwd(), 'data', 'racing-crawl-artifacts');

export function getRacingArtifactDir() {
  return ARTIFACT_DIR;
}

export function hashRacingArtifactUrl(url: string) {
  return createHash('sha1').update(url).digest('hex').slice(0, 16);
}

export function getRacingArtifactPath(url: string) {
  return path.join(ARTIFACT_DIR, `${hashRacingArtifactUrl(url)}.json`);
}

export function writeRacingCrawlArtifact(artifact: RacingCrawlArtifact) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const payload = {
    ...artifact,
    contentLength: artifact.markdown.length,
  };
  fs.writeFileSync(getRacingArtifactPath(artifact.url), `${JSON.stringify(payload, null, 2)}\n`);
  return payload;
}

export function readRacingCrawlArtifact(url: string): RacingCrawlArtifact | undefined {
  const file = getRacingArtifactPath(url);
  if (!fs.existsSync(file)) return undefined;
  const raw = safeReadJson<any>(file, null) as unknown;
  if (!raw || typeof raw !== 'object') return undefined;
  const record = raw as Record<string, unknown>;
  const markdown = typeof record.markdown === 'string' ? record.markdown : '';
  const sourceUrl = typeof record.url === 'string' ? record.url : url;
  if (markdown.trim().length < 80) return undefined;

  return {
    url: sourceUrl,
    sourceName: typeof record.sourceName === 'string' ? record.sourceName : undefined,
    dataset: 'fpv-racing-events',
    markdown,
    title: typeof record.title === 'string' ? record.title : undefined,
    crawledAt: typeof record.crawledAt === 'string' ? record.crawledAt : new Date(0).toISOString(),
    crawlerEndpoint: typeof record.crawlerEndpoint === 'string' ? record.crawlerEndpoint : '',
    contentLength: typeof record.contentLength === 'number' ? record.contentLength : markdown.length,
  };
}

export function listRacingCrawlArtifacts() {
  if (!fs.existsSync(ARTIFACT_DIR)) return [];
  return fs.readdirSync(ARTIFACT_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => path.join(ARTIFACT_DIR, file));
}
