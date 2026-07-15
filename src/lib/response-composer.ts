import { MasterResponse } from '@/lib/master-orchestrator';
import { RetrievalResult } from '@/lib/retrieval-orchestrator';
import {
  BlockResponse, LayoutType, BaseBlock,
  TextBlock, RecommendationBlock, AffiliateBlock,
  SponsorBlock, WarningBlock, RetrievalSourceBlock,
} from '@/types/blocks';
import { randomUUID } from 'crypto';
import { callDifyForIntent, DifyCallResult } from '@/lib/dify-caller';

const INTENT_LAYOUT_MAP: Record<string, LayoutType> = {
  comparison: 'comparison',
  buying:     'recommendation',
  troubleshoot: 'support',
  tuning:     'diagnostic',
  pid:        'diagnostic',
  build:      'recommendation',
  regulations: 'support',
  racing:     'default',
  community:  'default',
  news:       'default',
};

function getVerifiedAffiliateBlock(): AffiliateBlock | null {
  // The monetization agent must provide a real catalog record before this
  // becomes non-null. Keeping the boundary explicit prevents `#` CTAs.
  return null;
}

export async function composeResponse(
  master: MasterResponse,
  query: string,
  retrieval?: RetrievalResult,
): Promise<BlockResponse> {
  const intent = master.routing.intent;
  const layout = INTENT_LAYOUT_MAP[intent] ?? 'default';
  const blocks: BaseBlock[] = [];
  let priority = 0;

  // 1. REGULATION SAFETY WARNING
  if (master.analytics?.regulation_safety && intent === 'regulations') {
    const warn: WarningBlock = {
      id: randomUUID(), type: 'warning_block', priority: priority++,
      severity: 'caution',
      message: 'Bu içerik yasal düzenlemeler hakkındadır. Bilgiler genel amaçlıdır, hukuki tavsiye değildir.',
      regulation: 'SHGM / EASA',
    };
    blocks.push(warn);
  }

  // 2. TEXT BLOCK — Dify live call
  let difyResult: DifyCallResult | null = null;
  if (master.routing.app?.token) {
    difyResult = await callDifyForIntent({
      appToken: master.routing.app.token,
      appName: master.routing.app.name ?? 'Expert',
      query,
      intent,
    });
  }

  const text: TextBlock = {
    id: randomUUID(), type: 'text_block', priority: priority++,
    content: difyResult?.answer ?? '[Yanıt üretilemiyor — lütfen tekrar deneyin]',
    heading: intentToHeading(intent),
  };
  blocks.push(text);

  // 3. RETRIEVAL SOURCE BLOCK
  if (retrieval && retrieval.chunks.length > 0) {
    const confidence = retrieval.stats.confidence >= 0.75 ? 'high'
      : retrieval.stats.confidence >= 0.55 ? 'medium'
      : retrieval.stats.confidence >= 0.35 ? 'low'
      : 'insufficient' as const;

    const src: RetrievalSourceBlock = {
      id: randomUUID(), type: 'retrieval_source_block', priority: priority++,
      sources: retrieval.chunks.slice(0, 3).map(r => ({
        dataset: r.datasetName,
        score: r.score,
        snippet: r.content?.slice(0, 100),
      })),
      confidence,
    };
    blocks.push(src);
  }

  // 4. RECOMMENDATION BLOCK
  if (['buying', 'build', 'parts'].includes(intent)) {
    const rec: RecommendationBlock = {
      id: randomUUID(), type: 'recommendation_block', priority: priority++,
      items: [
        { title: 'Öneri 1', reason: 'Bütçe + uyumluluk', trustScore: 0.85 },
        { title: 'Öneri 2', reason: 'Performans odaklı', trustScore: 0.78 },
      ],
    };
    blocks.push(rec);
  }

  // 5. AFFILIATE BLOCK
  const mono = master.routing.monetization;
  // A monetization strategy alone is not evidence of a product. Do not emit
  // a placeholder CTA until the affiliate agent supplies a verified URL.
  const verifiedAffiliate = getVerifiedAffiliateBlock();
  if (verifiedAffiliate && ['affiliate', 'mixed'].includes(mono.strategy) && mono.maxPlacements > 0) {
    const aff: AffiliateBlock = {
      id: randomUUID(),
      type: 'affiliate_block',
      priority: priority++,
      productName: verifiedAffiliate.productName,
      ctaText: verifiedAffiliate.ctaText,
      affiliateUrl: verifiedAffiliate.affiliateUrl,
      trustLevel: verifiedAffiliate.trustLevel,
    };
    blocks.push(aff);
  }

  // 6. SPONSOR BLOCK
  if (['sponsor', 'mixed'].includes(mono.strategy) && mono.maxPlacements > 0) {
    const spon: SponsorBlock = {
      id: randomUUID(), type: 'sponsor_block', priority: priority++,
      sponsorName: '[Sponsor sponsor agent\'dan gelecek]',
      message: '[Sponsor mesajı]',
      contextRelevance: 0.75,
    };
    blocks.push(spon);
  }

  const monetizationBlocks = blocks.filter(b =>
    b.type === 'affiliate_block' || b.type === 'sponsor_block'
  ).length;

  return {
    layout,
    blocks: blocks.sort((a, b) => a.priority - b.priority),
    intent,
    confidence: master.routing.confidence,
    routing_reason: master.routing.routing_reason,
    analytics: {
      ...master.analytics!,
      block_count: blocks.length,
      monetization_blocks: monetizationBlocks,
    },
  };
}

function intentToHeading(intent: string): string {
  const MAP: Record<string, string> = {
    tuning: 'Uçuş Ayarı',
    pid: 'PID Profili',
    troubleshoot: 'Sorun Giderme',
    parts: 'Parça Tavsiyeleri',
    build: 'Drone Build Rehberi',
    news: 'FPV Haberleri',
    racing: 'Yarış Bilgileri',
    community: 'Topluluk Bilgisi',
    regulations: 'Yasal Düzenlemeler',
    buying: 'Satın Alma Rehberi',
  };
  return MAP[intent] ?? 'FPV Asistanı';
}
