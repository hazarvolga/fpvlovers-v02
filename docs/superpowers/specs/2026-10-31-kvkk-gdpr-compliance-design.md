# KVKK + GDPR/CCPA Uyum Tasarımı — FPVLovers

**Tarih:** 2026-10-31  
**Durum:** P0 planı main'de UYGULANDI (Task 1, 2, 3, 4, 4b, 5, 5b, 6, 7); kalan iş hukukçu incelemesi ile production yapılandırması ve deploy'dur.  
**İlgili plan:** `docs/superpowers/plans/2026-10-31-turkish-articles-c2.md` (C2'den bağımsız, paralel yürüyebilir)  
**Kapsam:** Türkiye'deki kullanıcılar (6698 KVKK), AB/AEA'daki kullanıcılar (GDPR + ePrivacy) ve ABD'deki kullanıcılar (CCPA/CPRA) için kişisel veri toplama, çerezler, aydınlatma, ticari elektronik ileti, yurt dışına aktarım, veri sahibi hakları ve saklama.

> Bu doküman mühendislik uyum tasarımıdır; nihai hukuki metinler Türkiye'de bir KVKK avukatı, AB için bir GDPR danışmanı tarafından onaylanmalıdır. Aşağıdaki "Kritik" bulgular hukuki metin onayından bağımsız olarak derhal düzeltilmelidir.

---

## 1. Neden şimdi

Bugünkü kod tabanı, kullanıcı verisini topluyor ancak toplama noktalarında aydınlatma, geçerli rıza kaydı, çıkış (unsubscribe) ve silme/ihraç yolu sunmuyor. En az üç bulgu tek başına idari yaptırım ve veri ihlali bildirimi riski taşıyor:

1. **Bülten gönderimi tüm abonelerin e-posta adreslerini tek `To:` başlığında birleştiriyor** → aboneler birbirinin adresini görüyor (KVKK m.12, GDPR m.32).
2. **Google Analytics, çerez bandındaki "Decline" seçeneğinden bağımsız olarak koşulsuz yükleniyor** → geçersiz çerez rızası (KVKK çerez rehberi, ePrivacy m.5(3)).
3. **Bültende unsubscribe bağlantısı ve İYS/6563 akışı yok** → Ticari Elektronik İleti mevzuatı ihlali.

---

## 2. Yasal çerçeve ve uygulanabilirlik

| Rejim | Ne zaman uygulanır | Bu projedeki durum |
|---|---|---|
| **KVKK 6698** | Türkiye'de yerleşik veri sahibi | Uygulanır. Aydınlatma (m.10), açık rıza (m.5/2, m.9), veri güvenliği (m.12), başvuru (m.13), yurt dışı aktarım (m.9) |
| **6563 Ticari Elektronik İleti** | Bülten/pazarlama e-postası | Uygulanır. Önceden onay, İYS kaydı, kolay çıkış hakkı |
| **GDPR** | AB/AEA'da bulunan kullanıcıya mal/hizmet sunma veya davranış izleme | Uygulanır (İngilizce site + AB'den erişim). m.6 hukuki sebep, m.13 aydınlatma, m.15–22 haklar, m.44+ aktarım, m.27 AB temsilcisi (değerlendirilecek) |
| **ePrivacy** | AB kullanıcısının cihazında çerez/izleme | Uygulanır. Zorunlu olmayan çerezler için önceden rıza |
| **CCPA/CPRA** | Kaliforniya tüketicisi + eşikler | Büyük olasılıkla eşik altında. "Sell/share" yok; yine de şeffaflık metni eklenir, eşikler yıllık kontrol edilir |
| **Mesafeli Sözleşmeler / Ön Bilgilendirme Formu** | Tüketiciye mesafeli satış | **Şu an uygulanamaz**: sitede ödeme/checkout yok, `about` sayfası açıkça "e-ticaret değil" diyor. Ücretli üyelik/kurs/dijital ürün eklenirse zorunlu hale gelir |

