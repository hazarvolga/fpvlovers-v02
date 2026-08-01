# Dify Uzman Referansı

## Bağlantı

```
Base URL:     https://dify.affexai.tr/v1
UI:           https://dify.affexai.tr
Versiyon:     Dify v1.14.0
LLM:          Gemini 2.5 Flash
Vektör DB:    Qdrant
```

## API Token'ları

```
Dataset API:   <REDACTED — see .env.local, never commit real keys here>

App Expert:    <REDACTED>   → FPV Expert Assistant (9 dataset)
App Build:     <REDACTED>   → Build Wizard
App Part:      <REDACTED>   → Part Matcher
App Blackbox:  <REDACTED>   → Blackbox Tuning Advisor
App Community: <REDACTED>   → Community Hub
```

## src/lib/dify-client.ts Kullanımı

**TÜM Dify çağrıları bu client üzerinden geçmeli.**
Rate limit + budget tracking + **Groq fallback** + **LLM cache** burada.

```typescript
import { difyRequest, runWorkflow } from '@/lib/dify-client'

// App/chat çağrısı gerektiğinde de guard'lı request kullan
const response = await difyRequest('/chat-messages', {
  method: 'POST',
  apiKey: process.env.DIFY_APP_KEY!,
  taskType: 'rag_query',
  body: {
    query: 'FPV drone PID tuning',
    response_mode: 'blocking',
    user: 'fpvlovers-admin',
    inputs: {},
  },
})

// Workflow çağrısı
const workflow = await runWorkflow(workflowId, inputs, appToken)
```

### Groq Fallback

`dify-client.ts` Dify limiti aşılınca otomatik Groq'a geçer.
`groq_calls_today` sayacı `data/embedding-usage.json`'da izlenir.

## 9 Dataset — Gerçek UUID'ler

Kaynak: `src/lib/master-routing-tables.ts` → `DATASETS` sabiti

| Dataset | UUID | Chunk | Score | Ağırlık | Durum |
|---------|------|-------|-------|---------|-------|
| fpv-flight-tuning | `d1d5e44b-4dde-445a-a686-67a1cc0d926c` | 512 | 0.60 | sem:0.7 | ✅ 11 dok |
| fpv-pid-profiles | `3eacd19f-ccd8-49ec-8482-51120918f0e0` | 400 | 0.65 | sem:0.5 | ⚠️ Boş |
| fpv-troubleshooting | `9b380b45-1be1-4ba6-b685-72e279e09ccc` | 600 | 0.55 | sem:0.6 | ⚠️ Boş |
| fpv-components-specs | `38bb7d60-b921-440c-b8f4-e49f9982a61f` | 500 | 0.60 | sem:0.4 | ⚠️ Boş |
| fpv-build-guides | `a733583a-5e50-4e00-8b50-759380da59db` | 800 | 0.50 | sem:0.7 | ⚠️ Boş |
| fpv-news-reviews | `6a8a84c8-46ca-43f0-a3ea-3c19f32f5a17` | 1000 | 0.45 | sem:0.8 | ✅ 1 dok |
| fpv-racing-events | `cd17b1ea-a852-4d31-87d7-1b4c0bd46e7f` | 750 | 0.50 | sem:0.6 | ⚠️ Boş |
| fpv-community-knowledge | `639af5aa-d424-4d0b-9633-a7ab541afcb2` | 600 | 0.55 | sem:0.7 | ✅ 3 dok |
| fpv-regulations | `229be183-217b-4f93-ba48-9cdabbd1e37f` | 400 | **0.70** | **kw:0.7** | ✅ 5 dok ⚠️ |

> **fpv-regulations**: keyword-heavy (0.7) + hukuki hassasiyet. Threshold asla düşürme.
> Tüm dataset: **Hybrid Search + Jina Reranker v2 + gemini-embedding-001**

## App → Dataset Eşleşmesi (master-routing-tables.ts)

```
FPV Expert Assistant → fpv-flight-tuning, fpv-news-reviews, fpv-troubleshooting, fpv-regulations
Build Wizard         → fpv-build-guides, fpv-components-specs
Part Matcher         → fpv-components-specs, fpv-build-guides
Blackbox Tuning      → fpv-flight-tuning, fpv-pid-profiles
Community Hub        → fpv-community-knowledge
```

## Multi-Dataset Sorgulama Kuralları

`MULTI_DATASET_RULES` sabitinden (master-routing-tables.ts):

```
"best.*build"          → build-guides + components-specs + news-reviews  (merge_rerank)
"compatible|compat"    → components-specs                                 (single_metadata_filter)
"regulation|shgm|faa"  → regulations                                      (single_strict_no_fallback)
"oscillation|motor fix"→ troubleshooting + flight-tuning                 (sequential_troubleshoot_first)
```

## 8 Workflow DSL (dify_workflows/)

DSL dosyaları hazır. Kod tarafında yalnızca `seoContentGenerator` gerçek workflow ID + token mapping'e sahip; diğerleri `TODO-import-to-dify-first` durumunda.

| DSL Dosyası | İşlev |
|-------------|-------|
| seo-content-generator.dify.yml | SEO optimized makale üretimi |
| affiliate-orchestrator.dify.yml | Affiliate link yerleştirme |
| sponsorship-orchestrator.dify.yml | Sponsor içerik yönetimi |
| metadata-enrichment.dify.yml | İçerik metadata zenginleştirme |
| scheduled-publisher.dify.yml | Zamanlanmış yayın |
| drone-build-recommender.dify.yml | Chatflow: build tavsiyesi |
| drone-part-matcher.dify.yml | Chatflow: parça önerisi |
| hd-tune-analyzer.dify.yml | Chatflow: HD tune analizi |

### DSL API Bağlantısı (Açık Görev #4)

```typescript
// src/lib/dify-client.ts içinde mevcut imza
export async function runWorkflow(
  workflowId: string,
  inputs: Record<string, unknown>,
  appToken: string,
)
```

## System Prompt Yükleme (Açık Görev #3)

Kaynak: `sunucular/dataset-optimize-promt.MD` (kök değil — sunucular/ klasöründe, typo: "promt")

1. Dify UI → https://dify.affexai.tr
2. Studio → İlgili App → Settings → System Prompt
3. Her app için `dataset-optimize-promt.MD`'den ilgili prompt'u kopyala-yapıştır

## App Kullanım Rehberi

```typescript
import { findApp } from '@/lib/master-routing-tables'
import { difyRequest } from '@/lib/dify-client'

// master-routing-tables üzerinden token al (hardcode etme)
const appInfo = findApp('FPV Expert Assistant')
const response = await difyRequest('/chat-messages', {
  method: 'POST',
  apiKey: appInfo!.token,
  taskType: 'rag_query',
  body: {
    query: userQuery,
    response_mode: 'blocking',
    user: 'fpvlovers-system',
    inputs: {},
  },
})
```

## Yaygın Hatalar

| Hata | Neden | Çözüm |
|------|-------|-------|
| 401 Unauthorized | Yanlış token | `.env.local` kontrol, app vs dataset token karıştırma |
| 429 Rate Limited | Throttle aşıldı | dify-client.ts 1.5s/çağrı, günlük 500 token. `CRAWL_DRY_RUN=true` kullan |
| Workflow boş çıktı | DSL published değil | Dify UI'da aktif + published olduğunu doğrula |
| Groq fallback devrede | Dify limiti doldu | Normal — groq_calls_today izle |
