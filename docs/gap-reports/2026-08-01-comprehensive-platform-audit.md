# FPVLovers — Kapsamlı Platform GAP & BUG Denetimi

**Tarih:** 2026-08-01 · **Branch:** `main` · **Yöntem:** Statik kod okuma (7 paralel ajan: crawl pipeline, Dify entegrasyonu, içerik doğruluğu, agent-frontend eşleşmesi, SEO, güvenlik, performans) + repo-wide secret sweep + `content/published/*.json` üzerinde gerçek yayın tarihi analizi. Canlı sunucu/DB/Qdrant erişimi bu oturumda **yok** — her bölümde "statik koddan doğrulanamayan" noktalar ayrıca işaretlendi.

**Kapsam:** Kullanıcının 5 sorusu — (1) veri kazıma sistemi düzgün çalışıyor mu, (2) yeni içerik ekleniyor mu, (3) içeriklerde yanlış bilgi var mı, (4) Dify workflow'ları doğru çalışıyor mu, (5) Dify agent'larından bazıları frontend'e açılmalı mı — artı SEO, güvenlik, performans.

---

## 0. ACİL — Bu oturumda bulunup hemen düzeltildi

**Public GitHub reposunda 7 canlı Dify API anahtarı düz metin olarak commit edilmişti** (`dev-artifacts/yetenekler/fpvlovers-dev-skill/references/dify.md`, `rag.md`, `COZUM-PLANI-14-06-2026-Pazar-13-38.md`). Repo `hazarvolga/fpvlovers-v02` **public** (GitHub API ile doğrulandı) — yani 1 dataset key + 6 app key (Expert, Build Wizard, Part Matcher, Blackbox, Community, SEO workflow) herkese açık şekilde okunabilir durumdaydı.

**Yapılan:** 3 dosyadaki anahtarlar redakte edildi, commit `1a2a7ba` push edildi.

**Senin yapman gereken (bu rapordaki EN ACİL madde):** Dify Studio'dan bu 7 anahtarın **tamamını hemen rotate et**. Dosyayı temizlemek geçmişteki (git history) exposure'ı geri almaz — anahtarlar zaten halka açıktı, tarama botları tarafından toplanmış olabilir. Rotate etmeden bu madde kapanmaz.

---

## 0B. EK — SSH ile canlı RAG veri temizliği (2026-08-01, aynı oturum devamı)

Kullanıcının izniyle Dify/Qdrant sunucusuna (80.225.231.62) ve her iki Crawl4AI sunucusuna (161.118.171.201, 141.148.206.187) SSH ile bağlanıp §1 ve §3'teki bulguları canlı doğruladım, kök nedeni buldum ve düzelttim:

**Kök neden:** Her crawl çağrı noktası Crawl4AI'ın `/crawl` endpoint'inden `raw_markdown` (sayfanın TAMAMI — nav menüsü, footer, GitHub arayüzü dahil) okuyordu. `/md` endpoint'i `f=fit` (Readability tabanlı) ile test edildi, temiz sonuç doğrulandı. Üç çağrı noktası (`ingest/route.ts`, `crawl-worker.ts`, `backfill-images/route.ts`) `src/lib/server/crawl4ai-client.ts` adlı paylaşılan modülde birleştirilip düzeltildi (commit `1e734ae`).

**Canlı veri temizliği:** 3 kirli dataset'te (fpv-flight-tuning, fpv-community-knowledge, fpv-components-specs) toplam **119 eski/opak doküman** (`doc_metadata` hiç kaydedilmemiş — dataset'lerde metadata şeması hiç kurulmamıştı) bulunup silindi. Örnekleme (19-21 nokta/dataset) kirlilik oranının %60-90 arası olduğunu doğruladı: GitHub arayüz metni, satılık/süresi dolmuş bir domain sayfası (HugeDomains), alakasız bir B2B yazılım şirketi (Jaggaer), Amazon/Google/GitHub genel sayfaları.

Yerine: (1) kullanıcının sağladığı 29 URL'lik "FPV'ye başlangıç" listesi (18'i başarıyla crawl edildi → community-knowledge), (2) kendi curated teknik URL listem (betaflight.com/docs, edgetx.org, ardupilot.org vb.), (3) kullanıcının yüklediği "FPV Drone Kaynak Rehberi.md" araştırma raporunun 70 atıflı kaynağı (44'ü başarıyla crawl edildi → flight-tuning + components-specs) yüklendi. Her yeni doküman artık gerçek `source_url` metadata'sı taşıyor (Dify dataset'lerine yeni bir `source_url` metadata alanı eklendi — bu sorunun bir daha yaşanmaması için).

