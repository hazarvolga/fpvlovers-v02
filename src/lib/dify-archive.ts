import { getPageData } from '@/lib/dify-datasets';

export async function getArchivePage(pageSlug: string, fallbackSummary: string, fallbackTitle: string) {
  try {
    const data = await getPageData(pageSlug);
    if (data.items.length > 0 || data.summary !== "Dataset connection pending.") {
      return {
        summary: data.summary || fallbackSummary,
        items: data.items.length > 0 ? data.items : [
          { title: fallbackTitle, description: "Content loading from knowledge base.", url: "#" }
        ],
        isLive: data.items.length > 0,
      };
    }
  } catch {}
  return { summary: fallbackSummary, items: [], isLive: false };
}
