# FPVLovers Blackbox Tuning — GAP Raporu

**Tarih:** 2026-06-01  
**Canlı URL:** `https://fpvlovers.com.tr/tools/blackbox-tuning`  
**Aktif frontend dizini:** `fpvlovers-frontend-websitesi/`  
**Durum:** Analiz + GAP raporu. Ürün koduna müdahale edilmedi.

---

## 1. Yönetici Özeti

Blackbox Tuning aracı canlıda erişilebilir ve temel akış çalışıyor: sayfa HTTP 200 dönüyor, form render ediliyor, API route deterministic local analiz döndürebiliyor. Kod mimarisi önceki riskli client-side Gemini yaklaşımından doğru yere taşınmış: UI sadece form gönderiyor, `/api/tools/blackbox-tuning` server route'u önce local guardrail analizi yapıyor, sonra Dify `Blackbox Tuning Advisor` app'ine `src/lib/dify-client.ts` üzerinden gitmeyi deniyor.

Ancak aracın bugünkü ürün vaadi ile gerçek yetenek seviyesi arasında önemli fark var:

- Canlı API smoke testinde yanıt `source=local` geldi ve `Dry-run is active in this environment` uyarısı döndü. Yani production kullanıcıları şu anda gerçek Dify/RAG zenginleştirmesi almıyor.
- `.bbl/.bfl` dosya yükleme kabul ediliyor ama gerçek Blackbox binary parser yok; dosya sadece `file.text()` ile düz metin gibi okunuyor.
- RAG tarafında tuning corpus sınırlı: routing tablosu `fpv-flight-tuning=11`, `fpv-pid-profiles=0`, `fpv-troubleshooting=0` gösteriyor. `tools:audit` aracı Blackbox'ı `PASS` sayıyor ama pratik ürün standardı için bu durum `PARTIAL` olmalı.
- UI kullanıcıya örnek değerlerle geliyor ve buton hemen aktif. Bu hızlı demo için iyi, fakat gerçek kullanıcı veri girmeden "analysis" çalıştırabilir; demo ile gerçek analiz ayrımı yok.

**Sonuç:** Araç MVP olarak kullanılabilir, ama "real blackbox log analysis" değil; şu an "symptom + text excerpt based PID/filter advisor" seviyesinde. Production-ready konumlama için P0: prod dry-run kapatma / Dify smoke, gerçek log parser kararı ve RAG corpus güçlendirme.

---

## 2. İncelenen Kanıtlar

### Kod kapsamı

- `src/app/tools/blackbox-tuning/page.tsx`
- `src/features/tools/components/BlackboxTuner.tsx`
- `src/app/api/tools/blackbox-tuning/route.ts`
- `src/lib/tools/blackbox-tuning.ts`
- `src/lib/dify-client.ts`
- `src/lib/dify-response.ts`
- `src/lib/master-routing-tables.ts`
- `scripts/tool-truth-audit.ts`
- `PROJECT_MEMORY.md`
- `NEXT_ACTIONS.md`

### Çalıştırılan kontroller

- `curl -I https://fpvlovers.com.tr/tools/blackbox-tuning` → HTTP 200, prerender cache HIT.
- Canlı API POST smoke → `success=true`, `source=local`, `warning=Dry-run is active in this environment`, `confidence=77`, `riskLevel=high`.
- `npm run tools:audit` → Blackbox Tuning `PASS`, routing tuning docs `11`.
- Headless Chromium canlı render/click smoke → sayfa render oluyor, buton var, click sonrası dry-run/local uyarısı ve confidence metni görünüyor.

---

## 3. Mevcut Mimari

```text
/tools/blackbox-tuning
  -> BlackboxTunerWidget ("use client")
      -> FormData POST /api/tools/blackbox-tuning
          -> parseRequest()
              - text fields
              - optional file, max 256KB
          -> analyzeBlackboxTuning()
              - deterministic symptom parser
              - local PID/filter suggestions
          -> findApp("Blackbox Tuning Advisor")
          -> difyRequest("/chat-messages")
              - 15s timeout
              - CRAWL_DRY_RUN/dev dry-run guard
              - rate/budget logging
          -> extractDifyMarkdown()
              - strips <think>...</think>
          -> fallback to local response
```

### Güçlü taraflar

- Client tarafında API key yok.
- Dify çağrısı tek gateway üzerinden geçiyor.
- Dify yoksa deterministic local fallback var.
- Dosya boyutu limiti mevcut.
- Dify reasoning block temizliği var.
- Prompt konservatif: motor heat, small steps, invented channel uyarısı içeriyor.

---

## 4. GAP Bulguları

