-- CREATE ANALYTICS SCHEMA
CREATE SCHEMA IF NOT EXISTS fpvlovers_analytics;

-- CREATE EVENTS TABLE
CREATE TABLE IF NOT EXISTS fpvlovers_analytics.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  anonymous_id TEXT,
  session_id TEXT,
  content_slug TEXT,
  product_id UUID,
  affiliate_offer_id UUID,
  sponsor_id UUID,
  campaign_id UUID,
  source TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

-- INDEXES FOR EVENTS
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_occurred ON fpvlovers_analytics.events (event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_slug_occurred ON fpvlovers_analytics.events (content_slug, occurred_at DESC) WHERE content_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_camp_occurred ON fpvlovers_analytics.events (campaign_id, occurred_at DESC) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_prod_occurred ON fpvlovers_analytics.events (product_id, occurred_at DESC) WHERE product_id IS NOT NULL;


-- CREATE DAILY ROLLUPS TABLE
CREATE TABLE IF NOT EXISTS fpvlovers_analytics.daily_rollups (
  rollup_date DATE NOT NULL,
  metric_key TEXT NOT NULL,
  dimension_key TEXT NOT NULL DEFAULT 'global',
  dimension_value TEXT NOT NULL DEFAULT 'global',
  value NUMERIC(18,4) NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (rollup_date, metric_key, dimension_key, dimension_value)
);

-- INDEXES FOR DAILY ROLLUPS
CREATE INDEX IF NOT EXISTS idx_analytics_rollups_metric_date ON fpvlovers_analytics.daily_rollups (metric_key, rollup_date DESC);


-- CREATE TRUST SCORES TABLE
CREATE TABLE IF NOT EXISTS fpvlovers_analytics.trust_scores (
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL,
  reason JSONB NOT NULL DEFAULT '{}'::JSONB,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (entity_type, entity_id)
);

-- INDEXES FOR TRUST SCORES
CREATE INDEX IF NOT EXISTS idx_analytics_trust_scores_type_score ON fpvlovers_analytics.trust_scores (entity_type, score DESC);
