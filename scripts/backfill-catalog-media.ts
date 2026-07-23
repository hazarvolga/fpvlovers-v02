import fs from 'node:fs';
import path from 'node:path';

type JsonRecord = Record<string, unknown>;

type Product = {
  id: string;
  name: string;
  brand: string;
  type: string;
  category: string;
  url: string;
  imageUrl: string;
  keywords: string[];
  tags: string[];
  provenance?: {
    sourceUrl?: string;
    extractionConfidence?: number;
  };
};

type MediaAsset = {
  src: string;
  alt: string;
  caption?: string;
  source?: string;
  sourceUrl?: string;
  credit?: string;
  license?: string;
  context?: string;
  kind?: 'source-backed' | 'generated-artwork' | 'fallback';
};

type BodySection = {
  id: string;
  title: string;
  content: string;
  imageMatch?: MediaAsset;
};

type PublishedArtifact = {
  slug: string;
  title: string;
  excerpt?: string;
  category?: string;
  metadata?: {
    contentType?: string;
  };
  bodySections?: BodySection[];
  media?: {
    coverImage?: MediaAsset;
    gallery?: MediaAsset[];
    figureCaptions?: string[];
    imageSources?: string[];
    attribution?: string[];
  };
  coverImage?: string;
  sourceReferences?: string[];
  [key: string]: unknown;
};

type ProductScore = {
  product: Product;
  score: number;
};

const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');
const CATALOG_PATH = path.join(process.cwd(), 'data', 'fpv-products.catalog.json');
const GENERATED_COVER_PREFIX = '/api/content/media/cover/';
const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'your', 'you', 'this', 'that', 'from', 'into',
  'what', 'when', 'why', 'which', 'guide', 'guides', 'buying', 'best', 'fpv',
  'drone', 'drones', 'complete', 'beginner', 'beginners', 'explained', 'safe',
  'safety', 'first', 'setup', 'system', 'systems',
]);

