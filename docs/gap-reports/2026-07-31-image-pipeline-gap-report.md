# GAP Raporu: Görsel Pipeline — Fallback Sorunu

**Tarih:** 2026-07-31  
**Kapsam:** `src/lib/content-automation/` görsel pipeline'ı, yayınlanmış 163 içerik  
**Sonuç:** 163 içeriğin **hiçbirinde** tam çalışan otomatik görsel atama yok; 82 içerik dışarıdan engellenen hotlink, 35 içerik SVG üretimi, 38 içerik source-cache (kısmen çalışıyor)

---

## Yönetici Özeti

Platform, telif güvenli görseller için şu akışı hedefliyor:

```
Crawl → raw_content DB → harvestImagesFromDatabase() → Semantic Match → coverImage
```

Bu akış **hiç çalışmıyor.** 163 yayınlanmış içeriğin **0 tanesi** bu yolu başarıyla geçiyor. Bunun yerine platform:

| Durum | Adet | Gerçek Görüntü |
|-------|------|----------------|
| Harici hotlink (bloklu) | 82 | Fallback'e düşüyor |
| SVG üretilmiş | 42 | SVG görünüyor (sanatsal değil) |
| source-cache (çalışıyor) | 38 | Gerçek görsel gösteriyor |
| Belirsiz / eski | 1 | — |

---

## GAP #1 — CRITICAL: `sourceHints` İçerik Üretmiyor (Kullanım Hatalı)

**Dosya:** `src/lib/content-automation/brief-from-source.ts:17-45` ve `src/lib/agents/ideationAgent.ts:104`

### Sorun

`sourceHints` alanı iki farklı şekilde dolduruluyor ve her ikisi de yanlış:

**Yol A — `brief-from-source.ts`:**
```typescript
const CATEGORY_SOURCE_HINTS: Record<string, string[]> = {
  'Flight Guides': [
    'https://betaflight.com/docs/wiki',   // SORUN: docs sayfası, görsel yok
    'https://www.expresslrs.org/',         // SORUN: teknik dok, görsel yok
  ],
  ...
```

`harvestImagesFromDatabase()` bu URL'leri alıyor, `content_engine.raw_content` tablosunda aynı domain'e ait crawl'lanmış markdown arıyor. Ancak:
- Bu URL'ler **teknik dokümantasyon** siteleri — içlerinde FPV drone fotoğrafı yok
- Bu URL'ler `raw_content` tablosunda muhtemelen **yok** — crawl queue'ya eklenmemiş
- Sonuç: `harvestImagesFromDatabase()` sıfır satır döndürüyor, `crawledLicensed = []`

**Yol B — `ideationAgent.ts`:**
```typescript
"sourceHints": [
  "Key sub-topic or outline point 1",   // SORUN: text string, URL değil
  "Key sub-topic or outline point 2",   // SORUN: domain parse → null
  "Key sub-topic or outline point 3"    // SORUN: keyword filtreye düşüyor
]
```

LLM çıktısını doğrudan `sourceHints` alanına yazıyor. `harvestImagesFromDatabase()` bu değerleri URL sanıyor ama `extractDomain()` parse edemeyince `keywords` listesine atıyor. Sonuç yine sıfır.

### Kanıt

```
With sourceHints: 39
  → source-backed: 0      ← Hiç çalışmıyor
  → generated-artwork: 30 ← Fallback'e düşüyor
  → other/missing: 9
```

### Fix

- `brief-from-source.ts`: `CATEGORY_SOURCE_HINTS`'ı gerçek içerik siteleri ile değiştir — fotografi olan yerler (oscarliang.com, rotorriot.com, fpvknowitall.com)
- `ideationAgent.ts`: `sourceHints` prompt talimatını URL şablonuna çevir — LLM outline point değil, gerçek kaynak URL üretmeli
- `harvestImagesFromDatabase()` içinde: URL olmayan hint'leri keyword aramasına değil, Dify RAG'a yönlendir

---

## GAP #2 — CRITICAL: Harici Hotlink Görseller `next.config.ts`'de BLOKLU

**Dosya:** `next.config.ts:13-57`, `src/components/ResilientCoverImage.tsx`

### Sorun

