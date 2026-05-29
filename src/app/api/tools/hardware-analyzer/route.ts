import { NextRequest, NextResponse } from 'next/server';
import { difyRequest } from '@/lib/dify-client';
import { extractDifyMarkdown } from '@/lib/dify-response';
import { findApp } from '@/lib/master-routing-tables';

const TOOL_DIFY_TIMEOUT_MS = 15000;

type HardwarePayload = {
  frame: string;
  motor: string;
  esc: string;
  battery: string;
  fc: string;
  vtx: string;
};

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, 500) : '';
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function parsePayload(value: unknown): HardwarePayload {
  const record = asRecord(value) || {};
  return {
    frame: cleanText(record.frame) || 'Unknown frame',
    motor: cleanText(record.motor) || 'Unknown motor',
    esc: cleanText(record.esc) || 'Unknown ESC',
    battery: cleanText(record.battery) || 'Unknown battery',
    fc: cleanText(record.fc) || 'Unknown flight controller',
    vtx: cleanText(record.vtx) || 'Unknown VTX/camera',
  };
}

function localHardwareMarkdown(input: HardwarePayload): string {
  const isSixS = /\b6s\b/i.test(input.battery);
  const isFourS = /\b4s\b/i.test(input.battery);
  const kv = Number(input.motor.match(/(\d{3,5})\s*kv/i)?.[1] || 0);
  const escAmp = Number(input.esc.match(/(\d{2,3})\s*a/i)?.[1] || 0);

  const kvRisk = isSixS && kv > 2100
    ? 'High KV for 6S; expect heat and current spikes unless props are very light.'
    : isFourS && kv > 0 && kv < 1900
      ? 'Low KV for 4S; build may feel underpowered on 5 inch props.'
      : 'Motor KV appears plausible for the stated battery.';

  const escRisk = escAmp > 0 && escAmp < 35
    ? 'ESC current margin looks tight for aggressive 5 inch freestyle.'
    : 'ESC current rating looks acceptable for a normal FPV build.';

  return [
    '### Compatibility Matrix',
    `- Frame: ${input.frame}`,
    `- Motor: ${input.motor}`,
    `- ESC: ${input.esc}`,
    `- Battery: ${input.battery}`,
    `- FC: ${input.fc}`,
    `- VTX / Camera: ${input.vtx}`,
    '',
    '### Risk Assessment',
    `- ${kvRisk}`,
    `- ${escRisk}`,
    '- Verify stack mounting pattern, UART availability, camera/VTX connector compatibility, and prop clearance before buying parts.',
    '',
    '### Recommended Next Step',
    '- Route this build through the Dify Part Matcher / Build Wizard workflow once production credentials are enabled for deeper RAG-backed recommendations.',
  ].join('\n');
}

function buildDifyPrompt(input: HardwarePayload, guardrail: string): string {
  return [
    'You are the FPVLovers hardware compatibility advisor inside Dify.',
    'Analyze this FPV component list for voltage, KV, ESC current margin, mounting, prop clearance, and video/control-link compatibility.',
    'Return concise Markdown with headings: Compatibility Matrix, Detailed Reasoning, Risk Assessment, Recommended Upgrades.',
    '',
    `Frame: ${input.frame}`,
    `Motor: ${input.motor}`,
    `ESC: ${input.esc}`,
    `Battery: ${input.battery}`,
    `Flight controller: ${input.fc}`,
    `VTX / Camera: ${input.vtx}`,
    '',
    `Local guardrail:\n${guardrail}`,
  ].join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const input = parsePayload(await req.json().catch(() => ({})));
    const localMarkdown = localHardwareMarkdown(input);
    const app = findApp('Part Matcher') ?? findApp('Build Wizard');

    if (!app?.token) {
      return NextResponse.json({
        success: true,
        source: 'local',
        markdown: localMarkdown,
        warning: 'Dify hardware app token is not configured; returned deterministic local compatibility check.',
      });
    }

    const response = await difyRequest('/chat-messages', {
      method: 'POST',
      apiKey: app.token,
      taskType: 'rag_query',
      timeout: TOOL_DIFY_TIMEOUT_MS,
      body: {
        inputs: {},
        query: buildDifyPrompt(input, localMarkdown),
        response_mode: 'blocking',
        user: 'fpvlovers-hardware-analyzer',
      },
    });

    const markdown = extractDifyMarkdown(response.data);
    if (!response.ok || !markdown) {
      return NextResponse.json({
        success: true,
        source: 'local',
        markdown: localMarkdown,
        warning: response.dryRun
          ? 'Dify dry-run is active locally; returned deterministic local compatibility check.'
          : 'Dify hardware analysis did not return usable Markdown; returned deterministic local compatibility check.',
      });
    }

    return NextResponse.json({
      success: true,
      source: 'dify',
      markdown,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Hardware analysis failed.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
