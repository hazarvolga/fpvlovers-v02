import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import type { RacingContentBrief, RacingExtractedEntity, RacingWorkflowRun } from '@/lib/racing-intelligence';

export type RacingStoreSectionKey =
  | 'events'
  | 'calendar'
  | 'leagues'
  | 'pilots'
  | 'teams'
  | 'tracks'
  | 'rankings'
  | 'results'
  | 'technology'
  | 'academy'
  | 'history'
  | 'news'
  | 'media'
  | 'hallOfFame'
  | 'futureSystems';

export type RacingStoredRecord = {
  id: string;
  type: string;
  name: string;
  summary: string;
  confidence: number;
  sourceUrl: string;
  sourceName?: string;
  attributes: Record<string, unknown>;
  reviewStatus: 'pending-review' | 'approved' | 'rejected';
  lastVerifiedAt: string;
};

export type RacingStoredCalendarItem = {
  id: string;
  eventName: string;
  league?: string;
  startDate?: string | null;
  endDate?: string | null;
  location?: string | null;
  status?: string;
  sourceUrl: string;
  confidence: number;
  reviewStatus: 'pending-review' | 'approved' | 'rejected';
  lastVerifiedAt: string;
};

export type RacingStoredContentBrief = RacingContentBrief & {
  id: string;
  reviewStatus: 'pending-review' | 'approved' | 'rejected';
  createdAt: string;
};

export type RacingWorkflowRunLog = {
  id: string;
  workflowName: string;
  workflowId: string;
  configured: boolean;
  success: boolean;
  status: string;
  sourceUrl?: string;
  sourceName?: string;
  workflowRunId?: string;
  totalTokens?: number;
  error?: string;
  warnings: string[];
  createdAt: string;
};

export type RacingIntelligenceStore = {
  generated_at: string;
  source: string;
  sections: Record<RacingStoreSectionKey, RacingStoredRecord[] | RacingStoredCalendarItem[]>;
  contentBriefs: RacingStoredContentBrief[];
  workflowRuns: RacingWorkflowRunLog[];
};

const STORE_FILE = path.join(process.cwd(), 'data', 'racing-intelligence-store.json');

const EMPTY_SECTIONS: Record<RacingStoreSectionKey, []> = {
  events: [],
  calendar: [],
  leagues: [],
  pilots: [],
  teams: [],
  tracks: [],
  rankings: [],
  results: [],
  technology: [],
  academy: [],
  history: [],
  news: [],
  media: [],
  hallOfFame: [],
  futureSystems: [],
};