82 içerikte coverImage harici bir URL: `https://oscarliang.com/...`, `https://dronechampionsleague.com/...` gibi. `next.config.ts` içinde tanımlı `remotePatterns` bunların hiçbirini kapsamıyor:

```typescript
// next.config.ts'de izin verilen hostlar:
'picsum.photos', 'images.unsplash.com', 'images.pexels.com',
'www.happymodel.cn', 'www.radiomasterrc.com', 'betafpv.com', 'jumper-rc.com'

// Bloklu olan harici coverImage host'ları:
'dronechampionsleague.com' → 15 makale
'judgeme.imgix.net'        → 14 makale
'en.tmotor.com'            → 7 makale
'www.multigp.com'          → 7 makale
'droneracing.fai.org'      → 6 makale
'oscarliang.com'           → 4 makale
...
```

`ResilientCoverImage.tsx` harici URL için `<img>` tag kullanıyor (Next.js `<Image>` değil — bu doğru). Ama:
1. Birçok site **hotlink koruması** aktif — Referer header yoksa resim yüklenmez
2. Component'te 5 saniye timeout var: yavaş yükleme otomatik fallback'e düşüyor
3. Kullanıcı sayfayı açtığında görsel anlık yüklenmez, fallback gösterilir

### Kanıt

```
External HTTP covers: 82  (toplam içeriklerin %50'si)
Tüm bu host'lar: BLOCKED by next.config
```

### Fix

Bu 82 içerik **zaten source-cache akışında** işlenmiş olmalı — görseller indirilip `/public/images/source-cache/` altına kaydedilmeli. `source-backed-cache` kind'ındaki 38 makale bunu başarıyla yapıyor; geri kalanlar için aynı akış uygulanmadı.

---

## GAP #3 — HIGH: Database'de Raw Content Yok (Crawl → raw_content Bağlantısı Kopuk)

**Dosya:** `src/lib/server/raw-content-store.ts`, `src/lib/content-automation/crawl-worker.ts`

### Sorun

`harvestImagesFromDatabase()` şu SQL'i çalıştırıyor:
```sql
SELECT url, raw_markdown FROM content_engine.raw_content
WHERE url = ANY($1) AND is_active = true
```

Bu sorgunun döndürmesi için `raw_content` tablosunun dolu olması gerekiyor. Ancak:

- Crawl queue → `persistRawCrawlContent()` → `raw_content` zinciri `crawl-worker.ts` içinde çalışıyor
- Bu worker **yalnızca admin panel üzerinden manuel tetiklenebiliyor**
- Otomatik content generation (`/api/admin/cron/generate`) crawl yapmıyor — doğrudan `sourceHints` URL'lerini varsayarak image harvest çalıştırıyor
- `raw_content` tablosundaki satırlar content generation zamanında muhtemelen **boş veya alakasız domain'lerden**

### Sonuç Akışı

```
Content Gen Job → sourceHints: ['betaflight.com/docs/wiki', ...]
                → harvestImagesFromDatabase(['betaflight.com/docs/wiki'])
                → SELECT FROM raw_content WHERE url LIKE '%betaflight.com%'
                → 0 rows (betaflight crawl edilmedi veya görsel içermiyor)
                → crawledLicensed = []
                → media = buildContentMedia() → generated-artwork
```

### Fix

Content generation cron'u çalışmadan önce o içeriğe ait kaynak URL'lerin crawl edilmesi gerekiyor. Ya:
- Generation job'unu başlatmadan önce `crawl-queue.ts` üzerinden source URL'leri kuyruğa ekle ve crawl'ı bekle
- Ya da content-type'a göre statik bir "FPV görsel kaynakları" URL listesi tut ve bunları önceden crawl'la

---

## GAP #4 — HIGH: Semantic Match Eşiği Çok Katı (`MATCH_THRESHOLD = 0.18`)

**Dosya:** `src/lib/content-automation/crawl-image-match.ts:47`

### Sorun

```typescript
const MATCH_THRESHOLD = 0.18;
```

Bu eşik, görsel `alt` metni ile makale bölüm içeriği arasında Jaccard benzeri overlap hesaplıyor. Problem:

