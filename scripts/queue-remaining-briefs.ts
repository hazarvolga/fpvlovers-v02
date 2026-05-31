import fs from 'fs';
import path from 'path';
import { firstWaveContentPlan } from '../src/lib/content-plan';
import { loadContentJobs, saveContentJobs } from '../src/lib/content-automation/queue';
import { getPublishedSlugs } from '../src/lib/content-automation/content-reader';
import type { ContentJob } from '../src/lib/content-automation/types';

function main() {
  console.log('--- QUEUING REMAINING BRIEFS FOR AUTOMATIC GENERATION ---');
  
  const jobs = loadContentJobs();
  const publishedSlugs = new Set(getPublishedSlugs());
  const existingJobSlugs = new Set(jobs.map(j => j.briefSlug));
  
  let enqueuedCount = 0;
  
  for (const brief of firstWaveContentPlan) {
    if (publishedSlugs.has(brief.slug) || existingJobSlugs.has(brief.slug)) {
      console.log(`Skipping (already exists): "${brief.title}"`);
      continue;
    }
    
    const newJob: ContentJob = {
      id: `brief-${brief.slug}`,
      briefSlug: brief.slug,
      title: brief.title,
      category: brief.category,
      status: 'queued',
      topic: brief.summary,
      language: 'en', // technical articles kept in English as per guidelines
      template: brief.category === 'Troubleshooting' ? 'troubleshooting' 
                : brief.category === 'Build Guides' ? 'build-guide'
                : brief.category === 'Regulations' ? 'regulation-guide'
                : brief.category === 'Racing' ? 'community-roundup'
                : 'tech-article',
      promptVersion: 'v2',
      sourceHints: brief.outline,
      seo: {
        slug: brief.slug,
        metaDescription: brief.metaDescription,
        keywords: [brief.primaryKeyword, ...brief.secondaryKeywords]
      },
      createdAt: new Date().toISOString()
    };
    
    jobs.push(newJob);
    enqueuedCount++;
    console.log(`Enqueued: "${brief.title}"`);
  }
  
  if (enqueuedCount > 0) {
    saveContentJobs(jobs);
    console.log(`\n✓ Successfully enqueued ${enqueuedCount} new briefs!`);
  } else {
    console.log('\nAll briefs from the editorial plan are already enqueued or published.');
  }
}

main();
