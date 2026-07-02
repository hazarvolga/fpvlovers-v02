import fs from 'fs';
import path from 'path';
import type {
  FpvCatalogProduct,
  FpvProductType,
  ProductSpecConflictLogEntry,
  ProductSpecValue,
} from '@/lib/tools/fpv-product-types';
import {
  evidenceBoundSpecSchema,
  productSpecConflictLogEntrySchema,
  productReviewMetadataSchema,
  productTrustStatusSchema,
} from '@/lib/types/spec-trust';
import type { EvidenceBoundSpec } from '@/lib/types/spec-trust';

type RawProductRecord = Record<string, unknown>;

const CATALOG_FILE = path.join(process.cwd(), 'data', 'fpv-products.catalog.json');

const PRODUCT_TYPES = new Set<FpvProductType>([
  'frame',
  'motor',
  'prop',
  'battery',
  'stack',
  'camera',
  'vtx',
  'video',
  'receiver',
  'radio',
  'goggles',
  'kit',
]);

function asRecord(value: unknown): RawProductRecord | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as RawProductRecord
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())
    : [];
}

function asNumberArray(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const numbers = value.filter((item): item is number => typeof item === 'number' && Number.isFinite(item));
  return numbers.length ? numbers : undefined;
}

function asSpecValue(value: unknown): ProductSpecValue | undefined {
  if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return asNumberArray(value);
}

function asSpecs(value: unknown): Record<string, ProductSpecValue> {
  const record = asRecord(value);
  if (!record) return {};

  return Object.entries(record).reduce<Record<string, ProductSpecValue>>((specs, [key, specValue]) => {
    const parsed = asSpecValue(specValue);
    if (parsed !== undefined) specs[key] = parsed;
    return specs;
  }, {});
}

function asEvidenceSpecs(value: unknown): { specs: Record<string, EvidenceBoundSpec>; malformed: boolean } {
  const record = asRecord(value);
  if (!record) return { specs: {}, malformed: value !== undefined };
  let malformed = false;
  const specs = Object.entries(record).reduce<Record<string, EvidenceBoundSpec>>((result, [key, candidate]) => {
    const parsed = evidenceBoundSpecSchema.safeParse(candidate);
    if (parsed.success) result[key] = parsed.data;
    else malformed = true;
    return result;
  }, {});
  return { specs, malformed };
}

function asConflictLog(value: unknown): ProductSpecConflictLogEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const parsed = productSpecConflictLogEntrySchema.safeParse(entry);
    return parsed.success ? [parsed.data] : [];
  });
}

function asProductType(value: unknown): FpvProductType | undefined {
  const type = asString(value);
  return type && PRODUCT_TYPES.has(type as FpvProductType) ? type as FpvProductType : undefined;
}

function asFit(value: unknown): FpvCatalogProduct['fit'] {
  const record = asRecord(value) || {};
  return {
    styles: asStringArray(record.styles).length ? asStringArray(record.styles) : ['freestyle'],
    cellCounts: asNumberArray(record.cellCounts),
    propSizes: asNumberArray(record.propSizes),
    protocols: asStringArray(record.protocols).length ? asStringArray(record.protocols) : undefined,
    stackMount: asString(record.stackMount),
    motorMount: asString(record.motorMount),
  };
}

function cleanImageUrl(value: unknown): string | undefined {
  const image = asString(value);
  if (!image || image.includes('placeholder.com') || image.includes('unsplash.com')) return undefined;
  return image;
}

function mapCategoryToType(category: string | undefined): FpvProductType | undefined {
  if (!category) return undefined;
  const lower = category.toLowerCase();
  if (lower.includes('motor')) return 'motor';
  if (lower.includes('frame')) return 'frame';
  if (lower.includes('video') || lower.includes('vtx')) return 'video';
  if (lower.includes('receiver') || lower.includes('rx')) return 'receiver';
  if (lower.includes('battery') || lower.includes('lipo')) return 'battery';
  if (lower.includes('flight controller') || lower.includes('esc') || lower.includes('stack')) return 'stack';
  if (lower.includes('transmitter') || lower.includes('radio')) return 'radio';
  if (lower.includes('prop')) return 'prop';
  if (lower.includes('goggle')) return 'goggles';
  if (lower.includes('camera')) return 'camera';
  return undefined;
}

