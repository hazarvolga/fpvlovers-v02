# FPVLovers `/tools/` — Halüsinasyon Risk GAP Raporu

**Tarih:** 2026-07-31 · **Branch:** `main` (HEAD `f3b942b`) · **Kapsam:** `/tools/` altındaki 6 AI aracı (Part Matcher, Build Calculator/Build Wizard, Hardware Analyzer, Flight Critic, Component Duel, Blackbox Tuning) ve bunların gerçek/canlı veri kaynaklarıyla (Dify, Qdrant, crawler kataloğu) ilişkisi.

**Önceki ilgili raporlar:** `docs/gap-reports/2026-07-26-hallucination-gap-report.md` (⚠️ bu dosyanın büyük bölümü bozuk/anlamsız metin — bkz. §0), `docs/tool-gap-reports/2026-06-01-blackbox-tuning-gap-raporu.md` (tutarlı, büyük ölçüde hâlâ geçerli).

**Yöntem:** Statik kod okuma + canlı altyapı doğrulaması. Üç sunucudaki (Dify/Qdrant, web/crawler, crawler-backup) SSH erişimiyle **Qdrant vektör veritabanı doğrudan sorgulandı** (read-only), projenin kendi `scripts/tool-truth-audit.ts` denetim scripti yerel olarak çalıştırıldı, ve 6 aracın her biri için kod izi (widget → API route → lib → veri kaynağı) 6 paralel ajanla çıkarılıp, P0/P1 seviyesindeki her iddia ayrı bir "çürütmeye çalış" ajanıyla dosyalar tekrar okunarak bağımsızca doğrulandı. **7/7 P0-P1 iddia CONFIRMED** döndü — hiçbiri çürütülmedi.

---

## 0. Önce bir itiraf: önceki "halüsinasyon raporu" da halüsinasyon içeriyordu

`docs/gap-reports/2026-07-26-hallucination-gap-report.md` dosyasını bu denetimin girdisi olarak okuduk. Dosyanın önemli bir kısmı **bozuk, anlamsız, kelime karışımı metin** içeriyor (örnek, dosyadan birebir: *"PID tuning talebindeki: Arac Bilgi al packaging dataset boş Çalışma sıfır. Model ezberi aktif — eğitim verisindeki JP FPV/Delta E Vikisinden. her generic cevap NIC, specific NV data crafting hatalıdrone % handle thisink=ok ❌."*). Bu, muhtemelen bir LLM çıktısının doğrulanmadan commit edilmesinin sonucu — yani platformun "AI çıktısı doğrulanmadan yayınlanabiliyor mu?" sorusuna, kendi GAP raporlarından biri zaten kanıt teşkil ediyor. Bu raporda o dosyanın hiçbir iddiası doğrudan kaynak olarak kullanılmadı; sadece "kontrol edilecek" ipucu olarak alındı ve kodun güncel hâline karşı yeniden doğrulandı.

---

## 1. Yönetici Özeti

**Genel tablo, önceki iki rapordan farklı bir görüntü çiziyor: sorun "RAG boş" değil — sorun "RAG'in gerçek durumu hiçbir yerde doğru raporlanmıyor ve bazı yerlerde kirli."**

