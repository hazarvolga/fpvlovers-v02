import { NextRequest, NextResponse } from 'next/server';
import {
  analyzeIntent,
  getRecommendations,
  checkAffiliateEligibility,
  checkSponsorEligibility,
  decideInjections,
  evaluateABTest,
  getSeasonalCampaigns,
  getCrossSellRecommendations,
  getMultiNetworkPrice,
} from '@/lib/monetizationOrchestrator';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') || '';
  const contentType = req.nextUrl.searchParams.get('contentType') || undefined;
  const action = req.nextUrl.searchParams.get('action') || 'orchestrate';

  if (!query && action !== 'eligibility') {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  switch (action) {
    case 'intent':
      return NextResponse.json({ result: analyzeIntent(query, contentType) });

    case 'recommend':
      return NextResponse.json(getRecommendations(query, contentType));

    case 'eligibility': {
      const affId = req.nextUrl.searchParams.get('affiliateId');
      const spId = req.nextUrl.searchParams.get('sponsorId');
      const result: any = {};
      if (affId) result.affiliate = checkAffiliateEligibility(affId, query);
      if (spId) result.sponsor = checkSponsorEligibility(spId, query);
      return NextResponse.json(result);
    }

    case 'inject':
      return NextResponse.json(decideInjections(query, contentType));

    case 'ab-test': {
      const ctaId = req.nextUrl.searchParams.get('ctaId') || '';
      return NextResponse.json(evaluateABTest(ctaId));
    }

    case 'seasonal':
      return NextResponse.json({ campaigns: getSeasonalCampaigns() });

    case 'cross-sell': {
      const productId = req.nextUrl.searchParams.get('productId') || '';
      return NextResponse.json(getCrossSellRecommendations(productId));
    }

    case 'network-price': {
      const productId = req.nextUrl.searchParams.get('productId') || '';
      return NextResponse.json({ prices: getMultiNetworkPrice(productId) });
    }

    case 'orchestrate':
    default: {
      const intent = analyzeIntent(query, contentType);
      const recommendations = getRecommendations(query, contentType);
      const injections = decideInjections(query, contentType);
      return NextResponse.json({
        pipeline: 'Monetization Orchestrator v1.0',
        intent,
        recommendations: {
          affiliates: recommendations.affiliates.map(a => ({
            id: a.id, name: a.name, category: a.category, price: a.price,
            currency: a.currency, url: a.url, trustScore: a.trustScore,
            network: a.network,
          })),
          sponsors: recommendations.sponsors.map(s => ({
            id: s.id, name: s.name, category: s.category, url: s.url,
            priority: s.priority, trustScore: s.trustScore,
            products: s.products.map(p => p.name),
          })),
        },
        injections,
        debug: recommendations.debug,
      });
    }
  }
}
