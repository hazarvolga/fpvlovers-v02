# Hardware Analyzer (`/tools/hardware-analyzer`) — Fonksiyon, Amaç ve Tasarım GAP Raporu

**Tarih:** 2026-08-01 · **Branch:** `main` · **Kapsam:** Sadece bu sayfa — `src/app/tools/hardware-analyzer/page.tsx`, `src/features/tools/components/HardwareAnalyzer.tsx`, `src/app/api/tools/hardware-analyzer/route.ts` ve bunların doğrudan çağırdığı `component-compatibility.ts` / `engineering-safety.ts` / `fpv-product-catalog.ts`.

**Yöntem:** Kod okuma (widget → API route → lib → veri) + canlı sayfa doğrulaması (masaüstü + mobil) + `matchCatalogProduct` eşleştirme algoritmasının gerçek katalog verisiyle (`data/fpv-products.catalog.json` + `data/affiliates.json`, birleşik 104 ürün) birebir Python replikasyonu. Aşağıdaki her bulgu ya doğrudan dosya/satır kanıtına ya da canlı sitede gözlemlenen davranışa dayanıyor.

**Önceki ilgili rapor:** `docs/gap-reports/archive/2026/2026-07-31-tools-hallucination-gap-report.md` — bu rapor Hardware Analyzer için HA-P0-1 ve HA-P1-1 (güvenlik uyarısının istemciye ulaşmaması) buluyordu. **Bu ikisi artık kapalı** — canlı testte `engineeringSafety` JSON'dan istemciye taşınıyor ve UI'da her zaman render ediliyor (`HardwareAnalyzer.tsx:213-236`, canlı ekran görüntüsüyle doğrulandı). Bu rapor o ikisini tekrar açmıyor; sayfanın **fonksiyon ve tasarım** katmanında kalan, o raporun kapsamadığı yeni bulgulara odaklanıyor.

---

## Sayfanın Amacı (kendi tanımı)

> "Catalog-assisted local compatibility check for FPV components, with optional source-backed AI review when the gateway returns usable context."

Kullanıcı 6 alanı (Frame, Motor, ESC, Battery, FC, VTX/Camera) serbest metin olarak dolduruyor, "RUN FULL DIAGNOSTIC"a basıyor; sistem önce yerel katalog eşleştirmesi + deterministik risk kontrolü yapıyor, token varsa Dify'a bu yerel bulguyu "guardrail" olarak enjekte edip AI incelemesi istiyor.

---

## GAP Bulguları

### GAP #1 — CRITICAL | Sayfanın kendi varsayılan örneği kendi kataloğuyla eşleşmiyor → "blocked / 14/100"

**Konum:** `HardwareAnalyzer.tsx:23-30` (varsayılan `formData`), `route.ts:45-70` (`matchCatalogProduct`, eşik `score >= 3`)

**Kanıt:** Sayfa ilk açıldığında form şu değerlerle önceden dolu geliyor: *Apex 5" Freestyle / 2207 2400KV / 45A 4-in-1 / 6S 1300mAh LiPo / SpeedyBee F405 V3 30.5x30.5 / DJI O3 Air Unit*. Gerçek üretim kataloğu (89 crawler + 15 affiliate = 104 ürün) üzerinde eşleştirme algoritması birebir çalıştırıldığında:

| Alan | Girdi | En iyi aday | Skor | Eşik (≥3) |
|---|---|---|---|---|
| Frame | Apex 5" Freestyle | ImpulseRC Apex EVO 5" Freestyle Frame | **2.96** | ❌ eşleşmedi |
| Motor | 2207 2400KV | T-Motor Velox V3 V2207 1950KV | 1.96 | ❌ eşleşmedi |
| ESC (→stack) | 45A 4-in-1 | Mamba/Holybro MK4 F7 45A 6S | 1.87 | ❌ eşleşmedi |
| FC (→stack) | SpeedyBee F405 V3 30.5x30.5 | SpeedyBee F405 V4 50A 30x30 Stack | 2.96 | ❌ eşleşmedi |
| Battery | 6S 1300mAh LiPo | CNHL 6S 1300mAh LiPo (affiliate) | 12.86 | ✅ eşleşti |
| VTX | DJI O3 Air Unit | DJI O3 Air Unit Digital HD Video System | 13.99 | ✅ eşleşti |

Canlı sitede aynı varsayılan değerlerle "RUN FULL DIAGNOSTIC" tıklandığında gözlenen sonuç bu tabloyla birebir tutarlı: **Verdict: blocked, Score: 14/100**, "Missing motor KV", "Missing frame prop clearance", "Missing ESC continuous current" uyarıları.

