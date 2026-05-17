import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SPONSORS_FILE = path.join(process.cwd(), 'data', 'sponsors.json');
const METRICS_FILE = path.join(process.cwd(), 'data', 'campaignMetrics.json');
const TRUST_FILE = path.join(process.cwd(), 'data', 'trustScores.json');

type SponsorProduct = { name: string; url: string; compatibleWith?: string[] };
type CampaignHistoryEntry = {
  id: string; name: string; startDate: string; endDate: string; budget: number;
  impressions: number; clicks: number; ctr: number; status: 'active' | 'completed' | 'cancelled';
};
type CampaignMetrics = {
  impressions: number; clicks: number; ctr: number; contextualEngagement: number;
  retrievalAppearances: number; recommendationConfidence: number; semanticMatchQuality: number;
};

type Sponsor = {
  id: string; name: string; type: string; url: string; budget: string; budgetAmount: number;
  priority: number; category: string; region: string; active: boolean;
  products: SponsorProduct[];
  visibilityScore: number; semanticRelevance: number; retrievalPresence: number;
  recommendationExposure: number; campaignHistory: CampaignHistoryEntry[];
  trustScore: number; campaignMetrics: CampaignMetrics;
  createdAt: string; updatedAt: string;
};
type MetricsStore = { sponsor: { totalImpressions?: number; updatedAt?: string } };
type TrustStore = {
  affiliates: Record<string, any>;
  sponsors: Record<string, { trustScore?: number; updatedAt?: string }>;
  globalConfig: Record<string, any>;
};

