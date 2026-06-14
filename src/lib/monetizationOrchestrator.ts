import fs from 'fs';
import path from 'path';
import { safeReadJson } from '@/lib/utils/json';

// ─── DATA PATHS ───
const DATA = (file: string) => path.join(process.cwd(), 'data', file);

function load<T>(file: string, fallback: T): T {
  return safeReadJson<T>(file, fallback);
}

function write(file: string, data: any) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ─── TYPES ───
type Placement = 'top-right' | 'bottom-right' | 'inline' | 'sticky';
type MonetizationStrategy = 'affiliate' | 'sponsor' | 'mixed' | 'none';

interface IntentProfile {
  intent: string;
  signals: string[];
  weight: number;
  contentTypes: string[];
  monetizationStrategy: MonetizationStrategy;
  maxPlacements: number;
  confidenceThreshold: number;
}

interface AffiliateProduct {
  id: string; name: string; type: string; network: string; productId: string;
  url: string; price: number; currency: string; commission: number; category: string;
  keywords: string[]; trustScore: number; image: string; compatibleWith: string[];
  active: boolean; featured: boolean; stats: { clicks: number; conversions: number; revenue: number; ctr: number; conversionRate: number };
}

interface Sponsor {
  id: string; name: string; type: string; url: string; budget: string;
  priority: number; category: string; region: string; active: boolean;
  products: { name: string; url: string; compatibleWith?: string[] }[];
  visibilityScore: number; semanticRelevance: number; retrievalPresence: number;
  recommendationExposure: number; trustScore: number;
  campaignMetrics: { impressions: number; clicks: number; ctr: number; contextualEngagement: number; retrievalAppearances: number; recommendationConfidence: number; semanticMatchQuality: number };
}

interface CTA {
  id: string; text: string; placement: Placement; color: string; active: boolean;
  variant: string; abTest: { enabled: boolean; variantB: string; variantBColor: string; winner: string | null };
  placementStrategies: Record<string, Placement>;
  maxPerPage: number; autoInject: { enabled: boolean; minIntentScore: number; contentTypes: string[] };
}

interface Campaign {
  id: string;
  name: string;
  active: boolean;
  type?: string;
  season?: string;
  startDate?: string;
  endDate?: string;
  products: string[];
  discountCode?: string;
  crossSellRules?: {
    sourceProduct: string;
    targetProducts: string[];
    strategy?: string;
  }[];
}

interface TrustConfig {
  affiliates: Record<string, { trustScore: number; semanticRelevance: number; recommendationQuality: number; bounceImpact: number }>;
  sponsors: Record<string, { trustScore: number; semanticRelevance: number; recommendationQuality: number; bounceImpact: number }>;
  globalConfig: {
    minTrustScoreAffiliate: number; minTrustScoreSponsor: number;
    maxPlacementsPerPage: number;
    trustWeightInRanking: number; semanticRelevanceWeight: number;
    retrievalConfidenceWeight: number; sponsorWeight: number;
  };
}

// ─── 2.1 INTENT ANALYSIS ENGINE ───

export interface IntentResult {
  intent: string;
  confidence: number;
  monetizationStrategy: MonetizationStrategy;
  maxPlacements: number;
  contentTypes: string[];
  signalsMatched: string[];
}

export function analyzeIntent(query: string, contentType?: string): IntentResult {
  const profiles = load<IntentProfile[]>(DATA('intentProfiles.json'), []);
  const queryLower = query.toLowerCase();
  const words = new Set(queryLower.split(/\s+/).filter(w => w.length > 1));

  let bestMatch: IntentResult = {
    intent: 'research',
    confidence: 0,
    monetizationStrategy: 'sponsor',
    maxPlacements: 1,
    contentTypes: ['article'],
    signalsMatched: [],
  };

  for (const profile of profiles) {
    let matchedCount = 0;
    const matchedSignals: string[] = [];

    for (const signal of profile.signals) {
      const signalLower = signal.toLowerCase();
      const signalWords = signalLower.split(/\s+/);

      if (signalWords.length === 1) {
        if (words.has(signalWords[0])) {
          matchedCount++;
          matchedSignals.push(signal);
        }
      } else {
        // Multi-word signal: exact phrase match
        if (queryLower.includes(signalLower)) {
          matchedCount++;
          matchedSignals.push(signal);
        }
      }
    }

    const signalRatio = profile.signals.length > 0 ? matchedCount / profile.signals.length : 0;
    // Bonus for multiple matches
    const matchBonus = matchedCount >= 3 ? 0.3 : matchedCount >= 2 ? 0.15 : 0;

    let contextualBonus = 0;
    if (contentType && profile.contentTypes.includes(contentType)) {
      contextualBonus = 0.25;
    }

    const confidence = Math.min((signalRatio * 1.5 + matchBonus + contextualBonus) * profile.weight, 1.0);

    if (confidence > bestMatch.confidence && confidence >= profile.confidenceThreshold) {
      bestMatch = {
        intent: profile.intent,
        confidence: Math.round(confidence * 100) / 100,
        monetizationStrategy: profile.monetizationStrategy,
        maxPlacements: profile.maxPlacements,
        contentTypes: profile.contentTypes,
        signalsMatched: matchedSignals,
      };
    }
  }

  return bestMatch;
}

