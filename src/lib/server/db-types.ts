/**
 * FPV Lovers — Database Row Type Definitions
 *
 * Shared narrow TypeScript types for DB rows.
 * These mirror the SQL table definitions in db/migrations/.
 */

// ─── fpvlovers_app ──────────────────────────────────────────────────

export interface SchemaMigrationRow {
  version: string;
  name: string;
  checksum: string;
  applied_at: Date;
}

export interface ContentJobRow {
  id: string;
  status: string;
  topic: string | null;
  keyword: string | null;
  intent: string | null;
  language: string;
  title: string | null;
  slug: string | null;
  brief: Record<string, unknown>;
  draft: Record<string, unknown>;
  publish_artifact: Record<string, unknown>;
  error_message: string | null;
  attempt_count: number;
  scheduled_for: Date | null;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
  legacy_file_hash: string | null;
}

export interface CrawlJobRow {
  id: string;
  url: string;
  dataset_id: string | null;
  dataset_key: string | null;
  status: string;
  priority: number;
  source: string | null;
  source_pack: string | null;
  retry_count: number;
  next_attempt_at: Date | null;
  last_attempt_at: Date | null;
  completed_at: Date | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  legacy_file_hash: string | null;
}

export interface AutomationRunRow {
  id: string;
  kind: string;
  status: string;
  started_at: Date;
  finished_at: Date | null;
  summary: Record<string, unknown>;
  error_message: string | null;
}

export interface PublishedArticleShadowRow {
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  tags: string[];
  published_at: Date | null;
  updated_at: Date | null;
  json_path: string;
  markdown_path: string | null;
  json_hash: string;
  markdown_hash: string | null;
  metadata: Record<string, unknown>;
  last_indexed_at: Date;
}

export interface NewsletterSubscriberRow {
  id: string;
  email: string;
  is_active: boolean;
  subscribed_at: Date;
  unsubscribed_at: Date | null;
  source: string;
}

export interface NewsletterCampaignRow {
  id: string;
  subject: string;
  content_html: string;
  content_md: string | null;
  status: string;
  sent_at: Date | null;
  recipient_count: number;
  created_at: Date;
}

// ─── fpvlovers_commerce ─────────────────────────────────────────────

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  category: string;
  subcategory: string | null;
  status: string;
  description: string | null;
  best_for: string[];
  specs: Record<string, unknown>;
  source_confidence: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProductSourceRow {
  id: string;
  product_id: string;
  source_url: string | null;
  source_type: string;
  source_name: string | null;
  crawl_job_id: string | null;
  captured_at: Date;
  raw_snapshot: Record<string, unknown>;
}

export interface ProductPriceRow {
  id: string;
  product_id: string;
  merchant: string;
  currency: string;
  price: number | null;
  availability: string | null;
  observed_at: Date;
  source_url: string | null;
}

export interface AffiliateOfferRow {
  id: string;
  product_id: string | null;
  network: string;
  merchant: string;
  tracking_url: string;
  display_url: string | null;
  commission_rate: number | null;
  currency: string;
  status: string;
  priority: number;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface SponsorRow {
  id: string;
  name: string;
  slug: string;
  website_url: string | null;
  contact_email: string | null;
  tier: string;
  status: string;
  fit_score: number | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface CampaignRow {
  id: string;
  name: string;
  kind: string;
  sponsor_id: string | null;
  status: string;
  starts_at: Date | null;
  ends_at: Date | null;
  budget: number | null;
  currency: string;
  goals: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface CampaignVariantRow {
  id: string;
  campaign_id: string;
  name: string;
  cta_text: string | null;
  target_url: string | null;
  weight: number;
  status: string;
  metadata: Record<string, unknown>;
}

// ─── fpvlovers_analytics ────────────────────────────────────────────

export interface AnalyticsEventRow {
  id: string;
  event_type: string;
  occurred_at: Date;
  anonymous_id: string | null;
  session_id: string | null;
  content_slug: string | null;
  product_id: string | null;
  affiliate_offer_id: string | null;
  sponsor_id: string | null;
  campaign_id: string | null;
  source: string | null;
  metadata: Record<string, unknown>;
}

export interface DailyRollupRow {
  rollup_date: Date;
  metric_key: string;
  dimension_key: string;
  dimension_value: string;
  value: number;
  metadata: Record<string, unknown>;
  updated_at: Date;
}

export interface TrustScoreRow {
  entity_type: string;
  entity_id: string;
  score: number;
  reason: Record<string, unknown>;
  calculated_at: Date;
}
