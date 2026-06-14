import { NextRequest, NextResponse } from 'next/server';
import {
  getRacingWorkflowStatus,
  runRacingIntelligenceWorkflow,
  type RacingWorkflowInput,
  type RacingWorkflowMode,
} from '@/lib/racing-intelligence';
import { requireAdmin } from '@/lib/server/admin-auth-guard';

const MODES: RacingWorkflowMode[] = [
  'monitor_extract',
  'calendar_update',
  'race_news',
  'pilot_profile',
  'result_analysis',
];

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function asMode(value: unknown): RacingWorkflowMode {
  return MODES.includes(value as RacingWorkflowMode) ? value as RacingWorkflowMode : 'monitor_extract';
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  return NextResponse.json(getRacingWorkflowStatus());
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = asRecord(await req.json().catch(() => ({}))) || {};
  const input: RacingWorkflowInput = {
    mode: asMode(body.mode),
    sourceMarkdown: asString(body.sourceMarkdown) || asString(body.source_markdown) || '',
    sourceUrl: asString(body.sourceUrl) || asString(body.source_url) || '',
    sourceName: asString(body.sourceName) || asString(body.source_name),
    leagueHint: asString(body.leagueHint) || asString(body.league_hint),
    publishIntent: body.publishIntent === 'publish' || body.publishIntent === 'draft' ? body.publishIntent : 'review',
  };

  if (!input.sourceMarkdown || !input.sourceUrl) {
    return NextResponse.json(
      { success: false, error: 'sourceMarkdown and sourceUrl are required.' },
      { status: 400 },
    );
  }

  const result = await runRacingIntelligenceWorkflow(input);
  return NextResponse.json(result, { status: result.configured ? 200 : 501 });
}