**VERBIS:** Veri Sorumluları Sicili yükümlülüğü 50+ çalışan veya yıllık 25 milyon TL+ bilanço eşiğine bağlı; mevcut ölçekte muhtemelen gerekmiyor. Eşik ve faaliyet alanı yıllık kontrol edilmeli.

---

## 3. Mevcut durum envanteri

### 3.1 Toplanan veriler ve akışlar

| Toplama noktası | Veri | Depolama | Rıza/aydınlatma kaydı | Bulgu |
|---|---|---|---|---|
| Bülten (`api/newsletter/subscribe`) | e-posta, `source` | `fpvlovers_app.newsletter_subscribers` | Yok; tek adımlı opt-in, onay metni/versiyonu/zaman damgası yok | **Kritik** |
| Bülten gönderimi (`newsletter-orchestrator`) | Alıcı listesi | — | Unsubscribe yok; tüm adresler tek `To:` | **Kritik** |
| İletişim formu (`api/contact`) | ad, e-posta, konu, mesaj | SMTP üzerinden e-posta; DB'ye yazılmıyor | Formda aydınlatma bağlantısı/checkbox yok | Yüksek |
| Pilot kaydı (`api/pilot/register`) | ad, e-posta, parola hash'i | `fpvlovers_app.users` | Kullanım koşulları/gizlilik onayı yok | Yüksek |
| OAuth (Google/Discord/GitHub) | ad, e-posta, avatar, sağlayıcı kimliği | `users`, `accounts` | Aydınlatma yok | Yüksek |
| Arama (`SearchClient` → `trackSearchEvent`) | Ham arama sorgusu, filtreler | `fpvlovers_analytics.events.metadata` | Aydınlatma yok; saklama süresi yok | Orta |
| Makale görüntüleme | slug, zaman | `fpvlovers_analytics.events` | Aydınlatma yok; saklama süresi yok | Orta |
| Affiliate tıklama | slug, sağlayıcı, URL | `fpvlovers_analytics.events` | Aydınlatma yok | Orta |
| Hız sınırlama | IP (yalnızca bellekte) | Süreç belleği | Kalıcı değil | Düşük |
| GA4 (`RootShell`) | çerez kimlikleri, sayfa görüntüleme | Google (ABD) | "Decline" GA'yı durdurmuyor | **Kritik** |
| Vercel Analytics | sayfa görüntüleme | Vercel | Coolify'da varsayılan kapalı (`VERCEL=1` değil) | Düşük |

### 3.2 Mevcut hukuki sayfalar

- `src/app/(en)/privacy/page.tsx` — yalnızca İngilizce, 12 Haziran 2026 tarihli.
- `src/app/(en)/terms/page.tsx`, `disclosure/page.tsx`, `editorial-policy/page.tsx` — yalnızca İngilizce.
- **Türkçe KVKK aydınlatma metni, çerez politikası, açık rıza/ticari ileti onayı ve veri sahibi başvuru sayfası yok.**
- `src/lib/i18n/locale.ts:11` — `TRANSLATED_PATHS` yalnızca `/`, `/academy`, `/guides`, `/search`. `localizePath('/privacy', 'tr')` İngilizce `/privacy` döndürüyor; Türkçe footer etiketi (`Gizlilik Politikası`) İngilizce sayfaya gidiyor.
- Gizlilik metni eksik/yanıltıcı: veri sorumlusu kimliği, hukuki sebepler, alıcılar, yurt dışı aktarım, saklama süreleri, başvuru yöntemi yok; "pilot dossier localStorage'da çerez olarak tutulur", "GA4 PII bağlamaz", "dilediğiniz an silebilirsiniz" ifadeleri kodla uyuşmuyor.

### 3.3 Çerez durumu

- `src/features/layout/components/CookieBanner.tsx:12-28` — yalnızca `localStorage`'e `accepted/declined` yazıyor; hiçbir script bu değeri okumuyor.
- `src/features/layout/components/RootShell.tsx:32-34` — `NEXT_PUBLIC_GA_ID` tanımlıysa `GoogleAnalytics` koşulsuz render ediliyor.
- Çerez politikası sayfası, tercih merkezi, kategori bazlı rıza ve rıza kaydı yok.
- Affiliate linkleri `rel="nofollow sponsored"` taşıyor (iyi); tıklama sonrası çerezleri satıcı kendi alan adında set ediyor. Sitede affiliate pikseli yok.

