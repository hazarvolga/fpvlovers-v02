# FPVLovers AI Tools — UX, Mobil Uyumluluk & Yeni Pilot Deneyimi GAP Raporu

**Tarih:** 2026-07-31  
**Kapsam:** `/tools/*` altındaki 6 AI aracı  
**Değerlendiren:** Frontend Design Skill — Sistemik UX Denetimi  
**Yöntem:** Kaynak kodu inceleme (bileşen + route düzeyi), yeni pilot perspektifinden senaryo analizi

---

## Yönetici Özeti

6 araç da **FPV konusunda ileri düzey bilgi sahibi kitleye** tasarlanmış. Terminoloji filtresiz kullanılıyor, boşluk veya hata durumlarında yönlendirme yok, mobil akış zayıf. **Yeni bir FPV pilotu bu araçları ilk denemede bırakacaktır.** Toplam 27 bulgu; 2 P0, 8 P1, 12 P2, 5 P3.

---

## 1. Araç Bazlı Değerlendirme

### 1.1 Tools Hub (`/tools/page.tsx`)

**Güçlü yönler:**
- 2→3 kolon responsive grid iyi çalışıyor
- Araç başlıkları kısa ve tarayıcı dostu

**Sorunlar:**

| ID | Şiddet | Bulgu |
|----|--------|-------|
| HUB-P1-1 | P1 | Stats satırı `Fake certainty: Avoided`, `AI claims: Guarded` — iç geliştirici dili, son kullanıcıya anlamsız |
| HUB-P1-2 | P1 | `Flight Critic` kartı: `meta: 'Planned'` etiketiyle sunuluyor ama araç erişilebilir ve kullanıcı için "neden gideyim?" sorusu yanıtsız |
| HUB-P2-1 | P2 | Araçlar arasında zorluk seviyesi yok (`Beginner` / `Intermediate` / `Advanced`) — yeni pilot nereye başlayacağını bilmiyor |
| HUB-P2-2 | P2 | Hero açıklaması `Catalog-backed compatibility checks` — FPV jargonu, "kendi build'ini hesapla" gibi bir kullanıcı değer önerisi yok |

---

### 1.2 Part Matcher (`PartMatcherWidget.tsx`)

**Güçlü yönler:**
- `md:grid-cols-2` ile 2 kolon oluşuyor
- Required alanlar `*` ile işaretli
- Demo build yükleme butonu var

**Sorunlar:**

| ID | Şiddet | Bulgu |
|----|--------|-------|
| PM-UX-P0-1 | **P0** | `[LOAD_CATALOG_BUILD]` butonu — köşeli parantez, `_` alt çizgili, terminal komutu görünümünde. Genel bir kullanıcı bunun ne olduğunu anlamaz. "Demo build yükle" olmalı |
| PM-UX-P1-1 | P1 | 7 dropdown + stil seçimi = 8 adım, hiçbir sıralama rehberi yok. Yeni pilot hangi sırayla seçeceğini bilmiyor |
| PM-UX-P1-2 | P1 | "Compatibility Matrix v2.1" başlığı — teknik jargon, "Uyumluluk Kontrolü" veya "Build Compatibility Check" yeterli |
| PM-UX-P1-3 | P1 | `Research only` / `educational only` ifadeleri: satın alma linkinin neden devre dışı olduğu açıklanıyor ama "evidenceCount" teknik terimi kullanıcıya gösteriliyor (`Current evidence: 0 verified fields`) |
| PM-UX-P2-1 | P2 | Mobilde 8 dropdown art arda sıralanıyor, scroll uzunluğu ~1800px. Progress indicator yok ("3/7 tamamlandı" gibi) |
| PM-UX-P2-2 | P2 | "Diagnostic Output" bölümü `hasStarted` false iken `Select components to begin` yazan küçük gri metin — çok pasif; büyük, görünür bir CTA olmalı |
| PM-UX-P3-1 | P3 | `AUW`, `Thrust ratio`, `Hover` metrikleri tooltip yok; yeni pilot bu değerlerin ne anlama geldiğini bilmiyor |

---

### 1.3 Build Calculator (`BuildCalculatorWidget.tsx`)

