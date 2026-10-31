-- Migration: 0011_privacy_compliance_foundation
-- Purpose: P0 KVKK/GDPR data model for newsletter consent, account acceptance and cookie consent.

ALTER TABLE fpvlovers_app.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_version TEXT,
  ADD COLUMN IF NOT EXISTS consent_source TEXT;

UPDATE fpvlovers_app.newsletter_subscribers
SET status = CASE WHEN is_active THEN 'active' ELSE 'unsubscribed' END
WHERE status IS NULL OR status = 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'newsletter_subscribers_status_check'
  ) THEN
    ALTER TABLE fpvlovers_app.newsletter_subscribers
      ADD CONSTRAINT newsletter_subscribers_status_check
      CHECK (status IN ('pending', 'active', 'unsubscribed'));
  END IF;
END $$;

ALTER TABLE fpvlovers_app.users
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT,
  ADD COLUMN IF NOT EXISTS age_attested_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS fpvlovers_app.consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_id TEXT NOT NULL UNIQUE,
  categories JSONB NOT NULL,
  policy_version TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_records_created_at
  ON fpvlovers_app.consent_records (created_at DESC);
