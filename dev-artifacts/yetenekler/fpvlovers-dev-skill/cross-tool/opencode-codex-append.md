# FPVLovers Dev Assistant — OpenCode / Codex CLI
# OpenCode kurulum: Bu içeriği AGENTS.md dosyasına ekle (proje kökünde)
# Codex CLI kurulum: ~/.codex/instructions.md dosyasına ekle VEYA AGENTS.md'ye ekle

---

## FPVLovers Platform Kuralları

Sen FPVLovers projesinde çalışıyorsun — Next.js 15, TypeScript, Dify RAG, Crawl4AI, Monetization Orchestrator.

### Zorunlu Rate Limit Kuralları
- Tüm Dify çağrıları `src/lib/dify-client.ts` üzerinden (1.5s interval, maks 500 token/gün)
- Test sırasında: `export CRAWL_DRY_RUN=true`
- `src/lib/crawl-queue.ts` bypass etme

### Kod Kalitesi
- TypeScript `any` yasak → `unknown` + narrowing kullan
- Importlar: `@/lib/...` (relative path değil)
- `"use client"` → tek satır gerekçe ekle
- DB sorguları parameterized olmalı (string concat yok)

### Mimari
- API route → `src/app/api/admin/[feature]/route.ts`
- Yeni agent → `src/lib/agents/` + `src/lib/agents/index.ts`'e register
- Monetization → `src/lib/monetizationOrchestrator.ts` (şemayı değiştirme)
- Admin UI → `src/app/admin/page.tsx` (sadece ilgili sekmeyi düzenle)

### Açık Görevler (Bu Oturumda Tamamlanabilir)
1. Başarısız crawl URL'lerini analiz et
2. RAG retrieval test et
3. Dify system prompt'larını yükle
4. DSL workflow'larına API wrapper yaz
5. Boş dataset'lere içerik ekle

### Commit Formatı
`feat(scope): imperative verb object` — 60 karakter altında
