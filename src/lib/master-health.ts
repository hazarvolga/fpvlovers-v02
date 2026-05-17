// Master Orchestrator — Unified Health Report
// Tüm katmanları (routing, retrieval, dify, ecosystem) tek raporda toplar.

import { getEcosystemHealth } from '@/lib/master-orchestrator';
import { getBudgetStatus } from '@/lib/dify-client';
import { generateEcosystemReport } from '@/lib/ecosystem-intelligence';
import { INTENT_ROUTES, DATASETS } from '@/lib/master-routing-tables';

export interface LayerHealth {
  name: string;
  status: 'ok' | 'degraded' | 'down';
  detail?: string;
}

export interface MasterHealthReport {
  generated_at: string;
  overall: 'ok' | 'degraded' | 'down';
  ecosystem_health_score: number;
  layers: LayerHealth[];
  budget: ReturnType<typeof getBudgetStatus>;
  content_gaps: string[];
  weak_routes: string[];
  action_endpoints: string[];
  stats: {
    total_intents: number;
    total_datasets: number;
    total_documents: number;
    populated_datasets: number;
    empty_datasets: number;
  };
}

export function getMasterHealth(): MasterHealthReport {
  const eco = getEcosystemHealth();
  const budget = getBudgetStatus();
  const report = generateEcosystemReport();

  const totalDocs = DATASETS.reduce((s, d) => s + d.docCount, 0);
  const populated = DATASETS.filter(d => d.docCount > 0).length;

  const stats = {
    total_intents: INTENT_ROUTES.length,
    total_datasets: DATASETS.length,
    total_documents: totalDocs,
    populated_datasets: populated,
    empty_datasets: DATASETS.length - populated,
  };

  const layers: LayerHealth[] = [
    {
      name: 'routing',
      status: stats.total_intents > 0 ? 'ok' : 'down',
      detail: `${stats.total_intents} intent route tanımlı`,
    },
    {
      name: 'retrieval',
      status: stats.total_datasets > 0 ? (stats.empty_datasets > 4 ? 'degraded' : 'ok') : 'down',
      detail: `${stats.total_datasets} dataset, ${stats.total_documents} doküman (${stats.empty_datasets} boş)`,
    },
    {
      name: 'dify_budget',
      status: budget.remaining > 0 ? (budget.usage_pct > 80 ? 'degraded' : 'ok') : 'down',
      detail: `${budget.remaining}/${budget.daily_limit} token kaldı (${budget.usage_pct}% kullanıldı)`,
    },
    {
      name: 'ecosystem_intelligence',
      status: report.insights.length >= 0 ? 'ok' : 'degraded',
      detail: `${report.insights.length} insight, score: ${eco.ecosystem_health_score}`,
    },
  ];

  const degraded = layers.some(l => l.status === 'degraded');
  const down = layers.some(l => l.status === 'down');
  const overall: 'ok' | 'degraded' | 'down' = down ? 'down' : degraded ? 'degraded' : 'ok';

  return {
    generated_at: new Date().toISOString(),
    overall,
    ecosystem_health_score: eco.ecosystem_health_score,
    layers,
    budget,
    content_gaps: report.content_gaps,
    weak_routes: report.weak_routes,
    action_endpoints: ['route', 'retrieval', 'compose', 'intelligence', 'health', 'routes', 'datasets'],
    stats,
  };
}