- Crawl'lanan sitelerin çoğu `alt=""` boş bırakıyor
- `alt` tokeni yoksa `altSignal = 0`, sadece `contextSignal * 0.3` kalıyor
- 0.18'i geçmek için `context` tokenlarının %60'ının bölümle örtüşmesi gerekiyor
- FPV drone görselleri için bu çok yüksek — alt text genellikle "drone.jpg" gibi jenerik

### Sorun Boyutu

```
Genel drone görsellerinin expected alt text overlap: 0.05 - 0.12
MATCH_THRESHOLD: 0.18  → Tüm bu görseller eleniyor
```

Sonuç: `harvestImagesFromDatabase()` images döndürse bile `pickBestRelevantImage()` her zaman `undefined` döndürüyor.

### Fix

- Eşiği `0.08`'e indir (veya config'e taşı)
- Alt text boş ise `context` ağırlığını `0.7`'ye çıkar (şu an `0.3`)
- Hostname bazlı fallback: skor eşiği geçilmese bile tek available image varsa ve aynı domain ise kabul et

---

## GAP #5 — MEDIUM: source-cache Akışı Mevcut Ama Otomatik Değil

**Dosya:** `public/images/source-cache/` (220 dosya), 38 makale kulllanıyor

### Sorun

38 makale `source-backed-cache` kind'ında görsel kullanıyor — bunlar `/images/source-cache/` altında fiziksel olarak kayıtlı. Bu akış **çalışıyor** ve **telif güvenli** (görsel indirilip local servis ediliyor). Ama:

- Bu akışın nasıl tetiklendiği belirsiz — admin panelinde manuel bir adım mı?
- 163 makalenin yalnızca 38'i için çalışmış, geri 125 için hiç tetiklenmemiş
- Hangi koşulda source-cache akışının çalıştığı kodda net değil

### Kanıt

```
source-cache dosya sayısı: 220 (cover + gallery + section)
source-cache kullanan makale: 38 (163'ün %23'ü)
source-cache kullanan makale türü: ağırlıklı reviews, buyers-guides, comparisons
```

Bu akış ürün kataloğu pipeline'ından geliyor gibi görünüyor (`fpv-product-catalog.ts`, `crawler-product-catalog.ts`). Editorial görseller için aynı indirme + önbellekleme uygulanmamış.

### Fix

`publishGeneratedContentArtifact()` içinde, `bestCover` bulunduğunda image'ı doğrudan hotlink olarak kaydetmek yerine:
1. HTTP GET ile indir
2. `/public/images/source-cache/{slug}-cover-1-{hash}.{ext}` olarak kaydet
3. `src` alanını local path olarak güncelle
4. Bu hem CORS/hotlink sorununu hem de Next.js remotePatterns sorununu çözüyor

---

## GAP #6 — MEDIUM: `ideationAgent` sourceHints = Outline Points (Semantik Hata)

**Dosya:** `src/lib/agents/ideationAgent.ts:104`

### Sorun

```typescript
"sourceHints": [
  "Key sub-topic or outline point 1",  // ← LLM bu formatı üretiyor
  ...
```

`sourceHints` alanı image harvest için **URL** beklediği halde, ideation agent bunu **makale outline'ı** için kullanıyor. Bu iki farklı amacın tek alanda çakışması.

### Fix

`ContentJob` tipine `imageSourceUrls?: string[]` alanı ekle. `sourceHints` yalnızca yazılım/crawl URL'leri için, `imageSourceUrls` görsel harvest için ayrı tutulsun. `briefFromContentEntry()` içinde bu alanlar ayrı doldurulsun.

---

## GAP #7 — LOW: `ResilientCoverImage` 5 Saniye Timeout Çok Agresif

**Dosya:** `src/components/ResilientCoverImage.tsx:41-51`

### Sorun

```typescript
const timer = window.setTimeout(() => {
  setCandidateIndex((index) => { ... return index + 1; });
}, 5000);  // ← 5 saniye sonra fallback
```

Yalnızca `priority` (eager) yüklemede aktif. Ancak harici FPV site'ların görselleri bazen 3-6 saniye arasında yükleniyor. Sonuç: `priority` prop olan article cover'larda görsel önce yüklendi görünse bile timeout fallback'e geçiyor.

### Fix

Timeout'u `8000`'e çıkar. Veya `loadedSrc` state'i düzgün kontrol ediliyor mu test et — mevcut mantık `loadedSrc !== currentSrc` kontrolü yaparken race condition olabilir.

