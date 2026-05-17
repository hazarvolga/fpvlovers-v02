// Recommendation Agent — Handles ecosystem recommendations

import { registerAgent } from '@/lib/agents';
import { getRecommendations, analyzeIntent, decideInjections } from '@/lib/monetizationOrchestrator';

registerAgent({
  id: 'recommendation',
  name: 'Recommendation Agent',
  description: 'Handles ecosystem recommendations: product suggestions, build recommendations, upgrade paths, compatibility-aware suggestions',
  systemPrompt: `You are an FPV Ecosystem Recommendation Agent for fpvlovers.com.tr.

YOUR ROLE:
1. Product Recommendations: Suggest the best products based on user context and needs
2. Build Recommendations: Recommend complete compatible drone builds
3. Upgrade Paths: Suggest logical upgrade sequences (what to buy next)
4. Compatibility Checking: Ensure recommended parts work together
5. Ecosystem Mapping: Show how products relate within the FPV ecosystem
6. Trust-First Ranking: Prioritize genuine recommendations over affiliate revenue

RECOMMENDATION PHILOSOPHY:
- Trust is our #1 asset — never compromise it for commission
- Every recommendation must be genuinely useful
- Be specific: exact models, not generic categories
- Include pricing context (budget/mid-range/premium)
- Explain WHY each recommendation fits the user's needs
- Acknowledge alternatives even when recommending a specific product

ECOSYSTEM RELATIONSHIPS:
- Motor KV → Battery voltage (6S: 1700-1950KV, 4S: 2400-2750KV)
- ESC amp rating → Motor current draw (ESC ≥ motor peak × 1.2)
- Frame size → Prop size (5": 5.1", 3": 3", 7": 7")
- VTX power → Flight range (25mW park, 200mW medium, 1W+ long range)
- FC UARTs → Peripherals (RX + VTX + GPS + Camera Control)
- Stack size → Frame mounting (20×20, 30.5×30.5, whoop)

RECOMMENDATION TYPES:
1. "Best For" — Best product for a specific use case
2. "Budget Pick" — Best value under a price point
3. "Pro Choice" — Premium option for experienced pilots
4. "Upgrade From" — What to upgrade to from current gear
5. "Complete Build" — Full compatible parts list`,

  inputSchema: {
    query: { type: 'string', required: true, description: 'User query or context' },
    content_type: { type: 'string', required: false, description: 'Content type' },
    budget: { type: 'string', required: false, description: 'Budget constraint' },
    flight_style: { type: 'string', required: false, description: 'freestyle | racing | long-range | cinematic | whoop' },
  },

  handler: async (input) => {
    const { query, content_type } = input;

    // Use the existing orchestrator for recommendations
    const intent = analyzeIntent(query, content_type);
    const recs = getRecommendations(query, content_type, 3);
    const injections = decideInjections(query, content_type);

    // Build ecosystem map from recommendations
    const ecosystemMap: { product: string; category: string; compatibleWith: string[]; upgradePath: string | null }[] = [];

    for (const aff of recs.affiliates.slice(0, 3)) {
      ecosystemMap.push({
        product: aff.name,
        category: aff.category,
        compatibleWith: aff.compatibleWith || [],
        upgradePath: aff.category === 'FPV Goggles' ? 'Consider DJI Goggles 3 for 4K' : aff.category === 'Frames' ? 'Upgrade to carbon fiber arms' : null,
      });
    }

    // Generate recommendations by type
    const recommendations = {
      best_for: recs.affiliates[0] ? {
        product: recs.affiliates[0].name,
        category: recs.affiliates[0].category,
        price: recs.affiliates[0].price,
        currency: recs.affiliates[0].currency,
        reason: `Highest trust score (${recs.affiliates[0].trustScore}/100) and semantic match for your query`,
      } : null,
      budget_pick: recs.affiliates.length > 1 ? {
        product: recs.affiliates[1].name,
        price: recs.affiliates[1].price,
        currency: recs.affiliates[1].currency,
        reason: 'Great value alternative',
      } : null,
      sponsor_suggestion: recs.sponsors[0] ? {
        brand: recs.sponsors[0].name,
        products: recs.sponsors[0].products?.map((p: any) => p.name) || [],
        url: recs.sponsors[0].url,
      } : null,
    };

    // Upgrade paths
    const upgradePaths: string[] = [];
    if (recs.affiliates.length > 0) {
      const cat = recs.affiliates[0].category;
      if (cat === 'FPV Goggles') upgradePaths.push('Next: OLED display goggles for better contrast');
      if (cat === 'Frames') upgradePaths.push('Next: Titanium hardware for weight reduction');
      if (cat === 'Motors') upgradePaths.push('Next: Higher KV for more speed, or lower KV for efficiency');
      if (cat === 'VTX') upgradePaths.push('Next: HD digital system (DJI O3 or Walksnail)');
    }

    return {
      query_analysis: {
        intent: intent.intent,
        strategy: intent.monetizationStrategy,
        confidence: intent.confidence,
      },
      recommendations,
      ecosystem_map: ecosystemMap,
      upgrade_paths: upgradePaths,
      injection_plan: {
        placements: injections.placements.length,
        strategy: injections.strategy,
        density: injections.density,
      },
      trust_note: recs.affiliates.length === 0 ? 'No eligible products met trust threshold — showing organic content only' : 'All recommendations passed trust validation',
      generated_at: new Date().toISOString(),
    };
  },
});
