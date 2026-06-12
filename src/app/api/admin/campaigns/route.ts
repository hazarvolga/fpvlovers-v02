import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { safeReadJson } from '@/lib/utils/json';

const CAMPAIGNS_FILE = path.join(process.cwd(), 'data', 'campaigns.json');

function loadCampaigns() {
  return safeReadJson<any[]>(CAMPAIGNS_FILE, []);
}

export async function GET() {
  try {
    const campaigns = loadCampaigns();
    return NextResponse.json({ success: true, campaigns });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const campaigns = loadCampaigns();
    const { name, type, variants, startDate, endDate } = body;

    const campaign = {
      id: `cmp_${Date.now()}`,
      name: name || 'New Campaign',
      type: type || 'ab_test',
      startDate: startDate || new Date().toISOString(),
      endDate: endDate || new Date(Date.now() + 30 * 86400000).toISOString(),
      status: 'active',
      variants: variants || [
        { name: 'control', traffic: 50, cta: 'Learn More' },
        { name: 'variant_a', traffic: 50, cta: 'Get Started' },
      ],
      metrics: { impressions: 0, clicks: 0, conversions: 0, ctr: 0, conversionRate: 0 },
      createdAt: new Date().toISOString(),
    };

    campaigns.push(campaign);
    fs.writeFileSync(CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 2));
    return NextResponse.json({ success: true, campaign }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