| ID | Katman | Bulgu | Ciddiyet | Etki |
|---|---|---|---|---|
| BBT-P0-1 | Prod/Dify | Canlı API `source=local` ve `Dry-run is active` dönüyor | P0 | Kullanıcı gerçek RAG/Dify cevabı almıyor |
| BBT-P0-2 | Log parsing | `.bbl/.bfl` kabul ediliyor ama gerçek binary/parser yok | P0 | "Blackbox log analysis" vaadi teknik olarak karşılanmıyor |
| BBT-P0-3 | RAG | `fpv-pid-profiles=0`, `fpv-troubleshooting=0`; tuning corpus dar | P0 | Öneriler yeterince kaynak destekli değil |
| BBT-P1-1 | Audit | `tools:audit` Blackbox'ı sadece app token + 11 doc ile `PASS` sayıyor | P1 | Gerçek kalite riski dashboard'da gizleniyor |
| BBT-P1-2 | UX | Form default örneklerle geliyor ve analiz butonu hemen aktif | P1 | Demo analiz ile kullanıcı analizi karışıyor |
| BBT-P1-3 | Output trust | Dify/RAG cevabında citation/source listesi UI'da yok | P1 | Kullanıcı önerinin kaynağını göremiyor |
| BBT-P1-4 | Safety | Exact PID değerleri confidence/RAG source olmadan verilebiliyor | P1 | Yanlış tune/motor heat riski |
| BBT-P1-5 | Input model | Drone type, battery, PIDs free-text; Betaflight sürümü, frame size, prop, motor KV, ESC protokolü yok | P1 | Öneriler bağlam eksikliğiyle kaba kalıyor |
| BBT-P1-6 | Accessibility | Input label'ları `htmlFor/id` ile bağlı değil; ikonlar dekoratif olarak işaretlenmemiş | P1 | Assistive tech deneyimi zayıf |
| BBT-P2-1 | Observability | UI dry-run/local durumunu gösteriyor ama gateway latency, token, retrieval confidence yok | P2 | Admin/ops kalite takibi sınırlı |
| BBT-P2-2 | Testing | Blackbox analyzer için regression/unit test yok | P2 | PID/filter davranışı sessizce bozulabilir |
| BBT-P2-3 | Monetization | Sonuç ekranında ilgili safe CTA, guide linki veya tuning checklist capture yok | P2 | Lead/affiliate fırsatı kaçıyor |

---

## 5. RAG ve Crawl4AI GAP Analizi

### Mevcut RAG durumu

`src/lib/master-routing-tables.ts` içinde Blackbox app:

- App: `Blackbox Tuning Advisor`
- Primary datasets: `fpv-flight-tuning`, `fpv-pid-profiles`
- Routing doc counts:
  - `fpv-flight-tuning`: 11
  - `fpv-pid-profiles`: 0
  - `fpv-troubleshooting`: 0

Bu yapı temel tuning sorularına cevap için başlangıçtır, fakat gerçek blackbox yorumlama için yetersizdir. Özellikle PID profile dataset'in boş olması, aracın "profile recommendation" veya "known good baseline" iddiasını zayıflatır.

### RAG Engineer değerlendirmesi

Blackbox query türleri genellikle exact + troubleshooting + technical procedure karışımıdır. Vector-only yaklaşım burada yeterli olmaz; şu sinyaller için hybrid retrieval gerekir:

- `propwash`, `bounce-back`, `D-term noise`, `gyro noise`, `RPM filter`, `dynamic notch`
- Betaflight sürümü: `4.3`, `4.4`, `4.5`
- CLI parametreleri: `set dterm_lpf1_static_hz`, `dyn_notch_count`, `rpm_filter_harmonics`
- Log feature names: `gyro_scaled`, `setpoint`, `pid_sum`, `debug[0]`

Kaynak metadata'sı korunmalı: source URL, Betaflight version, firmware family, date, document type, confidence, heading path. RAG cevabı citation veremiyorsa UI confidence düşmeli.

### Crawl4AI önerisi

Direkt Crawl4AI çağrısı yapılmamalı. Bu araç için kaynak genişletme `src/lib/crawl-queue.ts` veya mevcut seed/source-pack akışıyla, önce dry-run doğrulamasıyla yapılmalı.

Önerilen Blackbox/Tuning source pack:

| Kaynak tipi | Örnek kaynak | Dataset |
|---|---|---|
| Betaflight resmi tuning docs | Betaflight PID tuning, filtering, blackbox docs | `fpv-flight-tuning` |
| Betaflight CLI/reference | Filter/PID CLI parameter docs | `fpv-pid-profiles` |
| UAV Tech / tuning guides | PIDToolbox workflow, filter tuning | `fpv-flight-tuning` |
| Oscar Liang tuning guides | Propwash, filters, RPM filtering | `fpv-flight-tuning` |
| Community known-good profiles | RotorBuilds / IntoFPV tuning examples | `fpv-pid-profiles` |
| Troubleshooting docs | hot motors, desync, oscillation diagnosis | `fpv-troubleshooting` |

