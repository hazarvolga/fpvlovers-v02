import fs from 'fs';
import path from 'path';

const QUEUE_FILE = path.join(process.cwd(), 'data', 'crawl-queue.json');

async function main() {
  console.log('--- Analyzing Failed URLs ---');
  
  if (!fs.existsSync(QUEUE_FILE)) {
    console.log('crawl-queue.json not found!');
    return;
  }

  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
  const failedJobs = queue.jobs.filter((j: any) => j.status === 'failed');

  console.log(`Found ${failedJobs.length} failed jobs in crawl-queue.json:`);
  failedJobs.forEach((j: any, i: number) => {
    console.log(`${i + 1}. [${j.dataset || 'no-dataset'}] ${j.url} - Error: ${j.error}`);
  });

  console.log('\n--- Resetting for 2nd round of crawl ---');
  let resetCount = 0;
  for (const job of queue.jobs) {
    if (job.status === 'failed') {
      job.status = 'pending';
      job.retries = 0;
      delete job.error;
      resetCount++;
    }
  }

  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2) + '\n');
  console.log(`Reset ${resetCount} jobs to pending state.`);
  console.log('Next step: run crawler (e.g. via GET /api/admin/crawl-queue?action=process_batch)');
}

main().catch(console.error);
