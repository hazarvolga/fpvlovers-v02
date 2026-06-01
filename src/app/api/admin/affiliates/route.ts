import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';


const AFFILIATES = path.join(process.cwd(), 'data', 'affiliates.json');
const CAMPAIGNS = path.join(process.cwd(), 'data', 'campaigns.json');
const CTAS = path.join(process.cwd(), 'data', 'ctas.json');
const METRICS = path.join(process.cwd(), 'data', 'campaignMetrics.json');
const INTENT = path.join(process.cwd(), 'data', 'intentProfiles.json');
const TRUST = path.join(process.cwd(), 'data', 'trustScores.json');

function read<T>(file: string, fallback: T): T {
  try { if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch {}
  return fallback;
}
function write(file: string, data: any) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

type Placement = 'top-right' | 'bottom-right' | 'inline' | 'sticky';
type Network = 'amazon' | 'banggood' | 'getfpv' | 'custom';
type AffiliateNetwork = 'amazon' | 'banggood' | 'getfpv';

type AffiliateStats = { clicks: number; conversions: number; revenue: number; ctr: number; conversionRate: number };
type AffiliateProduct = {
  id: string; name: string; type: string; network: Network; productId: string;
  url: string; price: number; currency: string; commission: number; category: string;
  keywords: string[]; trustScore: number; image: string; compatibleWith: string[];
  active: boolean; featured: boolean; createdAt: string; updatedAt: string;
  stats: AffiliateStats;
};

type ProductBundle = { id: string; name: string; products: string[]; discount: number; description: string };
type CrossSellRule = { sourceProduct: string; targetProducts: string[]; strategy: string };
type TargetAudience = { skillLevels: string[]; budgetRange: string[]; flightStyles: string[] };
type CampaignStats = { impressions: number; clicks: number; conversions: number; revenue: number };

type Campaign = {
  id: string; name: string; priority: number; active: boolean; products: string[];
  type: string; season: string; startDate: string; endDate: string; budget: number;
  discountCode: string; productBundles: ProductBundle[]; crossSellRules: CrossSellRule[];
  targetAudience: TargetAudience; createdAt: string; stats: CampaignStats;
};

type ABTest = { enabled: boolean; variantB: string; variantBColor: string; winner: string | null };
type PlacementStrategies = { buyingGuides: Placement; comparisonPages: Placement; recommendationCards: Placement; ecosystemPages: Placement };
type AutoInject = { enabled: boolean; minIntentScore: number; contentTypes: string[] };

type CTA = {
  id: string; text: string; placement: Placement; color: string; active: boolean;
  variant: string; abTest: ABTest; placementStrategies: PlacementStrategies;
  maxPerPage: number; autoInject: AutoInject; createdAt: string;
};

type IntentProfile = {
  intent: string; signals: string[]; weight: number; contentTypes: string[];
  monetizationStrategy: string; maxPlacements: number; confidenceThreshold: number;
};

// GET all monetization data
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || 'all';
  const data: any = {};

  if (type === 'all' || type === 'affiliates') data.affiliates = read<AffiliateProduct[]>(AFFILIATES, []);
  if (type === 'all' || type === 'campaigns') data.campaigns = read<Campaign[]>(CAMPAIGNS, []);
  if (type === 'all' || type === 'ctas') data.ctas = read<CTA[]>(CTAS, [
    {
      id: '1', text: 'Recommended Setup', placement: 'top-right', color: '#FF5C00', active: true,
      variant: 'A', abTest: { enabled: false, variantB: '', variantBColor: '', winner: null },
      placementStrategies: { buyingGuides: 'top-right', comparisonPages: 'inline', recommendationCards: 'sticky', ecosystemPages: 'bottom-right' },
      maxPerPage: 3, autoInject: { enabled: true, minIntentScore: 0.6, contentTypes: ['buying-guide', 'comparison', 'recommendation'] },
      createdAt: new Date().toISOString(),
    },
    {
      id: '2', text: 'Best Price Check', placement: 'bottom-right', color: '#00F2FF', active: true,
      variant: 'A', abTest: { enabled: false, variantB: '', variantBColor: '', winner: null },
      placementStrategies: { buyingGuides: 'top-right', comparisonPages: 'inline', recommendationCards: 'sticky', ecosystemPages: 'bottom-right' },
      maxPerPage: 3, autoInject: { enabled: true, minIntentScore: 0.6, contentTypes: ['buying-guide', 'comparison', 'recommendation'] },
      createdAt: new Date().toISOString(),
    },
    {
      id: '3', text: 'System Recommendation', placement: 'inline', color: '#00FF66', active: false,
      variant: 'A', abTest: { enabled: false, variantB: '', variantBColor: '', winner: null },
      placementStrategies: { buyingGuides: 'top-right', comparisonPages: 'inline', recommendationCards: 'sticky', ecosystemPages: 'bottom-right' },
      maxPerPage: 3, autoInject: { enabled: false, minIntentScore: 0.6, contentTypes: ['buying-guide', 'comparison', 'recommendation'] },
      createdAt: new Date().toISOString(),
    },
  ]);
  if (type === 'all' || type === 'metrics') data.metrics = read(METRICS, { affiliate: {}, sponsor: {} });
  if (type === 'all' || type === 'intent') data.intentProfiles = read<IntentProfile[]>(INTENT, []);
  if (type === 'all' || type === 'trust') data.trustScores = read(TRUST, { affiliates: {}, sponsors: {}, globalConfig: {} });

  return NextResponse.json(data);
}

