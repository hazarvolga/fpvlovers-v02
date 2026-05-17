import { NextRequest, NextResponse } from 'next/server';
import { getOptionalEnv, getRequiredEnv } from '@/lib/env';

const CRAWLERS = [
  process.env.CRAWL4AI_PRIMARY_CRAWL_URL || 'http://crawler-proxy:3002/crawl',
  process.env.CRAWL4AI_BACKUP_CRAWL_URL || 'http://141.148.206.187/c4ai/crawl',
];
const DIFY_BASE = getOptionalEnv('DIFY_BASE_URL', 'https://dify.affexai.tr/v1');

const DOMAIN_MAP: Record<string, string> = {
  'betaflight.com': 'fpv-flight-tuning', 'edgetx.org': 'fpv-flight-tuning', 'ardupilot.org': 'fpv-flight-tuning',
  'expresslrs.org': 'fpv-flight-tuning', 'px4.io': 'fpv-flight-tuning', 'fpv.wtf': 'fpv-flight-tuning',
  'oscarliang.com': 'fpv-news-reviews', 'droneblog.com': 'fpv-news-reviews', 'propwashed.com': 'fpv-news-reviews',
  'geprc.com': 'fpv-components-specs', 'speedybee.com': 'fpv-components-specs', 'dji.com': 'fpv-components-specs',
  'tmotor.com': 'fpv-components-specs', 'hglrc.com': 'fpv-components-specs', 'foxeer.com': 'fpv-components-specs',
  'runcam.com': 'fpv-components-specs', 'betafpv.com': 'fpv-components-specs', 'radiomasterrc.com': 'fpv-components-specs',
  'multigp.org': 'fpv-racing-events', 'droneraceleague.com': 'fpv-racing-events', 'fpvracing.tv': 'fpv-racing-events',
  'intofpv.com': 'fpv-community-knowledge', 'reddit.com': 'fpv-community-knowledge', 'rcgroups.com': 'fpv-community-knowledge',
  'shgm.gov.tr': 'fpv-regulations', 'easa.europa.eu': 'fpv-regulations', 'dronerules.eu': 'fpv-regulations',
  'uavcoach.com': 'fpv-regulations', 'droneregulations.info': 'fpv-regulations',
};

const DATASET_IDS: Record<string, string> = {
  'fpv-flight-tuning': 'd1d5e44b-4dde-445a-a686-67a1cc0d926c',
  'fpv-news-reviews': '6a8a84c8-46ca-43f0-a3ea-3c19f32f5a17',
  'fpv-components-specs': '38bb7d60-b921-440c-b8f4-e49f9982a61f',
  'fpv-community-knowledge': '639af5aa-d424-4d0b-9633-a7ab541afcb2',
  'fpv-racing-events': 'cd17b1ea-a852-4d31-87d7-1b4c0bd46e7f',
  'fpv-build-guides': 'a733583a-5e50-4e00-8b50-759380da59db',
  'fpv-troubleshooting': '9b380b45-1be1-4ba6-b685-72e279e09ccc',
  'fpv-pid-profiles': '3eacd19f-ccd8-49ec-8482-51120918f0e0',
  'fpv-regulations': '229be183-217b-4f93-ba48-9cdabbd1e37f',
};

function routeUrl(url: string): string {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    for (const [key, val] of Object.entries(DOMAIN_MAP)) {
      if (domain.includes(key)) return val;
    }
  } catch {}
  return 'fpv-community-knowledge';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const urls: string[] = body.urls || [];
    const forceDataset: string = body.dataset || '';

    if (!urls.length) return NextResponse.json({ error: 'No URLs provided' }, { status: 400 });

    const results: { url: string; status: string; dataset: string; docId?: string; size?: number; error?: string }[] = [];
    const apiKey = getRequiredEnv('DIFY_API_KEY');
    const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' as const };

    for (const url of urls.slice(0, 10)) {
      try {
        // Crawl
        let crawlData: any = null;
        for (const ep of CRAWLERS) {
          try {
            const cr = await fetch(ep, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ urls: [url], priority: 10, markdown: true }),
              signal: AbortSignal.timeout(40000),
            });
            if (cr.ok) { crawlData = await cr.json(); break; }
          } catch {}
        }

        if (!crawlData?.success || !crawlData.results?.length) {
          results.push({ url, status: 'crawl_failed', dataset: '', error: 'Crawl failed or empty' });
          continue;
        }

        const r = crawlData.results[0];
        const md = r.markdown?.raw_markdown || r.markdown || '';
        if (typeof md !== 'string' || md.length < 200) {
          results.push({ url, status: 'too_short', dataset: '', size: md.length, error: `Content too short (${md.length} chars)` });
          continue;
        }

        // Route
        const datasetName = forceDataset || routeUrl(url);
        const dsId = DATASET_IDS[datasetName];
        if (!dsId) {
          results.push({ url, status: 'no_dataset', dataset: datasetName, error: 'Unknown dataset' });
          continue;
        }

        // Upsert
        const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(url));
        const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');

        const upsertResp = await fetch(`${DIFY_BASE}/datasets/${dsId}/document/create-by-text`, {
          method: 'POST', headers,
          body: JSON.stringify({
            name: hashHex.slice(0, 32),
            text: (md as string).slice(0, 8000),
            doc_metadata: { source_url: url, url_hash: hashHex },
            indexing_technique: 'high_quality',
            process_rule: { mode: 'automatic' },
          }),
          signal: AbortSignal.timeout(30000),
        });

        if (upsertResp.ok) {
          const doc = await upsertResp.json();
          results.push({ url, status: 'success', dataset: datasetName, docId: doc.document?.id?.slice(0, 16), size: (md as string).length });
        } else {
          results.push({ url, status: 'upsert_failed', dataset: datasetName, error: `HTTP ${upsertResp.status}` });
        }
      } catch (err: any) {
        results.push({ url, status: 'error', dataset: '', error: err.message?.slice(0, 100) });
      }
    }

    return NextResponse.json({ results, total: urls.length, processed: results.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
