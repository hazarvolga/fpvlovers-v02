# FPVLovers Bagimsiz RAG GAP ve BUG Denetimi

**Tarih:** 2026-08-14  
**Denetim tipi:** Kod-temelli, bagimsiz, salt-okuma RAG mimarisi denetimi  
**Karsilastirilan belgeler:**

- `2026-07-31-tools-hallucination-gap-report.md`
- `2026-08-02-comprehensive-product-gap-report.md`
- `2026-06-25-active-gap-closure-register.md` icindeki 2026-08-02 kapanis kaydi
- `docs/handoff/latest.md`

**Kanıt siniri:** Bu turda production SSH, Dify Studio, Qdrant sorgusu, build veya test calistirilmadi. `CANLI DOGRULAMA GEREKLI` maddeleri mevcut kod ve kayitli eski kanitlardan uretilmistir; guncel production gercegi olarak sunulmaz.

---

## 1. Yonetici Ozeti

FPVLovers'ta gercek bir RAG omurgasi vardir: Crawl4AI ingestion, PostgreSQL ham kaynak saklama, Dify dataset retrieval, intent bazli dataset yonlendirme, public tool grounding katmani, kaynak listeleri ve fail-safe yerel cevaplar kodda mevcuttur. Onceki calismalar yanlis Dify endpoint'ini, kaynak gorunurlugunu ve hallucination guardrail'lerini anlamli olcude iyilestirmistir.

Ancak mevcut kod, retrieval kalitesini production-ready olarak kabul etmek icin yeterli kanit sunmamaktadir. En kritik iki sorun:

1. Tam crawl icerigi PostgreSQL'e saklanirken Dify'ye worker yolunda yalnizca ilk **1.500 karakter** gonderilmektedir. Bu kesim cumle, paragraf veya bolum siniri gozetmez.
2. Icerik yayin kapisi, modelin gercekte kullandigi retrieval kaynaklari bos olsa bile planlama asamasindaki `sourceHints` URL'lerini kanit sayabilmektedir.

Ek olarak, konfigurde gorunen hybrid agirliklari ve reranker gercek Dify isteginde kullanilmamakta; fallback datasetleri kalite dusunce degil her sorguda bastan cagrilmakta; confidence degeri kalibre edilmis bir retrieval metrigi yerine yerel bir heuristikten uretilmektedir.

### Bagimsiz risk dagilimi

| Seviye | Adet |
|---|---:|
| CRITICAL | 2 |
| HIGH | 7 |
| MEDIUM | 6 |
| LOW | 2 |
| **Toplam** | **17** |

### Sonuc

**Karar: RAG mimarisi calisir durumda, fakat retrieval kalite guvencesi ve provenance zinciri tamamlanmadan "tam production-ready RAG" denmemelidir.** Public tool'larin deterministik fallback davranisi riski azaltir; buna karsilik knowledge ingestion ve retrieval dogrulugu halen olculmemis veya yaniltici metriklerle temsil edilmektedir.

---

## 2. Mimari Akis

```text
URL / source pack
  -> crawl queue
  -> Crawl4AI /md fit filter
  -> full Markdown -> PostgreSQL raw_content
  -> truncated text -> Dify create-by-text
  -> Dify automatic chunking / embedding / Qdrant
  -> retrieval-orchestrator
  -> local dedup + heuristic rerank + confidence
  -> retrieval-grounding
  -> Part Matcher / Build Wizard / Blackbox / Flight Critic
  -> Dify answer or deterministic local fallback
```

Bu akista ham kaynak saklama ile embedding'e giden icerik ayni degildir. Operasyon panelindeki "full markdown stored" bilgisi dogrudur; fakat retrieval corpus'unun tam oldugu anlamina gelmez.

---

## 3. CRITICAL Bulgular

### RAG-C1 - Dify corpus'u crawl edilen belgenin yalnizca basini indeksliyor

**Kanıt:**

- `src/lib/content-automation/crawl-worker.ts:60` -> `MAX_DIFY_UPLOAD_CHARACTERS = 1_500`
- `src/lib/content-automation/crawl-worker.ts:166` -> `crawled.markdown.slice(0, 1500)`
- `src/app/api/admin/ingest/route.ts:134` -> ikinci ingestion yolu `md.slice(0, 8000)` kullaniyor
- Her iki yol da `process_rule: { mode: 'automatic' }` gonderiyor; kodda tanimlanan dataset-bazli chunk/overlap degerleri uygulanmiyor.

