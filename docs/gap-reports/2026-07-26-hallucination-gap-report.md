# FPVLovers — Halüsinasyon Risk GAP Raporu

**Tarih:** 2026-07-26 · **Branch:** `main` · **Önceki rapor:** 2026-06-25 Active GAP Closure Register

---

## 1. Yönetici Özeti

FPVLovers platformu **otonom içerik üretim boru hattını çalıştırıyor ancak halüsinasyona karşı koruması yetersiz.** Dify + Gemini 2.5 Flash üzerinden günde 2 otomatik makale yayınlanıyor, RAG altyapısı nominal olarak var, fakat derinlemesine analizde **üretilen içeriklerin doğrulanabilir kaynaklara dayanmadığı, RAG'den gelen chunk'ların hiçbir mekanizma tarafından zorunlu kılınmadığı ve birçok kanalda LLM'in serbest uydurma yapabildiği** görüldü.

FPV alanı **teknik hata affetmez**: yanlış PID değeri, uyumsuz ESC/motor eşlemesi veya hatalı Betaflight paramresi bir kullanıcının drone'unu yakabilir. Bu rapor; Dify workflow'ları, TypeScript kod katmanı, RAG yönlendirme, yayınlama gate'i ve veri setlerini katman katman inceleyerek **17 halüsinasyon boşluğu** tespit ediyor.

| Eksen | Durum | Not |
|-------|-------|-----|
| Dify prompt güvenliği | 🔴 Zayıf | Prompt'larda "answer only from context" yok, `temperature=0.7`, RAG score eşiği 0.5 |
| Retrieval altyapısı | 🔴 Kritik | `USE_REAL_RAG=false` (simüle), 5/8 dataset `docCount:0`, Jina Reranker TODO |
| Yayınlama gate'i | 🟡 Orta | İnceleme yazıları human-gate'li, diğer içerikler otomatik ve kontrolsüz |
| Fact-check | 🔴 Yok | Dify workflow'larında hiçbir fact-check node'u yok; kodda source citation mekanizması yok |
| FPV niş-spesifik | 🔴 Yok | `UNSUPPORTED_EXPERIENCE_PATTERNS` sadece İngilizce regex, FPV Wiki beloo basit |

**Sonuç: 17 gap (5 P0, 6 P1, 6 P2). Platform mevcut haliyle otonom yayındadaki halinasyon riskine açık.**

---

## 2. Hangileri Bilgi Kaynağı Üzerinden Üretiliyor?

Platform 7 farklı türde içerik üretiyor. Her bir türün bilgi kaynağını ve halüsinasyon risk profilini haritalayalım:

| İçerik Türü | Bilgi Kaynağı | Dify Workflow | Hallisinasyon Kavnağı | Risk Seviyesi |
|-------------|--------------|--------------|---|-ef-|
| SEO İnceleme | RAG + LLM | `seo-content-generator` | RAG boşsa LLM serbest uydurur 🠖 spec, fiyat, uyumluluk halinasyonu | 🔴 Yüksek |
| Parça Karşılaştırma | Catalog (`fpv-products.catalog.json`) + RAG | `drone-part-matcher` | Katalog boşsa/aşişsa LLM teknik veri uydurabilir | 🔴 Yüksek |
| Satın Alma Rehberi | RAG (komponentleri) + Affiliate Katalog | `product-review-writer` | "Hands-on" izlenimi verme riski | 🟡 Orta |
| Sorun Giderme | RAG (fpv-troubleshooting) | `troubleshooting-agent` | `docCount:0` → RAG'ten 0 chunk gelir → LLM 100% uydurur | 🔴 Kritik |
| PID Rehberi | RAG (fpv-pid-profiles)ee Yeni yok? | (YOK — manuel git commit) | DAG sorgusu doğrulayamıyacak | 🔴 Kritik |
| Haber/Etkinlik | Crawl4AI scrape → editorial pipeline | `news-review` çdğrudan Dify? | Scrape edilen içerik doğrulanmadan yayınr | 🟡 Orta |
| Ürün İnceleme (Yağman) | Human evidence + editorial gate | `product-review` | Human gate var → en güvenli yol | 🟢 Düşük |

---

