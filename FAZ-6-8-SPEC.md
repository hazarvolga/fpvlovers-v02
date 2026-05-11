# FAZ 6/8 — AI-Assisted Orchestration & Intelligence Layer
> Implementasyon Spesifikasyonu — Cowork tarafından hazırlandı

## Kural: Advisory Layer — Kontrol Değil

FAZ 6/8 **öneri üretir**, sistem kararlarını geçersiz kılmaz.
Tüm çıktılar `suggestions[]` olarak döner, deterministic kural motoru üstte kalır.

---

## Kesin Dosya Listesi

```
lib/agents/ecosystemAgent.ts          ← NEW  7. agent
lib/ecosystem-intelligence.ts         ← NEW  Core analytics + insight engine
lib/agents/index.ts                   ← UPDATE  'ecosystem' AgentId eklenir
app/api/master/route.ts               ← UPDATE  ?action=intelligence eklenir
```

---

## 1. `lib/agents/index.ts` — Güncelleme

```typescript
// AgentId'ye ekle:
export type AgentId = 'seo' | 'affiliate' | 'sponsorship' | 'retrieval' | 'metadata' | 'recommendation' | 'ecosystem';
```

Dosya sonuna eklenecek:
```typescript
import './ecosystemAgent';  // auto-register on import
```

---

## 2. `lib/ecosystem-intelligence.ts`

```typescript
// Ecosystem Intelligence Engine — advisory only, no side effects

import { DATASETS, INTENT_ROUTES } from './master-routing-tables';
import { getEcosystemHealth } from './master-orchestrator';

// ─── TYPES ───

export interface EcosystemInsight {
  type: 'content_gap' | 'routing_hint' | 'sponsor_match' | 'metadata_enrichment' | 'trend';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  suggestion: string;
  affected?: string[];   // dataset names, intent routes, or agent IDs
}

export interface EcosystemReport {
  generated_at: string;
  health_score: number;
  insights: EcosystemInsight[];
  content_gaps: string[];     // empty/sparse dataset names
  strong_routes: string[];    // intents with full coverage
  weak_routes: string[];      // intents with empty datasets
  sponsor_opportunities: string[];
}

// ─── CONTENT GAP ANALYSIS ───

export function analyzeContentGaps(): EcosystemInsight[] {
  const insights: EcosystemInsight[] = [];

  for (const ds of DATASETS) {
    if (ds.docCount === 0) {
      insights.push({
        type: 'content_gap',
        severity: 'high',
        title: `Empty dataset: ${ds.name}`,
        description: `${ds.name} has 0 documents. Retrieval will always fail for related intents.`,
        suggestion: `Crawl and ingest content for ${ds.name}. Min recommended: 10 documents.`,
        affected: [ds.name],
      });
    } else if (ds.docCount < 5) {
      insights.push({
        type: 'content_gap',
        severity: 'medium',
        title: `Sparse dataset: ${ds.name}`,
        description: `${ds.name} has only ${ds.docCount} document(s). Retrieval quality is limited.`,
        suggestion: `Expand ${ds.name} to at least 10 documents for reliable retrieval.`,
        affected: [ds.name],
      });
    }
  }

  return insights;
}

// ─── ROUTING ANALYSIS ───

export function analyzeRoutingCoverage(): { strong: string[]; weak: string[] } {
  const strong: string[] = [];
  const weak: string[] = [];

  for (const route of INTENT_ROUTES) {
    const primaryDs = DATASETS.find(d => d.id === route.primaryDatasetId);
    if (primaryDs && primaryDs.docCount >= 5) {
      strong.push(route.intent);
    } else {
      weak.push(route.intent);
    }
  }

  return { strong, weak };
}

// ─── SPONSOR OPPORTUNITY DETECTION ───

export function detectSponsorOpportunities(): EcosystemInsight[] {
  // Routes with affiliate/mixed strategy but low dataset coverage
  const opportunities: EcosystemInsight[] = [];

  for (const route of INTENT_ROUTES) {
    if (['affiliate', 'mixed'].includes(route.monetizationStrategy)) {
      const ds = DATASETS.find(d => d.id === route.primaryDatasetId);
      if (ds && ds.docCount === 0) {
        opportunities.push({
          type: 'sponsor_match',
          severity: 'medium',
          title: `Monetization gap: ${route.intent}`,
          description: `${route.intent} intent has ${route.monetizationStrategy} strategy but empty dataset.`,
          suggestion: `Populate ${ds.name} to unlock ${route.monetizationStrategy} revenue for ${route.intent} queries.`,
          affected: [route.intent, ds.name],
        });
      }
    }
  }

  return opportunities;
}

// ─── METADATA ENRICHMENT SUGGESTIONS ───

export function generateMetadataSuggestions(query: string, intent: string): EcosystemInsight[] {
  const tags: Record<string, string[]> = {
    tuning:      ['pid', 'betaflight', 'rates', 'filter', 'blackbox'],
    pid:         ['pid', 'p-term', 'i-term', 'd-term', 'tune'],
    troubleshoot:['repair', 'fix', 'issue', 'problem', 'crash'],
    parts:       ['motor', 'esc', 'fc', 'frame', 'prop', 'vtx'],
    build:       ['build', 'setup', 'wiring', 'solder', 'config'],
    buying:      ['price', 'budget', 'review', 'recommendation'],
    regulations: ['regulation', 'legal', 'registration', 'shgm', 'easa'],
    racing:      ['gate', 'lap', 'track', 'race', 'freestyle'],
    community:   ['fpv', 'pilot', 'community', 'group'],
    news:        ['release', 'new', 'update', 'announce'],
  };

  const suggested = tags[intent] ?? [];
  if (suggested.length === 0) return [];

  return [{
    type: 'metadata_enrichment',
    severity: 'low',
    title: `Suggested tags for ${intent}`,
    description: `Query "${query}" maps to ${intent}. Recommended semantic tags for retrieval optimization.`,
    suggestion: `Apply tags: ${suggested.join(', ')}`,
    affected: [intent],
  }];
}

// ─── FULL REPORT ───

export function generateEcosystemReport(query?: string, intent?: string): EcosystemReport {
  const health = getEcosystemHealth();
  const gaps = analyzeContentGaps();
  const { strong, weak } = analyzeRoutingCoverage();
  const sponsorOps = detectSponsorOpportunities();
  const metaSuggestions = query && intent
    ? generateMetadataSuggestions(query, intent)
    : [];

  const allInsights = [...gaps, ...sponsorOps, ...metaSuggestions]
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    });

  return {
    generated_at: new Date().toISOString(),
    health_score: health.ecosystem_health_score,
    insights: allInsights,
    content_gaps: DATASETS.filter(d => d.docCount === 0).map(d => d.name),
    strong_routes: strong,
    weak_routes: weak,
    sponsor_opportunities: sponsorOps.map(o => o.title),
  };
}
```