**BUG:** Ayni kaynak, queue worker ile 1.500 karakter; admin ingest ile 8.000 karakter olarak farkli corpus uretebilir. Kesim semantik sinir gozetmedigi icin cumle ve bolumler yarida kalabilir. Uzun rehberlerin troubleshooting, sonuc, guvenlik ve teknik tablo bolumleri embedding'e hic ulasmayabilir.

**Etki:** Recall sistematik olarak dusuk kalir. Kullanici belgenin sonraki bolumlerindeki bir bilgiyi sordugunda dogru kaynak veritabaninda mevcut olsa bile retrieval sonucu sifir olabilir.

**Kapanis kriteri:**

- Tam temiz Markdown'i baslik/paragraf sinirlarini koruyan semantik chunking ile isle.
- Parent-child belge iliskisi, bolum basligi ve chunk sira bilgisini metadata'ya yaz.
- Worker ve admin ingest icin tek canonical ingestion servisi kullan.
- Uzun bir belgenin bas, orta ve son bolumlerinden hazirlanan golden sorgularin tamaminda beklenen chunk'i getir.

### RAG-C2 - Yayin kapisi gercek retrieval kaniti yerine plan URL'lerini kanit sayabiliyor

**Kanıt:**

- `src/lib/content-automation/dify-generation.ts:249` ve `:270` -> generation sonucu `sources` bos donduruluyor.
- `src/lib/content-automation/generated-publication.ts:132-146` -> `sourceCount`, `job.sourceHints` ile `generationSources` birlestirilerek hesaplaniyor.
- `src/app/api/admin/cron/generate/route.ts:166-170` -> bos `result.sources` yayin hazirligina aktariliyor.

**BUG:** Bir URL'nin brief icinde bulunmasi, o kaynagin retrieval'a girdigini veya model tarafindan kullanildigini kanitlamaz. Buna ragmen `sourceHints`, autonomous quality gate'te source count'u sifirdan buyuk yapabilir.

**Etki:** Kaynaksiz veya retrieval'dan kopuk uretilmis bir makale, baska kalite kontrollerini gecerse kaynakli kabul edilebilir. Ozellikle urun spec'i, fiyat, performans ve regülasyon iceriginde bu zincir trust acigidir.

**Kapanis kriteri:**

- Yalniz Dify `retriever_resources` veya dogrulanmis retrieval trace kaynaklarini `generationSources` say.
- Her onemli iddia icin source/chunk baglantisi veya en azindan article-level evidence map sakla.
- `sources.length === 0` iken autonomous publish fail-closed olsun; `sourceHints` yalniz crawl adayi olarak kalsin.

---

## 4. HIGH Bulgular

### RAG-H1 - Fallback datasetleri kosullu degil, her sorguda cagriliyor

`realRetrieval()` primary ve fallback listelerini `allDatasets` icinde birlestirip bastan sona sorguluyor (`retrieval-orchestrator.ts:109-124`). `fallbackTriggered` ancak tum sorgular bittikten sonra hesaplanıyor (`:348`); ilgili `if` blogu veri getirmiyor.

**Etki:** Primary yeterliyken dahi alakasiz fallback chunk'lari aday havuzuna girer, latency ve Dify yukunu artirir, precision'i dusurebilir.

**Kapanis kriteri:** Once primary datasetleri paralel sorgula; kalite esiginin altindaysa fallback'i ikinci fazda cagir.

### RAG-H2 - Hybrid agirliklari ve reranker konfigürasyonu gercekte uygulanmiyor

`retrieval_model` istegi `reranking_enable: false` ve `weights: null` gonderiyor (`retrieval-orchestrator.ts:143-146`). Buna karsilik tum intent konfigurasyonlari `semanticWeight`, `keywordWeight` ve `useReranking: true` tasiyor. Sonradan cagrilan `globalRerank()` gercek cross-encoder degil; kelime tekrari ve primary bonusu kullanan yerel bir formuldur (`:270` civari).

**Etki:** Operasyon/UI katmani hybrid ve reranked retrieval calisiyormus izlenimi verir; gercek davranis konfigürasyonla uyusmaz.

