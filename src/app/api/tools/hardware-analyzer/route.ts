import { NextRequest, NextResponse } from 'next/server';
import { difyRequest } from '@/lib/dify-client';
import { extractDifyMarkdown } from '@/lib/dify-response';
import { findApp } from '@/lib/master-routing-tables';
import { analyzeBuildCompatibility } from '@/lib/tools/component-compatibility';
import { getFpvProductCatalog } from '@/lib/tools/fpv-product-catalog';
import type { BuildSelection, BuildSlot, FpvCatalogProduct, FpvProductType } from '@/lib/tools/fpv-product-types';

const TOOL_DIFY_TIMEOUT_MS = 15000;

type HardwarePayload = {
  frame: string;
  motor: string;
  esc: string;
  battery: string;
  fc: string;
  vtx: string;
};

type MatchedHardware = Partial<Record<BuildSlot, FpvCatalogProduct>>;

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

function matchCatalogProduct(query: string, types: FpvProductType[], catalog: FpvCatalogProduct[]): FpvCatalogProduct | undefined {
  const normalizedQuery = query.toLowerCase();
  if (!normalizedQuery || normalizedQuery.startsWith('unknown ')) return undefined;

  return catalog
    .filter((product) => types.includes(product.type))
    .map((product) => {
      const haystack = [
        product.name,
        product.brand,
        product.type,
        product.category,
        ...product.keywords,
        ...product.tags,
      ].join(' ').toLowerCase();
      const nameHit = normalizedQuery.includes(product.name.toLowerCase()) || product.name.toLowerCase().includes(normalizedQuery);
      const keywordHits = normalizedQuery
        .split(/[^a-z0-9]+/i)
        .filter((token) => token.length >= 3)
        .filter((token) => haystack.includes(token))
        .length;
      return { product, score: (nameHit ? 10 : 0) + keywordHits + product.trustScore / 100 };
    })
    .filter((candidate) => candidate.score >= 2)
    .sort((left, right) => right.score - left.score)[0]?.product;
}

function matchHardware(input: HardwarePayload, catalog: FpvCatalogProduct[]): MatchedHardware {
  const frame = matchCatalogProduct(input.frame, ['frame', 'kit'], catalog);
  const motor = matchCatalogProduct(input.motor, ['motor'], catalog);
  const stackFromEsc = matchCatalogProduct(input.esc, ['stack'], catalog);
  const stackFromFc = matchCatalogProduct(input.fc, ['stack'], catalog);
  const battery = matchCatalogProduct(input.battery, ['battery'], catalog);
  const video = matchCatalogProduct(input.vtx, ['video', 'vtx', 'camera'], catalog);

  return {
    ...(frame ? { frame } : {}),
    ...(motor ? { motor } : {}),
    ...(stackFromEsc || stackFromFc ? { stack: stackFromEsc || stackFromFc } : {}),
    ...(battery ? { battery } : {}),
    ...(video ? { video } : {}),
  };
}

function selectionFromMatches(matches: MatchedHardware): BuildSelection {
  return {
    style: 'freestyle',
    ...(matches.frame ? { frame: matches.frame.id } : {}),
    ...(matches.motor ? { motor: matches.motor.id } : {}),
    ...(matches.stack ? { stack: matches.stack.id } : {}),
    ...(matches.battery ? { battery: matches.battery.id } : {}),
    ...(matches.video ? { video: matches.video.id } : {}),
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
    '- Route this build through the guided compatibility workflow once production credentials are enabled for deeper source-backed recommendations.',
  ].join('\n');
}

function catalogHardwareMarkdown(input: HardwarePayload, matches: MatchedHardware, catalog: FpvCatalogProduct[]): string {
  const baseMarkdown = localHardwareMarkdown(input);
  const matchedEntries = Object.entries(matches)
    .filter((entry): entry is [BuildSlot, FpvCatalogProduct] => Boolean(entry[1]))
    .map(([slot, product]) => `- ${slot}: ${product.name} (${product.brand}, ${product.provenance?.source || 'catalog'})`);

  if (matchedEntries.length < 2) {
    return [
      baseMarkdown,
      '',
      '### Catalog Match',
      matchedEntries.length
        ? matchedEntries.join('\n')
        : '- No confident catalog matches. The local check used text-pattern guardrails only.',
      '- Use exact product names from the FPVLovers catalog for deeper compatibility scoring.',
    ].join('\n');
  }

  const compatibility = analyzeBuildCompatibility(selectionFromMatches(matches), catalog);
  return [
    baseMarkdown,
    '',
    '### Catalog Match',
    ...matchedEntries,
    '',
    '### Catalog Compatibility Score',
    `- Verdict: ${compatibility.verdict}`,
    `- Score: ${compatibility.score}/100`,
    `- Summary: ${compatibility.summary}`,
    ...compatibility.checks.map((check) => `- ${check.status.toUpperCase()} ${check.label}: ${check.detail}`),
  ].join('\n');
}

function buildDifyPrompt(input: HardwarePayload, guardrail: string): string {
  return [
    'You are the FPVLovers hardware compatibility advisor.',
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

import { rateLimit } from '@/lib/server/rate-limit';

export async function POST(req: NextRequest) {
  // Enforce rate limiting: 5 requests per minute
  const limitRes = rateLimit(req, 5, 60 * 1000, 'hardware-analyzer');
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
    const input = parsePayload(await req.json().catch(() => ({})));
    const catalog = getFpvProductCatalog();
    const matches = matchHardware(input, catalog);
    const localMarkdown = catalogHardwareMarkdown(input, matches, catalog);
    const app = findApp('Part Matcher') ?? findApp('Build Wizard');

    if (!app?.token) {
      return NextResponse.json({
        success: true,
        source: 'local',
        markdown: localMarkdown,
        matchedProducts: Object.fromEntries(
          Object.entries(matches).map(([slot, product]) => [slot, {
            id: product?.id,
            name: product?.name,
            brand: product?.brand,
            source: product?.provenance?.source,
          }]),
        ),
        warning: 'Hardware review gateway is not configured; returned deterministic local compatibility check.',
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
        matchedProducts: Object.fromEntries(
          Object.entries(matches).map(([slot, product]) => [slot, {
            id: product?.id,
            name: product?.name,
            brand: product?.brand,
            source: product?.provenance?.source,
          }]),
        ),
        warning: response.dryRun
          ? 'Dry-run is active locally; returned deterministic local compatibility check.'
          : 'Hardware review gateway did not return usable Markdown; returned deterministic local compatibility check.',
      });
    }

    return NextResponse.json({
      success: true,
      source: 'dify',
      markdown,
      matchedProducts: Object.fromEntries(
        Object.entries(matches).map(([slot, product]) => [slot, {
          id: product?.id,
          name: product?.name,
          brand: product?.brand,
          source: product?.provenance?.source,
        }]),
      ),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Hardware analysis failed.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
