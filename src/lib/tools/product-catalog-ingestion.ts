import type {
  EvidenceBoundSpec,
  ProductTrustStatus,
  SpecValue,
} from '@/lib/types/spec-trust';
import type {
  FpvCatalogProduct,
  ProductSpecConflictLogEntry,
  ProductSpecValue,
} from '@/lib/tools/fpv-product-types';
import { normalizeCrawlerCatalog } from '@/lib/tools/crawler-product-catalog';

export type ProductCatalogDbClient = {
  query: (text: string, params?: unknown[]) => Promise<{ rowCount: number | null }>;
};

type IngestionStats = {
  received: number;
  accepted: number;
  quarantined: number;
  reviewRequired: number;
  conflicts: number;
};

export type ProductCatalogIngestionResult = {
  products: FpvCatalogProduct[];
  stats: IngestionStats;
};

const CRITICAL_SPEC_KEYS = new Set([
  'kv',
  'escAmp',
  'cellCount',
  'propSize',
  'weight',
  'mount',
  'connector',
  'protocol',
  'firmware',
]);

function stableValue(value: SpecValue | ProductSpecValue | undefined): string {
  return JSON.stringify(value);
}

function specValuesDiffer(existing: EvidenceBoundSpec, incoming: EvidenceBoundSpec): boolean {
  if (existing.value === null || incoming.value === null) return false;
  return stableValue(existing.value) !== stableValue(incoming.value);
}

function sourceUrls(spec: EvidenceBoundSpec | undefined): string[] {
  return spec?.sourceUrls ?? [];
}

function hasVerifiedEvidence(product: FpvCatalogProduct): boolean {
  return Object.values(product.evidenceSpecs ?? {}).some((spec) => spec.status === 'verified');
}

function safeTrustStatus(product: FpvCatalogProduct, fallback: ProductTrustStatus = 'QUARANTINE'): ProductTrustStatus {
  if (product.trustStatus === 'VERIFIED') return hasVerifiedEvidence(product) ? 'VERIFIED' : 'QUARANTINE';
  if (
    product.trustStatus === 'QUARANTINE' ||
    product.trustStatus === 'REVIEW_REQUIRED' ||
    product.trustStatus === 'REJECTED'
  ) {
    return product.trustStatus;
  }
  return fallback;
}

function mergeSpecs(product: FpvCatalogProduct): Record<string, ProductSpecValue> {
  const specs: Record<string, ProductSpecValue> = { ...product.specs };
  for (const [key, evidence] of Object.entries(product.evidenceSpecs ?? {})) {
    if (evidence.value === null) delete specs[key];
    else specs[key] = evidence.value;
  }
  return specs;
}

function detectConflicts(
  existing: FpvCatalogProduct,
  incoming: FpvCatalogProduct,
  detectedAt: string,
): ProductSpecConflictLogEntry[] {
  const conflicts: ProductSpecConflictLogEntry[] = [];
  for (const key of CRITICAL_SPEC_KEYS) {
    const existingSpec = existing.evidenceSpecs?.[key];
    const incomingSpec = incoming.evidenceSpecs?.[key];
    if (!existingSpec || !incomingSpec || !specValuesDiffer(existingSpec, incomingSpec)) continue;

    conflicts.push({
      field: key,
      existingValue: existingSpec.value,
      incomingValue: incomingSpec.value,
      existingSourceUrls: sourceUrls(existingSpec),
      incomingSourceUrls: sourceUrls(incomingSpec),
      detectedAt,
      resolution: 'review_required',
    });
  }
  return conflicts;
}

function mergeEvidence(
  existing: Record<string, EvidenceBoundSpec> | undefined,
  incoming: Record<string, EvidenceBoundSpec> | undefined,
  conflicts: ProductSpecConflictLogEntry[],
): Record<string, EvidenceBoundSpec> {
  const conflictFields = new Set(conflicts.map((conflict) => conflict.field));
  const merged = { ...(existing ?? {}) };
  for (const [key, incomingSpec] of Object.entries(incoming ?? {})) {
    if (conflictFields.has(key) && merged[key]) {
      merged[key] = { ...merged[key], status: 'conflicting' };
      continue;
    }
    if (merged[key]?.status === 'verified' && incomingSpec.status !== 'verified') continue;
    merged[key] = incomingSpec;
  }
  return merged;
}

function normalizeIncomingProducts(rawProducts: unknown): FpvCatalogProduct[] {
  if (Array.isArray(rawProducts)) return normalizeCrawlerCatalog({ products: rawProducts });
  return normalizeCrawlerCatalog(rawProducts);
}

function normalizeIdentityPart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, '-');
}

function productKey(product: FpvCatalogProduct): string {
  const sku = stringSpec(product, 'sku') || stringSpec(product, 'model');
  if (sku) return `sku:${normalizeIdentityPart(product.brand)}:${normalizeIdentityPart(sku)}`;
  if (product.brand && product.name && product.type) {
    return `identity:${normalizeIdentityPart(product.brand)}:${normalizeIdentityPart(product.name)}:${product.type}`;
  }
  return product.url || product.id;
}

export function prepareCatalogProductForIngestion(product: FpvCatalogProduct): FpvCatalogProduct {
  return {
    ...product,
    trustStatus: safeTrustStatus(product),
    specs: mergeSpecs(product),
    conflictLog: product.conflictLog ?? [],
  };
}