Dry-run komut standardı:

```bash
CRAWL_DRY_RUN=true npm run catalog:sources
CRAWL_DRY_RUN=true bash scripts/crawl4ai-run.sh rcgroups
```

Not: Product catalog komutları ürün odaklıdır; Blackbox tuning corpus için ayrı tuning source-pack veya RAG seed pack daha doğru olur.

---

## 6. İçerik Üretim Standartları Açısından GAP

Aracın output dili şu an İngilizce. Bu doğru. Fakat Dify prompt'unda içerik standardındaki `Write strictly in English` kuralı açık şekilde yok. Blackbox app prompt'u veya route prompt'u şu kuralı net taşımalı:

```text
Write strictly in English. Use FPV terms naturally: quad, FC, D-term, RPM filter, propwash, bounce-back.
```

Teknik spec/veri kuralı:

- Exact PID önerileri RAG confidence düşükse veya sadece local heuristic varsa "starting point" olarak etiketlenmeli.
- Betaflight version bilinmiyorsa versiyona özel CLI parametreleri verilmemeli.
- Confidence `< 72` ise exact sayılar yerine "increase/decrease slightly" dili kullanılmalı.
- Kaynak yoksa "refer to Betaflight docs / manufacturer specs" fallback'i kullanılmalı.

---

## 7. UI/UX GAP Analizi

### Mevcut iyi taraflar

- Tool ilk ekranda gerçek aracı gösteriyor, landing page değil.
- File upload var.
- Result panelinde source/confidence/risk kartları var.
- Dry-run/local uyarısı kullanıcıya gösteriliyor.

### Eksikler

1. **Demo ve gerçek kullanım ayrımı yok**  
   Form default örneklerle dolu. Bu hızlı demo için iyi ama kullanıcı butona basınca kendi logunu analiz ettiğini sanabilir. Çözüm: `Load sample` butonu + boş başlangıç formu veya demo badge.

2. **Input validation zayıf**  
   `problem`, `logData`, `file` alanlarından biri route'ta zorunlu, ama UI tarafında buton her zaman aktif. Çözüm: required state + clear helper.

3. **Gerçek log beklentisi yönetilmiyor**  
   `.bbl/.bfl` accept listesinde ama gerçek parser yok. Çözüm: ya accept'i `.txt,.csv,.log` ile sınırlamak ya da "binary BBL support coming soon" etiketi.

4. **Sonuçlar grafik değil**  
   Blackbox tuning kullanıcısı gyro/setpoint/D-term trace bekler. MVP text-only olabilir ama "real analyzer" konumlaması için en azından parsed telemetry preview/chart gerekir.

5. **Safety copy eksik**  
   Motor heat stop condition local markdown'da var ama input formunda güvenlik beklentisi yok. Form üstüne "never apply large PID changes without motor heat checks" kısa safety line eklenmeli.

---

## 8. Teknik Mimari GAP Analizi

### Deterministic analyzer

`src/lib/tools/blackbox-tuning.ts` anahtar kelime tabanlı çalışıyor:

- `propwash` → D artır, P azalt
- `bounce-back` → D artır, FF azalt
- `overshoot` → P azalt, D artır
- `hot motor/desync` → D azalt, lowpass düşür, notch artır
- `NNNHz` → resonance tespiti

Bu MVP için iyi guardrail, fakat eksikler:

- Axis-aware değil: roll/pitch/yaw ayrı PID çıkmıyor.
- Throttle band ayrımı yok: low/mid/high throttle oscillation farklı yorumlanmalı.
- D-term noise vs gyro noise ayrımı yok.
- Betaflight sürümüne göre filter slider/CLI farkı yok.
- Current PIDs parser sadece `P/I/D/FF` toplam değer okuyor; axis-specific veya Betaflight profile dump okuyamıyor.

### API route

İyi:

- 256KB upload limit var.
- 60k char truncate var.
- 15s Dify timeout var.
- Fallback deterministik.

Risk:

- Binary `.bbl/.bfl` dosyalar `file.text()` ile anlamsız karakterlere dönüşebilir.
- Dify exception catch detayları loglanmıyor; kullanıcıya local fallback dönüyor ama ops hangi Dify hatası olduğunu route seviyesinde göremeyebilir.
- Dify cevabında source/citation parse yok.

---

## 9. Önerilen Faz Planı

### Faz 1 — Truthful MVP hardening (P0)

**Hedef:** Aracı "safe text-based tuning advisor" olarak dürüst hale getirmek.

