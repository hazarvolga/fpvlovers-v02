import { NextRequest, NextResponse } from 'next/server';
import { difyRequest } from '@/lib/dify-client';
import { extractDifyMarkdown } from '@/lib/dify-response';
import { findApp } from '@/lib/master-routing-tables';
import {
  analyzeBlackboxTuning,
  isUnsupportedBlackboxBinaryFile,
  summarizeBlackboxText,
  type BlackboxTuningInput,
} from '@/lib/tools/blackbox-tuning';
import { getGroundingContext, type GroundingContext } from '@/lib/tools/retrieval-grounding';

const MAX_TEXT_CHARS = 60000;
const MAX_FILE_BYTES = 256 * 1024;
const BLACKBOX_DIFY_APP_NAME = 'Blackbox Tuning Advisor';
const TOOL_DIFY_TIMEOUT_MS = 15000;

type RequestPayload = BlackboxTuningInput;
type BlackboxAnswerMode = 'local_guardrail' | 'dify_grounded' | 'dify_unverified';
type BlackboxGatewayStatus = 'dry_run' | 'dify_ok' | 'dify_empty' | 'dify_error' | 'not_configured';

type BlackboxSource = {
  title: string;
  url?: string;
  dataset?: string;
  score?: number;
};

class InputError extends Error {
  status = 400;
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, MAX_TEXT_CHARS) : '';
}

function parseJsonPayload(value: unknown): RequestPayload {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const fileName = cleanText(record.fileName);
  const fileText = cleanText(record.fileText);
  if (isUnsupportedBlackboxBinaryFile(fileName)) {
    throw new InputError('Raw .bbl/.bfl binary parsing is not enabled yet. Export CSV/text from Betaflight Blackbox Explorer or upload a CLI/log excerpt.');
  }
  const parsedTelemetry = summarizeBlackboxText(fileName, fileText);

  return {
    droneType: cleanText(record.droneType) || 'FPV quad',
    batterySpec: cleanText(record.batterySpec) || 'Unknown battery',
    problem: cleanText(record.problem),
    logData: cleanText(record.logData),
    currentPIDs: cleanText(record.currentPIDs) || 'P: 45, I: 80, D: 40, FF: 100',
    fileName,
    fileText,
    parsedTelemetrySummary: parsedTelemetry?.summary,
    gyroModel: cleanText(record.gyroModel),
  };
}

async function parseRequest(req: NextRequest): Promise<RequestPayload> {
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return parseJsonPayload(await req.json().catch(() => ({})));
  }

  const form = await req.formData();
  const file = form.get('file');
  let fileText = '';
  let fileName = '';

  if (file instanceof File) {
    fileName = file.name;
    if (isUnsupportedBlackboxBinaryFile(fileName)) {
      throw new InputError('Raw .bbl/.bfl binary parsing is not enabled yet. Export CSV/text from Betaflight Blackbox Explorer or upload a CLI/log excerpt.');
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new InputError(`File is too large. Limit is ${Math.round(MAX_FILE_BYTES / 1024)}KB for the tuning MVP.`);
    }
    fileText = (await file.text()).slice(0, MAX_TEXT_CHARS);
  }

  const parsedTelemetry = summarizeBlackboxText(fileName, fileText);

  return {
    droneType: cleanText(form.get('droneType')) || 'FPV quad',
    batterySpec: cleanText(form.get('batterySpec')) || 'Unknown battery',
    problem: cleanText(form.get('problem')),
    logData: cleanText(form.get('logData')),
    currentPIDs: cleanText(form.get('currentPIDs')) || 'P: 45, I: 80, D: 40, FF: 100',
    fileName,
    fileText,
    parsedTelemetrySummary: parsedTelemetry?.summary,
    gyroModel: cleanText(form.get('gyroModel')),
  };
}

function groundingQuery(input: RequestPayload): string {
  return [input.problem, input.parsedTelemetrySummary, input.gyroModel].filter(Boolean).join(' — ')
    || `${input.droneType} PID tuning`;
}

function buildDifyPrompt(input: RequestPayload, localMarkdown: string, grounding: GroundingContext): string {
  return [
    'Analyze this FPV blackbox tuning request using the verified RAG context below.',
    'Write strictly in English.',
    'Be practical, conservative, and motor-heat aware. Do not invent exact blackbox channels that are not present in the user data.',
    'Return concise Markdown with these headings: Diagnostic Report, Proposed Settings, Why, Next Steps.',
    'Cite source titles or URLs from the RAG context when you rely on them. If the RAG context is empty or weak, say so explicitly instead of inventing sources.',
    'Use the local deterministic analysis as a guardrail, not as something to blindly repeat.',
    '',
    `Drone type: ${input.droneType}`,
    `Battery: ${input.batterySpec}`,
    `Gyro sensor: ${input.gyroModel || 'Not specified'}`,
    `Issue: ${input.problem}`,
    `Current PIDs: ${input.currentPIDs}`,
    `Log summary: ${input.logData}`,
    input.parsedTelemetrySummary ? `Parsed telemetry summary: ${input.parsedTelemetrySummary}` : '',
    input.fileName ? `Uploaded file: ${input.fileName}` : '',
    input.fileText ? `File excerpt:\n${input.fileText.slice(0, 12000)}` : '',
    '',
    `### Verified RAG Context (confidence: ${grounding.grade})\n${grounding.contextBlock}`,
    '',
    `Local guardrail analysis:\n${localMarkdown}`,
  ].filter(Boolean).join('\n');
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? value as Record<string, unknown> : undefined;
}