export function mergeCatalogProduct(
  existing: FpvCatalogProduct | undefined,
  incoming: FpvCatalogProduct,
  detectedAt = new Date().toISOString(),
): { product: FpvCatalogProduct; conflicts: number } {
  const normalizedIncoming: FpvCatalogProduct = {
    ...incoming,
    trustStatus: safeTrustStatus(incoming),
    specs: mergeSpecs(incoming),
  };

  if (!existing) {
    const product = {
      ...normalizedIncoming,
      trustStatus: normalizedIncoming.trustStatus === 'VERIFIED' ? 'QUARANTINE' : normalizedIncoming.trustStatus,
      conflictLog: normalizedIncoming.conflictLog ?? [],
    };
    return { product, conflicts: 0 };
  }

  const normalizedExisting: FpvCatalogProduct = {
    ...existing,
    trustStatus: safeTrustStatus(existing),
    specs: mergeSpecs(existing),
  };
  const conflicts = detectConflicts(normalizedExisting, normalizedIncoming, detectedAt);
  const evidenceSpecs = mergeEvidence(normalizedExisting.evidenceSpecs, normalizedIncoming.evidenceSpecs, conflicts);
  const merged: FpvCatalogProduct = {
    ...normalizedExisting,
    ...normalizedIncoming,
    evidenceSpecs,
    conflictLog: [...(normalizedExisting.conflictLog ?? []), ...conflicts],
  };
  merged.specs = mergeSpecs(merged);
  merged.trustStatus = conflicts.length
    ? 'REVIEW_REQUIRED'
    : normalizedExisting.trustStatus === 'VERIFIED' && hasVerifiedEvidence(merged)
      ? 'VERIFIED'
      : safeTrustStatus(merged, normalizedExisting.trustStatus);
  return { product: merged, conflicts: conflicts.length };
}

export function prepareCrawlerProductIngestion(
  existingProducts: FpvCatalogProduct[],
  rawIncomingProducts: unknown,
  detectedAt = new Date().toISOString(),
): ProductCatalogIngestionResult {
  const incomingProducts = normalizeIncomingProducts(rawIncomingProducts);
  const byKey = new Map<string, FpvCatalogProduct>();

  for (const product of existingProducts) {
    byKey.set(productKey(product), {
      ...product,
      trustStatus: safeTrustStatus(product),
      specs: mergeSpecs(product),
    });
  }

  let conflicts = 0;
  for (const product of incomingProducts) {
    const key = productKey(product);
    const before = byKey.get(key);
    const merged = mergeCatalogProduct(before, product, detectedAt);
    conflicts += merged.conflicts;
    byKey.set(key, merged.product);
  }

  const products = [...byKey.values()];
  return {
    products,
    stats: {
      received: incomingProducts.length,
      accepted: incomingProducts.length,
      quarantined: products.filter((product) => safeTrustStatus(product) === 'QUARANTINE').length,
      reviewRequired: products.filter((product) => safeTrustStatus(product) === 'REVIEW_REQUIRED').length,
      conflicts,
    },
  };
}

export function mergeCrawlerProductCatalog(
  existingProducts: FpvCatalogProduct[],
  rawIncomingProducts: unknown,
  detectedAt = new Date().toISOString(),
): ProductCatalogIngestionResult {
  return prepareCrawlerProductIngestion(existingProducts, rawIncomingProducts, detectedAt);
}

function slugifyProduct(product: FpvCatalogProduct): string {
  const base = product.url || `${product.brand}-${product.name}`;
  return base
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || product.id;
}

function numberSpec(product: FpvCatalogProduct, key: string): number | null {
  const value = product.specs[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stringSpec(product: FpvCatalogProduct, key: string): string | null {
  const value = product.specs[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export async function upsertProductsToCommerceDb(
  client: ProductCatalogDbClient,
  products: FpvCatalogProduct[],
): Promise<{ upserted: number }> {
  const preparedProducts = prepareCrawlerProductIngestion([], products).products;
  let upserted = 0;
  for (const product of preparedProducts) {
    const specsPayload = {
      ...product.specs,
      evidenceSpecs: product.evidenceSpecs ?? {},
      provenance: product.provenance,
    };
    const result = await client.query(
      `
        INSERT INTO fpvlovers_commerce.products (
          slug, name, brand, category, status, specs, source_confidence, trust_status,
          conflict_log, max_cell_count, mounting_pattern, motor_kv, esc_continuous_amp,
          prop_diameter, connector, updated_at
        )
        VALUES ($1, $2, $3, $4, 'draft', $5::jsonb, $6, $7, $8::jsonb, $9, $10, $11, $12, $13, $14, NOW())
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          brand = EXCLUDED.brand,
          category = EXCLUDED.category,
          specs = EXCLUDED.specs,
          source_confidence = EXCLUDED.source_confidence,
          trust_status = EXCLUDED.trust_status,
          conflict_log = EXCLUDED.conflict_log,
          max_cell_count = EXCLUDED.max_cell_count,
          mounting_pattern = EXCLUDED.mounting_pattern,
          motor_kv = EXCLUDED.motor_kv,
          esc_continuous_amp = EXCLUDED.esc_continuous_amp,
          prop_diameter = EXCLUDED.prop_diameter,
          connector = EXCLUDED.connector,
          updated_at = NOW()
      `,
      [
        slugifyProduct(product),
        product.name,
        product.brand,
        product.category,
        JSON.stringify(specsPayload),
        product.provenance?.extractionConfidence ?? null,
        safeTrustStatus(product),
        JSON.stringify(product.conflictLog ?? []),
        numberSpec(product, 'cellCount'),
        stringSpec(product, 'mount'),
        numberSpec(product, 'kv'),
        numberSpec(product, 'escAmp'),
        numberSpec(product, 'propSize'),
        stringSpec(product, 'connector'),
      ],
    );
    upserted += result.rowCount ?? 0;
  }
  return { upserted };
}

export async function upsertCatalogProductsToDb(
  client: ProductCatalogDbClient,
  products: FpvCatalogProduct[],
): Promise<{ upserted: number }> {
  return upsertProductsToCommerceDb(client, products);
}
