# FAZ 4/8 — Frontend Composition & Adaptive Experience System
> Implementasyon Spesifikasyonu — Cowork tarafından hazırlandı

## Durum Analizi

### Tamamlananlar (FAZ 1-3, 5)
- `lib/master-orchestrator.ts` → routing + intent classification ✅
- `lib/master-routing-tables.ts` → 10 intent, 5 app, 9 dataset ✅
- `lib/retrieval-orchestrator.ts` → multi-dataset merge + rerank ✅
- `lib/monetizationOrchestrator.ts` → 11 fonksiyon ✅
- `app/api/master/route.ts` → `?action=route|retrieval|health|routes|datasets` ✅

### FAZ 4/8 Hedefi
`MasterResponse` + `RetrievalResult` → structured `BlockResponse` üret.
Frontend SADECE blokları render eder, ham AI çıktısını değil.

---

## Kesin Dosya Listesi (oluşturulacak/güncellenecek)

```
types/blocks.ts                          ← NEW  Block tip tanımları
lib/response-composer.ts                 ← NEW  BlockResponse assembler
app/api/master/route.ts                  ← UPDATE  ?action=compose eklenir
components/blocks/BlockRenderer.tsx      ← NEW  Ana render bileşeni
components/blocks/TextBlock.tsx          ← NEW
components/blocks/RecommendationBlock.tsx ← NEW
components/blocks/AffiliateBlock.tsx     ← NEW
components/blocks/SponsorBlock.tsx       ← NEW
components/blocks/WarningBlock.tsx       ← NEW
components/blocks/RetrievalSourceBlock.tsx ← NEW
components/blocks/index.ts              ← NEW  export barrel
```

---

## 1. `types/blocks.ts`

```typescript
export type BlockType =
  | 'text_block'
  | 'recommendation_block'
  | 'comparison_block'
  | 'affiliate_block'
  | 'sponsor_block'
  | 'warning_block'
  | 'retrieval_source_block'
  | 'build_block'
  | 'tune_analysis_block'
  | 'analytics_block';

export type LayoutType =
  | 'default'
  | 'comparison'
  | 'recommendation'
  | 'support'
  | 'diagnostic'
  | 'tutorial'
  | 'ecosystem_map';

export interface BaseBlock {
  id: string;
  type: BlockType;
  priority: number;          // render sırası, düşük = önce
}

export interface TextBlock extends BaseBlock {
  type: 'text_block';
  content: string;
  heading?: string;
}

export interface RecommendationBlock extends BaseBlock {
  type: 'recommendation_block';
  items: Array<{
    title: string;
    reason: string;
    compatibility?: string;
    trustScore?: number;
  }>;
}

export interface AffiliateBlock extends BaseBlock {
  type: 'affiliate_block';
  productName: string;
  ctaText: string;
  affiliateUrl: string;
  trustLevel: 'high' | 'medium' | 'low';
}

export interface SponsorBlock extends BaseBlock {
  type: 'sponsor_block';
  sponsorName: string;
  message: string;
  contextRelevance: number;  // 0-1
}

export interface WarningBlock extends BaseBlock {
  type: 'warning_block';
  severity: 'info' | 'caution' | 'danger';
  message: string;
  regulation?: string;
}

export interface RetrievalSourceBlock extends BaseBlock {
  type: 'retrieval_source_block';
  sources: Array<{ dataset: string; score: number; snippet?: string }>;
  confidence: 'high' | 'medium' | 'low' | 'insufficient';
}

export interface BlockResponse {
  layout: LayoutType;
  blocks: BaseBlock[];
  intent: string;
  confidence: number;
  routing_reason: string;
  analytics: {
    route_confidence: number;
    fallback_used: boolean;
    regulation_safety: boolean;
    block_count: number;
    monetization_blocks: number;
  };
}
```

---

## 2. `lib/response-composer.ts`

