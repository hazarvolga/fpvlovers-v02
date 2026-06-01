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
      keywords: [slug.replace(/-/g, ' '), 'FPV training', 'FPV beginners']
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
        secondaryKeywords: [slug.replace(/-/g, ' '), 'FPV beginner tutorial', 'academy guide'],
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

    console.log(`▶ Publishing JSON and MD artifacts using semantic hardware image matchers...`);
    // Ensure slug strictly aligns with the enqueued brief Slug
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

  console.log(`Starting production RAG-grounded FPV content ingestion...`);

  // Target 1: first-hover-training (Batch 2)
  const hoverSuccess = await runDifyPipeline(
    'first-hover-training',
    'First Hover Training: The Perfect Manual Takeoff Protocol',
    'Flight Guides',
    'A step-by-step procedure for your first battery in the real world. Learn physical layout checks, proper arming protocols, throttle hovering, and crash avoidance.',
    [
      'Pre-flight diagnostic physical audit',
      'Power on sequence (radio transmitter first)',
      'Arming sequence and liftoff pop above ground effect',
      'Horizon drilling and micro-corrections',
      'The panic-disarm protocol'
    ]
  );

  // Target 2: drone-anatomy-complete-guide (Batch 3)
  const anatomySuccess = await runDifyPipeline(
    'drone-anatomy-complete-guide',
    'FPV Drone Anatomy: The Complete Structural & Electrical Guide',
    'Flight Guides',
    'A complete beginner-first structural and electrical breakdown of a standard FPV drone, explaining how frames, motors, ESCs, flight controllers, receivers, and VTX interact.',
    [
      'System architecture overview',
      'Frame and propulsion mechanics',
      'FC processing and gyro sensors',
      'Communication links (ELRS and 5.8G VTX)',
      'Solder continuity and bench safety'
    ]
  );

  // Target 3: smoke-stopper-protocol (Batch 4)
  const smokeSuccess = await runDifyPipeline(
    'smoke-stopper-protocol',
    'The Smoke Stopper Protocol: Save Your Stack on First Power-Up',
    'Build Guides',
    'A critical electronics guide explaining the function of a smoke stopper, bench testing procedures, current thresholds, and warning flags on the first battery connection.',
    [
      'What is a smoke stopper (fuse vs solid state)',
      'Solder bridge short circuits',
      'Testing sequence (no props)',
      'Normal power up signs vs immediate trip',
      'Capacitor voltage spike absorbency'
    ]
  );

  console.log(`\n======================================================`);
  console.log(`[DIFY RUNNER] Content Production Complete!`);
  console.log(`Summary of Results:`);
  console.log(`  first-hover-training: ${hoverSuccess ? '✓ SUCCESS' : '✗ FAILED'}`);
  console.log(`  drone-anatomy-complete-guide: ${anatomySuccess ? '✓ SUCCESS' : '✗ FAILED'}`);
  console.log(`  smoke-stopper-protocol: ${smokeSuccess ? '✓ SUCCESS' : '✗ FAILED'}`);
  console.log(`======================================================\n`);
}

main();