### 3.4 Üçüncü taraflar / yurt dışı aktarım

| Alıcı | Amaç | Konum (doğrulanacak) | Mevcut güvence |
|---|---|---|---|
| Contabo / Coolify (kendi sunucu) | Hosting, PostgreSQL, Redis, Dify, Qdrant | Almanya/AB olması bekleniyor | Yazılı DPA/SCC yok |
| Google (Gemini, GA4) | İçerik üretimi, RAG yanıtları, analitik | ABD | SCC/TIA yok; KVKK açık rıza yok |
| SMTP sağlayıcısı (`SMTP_HOST`) | İletişim + bülten | Bilinmiyor | DPA yok |
| Affiliate ağları | Tıklama sonrası satıcı | ABD/AB | Kullanıcı tıklamasıyla ayrı site; yine de aydınlatma gerekir |
| `ntfy.sh` | Operasyonel alarm | Almanya | Kişisel veri içermemeli; doğrulanmalı |

Kullanıcı aramaları Dify/Gemini'ye gidiyorsa, arama metni kişisel veri içerebilir; bu da yurt dışı aktarım kapsamına girer.

---

## 4. Değerlendirilen yaklaşımlar

### Yaklaşım A — Rıza-öncelikli, üçüncü taraf analitiği kaldır (önerilen)

- GA4 tamamen kaldırılır; mevcut birinci taraf `fpvlovers_analytics.events` çerezsiz/kişi kimliği olmadan kullanılır.
- Çerez bandı gerçek kategori tercihleri toplar; sunucu tarafında rıza kaydı tutulur.
- Yurt dışı aktarım yüzeyi Google Analytics kadar azalır; yalnızca içerik üretimi/RAG için Gemini kalır.

**Artı:** En düşük yasal risk, en az üçüncü taraf, en hızlı uygulama. **Eksi:** GA4 demografik/kanal raporları kaybedilir; iç paneldeki GA metrikleri sıfırlanır (mevcut iç analitikle ikame edilir).

### Yaklaşım B — GA4'ü rıza arkasında tut (Consent Mode v2)

- GA yalnızca `analytics` rızası verilince yüklenir; varsayılan reddedilmiş.
- Google'a aktarım için KVKK açık rızası + GDPR SCC/TIA gerekir.

**Artı:** GA raporları korunur. **Eksi:** Yurt dışı aktarım ve çerez rızası yüzeyi büyür; hukuki metin ve kayıt yükü artar.

### Yaklaşım C — Üçüncü taraf CMP (Cookiebot/Usercentrics)

- Hazır rıza yönetimi ve denetim izi.
- **Artı:** Hızlı. **Eksi:** Ücret, ek üçüncü taraf script, yine de bülten/DSAR/aydınlatma işi bize kalır; mevcut stack'e orantısız.

**Karar (öneri): Yaklaşım A.** Site zaten birinci taraf olay tabanlı analitik topluyor; GA4'ün sağladığı ek değer, getirdiği çerez rızası ve ABD aktarım yükünü karşılamıyor. GA kapatılamıyorsa B'ye geçilir; C önerilmez.

---

## 5. Hedef mimari

### 5.1 Çerez rızası ve tercih merkezi

- Kategoriler: `necessary` (her zaman açık), `analytics` (varsayılan kapalı), `marketing` (varsayılan kapalı; şu an sitede pazarlama pikseli yok, ileride affiliate/pixel için).
- İlk katman banner: "Kabul et" / "Reddet" / "Tercihleri yönet". Reddet, kabul kadar kolay (aynı görsel ağırlık).
- Tercih merkezi: kategori açıklamaları, amaç, süre, alıcı; "Seçimlerimi kaydet".
- Kayıt:
  - Birinci taraf çerez `fpv_consent` = `{ v, categories, ts, id }` (HttpOnly değil; client okur).
  - `POST /api/consent` ile `fpvlovers_app.consent_records` tablosuna sunucu zaman damgası, politika versiyonu, kategoriler, `source` ve rastgele `consent_id` yazılır. IP saklanmaz.
