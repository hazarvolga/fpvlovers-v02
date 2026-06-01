-- CREATE COMMERCE SCHEMA
CREATE SCHEMA IF NOT EXISTS fpvlovers_commerce;

-- CREATE PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS fpvlovers_commerce.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  description TEXT,
  best_for TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  specs JSONB NOT NULL DEFAULT '{}'::JSONB,
  source_confidence NUMERIC(4,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR PRODUCTS
CREATE INDEX IF NOT EXISTS idx_commerce_products_cat_status ON fpvlovers_commerce.products (category, status);
CREATE INDEX IF NOT EXISTS idx_commerce_products_brand ON fpvlovers_commerce.products (brand);
CREATE INDEX IF NOT EXISTS idx_commerce_products_best_for ON fpvlovers_commerce.products USING GIN (best_for);
CREATE INDEX IF NOT EXISTS idx_commerce_products_specs ON fpvlovers_commerce.products USING GIN (specs);


-- CREATE PRODUCT SOURCES TABLE
CREATE TABLE IF NOT EXISTS fpvlovers_commerce.product_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES fpvlovers_commerce.products(id) ON DELETE CASCADE,
  source_url TEXT,
  source_type TEXT NOT NULL,
  source_name TEXT,
  crawl_job_id TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB
);

-- INDEXES FOR PRODUCT SOURCES
CREATE INDEX IF NOT EXISTS idx_product_sources_prod_captured ON fpvlovers_commerce.product_sources (product_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_sources_type ON fpvlovers_commerce.product_sources (source_type);


-- CREATE PRODUCT PRICES TABLE
CREATE TABLE IF NOT EXISTS fpvlovers_commerce.product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES fpvlovers_commerce.products(id) ON DELETE CASCADE,
  merchant TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  price NUMERIC(12,2),
  availability TEXT,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_url TEXT
);

-- INDEXES FOR PRODUCT PRICES
CREATE INDEX IF NOT EXISTS idx_product_prices_prod_observed ON fpvlovers_commerce.product_prices (product_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_prices_merchant_observed ON fpvlovers_commerce.product_prices (merchant, observed_at DESC);


-- CREATE AFFILIATE OFFERS TABLE
CREATE TABLE IF NOT EXISTS fpvlovers_commerce.affiliate_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES fpvlovers_commerce.products(id) ON DELETE SET NULL,
  network TEXT NOT NULL,
  merchant TEXT NOT NULL,
  tracking_url TEXT NOT NULL,
  display_url TEXT,
  commission_rate NUMERIC(6,3),
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'active',
  priority INTEGER NOT NULL DEFAULT 100,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR AFFILIATE OFFERS
CREATE INDEX IF NOT EXISTS idx_aff_offers_status_priority ON fpvlovers_commerce.affiliate_offers (status, priority ASC);
CREATE INDEX IF NOT EXISTS idx_aff_offers_prod_status ON fpvlovers_commerce.affiliate_offers (product_id, status);
CREATE INDEX IF NOT EXISTS idx_aff_offers_network_merchant ON fpvlovers_commerce.affiliate_offers (network, merchant);


-- CREATE SPONSORS TABLE
CREATE TABLE IF NOT EXISTS fpvlovers_commerce.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  website_url TEXT,
  contact_email TEXT,
  tier TEXT NOT NULL DEFAULT 'prospect',
  status TEXT NOT NULL DEFAULT 'prospect',
  fit_score NUMERIC(5,2),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR SPONSORS
CREATE INDEX IF NOT EXISTS idx_commerce_sponsors_status_tier ON fpvlovers_commerce.sponsors (status, tier);
CREATE INDEX IF NOT EXISTS idx_commerce_sponsors_fit_score ON fpvlovers_commerce.sponsors (fit_score DESC);


-- CREATE CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS fpvlovers_commerce.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  sponsor_id UUID REFERENCES fpvlovers_commerce.sponsors(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  budget NUMERIC(12,2),
  currency TEXT DEFAULT 'USD',
  goals JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR CAMPAIGNS
CREATE INDEX IF NOT EXISTS idx_commerce_campaigns_status_starts ON fpvlovers_commerce.campaigns (status, starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_commerce_campaigns_sponsor_status ON fpvlovers_commerce.campaigns (sponsor_id, status);


-- CREATE CAMPAIGN VARIANTS TABLE
CREATE TABLE IF NOT EXISTS fpvlovers_commerce.campaign_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES fpvlovers_commerce.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cta_text TEXT,
  target_url TEXT,
  weight INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

-- INDEXES FOR CAMPAIGN VARIANTS
CREATE INDEX IF NOT EXISTS idx_campaign_variants_camp_status ON fpvlovers_commerce.campaign_variants (campaign_id, status);
