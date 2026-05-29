import { difyRequest } from '@/lib/dify-client';
import { findApp } from '@/lib/master-routing-tables';

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

function parseDifyAnalysis(markdownOrJson: string): FlightAnalysis | undefined {
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
    };
  } catch {
    return undefined;
  }
}

function buildFallback(meta: UploadedVideoMeta, warning: string): FlightAnalysis {
  return {
    scores: { flow: 72, speed: 70, proximity: 68, acro: 66, stability: 74 },
    verdict: 'B-Rookie Hunter',
    summary: `Upload received: ${meta.name}. Frame-level video analysis is not connected locally; this is a conservative training rubric until the video workflow is enabled.`,
    telemetrySimulation: [
      { timestamp: '00:00', event: 'DVR upload accepted', riskScore: 'Info' },
      { timestamp: '00:10', event: 'Manual review recommended for gaps, throttle flow, and propwash', riskScore: 'Medium' },
    ],
    source: 'local',
    warning,
  };
}

function buildDifyPrompt(meta: UploadedVideoMeta): string {
  return [
    'You are the FPVLovers Flight Critic.',
    'Important: the Next.js app is not sending video frames in this request. Do not claim you inspected exact frames.',
    'Use FPV training knowledge to return a conservative coaching rubric based on upload metadata and common freestyle/racing review criteria.',
    'Return raw JSON only, matching this exact shape:',
    '{"scores":{"flow":number,"speed":number,"proximity":number,"acro":number,"stability":number},"verdict":"S1-Elite Pilot|A-Proximity God|B-Rookie Hunter|C-Trainee","summary":"two honest sentences","telemetrySimulation":[{"timestamp":"00:05","event":"string","riskScore":"Low|Medium|High|Extreme"}]}',
    '',
    `Video file: ${meta.name}`,
    `MIME type: ${meta.type}`,
    `Size: ${meta.sizeMb.toFixed(2)} MB`,
  ].join('\n');
}

export async function POST(req: Request) {
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

    const app = findApp('FPV Expert Assistant');
    if (!app?.token) {
      return Response.json(buildFallback(meta, 'Flight review gateway is not configured.'));
    }

    const response = await difyRequest('/chat-messages', {
      method: 'POST',
      apiKey: app.token,
      taskType: 'rag_query',
      timeout: 45000,
      body: {
        inputs: {},
        query: buildDifyPrompt(meta),
        response_mode: 'blocking',
        user: 'fpvlovers-flight-critic',
      },
    });

    const answer = extractDifyAnswer(response.data);
    const analysis = answer ? parseDifyAnalysis(answer) : undefined;

    if (!response.ok || !analysis) {
      return Response.json(buildFallback(
        meta,
        response.dryRun
          ? 'Dry-run is active locally; returned deterministic training rubric.'
          : 'Flight review gateway did not return usable JSON; returned deterministic training rubric.',
      ));
    }

    return Response.json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to analyze video.';
    return Response.json({ error: message }, { status: 500 });
  }
}
