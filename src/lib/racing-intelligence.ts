import { runWorkflow } from '@/lib/content-automation/dify-generation';
import { WORKFLOW_IDS, WORKFLOW_TOKENS } from '@/lib/master-routing-tables';

export type RacingWorkflowMode =
  | 'monitor_extract'
  | 'calendar_update'
  | 'race_news'
  | 'pilot_profile'
  | 'result_analysis';

export type RacingWorkflowInput = {
  mode: RacingWorkflowMode;
  sourceMarkdown: string;
  sourceUrl: string;
  sourceName?: string;
  leagueHint?: string;
  publishIntent?: 'draft' | 'review' | 'publish';
};

export type RacingExtractedEntity = {
  type: 'league' | 'event' | 'pilot' | 'team' | 'track' | 'result' | 'ranking' | 'media' | 'rule';
  name: string;
  summary: string;
  confidence: number;
  sourceUrl: string;
  attributes: Record<string, unknown>;
};

export type RacingContentBrief = {
  contentType: 'event-preview' | 'result-recap' | 'pilot-profile' | 'league-update' | 'calendar-update' | 'race-tech';
  title: string;
  slug: string;
  angle: string;
  priority: 'high' | 'medium' | 'low';
  targetSection: string;
  sourceUrl: string;
  reviewRequired: boolean;
};

export type RacingWorkflowOutputs = {
  sourceUrl?: string;
  sourceName?: string;
  mode?: RacingWorkflowMode;
  entities?: RacingExtractedEntity[];
  calendarItems?: Record<string, unknown>[];
  contentBriefs?: RacingContentBrief[];
  warnings?: string[];
  nextActions?: string[];
};

export type RacingWorkflowRun = {
  configured: boolean;
  workflowName: string;
  workflowId: string;
  success: boolean;
  status: string;
  workflowRunId?: string;
  totalTokens?: number;
  outputs: RacingWorkflowOutputs;
  error?: string;
};

const WORKFLOW_NAME = 'racingIntelligenceOrchestrator';

function getConfiguredWorkflowId() {
  return process.env.DIFY_RACING_WORKFLOW_ID?.trim()
    || WORKFLOW_IDS[WORKFLOW_NAME]
    || '';
}

function normalizeInput(input: RacingWorkflowInput): Record<string, unknown> {
  return {
    task_mode: input.mode,
    source_markdown: input.sourceMarkdown.slice(0, 45000),
    source_url: input.sourceUrl,
    source_name: input.sourceName || '',
    league_hint: input.leagueHint || '',
    publish_intent: input.publishIntent || 'review',
  };
}

function isConfigured(workflowId: string | undefined, token: string | undefined): workflowId is string {
  return Boolean(workflowId && !workflowId.startsWith('TODO-') && token);
}

function configurationPendingResult(input: RacingWorkflowInput, workflowId: string): RacingWorkflowRun {
  return {
    configured: false,
    workflowName: WORKFLOW_NAME,
    workflowId,
    success: false,
    status: 'not_configured',
    outputs: {
      sourceUrl: input.sourceUrl,
      sourceName: input.sourceName,
      mode: input.mode,
      entities: [],
      calendarItems: [],
      contentBriefs: [],
      warnings: [
        'Racing Intelligence workflow DSL is present, but the Dify app has not been imported and DIFY_RACING_WORKFLOW_TOKEN is not configured.',
      ],
      nextActions: [
        'Import dify_workflows/racing-intelligence-orchestrator.dify.yml into Dify.',
        'Publish the Dify workflow app and create an API key for it.',
        'Set DIFY_RACING_WORKFLOW_TOKEN in .env.local and deployment secrets.',
        'Replace WORKFLOW_IDS.racingIntelligenceOrchestrator with the published Dify workflow id if Dify exposes it.',
      ],
    },
    error: 'Racing Intelligence workflow is not configured.',
  };
}

function parseJsonObject(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== 'string') return undefined;
  
  let cleaned = value.trim();
  
  // Strip markdown JSON fences
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    cleaned = fenceMatch[1].trim();
  }
  
  try {
    const parsed = JSON.parse(cleaned) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : undefined;
  } catch {
    return undefined;
  }
}

