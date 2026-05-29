import fs from 'fs';
import path from 'path';
import { enqueueUrls } from '../src/lib/crawl-queue';

type ProductSource = {
  name: string;
  url: string;
  dataset: string;
  priority: 'high' | 'medium' | 'low';
  productTypes: string[];
  reason: string;
  status: 'pending' | 'queued' | 'crawled' | 'failed';
};

type ProductSourcePack = {
  generated_at: string;
  purpose: string;
  target_dataset: string;
  minimum_active_products_goal: number;
  minimum_real_image_coverage: number;
  sources: ProductSource[];
};

const PACK_FILE = path.join(process.cwd(), 'data', 'fpv-product-source-pack.json');
const enqueue = process.argv.includes('--enqueue');

function readPack(): ProductSourcePack {
  const raw = JSON.parse(fs.readFileSync(PACK_FILE, 'utf-8')) as unknown;
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as ProductSourcePack).sources)) {
    throw new Error('Invalid product source pack shape.');
  }
  return raw as ProductSourcePack;
}

const pack = readPack();
const pending = pack.sources.filter((source) => source.status === 'pending');
const byDataset = pending.reduce<Record<string, ProductSource[]>>((groups, source) => {
  groups[source.dataset] = groups[source.dataset] ?? [];
  groups[source.dataset].push(source);
  return groups;
}, {});

console.log('\nFPVLovers Product Catalog Source Pack\n');
console.log(`Goal: ${pack.minimum_active_products_goal} active products, ${Math.round(pack.minimum_real_image_coverage * 100)}% real image coverage`);
console.log(`Pending sources: ${pending.length}/${pack.sources.length}`);

for (const [dataset, sources] of Object.entries(byDataset)) {
  console.log(`- ${dataset}: ${sources.length} source(s)`);
  for (const source of sources) {
    console.log(`  ${source.priority.toUpperCase()} ${source.name}: ${source.url}`);
  }
}

if (!enqueue) {
  console.log('\nDry run only. Use `npm run catalog:enqueue` to enqueue these URLs into the crawl queue.');
  process.exit(0);
}

let enqueued = 0;
for (const [dataset, sources] of Object.entries(byDataset)) {
  const jobs = enqueueUrls(sources.map((source) => source.url), dataset);
  enqueued += jobs.length;
}

console.log(`\nEnqueued ${enqueued} product catalog source job(s).`);
