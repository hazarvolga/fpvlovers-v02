import fs from 'fs';
import path from 'path';

const queuePath = path.join(process.cwd(), 'data/crawl-queue.json');
const queueData = JSON.parse(fs.readFileSync(queuePath, 'utf8'));

const newUrls = [
  'https://quadifyrc.com',
  'https://www.speedybee.com',
  'https://www.diatone.us',
  'https://www.expresslrs.org',
  'https://ardupilot.org/copter/docs/common-fpv-first-person-view.html',
  'https://dronedj.com/category/fpv/',
  'https://insidefpv.com',
  'https://fpvfc.org',
  'https://uavcoach.com',
  'https://www.rcgroups.com/aircraft-electric-fpv-861/'
];

const now = new Date().toISOString();

for (const url of newUrls) {
  // Check if it already exists
  if (!queueData.jobs.find((j: any) => j.url === url)) {
    queueData.jobs.push({
      id: Math.random().toString(36).substring(2, 14),
      url: url,
      dataset: '',
      status: 'pending',
      priority: 0,
      retries: 0,
      maxRetries: 3,
      createdAt: now,
      updatedAt: now
    });
  }
}

fs.writeFileSync(queuePath, JSON.stringify(queueData, null, 2));
console.log('Added new URLs to crawl-queue.json successfully!');
