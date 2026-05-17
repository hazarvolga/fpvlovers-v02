// Retrieval Agent — Handles semantic retrieval optimization, dataset routing, query expansion

import { registerAgent } from '@/lib/agents';

registerAgent({
  id: 'retrieval',
  name: 'Retrieval Agent',
  description: 'Handles semantic retrieval: query expansion, dataset routing, retrieval quality optimization, hybrid search tuning',
  systemPrompt: `You are an FPV Retrieval Optimization Agent for the fpvlovers.com.tr RAG system.

YOUR ROLE:
1. Query Analysis: Classify incoming queries and identify the best knowledge bases to search
2. Query Expansion: Generate alternative phrasings, synonyms, and related terms
3. Dataset Routing: Route queries to the most relevant dataset(s) among the 9 FPV knowledge bases
4. Retrieval Tuning: Adjust score thresholds, keyword vs semantic weights, top-K values
5. Hybrid Search Optimization: Balance keyword matching with semantic search
6. Reranking Guidance: Determine when reranking is most beneficial

9 FPV DATASETS:
| Dataset | Best For |
|---------|----------|
| fpv-flight-tuning | PID tuning, rates, filters, Betaflight config |
| fpv-pid-profiles | Specific PID profiles, tune sharing |
| fpv-troubleshooting | Problems, errors, fixes, diagnosis |
| fpv-components-specs | Hardware specs, compatibility, pinouts |
| fpv-build-guides | Step-by-step builds, parts selection |
| fpv-news-reviews | Product reviews, industry news |
| fpv-racing-events | Race events, competition, tracks |
| fpv-community-knowledge | Tips, tricks, general FPV discussion |
| fpv-regulations | Legal, airspace, battery transport laws |

ROUTING RULES:
- Tuning questions → fpv-flight-tuning (primary) + fpv-pid-profiles (secondary)
- Hardware specs → fpv-components-specs (primary) + fpv-build-guides (secondary)
- "Best X" → fpv-news-reviews (primary) + fpv-community-knowledge (secondary)
- Legal/regulation → fpv-regulations (exclusive, no fallback)
- Troubleshooting → fpv-troubleshooting (primary) + fpv-community-knowledge (secondary)`,

  inputSchema: {
    query: { type: 'string', required: true, description: 'User query or search term' },
    content_type: { type: 'string', required: false, description: 'Content type for context' },
    max_results: { type: 'number', required: false, description: 'Max results to return' },
  },

  handler: async (input) => {
    const { query, content_type } = input;
    const queryLower = (query || '').toLowerCase();

    // Dataset routing
    type RouteEntry = { dataset: string; uuid: string; relevance: number };
    const routes: RouteEntry[] = [];

    const datasets = [
      { dataset: 'fpv-flight-tuning', uuid: 'd1d5e44b-4dde-445a-a686-67a1cc0d926c', keywords: ['tune', 'tuning', 'pid', 'rates', 'betaflight', 'filter', 'd term', 'p term', 'i term', 'gyro', 'rpm'] },
      { dataset: 'fpv-pid-profiles', uuid: '3eacd19f-ccd8-49ec-8482-51120918f0e0', keywords: ['pid profile', 'pids', 'tune share', 'preset'] },
      { dataset: 'fpv-troubleshooting', uuid: '9b380b45-1be1-4ba6-b685-72e279e09ccc', keywords: ['fix', 'problem', 'not working', 'broken', 'error', 'issue', 'fail', 'crash', 'smoke'] },
      { dataset: 'fpv-components-specs', uuid: '38bb7d60-b921-440c-b8f4-e49f9982a61f', keywords: ['spec', 'specs', 'weight', 'dimension', 'pinout', 'wiring', 'motor size', 'kv', 'amp'] },
      { dataset: 'fpv-build-guides', uuid: 'a733583a-5e50-4e00-8b50-759380da59db', keywords: ['build', 'parts', 'assemble', 'solder', 'stack', 'frame'] },
      { dataset: 'fpv-news-reviews', uuid: '6a8a84c8-46ca-43f0-a3ea-3c19f32f5a17', keywords: ['review', 'best', 'compare', 'new', 'released', 'announced'] },
      { dataset: 'fpv-racing-events', uuid: 'cd17b1ea-a852-4d31-87d7-1b4c0bd46e7f', keywords: ['race', 'racing', 'event', 'competition', 'track', 'multigp'] },
      { dataset: 'fpv-community-knowledge', uuid: '639af5aa-d424-4d0b-9633-a7ab541afcb2', keywords: ['tip', 'trick', 'fpv', 'drone', 'hobby', 'community'] },
      { dataset: 'fpv-regulations', uuid: '9b380b45-1be1-4ba6-b685-72e279e09cc', keywords: ['law', 'legal', 'regulation', 'shgm', 'faa', 'airspace', 'license'] },
    ];

    for (const ds of datasets) {
      let relevance = 0;
      for (const kw of ds.keywords) {
        if (queryLower.includes(kw)) relevance += 3;
      }
      if (relevance > 0) {
        routes.push({ dataset: ds.dataset, uuid: ds.uuid, relevance });
      }
    }

    // Fallback routing if no keywords matched
    if (routes.length === 0) {
      routes.push({ dataset: 'fpv-community-knowledge', uuid: '639af5aa-d424-4d0b-9633-a7ab541afcb2', relevance: 1 });
      routes.push({ dataset: 'fpv-news-reviews', uuid: '6a8a84c8-46ca-43f0-a3ea-3c19f32f5a17', relevance: 1 });
    }

    routes.sort((a, b) => b.relevance - a.relevance);

    // Query expansion
    const expansions = query.split(' ').flatMap((w: string) => {
      const synonyms: Record<string, string[]> = {
        tune: ['tuning', 'pid', 'adjust'], motor: ['motors', 'bell', 'stator'],
        frame: ['chassis', 'arm'], vtx: ['video transmitter', 'transmitter'],
        fc: ['flight controller', 'stack'], esc: ['speed controller', '4in1'],
        battery: ['lipo', 'pack'], camera: ['fpv cam', 'runcam', 'caddx'],
        build: ['assembly', 'construct'], fix: ['repair', 'troubleshoot', 'debug'],
      };
      const lower = w.toLowerCase();
      return synonyms[lower] || [];
    });

    // Determine retrieval config
    const primary = routes[0];
    const secondary = routes.length > 1 ? routes[1] : null;

    const retrievalConfig = {
      score_threshold: primary.relevance >= 9 ? 0.5 : primary.relevance >= 6 ? 0.45 : 0.4,
      keyword_weight: primary.dataset === 'fpv-regulations' ? 0.7 : primary.dataset === 'fpv-components-specs' ? 0.6 : 0.4,
      semantic_weight: primary.dataset === 'fpv-community-knowledge' ? 0.8 : 0.6,
      top_k: primary.relevance >= 9 ? 6 : 4,
      use_reranking: primary.dataset !== 'fpv-community-knowledge',
    };

    return {
      primary_dataset: primary,
      secondary_dataset: secondary,
      all_routes: routes.slice(0, 3),
      query_expansions: [...new Set(expansions)].slice(0, 5),
      retrieval_config: retrievalConfig,
      query_complexity: query.split(' ').length > 5 ? 'complex' : 'simple',
      estimated_chunks: retrievalConfig.top_k * (secondary ? 2 : 1),
      strategy: 'hybrid',
    };
  },
});
