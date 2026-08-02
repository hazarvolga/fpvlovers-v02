# FPVLovers — Kapsamlı Ürün GAP Raporu (GAP · BUG · UX · UI · Mobil · SEO · GEO · Security · Performans)

**Tarih:** 2026-08-02
**Kapsam:** `main` @ e023c44 · salt-okuma denetim (üretim kodunda değişiklik yapılmadı)
**Ölçüm ortamı:** yerel dev sunucu `http://localhost:3000` (Next.js 15.5.21), Chromium 375×812 (mobil) ve 1440×900 (masaüstü)
**Persona:** FPV drone'lara yeni başlayan, hiç terim bilmeyen, öğrenmek isteyen bir okuyucu

> **Kanıt kuralı:** Bu rapordaki her madde ya bir `dosya:satır` referansı, ya bir komut çıktısı, ya da tarayıcıda tekrar üretilebilir bir ölçüm içerir. Kanıtlanamayan hiçbir iddia rapora alınmamıştır. Doğrulanamayan alanlar "Denetlenmeyenler" bölümünde açıkça listelenmiştir.

> [!NOTE]
> **2026-08-02 aynı gün düzeltme geçişi tamamlandı.** 2 CRITICAL, 7 HIGH ve kod ile kapatılabilen MEDIUM/LOW maddelerin tamamı düzeltildi ve doğrulandı (lint/tsc/build temiz, canlı sunuculara SSH ile bağlanılıp Qdrant/Dify verisi ve prod davranışı doğrulandı). Ayrıntılı madde madde durum için: [2026-06-25 Active GAP Closure Register § Reopened / Newly Opened](2026-06-25-active-gap-closure-register.md#reopened--newly-opened--2026-08-02-audit). İçerik üretimi gerektiren maddeler (thin hub'lar, 26 makalenin metadata'sı, sözlük genişletme, SHY/SHGM yerelleştirmesi) kapsam dışı bırakıldı — kullanıcı 2026-08-02'de global İngilizce-önce konumlandırmayı onayladı, bu yüzden SHY/SHGM içeriği artık planlanmıyor.

---

## 1. Executive Summary

Proje teknik hijyen açısından **beklenenin üzerinde**: lint temiz, build yeşil, güvenlik başlıkları tam, admin API'leri 401 ile korunuyor, 9 iç denetim script'inin 8'i sorunsuz geçiyor, içerik hacmi (163 makale) ciddi.

Buna karşılık **son kullanıcının ilk 10 saniyesi kırık**. Mobilde header'daki logo görseli `scale-[1.6]` ile büyütülüp kırpılmadığı için tüm header dokunuşlarını yutuyor: **hamburger menü açılmıyor, arama kutusu odaklanmıyor**. Ayrıca global arama bölümü (`SearchSection`) her ekran boyutunda sabit navbar'ın *arkasında* render ediliyor, yani site genelinde görünmez ve tıklanamaz durumda. Bu iki hata birlikte, acemi kullanıcının siteyi keşfetme yollarını 5 maddelik alt tab bar'a indiriyor.

İçerik tarafında en büyük stratejik boşluk **regülasyon ekseni**: `.com.tr` alan adı ve `CLAUDE.md`'deki "yasal — SHY/SHGM" kategorisine rağmen `/regulations/airspace` sayfası 78 kelime ve ekranda "0 documents indexing in the FPV reference library" yazıyor. Acemi kullanıcının en kritik sorusu ("yasal olarak uçabilir miyim?") cevapsız.

| Eksen | Skor | Gerekçe (özet) |
|---|---:|---|
| Mobil uyumluluk | **35/100** | Header tamamen etkileşimsiz; 38 dokunma hedefi <44px |
| UX (acemi) | **52/100** | IA iyi, jargon desteği yok, araçlar açıklamasız, arama alakasız |
| UI / görsel | **62/100** | Tutarlı dil, ama kapak görselinde metin çakışması + 7 kontrast ihlali |
| SEO | **64/100** | Metadata/canonical tam; 46 sayfada schema yok, 13 thin sayfa, sitemap'te 307'ler |
| GEO (LLM görünürlüğü) | **58/100** | `llms.txt` + makale Article şeması var; hub'larda schema yok, llms.txt içerik listelemiyor |
| Security | **72/100** | Başlıklar/CSP/401 iyi; sanitize yok, 3 public uçta rate-limit yok, enumerasyon |
| Performans | **70/100** | JS bundle makul (103 kB shared); HTML ağırlığı yüksek (anasayfa 433 kB) |
| GAP / tutarlılık | **60/100** | Dokümante edilen kapsam ile kod arasında 4 doğrulanmış çelişki |

**Toplam açık bulgu: 28** — 2 CRITICAL · 7 HIGH · 12 MEDIUM · 7 LOW

---

## 2. Çalıştırılan Doğrulama Komutları

`npm` bu makinede PATH'te değil; tüm komutlar `pnpm` (11.17.0 / Node v24.18.0) ile çalıştırıldı. **Bu, dokümantasyonda `npm run …` yazan her komutun bu makinede olduğu gibi çalışmadığı anlamına gelir (bkz. LOW-7).**

| Komut | Sonuç | Ham çıktı (kısaltılmış) |
|---|---|---|
| `pnpm run lint:ci` | ✅ EXIT=0 | çıktı yok (temiz) |
| `pnpm run build` | ✅ EXIT=0 | `⚠ Compiled with warnings in 8.5s` — jose/Edge Runtime uyarısı |
| `pnpm run security:audit` | ✅ | `Repository security audit passed (1176 tracked files checked).` |
| `pnpm run seo:discoverability-test` | ✅ | `SEO discoverability regression checks passed` |
| `pnpm run routes:audit` | ✅ | `Single-tree route audit passed: 119 route files under src/app.` |
| `pnpm run content:audit` | ✅ | `✓ AUDIT PASSED` (9 kontrol) |
| `pnpm run content:language-audit` | ✅ | `✓ content language audit passed (163 artifacts checked)` |
| `pnpm run metadata:audit` | ⚠️ | `163 audited · 137 valid · 26 missing metadata` → bkz. MED-11 |
| `pnpm run tools:audit` | ⚠️ | 5 PASS · 1 **PARTIAL** (Blackbox Tuning) · 1 DEFERRED (Flight Critic) |

Ek olarak yazılan tek seferlik denetim script'i (`scratchpad/sweep.mjs`, repo dışında) sitemap'teki **209 URL'nin tamamını** çekip durum kodu, kelime sayısı, JSON-LD, H1, meta description ve yanıt süresi ölçtü.

---

## 3. CRITICAL Bulgular

### CRIT-1 · Mobil header'daki logo tüm dokunuşları yutuyor — menü ve arama kullanılamıyor
**Eksen:** Mobil / UX / BUG · **Efor:** ~15 dk

`src/features/layout/components/Navbar.tsx:71-79`:

```tsx
<div className="relative h-[72px] w-[300px] -ml-2">
  <Image src="/logo-type.png" fill className="… scale-[1.6] origin-left" />
</div>
```

Sarmalayıcı 300×72, ancak `fill` görsele `scale-[1.6]` uygulanıyor ve sarmalayıcıda `overflow-hidden` yok. Transform, hit-test kutusunu da büyütüyor.

**Ölçüm (375px):**
- Logo `<img>` gerçek sınır kutusu: `x=8 → right=488, y=-22, h=115` (viewport genişliği 375!)
- Hamburger butonu: `x=324 → 359, y=16 → 56`
- `document.elementFromPoint(342, 36)` → **`IMG` (logo)**, buton değil
- x = 200, 280, 300, 310, 320, 330, 340, 350, 360, 370 noktalarının **hepsinde** y=36'da en üstteki eleman logo `IMG`

**Tekrar üretme:** 375×812'de `/tools/calculator` aç → hamburger ikonuna (342, 36) tıkla → **hiçbir şey olmaz**. Arama alanının merkezine (187, 65) tıkla → sayfa `/tools/calculator`'dan `/`'a gider (logo linki tetiklenir), `document.activeElement` `BODY` kalır.

**Sonuç:** Mobilde LEARN / BUILD / FLY / TOOLS / NEWS / REGULATIONS menü ağacının tamamı erişilemez. Kullanıcı yalnızca alt tab bar'daki 5 hedefe (HOME, ACADEMY, SEARCH, TOOLS, DOSSIER) ulaşabiliyor.

**Regresyon uyarısı:** `docs/gap-reports/2026-06-25-active-gap-closure-register.md` bu alanı *"Mobile trust navigation — Closed"* olarak işaretliyor. Bu madde **yeniden açılmalıdır**.

**Beklenen:** Sarmalayıcıya `overflow-hidden` eklenmesi veya `scale-[1.6]` yerine sarmalayıcının doğrudan büyütülmesi; ayrıca logo `<a>` üzerinde `pointer-events` alanının 300×72 ile sınırlı kalması.

---

### CRIT-2 · Global arama bölümü site genelinde navbar'ın arkasında, tamamen kullanılamaz
**Eksen:** UI / BUG / UX · **Efor:** ~10 dk

`src/app/layout.tsx:50-51` sırasıyla `<Navbar />` ve `<SearchSection />` mount ediyor. `Navbar` `fixed top-0 z-50` ve 73px yüksekliğinde (`Navbar.tsx:63`), `SearchSection` ise akışın ilk elemanı, `relative z-40`, 69px yüksekliğinde (`SearchSection.tsx:19`).

**Ölçüm:**

| Viewport | SearchSection | Navbar | Input merkezine hit-test |
|---|---|---|---|
| 1440×900 | `y=0, h=69, z=40` | `y=0, h=73, z=50` | `DIV.mx-auto flex h-[72px]…` (navbar iç kabı) |
| 375×812 | `y=0, h=69, z=40` | `y=0, h=73, z=50` | `IMG` (logo) |

**Görünen sonuç:** Masaüstünde bileşen tamamen kayboluyor. Mobilde logonun altında **boş siyah yuvarlatılmış bir dikdörtgen** olarak sızıyor — placeholder metni ("Search FPV guides and reviews") ve yeşil "EDITORIAL SEARCH" etiketi navbar'ın arkasında kaldığı için görünmüyor. Ekran görüntülerinde her sayfada tekrarlanan bu boş kutu, kullanıcıya "bozuk sayfa" hissi veriyor.

**Beklenen:** `SearchSection` navbar yüksekliği kadar aşağıdan başlamalı (layout'a `pt-[73px]` veya navbar'ı akışa dahil etmek) — ya da bileşen bilinçli olarak kullanılmıyorsa `layout.tsx:51`'den kaldırılmalı.

---

## 4. HIGH Bulgular

### HIGH-1 · Sanitize edilmemiş `rehypeRaw` + `script-src 'unsafe-inline'` → depolanmış XSS yolu
**Eksen:** Security · **Efor:** ~1 sa

`src/components/MarkdownRenderer.tsx:47` makale gövdesini `rehypePlugins={[rehypeRaw]}` ile render ediyor; kod tabanının tamamında `rehype-sanitize`, `DOMPurify` veya eşdeğeri **yok** (`grep -rn "sanitize|DOMPurify" src` → sadece bu raporun aradığı boş sonuç). Makale gövdesi LLM üretimi + Crawl4AI ile taranmış üçüncü taraf içerikten geliyor ve cron ile **otomatik** yayınlanabiliyor.

`next.config.ts:123` CSP'si `script-src 'self' 'unsafe-inline'` içeriyor → gövdeye enjekte edilen bir `<script>` **çalışır**.

**Mevcut istismar durumu:** Yok. `content/published/*.json` içindeki 163 makalenin hiçbirinde `<script`, `<iframe`, `onerror=` veya `javascript:` bulunmadı (yalnızca 1 dosyada `<variable>`/`<value>` benzeri düz metin). Yani risk **latent**, aktif değil.

**Beklenen:** `rehype-sanitize` şeması ile allow-list'e geçilmesi ve CSP'den `'unsafe-inline'` çıkarılması (nonce/hash'e geçiş).

---

### HIGH-2 · `/api/pilot/register` — doğrulama, parola politikası ve rate-limit yok; hesap enumerasyonu ve hata sızıntısı var
**Eksen:** Security · **Efor:** ~1,5 sa · **Dosya:** `src/app/api/pilot/register/route.ts`

| # | Sorun | Satır | Kanıt |
|---|---|---|---|
| a | Zod doğrulaması yok, `email`/`password`/`name` ham `any` | 7-11 | Global kural: "ALWAYS validate user input" |
| b | **Parola uzunluk/karmaşıklık kuralı yok** — 1 karakterlik parola kabul edilir | 9-27 | `if (!email \|\| !password \|\| !name)` dışında kontrol yok |
| c | Rate limit yok → otomatik hesap üretimi | tüm dosya | `rateLimit` importu yok |
| d | **Hesap enumerasyonu**: kayıtlı e-posta için 409 + ayırt edici mesaj | 22 | `"Bu e-posta adresi zaten tescil edilmiş."` |
| e | **Hata sızıntısı**: 500 yanıtında `error.message` istemciye dönüyor | 53 | `details: error instanceof Error ? error.message : String(error)` — DB tablo/constraint adları sızabilir |
| f | Tip karışıklığı: `email` nesne gönderilirse `.trim()` patlar → (e) ile birleşince iç hata metni açığa çıkar | 13, 34 | — |
| g | E-posta doğrulama akışı yok | — | Kullanıcı doğrulanmadan `users` tablosuna yazılıyor |

Aynı `details: error` kalıbı `src/app/api/pilot/progress/route.ts` içinde de mevcut (toplam 3 kullanım, 2 dosya).

---

### HIGH-3 · `/api/contact` ve `/api/newsletter/subscribe` — rate-limit yok, PII loglanıyor, e-posta enumerasyonu
**Eksen:** Security · **Efor:** ~1 sa

`src/lib/server/rate-limit.ts` doğru yazılmış (X-Real-IP tercihi, XFF'in son hop'u — spoof'a dayanıklı) ama **yalnızca 4 araç ucunda** kullanılıyor: `tools/part-matcher`, `tools/build-wizard`, `tools/blackbox-tuning`, `analyze-flight` (hepsi 5 istek / 60 sn).

Korumasız public POST uçları:

| Uç | Yan etki | Risk |
|---|---|---|
| `/api/contact` | **SMTP ile e-posta gönderiyor** (`route.ts:43-50`) | Mail bombalama / spam rölesi |
| `/api/newsletter/subscribe` | DB yazma | Abonelik spam'i |
| `/api/pilot/register` | DB yazma + bcrypt (CPU) | Hesap spam'i + CPU tüketimi |
| `/api/analytics/event` | DB yazma | Metrik zehirleme |

Ek olarak:
- `src/app/api/contact/route.ts:35` — gönderenin **adı ve e-postası `console.log` ile stdout'a yazılıyor**. Bu hem global "No console.log statements" kuralını hem de PII minimizasyonunu ihlal ediyor. (Koddaki yorum "no PII leakage to third-parties" diyor, ancak konteyner logları da bir PII deposudur.)
- `src/app/api/newsletter/subscribe/route.ts:40` — kayıtlı e-posta için `status: 'exists'` dönüyor → **e-posta enumerasyonu**. Çift onay (double opt-in) da yok.
- `rate-limit.ts:10` — bellek içi `Map`. Coolify'da birden fazla replika veya her redeploy'da sıfırlanır; tek örnek varsayımı `standalone` notunda kabul edilmiş ama ölçeklemede sessizce zayıflar.

---

### HIGH-4 · Üretilen kapak görselinde başlık ve özet metni üst üste biniyor
**Eksen:** UI / BUG · **Efor:** ~30 dk

`/api/content/media/cover/<slug>` 1200×675 PNG üretiyor. Uzun başlıklarda başlık 3 satıra sarıyor ve **özet metni üçüncü satırın üzerine çiziliyor**; ayrıca başlık kırpılıyor.

**Kanıt** — `analog-vs-digital-fpv-for-beginners-which-video-system-should-you-choose` kapağı:
- Başlık kutuda `"Analog vs Digital FPV for Beginners: Which Video System"` olarak kesiliyor (`"Should You Choose?"` kayıp)
- Üçüncü satır `"System"` ile alt satırdaki `"A beginner comparison that helps pilots pick a video path…"` cümlesi **aynı piksellerde** çakışıyor

Bu görsel aynı zamanda `og:image` olarak kullanılıyor → sosyal paylaşımlarda ve Google Discover kartlarında da bozuk görünür.

---

### HIGH-5 · 209 sayfanın 46'sında hiç JSON-LD yok — anasayfa dahil
**Eksen:** SEO / GEO · **Efor:** ~4 sa

Sitemap taraması: `noJsonLdCount: 46`. Şema **yalnızca** `/article/*` sayfalarında var (orada `Article` + `BreadcrumbList` doğru kurulmuş, `citation` alanı bile dolu — iyi iş).

Şemasız kalan sayfalar:
- `/` (anasayfa) — `Organization`, `WebSite` + `SearchAction` yok
- Tüm hub'lar: `/academy`, `/academy/*` (5), `/engineering`, `/tools`, `/buyers-guides`, `/comparisons`, `/reviews`, `/archive`, `/archive/*` (5)
- Tüm `/racing/*` (15 sayfa)
- Tüm politika sayfaları: `/about`, `/contact`, `/disclosure`, `/editorial-policy`, `/privacy`, `/terms`, `/advertise`
- `/regulations/airspace`, `/regulations/battery`, `/pilot-pulse`

**Kayıp:** Sitelink arama kutusu, breadcrumb rich result'ları, `ItemList` ile hub karusel'leri, `FAQPage`, ve LLM tarayıcıları için yapılandırılmış varlık tanımı. `CLAUDE.md` `seoAgent`'ın "keyword → title / meta / schema.org" ürettiğini söylüyor; bu üretim makale dışına uygulanmamış.

**Ayrıca:** Makale JSON-LD'sinde `"image": ["/api/content/media/cover/…"]` **göreli URL** kullanılıyor. Google `ImageObject`/`image` alanında mutlak URL bekler.

---

### HIGH-6 · Sitemap 307 yönlendiren 3 URL'yi 0.9 önceliğiyle ilan ediyor
**Eksen:** SEO · **Efor:** ~30 dk

```
/engineering/hardware  → 307 → /engineering/propulsion
/engineering/firmware  → 307 → /engineering/flight-control
/engineering/workshop  → 307 → /engineering/systems
```

Kaynak: `src/app/engineering/hardware/page.tsx:4` (`redirect('/engineering/propulsion')`) ve kardeşleri. Bu sayfalar `src/app/sitemap.xml/route.ts` çıktısında hâlâ `priority 0.9` ile yer alıyor.

İki ayrı sorun:
1. **Sitemap'te yönlendirilen URL bulunmamalı** — tarama bütçesi israfı ve Search Console'da "Sayfa yönlendirmeli" uyarısı üretir.
2. Kalıcı bir yeniden adlandırma için Next.js `redirect()` varsayılanı olan **307 (geçici)** yanlış; link değeri aktarımı için 308/301 gerekir. Karşılaştırma: `next.config.ts:83-86`'daki `/tools/hardware-analyzer` yönlendirmesi doğru şekilde `permanent: true` kullanıyor.

Bu üç sayfa aynı zamanda **H1 içermiyor** (`h1: 0`) ve 9 kelime döndürüyor.

---

### HIGH-7 · Regülasyon ekseni pratikte boş — SHY/SHGM içeriği yok, sayfa "0 documents" diyor
**Eksen:** GAP / İçerik / UX (persona-kritik) · **Efor:** ~2 gün (içerik)

`/regulations/airspace` canlı metni (78 kelime, tamamı):

> AIRSPACE COMPLIANCE — // FAA AND EASA REGULATION MANDATES. ALWAYS CHECK NOTAMS … SYS.LEGAL_FRAMEWORK · LATENCY: 12ms · **"0 documents indexing in the FPV reference library. Ready soon."** · RESTRICTED AIRSPACE PROXIMITY — Do not fly near airports … Violations trigger severe federal penalties.

Üç ayrı problem iç içe:

1. **Boş durum (empty state) halka açık ve indekslenebilir bir sayfada yayında.** "Ready soon" metni sitemap'te ilan edilen bir URL'de duruyor.
2. **Yargı bölgesi yok.** Metin "federal penalties" ve FAA/EASA diyor; alan adı `.com.tr`; `CLAUDE.md` "yasal — SHY regulasyonları, SHGM mevzuatı" kategorisini tanımlıyor. Türkiye'deki bir acemi kullanıcı "yasal olarak uçabilir miyim, nereye kayıt olmam gerekir" sorusuna **hiçbir cevap alamıyor**. Ülke seçici de yok.
3. `/regulations` ana sayfasında dekoratif **"LATENCY: 12ms"** sahte telemetri metni bir *güvenlik ve mevzuat* sayfasında duruyor — güven zedeleyici (bkz. LOW-6).

> **Not — çelişki, hata değil:** Kod tabanı bilinçli olarak **İngilizce-önce**. `scripts/content-language-audit.ts` Türkçe içeriği "language leakage" sayarak build'i kırıyor. Yani "Türkçe içerik yok" bir bug değil, bir *strateji kararı*. Ancak `CLAUDE.md`'deki Türkçe niş kategoriler (`inceleme`, `build-rehberi`, `ucus-noktasi`, `yasal`) ve `.com.tr` alan adı bu kararla çelişiyor. **Bu bir ürün kararı gerektiriyor → "human input required".** Seçenekler: (a) İngilizce-önce global konumlandırmayı kabul edip `CLAUDE.md`'yi güncellemek, (b) `/tr` yerelleştirmesi ve SHY/SHGM içerik hattı açmak.

---

## 5. MEDIUM Bulgular

| ID | Bulgu | Kanıt | Efor |
|---|---|---|---|
| **MED-1** | **İlgili makale kartlarındaki 8 görselde `alt=""`** — bunlar dekoratif değil, gerçek makale kapakları. `CLAUDE.md` "Tüm görseller alt tag içermeli" kuralını ihlal ediyor. | `/article/analog-vs-digital…` üzerinde `document.images` taraması: `alt=""` + `src=/api/content/media/cover/…` olan 8 kayıt | 30 dk |
| **MED-2** | **13 sayfa 250 kelimenin altında (thin content)** — aralarında ana hub'lar var. | `/engineering/hardware\|firmware\|workshop` 9 kelime · `/regulations/airspace` 78 · `/archive/performance` 87 · `/contact` 109 · `/archive/micro` 119 · `/regulations/battery` 149 · `/tools` 150 · `/academy` 166 · `/archive` 180 · `/disclosure` 216 · `/advertise` 237 | 3 gün |
| **MED-3** | **Arama alaka düzeyi bozuk.** `"beginner drone"` → 8 sonuç; 1. sonuç doğru, **2–7. sonuçlar DCL yarış haberleri** (takım profilleri, puan durumu, Suudi ligi). Acemi kullanıcının ilk aramasında %75 alakasız sonuç. | `/search?q=beginner%20drone` canlı çıktı | 1 gün |
| **MED-4** | **Sözlük yalnızca 17 terim.** Anasayfa "GLOSSARY — Understand every FPV concept" vaat ediyor; arama sayfası 30 konu etiketi listeliyor. | `GET /api/academy/glossary` → `"count": 17` | 2 gün |
| **MED-5** | **Makalelerde sözlük/iç link desteği yok.** Amiral gemisi acemi rehberi 3971 kelime, ancak yalnızca **5 iç link** içeriyor ve bunların 3'ü politika sayfası (`/disclosure`, `/editorial-policy`, `/advertise`). Gerçek içerik linki: 2. Sözlük linki: **0** — metinde ELRS, LiPo, acro, whoop, cinewhoop terimleri geçmesine rağmen. "Sırada ne okumalı" CTA'sı yok. | `/article/best-fpv-drones-for-beginners-a-practical-buying-framework` DOM analizi | 1 gün |
| **MED-6** | **Kontrast: 7 metin stili WCAG AA altında.** En kötüler: `"Catalog/source image: BETAFPV"` **2.52:1** @10px · `"REFERENCE ONLY"` **3.07:1** @9px · breadcrumb `"HOME"` **3.72:1** @10px · `"GET STARTED"` **4.20:1** @9px · `"SOURCE TRAIL · 7 RECORDED REFERENCES"` **4.20:1** @10px. (Alfa kompozitleme `#050608` zeminine karşı canvas ile hesaplandı.) | Makale sayfası, çalışma zamanı ölçümü | 2 sa |
| **MED-7** | **38 dokunma hedefi 44×44px altında.** Kritik olanlar: hamburger **35×40**, mobil menü linkleri **h=32**, "Subscribe" **99×36**, "VIEW CALENDAR" **114×32**, kategori etiketleri **h=11**. | Anasayfa 375px, `getBoundingClientRect` taraması | 3 sa |
| **MED-8** | **Header arama input'unun `font-size: 11px`.** iOS Safari 16px altındaki input'a odaklanınca sayfayı otomatik yakınlaştırır ve geri çıkmaz. (CRIT-2 düzeltildiğinde ortaya çıkacak gizli hata.) | `SearchSection.tsx` input, computed `fontSize: "11px"` | 5 dk |
| **MED-9** | **Anasayfa bülten input'unda `<label>` yok.** `placeholder` var ama `aria-label`/`label[for]` yok → ekran okuyucu alanı isimsiz duyurur. | Anasayfa DOM: etiketsiz input listesi `["email:Email address"]` | 10 dk |
| **MED-10** | **API'lerde Türkçe kullanıcı mesajları** (İngilizce-önce ürün politikasına aykırı). 3 dosyada 10 dize. | `newsletter/subscribe/route.ts:6,17,38,40,50,54` · `pilot/register/route.ts:10,22,47` · `admin/cron/newsletter/route.ts:20,26` | 30 dk |
| **MED-11** | **163 makalenin 26'sında metadata bloğu tamamen eksik** (`difficulty`, `contentType`, `topics`, `audience`, `discipline`, `components`). Bu makaleler arama sayfasındaki filtrelerin hiçbirinde görünmüyor ve GEO için varlık sinyali taşımıyor. | `pnpm run metadata:audit` → `reports/unified-metadata-report.md` | 1 gün |
| **MED-12** | **HTML yükü ağır.** Anasayfa **433 kB** HTML, makaleler 270–340 kB (`/article/fpv-motors-kv-and-stator-explained` 292 kB / 586 ms; `/article/acro-stick-control-drills…` 182 kB / 670 ms — dev sunucu, üretim değil). Paylaşılan JS 103 kB ile makul; sorun RSC/HTML payload'ında. `/admin` 262 kB First Load JS, `/category/software` 285 kB. | Build route tablosu + 209 URL taraması | 1 gün |

---

## 6. LOW Bulgular

| ID | Bulgu | Kanıt |
|---|---|---|
| **LOW-1** | `src/app/archive/build/%5Bid%5D/` ve `src/app/archive/mission/%5Bid%5D/` dizinleri **yüzde kodlu literal isimler** taşıyor. Next.js bunları dinamik segment değil statik segment olarak ele alıyor → `/archive/build/123` **404**, yalnızca `/archive/build/%5Bid%5D` çalışıyor. Build çıktısında `○` (statik) olarak görünüyorlar. Hiçbir yerden link verilmiyor → ölü rota. |
| **LOW-2** | `llms.txt` (1465 bayt) yalnızca 9 hub linki içeriyor; **163 makalenin hiçbirini listelemiyor**. GEO açısından LLM tarayıcılarına içerik haritası sunulmuyor. Editoryal sınır ve atıf rehberi bölümleri ise iyi yazılmış. |
| **LOW-3** | Sitemap'te **163 URL'de `lastmod` var, 46 hub URL'sinde yok**. |
| **LOW-4** | `next.config.ts:5-7` — `eslint.ignoreDuringBuilds: true`. `lint:ci` ayrı çalıştığı için pratikte kapanmış bir açık, ancak CI atlanırsa lint hatası üretime sızabilir. |
| **LOW-5** | Build uyarısı: `jose@6.2.4` içinde `CompressionStream` Edge Runtime'da desteklenmiyor (`@auth/core` zinciri üzerinden). Şu an fonksiyonel etkisi yok; auth Edge'e taşınırsa kırılır. |
| **LOW-6** | Dekoratif sahte telemetri metinleri güven-kritik sayfalarda: `/regulations` ve `/regulations/airspace` üzerinde **"LATENCY: 12ms"**. Bir mevzuat sayfasında anlamsız ve güven zedeleyici. |
| **LOW-7** | `CLAUDE.md`'deki 8 script (`scripts/dify-trigger.sh` vb.) hâlâ repoda mevcut değil (31 Temmuz denetiminde tespit edilmişti, açık). Ek olarak dokümantasyon `npm run …` varsayıyor ancak bu makinede `npm` PATH'te yok; proje `pnpm` (+ `pnpm-workspace.yaml`) kullanıyor. |
| **LOW-8** | `pnpm run tools:audit` → **Blackbox Tuning = PARTIAL**: `fpv-flight-tuning` Qdrant koleksiyonunda GitHub UI kirliliği bilindiği için tam grounding iddia edilemiyor. Flight Critic = DEFERRED (bilinçli). Bu bilinen ve dürüstçe işaretlenmiş bir durum, kapatılmamış bir madde olarak taşınıyor. |

---

## 7. Persona Yolculukları — "FPV'ye yeni başlayan biri"

### Yolculuk 1: Anasayfadan "ilk drone'umu nasıl alırım" cevabına
**Yol:** `/` → aşağı kaydır → "BUYER GUIDES" kartı → `/buyers-guides`

**Gözlem:** Anasayfada ~11 bölüm var. Bunların **4'ü yayıncının kendi editoryal politikası hakkında**: "EDITORIAL TRUST LAYER", "AFFILIATE-READY WITHOUT PRETENDING TO BE BIGGER THAN WE ARE", "TRUSTED BY PROCESS, NOT CLAIMS", "NO FAKE SCALE". Öne çıkan istatistik kartlarından biri **"0 — FAKE EVENT DATES"**.

Acemi kullanıcı için bunların hiçbiri bir FPV sorusuna cevap vermiyor. "0 sahte etkinlik tarihi" bir okuyucunun aklına gelmeyen bir endişeye verilmiş cevaptır; okuyan kişide "demek ki burada sahte veri sorunu varmış" izlenimi bırakma riski taşır. Bu bölümler bir *affiliate başvuru dosyası* için yazılmış gibi duruyor — hedef kitle okuyucu değil, denetleyici.

**Ne eksik:** "Bütçen ne? → Sana uygun ilk kit bu" tarzında tek tıklık bir giriş noktası. `START LEARNING` butonu var ama nereye gittiği belirsiz.

**Öneri:** Editoryal güven bölümlerinden ikisini `/editorial-policy` ve `/disclosure` sayfalarına taşıyıp, anasayfada yerlerine "Bütçene göre ilk drone" ve "İlk 30 gün planı" bloklarını koymak.

---

### Yolculuk 2: `baslangic` ve `build-rehberi` kategorilerinde gezinme
**Yol:** `/academy` → "BEGINNER / START HERE" kartı

**Gözlem:** `/academy` IA'sı **gerçekten iyi**: BEGINNER (Start here) → STARTER KITS (Buying path) → GLOSSARY (Concept index) → SIMULATORS (Practice loop) sıralaması acemi zihin haritasıyla örtüşüyor. "ROADMAP / ASSESSMENT / PILOT DOSSIER" ikinci katmanı da mantıklı.

**Sorun:** Sayfa 166 kelime — sadece link kutuları (MED-2). Ve mobilde bu sayfaya hamburger menüden ulaşılamıyor (CRIT-1); yalnızca alt tab bar'daki ACADEMY ikonu üzerinden erişilebiliyor.

**Ayrıca:** `CLAUDE.md`'de tanımlı `baslangic` / `build-rehberi` slug'ları rota ağacında **yok**; karşılıkları `/academy` ve `/article/*` altındaki İngilizce kategoriler ("BUILD GUIDES", "FLIGHT GUIDES", "COMPONENTS"). Dokümantasyon-kod çelişkisi (HIGH-7 notu ile aynı kök neden).

---

### Yolculuk 3: Build Calculator'ı sıfır bilgiyle kullanmak
**Yol:** `/tools` → `/tools/calculator`

**Gözlem — bu, personanın en sert duvara çarptığı nokta.**

Araç kullanıcıdan **12 sayısal girdi** istiyor: FRAME (g), MOTOR EACH (g), STACK (g), CAMERA/VTX (g), PROPS TOTAL (g), PAYLOAD (g), BATTERY CELLS (S), CAPACITY (mAh), BATTERY WEIGHT (g), C RATING (C), MOTOR KV (KV), ESC RATING (A), PROP DIAMETER ("), PROP PITCH (").

Yeni başlayan biri bunların **hiçbirini bilmiyor**. Sayfada:
- Hiçbir terim açıklaması yok
- Sözlüğe tek bir link yok (`grep -rn "glossary" BuildCalculatorWidget.tsx` → **0 sonuç**)
- Tipik değer aralığı, örnek veya "bilmiyorsan şunu seç" yardımı yok

Çıktı `THRUST 7.9:1` ve `TIME 3.3M` olarak veriliyor — **yorum yok**. 7.9:1 iyi mi kötü mü, 3.3 dakika normal mi? Acemi kullanıcı sayıyı alır ama anlam çıkaramaz.

Hafifletici unsur: Üstte WHOOP / 3" / 5" / 7" preset'leri ve FREESTYLE 5:1 / RACING 8:1 / CINEMATIC 3.5:1 / LONG RANGE 3:1 profilleri var — bu doğru tasarım refleksi. Ancak preset'in ne yaptığı açıklanmıyor ve preset seçtikten sonra 12 alan yine görünür kalıyor.

**Mobilde ek sorun:** 375px'te ilk etkileşimli kontrol (preset butonları) ~1150px kaydırma sonrası geliyor; ilk 1,5 ekran ikon + başlık + açıklama kartına ayrılmış.

---

### Yolculuk 4: `yasal` içerikten "yasal uçabilir miyim" cevabını çıkarmak
**Yol:** `/regulations` → `/regulations/airspace`

**Sonuç: BAŞARISIZ.** Bkz. HIGH-7. Toplam 78 kelime, ekranda "0 documents indexing in the FPV reference library. Ready soon." Türkiye/SHGM/SHY'ye dair tek kelime yok. Ülke seçici yok. Kullanıcı siteyi terk edip Google'a döner.

Ayrıca mobilde bu sayfalara ulaşmanın tek yolu doğrudan URL — REGULATIONS menüsü hamburger içinde ve hamburger açılmıyor (CRIT-1).

---

### Yolculuk 5: Mobilde arama → makale → affiliate CTA (375px)
| Adım | Sonuç |
|---|---|
| Header arama kutusuna dokun | ❌ Odaklanmıyor; sayfa `/`'a gidiyor (CRIT-1 + CRIT-2) |
| Alt tab bar → SEARCH | ✅ Çalışıyor — tek işleyen arama yolu |
| `"beginner drone"` ara | ⚠️ 8 sonuç; 6'sı DCL yarış haberi (MED-3) |
| İlk sonuca gir | ✅ Makale açılıyor, 3971 kelime, breadcrumb + disclosure mevcut |
| Kapak görseli | ❌ Başlık/özet çakışması (HIGH-4) |
| Makale içi gezinme | ⚠️ 8 adet H2, **içindekiler tablosu yok** — 4000 kelimede mobil kaydırma cezası |
| Terimleri anlama | ❌ ELRS/LiPo/acro/whoop/cinewhoop geçiyor, sözlük linki 0 (MED-5) |
| Affiliate CTA | ❌ Makalede **gerçek ürün affiliate linki yok**. Genel olarak 163 makalenin **25'inde** affiliate URL'si var (`amazon.com\|getfpv.com\|banggood.com\|racedayquads.com` taraması) — yani amiral gemisi "buying framework" makalesi dahil %85'i para kazandırmıyor. |
| Yatay taşma | ✅ Yok (`scrollWidth == clientWidth`, hem 375 hem 1440) |
| Konsol hatası / 404 | ✅ Yok |

---

## 8. Düzeltme Sırası (önerilen)

**Sprint 0 — yarım gün, ürünü kullanılabilir hale getirir**
1. CRIT-1 — `Navbar.tsx:71` sarmalayıcısına `overflow-hidden` (15 dk)
2. CRIT-2 — `SearchSection`'ı navbar altına al ya da `layout.tsx:51`'den kaldır (10 dk)
3. MED-8 — arama input `font-size: 16px` (5 dk)
4. MED-7 — hamburger ve mobil menü linklerini 44px'e çıkar (3 sa)

**Sprint 1 — güvenlik sertleştirme (~1 gün)**
5. HIGH-1 — `rehype-sanitize` + CSP nonce
6. HIGH-2 — `pilot/register`'a zod + parola politikası + rate-limit; `details: error` kaldır
7. HIGH-3 — `contact`/`newsletter`/`analytics` uçlarına rate-limit; `contact` PII log'unu kaldır; enumerasyon mesajlarını tekilleştir

**Sprint 2 — SEO/GEO görünürlüğü (~1 hafta)**
8. HIGH-5 — hub'lara `Organization` + `WebSite/SearchAction` + `ItemList` + `BreadcrumbList`; JSON-LD `image` alanını mutlak URL'ye çevir
9. HIGH-6 — sitemap'ten 307'leri çıkar, kalıcı yönlendirmeye geçir
10. HIGH-4 — kapak üreticisinde başlık sarma + özet konumlandırmayı düzelt
11. LOW-2/LOW-3 — `llms.txt`'e makale indeksi, hub'lara `lastmod`
12. MED-1/MED-6/MED-9 — alt metinleri, kontrast, form etiketi

**Sprint 3 — içerik ve dönüşüm (~2-3 hafta)**
13. HIGH-7 — **ürün kararı sonrası**: yargı bölgesi seçimi + regülasyon içeriği
14. MED-2, MED-4, MED-5, MED-11 — thin hub'lar, sözlük genişletme, iç linkleme, eksik metadata
15. MED-3 — arama sıralamasında `difficulty`/`audience` ağırlıklandırması
16. Yolculuk 3 — Build Calculator'a terim ipuçları, tipik aralıklar ve sonuç yorumu
17. Affiliate kapsamını %15'ten yukarı çekmek

---

## 9. Human Input Required

| Konu | Karar |
|---|---|
| **Dil ve pazar** | İngilizce-önce global mi, `.com.tr` + Türkçe/SHGM yerelleştirmesi mi? Kod (`content-language-audit.ts`) ilkini zorunlu kılıyor, `CLAUDE.md` ve alan adı ikincisini ima ediyor. Bu karar HIGH-7, MED-10 ve `CLAUDE.md` güncellemesini kilitliyor. |
| **Anasayfa editoryal-güven ağırlığı** | 4 güven bölümü okuyucu için mi, affiliate denetçisi için mi tutuluyor? Cevap, Yolculuk 1'in çözümünü belirliyor. |
| **Affiliate kapsam hedefi** | 163 makalenin 25'inde link var. Hedef oran nedir? |

---

## 10. Denetlenmeyenler (dürüstlük sınırı)

Aşağıdakiler bu turda **ölçülmedi**; bu rapor bunlar hakkında hiçbir iddiada bulunmuyor:

- **Canlı üretim (`fpvlovers.com.tr`)** — tüm ölçümler yerel dev sunucuda yapıldı. Dev sunucu HTML boyutları ve yanıt süreleri üretimi temsil etmez; `Cache-Control: no-store` dev moduna aittir.
- **Gerçek Core Web Vitals** (LCP/CLS/INP alan verisi) ve Lighthouse skoru — Playwright kurulu (`devDependencies`) ancak bu turda CWV ölçümü yapılmadı.
- **Qdrant canlı doküman sayıları** — `tools:audit` bunları bilinçli olarak kontrol etmiyor; SSH/Dify Studio gerekiyor.
- **Admin paneli akışları** — tüm `/api/admin/*` uçları 401 döndü (doğru davranış), arkasındaki iş mantığı denetlenmedi.
- **E-posta gönderimi ve DB yazan uçlar** — yan etki üretmemek için POST uçları boş gövde ile yalnızca doğrulama katmanı seviyesinde test edildi.
- **Coolify auto-deploy** — hafızadaki nota göre hâlâ bozuk (elle redeploy gerekiyor); bu turda doğrulanmadı.
- **`.env` içeriği** — proje kuralı gereği okunmadı.

---

*Rapor salt-okuma denetimle üretildi; üretim kodunda, içerikte, migration'larda veya config'de hiçbir değişiklik yapılmadı.*
