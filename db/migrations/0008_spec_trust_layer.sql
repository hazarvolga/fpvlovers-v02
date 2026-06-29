-- Evidence-bound catalog trust foundation. Existing rows remain quarantined.
SET LOCAL lock_timeout = '5s';

ALTER TABLE fpvlovers_commerce.products
  ADD COLUMN IF NOT EXISTS trust_status TEXT NOT NULL DEFAULT 'QUARANTINE',
  ADD COLUMN IF NOT EXISTS conflict_log JSONB NOT NULL DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS max_cell_count INTEGER,
  ADD COLUMN IF NOT EXISTS mounting_pattern TEXT,
  ADD COLUMN IF NOT EXISTS motor_kv INTEGER,
  ADD COLUMN IF NOT EXISTS esc_continuous_amp INTEGER,
  ADD COLUMN IF NOT EXISTS prop_diameter NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS connector TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_trust_status_check'
      AND conrelid = 'fpvlovers_commerce.products'::regclass
  ) THEN
    ALTER TABLE fpvlovers_commerce.products
      ADD CONSTRAINT products_trust_status_check
      CHECK (trust_status IN ('QUARANTINE', 'REVIEW_REQUIRED', 'VERIFIED', 'REJECTED'))
      NOT VALID;
  END IF;
END
$$;

ALTER TABLE fpvlovers_commerce.products
  VALIDATE CONSTRAINT products_trust_status_check;

CREATE INDEX IF NOT EXISTS idx_commerce_products_trust_status
  ON fpvlovers_commerce.products (trust_status);
CREATE INDEX IF NOT EXISTS idx_commerce_products_category_trust_status
  ON fpvlovers_commerce.products (category, trust_status);

CREATE INDEX IF NOT EXISTS idx_commerce_products_motor_kv
  ON fpvlovers_commerce.products (motor_kv)
  WHERE motor_kv IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_commerce_products_esc_continuous_amp
  ON fpvlovers_commerce.products (esc_continuous_amp)
  WHERE esc_continuous_amp IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_commerce_products_max_cell_count
  ON fpvlovers_commerce.products (max_cell_count)
  WHERE max_cell_count IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_commerce_products_mounting_pattern
  ON fpvlovers_commerce.products (mounting_pattern)
  WHERE mounting_pattern IS NOT NULL;
