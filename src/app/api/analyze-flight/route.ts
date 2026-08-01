import { NextRequest, NextResponse } from 'next/server';
import { difyRequest } from '@/lib/dify-client';
import { findApp } from '@/lib/master-routing-tables';
import { rateLimit } from '@/lib/server/rate-limit';
import { getGroundingContext, type GroundingContext, type GroundingSource } from '@/lib/tools/retrieval-grounding';

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100MB — only metadata is read, but formData() still buffers the body.

type FlightAnalysis = {
  scores: {
    flow: number;
    speed: number;
    proximity: number;
    acro: number;
    stability: number;
  };
  verdict: 'S1-Elite Pilot' | 'A-Proximity God' | 'B-Rookie Hunter' | 'C-Trainee';
  summary: string;
  telemetrySimulation: Array<{
    timestamp: string;
    event: string;
    riskScore: string;
  }>;
  source?: 'dify' | 'local';
  warning?: string;
  sources?: GroundingSource[];
  retrievalConfidence?: number;
};

type UploadedVideoMeta = {
  name: string;
  type: string;
  sizeMb: number;
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function extractDifyAnswer(value: unknown): string | undefined {
  const data = asRecord(value);
  const nestedData = asRecord(data?.data);
  const outputs = asRecord(data?.outputs) ?? asRecord(nestedData?.outputs);

  return asString(data?.answer)
    ?? asString(nestedData?.answer)
    ?? asString(outputs?.answer)
    ?? asString(outputs?.result)
    ?? asString(outputs?.json);
}

function stripJsonFence(value: string): string {
  return value
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
}

function parseDifyAnalysis(markdownOrJson: string, grounding: GroundingContext): FlightAnalysis | undefined {
  try {
    const parsed = JSON.parse(stripJsonFence(markdownOrJson)) as unknown;
    const record = asRecord(parsed);
    const scores = asRecord(record?.scores);
    if (!record || !scores) return undefined;

    return {
      scores: {
        flow: Number(scores.flow) || 72,
        speed: Number(scores.speed) || 72,
        proximity: Number(scores.proximity) || 72,
        acro: Number(scores.acro) || 72,
        stability: Number(scores.stability) || 72,
      },
      verdict: asString(record.verdict) as FlightAnalysis['verdict'] || 'B-Rookie Hunter',
      summary: asString(record.summary) || 'The flight review gateway returned a review, but the summary was empty.',
      telemetrySimulation: Array.isArray(record.telemetrySimulation)
        ? record.telemetrySimulation.slice(0, 5).map((event) => {
          const item = asRecord(event) || {};
          return {
            timestamp: asString(item.timestamp) || '00:00',
            event: asString(item.event) || 'Flight segment review',
            riskScore: asString(item.riskScore) || 'Medium',
          };
        })
        : [{ timestamp: '00:00', event: 'Flight style review', riskScore: 'Medium' }],
      source: 'dify',
      sources: grounding.sources,
      retrievalConfidence: grounding.confidence,
    };
  } catch {
    return undefined;
  }
}

function buildFallback(meta: UploadedVideoMeta, warning: string, grounding: GroundingContext): FlightAnalysis {
  return {
    scores: { flow: 70, speed: 70, proximity: 70, acro: 70, stability: 70 },
    verdict: 'C-Trainee',
    summary: `Upload received: ${meta.name}. Frame-level video analysis is not connected locally; this is a conservative training rubric until the video workflow is enabled.`,
    telemetrySimulation: [
      { timestamp: '00:00', event: 'DVR upload accepted', riskScore: 'Info' },
      { timestamp: '00:10', event: 'Manual review recommended for gaps, throttle flow, and propwash', riskScore: 'Medium' },
    ],
    source: 'local',
    warning,
    sources: grounding.sources,
    retrievalConfidence: grounding.confidence,
  };
}

function groundingQuery(meta: UploadedVideoMeta): string {
  const fileTerms = meta.name.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ');
  return `FPV freestyle flying technique review: ${fileTerms}`;
}

function buildDifyPrompt(meta: UploadedVideoMeta, grounding: GroundingContext): string {
  return [
    'You are the FPVLovers Flight Critic.',
    'Important: the Next.js app is not sending video frames in this request. Do not claim you inspected exact frames.',
    'Use FPV training knowledge and the verified RAG context below to return a conservative coaching rubric based on upload metadata and common freestyle/racing review criteria.',
    'Return raw JSON only, matching this exact shape:',
    '{"scores":{"flow":number,"speed":number,"proximity":number,"acro":number,"stability":number},"verdict":"S1-Elite Pilot|A-Proximity God|B-Rookie Hunter|C-Trainee","summary":"two honest sentences","telemetrySimulation":[{"timestamp":"00:05","event":"string","riskScore":"Low|Medium|High|Extreme"}]}',
    '',
    `Video file: ${meta.name}`,
    `MIME type: ${meta.type}`,
    `Size: ${meta.sizeMb.toFixed(2)} MB`,
    '',
    `### Verified RAG Context (confidence: ${grounding.grade})\n${grounding.contextBlock}`,
  ].join('\n');
}

export async function POST(req: NextRequest) {
  const limitRes = rateLimit(req, 5, 60 * 1000, 'analyze-flight');
  if (!limitRes.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a minute.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limitRes.limit),
          'X-RateLimit-Remaining': String(limitRes.remaining),
          'X-RateLimit-Reset': String(limitRes.reset),
        },
      },
    );
  }

  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > MAX_UPLOAD_BYTES) {
    return Response.json({ error: 'Video is too large (100MB limit).' }, { status: 413 });
  }

  try {
    const formData = await req.formData();
    const video = formData.get('video');

    if (!(video instanceof File)) {
      return Response.json({ error: 'No video provided.' }, { status: 400 });
    }

    const meta: UploadedVideoMeta = {
      name: video.name || 'fpv-flight.mp4',
      type: video.type || 'video/unknown',
      sizeMb: video.size / 1024 / 1024,
    };

    const grounding = await getGroundingContext(groundingQuery(meta), 'default');

    const app = findApp('FPV Expert Assistant');
    if (!app?.token) {
      return Response.json(buildFallback(meta, 'Flight review gateway is not configured.', grounding));
    }

    const response = await difyRequest('/chat-messages', {
      method: 'POST',
      apiKey: app.token,
      taskType: 'rag_query',
      timeout: 45000,
      body: {
        inputs: {},
        query: buildDifyPrompt(meta, grounding),
        response_mode: 'blocking',
        user: 'fpvlovers-flight-critic',
      },
    });

    const answer = extractDifyAnswer(response.data);
    const analysis = answer ? parseDifyAnalysis(answer, grounding) : undefined;

    if (!response.ok || !analysis) {
      return Response.json(buildFallback(
        meta,
        response.dryRun
          ? 'Dry-run is active locally; returned deterministic training rubric.'
          : 'Flight review gateway did not return usable JSON; returned deterministic training rubric.',
        grounding,
      ));
    }

    return Response.json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to analyze video.';
    return Response.json({ error: message }, { status: 500 });
  }
}