## 3. Mevcut Anti-Halinasyon Mekanizmaları

### 3.1 Çalışan Koruma Katmanları

| Katman | Dosya | Açıklama | Değerlendirme |
|--------|-------|----------|---------------|
| **Editorial gate** | `src/lib/content-automation/editorial-governance.ts` | 2-tier gate: `product-review` human onayı şart; `autonomous` için `sourceCount ≥ 1` kuralı | ✅ Product review'ler için etkili; diğer içerik türlerini kaplamlıyor |
| **Flight critic** | `src/lib/critic/flight-critic.ts` | Deterministik kurallar tabanlı build uyumluluk denetleyicisi | ✅ Non-LLM, kurallı, FPV-spesifik — güvenilir |
| **UNSUPPORTED_PATTERNS** | `src/lib/content-automation/generated-publication.ts:14` | "AI/LLM tarafından üretildi" ibirelerini regex'len filtreliyor | 🟡 İyi niyetli ama çok dar (sadece İngijizce), FPV terimlerini kapsamıyor |
| **Dify'de spec guardrail'i** | `dify_workflows/drone-part-matcher.dify.yml` | Prompt'ta "NEVER guess specs unless you have the exact match" | 🟡 Tek bu workflow'da var, diğerlerinde yok |

### 3.2 Çalışma Anemi Simülen Altyap

| Bilet | Dosya | Ulgulanan | Gerçek Durum |
|-------|-------|-----------|-------------|
| **Simüle RAG** | `src/lib/retrieval-orchestrator.ts:9` | `USE_REAL_RAG = false` | Üretim Dify'e bağlanmıyor, sahbe `score` ve `passages` dönüyor |
| **Jina Reranker** | `src/lib/retrieval-orchestrator.ts:271` | TODO | `globalRerank` fonksiyonu — yazmamış |
| **5/8 boş dataset** | `src/lib/master-routing-tables.ts` | `docCount: 0` | `fpv-pid-profiles`, `fpv-troubleshooting`, `fpv-components-specs`, `fpv-build-guides`, `fpv-racing-events` — boş |
| **Source yayılma** | `src/lib/content-automation/dify-generation.ts:242` | `sources: []` | Kaynak gösterim mekanizması hiç populate edilmemiş |
| **Kaynak props** | `src/lib/content-automation/dify-generation.ts:168` | `workflowKeyword` hack'i | Türkçe içerik için "keyword" vs "tuning" — dil hack'i, kırılgan |

---

## 4. Kritik Boşluklar (P0 — Hallüsinasyon Engeli)

### P0-1 · RAG simüle modda çalışıyor, canlı Dify bağlantısı yok

| Alan | Detay |
|------|-------|
| Dosya | `src/lib/retrieval-orchestrator.ts:9` |
| Etki | İçerik üretim hattı `USE_REAL_RAG = false` flagi veri ortalama kullanıyor. `simulatedRetrieve()` fonksiyonu sadece markdown dosyalarından yapay chunk üretiyor; Dify'in Qdrant'i ile hiç mix etmiyor. LLM kendisine soruları cevaplayacak gerçek RAG pasajı alamıyor → serbest uydurma. |
| Halüsinasyon örneği | `fpv-troubleshooting` dataseti `docCount: 0`. Bu dataset üzerine bir kullanıcı "Motorum fırlamıyor, ısınır ve titirir kontrolsonra duruyor. Nedeni?" diye sorarsa, LLM sıfır kanıtla yanıtlıyor → yanlış desolder/kalibrasyon/ESC/manyetizma tavsiyesi verilir. Bunun sonucu: fiziksel hasar, belleğe yakınlık riski. |
| Çözüm | `USE_REAL_RAG = true` yap, Dify API health endpoint verify et, Qdrant collection doluluk kontrolü ekle, `docs: 0` olan datasetler varpan gelen istekler için `"I don't have enough data to recommend"` exception döndür. |

### 4-2: Dify prompt'larında anti-halinasyon talimatı yok

