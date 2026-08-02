import { NextResponse } from 'next/server';
import { authorizeCronRequest } from '@/lib/cron-auth';
import { NewsletterOrchestrator } from '@/lib/server/newsletter-orchestrator';

// export const maxDuration = 300; // if using Vercel Pro, allows 5min execution
// export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = authorizeCronRequest(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const campaignId = await NewsletterOrchestrator.generateDraftCampaign();
    
    if (campaignId) {
      return NextResponse.json({
        success: true,
        message: 'Weekly newsletter draft campaign created successfully.',
        campaignId
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to create newsletter draft campaign.'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('CRON Newsletter Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal Server Error'
    }, { status: 500 });
  }
}
