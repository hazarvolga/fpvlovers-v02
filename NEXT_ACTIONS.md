# FPVLovers Next Actions

Last updated: 2026-06-14

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
- **Dify console:** hazarvolga@gmail.com / Admin1234! @ https://dify.affexai.tr
- **Coolify:** https://coolify.fpvlovers.com.tr (hulyaekiz üzerinde)
- **Cron:** 5dk crawl, 20dk generate (hulyaekiz crontab)
- **CRON_SECRET:** fpvlovers-cron-860a25b8e8a339a49c92c02a4a01972c

## Restore Points

- `backup/pre-gap-plan-2026-06-14` → GAP düzeltmeleri öncesi snapshot
- `sprint/gap-fixes-round2-2026-06-14` → Round 2 başlangıcı