- Production env'de `CRAWL_DRY_RUN` / dry-run sebebini kontrol et.
- Canlı smoke hedefi: API `source=dify` döndürmeli veya UI bunu "local guardrail mode" olarak bilinçli etiketlemeli.
- `.bbl/.bfl` upload vaadini geçici olarak sınırlı göster: "text export / CLI dump / CSV excerpt".
- UI'da demo sample ile gerçek input ayrımı yap.
- `tools:audit` Blackbox kriterini sertleştir:
  - `Blackbox Tuning Advisor` token var
  - tuning docs >= 20
  - pid profiles docs >= 5
  - live smoke source=dify veya explicitly local-only mode

### Faz 2 — RAG corpus and citations (P0/P1)

**Hedef:** Dify cevabı kaynak destekli olsun.

- Blackbox/Tuning source-pack oluştur.
- Önce `CRAWL_DRY_RUN=true` ile queue/dry-run doğrula.
- `fpv-pid-profiles` ve `fpv-troubleshooting` dataset'lerini boşluktan çıkar.
- Dify prompt'a citation/source zorunluluğu ekle.
- API response'a `sources[]`, `retrievalConfidence`, `answerMode` alanları ekle.
- UI'da source listesi göster.

### Faz 3 — Real log parsing MVP (P1)

**Hedef:** Text summary tool'dan gerçek log analyzer'a geçiş.

Seçenekler:

1. **CSV/text export first**  
   Betaflight Blackbox Explorer'dan CSV export kabul et. En hızlı production path.

2. **Server-side parser service**  
   `.bbl/.bfl` için ayrı parser worker. Daha güçlü ama daha maliyetli.

3. **Hybrid**  
   Şimdilik CSV/text, sonra `.bbl` parser. Önerilen yol bu.

İlk parser metrikleri:

- Axis: roll/pitch/yaw
- Frequency hints: dominant resonance Hz
- Throttle region: low/mid/high
- Signal categories: propwash, bounce-back, gyro noise, D-term noise, motor heat risk

### Faz 4 — Productization and growth (P2)

**Hedef:** Tool'u retention/lead/affiliate yüzeyine çevirmek.

- Result sonunda "Save tune checklist" / "Compare after next flight" akışı.
- Related guide links:
  - Betaflight PID Basics
  - Hot motors checklist
  - RPM filter setup
- Affiliate-safe CTA:
  - props, soft mounts, FC gummies, blackbox-capable FC, spare motors
- Optional email capture: "Send me the tuning checklist" ama core tool'u kilitlemeden.

---

## 10. Başarı Kriterleri

### Minimum production-ready

- Canlı API route ya `source=dify` döndürür ya da UI açıkça "local guardrail mode" gösterir.
- Kullanıcı binary `.bbl` yüklediğinde ya gerçek parse edilir ya da net şekilde unsupported denir.
- `fpv-pid-profiles` dataset boş değildir.
- Dify answer kaynak/citation içerir.
- Confidence `<72` için exact PID sayıları yerine conservative language kullanılır.
- Route ve analyzer için regression test vardır.

### Strong product-ready

- CSV log excerpt parse edilir.
- Axis-specific diagnosis döner.
- Betaflight version input'u vardır.
- Result panelinde issue confidence + source list + safety checklist vardır.
- Admin/audit paneli Blackbox için Dify source, dry-run state, tuning docs, PID docs ve last smoke status gösterir.

---

## 11. Nihai Öncelik Listesi

1. **[P0] Production dry-run durumunu çöz veya bilinçli local-only etiketle.**
2. **[P0] `.bbl/.bfl` vaadini düzelt: ya parser ekle ya accept/copy'yi text export ile sınırla.**
3. **[P0] `fpv-pid-profiles` ve `fpv-troubleshooting` dataset'lerini kaynak destekli doldur.**
4. **[P1] Demo default formu "Load Sample" akışına taşı.**
5. **[P1] Dify response'a citations/sources ekle ve UI'da göster.**
6. **[P1] Blackbox audit kriterini sertleştir; bugünkü `PASS` yanıltıcı.**
7. **[P1] CSV/text log parser MVP ekle.**
8. **[P2] Result ekranına related guides + safe affiliate CTA + save checklist ekle.**

---

## 12. Kısa Karar

Bu araç kapatılacak bir özellik değil; doğru mimari iskelete sahip. Ama pazarlama dilinde "Blackbox log analysis" olarak büyütmeden önce gerçek log parsing ve RAG grounding gap'i kapatılmalı. En hızlı kazanç, production dry-run durumunu netleştirmek ve UI metnini "text excerpt based tuning advisor" seviyesine çekmek. En yüksek kaldıraçlı teknik yatırım ise `fpv-pid-profiles` + CSV parser MVP.
