// Affiliate Agent — Handles affiliate logic, product matching, CTA optimization

import fs from 'fs';
import path from 'path';
import { safeReadJson } from '@/lib/utils/json';
import { registerAgent } from '@/lib/agents';

const DATA = (file: string) => path.join(process.cwd(), 'data', file);

registerAgent({
  id: 'affiliate',
  name: 'Affiliate Agent',
  description: 'Handles affiliate logic: product matching, CTA generation, conversion optimization, placement strategy',
  systemPrompt: `You are an FPV Affiliate Monetization Agent for fpvlovers.com.tr.

YOUR ROLE:
1. Product Matching: Match content context to affiliate products in catalog
2. CTA Generation: Create high-converting, trust-preserving affiliate CTAs
3. Placement Strategy: Decide where and how many affiliate injections per page
4. Conversion Optimization: A/B test variants, pricing presentation, urgency signals
5. Trust Preservation: Never force irrelevant products, maintain editorial integrity
6. Multi-Network: Route to Amazon, Banggood, GetFPV based on availability and commission

AFFILIATE NETWORKS (priority order):
- Amazon Associates: 4-6% commission, widest selection, 24h cookie
- Banggood: 5-8% commission, FPV-specific, competitive pricing
- GetFPV: 6-10% direct vendor, highest trust in FPV community

CTA BEST PRACTICES:
- Use action verbs: "Check Price", "See Deal", "Get Yours"
- Add trust elements: "Recommended by fpvlovers pilots"
- Include urgency when genuine: "Limited stock", "Sale ends soon"
- NEVER use: "Click here", "Buy now" (too aggressive for FPV audience)
- Placement: top-right for comparison pages, inline for reviews, sticky for buying guides

TRUST RULES:
- Minimum trust score 60/100 for any recommendation
- Only recommend products we'd personally fly
- Disclose affiliate relationship transparently
- Never override editorial opinion with affiliate incentive`,

  inputSchema: {
    content: { type: 'string', required: true, description: 'Article or page markdown content' },
    content_type: { type: 'string', required: true, description: 'Content type' },
    force_products: { type: 'string', required: false, description: 'JSON array of product IDs to force' },
  },

  handler: async (input) => {
    const { content, content_type } = input;
    const contentLower = (content || '').toLowerCase();

    // Load catalog
    let catalog: any[] = safeReadJson(DATA('affiliates.json'), []);

    // Match products by keyword presence in content
    const matched = catalog.filter((p: any) => {
      if (!p.active) return false;
      const nameMatch = p.name && contentLower.includes(p.name.toLowerCase());
      const kwMatch = p.keywords?.some((kw: string) => contentLower.includes(kw.toLowerCase()));
      const catMatch = p.category && contentLower.includes(p.category.toLowerCase());
      return nameMatch || kwMatch || catMatch;
    });

    // Trust filter
    const trustData = safeReadJson<any>(DATA('trustScores.json'), { globalConfig: { minTrustScoreAffiliate: 60 } });
    const minTrust = trustData.globalConfig?.minTrustScoreAffiliate || 60;
    const eligible = matched.filter((p: any) => (p.trustScore || 80) >= minTrust);

    // Determine density
    const buyingTypes = ['buying-guide', 'comparison', 'build-guide'];
    const isBuying = buyingTypes.includes(content_type);
    const density = eligible.length >= 3 ? 'high' : eligible.length >= 1 ? 'medium' : 'zero';
    const maxPlacements = isBuying ? (density === 'high' ? 3 : density === 'medium' ? 2 : 1) : 0;

    // Generate CTAs
    const ctaTemplates: Record<string, string[]> = {
      medium: ['Best Price', 'Check Deal', 'Recommended'],
      high: ['Best Price', 'Check Deal', 'Top Pick'],
    };
    const ctaTexts = ctaTemplates[density] || [];

    // Placement strategy
    const placements: { position: string; productId: string; cta: string }[] = [];
    const positions = ['top-right', 'inline', 'bottom-right'];
    for (let i = 0; i < Math.min(eligible.length, maxPlacements); i++) {
      placements.push({
        position: positions[i % 3],
        productId: eligible[i].id,
        cta: ctaTexts[i % ctaTexts.length] || 'Check Price',
      });
    }

    // Network routing
    const networkPriority = eligible.map((p: any) => ({
      productId: p.id,
      network: p.network || 'amazon',
      commission: p.commission || 5,
      url: p.url,
    }));

    return {
      products_matched: eligible.length,
      products_eligible: eligible.length,
      density,
      max_placements: maxPlacements,
      placements,
      network_routing: networkPriority,
      strategy: isBuying ? 'active-affiliate' : 'passive-affiliate',
      ctas: ctaTexts.map((text, i) => ({ id: `cta_${i + 1}`, text, variant: 'A' })),
      conversion_estimate: density === 'high' ? '2-4% CTR' : density === 'medium' ? '1-2% CTR' : '<1% CTR',
      trust_level: eligible.every((p: any) => p.trustScore >= 90) ? 'excellent' : 'good',
    };
  },
});
