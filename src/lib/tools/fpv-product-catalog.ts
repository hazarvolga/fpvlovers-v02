import fs from 'fs';
import path from 'path';
import { getCrawlerProductCatalog } from '@/lib/tools/crawler-product-catalog';
import type { FpvCatalogProduct, FpvProductType, ProductSpecValue } from '@/lib/tools/fpv-product-types';

type AffiliateProduct = {
  id: string;
  name: string;
  type: string;
  network: string;
  url: string;
  price: number;
  currency: string;
  category: string;
  keywords: string[];
  trustScore: number;
  image: string;
  compatibleWith: string[];
  active: boolean;
};

type ProductOverride = {
  brand?: string;
  type?: FpvProductType;
  specs?: Record<string, ProductSpecValue>;
  tags?: string[];
  fit?: Partial<FpvCatalogProduct['fit']>;
};

const DATA = (file: string) => path.join(process.cwd(), 'data', file);
const CRAWLER_CATALOG_FILE = DATA('fpv-products.catalog.json');
const AFFILIATE_CATALOG_FILE = DATA('affiliates.json');

let catalogCache: {
  affiliateMtime: number;
  crawlerMtime: number;
  products: FpvCatalogProduct[];
} | undefined;

const PRODUCT_OVERRIDES: Record<string, ProductOverride> = {
  aff_tbs_source_one: {
    brand: 'TBS',
    specs: { weight: 125, propSize: 5, wheelbase: 220, stackMount: '30x30', motorMount: '16x16' },
    tags: ['budget', 'freestyle', '5-inch'],
    fit: { styles: ['freestyle'], propSizes: [5], stackMount: '30x30', motorMount: '16x16' },
  },
  aff_geprc_mark5: {
    brand: 'GEPRC',
    specs: { weight: 142, propSize: 5, wheelbase: 225, stackMount: '30x30', motorMount: '16x16' },
    tags: ['hd', 'freestyle', 'deadcat', '5-inch'],
    fit: { styles: ['freestyle', 'cinematic'], propSizes: [5], stackMount: '30x30', motorMount: '16x16' },
  },
  aff_xing2_2207: {
    brand: 'iFlight',
    specs: { stator: '2207', kv: 1850, weight: 32.8, thrust: 1700, propSize: 5, cellCounts: [6] },
    tags: ['freestyle', '6s', '5-inch'],
    fit: { styles: ['freestyle', 'cinematic'], cellCounts: [6], propSizes: [5], motorMount: '16x16' },
  },
  aff_emax_eco2: {
    brand: 'EMAX',
    specs: { stator: '2306', kv: 1900, weight: 30.2, thrust: 1580, propSize: 5, cellCounts: [6] },
    tags: ['budget', 'freestyle', '6s', '5-inch'],
    fit: { styles: ['freestyle'], cellCounts: [6], propSizes: [5], motorMount: '16x16' },
  },
  aff_betaflight_f7: {
    brand: 'Betaflight',
    type: 'stack',
    specs: { fc: 'F7', escAmp: 50, maxCells: 6, stackMount: '30x30', gyro: 'MPU6000-class' },
    tags: ['stack', '6s', 'freestyle'],
    fit: { styles: ['freestyle', 'racing', 'cinematic'], cellCounts: [4, 6], stackMount: '30x30' },
  },
  aff_rdq_ethix: {
    brand: 'Ethix',
    specs: { diameter: 5, pitch: 3.7, blades: 3, weight: 4.4 },
    tags: ['freestyle', '5-inch', 'prop'],
    fit: { styles: ['freestyle'], propSizes: [5] },
  },
  aff_rdq_cnhl: {
    brand: 'CNHL',
    specs: { cellCount: 6, capacityMah: 1300, cRating: 100, weight: 220 },
    tags: ['6s', 'freestyle', 'battery'],
    fit: { styles: ['freestyle', 'racing'], cellCounts: [6] },
  },
  aff_dji_o4_pro: {
    brand: 'DJI',
    type: 'video',
    specs: { protocol: 'DJI O4', weight: 32, resolution: '4K', latencyMs: 15 },
    tags: ['digital', 'hd', 'cinematic'],
    fit: { styles: ['freestyle', 'cinematic'], protocols: ['dji'] },
  },
  aff_foxeer_predator: {
    brand: 'Foxeer',
    specs: { protocol: 'Analog', weight: 8.8, format: 'micro', latencyMs: 4 },
    tags: ['analog', 'camera', 'racing'],
    fit: { styles: ['freestyle', 'racing'], protocols: ['analog'] },
  },
  aff_rush_tank_vtx: {
    brand: 'RushFPV',
    specs: { protocol: 'Analog', weight: 8.5, powerMw: 800 },
    tags: ['analog', 'vtx', 'long-range'],
    fit: { styles: ['freestyle', 'longRange'], protocols: ['analog'] },
  },
  aff_happymodel_elrs: {
    brand: 'Happymodel',
    specs: { protocol: 'ELRS', weight: 0.7, band: '2.4GHz' },
    tags: ['elrs', 'receiver', 'lightweight'],
    fit: { styles: ['freestyle', 'racing', 'longRange', 'whoop'], protocols: ['elrs'] },
  },
  aff_rdq_crossfire: {
    brand: 'TBS',
    specs: { protocol: 'Crossfire', weight: 1.1, band: '900MHz' },
    tags: ['crossfire', 'receiver', 'long-range'],
    fit: { styles: ['longRange', 'cinematic'], protocols: ['crossfire'] },
  },
  aff_dji_goggles_2: {
    brand: 'DJI',
    specs: { protocol: 'DJI', screens: 'OLED', latencyMs: 30 },
    tags: ['digital', 'goggles'],
    fit: { styles: ['freestyle', 'cinematic'], protocols: ['dji'] },
  },
  aff_dji_rc3: {
    brand: 'DJI',
    specs: { protocol: 'DJI', weight: 320 },
    tags: ['radio', 'digital'],
    fit: { styles: ['cinematic'], protocols: ['dji'] },
  },
  aff_betafpv_starter: {
    brand: 'BETAFPV',
    specs: { class: 'whoop', cellCount: 1, weight: 33 },
    tags: ['beginner', 'whoop', 'kit'],
    fit: { styles: ['whoop'], cellCounts: [1] },
  },
};