```typescript
import { MasterResponse } from './master-orchestrator';
import { RetrievalResult } from './retrieval-orchestrator';
import {
  BlockResponse, LayoutType, BaseBlock,
  TextBlock, RecommendationBlock, AffiliateBlock,
  SponsorBlock, WarningBlock, RetrievalSourceBlock,
} from '@/types/blocks';
import { randomUUID } from 'crypto';

// Intent → Layout mapping (PHASE 4 Section 6)
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

export function composeResponse(
  master: MasterResponse,
  query: string,
  retrieval?: RetrievalResult,
): BlockResponse {
  const intent = master.routing.intent;
  const layout = INTENT_LAYOUT_MAP[intent] ?? 'default';
  const blocks: BaseBlock[] = [];
  let priority = 0;

  // 1. REGULATION SAFETY WARNING (always first if applicable)
  if (master.analytics?.regulation_safety && intent === 'regulations') {
    const warn: WarningBlock = {
      id: randomUUID(), type: 'warning_block', priority: priority++,
      severity: 'caution',
      message: 'Bu içerik yasal düzenlemeler hakkındadır. Bilgiler genel amaçlıdır, hukuki tavsiye değildir.',
      regulation: 'SHGM / EASA',
    };
    blocks.push(warn);
  }

  // 2. AI RESPONSE TEXT BLOCK (placeholder — production'da Dify'dan gelecek)
  const text: TextBlock = {
    id: randomUUID(), type: 'text_block', priority: priority++,
    content: `[Dify ${master.routing.app?.name ?? 'Expert'} yanıtı buraya gelecek]`,
    heading: intentToHeading(intent),
  };
  blocks.push(text);

  // 3. RETRIEVAL SOURCE BLOCK
  if (retrieval && retrieval.results.length > 0) {
    const src: RetrievalSourceBlock = {
      id: randomUUID(), type: 'retrieval_source_block', priority: priority++,
      sources: retrieval.results.slice(0, 3).map(r => ({
        dataset: r.datasetId,
        score: r.finalScore,
        snippet: r.content?.slice(0, 100),
      })),
      confidence: retrieval.confidence,
    };
    blocks.push(src);
  }

  // 4. RECOMMENDATION BLOCK (buying / build intent)
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

  // 5. AFFILIATE BLOCK (if monetization strategy allows)
  const mono = master.routing.monetization;
  if (['affiliate', 'mixed'].includes(mono.strategy) && mono.maxPlacements > 0) {
    const aff: AffiliateBlock = {
      id: randomUUID(), type: 'affiliate_block', priority: priority++,
      productName: '[Ürün adı affiliate agent\'dan gelecek]',
      ctaText: 'Fiyatı Gör',
      affiliateUrl: '#',
      trustLevel: 'high',
    };
    blocks.push(aff);
  }

  // 6. SPONSOR BLOCK (sponsor / mixed strategy)
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
```

---

## 3. `app/api/master/route.ts` — Güncelleme

Mevcut `switch (action)` bloğuna ekle:

```typescript
// Eklenecek import (dosya başına):
import { orchestrateRetrieval } from '@/lib/retrieval-orchestrator';
import { composeResponse } from '@/lib/response-composer';

// switch bloğuna yeni case:
case 'compose': {
  if (!q) return NextResponse.json({ error: 'Query required' }, { status: 400 });
  const masterResult = orchestrate({ query: q, contentType, forceIntent, forceApp });
  const retrievalResult = orchestrateRetrieval(q, masterResult.routing.intent);
  const composed = composeResponse(masterResult, q, retrievalResult);
  return NextResponse.json(composed);
}
```

---

## 4. `components/blocks/BlockRenderer.tsx`

