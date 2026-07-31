# Monetization Orchestrator & AI Agents Referansı

## Monetization Orchestrator

**Dosya:** `src/lib/monetizationOrchestrator.ts`
**Kural:** 11 fonksiyon dispatch sistemi. Yeni fonksiyon ekleme değil, mevcut fonksiyonlara ekle.

### 11 Fonksiyon

```typescript
import { monetizationOrchestrator } from '@/lib/monetizationOrchestrator'

// 1. Intent Detection
const intent = await monetizationOrchestrator.detectIntent(content)
// → { type: 'purchase' | 'research' | 'build' | 'tune', confidence: number }

// 2. Product Recommendation
const products = await monetizationOrchestrator.recommendProducts({ intent, budget, skill })

// 3. Eligibility Check (affiliate/sponsor)
const eligible = await monetizationOrchestrator.checkEligibility({ contentId, type: 'affiliate' })

// 4. Content Injection (CTA/affiliate link)
const injected = await monetizationOrchestrator.injectContent({ html, intent, products })

// 5. A/B Test Assignment
const variant = await monetizationOrchestrator.assignABVariant({ userId, testId })

// 6. Sponsor Match
const sponsors = await monetizationOrchestrator.matchSponsors({ category, audience })

// 7. Trust Score (affiliate)
const trust = await monetizationOrchestrator.calculateTrust({ affiliateId })

// 8. Campaign Eligibility
const campaign = await monetizationOrchestrator.checkCampaign({ contentType, date })

// 9. Cross-sell
const crossSell = await monetizationOrchestrator.getCrossSell({ productId, context })

// 10. Price Comparison (multi-network)
const prices = await monetizationOrchestrator.comparePrice({ productSku })

// 11. Seasonal Boost
const boost = await monetizationOrchestrator.getSeasonalBoost({ category, date })
```

## data/*.json Şema Referansı

**Kural:** Alan silme/rename yasak. Yeni alan ekleyebilirsin.

```typescript
// data/affiliates.json
interface Affiliate {
  id: string
  name: string
  url: string
  commission: number      // yüzde
  category: string[]
  trustScore: number      // 0-1
  network: string
  active: boolean
}

// data/campaigns.json
interface Campaign {
  id: string
  name: string
  type: 'seasonal' | 'product' | 'category'
  startDate: string       // ISO
  endDate: string
  boostMultiplier: number
  targetCategories: string[]
}

// data/sponsors.json
interface Sponsor {
  id: string
  brand: string
  tier: 'platinum' | 'gold' | 'silver'
  categories: string[]
  budget: number
  contentTypes: string[]
  placementPriority: number
}

// data/trustScores.json — affiliate güven skorları
// data/intentProfiles.json — kullanıcı intent modelleri
// data/campaignMetrics.json — kampanya performans verisi
// data/ctas.json — CTA şablonları
```

## 7 AI Agent

### Tüm Agent'ları Çağırma

```typescript
import { agentDispatch } from '@/lib/agents/index'

// Dispatch API
const result = await agentDispatch({
  agent: 'seo',           // agent adı
  action: 'generateMeta', // agent'a özgü action
  payload: { title, content, keywords },
})
```

### 7 Agent (index.ts registerAgent sistemi)

```typescript
export type AgentId = 'seo' | 'affiliate' | 'sponsorship' | 'retrieval' | 'metadata' | 'recommendation' | 'ecosystem';
// NOT: 'ecosystem' agenti eklendi — read-only advisory, side effect yok
```

### Agent Detayları

#### SEO Agent (`src/lib/agents/seoAgent.ts`)
```typescript
// keyword → SEO optimize içerik
const seoData = await seoAgent.generateMeta({
  title: 'FPV PID Tuning Guide',
  content: articleContent,
  keywords: ['betaflight', 'pid tuning', 'freestyle fpv'],
})
// → { title, metaDescription, slug, schema, h1, h2s }
```

#### Affiliate Agent (`src/lib/agents/affiliateAgent.ts`)
```typescript
// İçerikten ürün eşleştirme
const matches = await affiliateAgent.matchProducts({
  content: articleContent,
  category: 'motors',
  maxProducts: 3,
})
// → { products: [{name, url, trustScore, cta}] }
```

#### Sponsorship Agent (`src/lib/agents/sponsorshipAgent.ts`)
```typescript
// Brand scoring ve placement
const placement = await sponsorshipAgent.scorePlacement({
  contentCategory: 'build-guides',
  audience: { skillLevel: 'beginner', budget: 'mid' },
})
// → { sponsor, tier, placement: 'header' | 'inline' | 'sidebar', copy }
```

#### Retrieval Agent (`src/lib/agents/retrievalAgent.ts`)
```typescript
// Dataset routing + top-K retrieval
const docs = await retrievalAgent.retrieve({
  query: 'How to tune P gain in Betaflight',
  datasets: ['fpv-pid-profiles', 'fpv-flight-tuning'],
  topK: 5,
  scoreThreshold: 0.60,
  useReranker: true,
})
```