export function isBuyingIntent(query: string): boolean {
  const result = analyzeIntent(query);
  return result.monetizationStrategy === 'affiliate' || result.monetizationStrategy === 'mixed';
}

// ─── 2.2 RECOMMENDATION ENGINE ───

export interface RecommendationResult {
  affiliates: AffiliateProduct[];
  sponsors: Sponsor[];
  debug: {
    query: string;
    intent: IntentResult;
    matchingKeywords: string[];
  };
}

export function getRecommendations(
  query: string,
  contentType?: string,
  limit?: number,
): RecommendationResult {
  const intent = analyzeIntent(query, contentType);
  const affiliates = load<AffiliateProduct[]>(DATA('affiliates.json'), []);
  const sponsors = load<Sponsor[]>(DATA('sponsors.json'), []);
  const trust = load<TrustConfig>(DATA('trustScores.json'), {
    affiliates: {}, sponsors: {}, globalConfig: {
      minTrustScoreAffiliate: 60, minTrustScoreSponsor: 50, maxPlacementsPerPage: 3,
      trustWeightInRanking: 0.4, semanticRelevanceWeight: 0.3,
      retrievalConfidenceWeight: 0.2, sponsorWeight: 0.1,
    },
  });

  const g = trust.globalConfig;
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);

  type Scored<T> = { item: T; score: number };
  const scoredAffiliates: Scored<AffiliateProduct>[] = [];
  const scoredSponsors: Scored<Sponsor>[] = [];

  for (const p of affiliates) {
    if (!p.active) continue;

    const tScore = trust.affiliates[p.id]?.trustScore ?? p.trustScore;
    if (tScore < g.minTrustScoreAffiliate) continue;

    let semanticScore = 0;
    let keywordMatches = 0;
    for (const kw of p.keywords) {
      if (queryLower.includes(kw.toLowerCase())) {
        keywordMatches++;
        semanticScore += 1;
      }
    }
    for (const w of queryWords) {
      if (p.name.toLowerCase().includes(w) || p.category.toLowerCase().includes(w)) {
        semanticScore += 0.7;
      }
    }
    if (keywordMatches > 0) semanticScore += keywordMatches * 0.5;

    const normalizedSemantic = Math.min(semanticScore / 5, 1);
    const normalizedTrust = tScore / 100;
    const normalizedCTR = Math.min((p.stats.ctr || 0.01) / 0.1, 1);

    const score =
      g.semanticRelevanceWeight * normalizedSemantic +
      g.trustWeightInRanking * normalizedTrust +
      g.retrievalConfidenceWeight * normalizedCTR;

    if (score > 0.1) scoredAffiliates.push({ item: p, score: Math.round(score * 100) / 100 });
  }

  for (const s of sponsors) {
    if (!s.active) continue;

    const tScore = trust.sponsors[s.id]?.trustScore ?? s.trustScore;
    if (tScore < g.minTrustScoreSponsor) continue;

    let semanticScore = 0;
    if (queryLower.includes(s.name.toLowerCase())) semanticScore += 2;
    if (queryLower.includes(s.category.toLowerCase())) semanticScore += 1.5;
    for (const p of s.products) {
      if (queryLower.includes(p.name.toLowerCase())) semanticScore += 1;
    }
    for (const w of queryWords) {
      if (s.products.some(p => p.compatibleWith?.some(c => c.toLowerCase().includes(w)))) {
        semanticScore += 0.8;
      }
    }

    const normalizedSemantic = Math.min(semanticScore / 5, 1);
    const normalizedTrust = tScore / 100;

    const score =
      g.semanticRelevanceWeight * normalizedSemantic +
      g.trustWeightInRanking * normalizedTrust +
      g.sponsorWeight * (s.priority / 10);

    if (score > 0.1) scoredSponsors.push({ item: s, score: Math.round(score * 100) / 100 });
  }

  scoredAffiliates.sort((a, b) => b.score - a.score);
  scoredSponsors.sort((a, b) => b.score - a.score);

  const maxItems = limit || intent.maxPlacements || 3;

  return {
    affiliates: scoredAffiliates.slice(0, maxItems).map(s => s.item),
    sponsors: scoredSponsors.slice(0, maxItems).map(s => s.item),
    debug: {
      query,
      intent,
      matchingKeywords: intent.signalsMatched,
    },
  };
}