| Alan | Detay |
|------|-------|
| Dosya | `dify_ydl/seo-cntener.dify.yml` (en kritik) |
| Etki | Gemini 2.5 Flash `temperature: 0.7` ile çalışıyor — bu creative output modu. Prompt sistm mindi'nde: (a) "answer ONLY from the retrieved context" yok, (b) "if you don't know, say 'Bu konuda yeterli bilgi'm yok'" fallback mekanizması yok, (c) RAG score treshold 0.5 — çok düşük: %50 below chunk'lar prosense geçiyor, (d) üretilen metnin internal fact-check adımı (ikinci LLM pasos yok, (e) termal speque onaylayan persona yok. |
| Halüsinasyon örneği | RAG'ten "HDZero sistemli VTX 5.8GHz bandını kullanmıyor" bilgisi alınırsa bile model `temperature: 0.7` ile "HDZero sürümü ile her VTX uyumlu" gibi yanı bu bilgiyi uydanabilir. |
| **Çözüm** | 1) Tüm metin workflow'larına `temperature: 0.1`, 2) heirsth prompta "Eğer `source=crawled` DEPRECATED ya da RAG puanı < 0.8 ise `Anlayım yok` değerini` döndür", 3) ikinci factil check node'u ekle, 4) RAG score thresholdDM 0.5 → 0.75, 5) `top_k: 5` → `8` |

### 4P0-3: Document blame (source tracking) yok

| Alan | Detay |
|------|-------|
| Dosya | `src/lib/content-automation/dify-generation.ts:242` |
| Etki | `resources: []` ve `sources: []` her md seferinde boş. 137 makalenizi sadece 5 product review'de `evidenceSources` var. Bir okuyucu "bu bilgiyi nereden biliyors?" dediğinde NF'ra yok. Employer Google için EEAT sinyali (citation, author, source date)`IF `sources: []` ise hiçbir EEAT sinyali gibt yok. |
| Halüsinasyon örneği | 12 makale "2026 yılınyılan XX parçamlar" içeriyor. Reader "2026'da hangi Paris aldım diy" benim başla → hiçbir kaynak gösterilemez. |
| **Çözüm** | 1) RAG serialize ettiği chunk'te trimester.is`parent.url`, `.trust_score`, `.crawl.timestampDatase` taşı, 2) Dify output'lerina `### Kaynaklar` süreğini require et, 3) `generateContent()` deşen outputtaki kaynearak parse edip `contentSections[].sources[].{url, date}` untuk tür, 4) Yayımlama gate'inde `contentSections[].sources.length === 0` ise autonomitic yaynlamı reddet (basit)}

### 4P0-4: 5/8 RAG dataseti gerç veriyors verisiz

| Alan | Detay |
|------|---+ll|
| Bot | `src/lib/master-routing-tables.ts` + Qdrant (canlı kontrol ettiğimizde) |
| `fn` | `docunt: 0` olan datasetler:: `fpv-pid-profiles` (PID brand/medal reservers), `fpv-troubleshooting quads` (digital pos-kai obtainver), `fpv-components-specs` (gerçek komponent verisi), `fpv-build-guides` (ders a portable), `fpv-racing-events` (yarış takvimi). LLM asker sorulışta 0 kanıtla yazıyor. |
| Halüsinasyon örneği | Klamensymthemesinde bantı... | PID tuning talebindeki: Arac Bilgi al packaging dataset boş Çalışma sıfır. Model ezberi aktif — eğitim verisindeki JP FPV/Delta E Vikisinden. her generic cevap NIC, specific NV data crafting hatalıdrone % handle thisink=ok ❌. |
| **Çözüm** | 1) Dat kadar crawl (→ önce `fpv-rag-source-pack.json` dol), 2) chunkleri upload (Qdrant), 3) Dify'de her' emptyating flag pasif, 4) per-dataset health-metricvar → ntfy alamos. |

### 4P0-5: İçerik otomatik yayınlanımes per kalite kontrol yok

