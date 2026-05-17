import { getOptionalEnv, getRequiredEnv } from "@/lib/env";

const DIFY_BASE = getOptionalEnv("DIFY_BASE_URL", "https://dify.affexai.tr/v1");
const API_KEY = getRequiredEnv("DIFY_API_KEY");

const DATASETS = {
  components: "38bb7d60-b921-440c-b8f4-e49f9982a61f",
  flightTuning: "d1d5e44b-4dde-445a-a686-67a1cc0d926c",
  newsReviews: "6a8a84c8-46ca-43f0-a3ea-3c19f32f5a17",
  community: "639af5aa-d424-4d0b-9633-a7ab541afcb2",
  buildGuides: "a733583a-5e50-4e00-8b50-759380da59db",
  troubleshooting: "9b380b45-1be1-4ba6-b685-72e279e09ccc",
  pidProfiles: "3eacd19f-ccd8-49ec-8482-51120918f0e0",
  racingEvents: "cd17b1ea-a852-4d31-87d7-1b4c0bd46e7f",
};

const headers = { Authorization: `Bearer ${API_KEY}` };

async function fetchDocs(datasetId: string): Promise<any[]> {
  try {
    const resp = await fetch(`${DIFY_BASE}/datasets/${datasetId}/documents?limit=20`, { headers, signal: AbortSignal.timeout(10000) });
    if (!resp.ok) return [];
    const { data } = await resp.json() as { data: any[] };
    return data || [];
  } catch {
    return [];
  }
}

async function fetchSegments(datasetId: string, docId: string, limit = 1): Promise<string> {
  try {
    const resp = await fetch(`${DIFY_BASE}/datasets/${datasetId}/documents/${docId}/segments?limit=${limit}`, { headers, signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return "";
    const { data } = await resp.json() as { data: any[] };
    return data?.map((s: any) => s.content).join(" ").slice(0, 500) || "";
  } catch {
    return "";
  }
}

function cleanSegment(text: string): string {
  const cleaned = text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/^#{1,4}\s+/gm, "")
    .replace(/Skip to (main )?content/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
  return cleaned || text.slice(0, 200);
}

export type HardwareItem = {
  title: string;
  description: string;
  price: string;
  url: string;
  image: string;
  tag: string;
  tokens?: number;
};

export async function getHardwareData(): Promise<{ summary: string; hardware: HardwareItem[] }> {
  const docs = await fetchDocs(DATASETS.components);
  const completed = docs.filter((d: any) => d.indexing_status === "completed");
  const items: HardwareItem[] = [];

  for (const doc of completed.slice(0, 8)) {
    const meta = doc.doc_metadata || {};
    const sourceUrl = meta.source_url || "";
    let title = doc.name?.slice(0, 20) || "FPV Component";
    try { title = new URL(sourceUrl).hostname.replace("www.", ""); } catch {}
    const segment = await fetchSegments(DATASETS.components, doc.id);
    items.push({
      title,
      description: cleanSegment(segment) || `${doc.tokens || 0} tokens from ${sourceUrl}`,
      price: "Free",
      url: sourceUrl || "#",
      image: "https://picsum.photos/seed/" + doc.id + "/800/600",
      tag: meta.tag || "Dify RAG",
      tokens: doc.tokens || 0,
    });
  }

  if (items.length === 0) {
    return {
      summary: `FPV RAG active. fpv-components-specs: ${docs.length} docs (${completed.length} ready).`,
      hardware: [{ title: "Dify Dataset", description: `${docs.length} documents loaded.`, price: "Free", url: "#", image: "https://picsum.photos/seed/fpv-parts/800/600", tag: "DATASET" }],
    };
  }

  return {
    summary: `${completed.length} components from knowledge base. Browse below.`,
    hardware: items,
  };
}

export async function getFirmwareData(): Promise<{ summary: string; cliCommands: { title: string; content: string; tag: string; tokens: number }[] }> {
  const docs = await fetchDocs(DATASETS.flightTuning);
  const completed = docs.filter((d: any) => d.indexing_status === "completed");
  const items: { title: string; content: string; tag: string; tokens: number }[] = [];

  for (const doc of completed.slice(0, 6)) {
    const sourceUrl = doc.doc_metadata?.source_url || "";
    let title = "Flight Tuning Doc";
    try { title = new URL(sourceUrl).hostname; } catch {}
    const seg = await fetchSegments(DATASETS.flightTuning, doc.id);
    const cleaned = cleanSegment(seg);
    if (cleaned.length > 40) {
      items.push({ title, content: cleaned, tag: sourceUrl, tokens: doc.tokens || 0 });
    }
  }

  if (items.length === 0) {
    return {
      summary: `Flight tuning dataset: ${docs.length} docs (${completed.length} completed).`,
      cliCommands: [{ title: "Betaflight / INAV Docs", content: "Tuning documents loaded from knowledge base.", tag: "Dify", tokens: 0 }],
    };
  }

  return {
    summary: `${completed.length} tuning documents from knowledge base.`,
    cliCommands: items,
  };
}

export type PageContent = {
  summary: string;
  items: { title: string; description: string; url: string }[];
};

const PAGE_DATASETS: Record<string, string> = {
  freestyle: DATASETS.components,
  cinematic: DATASETS.components,
  racing: DATASETS.racingEvents,
  micro: DATASETS.components,
  'long-range': DATASETS.components,
  performance: DATASETS.components,
  'starter-kits': DATASETS.components,
  simulators: DATASETS.racingEvents,
  glossary: DATASETS.flightTuning,
  workshop: DATASETS.buildGuides,
  airspace: '229be183-217b-4f93-ba48-9cdabbd1e37f', // fpv-regulations
  battery: '229be183-217b-4f93-ba48-9cdabbd1e37f',   // fpv-regulations
  'pilot-pulse': DATASETS.newsReviews,
};

export async function getPageData(pageSlug: string): Promise<PageContent> {
  const dsId = PAGE_DATASETS[pageSlug];
  if (!dsId) return { summary: "Knowledge base loading...", items: [] };

  try {
    const docs = await fetchDocs(dsId);
    const completed = docs.filter((d: any) => d.indexing_status === 'completed');

    if (completed.length === 0) {
      return {
        summary: `${docs.length} documents indexing in knowledge base. Ready soon.`,
        items: docs.slice(0, 3).map((d: any) => ({
          title: (d.doc_metadata?.source_url || d.name || 'FPV Entry').slice(0, 60),
          description: `${d.tokens || 0} tokens from ${d.doc_metadata?.source_url || 'Dify'}`,
          url: d.doc_metadata?.source_url || '#',
        })),
      };
    }

    const items = [];
    for (const doc of completed.slice(0, 6)) {
      const sourceUrl = doc.doc_metadata?.source_url || '';
      let title = sourceUrl;
      try { title = new URL(sourceUrl).hostname.replace('www.', ''); } catch {}
      const seg = await fetchSegments(dsId, doc.id);
      const cleaned = cleanSegment(seg);
      items.push({
        title: title || doc.name?.slice(0, 32),
        description: cleaned.slice(0, 250) || `${doc.tokens || 0} tokens`,
        url: sourceUrl || '#',
      });
    }

    return {
      summary: `${completed.length} knowledge entries from dataset.`,
      items: items.filter(i => i.description.length > 20),
    };
  } catch {
    return { summary: "Dataset connection pending.", items: [] };
  }
}