// ─── 2.3 ELIGIBILITY SYSTEMS ───

export interface EligibilityCheck {
  eligible: boolean;
  reason: string;
  score: number;
  details: {
    trustScore: number;
    semanticRelevance: number;
    retrievalConfidence: number;
  };
}

export function checkAffiliateEligibility(
  productId: string,
  query: string,
): EligibilityCheck {
  const affiliates = load<AffiliateProduct[]>(DATA('affiliates.json'), []);
  const trust = load<TrustConfig>(DATA('trustScores.json'), {
    affiliates: {}, sponsors: {}, globalConfig: {
      minTrustScoreAffiliate: 60, minTrustScoreSponsor: 50, maxPlacementsPerPage: 3,
      trustWeightInRanking: 0.4, semanticRelevanceWeight: 0.3,
      retrievalConfidenceWeight: 0.2, sponsorWeight: 0.1,
    },
  });

  const product = affiliates.find(a => a.id === productId);
  if (!product) return { eligible: false, reason: 'Product not found', score: 0, details: { trustScore: 0, semanticRelevance: 0, retrievalConfidence: 0 } };
  if (!product.active) return { eligible: false, reason: 'Product inactive', score: 0, details: { trustScore: 0, semanticRelevance: 0, retrievalConfidence: 0 } };

  const tScore = trust.affiliates[productId]?.trustScore ?? product.trustScore;
  const g = trust.globalConfig;

  if (tScore < g.minTrustScoreAffiliate) {
    return { eligible: false, reason: `Trust score ${tScore} below minimum ${g.minTrustScoreAffiliate}`, score: tScore, details: { trustScore: tScore, semanticRelevance: 0, retrievalConfidence: 0 } };
  }

  const queryLower = query.toLowerCase();
  let semanticRelevance = 0;
  for (const kw of product.keywords) {
    if (queryLower.includes(kw.toLowerCase())) semanticRelevance += 20;
  }
  if (queryLower.includes(product.name.toLowerCase())) semanticRelevance += 30;
  if (queryLower.includes(product.category.toLowerCase())) semanticRelevance += 15;
  semanticRelevance = Math.min(semanticRelevance, 100);

  const retrievalConfidence = Math.min((product.stats.ctr || 0.01) * 200 + semanticRelevance * 0.3, 100);

  const finalScore = Math.round(
    g.trustWeightInRanking * tScore +
    g.semanticRelevanceWeight * semanticRelevance +
    g.retrievalConfidenceWeight * retrievalConfidence,
  );

  return {
    eligible: true,
    reason: 'All checks passed',
    score: finalScore,
    details: { trustScore: tScore, semanticRelevance, retrievalConfidence: Math.round(retrievalConfidence) },
  };
}

