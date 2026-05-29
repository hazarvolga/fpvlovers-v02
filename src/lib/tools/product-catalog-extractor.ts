import { createHash } from 'crypto';
import type { FpvCatalogProduct, FpvProductType, ProductSpecValue } from '@/lib/tools/fpv-product-types';

type ExtractionInput = {
  url: string;
  markdown: string;
  sourceName?: string;
  productTypes?: string[];
  crawledAt?: string;
};

type LinkCandidate = {
  name: string;
  url: string;
  context: string;
  imageUrl?: string;
};

type ExtractionResult = {
  products: FpvCatalogProduct[];
  rejected: { name: string; reason: string }[];
};

const TYPE_KEYWORDS: Record<FpvProductType, string[]> = {
  frame: ['frame', 'frames', 'chassis'],
  motor: ['motor', 'motors', 'kv', '2207', '2306', 'stator'],
  prop: ['prop', 'props', 'propeller', 'propellers'],
  battery: ['battery', 'batteries', 'lipo', 'mah', '6s', '4s'],
  stack: ['stack', 'flight controller', 'fc', 'esc', 'aio', 'f7', 'f4'],
  camera: ['camera', 'micro cam', 'nano cam'],
  vtx: ['vtx', 'video transmitter'],
  video: ['digital', 'air unit', 'walksnail', 'hdzero', 'o3', 'o4', 'video system'],
  receiver: ['receiver', 'rx', 'elrs', 'crossfire', 'tracer'],
  radio: ['radio', 'transmitter', 'controller'],
  goggles: ['goggles', 'goggle'],
  kit: ['kit', 'bnf', 'rtf', 'drone', 'quad'],
};

const STYLE_KEYWORDS: Record<string, string[]> = {
  freestyle: ['freestyle', '5 inch', '5"', '5-inch'],
  racing: ['racing', 'race'],
  cinematic: ['cinematic', 'cinewhoop', 'hd'],
  longRange: ['long range', 'long-range', 'lr'],
  whoop: ['whoop', 'tinywhoop', '1s', '2s'],
};

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/\|/g, ' ').trim();
}

function absoluteUrl(url: string, baseUrl: string): string | undefined {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function hashId(url: string): string {
  return `crawler_${createHash('sha1').update(url).digest('hex').slice(0, 16)}`;
}

function inferSourceNetwork(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').split('.')[0] || 'crawler';
  } catch {
    return 'crawler';
  }
}

function inferBrand(name: string): string {
  const cleaned = name.replace(/^\[[^\]]+\]/, '').trim();
  const [first, second] = cleaned.split(/\s+/);
  if (!first) return 'FPV';
  if (/^(tbs|dji|emax|geprc|iflight|cnhl|hglrc|foxeer|betafpv|hdzero)$/i.test(first)) return first;
  if (first.length <= 3 && second) return `${first} ${second}`;
  return first;
}

function inferType(text: string, hints: string[] = []): FpvProductType | undefined {
  const haystack = `${text} ${hints.join(' ')}`.toLowerCase();

  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS) as [FpvProductType, string[]][]) {
    if (keywords.some((keyword) => haystack.includes(keyword))) return type;
  }

  return undefined;
}

function inferStyles(text: string): string[] {
  const haystack = text.toLowerCase();
  const styles = Object.entries(STYLE_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => haystack.includes(keyword)))
    .map(([style]) => style);
  return styles.length ? styles : ['freestyle'];
}