const TOPIC_RULES: Array<{
  tokens: string[];
  productTypes: string[];
  categories: string[];
  minimumScore: number;
}> = [
  { tokens: ['propeller', 'propellers', 'props', 'prop'], productTypes: ['prop'], categories: ['Propellers'], minimumScore: 10 },
  { tokens: ['flight', 'controller', 'controllers', 'fc', 'stack'], productTypes: ['stack'], categories: ['Stacks'], minimumScore: 10 },
  { tokens: ['esc', 'blheli', 'current', 'rating', 'firmware'], productTypes: ['stack'], categories: ['Stacks'], minimumScore: 10 },
  { tokens: ['goggles', 'headset', 'analog', 'hdzero'], productTypes: ['goggles'], categories: ['Goggles'], minimumScore: 10 },
  { tokens: ['radio', 'radios', 'elrs', 'transmitter', 'controller'], productTypes: ['radio'], categories: ['Radios'], minimumScore: 10 },
  { tokens: ['battery', 'batteries', 'lipo', 'cells', 'capacity', 'rating'], productTypes: ['battery'], categories: ['Batteries'], minimumScore: 10 },
  { tokens: ['cinewhoop', 'kit', 'indoor', 'real', 'estate'], productTypes: ['kit'], categories: ['Kits', 'Frames'], minimumScore: 10 },
  { tokens: ['o3', 'walksnail', 'avatar', 'digital', 'video'], productTypes: ['video', 'goggles'], categories: ['Digital Systems', 'Goggles', 'Video Transmitters'], minimumScore: 10 },
  { tokens: ['long', 'range', 'gps', 'signal'], productTypes: ['radio', 'receiver', 'battery', 'video'], categories: ['Radios', 'Receivers', 'Batteries', 'Digital Systems'], minimumScore: 9 },
  { tokens: ['racing', 'gear', 'checklist', 'event'], productTypes: ['prop', 'battery', 'radio', 'goggles'], categories: ['Propellers', 'Batteries', 'Radios', 'Goggles'], minimumScore: 9 },
  { tokens: ['toolkit', 'build', 'repair', 'bench'], productTypes: ['stack', 'motor', 'frame', 'battery'], categories: ['Stacks', 'Motors', 'Frames', 'Batteries'], minimumScore: 9 },
];

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : null;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map(asString).filter((item) => item.length > 0)
    : [];
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function normalizeToken(token: string): string {
  return token.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function tokenize(value: string): string[] {
  return normalizeToken(value)
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function tokenSet(value: string): Set<string> {
  return new Set(tokenize(value));
}

function readCatalog(): Product[] {
  const raw = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8')) as unknown;
  const record = asRecord(raw);
  const rows = Array.isArray(record?.products) ? record.products : [];

  return rows.flatMap((row): Product[] => {
    const product = asRecord(row);
    if (!product) return [];

    const id = asString(product.id);
    const name = asString(product.name);
    const brand = asString(product.brand);
    const type = asString(product.type);
    const category = asString(product.category);
    const url = asString(product.url);
    const imageUrl = asString(product.imageUrl);
    const provenance = asRecord(product.provenance);
    if (!id || !name || !brand || !type || !category || !isHttpUrl(url) || !isHttpUrl(imageUrl)) {
      return [];
    }

    return [{
      id,
      name,
      brand,
      type,
      category,
      url,
      imageUrl,
      keywords: asStringArray(product.keywords),
      tags: asStringArray(product.tags),
      provenance: provenance ? {
        sourceUrl: asString(provenance.sourceUrl) || undefined,
        extractionConfidence: typeof provenance.extractionConfidence === 'number'
          ? provenance.extractionConfidence
          : undefined,
      } : undefined,
    }];
  });
}

function artifactHaystack(article: PublishedArtifact): string {
  return [
    article.slug,
    article.title,
    article.excerpt || '',
    article.category || '',
    ...(article.bodySections || []).map((section) => `${section.title} ${section.content.slice(0, 900)}`),
  ].join(' ');
}

function topicHaystack(article: PublishedArtifact): string {
  return [
    article.slug,
    article.title,
    article.excerpt || '',
    article.category || '',
    article.metadata?.contentType || '',
  ].join(' ');
}

function commercialBackfillEligible(article: PublishedArtifact): boolean {
  const intent = normalizeToken(topicHaystack(article));
  const contentType = article.metadata?.contentType || '';
  const category = article.category || '';

  if (contentType === 'review' || category === 'Reviews') return false;
  if (contentType === 'news') return false;
  if (category === 'Racing' && !intent.includes('racing gear checklist')) return false;

  return /\b(buying|buyer|comparison|starter|toolkit|guide|checklist|setup|lipo|battery|propeller|props|goggles|radio|cinewhoop|long range|esc|flight controller|walksnail|avatar|o3)\b/.test(intent);
}

function matchingRules(article: PublishedArtifact) {
  const topic = normalizeToken(topicHaystack(article));
  if (topic.includes('fpv drones for beginners') || topic.includes('drones for beginners')) {
    return TOPIC_RULES.filter((rule) => rule.categories.includes('Kits'));
  }

  const topicTokens = tokenSet(topicHaystack(article));
  const ranked = TOPIC_RULES
    .map((rule) => ({
      rule,
      hits: rule.tokens.filter((token) => topicTokens.has(token)).length,
    }))
    .filter(({ hits }) => hits > 0)
    .sort((a, b) => b.hits - a.hits);

  if (ranked.length === 0) return [];
  const bestHits = ranked[0].hits;
  return ranked.filter(({ hits }) => hits === bestHits).map(({ rule }) => rule);
}

function scoreProduct(product: Product, haystackTokens: Set<string>, rules: typeof TOPIC_RULES): number {
  const productTokens = tokenSet([
    product.id,
    product.name,
    product.brand,
    product.type,
    product.category,
    ...product.keywords,
    ...product.tags,
  ].join(' '));

  let score = 0;
  for (const token of productTokens) {
    if (haystackTokens.has(token)) score += 2;
  }

  if (haystackTokens.has(product.brand.toLowerCase())) score += 5;
  if (haystackTokens.has(product.type.toLowerCase())) score += 4;

  for (const rule of rules) {
    if (rule.productTypes.includes(product.type)) score += 8;
    if (rule.categories.includes(product.category)) score += 8;
  }

  if (product.provenance?.extractionConfidence && product.provenance.extractionConfidence >= 0.9) {
    score += 2;
  }

  return score;
}

function selectProducts(article: PublishedArtifact, products: Product[]): Product[] {
  const haystackTokens = tokenSet(artifactHaystack(article));
  const rules = matchingRules(article);
  if (rules.length === 0) return [];

  const minimumScore = Math.min(...rules.map((rule) => rule.minimumScore));
  const seenImages = new Set<string>();
  const allowedTypes = new Set(rules.flatMap((rule) => rule.productTypes));
  const allowedCategories = new Set(rules.flatMap((rule) => rule.categories));

  return products
    .filter((product) => allowedTypes.has(product.type) || allowedCategories.has(product.category))
    .map((product): ProductScore => ({ product, score: scoreProduct(product, haystackTokens, rules) }))
    .filter(({ score }) => score >= minimumScore)
    .sort((a, b) => b.score - a.score)
    .flatMap(({ product }) => {
      if (seenImages.has(product.imageUrl)) return [];
      seenImages.add(product.imageUrl);
      return [product];
    })
    .slice(0, 4);
}

function productToMediaAsset(product: Product, article: PublishedArtifact): MediaAsset {
  const provenanceUrl = product.provenance?.sourceUrl && isHttpUrl(product.provenance.sourceUrl)
    ? product.provenance.sourceUrl
    : product.url;

  return {
    src: product.imageUrl,
    alt: product.name,
    caption: `${product.name} catalog image used as source-backed visual context for ${article.title}.`,
    source: product.brand,
    sourceUrl: product.url,
    credit: `Catalog/source image: ${product.brand}`,
    license: 'Catalog/manufacturer or retailer image; displayed with attribution, not a hands-on review claim',
    context: [
      product.name,
      product.brand,
      product.category,
      product.type,
      ...product.keywords,
      ...product.tags,
      provenanceUrl,
    ].join(' '),
    kind: 'source-backed',
  };
}

function sectionScore(section: BodySection, asset: MediaAsset): number {
  const sectionTokens = tokenSet(`${section.title} ${section.content}`);
  const assetTokens = tokenSet(`${asset.alt} ${asset.caption || ''} ${asset.context || ''}`);
  let score = 0;
  for (const token of assetTokens) {
    if (sectionTokens.has(token)) score += 1;
  }
  return score;
}

function attachSectionImages(article: PublishedArtifact, assets: MediaAsset[]): BodySection[] {
  const used = new Set<string>();
  return (article.bodySections || []).map((section) => {
    if (section.imageMatch?.src) return section;

    const best = assets
      .filter((asset) => !used.has(asset.src))
      .map((asset) => ({ asset, score: sectionScore(section, asset) }))
      .sort((a, b) => b.score - a.score)[0];

    if (!best || best.score < 2) return section;
    used.add(best.asset.src);
    return { ...section, imageMatch: best.asset };
  });
}

function rewriteMarkdown(article: PublishedArtifact, mdPath: string): void {
  const sections = (article.bodySections || []).map((section) => {
    const image = section.imageMatch;
    const imageMarkdown = image?.src
      ? `\n\n![${image.alt}](${image.src})\n_${image.caption || image.alt}_`
      : '';
    return `## ${section.title}\n\n${section.content}${imageMarkdown}\n`;
  });

  const markdown = [
    `# ${article.title}`,
    '',
    ...(article.excerpt ? [`> ${article.excerpt}`, ''] : []),
    ...sections,
  ].join('\n');

  fs.writeFileSync(mdPath, `${markdown.trimEnd()}\n`, 'utf8');
}

function hasGeneratedCover(article: PublishedArtifact): boolean {
  const src = article.media?.coverImage?.src || article.coverImage || '';
  return src.startsWith(GENERATED_COVER_PREFIX);
}

function shouldBackfill(article: PublishedArtifact): boolean {
  if (!commercialBackfillEligible(article)) return false;
  return hasGeneratedCover(article) || (article.media?.gallery || []).length === 0;
}

function sourceReferences(article: PublishedArtifact, assets: MediaAsset[]): string[] {
  const values = [
    ...(article.sourceReferences || []),
    ...assets.map((asset) => asset.sourceUrl || ''),
  ].filter(isHttpUrl);
  return [...new Set(values)];
}

function main(): void {
  const dryRun = process.argv.includes('--dry-run');
  const targetSlug = process.argv.find((arg) => arg.startsWith('--slug='))?.split('=')[1];
  const products = readCatalog();
  const files = fs.readdirSync(PUBLISHED_DIR)
    .filter((file) => file.endsWith('.json'))
    .filter((file) => !targetSlug || file === `${targetSlug}.json`);

  let updated = 0;
  let skipped = 0;
  const misses: string[] = [];

  for (const file of files) {
    const jsonPath = path.join(PUBLISHED_DIR, file);
    const mdPath = path.join(PUBLISHED_DIR, file.replace(/\.json$/, '.md'));
    const article = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as PublishedArtifact;
    if (!shouldBackfill(article)) {
      skipped += 1;
      continue;
    }

    const selected = selectProducts(article, products);
    if (selected.length === 0) {
      misses.push(article.slug);
      skipped += 1;
      continue;
    }

    const assets = selected.map((product) => productToMediaAsset(product, article));
    article.media = {
      coverImage: article.media?.coverImage,
      gallery: article.media?.gallery || [],
      figureCaptions: article.media?.figureCaptions || [],
      imageSources: article.media?.imageSources || [],
      attribution: article.media?.attribution || [],
    };

    if (!article.media.coverImage?.src || hasGeneratedCover(article)) {
      article.media.coverImage = assets[0];
      article.coverImage = assets[0].src;
    }

    if ((article.media.gallery || []).length === 0) {
      article.media.gallery = assets;
    }

    article.media.imageSources = [...new Set([
      ...(article.media.imageSources || []),
      ...assets.map((asset) => asset.sourceUrl || '').filter(isHttpUrl),
    ])];
    article.media.attribution = [...new Set([
      ...(article.media.attribution || []),
      ...assets.map((asset) => asset.credit || '').filter((value) => value.length > 0),
    ])];
    article.bodySections = attachSectionImages(article, assets);
    article.sourceReferences = sourceReferences(article, assets);

    if (!dryRun) {
      fs.writeFileSync(jsonPath, `${JSON.stringify(article, null, 2)}\n`, 'utf8');
      rewriteMarkdown(article, mdPath);
    }

    updated += 1;
  }

  console.log(JSON.stringify({
    dryRun,
    products: products.length,
    processed: files.length,
    updated,
    skipped,
    misses: misses.slice(0, 30),
  }, null, 2));
}

main();
