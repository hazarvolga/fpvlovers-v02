import fs from 'fs';
import path from 'path';

// Validate environment variables are loaded
if (!process.env.DIFY_APP_KEY) {
  console.error('ERROR: DIFY_APP_KEY is missing! Run with Node native env loader.');
  process.exit(1);
}

// Force real LLM calls bypass
process.env.FORCE_REAL_LLM = 'true';

import { loadContentJobs, saveContentJobs } from '../src/lib/content-automation/queue';
import { generateContentViaDify } from '../src/lib/content-automation/dify-generation';
import { publishGeneratedContentArtifact } from '../src/lib/content-automation/publish-artifact';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('--- STARTING BULK CONTENT GENERATION ENGINE ---');
  
  const jobs = loadContentJobs();
  const readyJobs = jobs.filter(j => j.status === 'queued');
  
  console.log(`Found ${readyJobs.length} enqueued content jobs ready to process.`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < readyJobs.length; i++) {
    const job = readyJobs[i];
    
    console.log(`\n==================================================`);
    console.log(`[${i + 1}/${readyJobs.length}] Processing: "${job.title}"`);
    console.log(`Category: ${job.category} | Template: ${job.template}`);
    console.log(`==================================================`);
    
    // Load a fresh copy of all jobs to prevent overwriting previously updated states
    const currentJobs = loadContentJobs();
    const indexInMain = currentJobs.findIndex(j => j.id === job.id);
    
    if (indexInMain === -1) {
      console.warn(`Job missing in queue, skipping: ${job.id}`);
      continue;
    }
    
    // Mark as generating
    currentJobs[indexInMain].status = 'generating';
    currentJobs[indexInMain].updatedAt = new Date().toISOString();
    saveContentJobs(currentJobs);
    
    try {
      const startTime = Date.now();
      
      const result = await generateContentViaDify({
        topic: job.topic,
        template: job.template,
        language: job.language,
        title: job.title,
        category: job.category,
        brief: {
          primaryKeyword: job.seo.keywords[0] || job.title,
          secondaryKeywords: job.seo.keywords.slice(1),
          summary: job.topic,
          outline: job.sourceHints,
        },
      });
      
      const latestJobs = loadContentJobs();
      const mainIdx = latestJobs.findIndex(candidate => candidate.id === job.id);
      
      if (mainIdx === -1) {
        throw new Error(`Job disappeared from queue during processing: ${job.id}`);
      }
      
      const latestJob = latestJobs[mainIdx];
      
      if (!result.content) {
        latestJob.status = 'failed';
        latestJob.feedback = 'Workflow returned no publishable content.';
        latestJob.updatedAt = new Date().toISOString();
        latestJobs[mainIdx] = latestJob;
        saveContentJobs(latestJobs);
        
        console.error(`✗ Failed: Dify returned empty content for "${job.title}"`);
        failCount++;
        continue;
      }
      
      latestJob.status = 'published';
      latestJob.updatedAt = new Date().toISOString();
      latestJob.publishedPath = publishGeneratedContentArtifact(
        result.content.seo.slug || latestJob.seo.slug || latestJob.briefSlug,
        latestJob,
        result.content
      );
      
      latestJobs[mainIdx] = latestJob;
      saveContentJobs(latestJobs);
      
      console.log(`✓ Success: Published article to ${latestJob.publishedPath}`);
      console.log(`Tokens: ${result.totalTokens} | Duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
      successCount++;
      
    } catch (error: any) {
      console.error(`✗ Error processing "${job.title}":`, error.message);
      
      const latestJobs = loadContentJobs();
      const mainIdx = latestJobs.findIndex(candidate => candidate.id === job.id);
      if (mainIdx !== -1) {
        latestJobs[mainIdx].status = 'failed';
        latestJobs[mainIdx].feedback = error.message;
        latestJobs[mainIdx].updatedAt = new Date().toISOString();
        saveContentJobs(latestJobs);
      }
      failCount++;
    }
    
    if (i < readyJobs.length - 1) {
      console.log('Sleeping for 5 seconds to let Dify connection cool down...');
      await sleep(5000);
    }
  }
  
  console.log(`\n==================================================`);
  console.log(`BULK CONTENT GENERATION ENGINE COMPLETED.`);
  console.log(`Successfully Published: ${successCount} articles`);
  console.log(`Failed: ${failCount} articles`);
  console.log(`==================================================\n`);
}

main();