#### Metadata Agent (`src/lib/agents/metadataAgent.ts`)
```typescript
// İçerik → entity/intent/category
const metadata = await metadataAgent.enrich({
  content: articleContent,
})
// → { entities: string[], intents: string[], category, readingTime, difficulty }
```

#### Recommendation Agent (`src/lib/agents/recommendationAgent.ts`)
```typescript
// Query → best_for/budget/upgrade önerisi
const recs = await recommendationAgent.recommend({
  query: 'Best drone for beginner',
  context: { budget: 200, experience: 'none' },
})
// → { bestFor: string, budget: Product, upgrade: Product, explanation: string }
```

#### Ecosystem Agent (`src/lib/agents/ecosystemAgent.ts`) — YENİ
```typescript
// Advisory: içerik boşlukları, routing ipuçları, sponsor eşleşme
// READ-ONLY — hiçbir zaman routing/monetization kararlarını override etmez
import { dispatchAgent } from '@/lib/agents'

const insights = await dispatchAgent({
  agent: 'ecosystem',
  input: { query: 'content gap analysis', category: 'build-guides' }
})
// → EcosystemReport: { health_score, insights: [{type, severity, suggestion}] }
```

> ecosystem agent doğrudan `ecosystem-intelligence.ts`'i çağırır.
> `src/lib/master-orchestrator.ts` tüm agent + Dify + monetization üzerinde oturur.

### Lib Modülleri — Tam Liste

| Modül | Görev |
|-------|-------|
| `dify-client.ts` | Rate limit + budget + Groq fallback — TÜM Dify çağrıları |
| `crawl-queue.ts` | Crawl4AI iş kuyruğu + retry |
| `master-orchestrator.ts` | Üst orkestratör (agent + Dify + monetization) |
| `master-routing-tables.ts` | Dataset UUID'leri, app token'ları, intent routing |
| `retrieval-orchestrator.ts` | Multi-dataset merge + dedup + rerank |
| `ecosystem-intelligence.ts` | Advisory AI (read-only, hiç side effect yok) |
| `monetizationOrchestrator.ts` | 11 fonksiyon dispatch |
| `llm-cache.ts` | PostgreSQL LLM yanıt önbelleği (TTL: 24h) |
| `master-health.ts` | Tüm servis sağlık toplayıcısı |
| `response-composer.ts` | Retrieval sonuçlarını formatlama |
| `duelEngine.ts` | Ürün karşılaştırma motoru |
| `newsletterSystem.ts` | Newsletter sistemi |

### Yeni Agent Ekleme Adımları

```
1. src/lib/agents/[adAgent].ts dosyasını oluştur
2. Mevcut agent'ı şablon al (örn. affiliateAgent.ts)
3. src/lib/agents/index.ts registry'sine ekle:
   import { newAgent } from './newAgent'
   export const AGENTS = { ..., newAgentName: newAgent }
4. src/app/api/admin/agents/[name]/route.ts ekle
5. TypeScript interface'ini types/ altında tanımla
```

```typescript
// src/lib/agents/index.ts — registerAgent sistemi
// (AGENTS map değil, registerAgent() kullanılıyor)
registerAgent({ id: 'seo', name: 'SEO Agent', ... })
registerAgent({ id: 'ecosystem', name: 'Ecosystem Intelligence Agent', ... })
// Yeni agent ekle: registerAgent() çağrısı + AgentId tipine ekle

export async function agentDispatch<T>(request: AgentRequest): Promise<T> {
  const agent = AGENTS[request.agent]
  if (!agent) throw new Error(`Agent not found: ${request.agent}`)
  return agent[request.action](request.payload) as T
}
```

## A/B Test Engine

```typescript
// Yeni test oluştur
const test = await monetizationOrchestrator.createABTest({
  name: 'cta-color-test',
  variants: ['red', 'orange'],
  trafficSplit: [50, 50],
  metric: 'click_rate',
  endDate: '2026-06-01',
})

// Kullanıcıya variant ata
const { variant } = await monetizationOrchestrator.assignABVariant({
  userId: session.user.id,
  testId: test.id,
})

// Metrik kaydet
await monetizationOrchestrator.trackABMetric({
  testId: test.id,
  variant,
  event: 'click',
  userId: session.user.id,
})
```

## Sezonsal Kampanya

```typescript
// Aktif kampanyaları getir
const activeCampaigns = await monetizationOrchestrator.checkCampaign({
  contentType: 'build-guide',
  date: new Date().toISOString(),
})

// data/campaigns.json'a yeni kampanya ekle
{
  "id": "summer-2026",
  "name": "Yaz Sezonu Boost",
  "type": "seasonal",
  "startDate": "2026-06-01",
  "endDate": "2026-08-31",
  "boostMultiplier": 1.5,
  "targetCategories": ["racing", "freestyle"]
}
```

## Vercel Analytics Entegrasyonu

```typescript
// src/app/layout.tsx içinde (zaten kurulu)
import { Analytics } from '@vercel/analytics/react'
// Monetization event'lerini track et
import { track } from '@vercel/analytics'

track('affiliate_click', { productId, affiliateId, contentSlug })
track('sponsor_impression', { sponsorId, placement, contentCategory })
track('ab_conversion', { testId, variant })
```
