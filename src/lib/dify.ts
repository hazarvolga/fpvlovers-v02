import { getOptionalEnv } from '@/lib/env';

export type DifyResponse = {
  id: string;
  category: 'Drone Parts' | 'AI Software' | 'Flight Guides';
  title: string;
  summary: string;
  technicalSpecs: Record<string, string>;
  affiliateLink?: string;
  commerceVerified?: boolean;
  price?: string;
  sourceUrl?: string;
  imageUrl?: string;
};

type RecordLike = Record<string, unknown>;

function asRecord(value: unknown): RecordLike | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as RecordLike : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asRecordArray(value: unknown): RecordLike[] {
  return Array.isArray(value)
    ? value.map(asRecord).filter((entry): entry is RecordLike => Boolean(entry))
    : [];
}

// Simulated mock data for fallback
const mockData: DifyResponse[] = [
  {
    id: 'fpv-1',
    category: 'Drone Parts',
    title: 'Lumenier QAV-S JohnnyFPV Special Edition 5" FPV Freestyle Drone Frame',
    summary: 'The JohnnyFPV QAV-S is a custom 5-inch freestyle airframe designed with isolation and high-performance cinematic flying in mind. Perfect for smooth HD captures.',
    technicalSpecs: {
      'Wheelbase': '225mm',
      'Weight': '125g (with hardware)',
      'Material': 'Premium 3K Carbon Fiber',
    },
    price: 'Reference',
    imageUrl: '/api/content/media/cover/drone-frame-reference',
  },
  {
    id: 'ai-2',
    category: 'AI Software',
    title: 'NeuroFlight AI PID Autotuner Pro',
    summary: 'Leverage reinforcement learning to automatically tune your drone\'s PID logic mid-flight. Achieve perfectly locked-in rates and eliminate propwash with zero manual tuning.',
    technicalSpecs: {
      'Latency': '< 2ms',
      'Compatibility': 'Betaflight 4.4+, INAV',
      'Engine': 'TensorFlow Lite Edge',
    },
    price: 'Reference',
    imageUrl: '/api/content/media/cover/ai-pid-autotuner',
  },
  {
    id: 'guide-3',
    category: 'Flight Guides',
    title: 'Mastering the Matty Flip with AI Simulation',
    summary: 'Step-by-step telemetry breakdown of the iconic Matty Flip. We processed 10,000 successful flips using our Dify AI dataset to highlight stick-cam timings and throttle management.',
    technicalSpecs: {
      'Difficulty': 'Expert',
      'Prerequisites': 'Power loops, Split-S',
      'Type': 'Cinematic Freestyle',
    },
    price: 'Free',
    imageUrl: '/api/content/media/cover/matty-flip-guide',
  },
  {
    id: 'fpv-4',
    category: 'Drone Parts',
    title: 'DJI O3 Air Unit - Digital FPV System',
    summary: 'Next-gen long-distance digital video transmission. Features 1080p/100fps H.265 transmission, 30ms ultra-low latency, and up to 10km range. The absolute standard for cinematic FPV.',
    technicalSpecs: {
      'Range': 'up to 10km',
      'Latency': '30ms',
      'Recording': '4K/120fps built-in',
    },
    price: 'Reference',
    imageUrl: '/api/content/media/cover/dji-o3-air-unit',
  }
];

export async function fetchEditorialInsights(): Promise<DifyResponse[]> {
  const apiKey = process.env.DIFY_API_KEY;
  const baseUrl = getOptionalEnv('DIFY_BASE_URL', 'https://dify.affexai.tr/v1');

  if (!apiKey) {
    console.warn("DIFY_API_KEY not set. Using mock data.");
    return mockData;
  }

  try {
    const resp = await fetch(`${baseUrl}/datasets`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      console.warn("Dify API returned:", resp.status);
      return mockData;
    }

    const datasetsPayload = asRecord(await resp.json());
    const fpvDatasets = asRecordArray(datasetsPayload?.data)
      .filter((dataset) => asString(dataset.name)?.startsWith('fpv-'));
    const insights: DifyResponse[] = [];

    for (const ds of fpvDatasets.slice(0, 4)) {
      const datasetId = asString(ds.id);
      if (!datasetId) continue;
      const docsResp = await fetch(`${baseUrl}/datasets/${datasetId}/documents?limit=3&keyword=`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!docsResp.ok) continue;

      const docsPayload = asRecord(await docsResp.json());
      const docs = asRecordArray(docsPayload?.data);
      if (!docs?.length) continue;

      for (const doc of docs.slice(0, 2)) {
        if (insights.length >= 5) break;

        const meta = asRecord(doc.doc_metadata) || {};
        const sourceUrl = asString(meta.source_url) || "";
        let title = sourceUrl;
        try { title = new URL(sourceUrl).hostname.replace("www.", ""); } catch {}

        const datasetName = asString(ds.name) || 'fpv';
        const tokenCount = asNumber(doc.tokens) || 0;
        let summary = `From ${datasetName} dataset. ${tokenCount} tokens.`;
        let specs: Record<string, string> = {
          "Dataset": datasetName.replace("fpv-", "") || "FPV",
          "Tokens": String(tokenCount),
        };
        if (sourceUrl) specs["Source"] = sourceUrl;

        try {
          const docId = asString(doc.id);
          if (!docId) continue;
          const detailResp = await fetch(`${baseUrl}/datasets/${datasetId}/documents/${docId}`, {
            headers: { Authorization: `Bearer ${apiKey}` },
            signal: AbortSignal.timeout(8000),
          });
          if (detailResp.ok) {
            const detail = asRecord(await detailResp.json());
            const segments = asRecordArray(detail?.segments);
            const text = segments.map((segment) => asString(segment.content) || '').join(" ");
            if (text) {
              summary = text
                .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
                .replace(/^#{1,4}\s+/gm, "")
                .replace(/Skip to (main )?content/gi, "")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 350);
              specs["Chars"] = String(text.length);
            }
          }
        } catch {}

        const cat = datasetName.includes("tuning") || datasetName.includes("pid") ? "Flight Guides"
          : datasetName.includes("specs") || datasetName.includes("build") ? "Drone Parts"
          : datasetName.includes("news") || datasetName.includes("review") ? "AI Software"
          : "Flight Guides";
        const docId = asString(doc.id);
        if (!docId) continue;

        insights.push({
          id: docId,
          category: cat as DifyResponse["category"],
          title: title || datasetName || "FPV Entry",
          summary: summary || `Indexed from ${sourceUrl || datasetName}`,
          technicalSpecs: specs,
          sourceUrl,
          commerceVerified: false,
          price: "Free",
          imageUrl: undefined,
        });
      }
    }

    if (insights.length > 0) {
      console.log(`\u2705 Live Dify data: ${insights.length} insights`);
      return insights;
    }
  } catch (err) {
    console.warn("Dify fetch error:", (err as Error).message);
  }

  console.warn("\u26a0\ufe0f  No live Dify data, falling back to mock data");
  return mockData;
}

export async function fetchDifyStats() {
    // Mock admin dashboard stats
    return {
        totalQueries: 14203,
        popularCategory: 'Drone Parts',
        activeAffiliates: 48,
        monthlyRevenue: '$4,120.00',
        syncStatus: 'Optimal',
        lastSync: new Date().toISOString()
    };
}