| Bulgu | Durum |
|---|---|
| `master-routing-tables.ts`'teki `docCount` tablosu | 🔴 **Yanlış — ama önceki raporların sandığının tersi yönde.** 9 dataset'ten 8'i canlıda koddaki sayıdan **çok daha dolu** (bkz. §2). |
| `fpv-flight-tuning` dataset'i (Blackbox Tuning'in ANA kaynağı) | 🔴 **Kirli.** Canlı Qdrant'ta örneklenen içeriğin önemli kısmı GitHub.com arayüz/navigasyon metni — FPV tuning içeriği değil (bkz. §2.2). |
| Projenin kendi `tools:audit` scripti | 🟡 6/7 araca **PASS** veriyor ama (a) bayat/yanlış `docCount` tablosuna güveniyor, (b) "Dify RAG ready=false" gibi kendi içindeki uyarıları statüye yansıtmıyor. |
| Deterministik/yerel çekirdekler (Build Calculator, Blackbox local guardrail, Component Duel'in `/tools/` yolu, Flight Critic'in `/tools/` yolu) | 🟢 Gerçekten güvenli, LLM'e hiç uğramıyor, kredi hak ediyor. |
| Dify'a bağlı LLM katmanları (6 araçtan 5'inde var) | 🔴 **Hiçbirinde** atıf/kaynak zorunluluğu, "kanıt yoksa reddet" mekanizması veya retrieval-kalite eşiği yok. |
| Aynı isim altında iki farklı deneyim deseni | 🔴 **İki kez tekrarlanan mimari risk** (bkz. §5) — güvenli `/tools/` versiyonunun yanında, gerçek sitede hâlâ erişilebilir, çok daha riskli bir "kardeş" sayfa var. |
| 2026-07-31 (bugünkü) `9680a54` commit'inin regresyon kontrolü | 🟢 AffexDuelEngine/duelEngine.ts'teki sahte fiyat/stok/FOMO dili **gerçekten temizlenmiş** (bkz. §6). Ama aynı ailenin daha hafif bir versiyonu (ungrounded skor/telemetri) hâlâ yaşıyor. |

**Sonuç: 1 P0, 6 P1, 12 P2, 6 P3 = 25 bulgu.** En kritik ikisi: (1) Hardware Analyzer'ın Dify yanıtını hiçbir doğrulama olmadan "Diagnostic Report" diye sunması, (2) Blackbox Tuning'in ana RAG kaynağının GitHub arayüz metniyle kirlenmiş olması ve buna rağmen sistemin bunu "Source-backed Review" etiketiyle gösterebilmesi.

---

## 2. Canlı Altyapı Kanıtı (bu oturumda toplandı)

### 2.1 `docCount` tablosu vs gerçek Qdrant verisi

`src/lib/master-routing-tables.ts`'teki `DATASETS` sabiti ile Dify'ın Qdrant'ındaki (`80.225.231.62`, `qdrant-mw8g48wcsc840cg4g80s8kw4` konteyneri) gerçek `points_count` değerleri karşılaştırıldı (read-only `curl` ile Dify API konteyneri üzerinden):

| Dataset | Koddaki `docCount` | Canlı Qdrant `points_count` | Kullanılan araç |
|---|---:|---:|---|
| `fpv-flight-tuning` | 11 | **1033** ⚠️ (bkz. §2.2 — içerik kirli) | Blackbox Tuning (ana) |
| `fpv-pid-profiles` | 0 | **38** | Blackbox Tuning (yedek) |
| `fpv-troubleshooting` | 0 | **16** | — |
| `fpv-components-specs` | 0 | **729** | Part Matcher / Hardware Analyzer (referans, kullanılmıyor) |
| `fpv-build-guides` | 0 | **94** | Build Wizard (referans, kullanılmıyor) |
| `fpv-news-reviews` | 1 | **334** | — |
| `fpv-racing-events` | 0 | **194** | — |
| `fpv-community-knowledge` | 3 | **1332** | — |
| `fpv-regulations` | 5 | **5** ✅ eşleşiyor | — |

