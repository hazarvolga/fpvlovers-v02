-- ADD LOCALE TO PUBLISHED CONTENT SHADOW
-- One artifact per (slug, locale): Turkish reuses English slugs, so slug alone
-- can no longer be the primary key.
ALTER TABLE fpvlovers_app.published_articles_shadow
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en';

ALTER TABLE fpvlovers_app.published_articles_shadow
  DROP CONSTRAINT IF EXISTS published_articles_shadow_pkey;

ALTER TABLE fpvlovers_app.published_articles_shadow
  ADD CONSTRAINT published_articles_shadow_slug_locale_key UNIQUE (slug, locale);

CREATE INDEX IF NOT EXISTS idx_published_articles_shadow_locale_date
  ON fpvlovers_app.published_articles_shadow (locale, published_at DESC);