**Etki:** Bir ilk-kez ziyaretçi sayfayı açıp hiçbir alanı değiştirmeden butona bastığında — yani aracın kendi öne çıkardığı "işte böyle kullanılır" örneğinde — gerçekte tamamen standart ve üretilebilir bir freestyle build (ImpulseRC Apex 5" + 2207 motor + F4 stack + 6S 1300mAh + DJI O3) "blocked / 14/100" olarak damgalanıyor. Bu, aracın ilk izlenimini doğrudan baltalıyor: kullanıcı "bu araç bozuk" ya da "benim build'im tehlikeli" sonucuna varabilir — ikisi de yanlış.

**Kök neden (iki katmanlı):**
1. Eşleştirme eşiği (`score >= 3`, `route.ts:68`) neredeyse birebir isim örtüşmelerini bile eleyebiliyor — Frame ve FC alanları 2.96 ile eşiğin **0.04 puan altında** kalıyor.
2. Varsayılan motor değeri ("2207 2400KV") kataloğa göre değil, gerçek mühendislik mantığına göre de sorunlu: yerel deterministik risk motoru (`route.ts:106-110`) bunu bağımsız olarak "6S için yüksek KV; ısı ve akım sıçraması beklenir" diye işaretliyor. Yani placeholder değerler ne katalog ne de aracın kendi risk kurallarıyla doğrulanmadan seçilmiş.

**Çözüm:** (a) Varsayılan form değerlerini gerçek kataloğun kendi ürün adlarından birebir türet (örn. `getFpvProductCatalog()`'un en yüksek `trustScore`'lu ürünlerinden otomatik doldur), böylece placeholder her zaman en az "caution" seviyesinde bir sonuç versin; (b) eşik değerini (`score >= 3`) gerçek kullanıcı girdileriyle (örn. bu 6 varsayılan alan) yeniden kalibre et — özellikle 2.9-3.0 aralığındaki "az farkla kaybeden" adaylar için token-örtüşme ağırlığını artır.

---

### GAP #2 — HIGH | "Opsiyonel AI incelemesi" özelliği gözlemlenebilir şekilde hiç devreye girmiyor

**Konum:** `route.ts:248-280`

**Kanıt:** Sayfanın kendi tanıtım metni "with optional source-backed AI review when the gateway returns usable context" diyor. Canlı testte (token'ın var olduğu, `!app?.token` dalına düşmediği durumda bile) sonuç her seferinde `source: 'local'` ve mesaj *"Hardware review gateway did not return usable Markdown; returned deterministic local compatibility check."* oldu — yani sayfa vaat ettiği iki moddan (yerel + AI) sadece birini fiilen sunuyor.

**Etki:** "AI-Assisted ⓘ" ve "AI — No Sources ⓘ" rozetleri (`HardwareAnalyzer.tsx:196-205`) kodda var ve UI'da görsel olarak hazır, ama kullanıcı bunları muhtemelen hiç görmüyor — sayfanın öne sürdüğü temel farklılaştırıcı özelliği (AI destekli inceleme) günlük kullanımda fiilen yok gibi davranıyor.

**Not:** Bu raporun kapsamı sunucu taraflı kök nedeni (token geçersizliği, Dify app yayın durumu, zaman aşımı, boş RAG sonucu vb.) kapsamıyor — bunun için sunucu logları/Dify Studio durumu incelenmeli. Burada tespit edilen, yalnızca kullanıcı tarafında gözlemlenen davranıştır.

**Çözüm:** Dify çağrısı başarısız olduğunda/markdown dönmediğinde bunu sessizce yutmak yerine (mevcut davranış) bir telemetri/log kaydı düşür, böylece "AI katmanı üretimde ne sıklıkla devreye giriyor" ölçülebilir hale gelsin.

---

### GAP #3 — MEDIUM | Bilgilendirici "yerel moda düştük" mesajı hata gibi gösteriliyor

**Konum:** `HardwareAnalyzer.tsx:59-61` (`if (data.warning) setError(data.warning)`), `185-189` (render)

**Sorun:** Sunucudan gelen `warning` alanı (örn. "Hardware review gateway did not return usable Markdown...") aynı `error` state'ine ve aynı kırmızı `ShieldAlert` kutusuna yazılıyor — gerçek hatalarla (örn. 429 rate-limit, network hatası) görsel olarak ayrım yok.

**Etki:** Bu aslında beklenen, kontrollü bir fallback davranışı (Diagnostic Report yine de aşağıda düzgün render ediliyor) ama kullanıcıya "bir şeyler bozuldu" izlenimi veriyor — hemen altında geçerli bir rapor olmasına rağmen.

**Çözüm:** `warning` (bilgilendirici, sonuç yine de üretildi) ile `error` (sonuç hiç üretilemedi) için ayrı state ve ayrı görsel dil kullan — örn. `warning` için amber/info renk, `error` için kırmızı.

---

### GAP #4 — MEDIUM | İç sistem jargonu son kullanıcıya sızıyor

**Konum:** `route.ts:131`

**Sorun:** Yerel fallback markdown'ının sabit son satırı: *"Route this build through the guided compatibility workflow once production credentials are enabled for deeper source-backed recommendations."* Bu metin her yerel-mod yanıtında (yani gözlemlenen her durumda — bkz. GAP #2) kullanıcıya gösteriliyor.

**Etki:** "production credentials" ifadesi geliştirici/ops diliyle yazılmış; bir pilot/müşteri için hem anlaşılmaz hem de "bu özellik yarım bırakılmış" izlenimi veriyor — güven zedeleyici.

**Çözüm:** Kullanıcıya yönelik, aksiyon odaklı bir metinle değiştir (örn. "Bu kontrolü katalogdaki tam ürün adlarıyla tekrarlayarak daha güvenilir sonuç al." gibi) — sistem/altyapı durumundan hiç bahsetmeden.

---

### GAP #5 — LOW | Skor/verdict kullanıcıya açıklanmıyor

**Konum:** `component-compatibility.ts:263-266` (skor formülü), UI tarafında hiçbir açıklama yok

**Sorun:** `score = 100 - failCount*28 - warnCount*10` sabit formülü ve `ready` / `caution` / `blocked` eşikleri koda gömülü; sayfada kullanıcıya "14/100 ne demek, kaç puana çıkarsam 'ready' olur" açıklaması yok.

**Etki:** Kullanıcı ham bir sayı ve bir renk kodu görüyor ama bunu nasıl iyileştireceğini anlamıyor — özellikle GAP #1'deki gibi "kendi hiçbir şey değiştirmediği" bir senaryoda bu daha da kafa karıştırıcı.

**Çözüm:** Sonuç panelinin altına kısa bir "Skor nasıl hesaplanır" açıklaması veya en azından `ready ≥ X`, `caution ≥ Y` eşik bilgisini ekle.

---

### GAP #6 — LOW | "AI-Assisted ⓘ" rozeti dokunmatik cihazda erişilemez

**Konum:** `HardwareAnalyzer.tsx:196-210`

**Sorun:** Rozetlerin açıklaması yalnızca `title` (native hover tooltip) ile veriliyor; `cursor-help` sınıfı da yalnızca mouse imleci için anlamlı. Dokunmatik ekranlarda `title` tooltip'i genelde hiç açılmıyor veya sadece uzun-basma ile açılıyor.

**Etki:** Aracın en önemli güven ayrımı (AI-Assisted / AI — No Sources / Local Guardrail) — yani "bu sonuca ne kadar güvenmeliyim" sinyali — mobil kullanıcılar için pratikte açıklamasız kalıyor.

**Çözüm:** Rozetin yanına tıklanabilir bir `(i)` ikonu ekleyip mobilde bir popover/modal ile açıklamayı göster.

---

### GAP #7 — LOW | Rate-limit aşıldığında kullanıcı ne zaman tekrar deneyebileceğini bilmiyor

**Konum:** `route.ts:203-220` (sunucu `X-RateLimit-*` header'ları set ediyor), `HardwareAnalyzer.tsx:51-61` (istemci sadece `data.error` okuyor)

**Sorun:** Sunucu `X-RateLimit-Limit` / `X-RateLimit-Remaining` / `X-RateLimit-Reset` header'larını dönüyor ama istemci bunları hiç okumuyor; kullanıcıya sadece "Too many requests. Please try again in a minute." metni gösteriliyor.

**Etki:** Küçük bir cila eksikliği — geri sayım veya "kalan istek: 2/5" gibi bir gösterge kullanıcı deneyimini iyileştirirdi, ama işlevi engellemiyor.

**Çözüm:** `X-RateLimit-Reset` header'ını okuyup "X saniye sonra tekrar deneyin" şeklinde göster.

---

## Öncelik Matrisi

| # | Başlık | Öncelik | Efor | Etki |
|---|---|---|---|---|
| 1 | Varsayılan örnek kendi kataloğuyla eşleşmiyor (14/100 blocked) | CRITICAL | S–M | İlk izlenim / güven |
| 2 | AI incelemesi gözlemlenebilir şekilde hiç devreye girmiyor | HIGH | Araştırma gerekli (sunucu) | Vaat edilen özellik |
| 3 | Bilgilendirici mesaj hata gibi gösteriliyor | MEDIUM | XS | UX netliği |
| 4 | İç jargon ("production credentials") kullanıcıya sızıyor | MEDIUM | XS | Güven / copy |
| 5 | Skor/verdict açıklanmıyor | LOW | S | UX netliği |
| 6 | AI rozeti mobilde erişilemez | LOW | S | Erişilebilirlik |
| 7 | Rate-limit geri sayımı yok | LOW | XS | Cila |

**Efor:** XS = 15dk, S = 1sa, M = 2-4sa

---

## Sonuç

Sayfanın mimarisi (yerel deterministik guardrail + opsiyonel AI katmanı + güvenlik uyarısının artık istemciye ulaşması) sağlam bir temel — önceki hallüsinasyon raporunun en kritik iki bulgusu (HA-P0-1, HA-P1-1) kapatılmış durumda. Ancak sayfa **kendi varsayılan örneğiyle** kullanıcıya kötü bir ilk izlenim veriyor (GAP #1): gerçek, üretilebilir bir build "blocked / 14/100" olarak damgalanıyor, çünkü katalog eşleştirme eşiği aşırı sıkı ve placeholder değerler ne kataloğa ne de aracın kendi risk mantığına göre seçilmiş. Bu tek değişiklik (varsayılan değerleri kataloğa göre kalibre etmek) en yüksek kaldıraçlı düzeltme — saatler mertebesinde efor, doğrudan ilk-izlenim etkisi.
