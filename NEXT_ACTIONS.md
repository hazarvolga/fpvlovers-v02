# FPVLovers Next Actions

Last updated: 2026-06-18

## Immediate Security Actions

1. Rotate the Dify console credential and `CRON_SECRET` in their owning systems; current Git files no longer contain the exposed values, but removal does not revoke them.
2. After rotation, plan a coordinated Git-history rewrite and force-push window so all collaborators can re-clone safely.
3. Keep `pnpm security:audit` in the local release gate to prevent tracked credential values, hardcoded Dify tokens, and developer-specific audit paths from returning.

## Completed (2026-06-18 Post-Analysis Phase 1)

- Removed tracked operational credential values from current documentation.
- Removed hardcoded Dify token fallbacks from YouTube generation and retrieval testing.
- Routed retrieval quality tests through `src/lib/dify-client.ts`.
- Moved the unified metadata report to `reports/unified-metadata-report.md` and added `pnpm metadata:audit`.
- Added `pnpm security:audit`; fresh security audit, metadata audit, TypeScript, and whitespace checks pass locally.

## Completed (2026-06-18 Post-Analysis Phase 2)

- Completed discovery metadata for all 117 published artifacts; all six audited metadata fields now report zero missing values.
- Canonicalized `Buyers Guides` to `Buyer Guides` in existing artifacts and the commercial content generator.
- Replaced the destructive target-only migration with an idempotent merge migration that preserves review, comparison, and buyer-guide metadata.
- Added `pnpm metadata:test` and `pnpm metadata:migrate`; regression, metadata, content-integrity, and TypeScript gates pass locally.

## ✅ Completed (2026-06-14 GAP Closure Sprint)

- GAP raporu yazıldı (25 bulgu, 17'si çözüldü)
- 11 Dify token'ı env var'a taşındı (hardcoded → .env)
- NEXT_PUBLIC_GEMINI_API_KEY → GEMINI_API_KEY rename
- 31 admin route'a inline auth guard eklendi
- CRON_SECRET bypass kaldırıldı
- Token budget mismatch düzeltildi (dosyada 100000, her zaman 500)
- Retrieval orchestrator gerçek Dify Dataset API'ye bağlandı (ENABLE_REAL_RAG=true)
- 5 boş dataset için 10 seed URL eklendi
- 89 eski makaledeki genel stok/placeholder referansları temizlendi
- Crawl kaynak görsellerini koruyan medya politikası netleştirildi
- Unsplash/Pexels/Picsum için runtime denylist ve `media:audit` eklendi
- Published artifact filesystem + PostgreSQL dayanıklılığı eklendi
- Content smoke testi gerçek kuyruktan izole edildi
- Canlıda üretilen 7 eksik makale Git çalışma ağacına senkronize edildi
- YouTube transcript otomatik altyazı desteği eklendi
- deploy-clean branch'inden eksik 3 özellik main'e alındı
- Kullanılmayan paketler kaldırıldı (@hookform/resolvers, react-hook-form, react-is)
- Affiliate tıklama takibi eklendi
- NativeAds dinamik props tabanlı hale getirildi
- URL allowlist + SSRF koruması eklendi
- View counter 0 değerini de gösteriyor (artık hep görünür)
- Production env var'ları Coolify'da tanımlandı
- Generate pipeline çalışıyor, içerik üretiliyor (Racing)
- Crawl pipeline çalışıyor (CRAWL_DRY_RUN=false)

## Manuel Yapılacak (Coolify)

1. ✅ `be392db` production deploy tamamlandı; container healthy ve restart sayısı 0
2. ✅ Published artifact backfill tamamlandı: 109 benzersiz slug, 0 eksik metadata
3. ✅ `/api/health`, homepage ve crawl/üretici görselli makale doğrulandı
4. Crawl/generate cron'ları aktif (5dk/20dk); yeni üretimlerin shadow tabloya otomatik yazıldığını izlemeye devam et

## Ertelenen (Düşük Öncelik)

- Admin panel 1676 satır → modüler bileşenlere böl (GAP-TECH-001)
- 43 boş catch bloğuna console.error ekle (GAP-TECH-004)
- 7 Dify workflow DSL import (Dify UI manuel işlem)
- Racing intelligence store → pending-review girişleri doğrula
- İçerik pipeline'ına monetizasyon enjeksiyonu (derin entegrasyon)
- Husky deprecation uyarılarını düzelt (.husky/pre-commit, .husky/commit-msg)

## Sunucu Bilgileri

- **Hulyaekiz (161.118.171.201):** fpvlovers Coolify + Crawl4AI primary
- **Aluplan-one (80.225.231.62):** Dify + PostgreSQL + Redis + Qdrant
- **Orko (141.148.206.187):** Crawl4AI backup
- **Dify console URL:** https://dify.affexai.tr (credentials are managed outside Git)
- **Coolify:** https://coolify.fpvlovers.com.tr (hulyaekiz üzerinde)
- **Cron:** 5dk crawl, 20dk generate (hulyaekiz crontab)
- **Cron authentication:** `CRON_SECRET` is managed in Coolify and the server crontab; never record its value in Git

## Restore Points

- `backup/pre-gap-plan-2026-06-14` → GAP düzeltmeleri öncesi snapshot
- `sprint/gap-fixes-round2-2026-06-14` → Round 2 başlangıcı
