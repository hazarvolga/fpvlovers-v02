import { NextResponse } from 'next/server';
import { NewsletterOrchestrator } from '@/lib/server/newsletter-orchestrator';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const campaignId = (await params).id;
    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    const result = await NewsletterOrchestrator.dispatchCampaign(campaignId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`[POST /api/admin/newsletter/campaigns/dispatch] Error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to dispatch campaign' }, { status: 500 });
  }
}