// POST: manage campaigns, CTAs, affiliates, metrics, intent profiles, trust
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, ...rest } = body;

  // --- CAMPAIGN ACTIONS ---
  if (action === 'add-campaign') {
    const campaigns = read<Campaign[]>(CAMPAIGNS, []);
    campaigns.unshift({
      id: rest.id || Date.now().toString(36),
      name: rest.name,
      priority: rest.priority || 0,
      active: true,
      products: rest.products || [],
      type: rest.type || 'seasonal',
      season: rest.season || '',
      startDate: rest.startDate || '',
      endDate: rest.endDate || '',
      budget: rest.budget || 0,
      discountCode: rest.discountCode || '',
      productBundles: rest.productBundles || [],
      crossSellRules: rest.crossSellRules || [],
      targetAudience: rest.targetAudience || { skillLevels: [], budgetRange: [], flightStyles: [] },
      createdAt: new Date().toISOString(),
      stats: { impressions: 0, clicks: 0, conversions: 0, revenue: 0 },
    } as Campaign);
    write(CAMPAIGNS, campaigns);
    return NextResponse.json({ campaigns });
  }

  if (action === 'add-product-bundle') {
    const campaigns = read<Campaign[]>(CAMPAIGNS, []);
    const campaign = campaigns.find(c => c.id === rest.campaignId);
    if (campaign) {
      campaign.productBundles.push({
        id: Date.now().toString(36),
        name: rest.name,
        products: rest.products || [],
        discount: rest.discount || 0,
        description: rest.description || '',
      });
      write(CAMPAIGNS, campaigns);
    }
    return NextResponse.json({ campaigns });
  }

  if (action === 'add-cross-sell-rule') {
    const campaigns = read<Campaign[]>(CAMPAIGNS, []);
    const campaign = campaigns.find(c => c.id === rest.campaignId);
    if (campaign) {
      campaign.crossSellRules.push({
        sourceProduct: rest.sourceProduct,
        targetProducts: rest.targetProducts || [],
        strategy: rest.strategy || 'complementary',
      });
      write(CAMPAIGNS, campaigns);
    }
    return NextResponse.json({ campaigns });
  }

  // --- CTA ACTIONS ---
  if (action === 'add-cta') {
    const ctas = read<CTA[]>(CTAS, []);
    ctas.push({
      id: rest.id || Date.now().toString(36),
      text: rest.text,
      placement: rest.placement || 'bottom-right',
      color: rest.color || '#FF5C00',
      active: true,
      variant: rest.variant || 'A',
      abTest: rest.abTest || { enabled: false, variantB: '', variantBColor: '', winner: null },
      placementStrategies: rest.placementStrategies || {
        buyingGuides: 'top-right', comparisonPages: 'inline', recommendationCards: 'sticky', ecosystemPages: 'bottom-right',
      },
      maxPerPage: rest.maxPerPage || 3,
      autoInject: rest.autoInject || { enabled: true, minIntentScore: 0.6, contentTypes: ['buying-guide', 'comparison', 'recommendation'] },
      createdAt: new Date().toISOString(),
    });
    write(CTAS, ctas);
    return NextResponse.json({ ctas });
  }

  if (action === 'toggle-cta') {
    const ctas = read<CTA[]>(CTAS, []);
    const cta = ctas.find(c => c.id === rest.id);
    if (cta) { cta.active = !cta.active; write(CTAS, ctas); }
    return NextResponse.json({ ctas });
  }

  if (action === 'toggle-ab-test') {
    const ctas = read<CTA[]>(CTAS, []);
    const cta = ctas.find(c => c.id === rest.id);
    if (cta) { cta.abTest.enabled = !cta.abTest.enabled; write(CTAS, ctas); }
    return NextResponse.json({ ctas });
  }

  // --- METRICS ACTIONS ---
  if (action === 'track-click') {
    const metrics: any = read(METRICS, { affiliate: {}, sponsor: {} });
    const { type: mType, productId, network } = rest;

    if (mType === 'affiliate') {
      if (!metrics.affiliate.byNetwork) metrics.affiliate.byNetwork = {};
      if (!metrics.affiliate.byNetwork[network]) metrics.affiliate.byNetwork[network] = { clicks: 0, conversions: 0, revenue: 0 };
      metrics.affiliate.totalClicks = (metrics.affiliate.totalClicks || 0) + 1;
      metrics.affiliate.byNetwork[network].clicks += 1;

      // Log to database in background
      Promise.resolve().then(async () => {
        try {
          const { logAnalyticsEvent } = await import('@/lib/server/analytics-store');
          await logAnalyticsEvent({
            eventType: 'affiliate_click',
            source: 'admin',
            metadata: {
              productId,
              network
            }
          });
        } catch (dbErr) {
          console.warn('[DB Analytics] Failed to log affiliate click event:', dbErr);
        }
      });
    }
    if (mType === 'sponsor') {
      metrics.sponsor.totalClicks = (metrics.sponsor.totalClicks || 0) + 1;

      // Log to database in background
      Promise.resolve().then(async () => {
        try {
          const { logAnalyticsEvent } = await import('@/lib/server/analytics-store');
          await logAnalyticsEvent({
            eventType: 'sponsor_click',
            source: 'admin',
            metadata: {
              productId
            }
          });
        } catch (dbErr) {
          console.warn('[DB Analytics] Failed to log sponsor click event:', dbErr);
        }
      });
    }
    metrics.updatedAt = new Date().toISOString();
    write(METRICS, metrics);
    return NextResponse.json({ metrics });
  }

  if (action === 'track-conversion') {
    const metrics: any = read(METRICS, { affiliate: {}, sponsor: {} });
    const { type: mType, productId, network, revenue: convRevenue } = rest;

    if (mType === 'affiliate') {
      if (!metrics.affiliate.byNetwork) metrics.affiliate.byNetwork = {};
      if (!metrics.affiliate.byNetwork[network]) metrics.affiliate.byNetwork[network] = { clicks: 0, conversions: 0, revenue: 0 };
      metrics.affiliate.totalConversions = (metrics.affiliate.totalConversions || 0) + 1;
      metrics.affiliate.totalRevenue = (metrics.affiliate.totalRevenue || 0) + (convRevenue || 0);
      metrics.affiliate.byNetwork[network].conversions += 1;
      metrics.affiliate.byNetwork[network].revenue += (convRevenue || 0);

      // Log to database in background
      Promise.resolve().then(async () => {
        try {
          const { logAnalyticsEvent } = await import('@/lib/server/analytics-store');
          await logAnalyticsEvent({
            eventType: 'affiliate_conversion',
            source: 'admin',
            metadata: {
              productId,
              network,
              revenue: convRevenue
            }
          });
        } catch (dbErr) {
          console.warn('[DB Analytics] Failed to log affiliate conversion event:', dbErr);
        }
      });
    }
    metrics.updatedAt = new Date().toISOString();
    write(METRICS, metrics);
    return NextResponse.json({ metrics });
  }

  // --- INTENT PROFILE ACTIONS ---
  if (action === 'update-intent-profile') {
    const profiles = read<IntentProfile[]>(INTENT, []);
    const idx = profiles.findIndex(p => p.intent === rest.intent);
    if (idx >= 0) {
      profiles[idx] = { ...profiles[idx], ...rest };
    } else {
      profiles.push(rest);
    }
    write(INTENT, profiles);
    return NextResponse.json({ intentProfiles: profiles });
  }

  // --- TRUST ACTIONS ---
  if (action === 'update-trust-config') {
    const trust: any = read(TRUST, { affiliates: {}, sponsors: {}, globalConfig: {} });
    trust.globalConfig = { ...trust.globalConfig, ...rest.config };
    trust.updatedAt = new Date().toISOString();
    write(TRUST, trust);
    return NextResponse.json({ trustScores: trust });
  }

  // --- DEFAULT: add affiliate product ---
  const affiliates = read<AffiliateProduct[]>(AFFILIATES, []);
  affiliates.unshift({
    id: rest.id || Date.now().toString(36),
    name: rest.name,
    type: rest.type || '',
    network: rest.network || 'amazon',
    productId: rest.productId || '',
    url: rest.url || '',
    price: rest.price || 0,
    currency: rest.currency || 'USD',
    commission: rest.commission || 0,
    category: rest.category || '',
    keywords: rest.keywords || [],
    trustScore: rest.trustScore || 80,
    image: rest.image || '',
    compatibleWith: rest.compatibleWith || [],
    active: true,
    featured: rest.featured || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: { clicks: 0, conversions: 0, revenue: 0, ctr: 0, conversionRate: 0 },
  } as AffiliateProduct);
  write(AFFILIATES, affiliates);
  return NextResponse.json({ affiliates });
}