---

## 3. `lib/agents/ecosystemAgent.ts`

```typescript
import { registerAgent } from './index';
import { generateEcosystemReport } from '../ecosystem-intelligence';

registerAgent({
  id: 'ecosystem',
  name: 'Ecosystem Intelligence Agent',
  description: 'Advisory AI layer: content gap analysis, routing insights, sponsor matching, metadata enrichment. Read-only — suggests, never overwrites.',
  systemPrompt: `You are the FPVLovers Ecosystem Intelligence Agent.
Your role is ADVISORY ONLY. You analyze the platform's knowledge graph and suggest improvements.

You NEVER:
- override deterministic routing rules
- change monetization decisions directly
- bypass trust validation systems

You ALWAYS:
- return structured suggestions with severity levels
- explain the "why" behind each suggestion
- respect the regulation safety boundary (no fallback for fpv-regulations)`,

  inputSchema: {
    query:  { type: 'string', required: false, description: 'User query for context-aware insights' },
    intent: { type: 'string', required: false, description: 'Detected intent for targeted metadata suggestions' },
    mode:   { type: 'string', required: false, description: 'full | gaps | routing | sponsors | metadata' },
  },

  handler: async (input) => {
    const { query, intent, mode = 'full' } = input;

    if (mode === 'gaps') {
      const { analyzeContentGaps } = await import('../ecosystem-intelligence');
      return { insights: analyzeContentGaps() };
    }
    if (mode === 'routing') {
      const { analyzeRoutingCoverage } = await import('../ecosystem-intelligence');
      return analyzeRoutingCoverage();
    }
    if (mode === 'sponsors') {
      const { detectSponsorOpportunities } = await import('../ecosystem-intelligence');
      return { insights: detectSponsorOpportunities() };
    }
    if (mode === 'metadata' && query && intent) {
      const { generateMetadataSuggestions } = await import('../ecosystem-intelligence');
      return { insights: generateMetadataSuggestions(query, intent) };
    }

    // default: full report
    return generateEcosystemReport(query, intent);
  },
});
```

---

## 4. `app/api/master/route.ts` — Güncelleme

Mevcut import bloğuna ekle:
```typescript
import { generateEcosystemReport } from '@/lib/ecosystem-intelligence';
```

Switch bloğuna yeni case ekle (compose'dan sonra):
```typescript
case 'intelligence': {
  const intent = forceIntent || (q ? undefined : undefined);
  const report = generateEcosystemReport(q || undefined, intent);
  return NextResponse.json(report);
}
```

---

## 5. `lib/agents/index.ts` — Import Ekleme

Dosya sonuna (diğer agent import'larının yanına):
```typescript
// Auto-register all agents
import '@/lib/agents/seoAgent';
import '@/lib/agents/affiliateAgent';
import '@/lib/agents/sponsorshipAgent';
import '@/lib/agents/retrievalAgent';
import '@/lib/agents/metadataAgent';
import '@/lib/agents/recommendationAgent';
import '@/lib/agents/ecosystemAgent';   // ← 7. agent
```

> ⚠️ Eğer diğer agent'lar zaten farklı şekilde register ediliyorsa, sadece
> `ecosystemAgent.ts`'in `registerAgent()` çağrısının çalışması yeterli.
> Mevcut import pattern'ine bak, ona uy.

---

## Acceptance Criteria

- [ ] `lib/agents/index.ts` → `AgentId` tipine `'ecosystem'` eklendi
- [ ] `lib/ecosystem-intelligence.ts` oluşturuldu
- [ ] `lib/agents/ecosystemAgent.ts` oluşturuldu, `registerAgent()` çağrıldı
- [ ] `GET /api/master?action=intelligence` → `{ health_score, insights[], content_gaps[], weak_routes[] }` dönüyor
- [ ] `GET /api/admin/agents?agent=ecosystem&mode=gaps` → sadece content gap insight'ları dönüyor
- [ ] `tsc --noEmit` hatasız
- [ ] Mevcut 6 agent bozulmamış — `GET /api/admin/agents?agent=seo` hâlâ çalışıyor

## Kritik Uyarılar

1. `lib/agents/index.ts` büyük değişiklik — önce `gitnexus_impact "registerAgent" upstream` çalıştır
2. Ecosystem agent **async dynamic import** kullanıyor (`mode` switch) — TypeScript'in bunu doğru çıkarsaması için her `import()` için return type açık belirtilmeli
3. `app/api/master/route.ts`'e sadece `intelligence` case'i ve gerekli import ekle, başka hiçbir şeye dokunma
4. `generateEcosystemReport` saf fonksiyon — DB veya Dify çağrısı yok, test edilmesi kolay
