// Master Routing Tables — APPENDIX III Implementation
// Source: fpvlovers-master-orchtrate-system-promt.MD (Section III)

export interface IntentRoute {
  intent: string;
  signals: string[];
  primaryDataset: string;
  primaryDatasetId: string;
  fallbackDataset: string | null;
  fallbackDatasetId: string | null;
  appToken: string;
  appName: string;
  monetizationStrategy: 'affiliate' | 'sponsor' | 'mixed' | 'none';
  maxPlacements: number;
  minScore: number;
}

export interface DifyAppInfo {
  token: string;
  name: string;
  scope: string;
  primaryDatasets: string[];
  outOfScope: string[];
}

export interface DatasetInfo {
  id: string;
  name: string;
  uuid: string;
  docCount: number;
  minScoreThreshold: number;
  chunkTokens: number;
  overlapTokens: number;
  semanticWeight: number;
  keywordWeight: number;
}

// ─── INTENT → DATASET + APP ROUTING TABLE ───

export const INTENT_ROUTES: IntentRoute[] = [
  {
    intent: 'tuning',
    signals: ['pid', 'tune', 'tuning', 'blackbox', 'filter', 'oscillation', 'propwash', 'rates', 'd term', 'p term', 'i term', 'ff', 'feedforward', 'gyro'],
    primaryDataset: 'fpv-flight-tuning',
    primaryDatasetId: 'd1d5e44b-4dde-445a-a686-67a1cc0d926c',
    fallbackDataset: 'fpv-pid-profiles',
    fallbackDatasetId: '3eacd19f-ccd8-49ec-8482-51120918f0e0',
    appToken: 'app-4mCgiWoe3bYOxNYQbspqNhyh',
    appName: 'Blackbox Tuning Advisor',
    monetizationStrategy: 'sponsor',
    maxPlacements: 1,
    minScore: 0.60,
  },
  {
    intent: 'parts',
    signals: ['motor', 'esc', 'fc', 'flight controller', 'vtx', 'camera', 'spec', 'specs', 'weight', 'dimension', 'pinout', 'compatible'],
    primaryDataset: 'fpv-components-specs',
    primaryDatasetId: '38bb7d60-b921-440c-b8f4-e49f9982a61f',
    fallbackDataset: 'fpv-community-knowledge',
    fallbackDatasetId: '639af5aa-d424-4d0b-9633-a7ab541afcb2',
    appToken: 'app-fHeOtuCMfHNujevKEXaTEDJn',
    appName: 'Part Matcher',
    monetizationStrategy: 'affiliate',
    maxPlacements: 2,
    minScore: 0.60,
  },
  {
    intent: 'build',
    signals: ['build', 'frame', 'setup', 'assemble', 'solder', 'parts list', 'stack', 'wiring', 'components'],
    primaryDataset: 'fpv-build-guides',
    primaryDatasetId: 'a733583a-5e50-4e00-8b50-759380da59db',
    fallbackDataset: 'fpv-components-specs',
    fallbackDatasetId: '38bb7d60-b921-440c-b8f4-e49f9982a61f',
    appToken: 'app-JH8Fu38ezY8sUyhHb8ykHIWq',
    appName: 'Build Wizard',
    monetizationStrategy: 'mixed',
    maxPlacements: 2,
    minScore: 0.50,
  },
  {
    intent: 'troubleshooting',
    signals: ['fix', 'problem', 'not working', 'broken', 'error', 'issue', 'fail', 'crash', 'smoke', 'won\'t arm'],
    primaryDataset: 'fpv-troubleshooting',
    primaryDatasetId: '9b380b45-1be1-4ba6-b685-72e279e09ccc',
    fallbackDataset: 'fpv-community-knowledge',
    fallbackDatasetId: '639af5aa-d424-4d0b-9633-a7ab541afcb2',
    appToken: 'app-C7zocan03yFGIbGtJCQG0iUs',
    appName: 'FPV Expert Assistant',
    monetizationStrategy: 'none',
    maxPlacements: 0,
    minScore: 0.55,
  },
  {
    intent: 'news',
    signals: ['review', 'new', 'release', 'latest', 'announced', 'news', 'update', 'launch'],
    primaryDataset: 'fpv-news-reviews',
    primaryDatasetId: '6a8a84c8-46ca-43f0-a3ea-3c19f32f5a17',
    fallbackDataset: 'fpv-community-knowledge',
    fallbackDatasetId: '639af5aa-d424-4d0b-9633-a7ab541afcb2',
    appToken: 'app-C7zocan03yFGIbGtJCQG0iUs',
    appName: 'FPV Expert Assistant',
    monetizationStrategy: 'sponsor',
    maxPlacements: 1,
    minScore: 0.45,
  },
  {
    intent: 'racing',
    signals: ['race', 'racing', 'event', 'competition', 'track', 'multigp', 'league'],
    primaryDataset: 'fpv-racing-events',
    primaryDatasetId: 'cd17b1ea-a852-4d31-87d7-1b4c0bd46e7f',
    fallbackDataset: 'fpv-community-knowledge',
    fallbackDatasetId: '639af5aa-d424-4d0b-9633-a7ab541afcb2',
    appToken: 'app-C7zocan03yFGIbGtJCQG0iUs',
    appName: 'FPV Expert Assistant',
    monetizationStrategy: 'sponsor',
    maxPlacements: 1,
    minScore: 0.50,
  },
  {
    intent: 'regulations',
    signals: ['law', 'legal', 'regulation', 'shgm', 'faa', 'airspace', 'license', 'easa', 'sht', 'iha'],
    primaryDataset: 'fpv-regulations',
    primaryDatasetId: '229be183-217b-4f93-ba48-9cdabbd1e37f',
    fallbackDataset: null, // ⛔ NO FALLBACK — legal risk
    fallbackDatasetId: null,
    appToken: 'app-C7zocan03yFGIbGtJCQG0iUs',
    appName: 'FPV Expert Assistant',
    monetizationStrategy: 'none',
    maxPlacements: 0,
    minScore: 0.70,
  },
  {
    intent: 'community',
    signals: ['tip', 'trick', 'fpv', 'drone', 'hobby', 'general', 'discussion'],
    primaryDataset: 'fpv-community-knowledge',
    primaryDatasetId: '639af5aa-d424-4d0b-9633-a7ab541afcb2',
    fallbackDataset: 'fpv-flight-tuning',
    fallbackDatasetId: 'd1d5e44b-4dde-445a-a686-67a1cc0d926c',
    appToken: 'app-1Oil9DvSgUHj9Yf8eEtTuShF',
    appName: 'Community Hub',
    monetizationStrategy: 'sponsor',
    maxPlacements: 1,
    minScore: 0.55,
  },
  {
    intent: 'buying',
    signals: ['buy', 'best', 'compare', 'price', 'vs', 'recommend', 'which', 'worth', 'sale'],
    primaryDataset: 'fpv-news-reviews',
    primaryDatasetId: '6a8a84c8-46ca-43f0-a3ea-3c19f32f5a17',
    fallbackDataset: 'fpv-components-specs',
    fallbackDatasetId: '38bb7d60-b921-440c-b8f4-e49f9982a61f',
    appToken: 'app-C7zocan03yFGIbGtJCQG0iUs',
    appName: 'FPV Expert Assistant',
    monetizationStrategy: 'affiliate',
    maxPlacements: 3,
    minScore: 0.45,
  },
  {
    intent: 'research',
    signals: ['how to', 'what is', 'explain', 'guide', 'tutorial', 'learn', 'beginner'],
    primaryDataset: 'fpv-community-knowledge',
    primaryDatasetId: '639af5aa-d424-4d0b-9633-a7ab541afcb2',
    fallbackDataset: 'fpv-flight-tuning',
    fallbackDatasetId: 'd1d5e44b-4dde-445a-a686-67a1cc0d926c',
    appToken: 'app-C7zocan03yFGIbGtJCQG0iUs',
    appName: 'FPV Expert Assistant',
    monetizationStrategy: 'sponsor',
    maxPlacements: 1,
    minScore: 0.50,
  },
];