function normalizeTrustStatus(
  rawStatus: unknown,
  evidence: { specs: Record<string, EvidenceBoundSpec>; malformed: boolean },
): FpvCatalogProduct['trustStatus'] {
  const parsedTrustStatus = productTrustStatusSchema.safeParse(rawStatus);
  if (!parsedTrustStatus.success || evidence.malformed) return 'QUARANTINE';

  const evidenceValues = Object.values(evidence.specs);
  if (!evidenceValues.length) return 'QUARANTINE';

  if (parsedTrustStatus.data === 'VERIFIED') {
    return evidenceValues.some((spec) => spec.status === 'verified') ? 'VERIFIED' : 'QUARANTINE';
  }

  return parsedTrustStatus.data;
}

function normalizeProduct(value: unknown): FpvCatalogProduct | undefined {
  const record = asRecord(value);
  if (!record) return undefined;

  const id = asString(record.id);
  const name = asString(record.name);
  const rawType = asProductType(record.type);
  const mappedType = mapCategoryToType(asString(record.category));
  const type = rawType || mappedType;
  
  const url = asString(record.url) || asString(record.affiliateUrl);
  if (!id || !name || !type || !url) return undefined;

  const brand = asString(record.brand) || name.split(' ')[0] || 'FPV';
  const sourceUrl = asString(asRecord(record.provenance)?.sourceUrl) || url;
  const imageUrl = cleanImageUrl(record.imageUrl);
  const evidence = asEvidenceSpecs(record.evidenceSpecs);
  const specs = asSpecs(record.specs);
  for (const [key, spec] of Object.entries(evidence.specs)) {
    if (spec.value === null) delete specs[key];
    else specs[key] = spec.value;
  }
  const trustStatus = normalizeTrustStatus(record.trustStatus, evidence);

  return {
    id,
    name,
    brand,
    type,
    category: asString(record.category) || type,
    sourceNetwork: asString(record.sourceNetwork) || 'crawler',
    url,
    price: asNumber(record.price) ?? 0,
    currency: asString(record.currency) || 'USD',
    trustScore: asNumber(record.trustScore) ?? 80,
    keywords: asStringArray(record.keywords),
    compatibleWith: asStringArray(record.compatibleWith),
    tags: asStringArray(record.tags),
    specs,
    evidenceSpecs: evidence.specs,
    trustStatus,
    conflictLog: asConflictLog(record.conflictLog),
    reviewMetadata: productReviewMetadataSchema.safeParse(record.reviewMetadata).success
      ? productReviewMetadataSchema.parse(record.reviewMetadata)
      : undefined,
    fit: asFit(record.fit),
    imageUrl,
    provenance: {
      source: 'crawler',
      sourceUrl,
      imageSourceUrl: cleanImageUrl(asRecord(record.provenance)?.imageSourceUrl) || imageUrl,
      crawledAt: asString(asRecord(record.provenance)?.crawledAt),
      extractionConfidence: asNumber(asRecord(record.provenance)?.extractionConfidence),
    },
  };
}

export function normalizeCrawlerCatalog(value: unknown): FpvCatalogProduct[] {
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value) as unknown;
    } catch {
      return [];
    }
  }
  const raw = asRecord(parsed);
  if (!raw) return [];
  const products = Array.isArray(raw.products) ? raw.products : (Array.isArray(raw.components) ? raw.components : []);
  return products.map(normalizeProduct).filter((product): product is FpvCatalogProduct => Boolean(product));
}

export function getCrawlerProductCatalog(): FpvCatalogProduct[] {
  try {
    if (!fs.existsSync(CATALOG_FILE)) return [];
    const rawText = fs.readFileSync(CATALOG_FILE, 'utf8');
    return normalizeCrawlerCatalog(rawText);
  } catch {
    return [];
  }
}

export function getCrawlerCatalogSummary() {
  const products = getCrawlerProductCatalog();
  return {
    products: products.length,
    realImages: products.filter((product) => Boolean(product.imageUrl)).length,
    source: CATALOG_FILE,
  };
}
