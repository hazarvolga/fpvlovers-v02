import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const METRICS = path.join(process.cwd(), 'data', 'campaignMetrics.json');
const TRUST = path.join(process.cwd(), 'data', 'trustScores.json');
const AFFILIATES = path.join(process.cwd(), 'data', 'affiliates.json');
const SPONSORS = path.join(process.cwd(), 'data', 'sponsors.json');

function load<T>(file: string, fallback: T): T {
  try { if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch {}
  return fallback;
}
function save(file: string, data: any) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action') || 'summary';

  const metrics = load(METRICS, { affiliate: {}, sponsor: {}, updatedAt: '' });
  const trust = load(TRUST, { affiliates: {}, sponsors: {}, globalConfig: {} });
  const affiliates = load<any[]>(AFFILIATES, []);
  const sponsors = load<any[]>(SPONSORS, []);

  if (action === 'recalc-trust') {
    // Recalculate trust scores based on real metrics
    for (const aff of affiliates) {
      if (!aff.active) continue;
      const stats = aff.stats || {};
      const ctr = stats.ctr || 0;
      const convRate = stats.conversionRate || 0;
      const baseTrust = aff.trustScore || 80;
      const performanceBonus = Math.min(ctr * 200 + convRate * 100, 20);
      const newTrust = Math.min(Math.round(baseTrust + performanceBonus), 100);

      if (!trust.affiliates[aff.id]) trust.affiliates[aff.id] = {};
      trust.affiliates[aff.id].trustScore = newTrust;
      trust.affiliates[aff.id].updatedAt = new Date().toISOString();
    }

    for (const sp of sponsors) {
      if (!sp.active) continue;
      const cm = sp.campaignMetrics || {};
      const ctr = cm.ctr || 0;
      const matchQuality = cm.semanticMatchQuality || 0;
      const baseTrust = sp.trustScore || 100;
      const performanceBonus = Math.min(ctr * 100 + matchQuality * 0.2, 10);
      const newTrust = Math.max(30, Math.min(Math.round(baseTrust + performanceBonus), 100));

      if (!trust.sponsors[sp.id]) trust.sponsors[sp.id] = {};
      trust.sponsors[sp.id].trustScore = newTrust;
      trust.sponsors[sp.id].updatedAt = new Date().toISOString();
    }

    trust.updatedAt = new Date().toISOString();
    save(TRUST, trust);

    return NextResponse.json({ trust, recalculated: true });
  }

  // Summary /report
  const activeAffiliates = affiliates.filter((a: any) => a.active);
  const activeSponsors = sponsors.filter((s: any) => s.active);

  const affiliateMetrics = {
    totalProducts: activeAffiliates.length,
    totalClicks: activeAffiliates.reduce((s: number, a: any) => s + (a.stats?.clicks || 0), 0),
    totalConversions: activeAffiliates.reduce((s: number, a: any) => s + (a.stats?.conversions || 0), 0),
    totalRevenue: Math.round(activeAffiliates.reduce((s: number, a: any) => s + (a.stats?.revenue || 0), 0) * 100) / 100,
    avgCtr: activeAffiliates.length > 0 ? Math.round(activeAffiliates.reduce((s: number, a: any) => s + (a.stats?.ctr || 0), 0) / activeAffiliates.length * 10000) / 100 : 0,
    avgTrust: Math.round(activeAffiliates.reduce((s: number, a: any) => s + (a.trustScore || 80), 0) / Math.max(activeAffiliates.length, 1)),
    byNetwork: {} as Record<string, any>,
  };

  for (const a of activeAffiliates) {
    const net = a.network || 'unknown';
    if (!affiliateMetrics.byNetwork[net]) affiliateMetrics.byNetwork[net] = { count: 0, clicks: 0, conversions: 0, revenue: 0 };
    affiliateMetrics.byNetwork[net].count++;
    affiliateMetrics.byNetwork[net].clicks += a.stats?.clicks || 0;
    affiliateMetrics.byNetwork[net].conversions += a.stats?.conversions || 0;
    affiliateMetrics.byNetwork[net].revenue += a.stats?.revenue || 0;
  }

  const sponsorMetrics = {
    totalSponsors: activeSponsors.length,
    totalImpressions: activeSponsors.reduce((s: number, sp: any) => s + (sp.campaignMetrics?.impressions || 0), 0),
    totalClicks: activeSponsors.reduce((s: number, sp: any) => s + (sp.campaignMetrics?.clicks || 0), 0),
    avgVisibility: Math.round(activeSponsors.reduce((s: number, sp: any) => s + (sp.visibilityScore || 0), 0) / Math.max(activeSponsors.length, 1)),
    avgTrust: Math.round(activeSponsors.reduce((s: number, sp: any) => s + (sp.trustScore || 100), 0) / Math.max(activeSponsors.length, 1)),
    byCategory: {} as Record<string, any>,
  };

  for (const s of activeSponsors) {
    const cat = s.category || 'Other';
    if (!sponsorMetrics.byCategory[cat]) sponsorMetrics.byCategory[cat] = { count: 0, impressions: 0, clicks: 0 };
    sponsorMetrics.byCategory[cat].count++;
    sponsorMetrics.byCategory[cat].impressions += s.campaignMetrics?.impressions || 0;
    sponsorMetrics.byCategory[cat].clicks += s.campaignMetrics?.clicks || 0;
  }

  return NextResponse.json({
    affiliate: affiliateMetrics,
    sponsor: sponsorMetrics,
    trust_config: trust.globalConfig,
    updated_at: metrics.updatedAt || new Date().toISOString(),
  });
}