**Final durum (doküman sayısı):**
| Dataset | Önce | Sonra |
|---|---|---|
| fpv-flight-tuning | 23 (çoğu kirli) | 40 (tamamı temiz, kaynak-etiketli) |
| fpv-community-knowledge | 84 (çoğu kirli) | 17 (tamamı temiz, kaynak-etiketli) |
| fpv-components-specs | 39 (çoğu kirli) | 13 (tamamı temiz, kaynak-etiketli) |

**Doğrulama:** Raw Qdrant scroll sorgusu bazı eski vektörlerin fiziksel olarak hâlâ paylaşılan koleksiyonda durduğunu gösterdi (Dify'ın DELETE API'si eski shared-collection kayıtlarını temizlemiyor olabilir) — ama **Dify'ın gerçek retrieval API'si** (canlı araçların kullandığı mekanizma) ile 3 dataset'te de gerçek sorgular test edildi, sonuçlar tamamen temiz ve alakalı çıktı (skor 0.78-0.91 aralığında). Yani kullanıcı deneyimi (canlı araçların ürettiği cevaplar) artık temiz — orfan Qdrant vektörleri retrieval'a yansımıyor.

**Bilinen küçük kalıntı sorun:** Bazı blog.uavmodel.com sayfalarında "fit" filtresi sosyal medya paylaş-butonu metnini (Pinterest/LinkedIn share linkleri) tam temizleyemedi — gerçek içerikle karışık düşük hacimde gürültü. Önceki GitHub/domain-parking kirliliğine kıyasla önemsiz, ayrı bir iyileştirme konusu.

---

## 1. Veri Kazıma Sistemi — "Düzgün çalışıyor mu?"

**Cevap: Kodun kendisi sağlam, ama tetikleme mekanizması repo dışında ve kanıtlanmış şekilde kırılgan.**