**Kapanis kriteri:** Ya Dify hybrid agirliklarini ve gercek reranker'i uygula ya da alanlari kaldirip davranisi `lexical_boost` olarak dogru adlandir.

### RAG-H3 - Strict dedup farkli chunk'lari ayni belge diye siliyor

Strict dedup anahtari yalniz `${datasetName}:${documentName}`. Ayni belgenin farkli bolumlerinden gelen tum chunk'lar duplicate sayiliyor. `parts` ve `regulations` intentleri strict dedup kullaniyor.

**Etki:** Dify dogru olarak bir belgeden birden fazla ilgili bolum getirse bile yalnizca biri korunur; ozellikle teknik tablo + guvenlik aciklamasi gibi tamamlayici baglam kaybolur.

**Kapanis kriteri:** Segment ID veya content hash ile exact dedup; parent document bazli cesitlilik limiti ayri bir adim olmali.

### RAG-H4 - Grounding timeout, retrieval timeout ve dataset siralamasi birbiriyle uyumsuz

Grounding katmani 8 saniyede `Promise.race` ile vazgeciyor (`retrieval-grounding.ts:27,89-91`). Her dataset isteginin timeout'u 15 saniye ve datasetler sirali cagriliyor. `Promise.race` altta calisan fetch'leri iptal etmiyor.

**Etki:** Yavas ama basarili bir primary sorgu 8 saniyeyi gectiginde public tool bos grounding'e duser; arkadaki Dify istekleri ise calismaya devam ederek kapasite tuketir.

**Kapanis kriteri:** Ortak `AbortController`, paralel primary sorgular, tek toplam deadline ve iptal edilen isteklerin metric/log kaydi.

### RAG-H5 - Belge guncelleme, silme ve embedding refresh zinciri yok

Worker ve admin ingest endpoint adini "upsert" olarak kullansa da ikisi de Dify `create-by-text` cagiriyor. Belge adi URL hash'inden uretiliyor; content hash, source revision, `last_modified`, delete/update mapping veya re-embed karari yok.

**Etki:** Kaynak degistiginde eski embedding kalabilir veya yeni duplicate belge olusabilir. URL ayni fakat icerik farkli oldugunda queue idempotency guncellemeyi engelleyebilir.

**Kapanis kriteri:** `(dataset, canonical_url)` -> Dify document ID eslemesi; content hash degisince update/re-embed; silinen kaynak icin tombstone/delete; son basarili revision kaydi.

### RAG-H6 - Retrieval eval hatti kaliteyi olcmuyor; mevcut artefakt zayif sinyal veriyor

`reports/retrieval-test-results.json` 2026-07-25 tarihli ve 22 sorgunun yalnizca 5'inde sonuc kaydetmis (**%22,7 hit rate**). 17 sorgu sifir sonuc; flight tuning 0/3, build guides 0/2, community 0/2, regulations 0/3. Ancak dosyada timestamp, model, dataset revision ve beklenen belge yoktur.

`scripts/test-retrieval.ts` yalniz `count` ve `topScore` kaydeder. MRR, NDCG, Recall@K, Precision@K veya labeled relevant document set'i yoktur.

**Etki:** Retrieval mi, prompt mu, generation mi bozuk ayristirilamaz. "confidence 78" gibi runtime degerleri gercek dogruluk metriği degildir.

**Kapanis kriteri:** Intent/dataset bazli golden set; expected document/chunk etiketleri; Recall@K, MRR, NDCG; zero-result rate; latency p50/p95; her deploy oncesi regression threshold.

### RAG-H7 - Bilinen `fpv-flight-tuning` kirliliginin kapandigina dair kanit yok

2026-07-31 raporu, canli Qdrant orneklerinin 6'sindan 4'unun GitHub UI/navigasyon metni oldugunu kaydetti. Guncel `tool-truth-audit.ts` Blackbox'i halen `PARTIAL`, Flight Critic'i `DEFERRED` isaretliyor ve dataset temizligini acik aksiyon olarak tasiyor.

Fit-filtered `/md` crawler yeni ingestion icin iyilesmedir; mevcut kirli Qdrant point'lerini otomatik silmez.

