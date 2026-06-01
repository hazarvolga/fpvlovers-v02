import fs from 'fs';
import path from 'path';
import { generateContentViaDify } from '../src/lib/content-automation/dify-generation';
import { publishGeneratedContentArtifact } from '../src/lib/content-automation/publish-artifact';
import { enqueueContentJob, loadContentJobs } from '../src/lib/content-automation/queue';
import type { ContentJob } from '../src/lib/content-automation/types';

// Load .env.local variables programmatically into process.env to ensure seamless API access
function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
    console.log('✓ Successfully loaded .env.local parameters.');
  } else {
    console.error('✗ .env.local file missing. Cannot load credentials.');
  }
}

async function runDifyPipeline(slug: string, title: string, category: string, topic: string, outline: string[]) {
  console.log(`\n======================================================`);
  console.log(`[DIFY RUNNER] Starting dynamic generation for: "${slug}"`);
  console.log(`======================================================`);

  const jobId = `brief-${slug}-${Date.now().toString(36)}`;
  const job: ContentJob = {
    id: jobId,
    briefSlug: slug,
    title,
    category,
    status: 'queued',
    topic,
    language: 'en',
    template: 'tech-article',
    promptVersion: 'v2',
    sourceHints: outline,
    seo: {
      slug,
      metaDescription: topic,
      keywords: [slug.replace(/-/g, ' '), 'FPV specialization', 'advanced pilot guide']
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Enqueue job into system database (content-jobs.json)
  enqueueContentJob(job);
  console.log(`✓ Job enqueued into content-jobs.json (ID: ${jobId})`);

  console.log(`▶ Triggering Dify API Workflow with RAG grounding at: ${process.env.DIFY_BASE_URL}...`);
  console.log(`Outline parameters:`, outline);

  try {
    const result = await generateContentViaDify({
      topic,
      template: 'tech-article',
      language: 'en',
      title,
      category,
      customPrompt: 'Write strictly in English. Follow FPV ORACLE tone: precise, casual but highly technical. Ensure zero placeholders. Limit military jargon. Use markdown styling.',
      brief: {
        primaryKeyword: slug.replace(/-/g, ' '),
        secondaryKeywords: [slug.replace(/-/g, ' '), 'FPV advanced tutorial', 'specialization guide'],
        summary: topic,
        outline,
      },
    });

    if (!result.success || !result.content) {
      throw new Error(`Dify RAG workflow failed to return structured article content. WorkflowRunID: ${result.workflowRunId}`);
    }

    console.log(`✓ Dify generation completed successfully!`);
    console.log(`  Workflow Run ID: ${result.workflowRunId}`);
    console.log(`  Tokens Consumed: ${result.totalTokens || 'Unknown'}`);
    console.log(`  Elapsed Time: ${result.elapsedTime ? `${result.elapsedTime}s` : 'Unknown'}`);

    console.log(`▶ Publishing JSON and MD artifacts...`);
    result.content.seo.slug = slug;
    
    const publishedFile = await publishGeneratedContentArtifact(slug, job, result.content);
    
    // Update queue job status to published
    const jobs = loadContentJobs();
    const idx = jobs.findIndex(j => j.id === jobId);
    if (idx !== -1) {
      jobs[idx].status = 'published';
      jobs[idx].publishedPath = publishedFile;
      jobs[idx].updatedAt = new Date().toISOString();
      fs.writeFileSync(path.join(process.cwd(), 'data', 'content-jobs.json'), JSON.stringify(jobs, null, 2) + '\n');
    }

    console.log(`✓ Published successfully to: ${publishedFile}`);
    console.log(`✓ Generated corresponding Markdown file: content/published/${slug}.md`);
    return true;
  } catch (error: any) {
    console.error(`✗ Generation failed for "${slug}":`, error.message);
    const jobs = loadContentJobs();
    const idx = jobs.findIndex(j => j.id === jobId);
    if (idx !== -1) {
      jobs[idx].status = 'failed';
      jobs[idx].feedback = error.message;
      jobs[idx].updatedAt = new Date().toISOString();
      fs.writeFileSync(path.join(process.cwd(), 'data', 'content-jobs.json'), JSON.stringify(jobs, null, 2) + '\n');
    }
    return false;
  }
}

async function main() {
  loadEnvLocal();
  
  // Set execution parameters to bypass dry-run simulation
  process.env.FORCE_REAL_LLM = 'true';
  process.env.CRAWL_DRY_RUN = 'false';

  console.log(`Starting production RAG-grounded FPV Specializations content ingestion...`);

  // Target 1: cinematic-fpv-orbit-techniques (Cinematic Operator)
  const cinematicSuccess = await runDifyPipeline(
    'cinematic-fpv-orbit-techniques',
    'Cinematic FPV Orbit Techniques: Mastering the 3D Glide Path',
    'Flight Guides',
    'A masterclass guide on executing orbital paths for cinematic capture. Learn mechanical tilting synchronization, 180-degree shutter ND filtering calculations, propwash avoidance, and Gyroflow post-production workflows.',
    [
      'Introduction to the 3D cinematic orbit',
      'Gimbal tilt and camera angle synchronization',
      'Choosing the right ND filters for cinematic motion blur (the 180-degree rule)',
      'Propwash handling and throttle smoothness during tight circles',
      'Post-stabilization workflows (Gyroflow / ReelSteady configuration)'
    ]
  );

  // Target 2: fpv-mountain-surfing-flight-planning-wind-shadows-and-signal-security (Long Range Explorer)
  const longRangeSuccess = await runDifyPipeline(
    'fpv-mountain-surfing-flight-planning-wind-shadows-and-signal-security',
    'FPV Mountain Surfing: Flight Planning, Wind Shadows, and Signal Security',
    'Flight Guides',
    'An advanced tactical guide for high-altitude ridge surfing. Explores mountain thermal flows and wind shadows, RF line-of-sight propagation, custom high-density Li-Ion pack builds, and emergency GPS rescue fail-safe protocols.',
    [
      'Alpine flight planning and topography research',
      'Understanding wind shadows, thermal drafts, and rotors',
      'Signal security: RF penetration and direct line-of-sight propagation',
      'Li-Ion battery custom builds for high-altitude endurance (high capacity vs high discharge)',
      'Emergency procedures and GPS Rescue activation checklist'
    ]
  );

  console.log(`\n======================================================`);
  console.log(`[DIFY RUNNER] Specialization Content Production Complete!`);
  console.log(`Summary of Results:`);
  console.log(`  cinematic-fpv-orbit-techniques: ${cinematicSuccess ? '✓ SUCCESS' : '✗ FAILED'}`);
  console.log(`  fpv-mountain-surfing-flight-planning-wind-shadows-and-signal-security: ${longRangeSuccess ? '✓ SUCCESS' : '✗ FAILED'}`);
  console.log('======================================================\n');
}

main();