function isAffiliateProduct(value: unknown): value is AffiliateProduct {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.type === 'string' &&
    typeof candidate.network === 'string' &&
    typeof candidate.url === 'string' &&
    typeof candidate.price === 'number' &&
    typeof candidate.currency === 'string' &&
    typeof candidate.category === 'string' &&
    Array.isArray(candidate.keywords) &&
    Array.isArray(candidate.compatibleWith) &&
    typeof candidate.active === 'boolean'
  );
}

function normalizeType(type: string): FpvProductType | null {
  const normalized = type.toLowerCase();
  if (normalized === 'fc-esc') return 'stack';
  if (normalized === 'vtx-camera') return 'video';
  if (normalized === 'rtf-kit') return 'kit';
  if (normalized === 'goggles') return 'goggles';
  if (normalized === 'frame') return 'frame';
  if (normalized === 'motor') return 'motor';
  if (normalized === 'prop') return 'prop';
  if (normalized === 'battery') return 'battery';
  if (normalized === 'camera') return 'camera';
  if (normalized === 'vtx') return 'vtx';
  if (normalized === 'receiver') return 'receiver';
  if (normalized === 'radio') return 'radio';
  return null;
}

function inferBrand(name: string): string {
  return name.split(' ')[0]?.replace(/[^a-z0-9]/gi, '') || 'FPV';
}

function cleanImageUrl(image: string): string | undefined {
  if (!image || image.includes('placeholder.com')) return undefined;
  return image;
}

function fileMtime(file: string): number {
  try {
    return fs.statSync(file).mtimeMs;
  } catch {
    return 0;
  }
}

function readAffiliateCatalog(): AffiliateProduct[] {
  try {
    const raw = JSON.parse(fs.readFileSync(AFFILIATE_CATALOG_FILE, 'utf-8')) as unknown;
    return Array.isArray(raw) ? raw.filter(isAffiliateProduct) : [];
  } catch {
    return [];
  }
}

export function getFpvProductCatalog(): FpvCatalogProduct[] {
  const affiliateMtime = fileMtime(AFFILIATE_CATALOG_FILE);
  const crawlerMtime = fileMtime(CRAWLER_CATALOG_FILE);
  if (catalogCache?.affiliateMtime === affiliateMtime && catalogCache.crawlerMtime === crawlerMtime) {
    return catalogCache.products;
  }

  const catalog: FpvCatalogProduct[] = [...getCrawlerProductCatalog()];
  const existingKeys = new Set(catalog.map((product) => product.url));

  for (const product of readAffiliateCatalog().filter((item) => item.active)) {
      const override = PRODUCT_OVERRIDES[product.id] || {};
      const type = override.type || normalizeType(product.type);
      if (!type) continue;
      if (existingKeys.has(product.url)) continue;

      const fit = {
        styles: override.fit?.styles || ['freestyle'],
        cellCounts: override.fit?.cellCounts,
        propSizes: override.fit?.propSizes,
        protocols: override.fit?.protocols,
        stackMount: override.fit?.stackMount,
        motorMount: override.fit?.motorMount,
      };

      catalog.push({
        id: product.id,
        name: product.name,
        brand: override.brand || inferBrand(product.name),
        type,
        category: product.category,
        sourceNetwork: product.network,
        url: product.url,
        price: product.price,
        currency: product.currency,
        trustScore: product.trustScore || 80,
        keywords: product.keywords.filter((keyword): keyword is string => typeof keyword === 'string'),
        compatibleWith: product.compatibleWith.filter((item): item is string => typeof item === 'string'),
        tags: [...new Set([...(override.tags || []), ...product.keywords])],
        specs: override.specs || {},
        fit,
        imageUrl: cleanImageUrl(product.image),
        provenance: {
          source: 'affiliate-seed',
          sourceUrl: product.url,
          imageSourceUrl: cleanImageUrl(product.image),
        },
      });
      existingKeys.add(product.url);
    }

  const products = catalog.sort((a, b) => {
    const crawlerPriority = (b.provenance?.source === 'crawler' ? 1 : 0) - (a.provenance?.source === 'crawler' ? 1 : 0);
    return crawlerPriority || b.trustScore - a.trustScore || a.price - b.price;
  });

  catalogCache = { affiliateMtime, crawlerMtime, products };
  return products;
}

export function getFpvProductsByType(type: FpvProductType): FpvCatalogProduct[] {
  return getFpvProductCatalog().filter((product) => product.type === type);
}
