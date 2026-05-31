import fs from 'fs';
import path from 'path';

const JOBS_FILE = path.join(process.cwd(), 'data', 'content-jobs.json');
const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');

const TARGET_IDS = [
  'brief-no-video-fpv-troubleshooting',
  'brief-fpv-racing-beginner-guide',
  'brief-choose-first-tiny-whoop',
  'brief-fpv-beginner-setup-guide'
];

function main() {
  console.log('--- RESETTING TURKISH ARTICLES TO QUEUED ---');
  
  if (!fs.existsSync(JOBS_FILE)) {
    console.error(`Jobs file not found at: ${JOBS_FILE}`);
    process.exit(1);
  }
  
  const rawJobs = fs.readFileSync(JOBS_FILE, 'utf-8');
  const jobs = JSON.parse(rawJobs);
  
  let resetCount = 0;
  
  for (const job of jobs) {
    if (TARGET_IDS.includes(job.id)) {
      console.log(`\nProcessing target job: ${job.id} (${job.title})`);
      
      // Delete published files if they exist
      if (job.publishedPath) {
        const jsonPath = path.join(process.cwd(), job.publishedPath);
        const mdPath = jsonPath.replace(/\.json$/, '.md');
        
        if (fs.existsSync(jsonPath)) {
          fs.unlinkSync(jsonPath);
          console.log(`✓ Deleted: ${jsonPath}`);
        }
        if (fs.existsSync(mdPath)) {
          fs.unlinkSync(mdPath);
          console.log(`✓ Deleted: ${mdPath}`);
        }
      }
      
      // Also check standard filenames just in case
      const standardSlugs = [
        'no-video-in-fpv-a-beginner-troubleshooting-checklist',
        'fpv-racing-for-beginners-what-to-practice-first',
        'how-to-choose-your-first-tiny-whoop-indoor-fun-safe-training',
        'fpv-beginner-setup-guide-the-easiest-way-to-get-flying'
      ];
      
      for (const slug of standardSlugs) {
        const jsonPath = path.join(PUBLISHED_DIR, `${slug}.json`);
        const mdPath = path.join(PUBLISHED_DIR, `${slug}.md`);
        if (fs.existsSync(jsonPath)) {
          fs.unlinkSync(jsonPath);
          console.log(`✓ Cleaned extra json: ${jsonPath}`);
        }
        if (fs.existsSync(mdPath)) {
          fs.unlinkSync(mdPath);
          console.log(`✓ Cleaned extra md: ${mdPath}`);
        }
      }
      
      // Reset job status
      job.status = 'queued';
      delete job.publishedPath;
      job.updatedAt = new Date().toISOString();
      
      resetCount++;
    }
  }
  
  if (resetCount > 0) {
    fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2) + '\n', 'utf-8');
    console.log(`\nSuccessfully reset ${resetCount} jobs to queued state!`);
  } else {
    console.log('\nNo matching target jobs found to reset.');
  }
}

main();
