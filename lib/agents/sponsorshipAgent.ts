// Sponsorship Agent — Handles sponsor orchestration, campaign management, visibility strategy

import fs from 'fs';
import path from 'path';
import { registerAgent } from './index';

const DATA = (file: string) => path.join(process.cwd(), 'data', file);

registerAgent({
  id: 'sponsorship',
  name: 'Sponsorship Agent',
  description: 'Handles sponsor orchestration: campaign classification, visibility strategy, placement, trust scoring',
  systemPrompt: `You are an FPV Sponsorship Orchestration Agent for fpvlovers.com.tr.

YOUR ROLE:
1. Sponsor Evaluation: Analyze sponsor brand fit for FPV ecosystem
2. Campaign Classification: Categorize as brand-awareness, product-launch, content, or event sponsorship
3. Visibility Strategy: Determine optimal placement frequency and content types
4. Scoring & Ranking: Calculate visibility scores based on relevance, trust, and budget
5. Trust Protection: Ensure sponsors don't override editorial integrity
6. Campaign Metrics: Track impressions, retrieval appearances, recommendation exposure

SPONSORSHIP TIERS:
- Premium ($2000+/mo): Top priority placement, all content types, dedicated sponsor cards
- Standard ($1000-1999/mo): Priority placement, 2-3 content types, inline sponsor blocks
- Starter ($500-999/mo): Rotating placement, 1 content type, text-only sponsor mentions
- Trial ($0-499/mo): Experimental placement, limited visibility, evaluation period

CONTENT TYPES FOR SPONSORSHIP:
- buying-guide: HIGH value — readers are purchase-ready
- comparison: HIGH value — direct product consideration
- build-guide: MEDIUM value — parts selection influence
- ecosystem-page: MEDIUM value — brand awareness
- review: LOW value — unless sponsor is the reviewed brand
- article: LOW value — informational, lower commercial intent

TRUST-BASED RANKING FORMULA:
final_score = semantic_relevance × 0.3 + trust_score × 0.4 + historical_ctr × 0.2 + budget_tier × 0.1

RULES:
- Sponsors NEVER force top ranking
- Semantic relevance must be > 50/100 for placement
- Final ranking uses weighted scoring, not highest bidder
- Every sponsor placement must be clearly labeled "Sponsored"`,

  inputSchema: {
    sponsor_name: { type: 'string', required: true, description: 'Sponsor brand name' },
    sponsor_category: { type: 'string', required: true, description: 'Product category' },
    budget: { type: 'number', required: false, description: 'Monthly budget in USD' },
    campaign_type: { type: 'string', required: false, description: 'brand-awareness | product-launch | content | event' },
  },

  handler: async (input) => {
    const { sponsor_name, sponsor_category, budget = 1000, campaign_type = 'brand-awareness' } = input;

    // Load existing sponsors for context
    let sponsors: any[] = [];
    try { sponsors = JSON.parse(fs.readFileSync(DATA('sponsors.json'), 'utf-8')); } catch {}

    // Budget tier
    let tier: string, multiplier: number;
    if (budget >= 2000) { tier = 'premium'; multiplier = 1.5; }
    else if (budget >= 1000) { tier = 'standard'; multiplier = 1.2; }
    else if (budget >= 500) { tier = 'starter'; multiplier = 1.0; }
    else { tier = 'trial'; multiplier = 0.7; }

    // Category relevance scoring
    const highRelevance = ['Motors', 'ESC', 'Flight Controller', 'Frame', 'VTX', 'Camera', 'Goggles'];
    const mediumRelevance = ['Battery', 'Propellers', 'Radio', 'Receiver'];
    const baseRelevance = highRelevance.includes(sponsor_category) ? 85 : mediumRelevance.includes(sponsor_category) ? 65 : 45;
    const relevanceScore = Math.min(Math.round(baseRelevance * multiplier), 100);

    // Content type fit
    const contentFit: Record<string, string[]> = {
      'brand-awareness': ['ecosystem-page', 'article', 'build-guide'],
      'product-launch': ['buying-guide', 'comparison', 'review'],
      'content': ['article', 'build-guide', 'ecosystem-page'],
      'event': ['news', 'article'],
    };
    const recommendedTypes = contentFit[campaign_type] || ['article'];

    const visibilityScore = Math.min(Math.round((relevanceScore * 0.6 + 80 * 0.4) * multiplier), 100);

    // Placement suggestions
    const placements = {
      premium: { max: 4, frequency: 'every-page', positions: ['top-right', 'inline', 'bottom-right', 'sticky'] },
      standard: { max: 3, frequency: 'every-other', positions: ['top-right', 'inline', 'bottom-right'] },
      starter: { max: 2, frequency: 'rotating', positions: ['inline', 'bottom-right'] },
      trial: { max: 1, frequency: 'occasional', positions: ['bottom-right'] },
    };
    const placement = placements[tier as keyof typeof placements];

    return {
      sponsor_analysis: {
        name: sponsor_name,
        category: sponsor_category,
        budget_tier: tier,
        relevance_score: relevanceScore,
        visibility_score: visibilityScore,
        trust_score_preset: 100,
        campaign_type,
      },
      placement_strategy: {
        ...placement,
        recommended_content_types: recommendedTypes,
        label: 'Sponsored',
        label_position: 'before-content',
      },
      scoring_breakdown: {
        semantic_relevance: relevanceScore,
        trust_score: 100,
        budget_multiplier: multiplier,
        final_score: Math.round(relevanceScore * 0.3 + 100 * 0.4 + 0 * 0.2 + multiplier * 50 * 0.1),
      },
      approval: {
        auto_approved: visibilityScore >= 50,
        requires_review: visibilityScore < 50 && visibilityScore >= 30,
        rejected: visibilityScore < 30,
        reason: visibilityScore >= 50 ? 'Meets all criteria' : visibilityScore >= 30 ? 'Below optimal threshold — manual review needed' : 'Insufficient relevance for FPV ecosystem',
      },
      competitive_analysis: {
        similar_sponsors: sponsors.filter((s: any) => s.category === sponsor_category).length,
        category_competition: sponsors.filter((s: any) => s.category === sponsor_category).length >= 3 ? 'high' : 'low',
      },
    };
  },
});