// ─── DIFY APPS ───

export const DIFY_APPS: DifyAppInfo[] = [
  { token: 'app-C7zocan03yFGIbGtJCQG0iUs', name: 'FPV Expert Assistant', scope: 'general FPV knowledge (9 datasets)', primaryDatasets: ['fpv-flight-tuning', 'fpv-news-reviews', 'fpv-troubleshooting', 'fpv-regulations'], outOfScope: [] },
  { token: 'app-JH8Fu38ezY8sUyhHb8ykHIWq', name: 'Build Wizard', scope: 'drone builds, parts selection', primaryDatasets: ['fpv-build-guides', 'fpv-components-specs'], outOfScope: ['regulations', 'tuning', 'news'] },
  { token: 'app-fHeOtuCMfHNujevKEXaTEDJn', name: 'Part Matcher', scope: 'component compatibility (9 part types)', primaryDatasets: ['fpv-components-specs', 'fpv-build-guides'], outOfScope: ['regulations', 'tuning', 'news'] },
  { token: 'app-4mCgiWoe3bYOxNYQbspqNhyh', name: 'Blackbox Tuning Advisor', scope: 'PID tuning, blackbox analysis', primaryDatasets: ['fpv-flight-tuning', 'fpv-pid-profiles'], outOfScope: ['regulations', 'builds', 'news'] },
  { token: 'app-1Oil9DvSgUHj9Yf8eEtTuShF', name: 'Community Hub', scope: 'community knowledge, general FPV', primaryDatasets: ['fpv-community-knowledge'], outOfScope: ['regulations'] },
];