```tsx
'use client';

import { BlockResponse, BaseBlock } from '@/types/blocks';

interface Props { response: BlockResponse }

export function BlockRenderer({ response }: Props) {
  return (
    <div className={`block-layout layout-${response.layout} flex flex-col gap-4`}>
      {response.blocks.map(block => (
        <DynamicBlock key={block.id} block={block} />
      ))}
    </div>
  );
}

function DynamicBlock({ block }: { block: BaseBlock }) {
  switch (block.type) {
    case 'text_block':
      return <TextBlockView block={block as any} />;
    case 'warning_block':
      return <WarningBlockView block={block as any} />;
    case 'retrieval_source_block':
      return <RetrievalSourceBlockView block={block as any} />;
    case 'recommendation_block':
      return <RecommendationBlockView block={block as any} />;
    case 'affiliate_block':
      return <AffiliateBlockView block={block as any} />;
    case 'sponsor_block':
      return <SponsorBlockView block={block as any} />;
    default:
      return null;
  }
}

// Block render bileşenleri — minimal, production'da stillenecek
function TextBlockView({ block }: any) {
  return (
    <div className="text-block rounded-lg bg-gray-900 p-4">
      {block.heading && <h3 className="text-sm font-semibold text-gray-400 mb-2">{block.heading}</h3>}
      <p className="text-sm text-gray-200">{block.content}</p>
    </div>
  );
}

function WarningBlockView({ block }: any) {
  const colors = { info: 'blue', caution: 'yellow', danger: 'red' } as const;
  const c = colors[block.severity as keyof typeof colors];
  return (
    <div className={`warning-block rounded-lg border border-${c}-500/40 bg-${c}-500/10 p-3`}>
      <p className={`text-xs text-${c}-300`}>{block.message}</p>
    </div>
  );
}

function RetrievalSourceBlockView({ block }: any) {
  return (
    <div className="retrieval-source-block rounded-lg bg-gray-800/50 p-3">
      <p className="text-xs text-gray-500 mb-1">Kaynaklar ({block.confidence})</p>
      {block.sources.map((s: any, i: number) => (
        <div key={i} className="text-xs text-gray-400">
          {s.dataset} — {(s.score * 100).toFixed(0)}%
        </div>
      ))}
    </div>
  );
}

function RecommendationBlockView({ block }: any) {
  return (
    <div className="recommendation-block grid gap-2">
      {block.items.map((item: any, i: number) => (
        <div key={i} className="rounded-lg bg-gray-800 p-3">
          <p className="text-sm font-medium text-white">{item.title}</p>
          <p className="text-xs text-gray-400">{item.reason}</p>
        </div>
      ))}
    </div>
  );
}

function AffiliateBlockView({ block }: any) {
  return (
    <div className="affiliate-block rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-center justify-between">
      <p className="text-sm text-gray-200">{block.productName}</p>
      <a href={block.affiliateUrl} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">
        {block.ctaText} →
      </a>
    </div>
  );
}

function SponsorBlockView({ block }: any) {
  return (
    <div className="sponsor-block rounded-lg border border-gray-700 bg-gray-800/30 p-3">
      <p className="text-xs text-gray-500 mb-1">Sponsor</p>
      <p className="text-sm text-gray-300">{block.sponsorName}</p>
      <p className="text-xs text-gray-500">{block.message}</p>
    </div>
  );
}
```

---

## 5. `components/blocks/index.ts`

```typescript
export { BlockRenderer } from './BlockRenderer';
export type { BlockResponse, BaseBlock } from '@/types/blocks';
```

---

## Acceptance Criteria

- [ ] `tsc --noEmit` hatasız geçiyor
- [ ] `GET /api/master?action=compose&q=betaflight+pid` → `{ layout, blocks[], intent, confidence }` dönüyor
- [ ] `blocks[]` en az 2 eleman içeriyor (text_block + retrieval_source_block)
- [ ] `regulations` intent → `warning_block` ilk sırada
- [ ] `buying` intent → `recommendation_block` var
- [ ] Mevcut `?action=route|retrieval|health` endpoint'leri bozulmamış

## Kritik Uyarılar

1. `app/api/master/route.ts` güncellenirken mevcut case'lere **dokunma**, sadece `compose` case'ini ekle
2. `types/blocks.ts` dosyası `types/` dizininde olmalı — `lib/` değil
3. `components/blocks/` için ayrı dosyalar yaz, `BlockRenderer.tsx`'e inline yazma
4. `randomUUID()` için `import { randomUUID } from 'crypto'` — `Math.random()` değil
