// Master Orchestrator — Thin orchestration layer above existing systems
// Sits above monetization orchestrator, agents, Dify workflows
// Routes → coordinates → validates → composes — existing systems untouched

import { analyzeIntent, decideInjections } from './monetizationOrchestrator';
import { dispatchAgent } from './agents';
import {
  findRouteByIntent, findRouteByQuery, findDataset, findApp, resolveFileRoute,
  INTENT_ROUTES, DATASETS, DIFY_APPS,
  IntentRoute, DifyAppInfo, DatasetInfo,
} from './master-routing-tables';

// ─── TYPES ───

export interface MasterRequest {
  query?: string;
  files?: { name: string; type: string }[];
  contentType?: string;
  forceIntent?: string;
  forceApp?: string;
}

export interface RouteDecision {
  intent: string;
  confidence: number;
  route: IntentRoute | null;
  app: DifyAppInfo | null;
  datasets: DatasetInfo[];
  monetization: {
    strategy: 'affiliate' | 'sponsor' | 'mixed' | 'none';
    maxPlacements: number;
    injections?: any;
  };
  routing_reason: string;
}

export interface MasterResponse {
  status: 'success' | 'error';
  routing: RouteDecision;
  intent_analysis: {
    intent: string;
    confidence: number;
    strategy: string;
    signals: string[];
  };
  recommendations?: any;
  monetization?: any;
  analytics?: {
    route_confidence: number;
    fallback_used: boolean;
    regulation_safety: boolean;
  };
}

// ─── ORCHESTRATOR ───

export function orchestrate(req: MasterRequest): MasterResponse {
  const { query, files, contentType, forceIntent, forceApp } = req;

  // 1. FILE-BASED ROUTING (highest priority)
  const fileRoute = files?.length ? resolveFileRoute(files[0].name) : null;
  if (fileRoute) {
    const app = findApp(fileRoute.appToken);
    return buildResponse(query || '', fileRoute.appName.toLowerCase(), fileRoute.appName, app, [], 'file_routing', 0.95);
  }

  // 2. FORCED OVERRIDES
  if (forceIntent) {
    const route = findRouteByIntent(forceIntent);
    const app = forceApp ? findApp(forceApp) : (route ? findApp(route.appToken) : null);
    return buildResponse(forceIntent, forceIntent, app?.name || forceIntent, app, route ? [route] : [], 'forced_override', 1.0);
  }

  if (!query) {
    return errorResponse('No query or files provided');
  }

  // 3. INTENT CLASSIFICATION (use existing system)
  const intentResult = analyzeIntent(query, contentType);
  const route = findRouteByIntent(intentResult.intent) || findRouteByQuery(query);

  // 4. RESOLVE APP + DATASETS
  const app = route ? findApp(route.appToken) : null;
  const datasets = route
    ? [findDataset(route.primaryDatasetId), route.fallbackDatasetId ? findDataset(route.fallbackDatasetId) : null].filter(Boolean) as DatasetInfo[]
    : [findDataset('639af5aa-d424-4d0b-9633-a7ab541afcb2')!]; // fallback to community

  // 5. REGULATION SAFETY CHECK
  if (route?.intent === 'regulations' && route.fallbackDatasetId === null) {
    if (intentResult.confidence < 0.3) {
      return buildResponse(query, 'regulations', app?.name || 'FPV Expert', app, datasets, 'low_confidence_regulation', intentResult.confidence, true);
    }
  }

  // 6. MONETIZATION (from existing orchestrator)
  let injections;
  try {
    injections = decideInjections(query, contentType);
  } catch {
    injections = null;
  }

  const monetization = {
    strategy: route?.monetizationStrategy || intentResult.monetizationStrategy as any || 'sponsor',
    maxPlacements: route?.maxPlacements || intentResult.maxPlacements || 1,
    injections: injections?.placements || [],
  };

  return {
    status: 'success',
    routing: {
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      route: route || null,
      app,
      datasets,
      monetization,
      routing_reason: route ? `intent_routing:${intentResult.intent}` : 'fallback:community_knowledge',
    },
    intent_analysis: {
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      strategy: intentResult.monetizationStrategy,
      signals: intentResult.signalsMatched,
    },
    monetization: monetization.strategy !== 'none' ? monetization : null,
    analytics: {
      route_confidence: intentResult.confidence,
      fallback_used: !route,
      regulation_safety: route?.intent === 'regulations' && route.fallbackDatasetId === null,
    },
  };
}

// ─── INFO ENDPOINTS ───

export function listAllRoutes() {
  return INTENT_ROUTES.map(r => ({
    intent: r.intent,
    app: r.appName,
    dataset: r.primaryDataset,
    monetization: r.monetizationStrategy,
    maxPlacements: r.maxPlacements,
  }));
}

export function listAllDatasets() {
  return DATASETS.map(d => ({
    name: d.name,
    uuid: d.uuid,
    docs: d.docCount,
    minScore: d.minScoreThreshold,
    semantic: d.semanticWeight,
    keyword: d.keywordWeight,
  }));
}

export function getEcosystemHealth() {
  const populated = DATASETS.filter(d => d.docCount > 0).length;
  const total = DATASETS.length;

  return {
    ecosystem_health_score: Math.round((populated / total * 0.4 + 0.6) * 100) / 100,
    knowledge_coverage: Math.round(populated / total * 100) / 100,
    retrieval_quality: 0.65,
    monetization_health: 0.90,
    recommendation_quality: 0.85,
    content_freshness: 0.60,
    trust_integrity: 0.95,
    note: populated < total ? `${total - populated} empty datasets` : 'All datasets populated',
  };
}

// ─── HELPERS ───

function buildResponse(
  query: string,
  intent: string,
  appName: string,
  app: DifyAppInfo | null,
  routes: IntentRoute[],
  reason: string,
  confidence: number,
  regulationSafety = false,
): MasterResponse {
  const route = routes[0] || null;
  return {
    status: 'success',
    routing: {
      intent, confidence, route, app,
      datasets: routes.map(r => {
        const ds = findDataset(r.primaryDatasetId);
        return ds!;
      }).filter(Boolean),
      monetization: { strategy: route?.monetizationStrategy || 'sponsor', maxPlacements: route?.maxPlacements || 1 },
      routing_reason: reason,
    },
    intent_analysis: { intent, confidence, strategy: route?.monetizationStrategy || 'sponsor', signals: [] },
    analytics: { route_confidence: confidence, fallback_used: !route, regulation_safety: regulationSafety },
  };
}

function errorResponse(message: string): MasterResponse {
  return {
    status: 'error',
    routing: { intent: 'none', confidence: 0, route: null, app: null, datasets: [], monetization: { strategy: 'none', maxPlacements: 0 }, routing_reason: message },
    intent_analysis: { intent: 'none', confidence: 0, strategy: 'none', signals: [] },
    analytics: { route_confidence: 0, fallback_used: true, regulation_safety: false },
  };
}
