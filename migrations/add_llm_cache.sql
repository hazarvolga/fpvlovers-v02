-- LLM Response Cache — PostgreSQL migration
-- Run: psql -U postgres -d dify -f migrations/add_llm_cache.sql

CREATE SCHEMA IF NOT EXISTS content_engine;

CREATE TABLE IF NOT EXISTS content_engine.llm_cache (
    input_hash  TEXT PRIMARY KEY,
    response    JSONB NOT NULL,
    model       TEXT NOT NULL,
    task_type   TEXT,
    created_at  TIMESTAMPTZ DEFAULT now(),
    hits        INT DEFAULT 0,
    expires_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS llm_cache_created_at ON content_engine.llm_cache(created_at);
CREATE INDEX IF NOT EXISTS llm_cache_expires_at ON content_engine.llm_cache(expires_at);
