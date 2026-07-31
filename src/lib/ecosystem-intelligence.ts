// Ecosystem Intelligence Engine — advisory only, no side effects

import { DATASETS, INTENT_ROUTES } from '@/lib/master-routing-tables';
import { getEcosystemHealth } from '@/lib/master-orchestrator';

// ─── TYPES ───

export interface EcosystemInsight {
  type: 'content_gap' | 'routing_hint' | 'sponsor_match' | 'metadata_enrichment' | 'trend';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  suggestion: string;
  affected?: string[];
}

export interface EcosystemReport {
  generated_at: string;
  health_score: number;
  insights: EcosystemInsight[];
  content_gaps: string[];
  strong_routes: string[];
  weak_routes: string[];
  sponsor_opportunities: string[];
}

// ─── CONTENT GAP ANALYSIS ───

export function analyzeContentGaps(): EcosystemInsight[] {
  const insights: EcosystemInsight[] = [];

  for (const ds of DATASETS) {
    // docCount is not tracked locally; live Qdrant is the source of truth.
    // Emit a generic advisory rather than a false "0 docs" warning.
    insights.push({
      type: 'content_gap',
      severity: 'low',
      title: `Dataset depth unverified: ${ds.name}`,
      description: `${ds.name} doc count is not tracked locally. Verify via SSH or Dify Studio.`,
      suggestion: `Run \`curl http://qdrant:6333/collections/${ds.uuid}\` inside the Dify container to get the live points_count.`,
      affected: [ds.name],
    });
  }

  return insights;
}

// ─── ROUTING ANALYSIS ───

export function analyzeRoutingCoverage(): { strong: string[]; weak: string[] } {
  const strong: string[] = [];
  const weak: string[] = [];

  for (const route of INTENT_ROUTES) {
    const primaryDs = DATASETS.find(d => d.id === route.primaryDatasetId);
    if (primaryDs) {
      strong.push(route.intent);
    } else {
      weak.push(route.intent);
    }
  }

  return { strong, weak };
}

// ─── SPONSOR OPPORTUNITY DETECTION ───

export function detectSponsorOpportunities(): EcosystemInsight[] {
  const opportunities: EcosystemInsight[] = [];

  for (const route of INTENT_ROUTES) {
    if (['affiliate', 'mixed'].includes(route.monetizationStrategy)) {
      const ds = DATASETS.find(d => d.id === route.primaryDatasetId);
      if (ds) {
        opportunities.push({
          type: 'sponsor_match',
          severity: 'medium',
          title: `Monetization gap: ${route.intent}`,
          description: `${route.intent} intent has ${route.monetizationStrategy} strategy but empty dataset.`,
          suggestion: `Populate ${ds.name} to unlock ${route.monetizationStrategy} revenue for ${route.intent} queries.`,
          affected: [route.intent, ds.name],
        });
      }
    }
  }

  return opportunities;
}

// ─── METADATA ENRICHMENT SUGGESTIONS ───

export function generateMetadataSuggestions(query: string, intent: string): EcosystemInsight[] {
  const tags: Record<string, string[]> = {
    tuning:      ['pid', 'betaflight', 'rates', 'filter', 'blackbox'],
    pid:         ['pid', 'p-term', 'i-term', 'd-term', 'tune'],
    troubleshoot:['repair', 'fix', 'issue', 'problem', 'crash'],
    parts:       ['motor', 'esc', 'fc', 'frame', 'prop', 'vtx'],
    build:       ['build', 'setup', 'wiring', 'solder', 'config'],
    buying:      ['price', 'budget', 'review', 'recommendation'],
    regulations: ['regulation', 'legal', 'registration', 'shgm', 'easa'],
    racing:      ['gate', 'lap', 'track', 'race', 'freestyle'],
    community:   ['fpv', 'pilot', 'community', 'group'],
    news:        ['release', 'new', 'update', 'announce'],
  };

  const suggested = tags[intent] ?? [];
  if (suggested.length === 0) return [];

  return [{
    type: 'metadata_enrichment',
    severity: 'low',
    title: `Suggested tags for ${intent}`,
    description: `Query "${query}" maps to ${intent}. Recommended semantic tags for retrieval optimization.`,
    suggestion: `Apply tags: ${suggested.join(', ')}`,
    affected: [intent],
  }];
}

// ─── FULL REPORT ───

export function generateEcosystemReport(query?: string, intent?: string): EcosystemReport {
  const health = getEcosystemHealth();
  const gaps = analyzeContentGaps();
  const { strong, weak } = analyzeRoutingCoverage();
  const sponsorOps = detectSponsorOpportunities();
  const metaSuggestions = query && intent
    ? generateMetadataSuggestions(query, intent)
    : [];

  const allInsights = [...gaps, ...sponsorOps, ...metaSuggestions]
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    });

  return {
    generated_at: new Date().toISOString(),
    health_score: health.ecosystem_health_score,
    insights: allInsights,
    content_gaps: [],
    strong_routes: strong,
    weak_routes: weak,
    sponsor_opportunities: sponsorOps.map(o => o.title),
  };
}
