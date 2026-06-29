import { createHash } from 'crypto';
import type { FpvCatalogProduct, FpvProductType, ProductSpecValue } from '@/lib/tools/fpv-product-types';
import type { EvidenceBoundSpec, SpecSourceType } from '@/lib/types/spec-trust';
import { evidenceBoundSpecSchema } from '@/lib/types/spec-trust';

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

type ParsedSpecs = {
  specs: Record<string, ProductSpecValue>;
  evidenceSpecs: Record<string, EvidenceBoundSpec>;
  issues: string[];
};

const MANUFACTURER_DOMAINS = [
  'betafpv.com', 'cnhl.com', 'dji.com', 'emax-usa.com', 'foxeer.com', 'geprc.com',
  'hd-zero.com', 'hglrc.com', 'iflight-rc.com', 'team-blacksheep.com', 'walksnail.com',
];
const RETAILER_DOMAINS = ['getfpv.com', 'pyrodrone.com', 'racedayquads.com'];

function hostMatches(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

function classifySourceType(sourceUrl: string): SpecSourceType {
  try {
    const url = new URL(sourceUrl);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const manufacturer = MANUFACTURER_DOMAINS.some((domain) => hostMatches(host, domain));
    if (manufacturer && /\.pdf$/i.test(url.pathname)) return 'manual';
    if (manufacturer) return 'manufacturer';
    if (RETAILER_DOMAINS.some((domain) => hostMatches(host, domain))) return 'retailer';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

function parseSpecs(text: string, sourceUrl: string, observedAt?: string): ParsedSpecs {
  const specs: Record<string, ProductSpecValue> = {};
  const evidenceSpecs: Record<string, EvidenceBoundSpec> = {};
  const issues: string[] = [];
  const sourceType = classifySourceType(sourceUrl);
  let evidenceSourceUrl: string | undefined;
  try {
    const parsed = new URL(sourceUrl);
    if (/^https?:$/.test(parsed.protocol)) evidenceSourceUrl = parsed.toString();
  } catch {
    evidenceSourceUrl = undefined;
  }

  const add = (key: string, value: ProductSpecValue, unit: string | null, rawValue: string) => {
    if (!evidenceSourceUrl) {
      issues.push(`invalid_evidence_source:${sourceUrl}`);
      return;
    }
    const parsedEvidence = evidenceBoundSpecSchema.safeParse({
      value, unit, sourceUrls: [evidenceSourceUrl], sourceType, confidence: 0.82,
      extractionMethod: 'regex', status: 'unverified', ...(observedAt ? { observedAt } : {}), rawValue,
    });
    if (!parsedEvidence.success) {
      issues.push(`invalid_evidence:${key}`);
      return;
    }
    specs[key] = value;
    evidenceSpecs[key] = parsedEvidence.data;
  };
  const numeric = (
    key: string,
    regex: RegExp,
    unit: string,
    min: number,
    max: number,
    reasonKey = key,
  ) => {
    const match = regex.exec(text);
    if (!match) return;
    const value = Number(match[1]);
    const matchedUnit = match[2] || unit;
    const separator = /^(?:g|inch|in)$/i.test(matchedUnit) ? ' ' : '';
    const rawValue = `${match[1]}${separator}${matchedUnit}`;
    if (!Number.isFinite(value) || value < min || value > max) {
      issues.push(`${reasonKey}_out_of_range:${rawValue}`);
      return;
    }
    add(key, value, unit, rawValue);
  };

  numeric('kv', /\b(?:motor\s+kv|kv)\s*[:=-]\s*(\d{1,9})(?!\d)\s*(KV)\b/i, 'KV', 100, 50_000, 'kv');
  numeric('escAmp', /\b(?:continuous(?:\s+current)?|esc(?:\s+continuous)?(?:\s+current)?)\s*[:=-]\s*(\d{1,9})(?!\d)\s*(A)\b/i, 'A', 1, 500, 'escAmp');
  numeric('capacityMah', /\b(?:capacity)\s*[:=-]\s*(\d{1,9})(?!\d)\s*(mAh)\b/i, 'mAh', 50, 100_000);
  numeric('cellCount', /\b(?:cell(?:\s+count)?|battery)\s*[:=-]\s*(\d{1,9})(?!\d)\s*(S)\b/i, 'S', 1, 8, 'cellCount');
  numeric('propSize', /\b(?:prop(?:eller)?(?:\s+(?:size|diameter))?)\s*[:=-]\s*(\d{1,9}(?:\.\d+)?)(?![\d.])\s*(inch|in|")\b/i, 'in', 0.5, 15, 'propSize');
  numeric('weight', /\b(?:weight)\s*[:=-]\s*(\d{1,9}(?:\.\d+)?)(?![\d.])\s*(g)\b/i, 'g', 0.1, 5_000, 'weight');

  const mount = /\b(?:mount(?:ing)?(?:\s+pattern)?)\s*[:=-]\s*(\d{1,3}(?:\.\d+)?\s*x\s*\d{1,3}(?:\.\d+)?)\s*(?:mm)?\b/i.exec(text);
  if (mount) {
    const normalized = mount[1].replace(/\s+/g, '').toLowerCase();
    const allowed = new Set(['12x12', '16x16', '20x20', '25.5x25.5', '30x30']);
    if (allowed.has(normalized)) add('mount', normalized, 'mm', `${normalized} mm`);
    else issues.push(`mount_out_of_range:${normalized} mm`);
  }

  for (const [key, regex] of [
    ['connector', /\bconnector\s*[:=-]\s*([A-Za-z0-9][A-Za-z0-9+._/-]{1,30})\b/i],
    ['protocol', /\bprotocol\s*[:=-]\s*(DJI|O3|O4|HDZero|Walksnail|Analog|ELRS|Crossfire|Tracer)\b/i],
    ['firmware', /\bfirmware\s*[:=-]\s*([A-Za-z0-9][A-Za-z0-9+._/-]{1,40})\b/i],
  ] as const) {
    const match = regex.exec(text);
    if (match?.[1]) add(key, match[1], null, match[1]);
  }

  for (const [key, regex, unit] of [
    ['kv', /\b(?:motor\s+kv|kv)\s*[:=-]\s*\d+(?!\s*KV\b)/i, 'KV'],
    ['escAmp', /\b(?:continuous(?:\s+current)?|esc(?:\s+continuous)?(?:\s+current)?)\s*[:=-]\s*\d+(?!\s*A\b)/i, 'A'],
  ] as const) {
    if (!(key in specs) && regex.test(text)) issues.push(`${key}_missing_unit:${unit}`);
  }

  return { specs, evidenceSpecs, issues };
}

function parseFit(type: FpvProductType, text: string, specs: Record<string, ProductSpecValue>): FpvCatalogProduct['fit'] {
  const cellCounts = typeof specs.cellCount === 'number' ? [specs.cellCount] : undefined;
  const propSizes = typeof specs.propSize === 'number'
    ? [specs.propSize]
    : undefined;
  const mount = typeof specs.mount === 'string' ? specs.mount : undefined;
  const protocol = typeof specs.protocol === 'string' ? specs.protocol : undefined;

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

      const contextLines = [line.replace(match[0], '')];
      for (let offset = index + 1; offset < lines.length && offset <= index + 6; offset++) {
        const nextLine = lines[offset] || '';
        if (/^(?:\s*[-*+]\s*)?\[[^\]]+\]\([^)]+\)/.test(nextLine)) break;
        if (!nextLine.trim()) break;
        contextLines.push(nextLine);
      }
      const context = cleanText(contextLines.join(' '));

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

function normalizeProduct(candidate: LinkCandidate, input: ExtractionInput): { product?: FpvCatalogProduct; reason?: string } {
  const text = `${candidate.name} ${candidate.context}`;
  if (!looksLikeProduct(candidate.name, candidate.context, input.productTypes || [])) return {};

  const type = inferType(text, input.productTypes);
  if (!type) return {};

  const price = parsePrice(text);
  const parsedSpecs = parseSpecs(candidate.context, input.url, input.crawledAt);
  if (parsedSpecs.issues.length) return { reason: parsedSpecs.issues[0] };
  const { specs, evidenceSpecs } = parsedSpecs;
  const brand = inferBrand(candidate.name);
  const keywords = [...new Set([
    brand.toLowerCase(),
    type,
    ...cleanText(candidate.name).toLowerCase().split(/\s+/).filter((word) => word.length > 2).slice(0, 8),
  ])];

  return { product: {
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
    evidenceSpecs,
    trustStatus: 'QUARANTINE',
    fit: parseFit(type, text, specs),
    imageUrl: candidate.imageUrl,
    provenance: {
      source: 'crawler',
      sourceUrl: input.url,
      imageSourceUrl: candidate.imageUrl,
      crawledAt: input.crawledAt || new Date().toISOString(),
      extractionConfidence: candidate.imageUrl ? 0.72 : 0.58,
    },
  } };
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
    const normalized = normalizeProduct(candidate, input);
    if (normalized.product) {
      products.push(normalized.product);
    } else {
      rejected.push({ name: candidate.name, reason: normalized.reason || 'not_product_or_low_signal' });
    }
  }

  return { products, rejected };
}
