import { createHash } from 'crypto';
import { query } from './db';

export type RawCrawlContent = {
  url: string;
  rawMarkdown: string;
  crawler?: string;
  metadata?: Record<string, unknown>;
};

function hasDatabaseConfig(): boolean {
  return Boolean(
    process.env.FPV_DATABASE_URL
    || (process.env.DB_HOST && process.env.DB_DATABASE),
  );
}

export async function persistRawCrawlContent(input: RawCrawlContent): Promise<void> {
  if (!hasDatabaseConfig() || !input.url || !input.rawMarkdown) return;

  const contentHash = createHash('sha256').update(input.rawMarkdown).digest('hex');
  await query(
    `
      INSERT INTO content_engine.raw_content (
        url, raw_markdown, source, content_hash, metadata, crawled_at, updated_at, is_active
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), TRUE)
      ON CONFLICT (url) DO UPDATE SET
        raw_markdown = EXCLUDED.raw_markdown,
        source = EXCLUDED.source,
        content_hash = EXCLUDED.content_hash,
        metadata = EXCLUDED.metadata,
        crawled_at = EXCLUDED.crawled_at,
        updated_at = NOW(),
        is_active = TRUE
    `,
    [input.url, input.rawMarkdown, input.crawler || null, contentHash, input.metadata || {}],
  );
}

export async function listRawCrawlContent(options: {
  domain?: string | null;
  limit?: number;
} = {}): Promise<Array<{ url: string; source: string | null; crawledAt: string; characters: number }>> {
  if (!hasDatabaseConfig()) return [];
  const limit = Math.min(Math.max(options.limit || 20, 1), 100);
  const domain = options.domain?.trim();
  const result = domain
    ? await query<{ url: string; source: string | null; crawled_at: string; characters: number }>(
      `SELECT url, source, crawled_at, length(raw_markdown)::integer AS characters
       FROM content_engine.raw_content
       WHERE is_active = TRUE AND url ILIKE $1
       ORDER BY crawled_at DESC
       LIMIT $2`,
      [`%${domain}%`, limit],
    )
    : await query<{ url: string; source: string | null; crawled_at: string; characters: number }>(
      `SELECT url, source, crawled_at, length(raw_markdown)::integer AS characters
       FROM content_engine.raw_content
       WHERE is_active = TRUE
       ORDER BY crawled_at DESC
       LIMIT $1`,
      [limit],
    );

  return result.rows.map((row) => ({
    url: row.url,
    source: row.source,
    crawledAt: new Date(row.crawled_at).toISOString(),
    characters: row.characters,
  }));
}
