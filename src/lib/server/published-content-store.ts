import { createHash } from 'crypto';
import type { PublishedArtifact } from '@/lib/content-automation/content-reader';
import { query } from './db';
import { getStorageMode } from './storage-mode';

function artifactHash(artifact: PublishedArtifact): string {
  return createHash('sha256').update(JSON.stringify(artifact)).digest('hex');
}

export async function upsertPublishedArtifact(artifact: PublishedArtifact): Promise<void> {
  const mode = getStorageMode();
  if (mode === 'files') return;

  const tags = Array.isArray(artifact.seo?.keywords) ? artifact.seo.keywords : [];
  const publishedAt = artifact.publishedAt ? new Date(artifact.publishedAt) : new Date();

  try {
    await query(
      `
        INSERT INTO fpvlovers_app.published_articles_shadow (
          slug, title, excerpt, category, tags, published_at, updated_at,
          json_path, markdown_path, json_hash, markdown_hash, metadata, last_indexed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9, NULL, $10, NOW())
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          excerpt = EXCLUDED.excerpt,
          category = EXCLUDED.category,
          tags = EXCLUDED.tags,
          published_at = EXCLUDED.published_at,
          updated_at = NOW(),
          json_path = EXCLUDED.json_path,
          markdown_path = EXCLUDED.markdown_path,
          json_hash = EXCLUDED.json_hash,
          metadata = EXCLUDED.metadata,
          last_indexed_at = NOW()
      `,
      [
        artifact.slug,
        artifact.title,
        artifact.excerpt || null,
        artifact.category || null,
        tags,
        publishedAt,
        `content/published/${artifact.slug}.json`,
        `content/published/${artifact.slug}.md`,
        artifactHash(artifact),
        artifact,
      ],
    );
  } catch (error) {
    if (mode === 'dual') {
      console.warn(`[Published Content] Database mirror failed for ${artifact.slug}:`, error);
      return;
    }
    throw error;
  }
}

export async function loadPublishedArtifacts(): Promise<PublishedArtifact[]> {
  const mode = getStorageMode();
  if (mode === 'files') return [];

  const result = await query<{ metadata: PublishedArtifact }>(
    `
      SELECT metadata
      FROM fpvlovers_app.published_articles_shadow
      ORDER BY published_at DESC NULLS LAST, updated_at DESC NULLS LAST
    `,
  );

  return result.rows
    .map((row) => row.metadata)
    .filter((artifact): artifact is PublishedArtifact => (
      artifact !== null
      && typeof artifact === 'object'
      && typeof artifact.slug === 'string'
    ));
}

export async function getPublishedArtifact(slug: string): Promise<PublishedArtifact | null> {
  const mode = getStorageMode();
  if (mode === 'files') return null;

  const result = await query<{ metadata: PublishedArtifact }>(
    `
      SELECT metadata
      FROM fpvlovers_app.published_articles_shadow
      WHERE slug = $1
      LIMIT 1
    `,
    [slug],
  );

  return result.rows[0]?.metadata || null;
}