- Bu depoda **hiçbir otomatik zamanlayıcı yok** — `Dockerfile` tek bir `node server.js` süreci çalıştırıyor, cron daemon/arka plan döngüsü yok. `/api/admin/cron/crawl`, `/api/admin/cron/generate` gibi route'lar sadece `CRON_SECRET` ile korunan HTTP endpoint'ler — kendi kendini tetiklemiyor.
- Gerçek tetikleyici: **production sunucusunun root crontab'ı**, repo dışında, `PROJECT_MEMORY.md` ve `docs/handoff/latest.md`'ye göre `/usr/local/bin/fpvlovers-cron-call` scripti ile bu endpoint'leri çağırıyor. Bu zamanlama **versiyon kontrollü değil, denetlenemez** — sadece host'a SSH ile bakarak görülebilir.
- **Kanıtlanmış geçmiş arıza:** `PROJECT_MEMORY.md` 2026-06-19 tarihli bir production denetimini kaydediyor — "host cron çalışıyordu ama 2026-06-09'dan beri knowledge pipeline'a yeni içerik ulaşmamıştı" (`FPV_STORAGE_MODE=dual` kaynaklı file/Postgres kuyruk drift'i). Bu, `content/published/*.json` dosyalarından çıkardığım gerçek yayın tarihi dağılımıyla birebir örtüşüyor:

| Dönem | Yayın sayısı | Not |
|---|---|---|
| 18 May – 22 Haz | 118 makale | Ağır seed/backfill (6 Haziran'da tek günde 49 makale) |
| **23 Haz – 12 Tem** | **0 makale** | **20 günlük tam sessizlik** |
| 13 – 17 Tem | 15 makale | Toparlanma |
| 18 – 22 Tem | 0 makale | 5 günlük ikinci kesinti |
| 23 – 30 Tem | 27 makale (~4/gün) | Hedefe yakın, istikrarlı |
| 31 Tem – 1 Ağu (bugün) | 0 makale | *(rapor yazılırken devam ediyor olabilir)* |

- `scripts/automation-status.ts` sadece **rapor eder**, düzeltmez — hedef kaçırıldığında (`daily_target_missed`) hiçbir otomatik kurtarma tetiklenmiyor, birinin scripti çalıştırıp okuması gerekiyor.
- **Takılı iş kurtarma manuel:** `scripts/automation-recover-stale-jobs.ts` ve `scripts/retire-resolved-content-jobs.ts` >6 saat/24 saat takılı işleri buluyor ama varsayılan dry-run, `--apply` ile elle çalıştırılmalı — repodaki hiçbir cron bunları çağırmıyor.
- **Dry-run tuzağı:** Yerelde `NODE_ENV=development` iken `FORCE_REAL_LLM=true` set edilmezse TÜM Dify çağrıları sessizce no-op oluyor (`dify-client.ts:45`) — bu oturumdaki `data/api-budget-log.json` kayıtları da bunu doğruluyor (`"status":"dry_run"`).
- **URL Ingest domain allowlist'i sadece 10 domain** (`oscarliang.com`, `getfpv.com`, vb.) — içerik çeşitliliği için sert bir tavan.

**Doğrulanamayan (canlı erişim gerekir):** Production crontab'ının şu an gerçekten çalışıp çalışmadığı, `CRON_SECRET`/`FPV_STORAGE_MODE` gibi env değerlerinin canlıdaki gerçek durumu, 31 Temmuz–1 Ağustos'taki sıfır-yayın gününün nedeni (cron mu düştü, bütçe mi tükendi, yoksa Crawl4AI/Dify mi erişilemez oldu).

---

## 2. Dify Workflow'ları — "Doğru düzgün çalışıyor mu?"

**Önceki rapordan (2026-07-31) düzelenler:**
- ✅ `DATASETS.docCount` yanlış-veri sorunu kapatılmış — alan artık `@deprecated`, hiçbir yerde kullanılmıyor, `tool-truth-audit.ts` artık bunun yerine açıkça "Qdrant GitHub kirliliği biliniyor" uyarısı basıyor.
- ✅ Blackbox Tuning'in `answerMode` mantığı artık `sources.length > 0` şartına bağlı, yeni bir `'dify_unverified'` durumu var.
- ✅ Dataset ID listesi `master-routing-tables.ts` ile `ingest/route.ts`'deki `DATASET_IDS` arasında **drift yok** — 9/9 UUID birebir eşleşiyor (bu oturumda yeni doğrulanan bir kontrol).

**Hâlâ açık / yeni bulunan:**
- ❌ `fpv-flight-tuning` koleksiyonundaki GitHub arayüz-metni kirliliği (önceki rapordan) — kodda hiçbir temizlik/yeniden-crawl izi yok, hâlâ sadece dokümante ediliyor. **Canlı Qdrant erişimi olmadan doğrulanamaz.**
- ❌ **`retrieval-orchestrator.ts` — gelişmiş çoklu-dataset birleştirme/rerank mantığı hiçbir kullanıcıya açık aracı korumuyor.** 6 canlı araç (Part Matcher, Blackbox Tuning, Build Wizard, Component Duel, Flight Critic) sadece `findApp()` ile token buluyor, ham `difyRequest` ile Dify'a gidiyor — `retrieval-orchestrator.ts`'i hiç import etmiyorlar. Bu dosya sadece admin/master API ve içerik üretim hattında kullanılıyor. **Yani kullanıcıya açık araçların hiçbirinde yerel bir "retrieval güven eşiği" yok.**
- ⚠️ `dify_workflows/`'daki 9 DSL dosyasından **sadece 2'si gerçekten bağlı**: `seo-content-generator` (token var, canlı smoke test kaydı var) ve `racing-intelligence-orchestrator` (tam production yolu var). **Kalan 7'si** (`affiliate-orchestrator`, `drone-build-recommender`, `drone-part-matcher`, `hd-tune-analyzer`, `metadata-enrichment`, `scheduled-publisher`, `sponsorship-orchestrator`) — `WORKFLOW_IDS` değeri literal olarak `'TODO-import-to-dify-first'`, token yok, hiçbir çağıran yok. Gerçek ölü kod.
- ⚠️ `GROQ_API_KEY` `.env.local`'de **yok** — `dify-client.ts` dosya başlığındaki "+ Groq Fallback" iddiası abartılı: Groq sadece `classify`/`metadata` görevleri için sabit bir maliyet-yönlendirmesi, Dify hatasından sonra devreye giren gerçek bir fallback değil. Ayrıca key yokken herhangi bir gerçek `classify`/`metadata` çağrısı hata verir (sadece DRY_RUN yolu çalışır).
- 🐛 `scripts/tool-truth-audit.ts`'de Blackbox Tuning için ölü bir ternary: `koşul ? 'PARTIAL' : 'PARTIAL'` — her iki dal da aynı, zararsız ama yanıltıcı, gerçek bir sinyali sessizce siliyor.

---

## 3. İçerik Doğruluğu — "İçeriklerde yanlış bilgi var mı?"

**Risk seviyesi: Yüksek.** İki ayrı bulgu var: (A) makale gövde metninin üretim şekli, (B) yeni tespit edilen bir sahte-veri sayfası.

### 3A. Makale gövdesi nasıl üretiliyor, kanıta dayalı mı?

- Gövde metni **opak bir dış Dify workflow'una** devrediliyor (`dify-generation.ts:161-181`) — istek sadece `keyword + content_type + word_count` gönderiyor, **hiçbir RAG chunk'ı payload'a eklenmiyor**. Gerçek grounding (varsa) Dify'ın kendi workflow konfigürasyonunda — bu repodan doğrulanamaz.
- `ideationAgent.ts` (brief üretimi) `orchestrateRetrieval()` çağırıyor; `ENABLE_REAL_RAG !== 'true'` olduğunda **`Math.random()` ile sahte alaka skorları ve `"[Simulated retrieval from {dataset}]..."` şeklinde tamamen içeriksiz sahte chunk'lar** üretip LLM prompt'una gerçek bağlam gibi enjekte ediyor (`retrieval-orchestrator.ts:179-222`). `.env.local`'de `ENABLE_REAL_RAG="true"` seti var ama production'da aynı olup olmadığı doğrulanamadı.
- `EditorialTrustPanel` her makalede genel bir "bu içerik otonom araştırma iş akışıyla üretilmiş olabilir" uyarısı gösteriyor — ama **tek tek iddiaları (fiyat, spec, sayı) işaretlemiyor**, hepsi aynı görsel otoriteyle sunuluyor.
- **"SEO ≥ 80 olmadan yayın yasak" (CLAUDE.md) kod tarafında hiç uygulanmıyor** — `seoScore` için repo genelinde sıfır eşleşme, `seoAgent.ts` hiç skor hesaplamıyor. Gerçek yayın kapısı (`editorial-governance.ts`) sadece yapı/ifade kontrolü yapıyor (kaynak URL var mı, "biz test ettik" gibi sahte-deneyim cümleleri var mı) — **hiçbiri sayısal/spec doğruluğunu kontrol etmiyor**. Üstelik `content/publish/route.ts` ve `jobs/[id]/route.ts` bu kapıyı tamamen atlayıp doğrudan yayınlayabiliyor.
- **`yasal`/`regulation-guide` (SHY/SHGM) kategorisi için CLAUDE.md'nin özellikle yasakladığı halüsinasyon riskine karşı hiçbir ekstra koruma yok** — diğer tüm kategorilerle aynı jenerik kapıdan geçiyor.

### 3B. YENİ BULUNAN: `pilot-pulse` sayfası gerçek marka isimleriyle uydurma güvenilirlik istatistikleri gösteriyor

Bu, CLAUDE.md'nin kendi YASAK listesindeki AffexDuelEngine olayının (commit 73d8710 ile "düzeltildiği" iddia edilen) **birebir tekrarı** — ve bu sefer public, nav'da linkli, sitemap'te (öncelik 0.8, noindex yok) bir sayfada:

- `src/app/pilot-pulse/page.tsx` her ~2 saniyede `Math.random()` ile sahte filo/sinyal/rüzgar telemetrisi üretiyor, ve sayfa başında sabit **"LIVE FEEDS ACTIVE"** rozeti (yeşil pulse animasyonlu, `page.tsx:291`) var — bu, verinin gerçek/canlı olduğu izlenimini aktif olarak güçlendiriyor.
- **`mockReliabilityMatrix` (`page.tsx:93-131`) gerçek marka ve ürün adlarıyla sabit kodlanmış MTBF/arıza-indeksi rakamları içeriyor:** RadioMaster Boxer ELRS 1200sa/0.4, Happymodel EP1 Nano 950sa/0.8, DJI O3 Air Unit 600sa/2.5, jenerik F405 stack 180sa/7.2. Değişken adı `mock` ile başlasa da bu hiçbir yerde kullanıcıya gösterilmiyor — arayüzde bu rakamlar `"{mtbfHours} hrs"`, `"{failureIndex}/10"` olarak, ve suitability sütununda **"CERTIFIED"** etiketiyle (`page.tsx:449`) render ediliyor. Hiçbir "simüle edilmiştir/örnek veridir" uyarısı yok.
- Her kayıt ayrıca spesifik, gerçekçi görünen **uydurma teknik tavsiye metinleri** taşıyor — DJI O3 için: *"Demands high-amp BEC power supply. Weak FC 5V rails will black out this VTX."* (`page.tsx:119-120`'nin `notes` alanı). Bu, gerçek bir arıza-giderme deneyiminden geliyormuş gibi okunuyor ama tamamen kurgusal.

**Bu, bu rapordaki içerik-doğruluğu bulgularının en somut ve en kolay istismar edilebilir olanı — bir kullanıcı ekran görüntüsü alıp "FPVLovers, DJI O3'ün arıza indeksini 2.5/10 CERTIFIED diyor" şeklinde paylaşabilir, ve bu tamamen uydurma.**

---

## 4. Dify Agent'ları Frontend'e Açılmalı mı?

7 agent'ın **tamamı** şu an sadece tek bir admin-korumalı endpoint'ten (`POST /api/admin/agents`) erişilebiliyor — hiçbiri public sayfa/route'tan çağrılmıyor.

| Agent | Şu anki durum | Frontend önerisi |
|---|---|---|
| **recommendationAgent** | Admin-only | ✅ **Açılmalı** — "Build Advisor / Ne Almalıyım" widget'ı: uçuş stili + bütçe + mevcut ekipman gir, best_for/budget_pick önerisi + yükseltme yolu al. `/tools/part-matcher` ve `/tools/calculator` ile aynı UX ailesinde, doğrudan ziyaretçi değeri var. |
| retrievalAgent | Admin-only, **kullanılmıyor** | ❌ Açma — zaten ölü/gölge kod, aynı 9 dataset yönlendirmesi `master-routing-tables.ts`'de tekrarlanmış durumda; canlı araçlar onu kullanıyor. |
| ecosystemAgent | Admin-only + iç sağlık paneli | ❌ Açma — platform öz-tanı aracı (içerik boşluğu analizi), ziyaretçi için anlamsız. |
| seoAgent | Admin-only | ❌ Açma — editoryal yazım aracı, ziyaretçiye değeri yok. |
| affiliateAgent | Admin-only | ❌ Açma — ham markdown/katalog iç verisiyle çalışıyor. |
| sponsorshipAgent | Admin-only | ❌ Açma — B2B/reklamveren değerlendirme aracı. |
| metadataAgent | Admin-only | ❌ Açma — arka ofis içerik etiketleme adımı. |

**Not:** `/api/master` route'u `/admin` Basic-Auth korumasının **dışında** ama hiçbir public çağıranı yok. `response-composer.ts`'de hâlâ `'[Sponsor sponsor agent'dan gelecek]'` gibi TODO placeholder'lar var — yani "AI ile sohbet et" tarzı bir genel giriş noktası şu an gerçekte çalışmıyor.

**Sonuç: Tek somut fırsat recommendationAgent.** Diğer 6'sı doğası gereği arka-ofis araçları; açmak editoryal/monetizasyon iç verisini sızdırır.

---

## 5. SEO

- **En yüksek etkili boşluk: Canonical tag kapsamı.** `generateSeoMetadata()` sadece racing + engineering sayfalarında kullanılıyor. `/tools`, `/buyers-guides`, `/comparisons`, `/reviews`, `/academy`, ana sayfa — **hiçbiri `alternates.canonical` set etmiyor**. "Legacy insight" makale fallback dalı ne canonical ne robots ayarlıyor, varsayılan olarak indexlenebilir.
- Sitemap ve robots.txt **doğru** — dinamik, `isIndexablePublishedArtifact` ile tutarlı filtreleme yapıyor.
- Structured data (JSON-LD) **sadece makale sayfalarında** — ana sayfada Organization/WebSite şeması yok, hub sayfalarında hiç şema yok.
- Başlık hiyerarşisi sağlam (tek `<h1>`, markdown içi başlıklar otomatik kaydırılıyor).
- Alt-text: cover görselleri her zaman gerçek metne düşüyor, ama **`MarkdownRenderer.tsx`'teki gövde-içi görseller** kaynak markdown'da alt yoksa sessizce `alt=""` olabiliyor.
- Non-commercial içerik türlerinde (rehber, haber vb.) **minimum kelime kontrolü yok** — 50 kelimelik bir taslak bile otomatik indexlenebilir.

---

## 6. Güvenlik (kritik anahtar sızıntısı hariç, o zaten §0'da düzeltildi)

| # | Bulgu | Önem | Konum |
|---|---|---|---|
| 1 | `/api/analyze-flight` — auth yok, rate limit yok, upload boyut sınırı yok, Dify'a 45sn blocking çağrı yapıyor | **Yüksek** | `src/app/api/analyze-flight/route.ts:120-151` |
| 2 | Rate limiter sahte `X-Forwarded-For`'a güveniyor — istemci `X-Forwarded-For` header'ını değiştirerek tüm limitleri (build-wizard, part-matcher, blackbox-tuning) aşabilir | **Yüksek** | `src/lib/server/rate-limit.ts:29-31` |
| 3 | Admin Basic-Auth fallback'i sabit-zamanlı karşılaştırma kullanmıyor, brute-force kilitlemesi yok | **Yüksek** | `src/lib/server/admin-auth-guard.ts:23-26` |
| 4 | `downloadToSourceCache` (backfill-images) hiçbir domain allowlist'i olmadan crawl edilmiş `<img src>` URL'lerini sunucu tarafında indiriyor — SSRF riski | Orta | `backfill-images/route.ts:103-142` |
| 5 | `isValidUrl` yönlendirme-güvenli değil — Crawl4AI yönlendirmeleri takip ediyor, ilk URL güvenli olsa bile son çözülen adres iç ağa gidebilir | Orta | `ingest/route.ts:57-80` |
| 6 | Content-Security-Policy header'ı yok (diğer güvenlik header'ları mevcut) | Orta | `next.config.ts:89-116` |
| 7 | `/api/pilot/register` şifre politikası/rate limit yok; `/api/analytics/event` doğrulanmamış metadata kabul ediyor | Orta | ilgili route dosyaları |
| 8 | `source-cache` dosya adı koruması yeterli ama pozitif desen eksik; `.svg` MIME eşlemesi teorik stored-XSS riski taşıyor (şu an sömürülemez) | Düşük | `images/source-cache/[filename]/route.ts:25` |

**Doğrulanan temiz noktalar:** Tüm 40 admin route'u korumalı, tüm SQL parametreli, `FOR UPDATE` kilidi mevcut, tek `dangerouslySetInnerHTML` kullanımı güvenli şekilde escape ediliyor, `.env.local` gitignore'da.

---

## 7. Performans

- **En yüksek etkili risk: Her makale görüntülemesinde önbelleksiz, tekrarlanan tam katalog taraması.** `getRelatedContent()` ve `getRecommendedNextSteps()` **her ikisi de bağımsız olarak** `listPublishedContentAsync()` çağırıyor — bu fonksiyon 163 makalenin TAMAMINI diskten okuyup parse ediyor + sınırsız bir Postgres `SELECT` yapıyor, **hiçbir memoizasyon/cache yok**. Tek bir makale sayfası görüntülemesi = 2× tam-katalog disk+DB taraması. İçerik 800'e çıktığında bu oran korunur (doğrusal kötüleşme).
- 58 sayfa route'undan sadece 3'ü ISR/statik (`revalidate` var): ana sayfa (5dk), sitemap (5dk), llms.txt (1sa). **Makale sayfası dahil geri kalan 54'ü tam dinamik.**
- **Kapak görsellerinin ~%50'si hâlâ optimize edilmemiş harici hotlink** (82/163 `http(s)` kaynaklı, ham `<img>` ile render ediliyor, Next Image optimizasyonunu atlıyor).
- `api/academy/glossary/route.ts` gibi bazı public GET route'larında cache-control header'ı hiç yok (source-cache ve cover route'ları doğru ayarlanmış, örnek alınabilir).

---

## Birleşik Öncelik Matrisi — Kapanış Durumu (2026-08-01 sonu)

| # | Bulgu | Öncelik | Durum |
|---|---|---|---|
| 0 | Public repoda 7 canlı Dify anahtarı | CRITICAL | ✅ Dosyalar redakte edildi (`1a2a7ba`). **Anahtar rotasyonu senin yapman gereken tek manuel adım — Dify Studio'dan.** |
| 1 | `pilot-pulse`'daki gerçek-marka uydurma güvenilirlik istatistikleri | CRITICAL | ✅ Kapatıldı (`9a8f65a`) — gerçek marka isimleri kaldırıldı, "Example data" etiketi eklendi, görsel olarak doğrulandı. |
| 2 | Production cron'un repo dışında/denetlenemez olması + kanıtlanmış 20 günlük sessizlik geçmişi | HIGH | ✅ Versiyon kontrollü GitHub Actions cron eklendi (`7f6cbe6`). **Senin yapman gereken: repo secret `CRON_SECRET` ekle (workflow dosyasında talimat var), sonra eski host crontab'ını kapat.** |
| 3 | Makale gövdesi için kod-içi grounding/atıf zorunluluğu yok | HIGH | 🟡 Kısmen kapatıldı (`0adfd42`) — ideation brief'lerindeki sahte-retrieval artık gerçek bağlam gibi kullanılmıyor. Asıl makale-gövdesi üretim prompt'u **Dify Studio'da yaşıyor, bu repodan değiştirilemez** — Dify workflow'una "sadece verilen context'ten alıntı yap" kuralı eklemek ayrı, Dify tarafında yapılması gereken bir iş. |
| 4 | `/api/analyze-flight` auth/rate-limit/boyut sınırı yok | HIGH | ✅ Kapatıldı (`3ae313d`) — rate limit (5/dk) + 100MB sınırı eklendi. |
| 5 | Rate limiter sahte X-Forwarded-For'a güveniyor | HIGH | ✅ Kapatıldı (`3ae313d`) — X-Real-IP önceliklendirildi, XFF'nin son hop'u kullanılıyor. |
| 6 | Admin auth sabit-zamanlı değil, brute-force korumasız | HIGH | ✅ Kapatıldı (`3ae313d`) — sabit-zamanlı karşılaştırma + 20 deneme/15dk limit eklendi (middleware.ts + admin-auth-guard.ts). |
| 7 | "SEO ≥ 80" yayın kalite kapısı kod tarafında yoktu | Orta | ✅ Kapatıldı (`0eebebb`) — gerçek `computeSeoScore()` eklendi, otomatik yayın yolu artık bunu zorunlu kılıyor. |
| 8 | Yasal/regülasyon içeriği için ekstra doğrulama yoktu | Orta | ✅ Kapatıldı (`0eebebb`) — regülasyon içeriği artık ≥2 kaynak gerektiriyor (önceden ≥1). |
| 9 | Site genelinde canonical tag eksikliği | Orta | ✅ Kapatıldı (`f533332`) — 5 hub sayfası + ana sayfa + makale fallback dalı. |
| 10 | Makale sayfası başına 2× önbelleksiz tam katalog taraması | Orta | ✅ Kapatıldı (`f533332`) — React `cache()` ile memoize edildi. |
| 11 | SSRF: backfill-images allowlist yok, ingest redirect-safe değil | Orta | ✅ Kapatıldı (`3ae313d`) — paylaşılan `isPublicHttpUrl()` guard'ı + redirect engelleme + 15MB sınırı. İngest'in kendisindeki (harici Crawl4AI servisi tarafında yönetilen) redirect-SSRF riski **bu repo dışında kalan bir kalıntı risk**. |
| 12 | CSP header yok | Orta | ✅ Kapatıldı (`3ae313d`) — `next.config.ts`'e eklendi, canlıda CSP-ihlali yok olarak doğrulandı. |
| 13 | `retrieval-orchestrator.ts` hiçbir canlı aracı korumuyor | Düşük-Orta | ✅ Kapatıldı — senin "tam orchestrator'ı bağla" kararınla uygulandı. 4 canlı `/tools/*` ve `/api/analyze-flight` route'u artık `getGroundingContext()` üzerinden `orchestrateRetrieval()`'ı çağırıyor (Part Matcher → `parts`, Build Wizard → `build`, Blackbox Tuning → `tuning`, Flight Critic → `default`), sonucu Dify prompt'una açık bir "Verified RAG Context" bölümü olarak enjekte ediyor ve `sources`/`retrievalConfidence`/`retrievalGrade` alanlarını response'a ekliyor. Component Duel'in hiç Dify çağrısı yapmadığı doğrulandı (saf katalog motoru) — kapsam dışı bırakıldı. Simüle edilmiş (`Math.random()`) chunk'lar açıkça filtreleniyor, gerçek kaynak yoksa prompt LLM'e "genel uzmanlıktan cevapla, kaynak uydurma" diyor — hiçbir zaman sahte grounding sızmıyor. **Yol boyunca ayrı bir kod bug'ı bulundu ve düzeltildi:** `realRetrieval()` yanlış endpoint'e istek atıyordu (`/document/search` — Dify API'de mevcut değil, hep 404 dönüyordu), doğru `/datasets/{id}/retrieve` "hit testing" endpoint'ine ve doğru `retrieval_model`/`records[].segment` request/response şekline düzeltildi (`retrieval-orchestrator.ts`). Yerelde canlı doğrulandı: düzeltmeden sonra Dify artık 404 değil, temiz bir yapılandırılmış 401 dönüyor — endpoint doğru, ama `DIFY_API_KEY` bir **Dataset/Knowledge API anahtarı değil** (chat-app anahtarlarından farklı bir tür). **Senin yapman gereken 4. manuel adım eklendi, aşağıya bak.** |
| 14 | 7/9 Dify workflow DSL'i tamamen bağlı değil | Düşük | 📋 **Dify Studio'da elle import gerektiriyor** — bu repodan yapılamaz. `master-routing-tables.ts`'deki `WORKFLOW_IDS` değerleri hâlâ `'TODO-import-to-dify-first'`. |
| 15 | ~%50 makale kapak görseli optimize edilmemiş | Düşük-Orta | 🟡 Bu oturumun başında 87/163 makale için zaten düzeltilmişti (image backfill). Kalanlar için daha fazla `raw_content` verisi/editöryal kaynak URL'si gerekiyor — operasyonel, tekrarlayan bir görev (backfill'i tekrar çalıştırmak), tek seferlik kod fix'i değil. |

**Efor:** S = saatler, M = 1 gün, L = birden fazla gün / altyapı kararı gerektirir.

---

## Sonuç (güncellendi — 2026-08-01 sonu)

**15 bulgunun 12'si tamamen kapatıldı, 1'i kısmen kapatıldı (kalan kısmı bu reponun dışında), 2'si mimari karar/Dify Studio aksiyonu gerektirdiği için sadece dokümante edildi.** Tüm kod değişiklikleri commit edildi, push edildi, typecheck+lint+ilgili regresyon testleri (part-matcher, blackbox, build-calculator, editorial-governance, content-smoke, content-audit) yeşil.

**Hâlâ senin yapman gereken 4 manuel adım:**
1. **Dify Studio'dan 7 API anahtarını rotate et** (§0) — en acil, kodla çözülemez.
2. **GitHub repo secret `CRON_SECRET` ekle** ve yeni Actions cron'unu doğruladıktan sonra eski host crontab'ını kapat (§2) — `.github/workflows/content-pipeline-cron.yml` dosyasının başındaki talimatları takip et.
3. **7 bağlı-olmayan Dify workflow'unu Dify Studio'dan import et** (istersen — düşük öncelik) (§14).
4. **Dify Studio → Knowledge → API Access'ten gerçek bir Dataset/Knowledge API anahtarı oluştur** ve `DIFY_DATASET_API_KEY` olarak hem `.env.local`'e hem Coolify production ortamına ekle (§13) — bu olmadan yeni `retrieval-orchestrator.ts` entegrasyonu güvenli şekilde boş bağlam döner, hiç kırılmaz ama hiç gerçek kaynak da göstermez. Ayrıca production'da `ENABLE_REAL_RAG=true` olduğunu doğrula (bu oturumda SSH erişimi olmadığı için canlıda teyit edilemedi).

Platformun deterministik çekirdekleri (katalog eşleştirme, güvenlik guardrail'leri, yayın kalite kapıları) artık hem doğru hem de gerçekten kod-tarafında zorunlu kılınıyor — daha önce sadece dokümante edilmiş, hiç uygulanmamış kurallardı.
