export type DifyResponse = {
  id: string;
  category: 'Drone Parts' | 'AI Software' | 'Flight Guides';
  title: string;
  summary: string;
  technicalSpecs: Record<string, string>;
  affiliateLink: string;
  price: string;
  imageUrl?: string;
};

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
    affiliateLink: 'https://amazon.com/fpv-frame',
    price: '$79.99',
    imageUrl: 'https://picsum.photos/seed/droneframe/800/600',
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
    affiliateLink: 'https://github.com/neuroflight',
    price: '$15/mo',
    imageUrl: 'https://picsum.photos/seed/aisoftware/800/600',
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
    affiliateLink: 'https://udemy.com/fpv-masterclass',
    price: 'Free',
    imageUrl: 'https://picsum.photos/seed/fpvflip/800/600',
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
    affiliateLink: 'https://amazon.com/dji-o3',
    price: '$229.00',
    imageUrl: 'https://picsum.photos/seed/djio3/800/600',
  }
];

export async function fetchDifyInsights(): Promise<DifyResponse[]> {
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

    const { data: datasets } = await resp.json() as { data: any[] };
    const fpvDatasets = (datasets || []).filter((d: any) => d.name?.startsWith("fpv-"));
    const insights: DifyResponse[] = [];

    for (const ds of fpvDatasets.slice(0, 4)) {
      const docsResp = await fetch(`${baseUrl}/datasets/${ds.id}/documents?limit=3&keyword=`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!docsResp.ok) continue;

      const { data: docs } = await docsResp.json() as { data: any[] };
      if (!docs?.length) continue;

      for (const doc of docs.slice(0, 2)) {
        if (insights.length >= 5) break;

        const meta = doc.doc_metadata || {};
        const sourceUrl = meta.source_url || "";
        let title = sourceUrl;
        try { title = new URL(sourceUrl).hostname.replace("www.", ""); } catch {}

        let summary = `From ${ds.name} dataset. ${doc.tokens || 0} tokens.`;
        let specs: Record<string, string> = {
          "Dataset": ds.name?.replace("fpv-", "") || "FPV",
          "Tokens": String(doc.tokens || 0),
        };
        if (sourceUrl) specs["Source"] = sourceUrl;

        try {
          const detailResp = await fetch(`${baseUrl}/datasets/${ds.id}/documents/${doc.id}`, {
            headers: { Authorization: `Bearer ${apiKey}` },
            signal: AbortSignal.timeout(8000),
          });
          if (detailResp.ok) {
            const detail = await detailResp.json() as any;
            const text = detail.segments?.map((s: any) => s.content).join(" ") || "";
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

        const cat = ds.name?.includes("tuning") || ds.name?.includes("pid") ? "Flight Guides"
          : ds.name?.includes("specs") || ds.name?.includes("build") ? "Drone Parts"
          : ds.name?.includes("news") || ds.name?.includes("review") ? "AI Software"
          : "Flight Guides";

        insights.push({
          id: doc.id,
          category: cat as DifyResponse["category"],
          title: title || ds.name || "FPV Entry",
          summary: summary || `Indexed from ${sourceUrl || ds.name}`,
          technicalSpecs: specs,
          affiliateLink: sourceUrl || "#",
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
import { getOptionalEnv } from '@/lib/env';