**Kapanis kriteri:** Dataset export/ornekleme; kirli point'leri silme; temiz yeniden ingestion; Blackbox golden sorgularinda kaynak safligi ve Recall@K kaniti.

---

## 5. MEDIUM Bulgular

### RAG-M1 - Metadata, filtreleme icin yetersiz

Dify document metadata'si yalniz `source_url` ve `url_hash` tasiyor. Tarih, source type, urun modeli, firmware versiyonu, jurisdiction, language, lisans, guven seviyesi veya content revision yok. Retrieval isteginde metadata pre-filter da bulunmuyor.

**Etki:** FAA/EASA/SHGM, eski/yeni firmware veya review/spec ayrimi semantic benzerlige birakiliyor.

### RAG-M2 - Dataset chunk ayarlari deklaratif fakat ingestion'a bagli degil

`master-routing-tables.ts:202-210` her dataset icin `chunkTokens` ve `overlapTokens` tanimliyor. Bu alanlar Dify `process_rule` istegine aktarilmiyor; yalniz master/status sunumunda kullaniliyor.

**Etki:** Kodda gorunen chunk stratejisi ile Qdrant'ta gercekten uretilen segmentler farkli olabilir.

### RAG-M3 - Confidence ve stats alanlari yaniltici kesinlik tasiyor

Confidence, Dify skoru + keyword tekrar bonusu + primary bonusundan hesaplanir. Kalibrasyon dataseti yoktur. `datasetsQueried`, sorgulanan datasetleri degil final top-K'da kalan datasetleri sayar; `afterRerank` ise rerank sonrasi toplamı degil top-K kesiminden sonraki sayiyi raporlar.

**Etki:** Admin ve public API'lerdeki confidence sayisi kalite metriği gibi okunabilir, fakat audit edilebilir bir olasılık veya accuracy degildir.

### RAG-M4 - Cache anahtari endpoint, app kimligi ve knowledge revision icermiyor

`dify-client.ts:318` cache hash'ini yalniz model adi ve body ile uretir. Endpoint, Dify app token kimligi, dataset revision ve workflow version anahtarda yoktur. Varsayilan TTL 7 gundur.

**Etki:** Ayni body'ye sahip farkli Dify app/workflow cagrilari cache collision yasayabilir; knowledge base guncellense bile eski cevap yedi gun donebilir.

### RAG-M5 - Bos retrieval durumunda "general expertise" cevaplarina izin veriliyor

`NO_CONTEXT_NOTICE`, kaynak yokken genel FPV bilgisiyle cevap vermeyi oneriyor. Public tool'lar kaynaklar bosken deterministik local output veya Dify cevabi dondurebilir.

**Etki:** Genel egitim tavsiyesi icin kabul edilebilir olsa da urun onerisi, kesin spec, fiyat, mevzuat ve performans iddialarinda proje politikasindaki "RAG sonucu olmadan onerme" sinirini gevsetir.

**Kapanis kriteri:** Query risk classifier; product/spec/legal sorgularinda source yoksa refusal veya clarification; yalniz dusuk riskli genel egitim sorularinda acik etiketli fallback.

### RAG-M6 - Simulated retrieval kodu runtime'da kalmaya devam ediyor

`simulateRetrieval()` `Math.random()` ile score ve sahte chunk uretir. Public grounding bu chunk'lari filtreler; ancak admin/master retrieval yuzeyleri bunlari confidence ve result olarak gosterebilir.

**Etki:** Test/dev ortami sonuclari deterministik degildir ve yanlislikla gercek retrieval gibi yorumlanabilir.

**Kapanis kriteri:** Fixture tabanli deterministik simulator; response'ta zorunlu `evidenceMode: simulated|live`; production build'de simulated retrieval'in kapali olmasi.

---

## 6. LOW Bulgular

### RAG-L1 - Dataset envanteri ve dokumantasyon drift'i

Proje belgelerinde sekiz dataset anlatimi bulunurken routing kodu dokuz dataset (`fpv-regulations` dahil) tasiyor. `dify-datasets.ts` sabit listesi ise regulations olmadan sekiz dataset iceriyor.

### RAG-L2 - Query-level observability eksik

Kod hata loglari ve budget kaydi tutuyor; fakat dataset bazli zero-result rate, p50/p95 latency, fallback nedeni, dedup kaybi, cache freshness, source coverage ve retrieval drift metricleri kalici bir telemetry hattinda gorunmuyor.

