import fs from 'fs';
import path from 'path';
import type { FpvCatalogProduct, FpvProductType, ProductSpecValue } from '@/lib/tools/fpv-product-types';

type RawCrawlerCatalog = {
  generated_at?: unknown;
  source?: unknown;
  products?: unknown;
};

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
  if (!image || image.includes('placeholder.com')) return undefined;
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
    specs: asSpecs(record.specs),
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

export function getCrawlerProductCatalog(): FpvCatalogProduct[] {
  try {
    const raw = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf-8')) as RawCrawlerCatalog & { components?: unknown };
    const products = Array.isArray(raw.products) ? raw.products : (Array.isArray(raw.components) ? raw.components : []);
    return products
      .map(normalizeProduct)
      .filter((product): product is FpvCatalogProduct => Boolean(product));
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
