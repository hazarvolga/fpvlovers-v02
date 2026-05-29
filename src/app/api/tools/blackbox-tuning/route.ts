import { NextRequest, NextResponse } from 'next/server';
import { difyRequest } from '@/lib/dify-client';
import { extractDifyMarkdown } from '@/lib/dify-response';
import { findApp } from '@/lib/master-routing-tables';
import { analyzeBlackboxTuning, type BlackboxTuningInput } from '@/lib/tools/blackbox-tuning';

const MAX_TEXT_CHARS = 60000;
const MAX_FILE_BYTES = 256 * 1024;
const BLACKBOX_DIFY_APP_NAME = 'Blackbox Tuning Advisor';
const TOOL_DIFY_TIMEOUT_MS = 15000;

type RequestPayload = BlackboxTuningInput;

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, MAX_TEXT_CHARS) : '';
}

function parseJsonPayload(value: unknown): RequestPayload {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    droneType: cleanText(record.droneType) || 'FPV quad',
    batterySpec: cleanText(record.batterySpec) || 'Unknown battery',
    problem: cleanText(record.problem),
    logData: cleanText(record.logData),
    currentPIDs: cleanText(record.currentPIDs) || 'P: 45, I: 80, D: 40, FF: 100',
    fileName: cleanText(record.fileName),
    fileText: cleanText(record.fileText),
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
    if (file.size > MAX_FILE_BYTES) {
      throw new Error(`File is too large. Limit is ${Math.round(MAX_FILE_BYTES / 1024)}KB for the tuning MVP.`);
    }
    fileText = (await file.text()).slice(0, MAX_TEXT_CHARS);
  }

  return {
    droneType: cleanText(form.get('droneType')) || 'FPV quad',
    batterySpec: cleanText(form.get('batterySpec')) || 'Unknown battery',
    problem: cleanText(form.get('problem')),
    logData: cleanText(form.get('logData')),
    currentPIDs: cleanText(form.get('currentPIDs')) || 'P: 45, I: 80, D: 40, FF: 100',
    fileName,
    fileText,
  };
}

function buildDifyPrompt(input: RequestPayload, localMarkdown: string): string {
  return [
    'Analyze this FPV blackbox tuning request using the project RAG knowledge base when available.',
    'Be practical, conservative, and motor-heat aware. Do not invent exact blackbox channels that are not present in the user data.',
    'Return concise Markdown with these headings: Diagnostic Report, Proposed Settings, Why, Next Steps.',
    'Use the local deterministic analysis as a guardrail, not as something to blindly repeat.',
    '',
    `Drone type: ${input.droneType}`,
    `Battery: ${input.batterySpec}`,
    `Issue: ${input.problem}`,
    `Current PIDs: ${input.currentPIDs}`,
    `Log summary: ${input.logData}`,
    input.fileName ? `Uploaded file: ${input.fileName}` : '',
    input.fileText ? `File excerpt:\n${input.fileText.slice(0, 12000)}` : '',
    '',
    `Local guardrail analysis:\n${localMarkdown}`,
  ].filter(Boolean).join('\n');
}

function localResponse(local: ReturnType<typeof analyzeBlackboxTuning>, warning: string) {
  return NextResponse.json({
    success: true,
    source: 'local',
    result: local,
    warning,
  });
}

export async function POST(req: NextRequest) {
  try {
    const input = await parseRequest(req);
    if (!input.problem && !input.logData && !input.fileText) {
      return NextResponse.json(
        { success: false, error: 'Provide symptoms, log summary, or a small blackbox/config excerpt.' },
        { status: 400 },
      );
    }

    const local = analyzeBlackboxTuning(input);
    const blackboxApp = findApp(BLACKBOX_DIFY_APP_NAME);

    if (!blackboxApp?.token) {
      return localResponse(
        local,
        'Blackbox review gateway is not configured; returned deterministic local analysis.',
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
          query: buildDifyPrompt(input, local.markdown),
          response_mode: 'blocking',
          user: 'fpvlovers-blackbox-tool',
        },
      });

      const markdown = extractDifyMarkdown(response.data);

      if (!response.ok || !markdown) {
        return localResponse(
          local,
          response.dryRun
            ? 'Dry-run is active in this environment; returned deterministic local analysis.'
            : 'Blackbox review gateway did not return usable Markdown; returned deterministic local analysis.',
        );
      }

      return NextResponse.json({
        success: true,
        source: 'dify',
        result: { ...local, markdown },
      });
    } catch {
      return localResponse(local, 'Blackbox review gateway failed; returned deterministic local analysis.');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Blackbox analysis failed.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
