import { runWorkflow, DifyWorkflowResponse } from './dify-client';
import { getRequiredEnv } from './env';

// 1. SEO Content Generator
export async function runSeoContentGenerator(inputs: { keyword: string; topic: string; tone?: string }): Promise<DifyWorkflowResponse> {
  const token = getRequiredEnv('DIFY_SEO_WORKFLOW_TOKEN');
  return runWorkflow('seo-content-generator', inputs, token);
}

// 2. Affiliate Orchestrator
export async function runAffiliateOrchestrator(inputs: { article_content: string; product_category?: string }): Promise<DifyWorkflowResponse> {
  const token = getRequiredEnv('DIFY_AFFILIATE_WORKFLOW_TOKEN');
  return runWorkflow('affiliate-orchestrator', inputs, token);
}

// 3. Sponsorship Orchestrator
export async function runSponsorshipOrchestrator(inputs: { article_content: string; sponsor_name?: string }): Promise<DifyWorkflowResponse> {
  const token = getRequiredEnv('DIFY_SPONSORSHIP_WORKFLOW_TOKEN');
  return runWorkflow('sponsorship-orchestrator', inputs, token);
}

// 4. Metadata Enrichment
export async function runMetadataEnrichment(inputs: { raw_content: string; source_url: string }): Promise<DifyWorkflowResponse> {
  const token = getRequiredEnv('DIFY_METADATA_WORKFLOW_TOKEN');
  return runWorkflow('metadata-enrichment', inputs, token);
}

// 5. Scheduled Publisher
export async function runScheduledPublisher(inputs: { content: string; schedule_date: string }): Promise<DifyWorkflowResponse> {
  const token = getRequiredEnv('DIFY_PUBLISHER_WORKFLOW_TOKEN');
  return runWorkflow('scheduled-publisher', inputs, token);
}

// 6. Drone Part Matcher
export async function runDronePartMatcher(inputs: { components_list: string }): Promise<DifyWorkflowResponse> {
  const token = getRequiredEnv('DIFY_PART_MATCHER_WORKFLOW_TOKEN');
  return runWorkflow('drone-part-matcher', inputs, token);
}

// 7. HD Tune Analyzer
export async function runHdTuneAnalyzer(inputs: { blackbox_log?: string; pid_profile: string }): Promise<DifyWorkflowResponse> {
  const token = getRequiredEnv('DIFY_HD_TUNE_WORKFLOW_TOKEN');
  return runWorkflow('hd-tune-analyzer', inputs, token);
}

// 8. Drone Build Recommender
export async function runDroneBuildRecommender(inputs: { budget: string; flying_style: string }): Promise<DifyWorkflowResponse> {
  const token = getRequiredEnv('DIFY_BUILD_REC_WORKFLOW_TOKEN');
  return runWorkflow('drone-build-recommender', inputs, token);
}

// 9. Racing Intelligence Orchestrator (from DB logs)
export async function runRacingIntelligenceOrchestrator(inputs: { race_data: string; track_info?: string }): Promise<DifyWorkflowResponse> {
  // Uses existing token in .env.local
  const token = getRequiredEnv('DIFY_RACING_WORKFLOW_TOKEN');
  return runWorkflow('racing-intelligence-orchestrator', inputs, token);
}
