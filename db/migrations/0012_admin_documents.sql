-- Durable store for admin-managed monetization documents (affiliates, sponsors,
-- campaigns, CTAs, metrics). Previously written to container-local data/*.json
-- files, which were lost on every redeploy.
CREATE TABLE IF NOT EXISTS fpvlovers_app.admin_documents (
  name TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
