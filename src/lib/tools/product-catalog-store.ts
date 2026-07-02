import fs from 'fs';
import path from 'path';
import type { FpvCatalogProduct } from '@/lib/tools/fpv-product-types';
import { getCrawlerProductCatalog } from '@/lib/tools/crawler-product-catalog';
import { mergeCrawlerProductCatalog } from '@/lib/tools/product-catalog-ingestion';
import { safeReadJson } from '@/lib/utils/json';

type StoredCatalog = {
  generated_at: string;
  source: string;
  products: FpvCatalogProduct[];
};

const CATALOG_FILE = path.join(process.cwd(), 'data', 'fpv-products.catalog.json');

function readExistingCatalogMeta(): Pick<StoredCatalog, 'source'> {
  try {
    const raw = safeReadJson<unknown>(CATALOG_FILE, null);
    const record = raw && typeof raw === 'object' && !Array.isArray(raw)
      ? raw as { source?: unknown }
      : {};
    return {
      source: typeof record.source === 'string' ? record.source : 'crawler-normalized-product-catalog',
    };
  } catch {
    return { source: 'crawler-normalized-product-catalog' };
  }
}

export function writeCrawlerProductCatalog(products: FpvCatalogProduct[]) {
  const meta = readExistingCatalogMeta();
  const sorted = [...products].sort((a, b) => b.trustScore - a.trustScore || a.name.localeCompare(b.name));
  const payload: StoredCatalog = {
    generated_at: new Date().toISOString(),
    source: meta.source,
    products: sorted,
  };

  fs.writeFileSync(CATALOG_FILE, `${JSON.stringify(payload, null, 2)}\n`);
  return payload;
}

export function upsertCrawlerProductCatalog(products: FpvCatalogProduct[]) {
  const merged = mergeCrawlerProductCatalog(getCrawlerProductCatalog(), products);
  return writeCrawlerProductCatalog(merged.products);
}