function stableId(parts: Array<string | undefined>) {
  return createHash('sha1').update(parts.filter(Boolean).join('|').toLowerCase()).digest('hex').slice(0, 16);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizeStore(raw: unknown): RacingIntelligenceStore {
  const record = asRecord(raw) || {};
  const sections = asRecord(record.sections) || {};

  return {
    generated_at: asString(record.generated_at) || new Date(0).toISOString(),
    source: asString(record.source) || 'racing-intelligence-orchestrator',
    sections: {
      ...EMPTY_SECTIONS,
      ...Object.fromEntries(
        Object.keys(EMPTY_SECTIONS).map((key) => [
          key,
          Array.isArray(sections[key]) ? sections[key] : [],
        ]),
      ),
    } as RacingIntelligenceStore['sections'],
    contentBriefs: Array.isArray(record.contentBriefs) ? record.contentBriefs as RacingStoredContentBrief[] : [],
    workflowRuns: Array.isArray(record.workflowRuns) ? record.workflowRuns as RacingWorkflowRunLog[] : [],
  };
}

export function readRacingIntelligenceStore(): RacingIntelligenceStore {
  try {
    return normalizeStore(JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8')) as unknown);
  } catch {
    return {
      generated_at: new Date().toISOString(),
      source: 'racing-intelligence-orchestrator',
      sections: { ...EMPTY_SECTIONS } as RacingIntelligenceStore['sections'],
      contentBriefs: [],
      workflowRuns: [],
    };
  }
}

export function writeRacingIntelligenceStore(store: RacingIntelligenceStore) {
  const payload: RacingIntelligenceStore = {
    ...store,
    generated_at: new Date().toISOString(),
  };
  fs.writeFileSync(STORE_FILE, `${JSON.stringify(payload, null, 2)}\n`);
  return payload;
}

function sectionForEntity(entity: RacingExtractedEntity): RacingStoreSectionKey | undefined {
  if (entity.type === 'event') return 'events';
  if (entity.type === 'league') return 'leagues';
  if (entity.type === 'pilot') return 'pilots';
  if (entity.type === 'team') return 'teams';
  if (entity.type === 'track') return 'tracks';
  if (entity.type === 'result') return 'results';
  if (entity.type === 'ranking') return 'rankings';
  if (entity.type === 'media') return 'media';
  if (entity.type === 'rule') return 'technology';
  return undefined;
}

function normalizeEntity(entity: RacingExtractedEntity, sourceName?: string): RacingStoredRecord {
  return {
    id: stableId([entity.type, entity.name, entity.sourceUrl]),
    type: entity.type,
    name: entity.name,
    summary: entity.summary,
    confidence: entity.confidence,
    sourceUrl: entity.sourceUrl,
    sourceName,
    attributes: entity.attributes || {},
    reviewStatus: 'pending-review',
    lastVerifiedAt: new Date().toISOString(),
  };
}

function normalizeCalendarItem(value: Record<string, unknown>, sourceName?: string): RacingStoredCalendarItem | undefined {
  const eventName = asString(value.eventName) || asString(value.event_name) || asString(value.name);
  const sourceUrl = asString(value.sourceUrl) || asString(value.source_url);
  const confidence = asNumber(value.confidence) ?? 0;
  if (!eventName || !sourceUrl) return undefined;

  return {
    id: stableId(['calendar', eventName, sourceUrl, asString(value.startDate) || asString(value.start_date)]),
    eventName,
    league: asString(value.league) || sourceName,
    startDate: asString(value.startDate) || asString(value.start_date) || null,
    endDate: asString(value.endDate) || asString(value.end_date) || null,
    location: asString(value.location) || null,
    status: asString(value.status) || 'unknown',
    sourceUrl,
    confidence,
    reviewStatus: 'pending-review',
    lastVerifiedAt: new Date().toISOString(),
  };
}

function normalizeBrief(brief: RacingContentBrief): RacingStoredContentBrief {
  return {
    ...brief,
    id: stableId(['brief', brief.slug, brief.sourceUrl]),
    reviewStatus: 'pending-review',
    createdAt: new Date().toISOString(),
  };
}

function upsertById<T extends { id: string }>(items: T[], nextItems: T[]): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  for (const item of nextItems) byId.set(item.id, item);
  return [...byId.values()];
}

function createRunLog(result: RacingWorkflowRun): RacingWorkflowRunLog {
  return {
    id: stableId(['run', result.workflowName, result.outputs.sourceUrl, result.workflowRunId, new Date().toISOString()]),
    workflowName: result.workflowName,
    workflowId: result.workflowId,
    configured: result.configured,
    success: result.success,
    status: result.status,
    sourceUrl: result.outputs.sourceUrl,
    sourceName: result.outputs.sourceName,
    workflowRunId: result.workflowRunId,
    totalTokens: result.totalTokens,
    error: result.error,
    warnings: result.outputs.warnings || [],
    createdAt: new Date().toISOString(),
  };
}

export function upsertRacingWorkflowResult(result: RacingWorkflowRun) {
  const store = readRacingIntelligenceStore();
  const sourceName = result.outputs.sourceName;

  for (const entity of result.outputs.entities || []) {
    if (!entity.sourceUrl || entity.confidence < 0.45) continue;
    const section = sectionForEntity(entity);
    if (!section) continue;
    const normalized = normalizeEntity(entity, sourceName);
    store.sections[section] = upsertById(store.sections[section] as RacingStoredRecord[], [normalized]);
  }

  const calendarItems = (result.outputs.calendarItems || [])
    .map((item) => normalizeCalendarItem(item, sourceName))
    .filter((item): item is RacingStoredCalendarItem => Boolean(item));
  store.sections.calendar = upsertById(store.sections.calendar as RacingStoredCalendarItem[], calendarItems);

  const briefs = (result.outputs.contentBriefs || [])
    .filter((brief) => brief.sourceUrl && brief.reviewRequired)
    .map(normalizeBrief);
  store.contentBriefs = upsertById(store.contentBriefs, briefs);

  store.workflowRuns = [createRunLog(result), ...store.workflowRuns].slice(0, 100);
  return writeRacingIntelligenceStore(store);
}

export function getRacingStoreSummary(store = readRacingIntelligenceStore()) {
  return {
    generated_at: store.generated_at,
    sections: Object.fromEntries(
      Object.entries(store.sections).map(([key, items]) => [key, items.length]),
    ),
    contentBriefs: store.contentBriefs.length,
    workflowRuns: store.workflowRuns.length,
  };
}