---

## 7. Onceki Raporlarla Karsilastirmali Analiz

| Konu | 2026-07-31 / 2026-08-02 beyanı | Bagimsiz 2026-08-14 sonucu | Durum |
|---|---|---|---|
| Yanlis Dify retrieval endpoint'i | `/document/search` hatasi raporlandi ve sonradan `/datasets/{id}/retrieve` yapildi | Kod dogru endpoint'i kullaniyor | **Kapali** |
| Public tool kaynak gorunurlugu | Kaynak/refusal eksikti | `retrieval-grounding.ts`, `sources`, grade ve deterministic fallback eklendi | **Buyuk olcude kapali** |
| Blackbox dataset kirliligi | GitHub UI kirliligi ve `PARTIAL` | Crawler gelecekteki ingestion icin iyilesti; eski Qdrant temizligi kanitlanmadi | **Acik** |
| Flight Critic | `DEFERRED` | Retrieval baglantisi var, fakat gercek video/frame analizi degil; tool audit halen deferred | **Kismi** |
| Regülasyon dataset gorunurlugu | "0 documents" cache bug'i kapatildi | UI cache fix'i retrieval relevance kaniti degil; eski eval regulations 0/3 | **UI kapali, retrieval kanitsiz** |
| RAG source gate | Grounding prompt'u ve editorial gate guclendirildi | `generationSources` bos; `sourceHints` retrieval kaniti sayilabiliyor | **Yanlis kapali algisi / CRITICAL acik** |
| Chunking | Dataset bazli chunk degerleri dokumante | Ingestion bunlari uygulamiyor; 1.500/8.000 karakter hard-cut var | **Onceki raporlarda kacmis** |
| Hybrid retrieval / reranker | Mimari hybrid + reranker olarak anlatiliyor | Dify weights `null`, reranker disabled; yerel lexical heuristic kullaniliyor | **Onceki raporlarda kacmis** |
| Retrieval eval | Canli tekil endpoint testleri ve confidence degerleri kaydedildi | Golden set ve retrieval metrikleri yok; eski artefakt 5/22 hit | **Acik** |
| Embedding freshness | Kapanis kaydinda ele alinmadi | Content hash, update/delete/re-embed lifecycle yok | **Acik** |

### Onceki kapanis oranina etkisi

2026-08-02 kapsamli raporundaki UI, security, SEO ve mobil kapanislar bu denetim tarafindan gecersiz kilinmiyor. Ancak o raporun "kod ile kapatilabilen bulgular tamamlandi" sonucu RAG alt sistemi icin genellenemez. Bu bagimsiz denetimde bulunan 17 maddenin 10'dan fazlasi onceki 29 maddelik genel raporun kapsaminda hic yer almiyordu.

---

## 8. Guclu Taraflar

- Ham crawl icerigi embedding butcesi veya Dify hatasindan once PostgreSQL'e saklaniyor.
- Crawl4AI `/md` fit filter, eski raw GitHub/site-kabugu kirliligini azaltmak icin dogru yon.
- Queue worker unknown dataset, private literal IP, retry ve permanent anti-bot block durumlarini ele aliyor.
- Public tool grounding katmani simulated chunk'lari kaynak olarak gostermiyor.
- Part Matcher ve Build Wizard deterministik hesaplari Dify'dan ayiriyor; Dify cokerse guvenli local fallback var.
- Blackbox cevabi `dify_grounded`, `dify_unverified` ve local guardrail modlarini ayiriyor.
- Regülasyon icerigi icin no-fallback ve daha yuksek score threshold niyeti dogru.
- Yayin governance'i product review ve legal content icin daha siki kurallar uyguluyor.

---

## 9. Onerilen Kapatma Plani

### P0 - Retrieval dogrulugunu ve evidence chain'i duzelt

1. Canonical ingestion servisi olustur; 1.500/8.000 karakter hard-cut'lari kaldir.
2. Baslik/paragraf tabanli semantik chunking + parent-child metadata uygula.
3. URL + dataset + content hash ile Dify document update/delete/re-embed lifecycle kur.
4. `sourceHints`'i publication evidence sayma; yalniz gercek retriever resources kabul et.
5. En az 50 labeled query ile golden retrieval set'i olustur; Recall@5, MRR ve zero-result threshold tanimla.

