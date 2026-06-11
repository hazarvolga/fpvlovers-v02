import { NextResponse } from 'next/server';
import { NewsletterOrchestrator } from '@/lib/server/newsletter-orchestrator';

export async function POST(request: Request) {
  try {
    const campaignId = await NewsletterOrchestrator.generateDraftCampaign();
    return NextResponse.json({ success: true, campaignId });
  } catch (error: any) {
    console.error('[POST /api/admin/newsletter/generate-draft] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate draft' }, { status: 500 });
  }
}
