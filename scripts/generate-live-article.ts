// 1. Validate environment variables are loaded
if (!process.env.DIFY_APP_KEY) {
  console.error('ERROR: DIFY_APP_KEY is missing! Run with: node --import tsx --env-file=.env.local scripts/generate-live-article.ts');
  process.exit(1);
}
console.log('Environment variables successfully loaded.');

// 2. Force real LLM calls bypass
process.env.FORCE_REAL_LLM = 'true';

import { loadContentJobs, saveContentJobs } from '../src/lib/content-automation/queue';
import { generateContentViaDify } from '../src/lib/content-automation/dify-generation';
import { publishGeneratedContentArtifact } from '../src/lib/content-automation/publish-artifact';

async function main() {
  console.log('--- STARTING REAL CONTENT GENERATION PIPELINE ---');
  
  const jobs = loadContentJobs();
  const readyJobs = jobs.filter(j => j.status === 'queued');
  
  if (readyJobs.length === 0) {
    console.log('No enqueued content jobs found with status: "queued"');
    console.log('Exiting gracefully.');
    return;
  }
  
  const job = readyJobs[0];
  console.log(`Processing Job: [${job.id}] - "${job.title}"`);
  console.log(`Topic: ${job.topic}`);
  
  job.status = 'generating';
  job.updatedAt = new Date().toISOString();
  saveContentJobs(jobs);
  
  try {
    console.log('\nContacting Dify Workflow API (Blocking Mode, streaming parser)... This may take up to 60-90 seconds.');
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
    const index = latestJobs.findIndex(candidate => candidate.id === job.id);
    
    if (index === -1) {
      throw new Error(`Generated job disappeared from queue: ${job.id}`);
    }
    
    const latestJob = latestJobs[index];
    
    console.log('\n--- DIFY RESPONSE DIAGNOSTICS ---');
    console.log('Streamed Outputs keys:', Object.keys(result.outputs || {}));
    console.log('Streamed Outputs content:', JSON.stringify(result.outputs || {}, null, 2));
    console.log('--------------------------------\n');
    
    if (!result.content) {
      latestJob.status = 'failed';
      latestJob.feedback = 'Workflow returned no publishable content.';
      latestJob.updatedAt = new Date().toISOString();
      saveContentJobs(latestJobs);
      console.error('\n✗ Content Generation Failed: Dify returned no content.');
      console.log('Dify Raw Response:', result.rawAnswer);
      process.exitCode = 1;
      return;
    }
    
    latestJob.status = 'published';
    latestJob.updatedAt = new Date().toISOString();
    latestJob.publishedPath = await publishGeneratedContentArtifact(
      result.content.seo.slug || latestJob.seo.slug || latestJob.briefSlug,
      latestJob,
      result.content
    );
    
    latestJobs[index] = latestJob;
    saveContentJobs(latestJobs);
    
    console.log('\n✓ CONTENT GENERATED AND PUBLISHED SUCCESSFULLY!');
    console.log(`Duration: ${((Date.now() - startTime) / 1000).toFixed(1)} seconds`);
    console.log(`Published JSON Path: ${latestJob.publishedPath}`);
    console.log(`Published Markdown Path: content/published/${result.content.seo.slug || latestJob.seo.slug || latestJob.briefSlug}.md`);
    console.log(`Total Tokens: ${result.totalTokens}`);
    console.log(`Workflow Run ID: ${result.workflowRunId}`);
    
  } catch (error: any) {
    const latestJobs = loadContentJobs();
    const index = latestJobs.findIndex(candidate => candidate.id === job.id);
    if (index !== -1) {
      latestJobs[index].status = 'failed';
      latestJobs[index].feedback = error.message;
      latestJobs[index].updatedAt = new Date().toISOString();
      saveContentJobs(latestJobs);
    }
    console.error('\n✗ Pipeline Error:', error.message);
    process.exitCode = 1;
  }
}

main();