export async function DELETE(req: NextRequest) {
  const { id, type, campaignId } = await req.json();

  if (type === 'campaign') {
    const campaigns = read<Campaign[]>(CAMPAIGNS, []).filter(c => c.id !== id);
    write(CAMPAIGNS, campaigns);
    return NextResponse.json({ campaigns });
  }
  if (type === 'cta') {
    const ctas = read<CTA[]>(CTAS, []).filter(c => c.id !== id);
    write(CTAS, ctas);
    return NextResponse.json({ ctas });
  }
  if (type === 'product-bundle') {
    const campaigns = read<Campaign[]>(CAMPAIGNS, []);
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
      campaign.productBundles = campaign.productBundles.filter(b => b.id !== id);
      write(CAMPAIGNS, campaigns);
    }
    return NextResponse.json({ campaigns });
  }
  if (type === 'cross-sell-rule') {
    const campaigns = read<Campaign[]>(CAMPAIGNS, []);
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
      campaign.crossSellRules = campaign.crossSellRules.filter((_, i) => i.toString() !== id);
      write(CAMPAIGNS, campaigns);
    }
    return NextResponse.json({ campaigns });
  }

  const affiliates = read<AffiliateProduct[]>(AFFILIATES, []).filter(a => a.id !== id);
  write(AFFILIATES, affiliates);
  return NextResponse.json({ affiliates });
}