export function checkSponsorEligibility(
  sponsorId: string,
  query: string,
): EligibilityCheck {
  const sponsors = load<Sponsor[]>(DATA('sponsors.json'), []);
  const trust = load<TrustConfig>(DATA('trustScores.json'), {
    affiliates: {}, sponsors: {}, globalConfig: {
      minTrustScoreAffiliate: 60, minTrustScoreSponsor: 50, maxPlacementsPerPage: 3,
      trustWeightInRanking: 0.4, semanticRelevanceWeight: 0.3,
      retrievalConfidenceWeight: 0.2, sponsorWeight: 0.1,
    },
  });

  const sponsor = sponsors.find(s => s.id === sponsorId);
  if (!sponsor) return { eligible: false, reason: 'Sponsor not found', score: 0, details: { trustScore: 0, semanticRelevance: 0, retrievalConfidence: 0 } };
  if (!sponsor.active) return { eligible: false, reason: 'Sponsor inactive', score: 0, details: { trustScore: 0, semanticRelevance: 0, retrievalConfidence: 0 } };

  const tScore = trust.sponsors[sponsorId]?.trustScore ?? sponsor.trustScore;
  const g = trust.globalConfig;

  if (tScore < g.minTrustScoreSponsor) {
    return { eligible: false, reason: `Trust score ${tScore} below minimum ${g.minTrustScoreSponsor}`, score: tScore, details: { trustScore: tScore, semanticRelevance: 0, retrievalConfidence: 0 } };
  }

  const queryLower = query.toLowerCase();
  let semanticRelevance = 0;
  if (queryLower.includes(sponsor.name.toLowerCase())) semanticRelevance += 25;
  if (queryLower.includes(sponsor.category.toLowerCase())) semanticRelevance += 20;
  for (const p of sponsor.products) {
    if (queryLower.includes(p.name.toLowerCase())) semanticRelevance += 15;
  }
  semanticRelevance = Math.min(semanticRelevance, 100);

  const retrievalConfidence = Math.min(
    sponsor.campaignMetrics.recommendationConfidence * 25 +
    sponsor.campaignMetrics.semanticMatchQuality * 25 +
    semanticRelevance * 0.3,
    100,
  );

  const finalScore = Math.round(
    g.trustWeightInRanking * tScore +
    g.semanticRelevanceWeight * semanticRelevance +
    g.sponsorWeight * (sponsor.priority * 10) +
    g.retrievalConfidenceWeight * retrievalConfidence,
  );

  return {
    eligible: true,
    reason: 'All checks passed',
    score: finalScore,
    details: { trustScore: tScore, semanticRelevance, retrievalConfidence: Math.round(retrievalConfidence) },
  };
}

// ─── 2.4 CONTEXTUAL INJECTION SYSTEM ───

export interface InjectionDecision {
  placements: {
    placement: Placement;
    productId?: string;
    sponsorId?: string;
    ctaId: string;
    ctaText: string;
    color: string;
    abVariant: string;
  }[];
  deniedItems: { id: string; reason: string }[];
  strategy: MonetizationStrategy;
  density: { placed: number; max: number };
}