- "Çerez Tercihleri" footer bağlantısı her iki dilde.
- GA4 varsa yalnızca `analytics === true` olduğunda yüklenir; `CookieBanner` yerine `ConsentProvider` + `ConsentGatedAnalytics` client bileşenleri.
- Zorunlu çerezler: NextAuth oturum çerezi, CSRF; aydınlatmada listelenir.

### 5.2 Bülten: çift onay + İYS + çıkış

- Abone durumları: `pending` → `active` → `unsubscribed`.
- `POST /api/newsletter/subscribe`:
  - E-posta + **checkbox'sız olmayan** onay metni (önceden işaretli değil): "Aydınlatma metnini okudum; ticari elektronik ileti almayı kabul ediyorum."
  - Kayıt `pending` oluşturulur; onay metni versiyonu ve zamanı yazılır.
  - Onay e-postası gönderilir (bağlantı: `/api/newsletter/confirm?token=...`).
- `confirm`: token doğrulanır, `active`, `confirmed_at`, `consent_at`, `consent_version`, `consent_source` yazılır; kullanıcı yerelleştirilmiş onay sayfasına yönlendirilir.
- `GET/POST /api/newsletter/unsubscribe?token=...`: imzalı token ile `unsubscribed`; tek tıkla çalışır (RFC 8058).
- Her e-postada:
  - Görünür "Abonelikten çık" bağlantısı.
  - `List-Unsubscribe` ve `List-Unsubscribe-Post: List-Unsubscribe=One-Click` başlıkları.
  - Gönderen kimliği ve fiziksel/iletişim bilgisi.
- Gönderim: alıcı başına ayrı `sendEmail` (veya BCC), asla virgülle birleştirilmiş `To:` yok; parça (chunk) ve hata kaydı.
- İYS: hizmet sağlayıcı kaydı, onayların İYS'ye yüklenmesi, ret taleplerinin işlenmesi operasyonel zorunluluk. Kod tarafında `iys_status`, `iys_synced_at` alanları tutulur; İYS API entegrasyonu ayrı iş kalemi.
- Saklama: `pending` 30 gün sonra silinir; `unsubscribed` kaydı 2 yıl (ispat) sonra anonimleştirilir/silinir.

### 5.3 Analitik minimizasyonu

- `trackSearchEvent` ham sorguyu göndermez; yalnızca `queryLength`, `resultCount`, `filtersApplied` (filtre değerleri PII içerebilirse anahtar bazında beyaz liste).
- `page_view`, `affiliate_click` kişi kimliği taşımaz; `anonymous_id`/`session_id` kullanılmaz.
- Saklama: olaylar 180 gün; günlük özetler (rollup) süresiz kalabilir çünkü kişisel veri değil.
- `scripts/prune-analytics.ts` + zamanlanmış görev (Coolify scheduled task) veya manuel çalıştırma.
- GA4 kapatılırsa `google-analytics.ts` yalnızca admin raporu için kalır; admin panelinde "GA yapılandırılmadı" durumu gösterilir.

### 5.4 Hesap, DSAR ve silme

- Kayıt formunda zorunlu onay: "Kullanım Koşulları ve Gizlilik Politikası'nı okudum." (checkbox, varsayılan işaretsiz) + bağlantılar. Kayıt zamanı/versiyonu `users` tablosuna yazılır.
- `GET /api/pilot/account/export` — oturum sahibi için JSON (profil + ilerleme); KVKK m.11 / GDPR m.15.
- `DELETE /api/pilot/account` — oturum + parola doğrulaması; `users` silinir, `accounts`/`sessions`/`pilot_progress` CASCADE ile gider; e-posta bülten aboneliği ayrıca `unsubscribed` yapılır.
- `/legal/basvuru` (TR) ve `/legal/request` (EN) formu: talep türü, e-posta, açıklama; `privacy_requests` tablosuna kayıt + `hello@` bildirimi. Yanıt SLA'sı 30 gün (KVKK) / 1 ay (GDPR).
- Gizlilik metnindeki "dilediğiniz an silebilirsiniz" ifadesi ancak bu uçlar yayına girince doğru olur.

