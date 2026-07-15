CREATE SCHEMA IF NOT EXISTS content_engine;

CREATE TABLE IF NOT EXISTS content_engine.raw_content (
  url TEXT PRIMARY KEY,
  raw_markdown TEXT NOT NULL,
  source TEXT,
  content_hash TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  crawled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_raw_content_active_crawled
  ON content_engine.raw_content (is_active, crawled_at DESC);

CREATE INDEX IF NOT EXISTS idx_raw_content_url
  ON content_engine.raw_content (url);
