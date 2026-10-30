import { createHash } from 'crypto';
import type { PublishedArtifact } from '@/lib/content-automation/content-reader';
import { DEFAULT_LOCALE, resolveLocale, type Locale } from '@/lib/i18n/locale';
import { query } from './db';
import { getStorageMode } from './storage-mode';

export function artifactStoragePath(locale: Locale, slug: string): string {
  return locale === DEFAULT_LOCALE
    ? `content/published/${slug}.json`
    : `content/published/${locale}/${slug}.json`;
}

function artifactHash(artifact: PublishedArtifact): string {
  return createHash('sha256').update(JSON.stringify(artifact)).digest('hex');
}

export async function upsertPublishedArtifact(artifact: PublishedArtifact): Promise<void> {
  const mode = getStorageMode();
  if (mode === 'files') return;

  const locale = resolveLocale(artifact.locale);
  const tags = Array.isArray(artifact.seo?.keywords) ? artifact.seo.keywords : [];
  const publishedAt = artifact.publishedAt ? new Date(artifact.publishedAt) : new Date();
  const jsonPath = artifactStoragePath(locale, artifact.slug);
  const markdownPath = jsonPath.replace(/\.json$/, '.md');

  try {
    await query(
      `
        INSERT INTO fpvlovers_app.published_articles_shadow (
          slug, locale, title, excerpt, category, tags, published_at, updated_at,
          json_path, markdown_path, json_hash, markdown_hash, metadata, last_indexed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, $10, NULL, $11, NOW())
        ON CONFLICT (slug, locale) DO UPDATE SET
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
        locale,
        artifact.title,
        artifact.excerpt || null,
        artifact.category || null,
        tags,
        publishedAt,
        jsonPath,
        markdownPath,
        artifactHash(artifact),
        artifact,
      ],
    );
  } catch (error) {
    if (mode === 'dual') {
      console.warn(`[Published Content] Database mirror failed for ${artifact.slug} (${locale}):`, error);
      return;
    }
    throw error;
  }
}

export async function loadPublishedArtifacts(locale: Locale = DEFAULT_LOCALE): Promise<PublishedArtifact[]> {
  const mode = getStorageMode();
  if (mode === 'files') return [];

  const result = await query<{ metadata: PublishedArtifact }>(
    `
      SELECT metadata
      FROM fpvlovers_app.published_articles_shadow
      WHERE locale = $1
      ORDER BY published_at DESC NULLS LAST, updated_at DESC NULLS LAST
    `,
    [locale],
  );

  return result.rows
    .map((row) => row.metadata)
    .filter((artifact): artifact is PublishedArtifact => (
      artifact !== null
      && typeof artifact === 'object'
      && typeof artifact.slug === 'string'
    ));
}

export async function getPublishedArtifact(
  slug: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<PublishedArtifact | null> {
  const mode = getStorageMode();
  if (mode === 'files') return null;

  const result = await query<{ metadata: PublishedArtifact }>(
    `
      SELECT metadata
      FROM fpvlovers_app.published_articles_shadow
      WHERE slug = $1 AND locale = $2
      LIMIT 1
    `,
    [slug, locale],
  );

  return result.rows[0]?.metadata || null;
}