### 5.5 Hukuki sayfalar ve dil yönlendirmesi

Ortak bir içerik modülü (`src/lib/legal/documents.ts`) + tek render bileşeni (`LegalDocumentPage`) kullanılır; her metin TR/EN bölümlerinden oluşur.

**Türkçe (zorunlu):**
- `/tr/kvkk-aydinlatma` — veri sorumlusu, işleme amaçları, hukuki sebepler, alıcılar, yurt dışı aktarım, saklama, m.11 hakları, başvuru.
- `/tr/gizlilik-politikasi` — genel gizlilik + çerez özeti.
- `/tr/cerez-politikasi` — çerez tablosu, süreler, kategori, tercih linki.
- `/tr/kullanim-kosullari`.
- `/tr/ticari-iletisim-onayi` — 6563 kapsamında onay metni.
- `/tr/acik-riza-yurtdisi-aktarim` — yurt dışı aktarım için ayrı açık rıza (eğer açık rıza temel alınacaksa).
- `/tr/veri-basvuru` — DSAR formu.
- `/tr/ortaklik-aciklamasi` ve `/tr/yayin-ilkeleri` — mevcut İngilizce sayfaların çevirisi (ikincil öncelik).

**İngilizce:**
- `/privacy` (GDPR odaklı, mevcut sayfa yeniden yazılır), `/cookie-policy`, `/terms`, `/legal/request`, gerekirse `/legal/ccpa-notice`.