// ─── DATASETS ───

export const DATASETS: DatasetInfo[] = [
  { id: 'd1d5e44b-4dde-445a-a686-67a1cc0d926c', name: 'fpv-flight-tuning', uuid: 'd1d5e44b-4dde-445a-a686-67a1cc0d926c', docCount: 11, minScoreThreshold: 0.60, chunkTokens: 512, overlapTokens: 50, semanticWeight: 0.7, keywordWeight: 0.3 },
  { id: '3eacd19f-ccd8-49ec-8482-51120918f0e0', name: 'fpv-pid-profiles', uuid: '3eacd19f-ccd8-49ec-8482-51120918f0e0', docCount: 0, minScoreThreshold: 0.65, chunkTokens: 400, overlapTokens: 30, semanticWeight: 0.5, keywordWeight: 0.5 },
  { id: '9b380b45-1be1-4ba6-b685-72e279e09ccc', name: 'fpv-troubleshooting', uuid: '9b380b45-1be1-4ba6-b685-72e279e09ccc', docCount: 0, minScoreThreshold: 0.55, chunkTokens: 600, overlapTokens: 80, semanticWeight: 0.6, keywordWeight: 0.4 },
  { id: '38bb7d60-b921-440c-b8f4-e49f9982a61f', name: 'fpv-components-specs', uuid: '38bb7d60-b921-440c-b8f4-e49f9982a61f', docCount: 0, minScoreThreshold: 0.60, chunkTokens: 500, overlapTokens: 40, semanticWeight: 0.4, keywordWeight: 0.6 },
  { id: 'a733583a-5e50-4e00-8b50-759380da59db', name: 'fpv-build-guides', uuid: 'a733583a-5e50-4e00-8b50-759380da59db', docCount: 0, minScoreThreshold: 0.50, chunkTokens: 800, overlapTokens: 120, semanticWeight: 0.7, keywordWeight: 0.3 },
  { id: '6a8a84c8-46ca-43f0-a3ea-3c19f32f5a17', name: 'fpv-news-reviews', uuid: '6a8a84c8-46ca-43f0-a3ea-3c19f32f5a17', docCount: 1, minScoreThreshold: 0.45, chunkTokens: 1000, overlapTokens: 100, semanticWeight: 0.8, keywordWeight: 0.2 },
  { id: 'cd17b1ea-a852-4d31-87d7-1b4c0bd46e7f', name: 'fpv-racing-events', uuid: 'cd17b1ea-a852-4d31-87d7-1b4c0bd46e7f', docCount: 0, minScoreThreshold: 0.50, chunkTokens: 750, overlapTokens: 75, semanticWeight: 0.6, keywordWeight: 0.4 },
  { id: '639af5aa-d424-4d0b-9633-a7ab541afcb2', name: 'fpv-community-knowledge', uuid: '639af5aa-d424-4d0b-9633-a7ab541afcb2', docCount: 3, minScoreThreshold: 0.55, chunkTokens: 600, overlapTokens: 60, semanticWeight: 0.7, keywordWeight: 0.3 },
  { id: '229be183-217b-4f93-ba48-9cdabbd1e37f', name: 'fpv-regulations', uuid: '229be183-217b-4f93-ba48-9cdabbd1e37f', docCount: 5, minScoreThreshold: 0.70, chunkTokens: 400, overlapTokens: 30, semanticWeight: 0.3, keywordWeight: 0.7 },
];

// ─── FILE-BASED ROUTING ───

export interface FileRoute {
  extensions: string[];
  appToken: string;
  appName: string;
  description: string;
}

