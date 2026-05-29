import { enqueueUrls, getQueueStatus } from '../src/lib/crawl-queue';
import {
  applyQueueStatusToProductSourcePack,
  getProductSourceStatusCounts,
  groupProductSourcesByDataset,
  readProductSourcePack,
} from '../src/lib/tools/product-source-pack';

const enqueue = process.argv.includes('--enqueue');

const pack = applyQueueStatusToProductSourcePack(readProductSourcePack(), getQueueStatus().jobs);
const pending = pack.sources.filter((source) => source.status === 'pending');
const byDataset = groupProductSourcesByDataset(pending);
const counts = getProductSourceStatusCounts(pack.sources);

console.log('\nFPVLovers Product Catalog Source Pack\n');
console.log(`Goal: ${pack.minimum_active_products_goal} active products, ${Math.round(pack.minimum_real_image_coverage * 100)}% real image coverage`);
console.log(`Source status: pending=${counts.pending}, queued=${counts.queued}, crawled=${counts.crawled}, failed=${counts.failed}`);

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