### P1 - Retrieval davranisini gercek konfigürasyonla eslestir

1. Primary-first, conditional fallback ve parallel retrieval uygula.
2. Gercek Dify hybrid weights veya BM25/vector + RRF kullan.
3. Gercek reranker entegre et; yoksa `globalRerank` adini ve confidence dilini degistir.
4. Segment ID tabanli dedup ve document diversity limiti uygula.
5. Ortak deadline + AbortController ile 8/15 saniye timeout celiskisini kapat.

### P2 - Freshness, metadata ve observability

1. Source date, firmware version, jurisdiction, language, source type, license ve trust metadata ekle.
2. Cache anahtarina endpoint/app/workflow/dataset revision ekle; RAG cevaplarinda daha kisa veya event-driven TTL kullan.
3. Dataset/query bazli latency, zero-result, fallback, source coverage ve drift dashboard'u kur.
4. Query-risk siniflandirmasi ile legal/spec/product sorgularini source yokken fail-closed yap.

---

## 10. Kabul Kriterleri

RAG icin production-ready beyanindan once asagidaki kosullarin tamami kanitlanmali:

- [ ] Ingest edilen belgenin bas, orta ve son bolumleri Qdrant'ta aranabilir.
- [ ] Ayni URL degistiginde eski embedding yerine yeni revision aktif olur.
- [ ] Silinen kaynak retrieval sonucundan kalkar.
- [ ] Golden set Recall@5 ve MRR threshold'lari CI/release gate'te gecer.
- [ ] Regulations sorgulari yalniz uygun jurisdiction kaynaklari getirir.
- [ ] Product/spec/legal sorgulari sources bosken cevap uretmez.
- [ ] Runtime confidence kalibre edilmis eval sonucuyla iliskilidir veya "heuristic score" olarak etiketlenir.
- [ ] Fallback yalniz primary yetersiz oldugunda cagrilir.
- [ ] Gercek reranker davranisi kod/config ile uyumludur.
- [ ] Blackbox dataset kirliligi export/ornekleme ile temizlendigi kanitlanir.
- [ ] Production image revision, Dify workflow version ve dataset revision ayni kabul kaydinda yer alir.

---

## 11. Ben Mercier Mesajina Etkisi

Ben'e verilecek cevapta su iki iddia guvenle kullanilabilir:

- Crawl queue production ingestion mimarisinin gercek bir parcasidir.
- Mevcut proxy surtusmesi agirlikla anti-bot/403/Cloudflare ve reverse-proxy endpoint uyumlulugudur.

Ancak "RAG pipeline tamamen production-ready" veya "proxy disinda ingestion sorunumuz yok" denmemelidir. Mevcut asil darboğaz yalniz proxy degil; ingestion coverage, dataset freshness ve retrieval kalite olcumudur.
# Critical Closure Update - 2026-08-14

## C-01: Silent Dify document truncation

**Status:** `CLOSED_LOCAL`, live Dify acceptance pending.

- Removed the 1,500-character crawl-worker upload limit.
- Removed both 8,000-character limits from the admin ingest route and legacy queue processor.
- Dify now receives the complete crawled Markdown and remains responsible for indexing and chunking.
- Regression evidence: `scripts/crawl-worker-regression-test.ts` passed and asserts that the complete source body is uploaded.

## C-02: Source hints counted as publication evidence

**Status:** `CLOSED_LOCAL`, live generation acceptance pending.

- `sourceHints` no longer satisfy autonomous publication source-count requirements.
- Product-review evidence now contains only valid source references returned by the generation/retrieval result.
- Regression evidence: `scripts/editorial-governance-regression-test.ts` passed for both source-hint-only rejection and generation-source acceptance.

## Validation boundary

- Targeted crawl-worker regression: passed.
- Targeted editorial-governance regression: passed.
- Graphify code graph refreshed successfully after the changes.
- No production Dify document was created or modified during this validation.
- No production content was published during this validation.
# High-Priority Retrieval Closure Update - 2026-08-14

## Conditional fallback dataset retrieval

**Status:** `CLOSED_LOCAL`, live Dify acceptance pending.