export function decideInjections(
  query: string,
  contentType?: string,
): InjectionDecision {
  const intent = analyzeIntent(query, contentType);
  const recs = getRecommendations(query, contentType, intent.maxPlacements);
  const ctas = load<CTA[]>(DATA('ctas.json'), []).filter(c => c.active);

  const trust = load<TrustConfig>(DATA('trustScores.json'), {
    affiliates: {}, sponsors: {}, globalConfig: {
      minTrustScoreAffiliate: 60, minTrustScoreSponsor: 50, maxPlacementsPerPage: 3,
      trustWeightInRanking: 0.4, semanticRelevanceWeight: 0.3,
      retrievalConfidenceWeight: 0.2, sponsorWeight: 0.1,
    },
  });

  const placements: InjectionDecision['placements'] = [];
  const deniedItems: InjectionDecision['deniedItems'] = [];

  const placementOrder: Placement[] = ['top-right', 'inline', 'bottom-right', 'sticky'];
  const globalMax = Math.min(trust.globalConfig.maxPlacementsPerPage, intent.maxPlacements);
  let remaining = globalMax;

  const eligibleAffiliates: { item: AffiliateProduct; placement: Placement }[] = [];
  const eligibleSponsors: { item: Sponsor; placement: Placement }[] = [];

  if (intent.monetizationStrategy === 'affiliate' || intent.monetizationStrategy === 'mixed') {
    for (const aff of recs.affiliates.slice(0, 2)) {
      const check = checkAffiliateEligibility(aff.id, query);
      if (check.eligible) {
        eligibleAffiliates.push({ item: aff, placement: placementOrder[eligibleAffiliates.length % 4] });
      } else {
        deniedItems.push({ id: aff.id, reason: check.reason });
      }
    }
  }

  if (intent.monetizationStrategy === 'sponsor' || intent.monetizationStrategy === 'mixed') {
    for (const sp of recs.sponsors.slice(0, 2)) {
      const check = checkSponsorEligibility(sp.id, query);
      if (check.eligible) {
        eligibleSponsors.push({ item: sp, placement: placementOrder[eligibleSponsors.length % 4] });
      } else {
        deniedItems.push({ id: sp.id, reason: check.reason });
      }
    }
  }

  let plIdx = 0;

  for (const aff of eligibleAffiliates) {
    if (remaining <= 0) break;
    const cta = ctas.find(c => c.autoInject.enabled) || ctas[0];
    if (!cta) break;

    const abText = cta.abTest.enabled && cta.abTest.variantB
      ? (Math.random() > 0.5 ? cta.text : cta.abTest.variantB)
      : cta.text;
    const abColor = cta.abTest.enabled && cta.abTest.variantB
      ? (abText === cta.abTest.variantB ? cta.abTest.variantBColor : cta.color)
      : cta.color;
    const abVariant = cta.abTest.enabled && abText !== cta.text ? 'B' : 'A';

    placements.push({
      placement: placementOrder[plIdx % 4],
      productId: aff.item.id,
      ctaId: cta.id,
      ctaText: abText,
      color: abColor,
      abVariant,
    });
    remaining--;
    plIdx++;
  }

  for (const sp of eligibleSponsors) {
    if (remaining <= 0) break;
    const cta = ctas.find(c => c.placement === 'sticky') || ctas[0];
    if (!cta) break;

    placements.push({
      placement: placementOrder[plIdx % 4],
      sponsorId: sp.item.id,
      ctaId: cta.id,
      ctaText: `Sponsored: ${sp.item.name}`,
      color: cta.color,
      abVariant: 'A',
    });
    remaining--;
    plIdx++;
  }

  return {
    placements,
    deniedItems,
    strategy: intent.monetizationStrategy,
    density: { placed: placements.length, max: globalMax },
  };
}

// ─── FAZ 8: A/B TEST ENGINE ───

export interface ABTestResult {
  ctaId: string;
  variantA: { impressions: number; clicks: number; ctr: number };
  variantB: { impressions: number; clicks: number; ctr: number };
  winner: 'A' | 'B' | 'tie';
  confidence: number;
  recommendation: string;
}

export function evaluateABTest(ctaId: string): ABTestResult {
  const ctas = load<CTA[]>(DATA('ctas.json'), []);
  const cta = ctas.find(c => c.id === ctaId);
  if (!cta || !cta.abTest.enabled) {
    return { ctaId, variantA: { impressions: 0, clicks: 0, ctr: 0 }, variantB: { impressions: 0, clicks: 0, ctr: 0 }, winner: 'tie', confidence: 0, recommendation: 'A/B test not active' };
  }

  // Simulated metrics (in production, load from analytics tracking)
  // Replaced Math.random mocks with static zero metrics to prevent false positives and erratic reporting.
  const variantA = { impressions: 0, clicks: 0 };
  const variantB = { impressions: 0, clicks: 0 };

  const ctrA = variantA.impressions > 0 ? variantA.clicks / variantA.impressions : 0;
  const ctrB = variantB.impressions > 0 ? variantB.clicks / variantB.impressions : 0;

  const diff = Math.abs(ctrA - ctrB);
  const total = variantA.impressions + variantB.impressions;
  const confidence = Math.min(diff * Math.sqrt(total) * 10, 95);

  let winner: 'A' | 'B' | 'tie' = 'tie';
  if (confidence > 90) {
    winner = ctrA > ctrB ? 'A' : 'B';
    // Auto-set winner in CTA config
    cta.abTest.winner = winner;
    write(DATA('ctas.json'), ctas);
  }

  return {
    ctaId,
    variantA: { ...variantA, ctr: Math.round(ctrA * 10000) / 100 },
    variantB: { ...variantB, ctr: Math.round(ctrB * 10000) / 100 },
    winner,
    confidence: Math.round(confidence * 10) / 10,
    recommendation: winner === 'tie'
      ? 'Not enough data. Continue testing.'
      : `Variant ${winner} is winning with ${confidence}% confidence. Switch to this variant permanently.`,
  };
}

