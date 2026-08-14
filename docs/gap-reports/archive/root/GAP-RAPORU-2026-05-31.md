# FPVLovers Frontend — Gap Raporu
**Tarih:** 2026-05-31 · **Branch:** `deploy-clean` · **Önceki rapor:** 2026-05-21

---

## 1. Yönetici Özeti

Platform **mimari olarak tamamlanmış**, **veri olarak boş** durumda. Kod sağlığı yüksek: typecheck temiz (0 hata), lint neredeyse temiz (2 uyarı), tek-ağaç (`src/`) yapısı stabilize edilmiş, 7 agent + 8 lib modülü + 14 admin sekmesi mevcut. Ancak müşteriye dönük değerin büyük kısmı **içerik ve ürün kataloğu eksikliği** nedeniyle yayına hazır değil.

**En kritik blokaj:** Ürün kataloğu boş (`products: []`), buna rağmen 14 crawl tamamlanmış. Yani crawl→extract→catalog köprüsü çalıştırılmamış. Part Matcher ve Component Duel gerçek veriyle çalışmıyor.

| Eksen | Durum | Not |
|-------|-------|-----|
| Tech merit | 🟢 İyi | Tip güvenli, tek ağaç, Dify-first tool rotaları |
| Brand impact | 🟡 Riskli | 2 yayın makalesi; site içerik bakımından boş görünür |
| Craft fidelity | 🟡 Orta | UI mevcut ama gerçek veri/görsel/provenance yok |

---

## 2. Spesifikasyona Karşı Durum (CLAUDE.md)

| Spec Hedefi | Beklenen | Gerçekleşen | Durum |
|-------------|----------|-------------|-------|
| AI Agent | 7 | 7 (`src/lib/agents/`) | 🟢 Tam |
| Lib Modülü | 8 | 8 + ekstra (`master-orchestrator`, `response-composer`...) | 🟢 Tam |
| RAG Dataset | 8 | Yönlendirme kodu mevcut; canlı doluluk doğrulanmadı | 🟡 Belirsiz |
| Admin Sekme | 11 | 14 (genişlemiş) | 🟢 Aşıldı |
| Interactive Tool | 5 | 4 aktif + 1 (Flight Critic) deferred | 🟡 Kısmi |
| Affiliate Ağı | 4 partner | Veri modeli var, katalog boş | 🔴 Veri yok |

---

## 3. Kritik Boşluklar (P0 — Yayın Engeli)

**P0-1 · Ürün kataloğu boş.** `data/fpv-products.catalog.json` → `products: []`. Crawl kuyruğunda 14 iş "completed", 19 "pending". Extract adımı (`npm run catalog:extract -- --write`) hiç çalıştırılmamış. Part Matcher ve Component Duel deterministik motorla ayakta ama **gerçek ürün/görsel/fiyat/provenance verisi yok**. NEXT_ACTIONS hedefi: en az 50 kaynak-destekli ürün.
> tech: tool çıktısı boş | brand: "demo gibi" algı | craft: görsel üretim eksik

**P0-2 · İçerik neredeyse yok.** `content/published/` altında **yalnızca 2 makale**, `content-jobs.json` boş. Spec yayın kuralı: min 1200 kelime, SEO≥80. Site şu an boş bir kabuk; SEO/marka değeri oluşmuyor.
> tech: pipeline çalışıyor ama tetiklenmemiş | brand: organik trafik yok | craft: —

**P0-3 · Otomatik test yok.** Hiç `*.test.ts` / `*.spec.ts` yok; yalnızca Playwright smoke script'leri var. Para/affiliate/cron gibi kritik yollar regresyon koruması olmadan deploy ediliyor.
> tech: regresyon riski yüksek | brand: sessiz hata → güven kaybı | craft: —

---

## 4. Yüksek Öncelik (P1)

**P1-1 · Flight Critic deferred.** `/tools/flight-critic` input'u `disabled`. Karar gerekli: gerçek DVR/telemetri Dify workflow'u olmadan yayından kaldır veya "yakında" yerine net konumlandır.

**P1-2 · 19 bekleyen crawl işi.** Kuyrukta işlenmemiş 19 ürün kaynağı. Cron path (`cron/crawl`) ile boşaltılmalı, sonra extract.

**P1-3 · RAG dataset canlı doğrulaması yok.** 8 dataset için yönlendirme kodu var ancak Qdrant'ta gerçek doluluk bu oturumda doğrulanamadı. `dify-health` + retrieval testi gerekli.

**P1-4 · Çalışma zamanı durumu dosya tabanlı.** `data/*.json` (kuyruk, işler, bütçe) Postgres/kalıcı volume yerine dosyada. Coolify yeniden deploy'da kayıp riski.

---

## 5. Orta Öncelik (P2)

- **Lint borcu:** 2 `react-hooks/exhaustive-deps` uyarısı (`ContentAutomationPanel`, `PublishedContentPanel`). Strict CI öncesi temizlenmeli.
- **Perf bütçesi ölçülmüyor:** CLAUDE.md global kontrat LCP<2.5s / INP<200ms / JS<170KB istiyor; CI'da ölçüm yok.
- **Altyapı:** Crawl4AI Docker healthcheck yanlış portu (11235 vs 80) kontrol ediyor; Redis/crawler port açığı; Oracle disk boyutu beklenenden küçük (NEXT_ACTIONS).
- **`.env`/secret hijyeni:** `credentials.json` repo kökünde — `.gitignore` doğrulanmalı.

---

## 6. Sağlam Olan (Regresyon Yok)

- ✅ Typecheck **0 hata** (`tsc --noEmit`)
- ✅ Tek-ağaç (`src/app`, `src/lib`) — eski `app/`/`lib/` decommission edildi
- ✅ Dify-first tool rotaları + deterministik fallback (Blackbox canlı `ok=true` doğrulandı)
- ✅ Müşteriye dönük dilde "AI/Dify/AutoBlog" temizliği yapıldı
- ✅ Cron endpoint'leri shared-secret korumalı
- ✅ 14 admin sekmesi (Intelligence / Monetization / System) operasyonel

---

## 7. Önerilen Sıra (Cheapest-First)

1. **Crawl kuyruğunu boşalt** → `cron/crawl` ile 19 pending işi tamamla.
2. **Extract çalıştır** → `npm run catalog:extract -- --write`; kataloğu ≥50 ürüne çıkar. (P0-1 çözülür)
3. **İçerik üret** → `cron/generate` ile ilk 10–15 makaleyi SEO≥80 ile yayınla. (P0-2 çözülür)
4. **Smoke + minimal test** → affiliate/cron/tool rotalarına ilk birim testleri. (P0-3 başlangıç)
5. **Flight Critic kararı** → kaldır ya da net etiketle. (P1-1)
6. **Runtime state'i Postgres'e taşı** → deploy dayanıklılığı. (P1-4)

---

## 8. Doğrulama Notu

Bu rapor Linux sandbox üzerinden üretildi. `tsc` ve `eslint` çalıştı; `npm run tools:audit` **sandbox'ta** esbuild binary platform uyumsuzluğu (macOS `node_modules`) nedeniyle çalışmadı — bu bir **proje hatası değil**, ortam kısıtı. Gerçek doğrulama için kullanıcının makinesinde `npm run tools:audit` ve `npm run build` koşulmalı.
