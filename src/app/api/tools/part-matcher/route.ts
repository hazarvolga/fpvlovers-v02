import { NextRequest, NextResponse } from 'next/server';
import { difyRequest } from '@/lib/dify-client';
import { extractDifyMarkdown } from '@/lib/dify-response';
import { findApp } from '@/lib/master-routing-tables';
import { analyzeBuildCompatibility } from '@/lib/tools/component-compatibility';
import { getFpvProductCatalog } from '@/lib/tools/fpv-product-catalog';
import type { BuildSelection, BuildSlot } from '@/lib/tools/fpv-product-types';

const BUILD_SLOTS: BuildSlot[] = ['frame', 'motor', 'prop', 'stack', 'battery', 'video', 'receiver'];
const BUILD_STYLES: BuildSelection['style'][] = ['freestyle', 'racing', 'cinematic', 'longRange', 'whoop'];
const TOOL_DIFY_TIMEOUT_MS = 15000;

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function parseSelection(value: unknown): BuildSelection {
  const record = asRecord(value) || {};
  const style = asString(record.style);
  const selection: BuildSelection = {
    style: style && BUILD_STYLES.includes(style as BuildSelection['style'])
      ? style as BuildSelection['style']
      : 'freestyle',
  };

  for (const slot of BUILD_SLOTS) {
    const productId = asString(record[slot]);
    if (productId) selection[slot] = productId;
  }

  return selection;
}

function buildLocalMarkdown(result: ReturnType<typeof analyzeBuildCompatibility>): string {
  const selected = Object.entries(result.selected)
    .filter((entry): entry is [BuildSlot, NonNullable<typeof result.selected[BuildSlot]>] => Boolean(entry[1]))
    .map(([slot, product]) => `- ${slot}: ${product.name} (${product.brand}, ${product.currency} ${product.price.toFixed(2)})`);

  return [
    '### Compatibility Verdict',
    `- Verdict: ${result.verdict}`,
    `- Score: ${result.score}/100`,
    `- Summary: ${result.summary}`,
    '',
    '### Selected Parts',
    ...(selected.length ? selected : ['- No complete build selected yet.']),
    '',
    '### Checks',
    ...result.checks.map((check) => `- ${check.status.toUpperCase()} ${check.label}: ${check.detail}`),
    result.calculator ? '' : '',
    result.calculator ? `### Calculator Snapshot\n- AUW: ${result.calculator.auw}g\n- Thrust ratio: ${result.calculator.estimatedThrustRatio}:1\n- Hover throttle: ${result.calculator.estimatedHoverThrottle}%\n- Flight time: ${result.calculator.estimatedFlightTimeMin}m` : '',
  ].filter(Boolean).join('\n');
}

function buildDifyPrompt(selection: BuildSelection, result: ReturnType<typeof analyzeBuildCompatibility>, localMarkdown: string): string {
  const selectedProducts = Object.entries(result.selected)
    .filter((entry): entry is [BuildSlot, NonNullable<typeof result.selected[BuildSlot]>] => Boolean(entry[1]))
    .map(([slot, product]) => ({
      slot,
      id: product.id,
      name: product.name,
      brand: product.brand,
      type: product.type,
      price: product.price,
      trustScore: product.trustScore,
      specs: product.specs,
      fit: product.fit,
    }));

  return [
    'You are the FPVLovers Part Matcher.',
    'Use the project RAG datasets for FPV component compatibility and buying guidance when available.',
    'Do not override deterministic checks unless you explain why. Be conservative about voltage, KV, ESC current, prop clearance, and mounting.',
    'Return concise Markdown with headings: Compatibility Verdict, Critical Risks, Recommended Changes, Buyer Checklist.',
    '',
    `Build style: ${selection.style}`,
    `Selected products JSON:\n${JSON.stringify(selectedProducts)}`,
    `Deterministic result JSON:\n${JSON.stringify({ score: result.score, verdict: result.verdict, checks: result.checks, calculator: result.calculator })}`,
    '',
    `Local guardrail:\n${localMarkdown}`,
  ].join('\n');
}

import { rateLimit } from '@/lib/server/rate-limit';

export async function POST(req: NextRequest) {
  // Enforce rate limiting: 5 requests per minute
  const limitRes = rateLimit(req, 5, 60 * 1000, 'part-matcher');
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
    const selection = parseSelection(await req.json().catch(() => ({})));
    const catalog = getFpvProductCatalog();
    const result = analyzeBuildCompatibility(selection, catalog);
    const localMarkdown = buildLocalMarkdown(result);
    const app = findApp('Part Matcher');

    if (!app?.token) {
      return NextResponse.json({
        success: true,
        source: 'local',
        result,
        markdown: localMarkdown,
        warning: 'Compatibility review gateway is not configured; returned deterministic compatibility review.',
      });
    }

    const response = await difyRequest('/chat-messages', {
      method: 'POST',
      apiKey: app.token,
      taskType: 'rag_query',
      timeout: TOOL_DIFY_TIMEOUT_MS,
      body: {
        inputs: {},
        query: buildDifyPrompt(selection, result, localMarkdown),
        response_mode: 'blocking',
        user: 'fpvlovers-part-matcher',
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
          ? 'Dry-run is active locally; returned deterministic compatibility review.'
          : 'Compatibility review gateway did not return usable Markdown; returned deterministic compatibility review.',
      });
    }

    return NextResponse.json({
      success: true,
      source: 'dify',
      result,
      markdown,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Part Matcher analysis failed.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
