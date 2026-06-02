import { enqueueUrls, getQueueStatus } from '../src/lib/crawl-queue';
import {
  applyQueueStatusToRacingSourcePack,
  getRacingSourceStatusCounts,
  groupRacingSourcesByDataset,
  readRacingSourcePack,
} from '../src/lib/racing-source-pack';

const enqueue = process.argv.includes('--enqueue');

const pack = applyQueueStatusToRacingSourcePack(readRacingSourcePack(), getQueueStatus().jobs);
const pending = pack.sources.filter((source) => source.status === 'pending');
const byDataset = groupRacingSourcesByDataset(pending);
const counts = getRacingSourceStatusCounts(pack.sources);

console.log('\nFPVLovers Racing Division Source Pack\n');
console.log(`Purpose: ${pack.purpose}`);
console.log(`Policy: ${pack.policy.crawl_mode}; primary sources first=${pack.policy.primary_sources_first ? 'yes' : 'no'}`);
console.log(`Source status: pending=${counts.pending}, queued=${counts.queued}, crawled=${counts.crawled}, failed=${counts.failed}`);

for (const [dataset, sources] of Object.entries(byDataset)) {
  console.log(`- ${dataset}: ${sources.length} pending source(s)`);
  for (const source of sources) {
    console.log(`  ${source.priority.toUpperCase()} ${source.sourceType} ${source.name}: ${source.url}`);
    console.log(`    targets: ${source.entityTargets.join(', ')}`);
  }
}

if (!enqueue) {
  if (pending.length === 0) {
    console.log('\nNo pending racing sources. Use queue/admin status to monitor queued/crawled/failed state.');
  } else {
    console.log('\nDry run only. Use `npm run racing:enqueue` to enqueue these URLs into the crawl queue.');
  }
  process.exit(0);
}

let enqueued = 0;
for (const [dataset, sources] of Object.entries(byDataset)) {
  const jobs = enqueueUrls(sources.map((source) => source.url), dataset);
  enqueued += jobs.length;
}

console.log(`\nEnqueued ${enqueued} racing source job(s).`);
