import fs from 'fs';
import path from 'path';
import { extractProductsFromMarkdown } from '../src/lib/tools/product-catalog-extractor';
import { upsertCrawlerProductCatalog } from '../src/lib/tools/product-catalog-store';

type RawInput = Record<string, unknown>;

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function markdownFromRecord(record: RawInput): string {
  const markdown = asString(record.markdown);
  if (markdown) return markdown;
  const nestedMarkdown = record.markdown && typeof record.markdown === 'object'
    ? asString((record.markdown as Record<string, unknown>).raw_markdown)
    : undefined;
  return nestedMarkdown || asString(record.raw_markdown) || asString(record.text) || '';
}

function recordsFromInput(value: unknown): RawInput[] {
  if (Array.isArray(value)) return value.filter((item): item is RawInput => Boolean(item && typeof item === 'object'));
  if (value && typeof value === 'object') {
    const record = value as RawInput;
    if (Array.isArray(record.results)) return recordsFromInput(record.results);
    return [record];
  }
  return [];
}

const inputPath = argValue('--input');
const write = process.argv.includes('--write');

if (!inputPath) {
  console.log('Usage: npm run catalog:extract -- --input data/crawl-results.json [--write]');
  process.exit(0);
}

const raw = JSON.parse(fs.readFileSync(path.resolve(inputPath), 'utf-8')) as unknown;
const records = recordsFromInput(raw);
const products = records.flatMap((record) => {
  const url = asString(record.url) || asString(record.source_url) || '';
  const markdown = markdownFromRecord(record);
  if (!url || !markdown) return [];

  return extractProductsFromMarkdown({
    url,
    markdown,
    sourceName: asString(record.name),
    productTypes: asStringArray(record.productTypes),
    crawledAt: asString(record.crawledAt) || asString(record.crawled_at),
  }).products;
});

console.log(`Extracted ${products.length} product(s) from ${records.length} crawl record(s).`);
for (const product of products.slice(0, 20)) {
  console.log(`- ${product.type}: ${product.name} | ${product.url} | image=${Boolean(product.imageUrl)}`);
}

if (write) {
  const catalog = upsertCrawlerProductCatalog(products);
  console.log(`Wrote ${catalog.products.length} normalized crawler product(s) to data/fpv-products.catalog.json.`);
} else {
  console.log('Dry run only. Add --write to update data/fpv-products.catalog.json.');
}