function read<T>(file: string, fallback: T): T {
  try { if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch {}
  return fallback;
}
function write(file: string, data: any) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

function readSponsors(): Sponsor[] {
  try { if (fs.existsSync(SPONSORS_FILE)) return JSON.parse(fs.readFileSync(SPONSORS_FILE, 'utf-8')); } catch {}
  return [];
}
function writeSponsors(data: Sponsor[]) { fs.writeFileSync(SPONSORS_FILE, JSON.stringify(data, null, 2)); }

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || 'all';
  const data: any = {};

  if (type === 'all' || type === 'sponsors') data.sponsors = readSponsors();
  if (type === 'all' || type === 'metrics') data.metrics = read(METRICS_FILE, { sponsor: {} });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;
  const sponsors = readSponsors();

  if (action === 'add-product') {
    const sponsor = sponsors.find(s => s.id === body.sponsorId);
    if (sponsor) {
      sponsor.products.push({ name: body.productName, url: body.productUrl, compatibleWith: body.compatibleWith || [] });
      sponsor.updatedAt = new Date().toISOString();
      writeSponsors(sponsors);
      return NextResponse.json({ sponsor });
    }
    return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 });
  }

  if (action === 'remove-product') {
    const sponsor = sponsors.find(s => s.id === body.sponsorId);
    if (sponsor) {
      sponsor.products = sponsor.products.filter((_, i) => i !== body.productIndex);
      sponsor.updatedAt = new Date().toISOString();
      writeSponsors(sponsors);
      return NextResponse.json({ sponsor });
    }
  }

  if (action === 'toggle') {
    const sponsor = sponsors.find(s => s.id === body.id);
    if (sponsor) { sponsor.active = !sponsor.active; sponsor.updatedAt = new Date().toISOString(); writeSponsors(sponsors); }
    return NextResponse.json({ sponsors });
  }

  // --- METRICS ACTIONS ---
  if (action === 'track-sponsor-impression') {
    const sponsor = sponsors.find(s => s.id === body.sponsorId);
    if (sponsor) {
      sponsor.campaignMetrics.impressions += 1;
      sponsor.recommendationExposure += 1;
      sponsor.updatedAt = new Date().toISOString();
      writeSponsors(sponsors);

      const metrics = read<MetricsStore>(METRICS_FILE, { sponsor: {} });
      metrics.sponsor.totalImpressions = (metrics.sponsor.totalImpressions || 0) + 1;
      metrics.sponsor.updatedAt = new Date().toISOString();
      write(METRICS_FILE, metrics);
    }
    return NextResponse.json({ sponsors });
  }

  if (action === 'track-sponsor-click') {
    const sponsor = sponsors.find(s => s.id === body.sponsorId);
    if (sponsor) {
      sponsor.campaignMetrics.clicks += 1;
      sponsor.campaignMetrics.ctr = sponsor.campaignMetrics.impressions > 0
        ? sponsor.campaignMetrics.clicks / sponsor.campaignMetrics.impressions
        : 0;
      sponsor.updatedAt = new Date().toISOString();
      writeSponsors(sponsors);
    }
    return NextResponse.json({ sponsors });
  }

  if (action === 'update-visibility') {
    const sponsor = sponsors.find(s => s.id === body.sponsorId);
    if (sponsor) {
      if (body.visibilityScore !== undefined) sponsor.visibilityScore = body.visibilityScore;
      if (body.retrievalPresence !== undefined) sponsor.retrievalPresence = body.retrievalPresence;
      if (body.recommendationExposure !== undefined) sponsor.recommendationExposure = body.recommendationExposure;
      if (body.semanticRelevance !== undefined) sponsor.semanticRelevance = body.semanticRelevance;
      sponsor.campaignMetrics.retrievalAppearances = (sponsor.campaignMetrics.retrievalAppearances || 0) + 1;
      sponsor.updatedAt = new Date().toISOString();
      writeSponsors(sponsors);
    }
    return NextResponse.json({ sponsors });
  }

  if (action === 'update-campaign-metrics') {
    const sponsor = sponsors.find(s => s.id === body.sponsorId);
    if (sponsor) {
      if (body.recommendationConfidence !== undefined) sponsor.campaignMetrics.recommendationConfidence = body.recommendationConfidence;
      if (body.semanticMatchQuality !== undefined) sponsor.campaignMetrics.semanticMatchQuality = body.semanticMatchQuality;
      if (body.contextualEngagement !== undefined) sponsor.campaignMetrics.contextualEngagement = body.contextualEngagement;
      sponsor.updatedAt = new Date().toISOString();
      writeSponsors(sponsors);
    }
    return NextResponse.json({ sponsors });
  }

  if (action === 'add-campaign-history') {
    const sponsor = sponsors.find(s => s.id === body.sponsorId);
    if (sponsor) {
      sponsor.campaignHistory.push({
        id: Date.now().toString(36),
        name: body.campaignName,
        startDate: body.startDate || new Date().toISOString(),
        endDate: body.endDate || '',
        budget: body.budget || 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        status: 'active',
      });
      sponsor.updatedAt = new Date().toISOString();
      writeSponsors(sponsors);
    }
    return NextResponse.json({ sponsors });
  }

  // --- TRUST ACTION ---
  if (action === 'update-sponsor-trust') {
    const sponsor = sponsors.find(s => s.id === body.sponsorId);
    if (sponsor) {
      sponsor.trustScore = body.trustScore;
      sponsor.updatedAt = new Date().toISOString();
      writeSponsors(sponsors);

      const trust = read<TrustStore>(TRUST_FILE, { affiliates: {}, sponsors: {}, globalConfig: {} });
      if (!trust.sponsors[body.sponsorId]) trust.sponsors[body.sponsorId] = {};
      trust.sponsors[body.sponsorId].trustScore = body.trustScore;
      trust.sponsors[body.sponsorId].updatedAt = new Date().toISOString();
      write(TRUST_FILE, trust);
    }
    return NextResponse.json({ sponsors });
  }

  // Default: add sponsor
  sponsors.unshift({
    id: body.id || Date.now().toString(36),
    name: body.name,
    type: body.type || 'manufacturer',
    url: body.url,
    budget: body.budget || '',
    budgetAmount: body.budgetAmount || 0,
    priority: body.priority || 0,
    category: body.category || 'Drone Parts',
    region: body.region || 'global',
    active: true,
    products: [],
    visibilityScore: 0,
    semanticRelevance: 0,
    retrievalPresence: 0,
    recommendationExposure: 0,
    campaignHistory: [],
    trustScore: 100,
    campaignMetrics: {
      impressions: 0,
      clicks: 0,
      ctr: 0,
      contextualEngagement: 0,
      retrievalAppearances: 0,
      recommendationConfidence: 0,
      semanticMatchQuality: 0,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  writeSponsors(sponsors);
  return NextResponse.json({ sponsors });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const sponsors = readSponsors().filter(s => s.id !== id);
  writeSponsors(sponsors);
  return NextResponse.json({ remaining: sponsors.length });
}