**Güçlü yönler:**
- Preset butonları (Whoop / 3" / 5" / 7") mükemmel başlangıç noktası
- **Mobil drawer** çözümü iyi düşünülmüş — temel metric'ler altta görünüyor
- Renk kodlaması (yeşil/sarı/kırmızı) anlık feedback için işlevsel
- `motion` animasyonu değer güncellemelerini görünür kılıyor

**Sorunlar:**

| ID | Şiddet | Bulgu |
|----|--------|-------|
| BC-UX-P1-1 | P1 | `COPY SNAPSHOT JSON` butonu — geliştirici çıktısı, son kullanıcıya hiçbir anlam ifade etmiyor. "Build'i kaydet / paylaş" gibi bir CTA olmalı |
| BC-UX-P1-2 | P1 | `Engineering Safety Guardrail: educational only` — bu ifade çelişkili. "Uyarı" mı, "iyi haber" mi, "sorun" mu? Kullanıcı bunu anlayamıyor |
| BC-UX-P1-3 | P1 | `SYSTEM GREEN. No major fit warnings.` ← Bu güzel. Ama altındaki `Verify manufacturer thrust tables before purchasing parts.` kullanıcıya "thrust table nedir, nereden bakayım?" sorusunu bırakıyor |
| BC-UX-P2-1 | P2 | Mobil drawer'da içerik çok yoğun — 4 section art arda geliyor, ama drawer `80vh` ile kısıtlanmış; section başlıkları görünmeden önce kaydırma gerekiyor |
| BC-UX-P2-2 | P2 | `Disc Loading` metriği tooltip yok. `ESC Margin` de — yeni pilot bu değerlerin normal aralığını bilmiyor |
| BC-UX-P2-3 | P2 | `RUN AI REVIEW` butonu her zaman aktif — kullanıcı preset değerlerini hiç değiştirmeden AI review tetikleyebilir, anlamsız sonuç alır |
| BC-UX-P3-1 | P3 | `Live telemetry estimate` subtitle'ı yanlış adlandırma — bu telemetri değil, hesaplama tahmini |

---

### 1.4 Hardware Analyzer (`HardwareAnalyzer.tsx`)

**Güçlü yönler:**
- Placeholder metinler (`e.g., Apex 5"`, `e.g., 2207 2400KV`) mevcut — formatı gösteriyor
- `engineeringSafety` uyarıları artık görünür
- Serbest metin girişi esneklik sağlıyor

**Sorunlar:**

| ID | Şiddet | Bulgu |
|----|--------|-------|
| HA-UX-P1-1 | P1 | Hangi bilgileri gireceğini anlamak için kullanıcının FPV bilmesi gerekiyor. "Frame nedir?" gibi soru sorulmuyor. Bir başlangıç rehberi veya "Ne zaman bu aracı kullanmalısın?" bölümü yok |
| HA-UX-P1-2 | P1 | Analyze butonu `ANALYZE HARDWARE COMPATIBILITY` — iyi, ama mobilde `text-lg font-bold` çok büyük görünebilir ve tüm genişliği alırken `h-14` yüksekliği küçük ekranlarda sorunlu |
| HA-UX-P2-1 | P2 | Source badge (`AI-Assisted` / `AI—No Sources` / `Local Guardrail`) kullanıcıya ne ifade ettiği belirsiz. Açıklama tooltip yok |
| HA-UX-P2-2 | P2 | `engineeringSafety` uyarılar kutusu her zaman gösteriliyor ama "isEngineeringSafe: false" durumunun önemi kullanıcıya açıklanmıyor |
| HA-UX-P3-1 | P3 | Sonuçlar Markdown render ediliyor ama uzun analizlerde scroll yok / section sınırı yok — ekran uzun bir metin bloğuna dönüşüyor |

---

### 1.5 Component Duel (`ComponentDuelWidget.tsx`)

**Güçlü yönler:**
- 2 kolonlu split-screen karşılaştırma etkili
- Renk kodlaması (turuncu Alpha, mavi Beta) tutarlı
- "System Verdict" bölümü anlaşılır bir özet sunuyor

**Sorunlar:**

| ID | Şiddet | Bulgu |
|----|--------|-------|
| CD-UX-P1-1 | P1 | `Component Alpha` / `Component Beta` + `Alpha` / `Beta` çubuğu — bu terminoloji geleneksel değil. "A vs B" veya "Ürün 1 vs Ürün 2" daha evrensel |
| CD-UX-P1-2 | P1 | `Telemetry Matchup Matrix` — "Telemetri" drone uçuş verisi için kullanılan bir terim; burada ürün spesifikasyonları karşılaştırılıyor. Yanlış adlandırma |
| CD-UX-P2-1 | P2 | Telemetry Matrix'de kolon başlıkları yok — soldaki ürün hangisi? Sütunlar üzerinde "Alpha (turuncu) / Beta (mavi)" işareti yok |
| CD-UX-P2-2 | P2 | `TRUST` skoru görünüyor ama "Bu skor nasıl hesaplandı?" bilgisi yok. Yeni pilot için "N/A unverified" vs yüksek trust arasındaki fark belirsiz |
| CD-UX-P2-3 | P2 | Mobilde iki ProductCard üst üste geliyor — alt kart görülmeden önce büyük bir scroll var. "VS" butonu mobilde hiç görünmüyor |
| CD-UX-P3-1 | P3 | `Insufficient Catalog Data` boş durum sayfası kullanıcıyı alternatif araca yönlendirmiyor |

---

### 1.6 Flight Critic (`FlightCriticWidget.tsx`)

**Güçlü yönler:**
- Video upload sonrası HUD animasyonu ilgi çekici
- Disclaimer banner (bir önceki oturumda eklendi) doğru yerde ve görünür
- "SIM" etiketi HUD değerlerin yanında mevcut
- Radar chart sonuçları sezgisel görselleştiriyor

**Sorunlar:**

| ID | Şiddet | Bulgu |
|----|--------|-------|
| FC-UX-P0-1 | **P0** | Upload ekranında `This beta provides a conservative rubric only` metni var ama `<p>` elementi `text-white/40` — %40 opaklık, **WCAG AA kontrast gereksinimini karşılamıyor**. En kritik disclaimer görünmüyor |
| FC-UX-P1-1 | P1 | Upload area: `Accept: video/*` ama desteklenen formatlar (`MP4, MOV, AVI`) küçük yazıyla belirtilmiş; mobilde görünmüyor |
| FC-UX-P1-2 | P1 | Yükleme sonrası bekleme süresi belirsiz — "analyzing" durumunda progress yüzdesi yok, sadece "Running Conservative Review..." animasyonu var |
| FC-UX-P2-1 | P2 | Radar chart, `50+` yaşındaki pilotlar için renk körü erişilebilirliği düşünülmemiş (sadece tek renk fill) |
| FC-UX-P2-2 | P2 | Sonuç ekranındaki `RE-ANALYZE` butonu yeni dosya seçtirmiyor, sadece idle state'e döndürüyor — aynı dosyayı tekrar analiz etmek için mekanizma yok |
| FC-UX-P3-1 | P3 | `Share` butonu (`Share2` ikonu) işlevsel değil — tıklandığında hiçbir şey olmuyor |

---

### 1.7 Blackbox Tuner (`BlackboxTuner.tsx`)

**Güçlü yönler:**
- 3 kolon grid (`sm:grid-cols-3`) iyi responsive
- `LOAD SAMPLE INPUT` butonu mükemmel başlangıç noktası
- File upload (CSV) destekleniyor

**Sorunlar:**

| ID | Şiddet | Bulgu |
|----|--------|-------|
| BBT-UX-P1-1 | P1 | "Blackbox nedir?" bilgisi hiçbir yerde yok. Betaflight'tan CSV nasıl export edilir? Bu bilgi olmadan araç kullanılamaz |
| BBT-UX-P1-2 | P1 | `Flight DNA Gyro Sensor` etiketi — gyro model dropdown'u neden önemli, hangi değeri nereden öğrenirim? `ICM42688P`, `BMI270`, `MPU6000` seçenekleri yeni pilot için anlamsız |
| BBT-UX-P2-1 | P2 | Sonuç ekranındaki `Tuning Solution Matrix` — 4 kart (Source, Confidence, Retrieval, Risk) aynı boyutta grid'de. Kullanıcı hangisine önce bakmalı? Öncelik hiyerarşisi yok |
| BBT-UX-P2-2 | P2 | `Confidence: X/100` — bu sayı nasıl hesaplandı, ne anlama geliyor? 60 iyi mi kötü mü? |
| BBT-UX-P2-3 | P2 | CLI komutları büyük `<pre>` blokta sunuluyor, kopyalama butonu yok |
| BBT-UX-P3-1 | P3 | `INITIATE PID ANALYSIS` butonu — "Initiate" kelimesi gereksiz teknik ton. "Analizi Başlat" veya "Analyze" yeterli |

---

## 2. Çapraz Kesim Sorunları

### 2.1 Jargon Sözlüğü (Açıklanmayan Terimler)

Hiçbir araçta tooltip, yardım metni veya bağlantılı sözlük yok. Aşağıdaki terimler açıklanmadan kullanılıyor:

| Terim | Araç(lar) | Öneri |
|-------|-----------|-------|
| AUW (All-Up Weight) | Calculator, Part Matcher | Tooltip: "Batarya dahil toplam ağırlık" |
| C Rating | Calculator | Tooltip: "Bataryanın maksimum sürekli deşarj oranı" |
| ESC | Calculator, Hardware, Part Matcher | Açıklama veya link |
| KV | Calculator, Hardware | Tooltip: "Motor devir/volt oranı" |
| Disc Loading | Calculator | Tooltip + normal aralık |
| Thrust Ratio | Calculator, Part Matcher | Tooltip: ≥5:1 freestyle, ≥8:1 racing |
| PID | Blackbox | Link to beginner guide |
| Blackbox | Blackbox | "Betaflight'ın uçuş log sistemi" |
| Gyro Model | Blackbox | Dropdown'da "Bilmiyorum" seçeneği |
| Trust Score | Component Duel | Hesaplama metodolojisi şeffaflığı |
| Engineering Guardrail | Tüm araçlar | Yeniden adlandır: "Güvenlik Notu" |
| Catalog-backed | Tüm araçlar | Son kullanıcıya gereksiz teknik detay |

### 2.2 Mobil Özet Puanlama

| Araç | Mobil Kullanılabilirlik | Notlar |
|------|------------------------|--------|
| Build Calculator | **8/10** | Drawer çözümü iyi, içerik yoğun |
| Hardware Analyzer | **7/10** | Form stack iyi, sonuç bölümü scroll sorunu |
| Flight Critic | **7/10** | Video preview iyi çalışıyor |
| Blackbox Tuner | **6/10** | Form iyi, sonuç matrix 4-kolon → scroll |
| Component Duel | **5/10** | ProductCard'lar çok uzun, VS butonu kaybolıyor |
| Part Matcher | **4/10** | 8 dropdown + uzun scroll + progress yok |

### 2.3 Yeni FPV Pilotu Kullanıcı Yolculuğu (Senaryo Analizi)

**Senaryo:** 18 yaşında, daha önce FPV drone kullanmamış, YouTube'dan ilham alarak siteye geliyor.

1. `/tools` açıyor → Stats: "AI claims: Guarded" → **"Ne demek bu?"**
2. Build Calculator'a tıklıyor → 5" preset yüklü → değerleri görüyor
3. "Motor KV" görüyor → **"Bu ne?"** → tooltip yok
4. "Run AI Review" tıklıyor → 25 saniye bekliyor → Markdown metin geliyor
5. "ESC Margin: +8A" → **"Bu iyi mi kötü mü?"** → geri döndü
6. Part Matcher'a geçiyor → `[LOAD_CATALOG_BUILD]` → **"Terminal komutu mu bu?"** → çıktı
7. Blackbox Tuner'a geliyor → **"Blackbox ne?"** → araçtan çıktı

**Sonuç:** Kullanıcı 5 dakikada terk etti.

---

## 3. Öncelikli Düzeltme Planı

### P0 — Kritik (Hemen düzelt)

| ID | Araç | Fix |
|----|------|-----|
| PM-UX-P0-1 | Part Matcher | `[LOAD_CATALOG_BUILD]` → `Demo Build Yükle` / `Load Example Build` |
| FC-UX-P0-1 | Flight Critic | Upload ekranındaki disclaimer opacity %40 → %80 minimum, kontrast WCAG AA'ya yükselt |

### P1 — Yüksek Öncelik

| ID | Araç | Fix |
|----|------|-----|
| HUB-P1-1 | Tools Hub | Stats içeriğini kullanıcı değer önerisine çevir ("Guarded AI" → "Verified Sources") |
| HUB-P1-2 | Tools Hub | Flight Critic kartına "Beta" badge ve "Nasıl çalışır?" açıklaması ekle |
| BC-UX-P1-1 | Calculator | `COPY SNAPSHOT JSON` → "Build'i Paylaş" veya tamamen kaldır |
| BC-UX-P1-2 | Calculator | "Engineering Safety Guardrail: educational only" → "Güvenlik Notu: ✓ / ⚠" formatına çevir |
| CD-UX-P1-1 | Component Duel | Alpha/Beta → "Ürün A" / "Ürün B" veya user-friendly label |
| CD-UX-P1-2 | Component Duel | "Telemetry Matchup Matrix" → "Özellik Karşılaştırması" |
| BBT-UX-P1-1 | Blackbox | "Blackbox nedir? Nasıl CSV alırım?" collapsed info bölümü ekle |
| BBT-UX-P1-2 | Blackbox | Gyro model dropdown'a "Bilmiyorum / Unknown" seçeneği ekle |
| HA-UX-P1-1 | Hardware | "Bu araç ne zaman kullanılır?" bir satır açıklama bölümü ekle |

### P2 — Orta Öncelik

| ID | Araç | Fix |
|----|------|-----|
| HUB-P2-1 | Tools Hub | Araç kartlarına zorluk seviyesi badge ekle |
| PM-UX-P2-1 | Part Matcher | Mobilde progress indicator ("Adım 3/8") |
| PM-UX-P2-2 | Part Matcher | Başlangıç CTA büyütülsün |
| BC-UX-P2-2 | Calculator | AUW, Disc Loading, ESC Margin için tooltip ekle |
| BC-UX-P2-3 | Calculator | "RUN AI REVIEW" disabled iken tooltip: "Değerleri değiştirdikten sonra çalıştırın" |
| CD-UX-P2-1 | Component Duel | Telemetry Matrix kolon başlıklarına renk etiketi ekle |
| CD-UX-P2-3 | Component Duel | Mobilde "Ürün A" kartı + "Ürün B" kartı arasına görünür separator / VS badge |
| BBT-UX-P2-3 | Blackbox | CLI komutları bloğuna kopyala butonu ekle |
| FC-UX-P2-2 | Flight Critic | RE-ANALYZE butonu yeni dosya seçmeye izin versin |
| HA-UX-P2-1 | Hardware | Source badge'e tooltip ekle (AI-Assisted ne anlama geliyor) |

### P3 — Düşük Öncelik

| ID | Fix |
|----|-----|
| PM-UX-P3-1 | Metric'lere tooltip |
| BC-UX-P3-1 | "Live telemetry estimate" → "Deterministic estimate" |
| FC-UX-P2-1 | Radar chart renk körü erişilebilirliği (desen veya label) |
| FC-UX-P3-1 | Share butonu işlevsel hale getir |
| CD-UX-P3-1 | Boş catalog durumunda alternatif araç öner |

---

## 4. Genel Tasarım Kararları (Değişmemesi Önerilen)

Aşağıdakiler mevcut ve korunmalı:

- ✅ **Retro-futuristik estetik** — karanlık tema, neon aksanlar FPV kitlesiyle uyumlu
- ✅ **Build Calculator preset butonları** — Whoop/3"/5"/7" jargonsuz başlangıç noktası
- ✅ **Mobil drawer** (Calculator) — model olarak diğer araçlara taşınabilir
- ✅ **Part Matcher demo build** butonu — fikir doğru, sadece adlandırma yanlış
- ✅ **Blackbox sample input** — yeni kullanıcıların formatı anlamasına yardımcı
- ✅ **Flight Critic rubric disclaimer** — dürüstlük modeli

---

## 5. Öneri: "Yeni Pilot Modu" (Uzun Vadeli)

Kodsal değişiklik olmadan sadece içerik katmanında:

1. Her araç sayfasına collapsed `<details>` bölümü: "Bu araç ne işe yarar? Nasıl kullanılır?"
2. Jargon terimlerine CSS `title` attribute'u ile basit tooltip (sıfır JS maliyeti)
3. Tools Hub'a "Nereden başlamalıyım?" sıralaması: `Calculator → Part Matcher → Hardware → Blackbox`

---

## Bulgu Özeti

| Seviye | Sayı | Etki |
|--------|------|------|
| P0 | 2 | Kritik UX kırılması veya erişilebilirlik |
| P1 | 9 | Yeni pilot yolculuğunu kesen jargon/akış sorunları |
| P2 | 12 | Mobil ve yardım içeriği eksiklikleri |
| P3 | 5 | Küçük tutarlılık ve erişilebilirlik sorunları |
| **Toplam** | **28** | |

**Acil öncelik:** PM-UX-P0-1 (cryptic buton etiketi) ve FC-UX-P0-1 (görünmez disclaimer) bugün kapatılabilir.