**Yönlendirme:** `localizePath` hukuki yollar için yetmez (TR slug'ları farklı). `legalPathFor(key, locale)` eşlemesi eklenir; footer, sitemap alternates ve dil değiştirici bunu kullanır. `TRANSLATED_PATHS`'e hukuki yollar eklenmez; ayrı harita tutulur.

**Veri sorumlusu bloğu:** Ad/unvan, adres, vergi/MERSIS, KEP, e-posta, varsa VERBIS no. Bunlar `src/lib/legal/controller.ts` içinde tek kaynaktan gelir; değerler sağlanana kadar sayfa yayınlanmaz (build-time guard veya `notFound`).

### 5.6 İşleme envanteri ve aktarım kaydı

- `docs/legal/2026-10-31-processing-register.md` (ROPA): faaliyet, veri kategorisi, amaç, hukuki sebep, alıcı, aktarım, saklama.
- `docs/legal/2026-10-31-transfer-assessment.md`: her alıcı için ülke, aktarım mekanizması (yeterlilik / standart sözleşme / açık rıza), TIA özeti, DPA durumu.
- `docs/legal/2026-10-31-breach-runbook.md`: 72 saat bildirim akışı, sorumlular, şablon.
- İşletme sahibi DPA/SCC imzalarını tamamlar; kod tarafında yalnızca envanter ve metinler tutulur.

### 5.7 Çocuklar ve yaş kapısı

Site 13/16 yaş altına yönelik değil. Kayıt formunda "13 yaşından büyüğüm" beyanı ve ebeveyn bilgilendirmesi eklenir; yüksek risk görülürse doğrulama ayrı değerlendirilir.

---

## 6. Veri modeli değişiklikleri (migration 0011)

```sql
-- newsletter_subscribers
ALTER TABLE fpvlovers_app.newsletter_subscribers
  ADD COLUMN status TEXT NOT NULL DEFAULT 'active',          -- pending | active | unsubscribed
  ADD COLUMN confirmed_at TIMESTAMPTZ,
  ADD COLUMN consent_at TIMESTAMPTZ,
  ADD COLUMN consent_version TEXT,
  ADD COLUMN consent_source TEXT,
  ADD COLUMN iys_status TEXT DEFAULT 'not_synced',
  ADD COLUMN iys_synced_at TIMESTAMPTZ;
-- mevcut kayıtlar 'active' kalır; geriye dönük rıza kaydı yoksa yeniden onay kampanyası gerekir

-- users
ALTER TABLE fpvlovers_app.users
  ADD COLUMN terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN terms_version TEXT,
  ADD COLUMN age_attested_at TIMESTAMPTZ;

-- consent records
CREATE TABLE fpvlovers_app.consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_id TEXT NOT NULL UNIQUE,
  categories JSONB NOT NULL,
  policy_version TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- privacy requests
CREATE TABLE fpvlovers_app.privacy_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL,          -- access | delete | correct | object
  email TEXT NOT NULL,
  user_id UUID REFERENCES fpvlovers_app.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open', -- open | in_progress | done | rejected
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
```

Notlar:
- Saklanan bir token hash sütunu yoktur: unsubscribe ve confirm token'ları sunucu tarafında HMAC-SHA256 ile deterministik olarak türetilir (`NEWSLETTER_TOKEN_SECRET`, tanımlı değilse `AUTH_SECRET`), `unsubscribe:`/`confirm:` alan ayırıcılarıyla domain-separated üretilir ve `timingSafeEqual` ile doğrulanır. DB'de yalnızca abone satırı tutulur; ham token hiçbir yerde saklanmaz.
- `consent_records` IP/user-agent saklamaz; ispat için zaman + politika versiyonu + kaynak yeterli kabul edilir.
- `privacy_requests.details` serbest metin olduğundan 30 gün sonra silinebilir; yalnızca durum kaydı tutulur.
- Saklama süreleri `scripts/privacy-retention.ts` (`pnpm privacy:retention`) ile zorlanır: analitik olayları 180 gün, `pending` aboneler 30 gün, `unsubscribed` kayıtları 2 yıl, `consent_records` 5 yıl. Bu görev Coolify'da zamanlanmış görev olarak kurulmalıdır; aksi halde saklama taahhüdü fiilen uygulanmaz.

---

## 7. Uygulama sırası

### P0 — Derhal (yasal riski durdur)

1. `NewsletterOrchestrator.dispatchCampaign`: alıcı başına gönderim + unsubscribe bağlantısı + `List-Unsubscribe` başlıkları. **Tek `To:` birleştirmesi kaldırılır.**
2. `/api/newsletter/unsubscribe` (imzalı token) ve `/api/newsletter/confirm`; subscribe akışı `pending` + onay e-postası.
3. GA4 yüklemesi kaldırılır veya rıza kapısı arkasına alınır; `CookieBanner` gerçek tercih merkezine dönüşür, "Reddet" GA'yı engeller.
4. Türkçe `/tr/kvkk-aydinlatma` + `/tr/cerez-politikasi` + `/tr/kullanim-kosullari` yayınlanır; footer ve toplama noktalarına bağlantı eklenir.
5. Bülten, iletişim ve kayıt formlarına aydınlatma bağlantısı + onay checkbox'ı.
6. Veri sorumlusu kimlik bloğu (`controller.ts`) doldurulur.
7. Mevcut gizlilik metnindeki yanıltıcı ifadeler düzeltilir.

### P1 — 2–3 hafta

8. `consent_records` + `/api/consent` + kategori bazlı gating (marketing/analytics).
9. Bülten DB migrasyonu, İYS alanları, çift onay tam akışı, yeniden onay kampanyası (mevcut aboneler için).
10. DSAR formu + `privacy_requests`, hesap ihracı/silme uçları ve UI.
11. Analitik minimizasyonu (ham arama sorgusu kaldırma) + 180 gün saklama temizliği.
12. İngilizce GDPR gizlilik/çerez metinleri, veri işleyici listesi, CCPA şeffaflık notu.
13. ROPA, aktarım değerlendirmesi ve ihlal runbook'u.

### P2 — Sonraki

14. İYS API entegrasyonu, DPA/SCC imza takibi, AB temsilcisi değerlendirmesi.
15. Çerez tarayıcı/otomatik envanter, yıllık VERBIS/eşik kontrolü.
16. Ortaklık açıklaması ve yayın ilkelerinin Türkçe çevirisi.

---

## 8. Yalnızca işletme sahibinden gelebilecek bilgiler

Bunlar sağlanmadan hukuki metinler yayınlanamaz:

1. **Veri sorumlusu kimliği:** gerçek kişi mi şirket mi; tam ad/unvan, adres, vergi no/MERSIS, KEP, iletişim e-postası, varsa VERBIS no.
2. **Sunucu ve SMTP sağlayıcısının ülkesi** (Contabo veri merkezi ve `SMTP_HOST` sağlayıcısı) — yurt dışı aktarım metni buna bağlı.
3. **AB'de yerleşik temsilci atanıp atanmayacağı** (GDPR m.27).
4. **İYS hizmet sağlayıcı kaydının durumu** ve mevcut abonelere yeniden onay gönderilip gönderilmeyeceği.
5. **Ticari model:** ileride ücretli üyelik/kurs/dijital ürün planı var mı? Varsa mesafeli satış + ön bilgilendirme formu kapsama girer.
6. **Hukuki metin onayı** için KVKK/GDPR danışmanı.

---

## 9. Doğrulama

- `scripts/privacy-compliance-regression-test.ts`:
  - GA bileşeni rıza olmadan render edilmiyor.
  - `CookieBanner` "Decline" seçimi analytics kategorisini kapalı bırakıyor.
  - Bülten gönderimi alıcı başına ayrı `to` üretiyor; `List-Unsubscribe` başlığı var.
  - Unsubscribe token'ı geçersizse 400/404; geçerliyse `is_active=false`.
  - `/tr/kvkk-aydinlatma`, `/tr/cerez-politikasi`, `/tr/kullanim-kosullari` ve İngilizce karşılıkları 200 dönüyor.
  - Footer TR'de Türkçe hukuki sayfalara, EN'de İngilizce sayfalara gidiyor.
  - Aydınlatma metni zorunlu başlıkları içeriyor (veri sorumlusu, amaç, hukuki sebep, aktarım, saklama, haklar, başvuru).
  - `trackSearchEvent` ham `query` göndermiyor.
- Manuel: tarayıcıda çerez temizken GA ağ isteği yok; kabul sonrası var; tercih merkezi kalıcı.
- Bülten: gerçek bir test adresiyle çift onay, çıkış ve tekrar abone olma.
- Hukuki metinler avukat incelemesinden geçmeden "tamamlandı" sayılmaz.

---

## 10. Kapsam dışı

- Ödeme/checkout, mesafeli satış sözleşmesi ve ön bilgilendirme formu (ürün yok).
- İYS API'sinin tam entegrasyonu (P2; P0/P1'de manuel/alan bazlı takip).
- AB temsilcisi ataması ve DPA/SCC imzaları (hukuki/operasyonel).
- Affiliate ağlarının kendi çerez politikaları (satıcı sorumluluğu; biz yalnızca yönlendiririz).
- Admin paneli erişim güvenliği (Basic Auth fallback) — ayrı güvenlik işi.

---

## 11. Riskler ve geri alma

- **GA kaldırma:** admin panelindeki GA metrikleri boş görünür; iç analitikle ikame edilir, gerekirse consent-gated GA'ya dönülür.
- **Çift onay:** mevcut abone listesi "pending"e düşerse gönderim durabilir; geçişte mevcut kayıtlar `active` kalır + yeniden onay kampanyası yapılır.
- **Yanlış hukuki metin:** veri sorumlusu bilgileri ve aktarım mekanizması yanlışsa metin riski büyür; avukat onayı zorunlu.
- **Geri alma:** her adım ayrı commit; çerez/gating kapatılabilir; newsletter akışı özellik bayrağıyla eski tek adımlı akışa döndürülemez (güvenlik nedeniyle geri dönüş önerilmez).
