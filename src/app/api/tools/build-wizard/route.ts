import { NextRequest, NextResponse } from 'next/server';
import { difyRequest } from '@/lib/dify-client';
import { extractDifyMarkdown } from '@/lib/dify-response';
import { findApp } from '@/lib/master-routing-tables';
import { calculateBuild, type BuildCalculatorInput, type BuildStyle } from '@/lib/tools/build-calculator';

const BUILD_STYLES: BuildStyle[] = ['freestyle', 'racing', 'cinematic', 'longRange', 'whoop'];
const TOOL_DIFY_TIMEOUT_MS = 25000;

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function numberField(record: Record<string, unknown>, key: keyof BuildCalculatorInput, fallback: number): number {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function parseBuildInput(value: unknown): BuildCalculatorInput {
  const record = asRecord(value) || {};
  const style = asString(record.style);

  return {
    style: style && BUILD_STYLES.includes(style as BuildStyle) ? style as BuildStyle : 'freestyle',
    frameWeight: numberField(record, 'frameWeight', 130),
    motorWeight: numberField(record, 'motorWeight', 32),
    stackWeight: numberField(record, 'stackWeight', 28),
    videoWeight: numberField(record, 'videoWeight', 36),
    propWeight: numberField(record, 'propWeight', 18),
    batteryWeight: numberField(record, 'batteryWeight', 190),
    payloadWeight: numberField(record, 'payloadWeight', 0),
    cellCount: numberField(record, 'cellCount', 6),
    batteryCapacityMah: numberField(record, 'batteryCapacityMah', 1100),
    batteryCRating: numberField(record, 'batteryCRating', 100),
    motorKv: numberField(record, 'motorKv', 1900),
    propDiameter: numberField(record, 'propDiameter', 5),
    propPitch: numberField(record, 'propPitch', 3.6),
    escAmpRating: numberField(record, 'escAmpRating', 45),
  };
}

function buildLocalMarkdown(input: BuildCalculatorInput, result: ReturnType<typeof calculateBuild>): string {
  const warningLines = result.warnings.length
    ? result.warnings.map((warning) => `- ${warning}`)
    : ['- No major fit warnings from the deterministic calculator.'];

  return [
    '### Build Wizard Review',
    `- Profile: ${input.style}`,
    `- AUW: ${result.auw}g`,
    `- Thrust ratio: ${result.estimatedThrustRatio}:1 against ${result.targetThrustRatio}:1 target`,
    `- Hover throttle: ${result.estimatedHoverThrottle}%`,
    `- Estimated flight time: ${result.estimatedFlightTimeMin} minutes`,
    `- ESC current margin: ${result.currentMargin}A per motor`,
    `- Safe KV window: ${result.safeKvRange.min}-${result.safeKvRange.max}KV`,
    '',
    '### Safety Notes',
    ...warningLines,
    '',
    '### Next Step',
    '- Verify real manufacturer thrust tables, ESC burst rating, battery sag, and prop clearance before buying parts.',
  ].join('\n');
}

function buildDifyPrompt(input: BuildCalculatorInput, result: ReturnType<typeof calculateBuild>, localMarkdown: string): string {
  return [
    'You are the FPVLovers Build Wizard.',
    'Use the project RAG datasets for FPV build guidance when available.',
    'Do not replace the deterministic calculator numbers; explain them and give practical build recommendations.',
    'Return concise Markdown with headings: Build Verdict, Risk Notes, Recommended Adjustments, Shopping/Validation Checklist.',
    '',
    `Build input JSON:\n${JSON.stringify(input)}`,
    `Calculator result JSON:\n${JSON.stringify(result)}`,
    '',
    `Local guardrail:\n${localMarkdown}`,
  ].join('\n');
}

import { rateLimit } from '@/lib/server/rate-limit';

export async function POST(req: NextRequest) {
  // Enforce rate limiting: 5 requests per minute
  const limitRes = rateLimit(req, 5, 60 * 1000, 'build-wizard');
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
    const input = parseBuildInput(await req.json().catch(() => ({})));
    const result = calculateBuild(input);
    const localMarkdown = buildLocalMarkdown(input, result);
    const app = findApp('Build Wizard');

    if (!app?.token) {
      return NextResponse.json({
        success: true,
        source: 'local',
        result,
        markdown: localMarkdown,
        warning: 'Build review gateway is not configured; returned deterministic build review.',
      });
    }

    const response = await difyRequest('/chat-messages', {
      method: 'POST',
      apiKey: app.token,
      taskType: 'rag_query',
      timeout: TOOL_DIFY_TIMEOUT_MS,
      body: {
        inputs: {},
        query: buildDifyPrompt(input, result, localMarkdown),
        response_mode: 'blocking',
        user: 'fpvlovers-build-wizard',
      },
    });

    const markdown = extractDifyMarkdown(response.data);
    if (!response.ok || !markdown) {
      return NextResponse.json({
        success: true,
        source: 'local',
        result,
        markdown: localMarkdown,
        warning: response.dryRun
          ? 'Dry-run is active locally; returned deterministic build review.'
          : 'Build review gateway did not return usable Markdown; returned deterministic build review.',
      });
    }

    return NextResponse.json({
      success: true,
      source: 'dify',
      result,
      markdown,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Build Wizard analysis failed.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
