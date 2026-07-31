import { NextRequest, NextResponse } from 'next/server';
import { getOptionalEnv, getRequiredEnv } from '@/lib/env';
import { requireAdmin } from '@/lib/server/admin-auth-guard';
import { persistRawCrawlContent } from '@/lib/server/raw-content-store';

const CRAWLERS = [
  getOptionalEnv('CRAWL4AI_PRIMARY_CRAWL_URL', 'http://crawler-proxy:3002/crawl'),
  getOptionalEnv('CRAWL4AI_BACKUP_CRAWL_URL', 'http://crawler-backup:3002/crawl'),
];
const DIFY_BASE = getOptionalEnv('DIFY_BASE_URL', 'https://dify.affexai.tr/v1');

const DOMAIN_MAP: Record<string, string> = {
  'betaflight.com': 'fpv-flight-tuning', 'edgetx.org': 'fpv-flight-tuning', 'manual.edgetx.org': 'fpv-flight-tuning', 'ardupilot.org': 'fpv-flight-tuning',
  'expresslrs.org': 'fpv-flight-tuning', 'px4.io': 'fpv-flight-tuning', 'docs.px4.io': 'fpv-flight-tuning', 'fpv.wtf': 'fpv-flight-tuning',
  'bird-sanctuary.github.io': 'fpv-flight-tuning', 'am32.ca': 'fpv-flight-tuning', 'am32-firmware': 'fpv-flight-tuning', 'emuflight.github.io': 'fpv-flight-tuning',
  'github.com/inavflight/inav': 'fpv-flight-tuning', 'github.com/am32-firmware/am32-wiki': 'fpv-flight-tuning', 'github.com/emuflight/emuflight': 'fpv-flight-tuning',
  'oscarliang.com': 'fpv-news-reviews', 'mepsking.shop': 'fpv-news-reviews', 'blog.georgi-yanev.com': 'fpv-build-guides', 'droneblog.com': 'fpv-news-reviews', 'propwashed.com': 'fpv-news-reviews',
  'geprc.com': 'fpv-components-specs', 'speedybee.com': 'fpv-components-specs', 'docs.hd-zero.com': 'fpv-components-specs', 'hd-zero.github.io': 'fpv-components-specs',
  'docs.holybro.com': 'fpv-components-specs', 'team-blacksheep.com': 'fpv-components-specs', 'manuals.plus': 'fpv-components-specs', 'firstquadcopter.com': 'fpv-components-specs',
  'dji.com': 'fpv-components-specs', 'tmotor.com': 'fpv-components-specs', 'hglrc.com': 'fpv-components-specs', 'foxeer.com': 'fpv-components-specs',
  'runcam.com': 'fpv-components-specs', 'betafpv.com': 'fpv-components-specs', 'radiomasterrc.com': 'fpv-components-specs', 'support.betafpv.com': 'fpv-components-specs',
  'multigp.org': 'fpv-racing-events', 'multigp.com': 'fpv-racing-events', 'droneraceleague.com': 'fpv-racing-events', 'fpvracing.tv': 'fpv-racing-events',
  'rotorbuilds.com': 'fpv-build-guides', 'rotorriot.com': 'fpv-build-guides',
  'intofpv.com': 'fpv-community-knowledge', 'reddit.com': 'fpv-community-knowledge', 'rcgroups.com': 'fpv-community-knowledge', 'rckolik.com': 'fpv-community-knowledge',
  'dronetr.net': 'fpv-community-knowledge', 'fpvdroneturk.com': 'fpv-community-knowledge', 'brodrone.com.tr': 'fpv-build-guides', 'maker.robotistan.com': 'fpv-build-guides',
  'arxiv.org': 'fpv-community-knowledge', 'researchgate.net': 'fpv-community-knowledge', 'ieeexplore.ieee.org': 'fpv-community-knowledge', 'rpg.ifi.uzh.ch': 'fpv-racing-events',
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

const ALLOWED_DOMAINS = [
  'oscarliang.com',
  'getfpv.com',
  'rotorbuilds.com',
  'betafpv.com',
  'iflight-rc.com',
  'team-blacksheep.com',
  'runcam.com',
  'radiomasterrc.com',
  'happymodel.cn',
  'fpv-community.de',
  'fpvlovers.com.tr',
];

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const h = parsed.hostname;
    // Block IPv4 loopback & link-local
    if (h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0') return false;
    // Block IPv6 loopback and mapped IPv4 loopback
    if (h === '::1' || h === '[::1]' || h.startsWith('::ffff:127.')) return false;
    // Block RFC-1918 private ranges (10.x, 172.16–31.x, 192.168.x)
    const ipv4Match = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$/);
    if (ipv4Match) {
      const [, a, b] = ipv4Match.map(Number);
      if (a === 10) return false;
      if (a === 172 && b >= 16 && b <= 31) return false;
      if (a === 192 && b === 168) return false;
      if (a === 169 && b === 254) return false; // link-local
    }
    return ALLOWED_DOMAINS.some(d => h === d || h.endsWith('.' + d));
  } catch (err: unknown) {
    console.error('[Ingest] URL routing error:', err instanceof Error ? err.message : String(err));
    return false;
  }
}

function routeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace('www.', '');
    const path = `${parsed.hostname}${parsed.pathname}`.toLowerCase();
    if (path.includes('2301.01755') || path.includes('2505.17438') || path.includes('2510.13644') || path.includes('rpg.ifi.uzh.ch/docs/arxiv23_hanover.pdf')) return 'fpv-racing-events';
    if (path.includes('339355780')) return 'fpv-flight-tuning';
    if (path.includes('394056828') || path.includes('366435671') || path.includes('09992013.pdf')) return 'fpv-community-knowledge';
    if (path.includes('github.com/inavflight/inav')) return 'fpv-flight-tuning';
    for (const [key, val] of Object.entries(DOMAIN_MAP)) {
      if (domain.includes(key)) return val;
    }
  } catch (err: unknown) {
    console.error('[Ingest] URL routing error:', err instanceof Error ? err.message : String(err));
  }
  return 'fpv-community-knowledge';
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json();
    const urls: string[] = body.urls || [];
    const forceDataset: string = body.dataset || '';

    if (!urls.length) return NextResponse.json({ error: 'No URLs provided' }, { status: 400 });

    const results: { url: string; status: string; dataset: string; docId?: string; size?: number; error?: string }[] = [];
    const apiKey = getRequiredEnv('DIFY_API_KEY');
    const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' as const };

    for (const url of urls.slice(0, 10)) {
      if (!isValidUrl(url)) {
        results.push({ url, status: 'invalid_url', dataset: '', error: 'URL not in allowlist' });
        continue;
      }

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
          } catch (err: unknown) {
            console.error('[Ingest] Crawler request error:', err instanceof Error ? err.message : String(err));
          }
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
          // Also persist full markdown to raw_content so image harvester can find editorial images.
          void persistRawCrawlContent({ url, rawMarkdown: md as string, crawler: 'ingest-route' });
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