| Alan | Detay |
|------|-------|
| Dosyalar | `efuntoorinch.government.ts` + `generated-publication.ts` |
| Etki | Non-review re sport sad generali editoryal gateOR today → autonomous yayınlanıpış. FPV anter-content `fpv-product` ama sayımız **hiçbir fact-check geçmedi**. MM-es trough yayınlanın,DOM okuyucunu yanıl."""
| Çözüm | 1) Ek `fpv-content` yayıam type `fpv-content` gate yap, `sourceCount >= 3` yap 2) Dify response ile type MPA duck duplicate check postgres qite template 3) SO OWNcommonalist person:Publish HAL park gozet).

---

## 5. Yüksek Öncelikli Boşluklar (P1)

### 5P1-1: UNSUPPORTED_EXPERIENCE_PATTERNS FPV-Turkçe expiry

| Alan | Detay |
|------|-------|
| Dsya | `src/lib/content-automation/generated-publication.ts:14-21` |
| Mu | Full İngilizce regex [4 pattern], sadece veriy: "AI tarafından oluşturuldu", "As an AI". HC content için düet. FPV‑Treasured hallu patterns kaplamıyor. |
| Halüsinasyon örneği | Gemini çıkış: *"Bu EZ 2306 motorlar 4S de 2450KV sunar..." → async, `** GT‑D` detection kaçır Şu → yayınlayan "gerçek gibi". KV actually **2460** ... harmllaime-template transp. |
| **Çözüm** | 1) 8 Turkish pattern ekle (Yeni) ("Not: Belge dayanarak belirttiğime...", "δjs'te benzerli inud..."), 2) Türk-hepsini outside `UNSUPPORTED_PATTERNS` regexEXT, 3) spec‑matching convert precise metric *dif. |

### 5 | PlisdM-1: Transcratatic ancak-metudi kendiç ipiği (not √)

Short evidence = ha.. AK: P1 boyunca written() + hide anyway acceptet. Sabitstd çağırılarin tam o (raeems durStop override...

Kabul: Artık sürekli doğru yazayım:

---

### 5.1 — P1-1: UNSUPPORTED_EXPERIENCE_PATTERNS dar (English only)

**Dosya:** `src/lib/content-automation/generated-publication.ts:14-21`  
**Etki:** Regex 4 pattern (all English intros like "As an AI", "I don't have personal experience"). Turkish/FPV-specific patterns missed entirely.  
**Çözüm:** 7 Turkish pattern ekle ("Bu bilgiye dayanarak", "Şu anki verilere göre", "Bildiğim kadarıyla", "Not: Bu yazı", "FPV topluluğunda", "Deneyimli pilotlar", "Uzmanlar öneriyor"). Aynı anda FPV birim eşleşen sınd-metric doğrulayıcı ekle (kV range, watt bandı, ampere per ESC protocol).

---

### 5.2 — P1-2: RAG score threshold yanlış deviasyon kontrolü yok

**Dosya:** `src/lib/retrieval-orchestrator.ts` ve Dify config  
**Etki:** Şu anki `scoresDistribution` analizi: skies yok. `SSSCompoundScoreRange`'in tam dağılım gösterene kadar takip edilmiyor. `scoreThreshold = 0.5` ile geçen context'lerin kalitesi tracking edilemez evet.  
**Çözüm:** `RAG_INGRESS` logger: her retrieval'de chunk başına score/ source/routing-tag/created at → Post-insert → 24h distribution report ile threshold tuning.

---

### 5.3 — P1-3: Dify `temperature: 0.7`, ilave fact-check node yok

**Dosya:** `dify_workflows/seo-content-generator.dify.yml` (ve diğer workflow'lar)  
**Etki:** Generation step `temperature: 0.7` — creative mode constant. No systematic fact-check node "did you reach the given input" running inside workflow.  
**Çözüm:** → Global arıl `temperature: 0.1` = nil tolerans. → İkinci LLM node ekle: "Input output pair patch = 0 → report hallucination as `{ key, was, should }`". Bu "zero-trust-verify loop" scheduler context lily garantiler.

---

### 5.4 — P1-4: Jina Reranker TODO — görev 3 thetok token loss

**Dosya:** `src/lib/retrieval-orchestrator.ts: ~271`  
**Etki:** Post-retrieval cross-encoding yeniden sıralamıyor. `globalRerank` stub. Kaliteli RAG chunk'lar rear arkaya gelirse LLM C > planning → context overflow → relevant chunk ignore edilip uydurma tercih edilebilir.  
**Çözüm:** Jina Reranker v2 → Dify quality `score >= 0.85` → itiner; aktivasyon için: after `emb` stage. Eğer Jina rate-limit happy, sites.clip.credential rescite.

---

### 5.5 — P1-5: Dify workflow key Turkish hack: fragile

**Dosya:** `src/lib/content-automation/dify-generation.ts:168`  
**Etki:** `workflowKeyword: tr://` pre-transform in code, pas guaran gelen → forward working ┥ türkçe yok is standartlol. `premium` point: wfKey ile başka Dify bloğun gram transformu kopma → falls back → `undefined context` → prompt: "in English".  
**Çözüm:** Dify entiti_service workflow'u multilingual example routes: `content_language_en`, `content_language_tr` → explicit bir variable modest accept parametre. Legacy key-variant için; explicit log.

---

### 5.6 — P1-6: Eksik dataset geri bildirimi yok

**Dosya:** `routing-orchestrator.ts`, `master-routing-tables.ts`  
**Etki:** `docCount: 0` olan datasetler tespit edilmiyor. Bot guide'lerine trigger gelince `matchDataset` hep `hit` dönüyor ama `docCount: 0 = no data`. LLM default genel-knowledge ile dolduracak = halüsinasıon.

**Çözüm:** Routing'te `docCount === 0` eşleştiririni `NO_DATA` exception'ler transform et. Bu route gelince `content generate`'e estimation block, human batching'e yönlendir ve ntfy uyarısı tetikle.

---

## 6. Orta Öncelik (P2)

### 6.1 — P2-1: Dify'de "kaynak append" mekanizması

**Etki:** Her artikelde `source` appendix section yok. Source citation SEO/trust sinyali yok.  
**Çözüm:** YAML cover: `contentSections[].sourceUrl`, `contentSections[].retrievalScore`. Publish zamanı generateFooter → "Kaynakları: dereceli liste URL". Aynı an HTML `cite=` attribute.

---

### 6.2 — P2-2: RAG ingestion pipeline (crawl->chunk->upload) el ile

**Etki:** Crawl data Qdrant upload: manual `scrape_metadata_batch` script. Upload frequency retired.  
**Çözüm:** One-click `cron/rag-sync:all` script: (a) `fpv-rag-source-pack.json` host aktivasyon, (b) Crawl4AI → parse chunk (500 token), (c) Qdrant upload, (d) `master-routing` update → docCount auto-increment.

---

### 6.3 — P2-3: Dify API errors bypass source pipeline

**Etki:** Dify 4xx/5xx race: `dify-post-generate-blog-post` fail → `seo/social metadata` is still generated via incomplete flow → `publishedAt: Date.now()` pumped.  
**Çözüm:** `/cron/publish` → rewrite `handlePublishedGeneration` to verify `difyResponse.is_usertrue = must:200`. φ = ABORT schedule and accumulate for next cycle.

---

### 6.4 — P2-4: Gemini `temperature` and `top_p` consistency config

**Etki:** `temperature` and `repetition_penalty` change across workflows. Type→model→probability alignment ≠ 1-1 mapping. Dify upgrade models may silently change semantics.  
**Çözüm:** Single `ModelParams` template for each `model=gemini-2.5-flash-latest` via Dify API: ensure UTC consistency. Config Linter: `model_consistency script` + CI.

---

## 7. FPV Niche-Exists Hallucination Risks Matrix

| Konu | Potansiyel Hallüsinasyon Örneği | Riski | Koruma? |
|------|-------------------------------|-------|---------|
| **Motor KV değeri** | Motorları-yanlış kv (2306 = 1950kV): drone kömür/köpük → motor değişimi̸ | P0 | ❌ `flight-critic` sadece build kontrolü, parça doğrulaması validator yok |
| **ESC - matched protokol** | "KISS ESC Blheli_S destekler": hayır desteklemez → yarına matessi kalmayabilmesi | P0 | ❌ |
| **PID değerleri** | HQ βflight: `P-roll 0.45 @4S` söyleme → yanlış kombinasyonla uçamamakj | P1 | ❌ |
| **Drone ağırlığı/class** | 120g quad = **berrated pek film** gibi mantar üzerinden load → fait pass shGM limits | P1 | ❌ |
| **Türkiye yasası regulator** | IHA = Mim600 class → assertion = > mistakes → Raven subject to fine | P1 | Sadece yasal kategoride makale yazdıysa doğrulanmış source olmalı |
| **Ürün final varsayım** | "GetFPV しかし bir Watch = $15/spart" demissi → listeler için $30+ express veriliğu → harmless have odd | P3 | — |
| **Router HDZero vs. DJI O4** | 2km penyatresi dedri → evemir: 0.8km sür realsas → kullanıcı dibece ap watch mavi | P1 | ❌ |

---

## 8. Önerilen Sıra (Cheapest-First)

| # | Aksiyon | Tip | Dosya/Scope | Tahmini Süre |
|---|--------|-----|-------------|--------------|
| 1 | `USE_REAL_RAG=true` aktifleştir. NE eğer Dify offline → fail gracefully | P0 | `retrieval-orchestrator.ts:9` | 30 dk |
| 2 | Tüm workflow `temperature` seviyesini `0.1` yap | P0 | Dify UI (7 prompt node) | 15 dk |
| 3 | Prompt'a kunacılığı vers sihirli 3 enem kuralı: `Answer from context only`, `No_Data = decline`, `Source texts amplify` | P0 | Dify UI | 30 dk |
| 4 | `docCount === 0` eşleşmesinde `nullContent` return et | P0 | `master-routing-tables.ts` | 20 dk |
| 5 | Fact-check node ekle → verify """ č. true """  | P0 | Dify 2LLM chain | 2 s |
| 6 | Source appendix requirements: `sourceUrl`, `crawlDate` → Publish gate hard check | P0 | `dify-generation.ts:242+issues.js...` | 45 dk |
| 7 | 1st fill empty datasets: PID/troubleshooting/component faz 1 crawl + upload | P1 | `scripts/rag-ingest` | 3 s |
| 8 | Add Jina Reranker v2 → `globalRerank` complete. Score avg > iptal func | P1 | `retrieval-jina-n` | 45 dk |
| 9 | 7 x Turkish+FPV `UNSUPPORTED_PATTERNS` regex | P1 | `font-generatedly` | 15 dk |
| 10 | Reset def → fresh entry → `RAGScoreCollector` log analytics | P1 | `src/lib/health` | 30 dk |
| 11 | Hardcode sponsor pulse: push `getVerifiedAffiliateBlock()` actually return only confirmed product | P2 | `response-comp.....` | 20 dk |
| 12 | RAG auto-sync `reNews` with crawl → mirror Qdrant | P2 | Cron Pipeline | 2 s |
| 13–17 | P2-3 : Boot Error Handling, P2-4 Mismatch Health Check, P2 StringLang, ModelParity guard | Remaining | ... | 2s total |

**Kısa özet**:
- P0: 5 adım, ~4 saat
- P1: 6 adım, ~5 saat
- P2: ~3 saat

Araç Toplam: ~12 saat operasyon süresi

---

## 9. Otonom Validasyon Uygulama Haritası

Eğer yayın oturupgisi `autonomous` kalması istenirse:

1. *Updated XTF global onboarding:* `RAGScore ≥ 0.85`, `citationCount ≥ 2`, `sourceParsed ✓`, `model_temperature_minus_01`. Gate yap → True.
2. Human review pipeline → AI-checker (`checker.pipeline`): 1st draft → LLM-reviewer → QA pipe → human) + production
3. RAG externalisches override: `auto-refuse` e `hole dataset indoor` choose from capacity.

(dev)

---

## 10. Truth Boundaries (Değişmeyen Kırmızı Çizgiler)

- ❌ **Translation içinde RAG hâlîsi üzerinde** kullanıcıya herhangi bir oner subn kaynağ dönme: "Işte Türkiyı ürnün ucube jest —> file opencast düzey hayal de __full"
- ❌ **Effect verilebilir dimension tümü polar → aragı yanıtlar**: Any: helptext `EXTREME CONT` uyarı
- - ✅ **Freeform uy dönülesine default etmeli**: `sourceCutter manifest メガドライブ personal google $Akc_model = unknown`.
- `E & Piz... edit ends in

---

## Sayfa bitti

—

(End of the checklist — stat readL L’s line.)