function parsePrice(text: string): number | undefined {
  const price = text.match(/(?:\$|USD\s*)(\d{1,4}(?:[.,]\d{2})?)/i)?.[1];
  if (!price) return undefined;
  const parsed = Number(price.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseSpecs(text: string): Record<string, ProductSpecValue> {
  const specs: Record<string, ProductSpecValue> = {};
  const kv = text.match(/\b(\d{3,5})\s*kv\b/i)?.[1];
  const stator = text.match(/\b(\d{4})\b/)?.[1];
  const amp = text.match(/\b(\d{2,3})\s*a\b/i)?.[1];
  const mah = text.match(/\b(\d{3,5})\s*mah\b/i)?.[1];
  const cell = text.match(/\b([1-8])s\b/i)?.[1];
  const prop = text.match(/\b([1-9](?:\.\d)?)\s*(?:inch|in|")\b/i)?.[1];
  const weight = text.match(/\b(\d{1,4}(?:\.\d+)?)\s*g\b/i)?.[1];
  const mount = text.match(/\b(20x20|25\.5x25\.5|30x30|16x16|12x12)\b/i)?.[1];

  if (kv) specs.kv = Number(kv);
  if (stator) specs.stator = stator;
  if (amp) specs.escAmp = Number(amp);
  if (mah) specs.capacityMah = Number(mah);
  if (cell) specs.cellCount = Number(cell);
  if (prop) specs.propSize = Number(prop);
  if (weight) specs.weight = Number(weight);
  if (mount) specs.mount = mount;

  return specs;
}

function parseFit(type: FpvProductType, text: string): FpvCatalogProduct['fit'] {
  const specs = parseSpecs(text);
  const cellCounts = typeof specs.cellCount === 'number' ? [specs.cellCount] : undefined;
  const propSizes = typeof specs.propSize === 'number'
    ? [specs.propSize]
    : type === 'motor' || type === 'frame' || type === 'prop'
      ? [5]
      : undefined;
  const mount = typeof specs.mount === 'string' ? specs.mount : undefined;
  const protocol = text.match(/\b(DJI|O3|O4|HDZero|Walksnail|Analog|ELRS|Crossfire|Tracer)\b/i)?.[1];

  return {
    styles: inferStyles(text),
    cellCounts,
    propSizes,
    protocols: protocol ? [protocol.toLowerCase()] : undefined,
    stackMount: mount && type === 'stack' ? mount : undefined,
    motorMount: mount && (type === 'frame' || type === 'motor') ? mount : undefined,
  };
}

function looksLikeProduct(name: string, context: string, hints: string[]): boolean {
  const text = `${name} ${context} ${hints.join(' ')}`.toLowerCase();
  if (text.length < 10 || text.length > 420) return false;
  if (/\b(login|account|cart|privacy|warranty|shipping|contact|support|blog|manual|download|category|collection)\b/.test(text)) return false;
  return Boolean(inferType(text, hints));
}

function collectImages(markdown: string, baseUrl: string): Map<string, string> {
  const images = new Map<string, string>();
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = imageRegex.exec(markdown)) !== null) {
    const alt = cleanText(match[1] || '');
    const src = absoluteUrl(match[2] || '', baseUrl);
    if (alt && src && !src.includes('placeholder.com')) images.set(alt.toLowerCase(), src);
  }

  return images;
}

function findBestImage(name: string, images: Map<string, string>): string | undefined {
  const normalizedName = name.toLowerCase();
  for (const [alt, src] of images.entries()) {
    if (normalizedName.includes(alt) || alt.includes(normalizedName.split(' ')[0] || normalizedName)) return src;
  }
  return undefined;
}

function collectLinkCandidates(markdown: string, baseUrl: string, images: Map<string, string>): LinkCandidate[] {
  const lines = markdown.split(/\r?\n/);
  const candidates: LinkCandidate[] = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] || '';
    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(line)) !== null) {
      if (match.index > 0 && line[match.index - 1] === '!') continue;
      const name = cleanText(match[1] || '');
      const url = absoluteUrl(match[2] || '', baseUrl);
      if (!name || !url) continue;

      const context = cleanText([
        lines[index - 1] || '',
        line,
        lines[index + 1] || '',
        lines[index + 2] || '',
      ].join(' '));

      candidates.push({
        name,
        url,
        context,
        imageUrl: findBestImage(name, images),
      });
    }
  }

  return candidates;
}

function normalizeProduct(candidate: LinkCandidate, input: ExtractionInput): FpvCatalogProduct | undefined {
  const text = `${candidate.name} ${candidate.context}`;
  if (!looksLikeProduct(candidate.name, candidate.context, input.productTypes || [])) return undefined;

  const type = inferType(text, input.productTypes);
  if (!type) return undefined;

  const price = parsePrice(text);
  const specs = parseSpecs(text);
  const brand = inferBrand(candidate.name);
  const keywords = [...new Set([
    brand.toLowerCase(),
    type,
    ...cleanText(candidate.name).toLowerCase().split(/\s+/).filter((word) => word.length > 2).slice(0, 8),
  ])];

  return {
    id: hashId(candidate.url),
    name: cleanText(candidate.name),
    brand,
    type,
    category: type,
    sourceNetwork: inferSourceNetwork(candidate.url),
    url: candidate.url,
    price: price ?? 0,
    currency: 'USD',
    trustScore: candidate.imageUrl ? 84 : 78,
    keywords,
    compatibleWith: [],
    tags: [...new Set([type, ...inferStyles(text), ...(input.productTypes || [])])],
    specs,
    fit: parseFit(type, text),
    imageUrl: candidate.imageUrl,
    provenance: {
      source: 'crawler',
      sourceUrl: input.url,
      imageSourceUrl: candidate.imageUrl,
      crawledAt: input.crawledAt || new Date().toISOString(),
      extractionConfidence: candidate.imageUrl ? 0.72 : 0.58,
    },
  };
}

export function extractProductsFromMarkdown(input: ExtractionInput): ExtractionResult {
  const images = collectImages(input.markdown, input.url);
  const candidates = collectLinkCandidates(input.markdown, input.url, images);
  const products: FpvCatalogProduct[] = [];
  const rejected: ExtractionResult['rejected'] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    if (seen.has(candidate.url)) continue;
    seen.add(candidate.url);
    const product = normalizeProduct(candidate, input);
    if (product) {
      products.push(product);
    } else {
      rejected.push({ name: candidate.name, reason: 'not_product_or_low_signal' });
    }
  }

  return { products, rejected };
}
