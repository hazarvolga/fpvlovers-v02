-- CREATE PUBLISHED CONTENT SHADOW TABLE
CREATE TABLE IF NOT EXISTS fpvlovers_app.published_articles_shadow (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT,
  category TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  json_path TEXT NOT NULL,
  markdown_path TEXT,
  json_hash TEXT NOT NULL,
  markdown_hash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR PUBLISHED CONTENT SHADOW
CREATE INDEX IF NOT EXISTS idx_published_articles_shadow_date ON fpvlovers_app.published_articles_shadow (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_published_articles_shadow_cat_date ON fpvlovers_app.published_articles_shadow (category, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_published_articles_shadow_tags ON fpvlovers_app.published_articles_shadow USING GIN (tags);