- Primary datasets are queried first.
- Fallback datasets are queried only when the primary average score is below `minConfidenceForFallback`.
- Retrieval statistics now report attempted dataset count before final top-k filtering.

## Hybrid weights and reranking configuration

**Status:** `CLOSED_LOCAL`, live Dify acceptance pending.

- Hybrid requests now use Dify's documented `weighted_score` mode with customized vector and keyword weights.
- Optional model reranking is supported through `DIFY_RERANK_PROVIDER` and `DIFY_RERANK_MODEL`.
- Real Dify results are no longer modified by the local heuristic reranker.
- Local heuristic reranking remains limited to simulation mode and respects `useReranking`.

## Strict chunk deduplication

**Status:** `CLOSED_LOCAL`.

- Strict deduplication now keys on dataset and segment identity.
- Distinct chunks from the same document are preserved.
- Duplicate records for the same indexed chunk are removed.

## Validation evidence

- `scripts/retrieval-orchestrator-regression-test.ts`: passed.
- Existing crawl-worker regression: passed in this closure cycle.
- Existing editorial-governance regression: passed in this closure cycle.
- Graphify code graph refreshed successfully after the changes.
- No production Dify retrieval, reranker, dataset, or published content was modified.
# Timeout and Embedding Lifecycle Closure Update - 2026-08-14

## Retrieval timeout contract

**Status:** `CLOSED_LOCAL`, production latency observation pending.

- Per-dataset Dify retrieval requests now default to a bounded 6-second timeout.
- User-facing grounding now defaults to a bounded 20-second orchestration timeout.
- Completed or failed grounding calls clear their timeout handles.
- Both values can be adjusted through bounded environment variables without code changes.

## Embedding refresh and document update lifecycle

**Status:** `CLOSED_LOCAL`, live Dify re-index acceptance pending.

- Re-crawled jobs with a valid Dify document ID use `update-by-text` rather than creating duplicates.
- Admin ingestion resolves the deterministic URL-hash document name before choosing update or create.
- File-backed queue refreshes preserve the existing document ID.
- The legacy queue processor now preserves complete document IDs and supports refresh updates.

## Validation evidence

- Crawl-worker regression, including existing-document refresh: passed.
- Retrieval orchestrator regression: passed.
- Graphify code graph refreshed successfully after the changes.
- No production document was created, updated, re-indexed, or deleted.
# Retrieval Evaluation Closure Update - 2026-08-14

## Retrieval evaluation quality and freshness

**Status:** `CLOSED_LOCAL`, live read-only Dify baseline pending.

- The eval suite now covers all nine configured datasets with representative domain queries.
- Time-sensitive news, racing, and regulation queries use the current UTC year rather than stale fixed years.
- Evaluation measures expected-term grounding, top score, result count, source metadata coverage, unique documents, and aggregate pass rate.
- A configurable minimum pass-rate gate defaults to 75 percent.
- Live execution requires the explicit `RETRIEVAL_EVAL_LIVE=true` safety flag.
- Generated eval reports are ignored by Git and remain local evidence.

## Validation evidence

- `scripts/retrieval-evaluation-regression-test.ts`: passed.
- Graphify code graph refreshed successfully after the eval changes.
- Live Dify retrieval was not executed during this validation.
# Retrieval Trust Guard Closure Update - 2026-08-14

## Dataset contamination guard

**Status:** `CLOSED_LOCAL_GUARD`, live dataset cleanup pending.

- Tuning and regulation retrievals now apply trusted source-host metadata filters.
- Retrieved chunks must also contain intent-compatible domain terms before they can reach consumers.
- No live Dify document was moved, deleted, or reclassified.

## Confidence calibration

**Status:** `CLOSED_LOCAL`.

- Confidence now includes source metadata coverage, document diversity, and sample size.
- Metadata-free evidence is capped below medium confidence.
- Simulated evidence is capped at insufficient confidence.
- Confidence recommendations no longer describe retrieval as universally excellent.

## Empty-RAG fail-closed policy

**Status:** `CLOSED_LOCAL`.

- Empty, failed, timed-out, or simulated-only retrieval no longer authorizes general-model expertise.
- Consumers receive deterministic local checks only and an explicit verified-source unavailable notice.

## Validation evidence

