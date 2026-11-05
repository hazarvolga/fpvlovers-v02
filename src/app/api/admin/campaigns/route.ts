import { NextResponse } from 'next/server';
import { readAdminDocument, writeAdminDocument } from '@/lib/server/admin-documents';
import { requireAdmin } from '@/lib/server/admin-auth-guard';

function loadCampaigns(): Promise<any[]> {
  return readAdminDocument<any[]>('campaigns', []);
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const campaigns = await loadCampaigns();
    return NextResponse.json({ success: true, campaigns });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json();
    const campaigns = await loadCampaigns();
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
    await writeAdminDocument('campaigns', campaigns);
    return NextResponse.json({ success: true, campaign }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
