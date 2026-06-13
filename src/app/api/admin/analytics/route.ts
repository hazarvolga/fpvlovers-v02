import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { safeReadJson } from '@/lib/utils/json';
import { query } from '@/lib/server/db';
import { getStorageMode } from '@/lib/server/storage-mode';
import { fetchGoogleAnalyticsReport } from '@/lib/server/google-analytics';

const METRICS = path.join(process.cwd(), 'data', 'campaignMetrics.json');
const TRUST = path.join(process.cwd(), 'data', 'trustScores.json');
const AFFILIATES = path.join(process.cwd(), 'data', 'affiliates.json');
const SPONSORS = path.join(process.cwd(), 'data', 'sponsors.json');

type MetricsStore = { affiliate: Record<string, any>; sponsor: Record<string, any>; updatedAt: string };
type TrustStore = {
  affiliates: Record<string, { trustScore?: number; updatedAt?: string }>;
  sponsors: Record<string, { trustScore?: number; updatedAt?: string }>;
  globalConfig: Record<string, any>;
  updatedAt?: string;
};

function load<T>(file: string, fallback: T): T {
  return safeReadJson<T>(file, fallback);
}
function save(file: string, data: any) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action') || 'summary';

  const trust = load<TrustStore>(TRUST, { affiliates: {}, sponsors: {}, globalConfig: {} });
  const affiliates = load<any[]>(AFFILIATES, []);
  const sponsors = load<any[]>(SPONSORS, []);

  // Fetch real database metrics if available
  const mode = getStorageMode();
  const realClicks = new Map<string, number>();
  const realImpressions = new Map<string, number>();
  const realConversions = new Map<string, number>();

  if (mode !== 'files') {
    try {
      const eventsRes = await query<{ event_type: string; affiliate_offer_id: string | null; sponsor_id: string | null; cnt: number }>(`
        SELECT event_type, affiliate_offer_id::text, sponsor_id::text, COUNT(*)::int as cnt
        FROM fpvlovers_analytics.events
        WHERE event_type IN ('affiliate_click', 'sponsor_impression', 'sponsor_click', 'conversion')
        GROUP BY event_type, affiliate_offer_id, sponsor_id
      `);

      for (const row of eventsRes.rows) {
        const count = row.cnt;
        if (row.event_type === 'affiliate_click' && row.affiliate_offer_id) {
          realClicks.set(row.affiliate_offer_id, count);
        } else if (row.event_type === 'sponsor_impression' && row.sponsor_id) {
          realImpressions.set(row.sponsor_id, count);
        } else if (row.event_type === 'sponsor_click' && row.sponsor_id) {
          realClicks.set(row.sponsor_id, count);
        } else if (row.event_type === 'conversion' && row.affiliate_offer_id) {
          realConversions.set(row.affiliate_offer_id, count);
        }
      }
    } catch (err) {
      console.warn('[Analytics API] Failed to fetch database events:', err);
    }
  }

  if (action === 'recalc-trust') {
    // Recalculate trust scores based on real database metrics
    for (const aff of affiliates) {
      if (!aff.active) continue;
      const clicks = realClicks.get(aff.id) || 0;
      const conversions = realConversions.get(aff.id) || 0;
      const ctr = clicks > 0 ? (clicks / 1000) : 0; // proxy heuristic CTR
      const convRate = clicks > 0 ? (conversions / clicks) : 0;
      const baseTrust = aff.trustScore || 80;
      const performanceBonus = Math.min(ctr * 200 + convRate * 100, 20);
      const newTrust = Math.min(Math.round(baseTrust + performanceBonus), 100);

      if (!trust.affiliates[aff.id]) trust.affiliates[aff.id] = {};
      trust.affiliates[aff.id].trustScore = newTrust;
      trust.affiliates[aff.id].updatedAt = new Date().toISOString();
    }

    for (const sp of sponsors) {
      if (!sp.active) continue;
      const impressions = realImpressions.get(sp.id) || 0;
      const clicks = realClicks.get(sp.id) || 0;
      const ctr = impressions > 0 ? (clicks / impressions) : 0;
      const baseTrust = sp.trustScore || 100;
      const performanceBonus = Math.min(ctr * 100, 10);
      const newTrust = Math.max(30, Math.min(Math.round(baseTrust + performanceBonus), 100));

      if (!trust.sponsors[sp.id]) trust.sponsors[sp.id] = {};
      trust.sponsors[sp.id].trustScore = newTrust;
      trust.sponsors[sp.id].updatedAt = new Date().toISOString();
    }

    trust.updatedAt = new Date().toISOString();
    save(TRUST, trust);

    return NextResponse.json({ trust, recalculated: true });
  }

  const activeAffiliates = affiliates.filter((a: any) => a.active);
  const activeSponsors = sponsors.filter((s: any) => s.active);

  const affiliateMetrics = {
    totalProducts: activeAffiliates.length,
    totalClicks: activeAffiliates.reduce((s: number, a: any) => s + (realClicks.get(a.id) || 0), 0),
    totalConversions: activeAffiliates.reduce((s: number, a: any) => s + (realConversions.get(a.id) || 0), 0),
    totalRevenue: 0, // default to 0 for now since there are no real payouts/sales
    avgCtr: 0,
    avgTrust: Math.round(activeAffiliates.reduce((s: number, a: any) => s + (a.trustScore || 80), 0) / Math.max(activeAffiliates.length, 1)),
    byNetwork: {} as Record<string, any>,
  };

  for (const a of activeAffiliates) {
    const net = a.network || 'unknown';
    const clicks = realClicks.get(a.id) || 0;
    const conversions = realConversions.get(a.id) || 0;
    
    if (!affiliateMetrics.byNetwork[net]) {
      affiliateMetrics.byNetwork[net] = { count: 0, clicks: 0, conversions: 0, revenue: 0 };
    }
    affiliateMetrics.byNetwork[net].count++;
    affiliateMetrics.byNetwork[net].clicks += clicks;
    affiliateMetrics.byNetwork[net].conversions += conversions;
    affiliateMetrics.byNetwork[net].revenue += 0;
  }

  const sponsorMetrics = {
    totalSponsors: activeSponsors.length,
    totalImpressions: activeSponsors.reduce((s: number, sp: any) => s + (realImpressions.get(sp.id) || 0), 0),
    totalClicks: activeSponsors.reduce((s: number, sp: any) => s + (realClicks.get(sp.id) || 0), 0),
    avgVisibility: Math.round(activeSponsors.reduce((s: number, sp: any) => s + (sp.visibilityScore || 0), 0) / Math.max(activeSponsors.length, 1)),
    avgTrust: Math.round(activeSponsors.reduce((s: number, sp: any) => s + (sp.trustScore || 100), 0) / Math.max(activeSponsors.length, 1)),
    byCategory: {} as Record<string, any>,
  };

  for (const s of activeSponsors) {
    const cat = s.category || 'Other';
    const impressions = realImpressions.get(s.id) || 0;
    const clicks = realClicks.get(s.id) || 0;
    
    if (!sponsorMetrics.byCategory[cat]) {
      sponsorMetrics.byCategory[cat] = { count: 0, impressions: 0, clicks: 0 };
    }
    sponsorMetrics.byCategory[cat].count++;
    sponsorMetrics.byCategory[cat].impressions += impressions;
    sponsorMetrics.byCategory[cat].clicks += clicks;
  }

  // Google Analytics Reporting Config
  let gaMetrics = {
    active_users: 0,
    page_views: 0,
    sessions: 0,
  };

  const gaPropertyId = process.env.GA_PROPERTY_ID;
  const gaClientEmail = process.env.GA_CLIENT_EMAIL;
  const gaPrivateKey = process.env.GA_PRIVATE_KEY;

  const apiConfigured = !!(gaPropertyId && gaClientEmail && gaPrivateKey);

  if (apiConfigured) {
    try {
      gaMetrics = await fetchGoogleAnalyticsReport(gaPropertyId, gaClientEmail, gaPrivateKey);
    } catch (err) {
      console.warn('[Analytics API] Failed to fetch Google Analytics metrics:', err);
    }
  }

  const googleAnalyticsInfo = {
    ga_id: process.env.NEXT_PUBLIC_GA_ID || null,
    status: process.env.NEXT_PUBLIC_GA_ID ? 'active' : 'inactive',
    api_configured: apiConfigured,
    property_id: gaPropertyId || null,
    metrics: gaMetrics,
  };

  return NextResponse.json({
    affiliate: affiliateMetrics,
    sponsor: sponsorMetrics,
    trust_config: trust.globalConfig,
    google_analytics: googleAnalyticsInfo,
    updated_at: new Date().toISOString(),
  });
}