- `scripts/retrieval-orchestrator-regression-test.ts`: passed.
- `scripts/retrieval-grounding-regression-test.ts`: passed.
- Graphify code graph refreshed successfully after the trust-guard changes.
# Cache Identity and Simulator Closure Update - 2026-08-14

## RAG cache identity and revision safety

**Status:** `CLOSED_LOCAL`.

- Cache identity now includes model, endpoint, method, Dify base URL, app/API-key fingerprint, request body, and knowledge revision.
- RAG requests are not cached when `DIFY_KNOWLEDGE_REVISION` is absent.
- Dataset revisions can no longer reuse responses cached for an older declared revision.

## Retrieval simulator production isolation

**Status:** `CLOSED_LOCAL`.

- Simulated retrieval is disabled by default.
- Simulation requires explicit `ENABLE_SIMULATED_RAG=true` and is prohibited in production.
- Disabled real RAG now returns no evidence instead of random placeholder chunks.

## Validation evidence

- `scripts/llm-cache-identity-regression-test.ts`: passed.
- `scripts/retrieval-orchestrator-regression-test.ts`: passed.
- `scripts/retrieval-grounding-regression-test.ts`: passed.
- Graphify code graph refreshed successfully after the cache and simulator changes.
# Final Local GAP Closure Update - 2026-08-14

## Dataset chunk configuration enforcement

**Status:** `CLOSED_LOCAL`, live Dify re-index acceptance pending.

- Dataset-specific chunk token and overlap settings now drive create and update ingestion requests.
- Crawl worker, admin ingest, and legacy queue processing share one Dify process-rule builder.
- URL removal remains disabled so source provenance survives preprocessing.

## Dataset inventory drift

**Status:** `CLOSED_LOCAL`.

- The project inventory now declares nine RAG datasets.
- `fpv-regulations` is included in the canonical project table.

## Query-level retrieval observability

**Status:** `CLOSED_LOCAL`, production telemetry observation pending.

- Retrieval responses include a trace ID and per-dataset observations.
- Observations capture role, safe status, duration, and returned chunk count.
- Aggregate stats include dataset error count and total duration.
- Raw queries, API keys, and remote error bodies are excluded from structured observation logs.

## Validation evidence

- `scripts/dify-document-process-regression-test.ts`: passed.
- `scripts/retrieval-orchestrator-regression-test.ts`: passed.
- `scripts/retrieval-disabled-observability-regression-test.ts`: passed.
- `scripts/llm-cache-identity-regression-test.ts`: passed.
- `scripts/retrieval-grounding-regression-test.ts`: passed.
- Graphify code graph refreshed successfully after final local closure changes.

## Remaining external acceptance gates

- Clean or reclassify contaminated documents in the live `fpv-flight-tuning` dataset.
- Run the guarded read-only live retrieval evaluation and record its baseline.
- Confirm Dify accepts custom chunk rules and completes update-by-text re-indexing.
- Observe production retrieval latency, dataset errors, and fallback behavior after deployment.
# Full Local Build Validation - 2026-08-14

## Validation result

- TypeScript `tsc --noEmit`: passed.
- Next.js 15.5.21 production build: passed.
- Optimized application compilation: passed.
- Type validation inside Next.js build: passed.
- Static generation: 118 of 118 pages completed.

## Evidence boundary

- The local build environment could not resolve the configured PostgreSQL hostname.
- Published-content and analytics reads used the application's committed-file fallback during static generation.
- This is valid local build evidence, but it is not live PostgreSQL or production runtime acceptance.
# Live Read-Only Retrieval Acceptance Attempt - 2026-08-14

## Result

**Status:** `BLOCKED_EXTERNAL_CREDENTIAL`.

- The guarded nine-dataset eval was attempted without document mutations.
- All nine requests failed at the API transport/authentication layer, so the zero-result summary is not a dataset-quality measurement.
- A single-case retry against the public Dify Service API endpoint returned `HTTP 401 unauthorized` with an invalid access-token classification.
- No API key or secret value was printed, persisted in the report, or changed.

## Required external action

- Create or verify a Knowledge Service API credential in Dify.
- Store it as `DIFY_DATASET_API_KEY` in the local and deployment secret stores without sharing it in chat or committing it.
- Re-run the read-only eval before making any dataset cleanup decision.