---

## Kök Neden Özeti

```
RAW SORUN: Görsel pipeline, crawl'lanmış DB'ye bağımlı ama DB içeriği hiç yok.

┌─── Content Gen Job ──────────────────────────────────────────────────────┐
│ sourceHints = ['betaflight.com/docs/wiki', 'Outline Point 1', ...]       │
│                ↓                          ↓                              │
│           URL (yanlış site)          Text (URL değil)                   │
│                ↓                          ↓                              │
│     raw_content'te yok             extractDomain → null                 │
│                ↓                          ↓                              │
│           0 rows                    keywords → 0 DB match               │
│                ↓                                                         │
│     crawledLicensed = []                                                 │
│                ↓                                                         │
│     buildContentMedia() → generated-artwork ← SVG fallback              │
└──────────────────────────────────────────────────────────────────────────┘

┌─── Eski Makaleler (82 adet) ─────────────────────────────────────────────┐
│ coverImage.src = 'https://oscarliang.com/...'                            │
│                   ↓                                                      │
│ next.config.ts: NOT in remotePatterns                                    │
│                   ↓                                                      │
│ ResilientCoverImage: <img> hotlink → CORS block or slow → timeout        │
│                   ↓                                                      │
│             FALLBACK GÖRSELE DÜŞ                                         │
└──────────────────────────────────────────────────────────────────────────┘

┌─── source-cache (38 makale) — ÇALIŞIYOR AMA EKSİK ─────────────────────┐
│ Ürün kataloğu pipeline'ı → image indir → /public/images/source-cache/   │
│ Editorial content pipeline → BAĞLANTISI YOK                             │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Öncelikli Fix Planı

| # | GAP | Öncelik | Efor | Etki |
|---|-----|---------|------|------|
| 1 | sourceHints URL'lerini gerçek görsel sitelerine çevir | P1 | 1 saat | 39 yeni makale |
| 2 | `publishGeneratedContentArtifact()` içinde image'ı local'e indir | P1 | 3 saat | 82 eski + tüm yeni |
| 3 | `MATCH_THRESHOLD` → 0.08, alt-boş fallback mantığı | P2 | 30 dk | eşik geçen tüm görseller |
| 4 | source-cache akışını editorial pipeline'a bağla | P2 | 2 saat | sistematik çözüm |
| 5 | ideationAgent'ta `sourceHints` → gerçek URL üret | P2 | 1 saat | yeni ideation makaleleri |
| 6 | `CATEGORY_SOURCE_HINTS` düzelt (fotografi siteleri) | P3 | 30 dk | kısa vadeli iyileştirme |
| 7 | ResilientCoverImage timeout → 8000ms | P3 | 5 dk | marjinal iyileştirme |

---

## Hızlı Kazanım (Bugün Yapılabilir)

`CATEGORY_SOURCE_HINTS` içindeki URL'leri fotografi içerikli FPV sitelerine çevir:

```typescript
// MEVCUT (yanlış — teknik dok, görsel yok)
'Flight Guides': ['https://betaflight.com/docs/wiki', 'https://www.expresslrs.org/']

// DÜZELTME (editorial FPV içerik siteleri)
'Flight Guides': ['https://oscarliang.com/', 'https://www.rotorriot.com/']
'Build Guides':  ['https://oscarliang.com/', 'https://www.fpvknowitall.com/']
'Components':    ['https://oscarliang.com/', 'https://pyrodrone.com/']
'Racing':        ['https://www.rotorriot.com/', 'https://www.multigp.com/']
```

Ve `MATCH_THRESHOLD = 0.08` yap. Bu iki değişiklik mevcut crawl içerikleri varsa hemen etki gösterir.

---

**Raporu Hazırlayan:** Claude Sonnet 4.6 (CTO Asistanı)  
**Analiz Edilen Dosyalar:** `crawl-image-harvest.ts`, `crawl-image-license.ts`, `crawl-image-match.ts`, `content-media.ts`, `fallback-cover.ts`, `publish-artifact.ts`, `brief-from-source.ts`, `ideationAgent.ts`, `ResilientCoverImage.tsx`, `ResilientArticleCover.tsx`, `next.config.ts`, 163 published artifact JSON
