# FAZ 7/8 — Dify Live Integration
> Implementasyon Spesifikasyonu — Cowork tarafından hazırlandı

## Hedef

`response-composer.ts`'deki `text_block` şu an placeholder döndürüyor:
```
"[Dify Expert yanıtı buraya gelecek]"
```
Bu FAZ, master orchestrator'ın seçtiği Dify app'ine gerçek API çağrısı yaparak
`text_block.content`'i canlı AI yanıtıyla doldurur.

---

## Mevcut Altyapı (dokunma)

- `lib/dify-client.ts` — Rate-limit throttle: 1.5s arası, 15/dk, 500tok/gün. **Değiştirme.**
- `lib/master-routing-tables.ts` — Her intent'in `appId` alanı Dify app token'ını taşıyor.
- `lib/master-orchestrator.ts` → `MasterResponse.routing.app` → `{ id, name, token }`

---

## Kesin Dosya Listesi

```
lib/dify-caller.ts            ← NEW  Orchestrator-aware Dify çağrı katmanı
lib/response-composer.ts      ← UPDATE  placeholder → dify-caller entegrasyonu
app/api/master/route.ts       ← UPDATE  compose case → async + dify çağrısı
```

---

## 1. `lib/dify-caller.ts`

> `lib/dify-client.ts`'in gerçek export'u: `difyRequest(endpoint, options)`.
> `options.apiKey` ile app-specific Bearer token geçilebiliyor.
> Chat endpoint pattern (app/api/admin/content/route.ts'den doğrulanan):
> `POST /chat-messages` → body: `{ query, response_mode: 'blocking', user, inputs }` → `data.answer`

```typescript
// Dify Live Caller — orchestrator-aware, rate-limit safe
// lib/dify-client.ts üstünde çalışır; doğrudan fetch YAPMAZ.

import { difyRequest } from './dify-client';

export interface DifyCallInput {
  appToken: string;
  appName: string;
  query: string;
  intent: string;
  context?: Record<string, unknown>;
}

export interface DifyCallResult {
  answer: string;
  tokens_used?: number;
  latency_ms?: number;
  error?: string;
}

export async function callDifyForIntent(input: DifyCallInput): Promise<DifyCallResult> {
  const start = Date.now();

  const resp = await difyRequest('/chat-messages', {
    method: 'POST',
    apiKey: input.appToken,
    body: {
      query: input.query,
      response_mode: 'blocking',
      user: 'master-orchestrator',
      inputs: { intent: input.intent },
    },
  });

  const latency_ms = Date.now() - start;

  if (!resp.ok || resp.status === 'throttled' || resp.status === 'budget_exceeded') {
    return {
      answer: resp.status === 'dry_run'
        ? '[Dry-run modu aktif — gerçek Dify çağrısı yapılmadı]'
        : `[Dify yanıt hatası: ${resp.error ?? resp.status}]`,
      error: resp.error ?? resp.status,
      latency_ms,
    };
  }

  const answer: string = (resp.data as { answer?: string })?.answer ?? '[Yanıt alınamadı]';
  const tokens_used: number | undefined = resp.tokens;

  return { answer, tokens_used, latency_ms };
}
```

---

## 2. `lib/response-composer.ts` — Güncelleme

`composeResponse` fonksiyonunu **async** yap ve text_block'u doldur:

### Değişen imza:
```typescript
// ESKİ:
export function composeResponse(
  master: MasterResponse,
  query: string,
  retrieval?: RetrievalResult,
): BlockResponse

// YENİ:
export async function composeResponse(
  master: MasterResponse,
  query: string,
  retrieval?: RetrievalResult,
): Promise<BlockResponse>
```

### Dosya başına import ekle:
```typescript
import { callDifyForIntent, DifyCallResult } from './dify-caller';
```

### text_block bölümünü güncelle (section 2 içinde):
```typescript
// 2. AI RESPONSE TEXT BLOCK — Dify live call
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
```

---

## 3. `app/api/master/route.ts` — Güncelleme

`compose` case `await` gerektirir — async hale getir:

```typescript
// ESKİ:
case 'compose': {
  if (!q) return NextResponse.json({ error: 'Query required' }, { status: 400 });
  const masterResult = orchestrate({ query: q, contentType, forceIntent, forceApp });
  const retrievalResult = orchestrateRetrieval(q, masterResult.routing.intent);
  const composed = composeResponse(masterResult, q, retrievalResult);
  return NextResponse.json(composed);
}

// YENİ:
case 'compose': {
  if (!q) return NextResponse.json({ error: 'Query required' }, { status: 400 });
  const masterResult = orchestrate({ query: q, contentType, forceIntent, forceApp });
  const retrievalResult = orchestrateRetrieval(q, masterResult.routing.intent);
  const composed = await composeResponse(masterResult, q, retrievalResult);
  return NextResponse.json(composed);
}
```

---

## Acceptance Criteria

- [ ] `lib/dify-caller.ts` oluşturuldu — `callDifyForIntent` export ediliyor
- [ ] `lib/response-composer.ts` async, text_block artık Dify'dan geliyor
- [ ] `GET /api/master?action=compose&q=betaflight+pid` → `text_block.content` gerçek AI yanıtı içeriyor (placeholder değil)
- [ ] Dify hata durumunda (`appToken` yok veya Dify down) → `text_block.content` user-friendly hata mesajı içeriyor, 500 dönmüyor
- [ ] `tsc --noEmit` hatasız
- [ ] Mevcut `?action=route|retrieval|health|intelligence` endpoint'leri bozulmamış

## Kritik Uyarılar

1. `lib/dify-client.ts`'e **dokunma** — rate limiter orada, bozulursa token bütçesi patlar. Export: `difyRequest(endpoint, options)` — başka bir şey yok.
2. `composeResponse` async olduğu için `app/api/master/route.ts`'deki `await` zorunlu
3. Dify app token'ları `master.routing.app.token`'dan gelir — hardcode etme
4. Error handling: Dify down olsa bile `compose` endpoint 200 dönmeli, `text_block` hata mesajı taşımalı
5. `callDifyApp` export adını doğrulamadan `dify-caller.ts`'i yazma — önce grep
