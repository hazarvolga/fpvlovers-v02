-- CREATE CONTENT JOBS TABLE
CREATE TABLE IF NOT EXISTS fpvlovers_app.content_jobs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  topic TEXT,
  keyword TEXT,
  intent TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  title TEXT,
  slug TEXT,
  brief JSONB NOT NULL DEFAULT '{}'::jsonb,
  draft JSONB NOT NULL DEFAULT '{}'::jsonb,
  publish_artifact JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  legacy_file_hash TEXT
);

-- INDEXES FOR CONTENT JOBS
CREATE INDEX IF NOT EXISTS idx_content_jobs_status_updated ON fpvlovers_app.content_jobs (status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_jobs_scheduled ON fpvlovers_app.content_jobs (scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_jobs_slug ON fpvlovers_app.content_jobs (slug) WHERE slug IS NOT NULL;


-- CREATE CRAWL JOBS TABLE
CREATE TABLE IF NOT EXISTS fpvlovers_app.crawl_jobs (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  dataset_id TEXT,
  dataset_key TEXT,
  status TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100,
  source TEXT,
  source_pack TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  legacy_file_hash TEXT
);

-- INDEXES FOR CRAWL JOBS
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_scheduler ON fpvlovers_app.crawl_jobs (status, priority ASC, next_attempt_at ASC);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_dataset ON fpvlovers_app.crawl_jobs (dataset_key, status) WHERE dataset_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uidx_crawl_jobs_url_dataset ON fpvlovers_app.crawl_jobs (url, dataset_key) WHERE dataset_key IS NOT NULL;


-- CREATE AUTOMATION RUNS TABLE
CREATE TABLE IF NOT EXISTS fpvlovers_app.automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT
);

-- INDEXES FOR AUTOMATION RUNS
CREATE INDEX IF NOT EXISTS idx_automation_runs_kind_started ON fpvlovers_app.automation_runs (kind, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_runs_status_started ON fpvlovers_app.automation_runs (status, started_at DESC);