export const FILE_ROUTES: FileRoute[] = [
  { extensions: ['.bbl', '.bfl', '.csv', '.log'], appToken: 'app-4mCgiWoe3bYOxNYQbspqNhyh', appName: 'Blackbox Tuning Advisor', description: 'Blackbox log / tune file analysis' },
  { extensions: ['.json'], appToken: 'app-JH8Fu38ezY8sUyhHb8ykHIWq', appName: 'Build Wizard', description: 'Config dump / build spec analysis' },
];

// ─── MULTI-DATASET QUERY RULES ───

export const MULTI_DATASET_RULES: { queryPattern: string; datasets: string[]; strategy: string }[] = [
  { queryPattern: 'best.*build', datasets: ['fpv-build-guides', 'fpv-components-specs', 'fpv-news-reviews'], strategy: 'merge_rerank' },
  { queryPattern: 'compatible|compatibility', datasets: ['fpv-components-specs'], strategy: 'single_metadata_filter' },
  { queryPattern: 'regulation|law|legal|shgm|faa', datasets: ['fpv-regulations'], strategy: 'single_strict_no_fallback' },
  { queryPattern: 'oscillation|motor.*fix|troubleshoot', datasets: ['fpv-troubleshooting', 'fpv-flight-tuning'], strategy: 'sequential_troubleshoot_first' },
];

// ─── HELPER FUNCTIONS ───

export function findRouteByIntent(intent: string): IntentRoute | undefined {
  return INTENT_ROUTES.find(r => r.intent === intent);
}

export function findRouteByQuery(query: string): IntentRoute | undefined {
  const lower = query.toLowerCase();
  // Score each route by signal matches
  const scored = INTENT_ROUTES.map(r => ({
    route: r,
    score: r.signals.filter(s => lower.includes(s.toLowerCase())).length,
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.score > 0 ? scored[0].route : undefined;
}

export function findDataset(uuidOrName: string): DatasetInfo | undefined {
  return DATASETS.find(d => d.uuid === uuidOrName || d.name === uuidOrName || d.id === uuidOrName);
}

export function findApp(tokenOrName: string): DifyAppInfo | undefined {
  return DIFY_APPS.find(a => a.token === tokenOrName || a.name === tokenOrName);
}

export function resolveFileRoute(filename: string): FileRoute | undefined {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  return FILE_ROUTES.find(r => r.extensions.includes(ext));
}

// ─── WORKFLOW IDS (DSL → API Mapping)
// Workflow DSL files in /dify_workflows/ mapped to their Dify app tokens.
// Use runWorkflow(appToken, inputs) in lib/content-automation/dify-generation.ts

export const WORKFLOW_IDS: Record<string, string> = {
  seoContentGenerator: 'a6d903cf-65f0-434a-8ac4-9f65bd9f080a',
  racingIntelligenceOrchestrator: '0b87c291-9d29-4826-adac-4ea8c2c55d59',
  metadataEnrichment: 'TODO-import-to-dify-first',
  affiliateOrchestrator: 'TODO-import-to-dify-first',
  sponsorshipOrchestrator: 'TODO-import-to-dify-first',
  scheduledPublisher: 'TODO-import-to-dify-first',
  droneBuildRecommender: 'TODO-import-to-dify-first',
  dronePartMatcher: 'TODO-import-to-dify-first',
  hdTuneAnalyzer: 'TODO-import-to-dify-first',
};

export const WORKFLOW_TOKENS: Record<string, string> = {
  seoContentGenerator: 'app-XJogXujRpHH3Ri8dOU9F',
  racingIntelligenceOrchestrator: process.env.DIFY_RACING_WORKFLOW_TOKEN || 'app-0UY7DiroMEswRvqqOtlZ',
  affiliateOrchestrator: process.env.DIFY_AFFILIATE_WORKFLOW_TOKEN || 'TODO_IMPORT',
  sponsorshipOrchestrator: process.env.DIFY_SPONSOR_WORKFLOW_TOKEN || 'TODO_IMPORT',
  metadataEnrichment: process.env.DIFY_METADATA_WORKFLOW_TOKEN || 'TODO_IMPORT',
  scheduledPublisher: process.env.DIFY_PUBLISHER_WORKFLOW_TOKEN || 'TODO_IMPORT',
  dronePartMatcher: process.env.DIFY_PART_WORKFLOW_TOKEN || 'TODO_IMPORT',
  hdTuneAnalyzer: process.env.DIFY_HDTUNE_WORKFLOW_TOKEN || 'TODO_IMPORT',
  droneBuildRecommender: process.env.DIFY_BUILD_WORKFLOW_TOKEN || 'TODO_IMPORT',
};
