import fs from 'fs';
import path from 'path';
import { loadContentJobs, saveContentJobs } from '../src/lib/content-automation/queue';

const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');

function main() {
  console.log('--- REPAIRING CONTENT JOBS QUEUE STATUS ---');
  
  const jobs = loadContentJobs();
  const files = fs.readdirSync(PUBLISHED_DIR).filter(f => f.endsWith('.json'));
  
  let repairedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(PUBLISHED_DIR, file);
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      
      const jobId = data.jobId;
      const slug = data.slug;
      
      // Find job in queue either by jobId or by slug
      let jobIndex = jobs.findIndex(j => j.id === jobId);
      if (jobIndex === -1 && slug) {
        jobIndex = jobs.findIndex(j => j.briefSlug === slug || j.seo?.slug === slug);
      }
      
      if (jobIndex !== -1) {
        const job = jobs[jobIndex];
        const publishedPath = `content/published/${file}`;
        
        if (job.status !== 'published' || job.publishedPath !== publishedPath) {
          console.log(`Repairing job: "${job.title}" -> status: published, path: ${publishedPath}`);
          job.status = 'published';
          job.publishedPath = publishedPath;
          job.updatedAt = new Date().toISOString();
          jobs[jobIndex] = job;
          repairedCount++;
        }
      }
    } catch (err: any) {
      console.error(`Error reading ${file}:`, err.message);
    }
  }
  
  if (repairedCount > 0) {
    saveContentJobs(jobs);
    console.log(`\n✓ Successfully repaired status for ${repairedCount} jobs!`);
  } else {
    console.log('\nAll jobs already have correct status and publishedPath in content-jobs.json.');
  }
}

main();
