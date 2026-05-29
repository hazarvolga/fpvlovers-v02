import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { analyzeBlackboxTuning, type BlackboxTuningInput } from '@/lib/tools/blackbox-tuning';
import { getGeminiApiKey } from '@/lib/tools/gemini-key';

const MAX_TEXT_CHARS = 60000;
const MAX_FILE_BYTES = 256 * 1024;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

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

function buildGeminiPrompt(input: RequestPayload, localMarkdown: string): string {
  return [
    'You are a senior FPV blackbox tuning advisor. Analyze the supplied Betaflight/INAV/EmuFlight tune summary.',
    'Be practical, conservative, and motor-heat aware. Do not invent exact blackbox channels that are not present.',
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
    const apiKey = getGeminiApiKey();

    if (!apiKey) {
      return NextResponse.json({
        success: true,
        source: 'local',
        result: local,
        warning: 'Gemini API key is not configured; returned deterministic local analysis.',
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: buildGeminiPrompt(input, local.markdown),
        config: {
          temperature: 0.2,
          maxOutputTokens: 1400,
        },
      });

      const markdown = response.text?.trim();
      return NextResponse.json({
        success: true,
        source: markdown ? 'gemini' : 'local',
        model: markdown ? GEMINI_MODEL : undefined,
        result: markdown ? { ...local, markdown } : local,
      });
    } catch {
      return NextResponse.json({
        success: true,
        source: 'local',
        result: local,
        warning: 'Gemini analysis failed; returned deterministic local analysis.',
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Blackbox analysis failed.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
