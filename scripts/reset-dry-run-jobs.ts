import fs from 'fs';

const QUEUE_FILE = 'data/crawl-queue.json';
const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));

let resetCount = 0;
for (const job of queue.jobs) {
  if (job.status === 'failed' || (job.status === 'completed' && job.docId && job.docId.startsWith('artifact-'))) {
    job.status = 'pending';
    job.error = undefined;
    job.docId = undefined;
    job.retries = 0;
    resetCount++;
  }
}

queue.stats = {
  total: queue.jobs.length,
  pending: queue.jobs.filter((j: any) => j.status === 'pending').length,
  completed: queue.jobs.filter((j: any) => j.status === 'completed').length,
  failed: queue.jobs.filter((j: any) => j.status === 'failed').length,
  throttled: queue.jobs.filter((j: any) => j.status === 'throttled').length,
};

fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2) + '\n');
console.log(`Reset ${resetCount} jobs back to pending.`);
