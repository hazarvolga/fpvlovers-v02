import { NextRequest, NextResponse } from 'next/server';
import { listAgents, dispatchAgent } from '@/lib/agents';
import { requireAdmin } from '@/lib/server/admin-auth-guard';

// Import all agent implementations to register them
import '@/lib/agents/seoAgent';
import '@/lib/agents/affiliateAgent';
import '@/lib/agents/sponsorshipAgent';
import '@/lib/agents/retrievalAgent';
import '@/lib/agents/metadataAgent';
import '@/lib/agents/recommendationAgent';
import '@/lib/agents/ecosystemAgent';
import '@/lib/agents/ideationAgent';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  return NextResponse.json({
    agents: listAgents(),
    total: listAgents().length,
  });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json();
  const { agent, input, context } = body;

  if (!agent) {
    return NextResponse.json({ error: 'Missing required field: agent' }, { status: 400 });
  }

  if (!input || typeof input !== 'object') {
    return NextResponse.json({ error: 'Missing required field: input (object)' }, { status: 400 });
  }

  const result = await dispatchAgent({ agent, input, context });

  if (result.status === 'error') {
    return NextResponse.json(result, { status: result.error?.includes('Unknown agent') ? 404 : 500 });
  }

  return NextResponse.json(result);
}