function sourceFromRecord(record: Record<string, unknown>): BlackboxSource | undefined {
  const title = typeof record.title === 'string'
    ? record.title
    : typeof record.document_name === 'string'
      ? record.document_name
      : typeof record.source === 'string'
        ? record.source
        : '';
  if (!title.trim()) return undefined;

  const url = typeof record.url === 'string' ? record.url : undefined;
  const dataset = typeof record.dataset_name === 'string'
    ? record.dataset_name
    : typeof record.dataset === 'string'
      ? record.dataset
      : undefined;
  const score = typeof record.score === 'number'
    ? record.score
    : typeof record.metadata_score === 'number'
      ? record.metadata_score
      : undefined;

  return { title: title.trim(), url, dataset, score };
}

function extractDifySources(value: unknown): BlackboxSource[] {
  const root = toRecord(value);
  const data = toRecord(root?.data) ?? root;
  const metadata = toRecord(data?.metadata);
  const resources = metadata?.retriever_resources;

  if (!Array.isArray(resources)) return [];

  return resources
    .map((item) => toRecord(item))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map(sourceFromRecord)
    .filter((item): item is BlackboxSource => Boolean(item))
    .slice(0, 6);
}

function retrievalConfidenceFromSources(sources: BlackboxSource[], localConfidence: number): number {
  if (!sources.length) return 0;
  const scored = sources.map((source) => source.score).filter((score): score is number => typeof score === 'number');
  if (!scored.length) return Math.min(70, localConfidence);
  const average = scored.reduce((sum, score) => sum + score, 0) / scored.length;
  return Math.round(Math.max(0, Math.min(100, average <= 1 ? average * 100 : average)));
}

function mergeSources(difySources: BlackboxSource[], grounding: GroundingContext): BlackboxSource[] {
  const merged = [...difySources];
  const seenTitles = new Set(difySources.map((s) => s.title.toLowerCase()));
  for (const source of grounding.sources) {
    if (seenTitles.has(source.title.toLowerCase())) continue;
    seenTitles.add(source.title.toLowerCase());
    merged.push({ title: source.title, url: source.url, dataset: source.dataset, score: source.score });
  }
  return merged.slice(0, 8);
}

function localResponse(
  local: ReturnType<typeof analyzeBlackboxTuning>,
  warning: string,
  gatewayStatus: BlackboxGatewayStatus,
  grounding: GroundingContext,
) {
  return NextResponse.json({
    success: true,
    source: 'local',
    answerMode: (grounding.sources.length > 0 ? 'dify_grounded' : 'local_guardrail') satisfies BlackboxAnswerMode,
    gatewayStatus,
    sources: grounding.sources,
    retrievalConfidence: grounding.confidence,
    result: local,
    warning,
  });
}

import { rateLimit } from '@/lib/server/rate-limit';

export async function POST(req: NextRequest) {
  // Enforce rate limiting: 5 requests per minute
  const limitRes = rateLimit(req, 5, 60 * 1000, 'blackbox-tuning');
  if (!limitRes.success) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again in a minute.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limitRes.limit),
          'X-RateLimit-Remaining': String(limitRes.remaining),
          'X-RateLimit-Reset': String(limitRes.reset),
        },
      }
    );
  }

  try {
    const input = await parseRequest(req);
    if (!input.problem && !input.logData && !input.fileText) {
      return NextResponse.json(
        { success: false, error: 'Provide symptoms, log summary, or a small blackbox/config excerpt.' },
        { status: 400 },
      );
    }

    const local = analyzeBlackboxTuning(input);
    const grounding = await getGroundingContext(groundingQuery(input), 'tuning');
    const blackboxApp = findApp(BLACKBOX_DIFY_APP_NAME);

    if (!blackboxApp?.token) {
      return localResponse(
        local,
        'Blackbox review gateway is not configured; returned deterministic local analysis.',
        'not_configured',
        grounding,
      );
    }

    try {
      const response = await difyRequest('/chat-messages', {
        method: 'POST',
        apiKey: blackboxApp.token,
        taskType: 'rag_query',
        timeout: TOOL_DIFY_TIMEOUT_MS,
        body: {
          inputs: {},
          query: buildDifyPrompt(input, local.markdown, grounding),
          response_mode: 'blocking',
          user: 'fpvlovers-blackbox-tool',
        },
      });

      const markdown = extractDifyMarkdown(response.data);
      const difySources = extractDifySources(response.data);
      const sources = mergeSources(difySources, grounding);

      if (!response.ok || !markdown) {
        return localResponse(
          local,
          response.dryRun
            ? 'Dry-run is active in this environment; returned deterministic local analysis.'
            : 'Blackbox review gateway did not return usable Markdown; returned deterministic local analysis.',
          response.dryRun ? 'dry_run' : 'dify_empty',
          grounding,
        );
      }

      return NextResponse.json({
        success: true,
        source: 'dify',
        answerMode: (sources.length > 0 ? 'dify_grounded' : 'dify_unverified') satisfies BlackboxAnswerMode,
        gatewayStatus: 'dify_ok' satisfies BlackboxGatewayStatus,
        sources,
        retrievalConfidence: Math.max(retrievalConfidenceFromSources(difySources, local.confidence), grounding.confidence),
        result: { ...local, markdown },
      });
    } catch {
      return localResponse(local, 'Blackbox review gateway failed; returned deterministic local analysis.', 'dify_error', grounding);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Blackbox analysis failed.';
    const status = error instanceof InputError ? error.status : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
