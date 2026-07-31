# FPVLovers Dev Assistant
# Kiro Kurulum: Bu dosyayı .kiro/steering/fpvlovers.md olarak kopyala
# Kiro bu dosyayı otomatik olarak her oturumda yükler.

## Proje Bağlamı

FPVLovers, Next.js 15 + TypeScript tabanlı FPV drone otomatik blogging platformudur.
Ana dizin: `fpv-autoblog-v2/fpvlovers-frontend-websitesi/`

**Altyapı:**
- Dify v1.14.0 RAG (https://dify.affexai.tr/v1)
- Crawl4AI: 161.118.171.201:3002 (primary), 141.148.206.187 (backup)
- PostgreSQL + Qdrant + Redis on 80.225.231.62

## Zorunlu Kurallar

- `src/lib/dify-client.ts` → tüm Dify çağrıları buradan (rate limit koruması)
- `CRAWL_DRY_RUN=true` → test/debug sırasında zorunlu
- `src/lib/crawl-queue.ts` → bypass edilemez
- `any` tipi → yasak (`unknown` kullan)
- Import: `@/` alias zorunlu
- Yeni agent → `src/lib/agents/index.ts`'e kaydet
- `src/app/admin/page.tsx` → büyük dosya, sadece ilgili sekmeyi değiştir
- `data/*.json` şema değişikliği → alan silme/rename yasak

## Dosya Haritası

```
src/lib/dify-client.ts           # Dify API gateway (throttle)
src/lib/crawl-queue.ts           # Crawl batch sistemi
src/lib/monetizationOrchestrator.ts  # 11 fonksiyon dispatch
src/lib/agents/index.ts          # Agent registry
src/app/api/admin/               # API route'lar
data/*.json                  # 7 veri dosyası
dify_workflows/              # DSL'ler (API bağlantısı bekleniyor)
```

## Açık Görevler

1. Başarısız URL'leri analiz et + 2. tur crawl
2. RAG retrieval kalite testi
3. 5 system prompt → Dify'a yükle
4. dify_workflows/ → API wrapper yaz
5. Boş dataset'lere içerik ekle (fpv-components-specs, fpv-build-guides vb.)
