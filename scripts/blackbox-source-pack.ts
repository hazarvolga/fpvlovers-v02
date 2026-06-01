import { enqueueUrls, getQueueStatus } from '../src/lib/crawl-queue';
import {
  applyQueueStatusToBlackboxSourcePack,
  getBlackboxSourceStatusCounts,
  groupBlackboxSourcesByDataset,
  readBlackboxSourcePack,
} from '../src/lib/tools/blackbox-source-pack';

const enqueue = process.argv.includes('--enqueue');

const pack = applyQueueStatusToBlackboxSourcePack(readBlackboxSourcePack(), getQueueStatus().jobs);
const pending = pack.sources.filter((source) => source.status === 'pending' || source.status === 'failed');
const byDataset = groupBlackboxSourcesByDataset(pending);
const counts = getBlackboxSourceStatusCounts(pack.sources);

console.log('\nFPVLovers Blackbox Source Pack\n');
console.log(`Purpose: ${pack.purpose}`);
console.log(`Ingestion mode: ${pack.ingestion_mode}`);
console.log(`Source status: pending=${counts.pending}, queued=${counts.queued}, crawled=${counts.crawled}, failed=${counts.failed}`);

for (const [dataset, sources] of Object.entries(byDataset)) {
  console.log(`- ${dataset}: ${sources.length} source(s)`);
  for (const source of sources) {
    console.log(`  ${source.priority.toUpperCase()} ${source.title}: ${source.url}`);
  }
}

if (!enqueue) {
  if (pending.length === 0) {
    console.log('\nNo pending Blackbox sources. Use the crawl queue status to monitor queued/crawled/failed jobs.');
  } else {
    console.log('\nDry run only. Use `npm run tools:blackbox:enqueue` to enqueue these URLs into the crawl queue.');
  }
  process.exit(0);
}

let enqueued = 0;
for (const [dataset, sources] of Object.entries(byDataset)) {
  const jobs = enqueueUrls(sources.map((source) => source.url), dataset);
  enqueued += jobs.length;
}

console.log(`\nEnqueued ${enqueued} Blackbox source job(s).`);