// ─── FAZ 8: SEASONAL CAMPAIGN MANAGER ───

export interface SeasonalStatus {
  campaignId: string;
  name: string;
  active: boolean;
  season: string;
  inDateRange: boolean;
  daysRemaining: number;
  products: string[];
  discountCode: string;
}

export function getSeasonalCampaigns(): SeasonalStatus[] {
  const campaigns = load<Campaign[]>(DATA('campaigns.json'), []);
  const now = new Date();

  return campaigns
    .filter(c => c.type === 'seasonal' || c.season)
    .map(c => {
      const start = c.startDate ? new Date(c.startDate) : null;
      const end = c.endDate ? new Date(c.endDate) : null;
      const inRange = start && end ? now >= start && now <= end : c.active;
      const daysLeft = end ? Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000)) : 0;

      return {
        campaignId: c.id,
        name: c.name,
        active: c.active && inRange,
        season: c.season || 'general',
        inDateRange: inRange,
        daysRemaining: daysLeft,
        products: c.products,
        discountCode: c.discountCode || '',
      };
    });
}

// ─── FAZ 8: CROSS-SELL INTELLIGENCE ───

export interface CrossSellBundle {
  sourceProduct: string;
  recommendedProducts: { id: string; name: string; reason: string; price: number }[];
  bundleDiscount: number;
  totalSavings: number;
}

export function getCrossSellRecommendations(productId: string): CrossSellBundle {
  const affiliates = load<AffiliateProduct[]>(DATA('affiliates.json'), []);
  const campaigns = load<Campaign[]>(DATA('campaigns.json'), []);
  const source = affiliates.find(a => a.id === productId);

  // Check campaign cross-sell rules
  const recommendations: CrossSellBundle['recommendedProducts'] = [];
  for (const camp of campaigns) {
    for (const rule of camp.crossSellRules || []) {
      if (rule.sourceProduct === productId) {
        for (const targetId of rule.targetProducts) {
          const target = affiliates.find(a => a.id === targetId);
          if (target && target.active) {
            recommendations.push({
              id: target.id,
              name: target.name,
              reason: rule.strategy || 'complementary',
              price: target.price,
            });
          }
        }
      }
    }
  }

  // Auto-generate based on compatibility
  if (recommendations.length === 0 && source) {
    for (const aff of affiliates) {
      if (aff.id === productId || !aff.active) continue;
      if (aff.compatibleWith?.some(c => source.compatibleWith?.includes(c))) {
        recommendations.push({
          id: aff.id,
          name: aff.name,
          reason: 'compatibility-match',
          price: aff.price,
        });
      }
    }
  }

  const totalPrice = recommendations.reduce((s, r) => s + r.price, 0);
  const discount = recommendations.length >= 3 ? 15 : recommendations.length >= 2 ? 10 : 5;

  return {
    sourceProduct: source?.name || productId,
    recommendedProducts: recommendations.slice(0, 4),
    bundleDiscount: discount,
    totalSavings: Math.round(totalPrice * discount / 100 * 100) / 100,
  };
}

// ─── FAZ 8: MULTI-NETWORK PRICE COMPARISON ───

export interface NetworkPrice {
  network: string;
  url: string;
  price: number;
  inStock: boolean;
  commission: number;
}

export function getMultiNetworkPrice(productId: string): NetworkPrice[] {
  const affiliates = load<AffiliateProduct[]>(DATA('affiliates.json'), []);
  const product = affiliates.find(a => a.id === productId);
  if (!product) return [];

  // For each affiliate product, generate multi-network prices
  // In production, this would call real APIs
  const networks: NetworkPrice[] = [{
    network: product.network,
    url: product.url,
    price: product.price,
    inStock: true,
    commission: product.commission,
  }];

  // Simulate alternative networks without generating fake 404 URLs
  // Only provide real alternative networks if actual API/database backing is implemented.
  // For now, we only return the primary product URL as an option to avoid generating fake 404 links.
  
  // NOTE: If you wish to fetch cross-platform prices, implement a real crawler pipeline.
  // We no longer guess "amazon.com/fpv..." style mock URLs.

  return networks.sort((a, b) => a.price - b.price);
}