function normalizeOutputs(outputs: Record<string, unknown>): RacingWorkflowOutputs {
  const normalized = parseJsonObject(outputs.result) || outputs;
  return {
    sourceUrl: typeof normalized.source_url === 'string' ? normalized.source_url : undefined,
    sourceName: typeof normalized.source_name === 'string' ? normalized.source_name : undefined,
    mode: typeof normalized.task_mode === 'string' ? normalized.task_mode as RacingWorkflowMode : undefined,
    entities: Array.isArray(normalized.entities) ? normalized.entities as RacingExtractedEntity[] : [],
    calendarItems: Array.isArray(normalized.calendar_items) ? normalized.calendar_items as Record<string, unknown>[] : [],
    contentBriefs: Array.isArray(normalized.content_briefs) ? normalized.content_briefs as RacingContentBrief[] : [],
    warnings: Array.isArray(normalized.warnings) ? normalized.warnings.filter((item): item is string => typeof item === 'string') : [],
    nextActions: Array.isArray(normalized.next_actions) ? normalized.next_actions.filter((item): item is string => typeof item === 'string') : [],
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

function fallbackOutputs(input: RacingWorkflowInput, reason: string): RacingWorkflowOutputs {
  const sourceName = input.sourceName || input.leagueHint || 'Racing source';
  const leagueName = input.leagueHint || sourceName;
  const title = `${sourceName}: racing source update`;

  return {
    sourceUrl: input.sourceUrl,
    sourceName,
    mode: input.mode,
    entities: [
      {
        type: 'league',
        name: leagueName,
        summary: `Fallback extraction from ${sourceName}. Dify workflow did not return structured entities; source must be reviewed before publication.`,
        confidence: 0.45,
        sourceUrl: input.sourceUrl,
        attributes: {
          extractionMode: 'local-fallback',
          workflowFailure: reason,
        },
      },
    ],
    calendarItems: [],
    contentBriefs: [
      {
        contentType: 'league-update',
        title,
        slug: slugify(title),
        angle: 'Source-backed racing update requiring editorial verification before publishing.',
        priority: 'low',
        targetSection: 'Racing',
        sourceUrl: input.sourceUrl,
        reviewRequired: true,
      },
    ],
    warnings: [
      `Dify racing workflow failed: ${reason}`,
      'Local fallback produced a review-required brief only; do not auto-publish as live race data.',
    ],
    nextActions: [
      'Check DIFY_RACING_WORKFLOW_TOKEN and the published Dify app status.',
      'Run the racing workflow smoke again after Dify returns structured outputs.',
      'Keep fallback briefs in editorial review until the source is verified.',
    ],
  };
}

export function getRacingWorkflowStatus() {
  const workflowId = getConfiguredWorkflowId();
  const token = WORKFLOW_TOKENS[WORKFLOW_NAME] || '';
  return {
    workflowName: WORKFLOW_NAME,
    workflowId,
    configured: isConfigured(workflowId, token),
    tokenConfigured: Boolean(token),
    dslPath: 'dify_workflows/racing-intelligence-orchestrator.dify.yml',
  };
}

export async function runRacingIntelligenceWorkflow(input: RacingWorkflowInput): Promise<RacingWorkflowRun> {
  const workflowId = getConfiguredWorkflowId();
  const token = WORKFLOW_TOKENS[WORKFLOW_NAME] || '';

  if (!isConfigured(workflowId, token)) {
    return configurationPendingResult(input, workflowId || 'TODO-import-to-dify-first');
  }

  const result = await runWorkflow(token, normalizeInput(input));
  if (!result.success) {
    const failureReason = result.rawAnswer && result.rawAnswer !== '{}'
      ? result.rawAnswer
      : 'Dify workflow returned unsuccessful status without structured outputs.';
    return {
      configured: true,
      workflowName: WORKFLOW_NAME,
      workflowId,
      success: true,
      status: 'fallback',
      workflowRunId: result.workflowRunId ?? undefined,
      totalTokens: result.totalTokens ?? undefined,
      outputs: fallbackOutputs(input, failureReason),
      error: `Racing workflow failed; local fallback used. ${failureReason}`,
    };
  }

  return {
    configured: true,
    workflowName: WORKFLOW_NAME,
    workflowId,
    success: result.success,
    status: result.success ? 'success' : 'failed',
    workflowRunId: result.workflowRunId ?? undefined,
    totalTokens: result.totalTokens ?? undefined,
    outputs: normalizeOutputs(result.outputs ?? {}),
  };
}