Bu tablo koddaki `DATASETS.docCount` alanı **hiçbir aracın gerçek istek yolunda okunmuyor** (6 aracın hepsi için ayrı ayrı doğrulandı — her route.ts sadece `findApp()` ile token varlığına bakıyor, `DATASETS`'i import etmiyor). Yani bu yanlış sayılar davranışı bozmuyor, ama iki gerçek zarar veriyor:
1. Projenin kendi `scripts/tool-truth-audit.ts` denetim scripti bu tabloyu doğrudan okuyup raporuna yazıyor — yani platformun "gerçeklik denetimi" aracının kendisi yanlış veriye dayanıyor.
2. Hiçbir yerde retrieval'ın *gerçekten* çalışıp çalışmadığını doğrulayan otomatik bir devre kesici yok — sorumluluk tamamen Dify Studio'nun kendi (bu koddan görünmeyen) konfigürasyonuna devredilmiş durumda.

### 2.2 KRİTİK: Blackbox Tuning'in ana RAG kaynağı GitHub.com arayüz metniyle kirlenmiş

`fpv-flight-tuning` koleksiyonundan (Qdrant collection `Vector_index_3cd29883..._Node`, `group_id: d1d5e44b-...` = `fpv-flight-tuning`) rastgele örneklenen 6 chunk'ın **4'ü** gerçek FPV tuning içeriği değil, `github.com/betaflight/betaflight-configurator` sayfası ziyaret edilirken yakalanmış GitHub'ın kendi site kabuğu/navigasyon/pazarlama metni:

```
"APPLICATION SECURITY * GitHub Advanced Security Find and fix vulnerabilities..."
"Search or jump to... Search code, repositories, users, issues, pull requests..."
"GitHub Models Manage and compare prompts... MCP Registry Integrate external tools..."
"Dismiss alert {{ message }} [ betaflight ] / betaflight-configurator Public..."
```

Bu, crawler'ın bir Betaflight GitHub reposunu tararken gerçek README/wiki içeriği yerine GitHub'ın genel arayüz metnini çıkardığı anlamına geliyor — klasik bir "content extraction" hatası. **Bu koleksiyon, `INTENT_ROUTES` tablosunda `'tuning'` niyeti için PRİMARY dataset ve `Blackbox Tuning Advisor` Dify uygulamasının birincil kaynağı.** Bir kullanıcı PID/tuning sorusu sorduğunda, retrieval bu kirli chunk'lardan birini "en alakalı context" olarak seçebilir.

`fpv-components-specs` (729 kayıt) örnekleri gerçek FPV satıcı sayfalarıydı (RaceDayQuads, GEPRC, Holybro) ama çoğunlukla navigasyon/kategori metni — derin spec sayfası değil. Yani "boş" değil ama "sığ".

### 2.3 `tool-truth-audit.ts` taze çalıştırma sonucu (bu oturumda, yerel)

6/7 satır **PASS**, 1 satır (Flight Critic) **DEFERRED**. Script kendi çıktısında bile çelişkili sinyaller taşıyor — örn. Blackbox Tuning için: *"Dify RAG ready=false"* yazıyor ama genel statü yine de **PASS**. Bu, 2026-06-01 tarihli Blackbox raporunun "`tools:audit` çok toleranslı, bugünkü PASS yanıltıcı" tespitini bugün de doğruluyor ve artık tüm 6 araca genellenebilir.

---

## 3. Araç Bazlı Özet

| Araç | Çekirdek mimari | Halüsinasyon riski | LLM var mı? | Kaynak/atıf UI'da gösteriliyor mu? | "Kanıt yok → reddet" yolu var mı? |
|---|---|:---:|:---:|:---:|:---:|
| **Part Matcher** | Deterministik katalog eşleştirme (varsayılan) + opsiyonel Dify inceleme | 🟡 Orta | Evet (opsiyonel) | Hayır | Hayır |
| **Build Calculator / Build Wizard** | Sabit fizik formülleri (varsayılan) + opsiyonel Dify inceleme | 🟡 Orta | Evet (opsiyonel) | Hayır | **Evet** (token/dry-run/boş-yanıt üçlü fallback) |
| **Hardware Analyzer** | Katalog eşleştirme + opsiyonel Dify tanı | 🔴 **Yüksek** | Evet (opsiyonel, prod'da **aktif doğrulandı**) | Hayır | Hayır |
| **Flight Critic — `/tools/flight-critic`** | Tamamen yerel, deterministik BuildDNA kuralları | 🟢 Düşük | Hayır | — | — |
| **Flight Critic — `/category/software` (asıl pazarlanan "video analiz")** | Dosya adı/boyut/MIME → Dify'a serbest prompt | 🔴 **Yüksek** | Evet | Hayır | Hayır (token yoksa bile sabit skor döner, reddetmez) |
| **Component Duel — `/tools/component-duel`** | Tamamen yerel, katalog + `trustStatus==='VERIFIED'` şartı | 🟡 Orta* | Hayır | Kısmen | **Evet** (ama güvenilirlik puanı UI'da çelişkili gösteriliyor) |
| **Component Duel'in "kardeşi" AffexDuelEngine — `/category/parts`** | %100 sabit kodlanmış mock veri | 🟡 Orta (LLM yok ama gerçek olmayan veri gerçekmiş gibi sunuluyor) | Hayır (kod hazır ama hiç çağrılmıyor) | "BEST PICK" rozeti var ama kaynağı yok | Hayır |
| **Blackbox Tuning** | Deterministik keyword/regex motoru (varsayılan) + opsiyonel Dify | 🔴 **Yüksek** | Evet (opsiyonel) | Kısmen (ama koşulsuz "Source-backed" etiketi kırık) | Hayır |

*\*Component Duel'in `/tools/` yolu şu an %100 QUARANTINE katalog yüzünden fiilen hep "kazanan yok" diyor — yani bugünkü veri durumuyla güvenli, ama bu bir kod garantisi değil, veri tesadüfü.*

---

## 4. P0 — Kritik

### HA-P0-1 · Hardware Analyzer, doğrulanmamış Dify çıktısını "Diagnostic Report" olarak sunuyor

**Dosya:** `src/app/api/tools/hardware-analyzer/route.ts:180-195, 276-289`
**Doğrulama:** ✅ CONFIRMED (bağımsız ajan tarafından dosya yeniden okunarak doğrulandı)

`DIFY_APP_TOKEN_PART_MATCHER` prod'da tanımlı (`.env.local`'de dolu değer var — `tool-truth-audit.ts`'in PASS vermesi bunu zaten kanıtlıyor). Token doluysa:
- Prompt: *"Analyze this FPV component list for voltage, KV, ESC current margin, mounting, prop clearance..."* — hiçbir yerde "kanıt yoksa reddet" veya alıntı zorunluluğu yok.
- `extractDifyMarkdown()` sadece `data.answer` metnini okuyor, Dify'ın `retriever_resources` alanına (gerçek atıf verisi) hiç dokunmuyor.
- Sunucunun kendisinin hesapladığı gerçek `engineeringSafety` guardrail'ı (katalog kanıtına dayalı) JSON'da dönüyor ama **istemci hiç okumuyor** (bkz. HA-P1-1) — yani Dify başarılı olduğunda kullanıcı hiçbir güvenlik uyarısı görmüyor.
- Sonuç doğrudan `<h2>Diagnostic Report</h2>` başlığı altında, kaynak/güven göstergesi olmadan gösteriliyor.

**Somut senaryo:** Kullanıcı formdaki varsayılan değerlerle ("Apex 5\" Freestyle", "2207 2400KV", "45A 4-in-1", "6S 1300mAh LiPo"...) "RUN FULL DIAGNOSTIC"a basar. `fpv-components-specs`'in bu oturumda "sığ nav metni" olduğu doğrulandığından, Gemini 2.5 Flash spesifik görünen ama gerçekte uydurma bir ESC akım payı veya montaj-uyumluluğu iddiası üretebilir; arayüzde bunun ayırt edileceği hiçbir işaret yok.

**Çözüm:** (1) `engineeringSafety` alanını istemciye taşı ve her zaman göster, (2) prompt'a "sadece verilen context'ten alıntı yap, yoksa 'yetersiz kanıt' de" talimatı ekle, (3) `retriever_resources` boşsa/azsa `source:'dify'` yerine `source:'dify_unverified'` gibi ayrı bir durum döndür ve UI'da farklı renkte göster.

---

## 5. P1 — Yüksek Öncelik

Tüm P1 bulguları bağımsız ajanlarca **CONFIRMED** olarak doğrulandı.

### PM-P1-1 · Part Matcher: "Motor / battery cells" kontrolü kanıt yokken sessizce PASS veriyor

**Dosya:** `src/lib/tools/component-compatibility.ts:204-213`

Kardeş kontroller (KV penceresi, pervane açıklığı) kanıt yokken doğru şekilde `warn: doğrulanmamış` döner; bu kontrol tek başına kanıt eksikliğini "6S battery matches motor voltage tags" diyerek **PASS**'a çeviriyor. Katalogdaki 89 ürünün hiçbirinde `evidenceSpecs.cellCounts` alanı yok, yani bu dallanma bugün her zaman PASS'a düşüyor.

**Senaryo:** Kullanıcı gerçekte 4S'e özel bir motorla 6S pil seçse bile widget "PASS — 6S battery matches motor voltage tags" gösterir; motoru/ESC'yi yakabilecek bir eşleşme doğrulanmış gibi onaylanır.

**Çözüm:** Bu kontrolü kardeşleriyle tutarlı hale getir — kanıt yoksa `warn`, asla koşulsuz `pass` değil.

### HA-P1-1 · Hardware Analyzer: sunucunun hesapladığı güvenlik uyarısı istemciye hiç ulaşmıyor

**Dosya:** `src/features/tools/components/HardwareAnalyzer.tsx:8-14, 46-47`

İstemcinin `HardwareApiResponse` tipi `engineeringSafety`/`matchedProducts` alanlarını hiç içermiyor; `analyzeHardware()` sadece `data.markdown` ve `data.warning`'i okuyor. Sunucu (route.ts) her üç yanıt dalında da (`local`/`dify-fail`/`dify-success`) `engineeringSafety`'i JSON'a koyuyor ama hiçbir zaman gösterilmiyor — HA-P0-1'in doğrudan sebebi.

### FC-P1-1 · Flight Critic (video yolu): backend içeriği hiç okumadan skor/telemetri uyduruyor

**Dosya:** `src/app/api/analyze-flight/route.ts:106-118, 129-133`

Backend yüklenen videodan sadece `name`/`type`/`size` okuyor — video baytları asla okunmuyor/Dify'a gönderilmiyor. Buna rağmen prompt LLM'den kesin JSON şeması istiyor: `{"scores":{"flow":number,...},"verdict":...,"telemetrySimulation":[{"timestamp":"00:05","event":"string",...}]}`. Yani spesifik zaman damgalı "olaylar" ve sayısal skorlar **zorunlu olarak** LLM tarafından uyduruluyor; hiçbir gerçek görüntüye dayanmıyor.

**Senaryo:** "clean-run-final.mp4" adlı bir çarpışma videosu yüklense bile, model dosya adına bakıp güven verici skorlar ve "00:12 Tight gap threading — Low risk" gibi hiç olmamış olayları üretebilir; bunlar kalın "Verdict" başlığı altında gösterilir.

### FC-P1-2 · Flight Critic: "analiz ediliyor" ekranındaki SPD/ALT/G-FORCE göstergeleri saf `Math.random()`

**Dosya:** `src/features/tools/components/FlightCriticWidget.tsx:83-98, 194-202`

500ms'de bir `Math.random()` ile üretilen hız/irtifa/G-kuvveti değerleri, kullanıcının kendi videosu oynatılırken canlı telemetri izlenimi veriyor — hiçbir ekran etiketi bunların simülasyon olduğunu belirtmiyor.

### CD-P1-1 · Component Duel'in "kardeşi" AffexDuelEngine: sabit sahte "kazanan" gerçek site navigasyonundan erişilebilir

**Dosya:** `src/lib/duelEngine.ts:58-114`, `src/app/article/[slug]/page.tsx:45-46`

`getDuelComparison()` parametrelerini tamamen görmezden gelip her zaman aynı iki sabit ürünü (`motor-tmotor-f60`, `motor-xnova-2207` — **hiçbiri katalogda yok**) ve aynı "kazananı" döndürüyor. Bu, dev artifact'ı değil — her makalenin "parts"/"components" kategori breadcrumb'ı `/category/parts`'a bağlanıyor ve orada gerçek bir ziyaretçi "BEST PICK" rozetli, sabit, hiç güncellenmeyen bir "Official Build Protocol Verdict" görüyor. Tek koruma: `noindex` meta etiketi ve bir uyarı bandı — gerçek bir erişim engeli değil.

### BBT-P1-1 · Blackbox Tuning: `answerMode: 'dify_grounded'` etiketi kaynak sayısına bakmadan koşulsuz set ediliyor

**Dosya:** `src/app/api/tools/blackbox-tuning/route.ts:254-262`

Dify'dan gelen yanıt sadece "boş değil mi" diye kontrol ediliyor; `sources.length` veya `retrievalConfidence` hiç sorgulanmıyor. §2.2'de doğrulanan GitHub-kirliliğiyle birleşince: retrieval sıfır/irrelevant chunk döndürse bile UI "Source-backed Review" rozetini "Retrieval: 0/100" ile yan yana gösterebiliyor — kullanıcı bunu kaynaklı sanır.

---

## 6. Regresyon Kontrolü — CLAUDE.md'deki 73d8710 uyarısı

`CLAUDE.md`'nin YASAK bölümü, `AffexDuelEngine`/`FlightCriticWidget`/`duelEngine.ts`'e daha önce sahte fiyat/stok/abartılı skor dilinin sızdığını ve `73d8710` commit'iyle temizlendiğini, tekrarlanmaması gerektiğini söylüyor. Bugünkü `9680a54` commit'i ("fix(security): merge trust-ops hardening...") bu üç dosyayı tekrar değiştirdi. Doğrudan `git show 9680a54` ile diff incelendi:

- ✅ **Temiz:** `price`/`inStock`/`fomoAlert` alanları, Flame/ShoppingCart ikonları, "Buy $X" CTA'ları, sahte `AggregateOffer` schema — **hiçbiri artık yok**. `vendor.status` artık "Verification pending" diyor, fiyat göstermiyor. Sistem prompt'u "confident purchase'a yönlendir" diyen dilden "evidence-first reviewer... fiyat/stok/kanıt uydurma" diyen dile çevrilmiş.
- ⚠️ **Not:** Tam olarak aranan `73d8710` commit hash'i bu repo geçmişinde bulunamadı (muhtemelen `fpvlovers-v02` taşınması sırasındaki geçmiş temizliğinden önce kalmış), o yüzden o spesifik tarihsel olayı birebir doğrulayamadık — ama **bugünkü dosya hâli** iddia edilen düzeltmeyle tam örtüşüyor.
- 🟡 **Ama aynı ailenin daha yumuşak bir versiyonu hâlâ yaşıyor:** "fiyat/stok uydurma" spesifik olarak temizlendi, ama "kanıtsız sayısal skoru görsel otorite ile sunma" deseni FC-P1-1/FC-P1-2/CD-P1-1 olarak devam ediyor — sadece obje "fiyat" değil "performans skoru/telemetri/kazanan" oldu.

**Sonuç: regresyon YOK, ama düzeltmenin hedeflediği kök problem (kanıtsız-ama-otoriter-görünen çıktı) tam kapanmadı — yeni kılıkta sürüyor.**

---

## 7. P2 / P3 — Orta ve Düşük Öncelik (özet tablo)

| ID | Araç | Bulgu |
|---|---|---|
| PM-P2-1 | Part Matcher | Kataloğun 89/89 ürününde `evidenceSpecs` boş → calculator bloğu pratikte hep devre dışı, ayrı bir uyarı yok |
| PM-P2-2 | Part Matcher | "Run Compatibility Review" Dify çağrısında atıf zorunluluğu/"kanıt yoksa söyleme" talimatı yok |
| PM-P3-1 | Part Matcher | Bayat `docCount` bu aracı etkilemiyor (bilgi amaçlı, iyi haber) |
| BC-P2-1 | Build Wizard | Guided Review LLM metni "RAG datasets" iddiasına rağmen sıfır kaynak gösteriyor |
| BC-P3-1 | Build Wizard | `primaryDatasets` alanı sadece dokümantasyon, gerçek Dify çağrısına hiç iletilmiyor |
| BC-P3-2 | Build Wizard | Kaydedilmiş "dossier" varsa calculator girdileri sessizce ezilir, kullanıcı-girişi/otomatik-doldurma ayrımı UI'da yok |
| HA-P2-1 | Hardware Analyzer | Katalog eşleştirme düşük eşikli (score≥2) keyword benzerliğiyle çalışıyor; yanlış ürün "Catalog Match" seçilip Dify prompt'una kanıt gibi enjekte edilebilir |
| HA-P3-1 | Hardware Analyzer | 0/89 üründe `evidenceSpecs` var → "Engineering-safe: yes" dalı bugün fiilen ölü kod (güvenli ama kırılgan) |
| FC-P2-1 | Flight Critic | Dify yoksa/dry-run'da her video için birebir aynı sabit skor+verdict dönüyor, `source`/`warning` alanları UI'da hiç gösterilmiyor |
| FC-P2-2 | Flight Critic | JSON-LD `Review` şeması gerçek/sahte ayrımı yapmadan her zaman sayısal `ratingValue` yayınlıyor |
| FC-P3-1 | Flight Critic | Dify'ın döndürdüğü `verdict` metni runtime doğrulaması olmadan tip-cast ediliyor |
| FC-P3-2 | Flight Critic | Aynı "Flight Critic" adı iki farklı, zıt risk profiline sahip deneyime karşılık geliyor (bkz. §5) |
| CD-P2-1 | Component Duel | Telemetry Matrix, `trustStatus`'tan bağımsız ham `trustScore` sayısını gösteriyor — ProductCard'ın aynı sayıyı "N/A unverified" diye gizlemesiyle çelişiyor |
| CD-P2-2 | Component Duel | Doğrulanmamış ürünlerde bile "RESEARCH 87" gibi sayısal rozet gösteriliyor, metindeki "kazanan yok" ifadesiyle görsel çelişki yaratıyor |
| CD-P2-3 | Component Duel | Kataloğun `trustScore`'u `extractionConfidence` ile şüpheli derecede (89 üründe 64'ünde) birebir örtüşüyor — sentetik/placeholder güven sayısı olabilir |
| CD-P3-1 | Component Duel | `DUEL_SYSTEM_PROMPT` şu an ölü kod ama ileride bağlanırsa hiçbir JSON-şema/atıf doğrulayıcı yok |
| BBT-P2-1 | Blackbox Tuning | Dify yanıtını kabul etmeden önce tek kontrol "boş değil" — kaynak sayısı/güveni hiç sorgulanmıyor |
| BBT-P2-2 | Blackbox Tuning | Dify skor vermezse "Retrieval" göstergesi, retrieval'la ilgisiz bir metin-uzunluğu sezgiselliğine düşüyor (yanıltıcı güven verir) |
| BBT-P2-3 | Blackbox Tuning | Gyro modeline özel kapasitör/CLI önerileri kullanıcının gerçek log'undan tamamen bağımsız, sabit metin |
| BBT-P3-1 | Blackbox Tuning | "EXTRACTING LOG TELEMETRY..." ifadesi gerçekte sadece keyword/kolon-adı aramasını abartıyor |
| BBT-P3-2 | Blackbox Tuning | Bayat `docCount` bu aracı etkilemiyor (bilgi amaçlı) |

---

## 8. Önerilen Faz Planı

### Faz 1 — Acil, düşük maliyet (P0 + en ucuz P1'ler)
1. **[P0]** Hardware Analyzer: `engineeringSafety`'i istemciye taşı, her zaman göster.
2. **[P1]** Part Matcher: "Motor/battery cells" kontrolünü kardeşleriyle tutarlı `warn`'a çevir.
3. **[P1]** Blackbox Tuning: `answerMode` hesaplamasına `sources.length > 0` şartı ekle; boşsa `'local_only'` veya `'dify_unverified'` döndür.
4. **[P1]** Flight Critic (video): HUD'daki rastgele SPD/ALT/G-FORCE'a "SIMULATED" etiketi ekle veya tamamen kaldır.

### Faz 2 — RAG hijyeni (bu raporun asıl bulduğu kök sorun)
5. `fpv-flight-tuning` koleksiyonunu GitHub-kirliliği için temizle/yeniden crawl et; crawler'ın GitHub repo sayfalarında README/wiki içeriğini site kabuğundan ayıracak bir extraction kuralı ekle.
6. `master-routing-tables.ts`'teki `DATASETS.docCount` tablosunu ya canlı Qdrant'tan otomatik senkronize et ya da tamamen kaldır (şu an hiç kullanılmıyor, sadece yanıltıcı).
7. `scripts/tool-truth-audit.ts`'i gerçek Qdrant `points_count`'a bakacak şekilde güncelle; "Dify RAG ready=false" gibi iç uyarıları PASS/PARTIAL statüsüne yansıt.

### Faz 3 — Yapısal risk (aynı-isim-iki-deneyim deseni)
8. `/category/parts`'taki AffexDuelEngine'i ya gerçek kataloğa bağla ya da tamamen kaldır — şu an "kardeş" güvenli araç (`/tools/component-duel`) varken bu sürüm gereksiz risk taşıyor.
9. `/category/software`'deki video-analiz Flight Critic'i, `/tools/flight-critic`'in dürüst "deferred" konumlandırmasıyla hizala — ya video okumayı gerçekten uygula ya da aynı "postponed" etiketini buraya da koy.

### Faz 4 — Genel LLM çıktı disiplini (5 araç ortak)
10. Her Dify çağrısına ortak bir "yalnızca verilen context'ten alıntı yap, yoksa reddet" prompt fragmanı ve `retriever_resources` tabanlı atıf çıkarma ekle (şu an hiçbiri yok).
11. `extractDifyMarkdown()`'a kardeş bir `extractDifyCitations()` ekleyip tüm 5 LLM-destekli aracın UI'ında standart bir "Sources" bloğu göster.

---

## 9. Kısa Karar

Platformun deterministik/yerel çekirdekleri (Build Calculator'ın fiziği, Blackbox'ın keyword motoru, iki aracın `/tools/` altındaki katalog-temelli sürümleri) gerçekten dürüst ve güvenli — bunlara tam kredi verilmeli. Asıl risk, her aracın yanına eklenmiş "opsiyonel Dify LLM katmanı"nın hiçbirinde atıf/reddetme mekanizması olmaması ve bu katmanın beslendiği RAG verisinin (a) kod tarafında yanlış raporlanması (b) en azından bir dataset'te fiilen kirli olmasıdır. En yüksek kaldıraçlı iki adım: Hardware Analyzer'ın gizli güvenlik uyarısını yüzeye çıkarmak (kod değişikliği, saatler) ve `fpv-flight-tuning` koleksiyonunu temizlemek (veri operasyonu, ayrı bir crawl döngüsü gerektirir).
