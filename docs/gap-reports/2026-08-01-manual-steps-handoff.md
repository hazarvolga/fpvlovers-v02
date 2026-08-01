# Manuel Adımlar — Handoff (2026-08-01)

Bu doküman, `2026-08-01-comprehensive-platform-audit.md` denetiminden çıkan ve **koddan çözülemeyen, sadece senin Dify Studio / GitHub / Coolify üzerinden yapabileceğin** adımların tek listesidir. Her madde: ne, neden, nasıl, öncelik.

> **Not:** Bu oturumda SSH ile production sunucularına bağlanmayı denedim ama başarısız oldu (agent'taki anahtar `161.118.171.201` ve `80.225.231.62`'de `Permission denied (publickey)` verdi, port 2222 de zaman aşımına uğradı). Önceki oturumda kullanılan bağlantı bilgileri bu oturuma taşınmadı. Bu yüzden aşağıdaki "unconfirmed" işaretli maddeler canlıda tekrar doğrulanamadı — sadece kod/dokümantasyon üzerinden biliniyor.

---

## 1. 7 sızdırılmış Dify API anahtarını rotate et
**Öncelik: CRITICAL — en acil.**

31 Temmuz 2026 GAP denetiminde, public `hazarvolga/fpvlovers-v02` reposunda 7 canlı Dify API anahtarının düz metin commit edildiği tespit edildi (1 dataset key + 6 app key: Expert, Build Wizard, Part Matcher, Blackbox, Community, SEO workflow). Dosyalar redakte edildi (`1a2a7ba`) ama **anahtarların kendisi hâlâ geçerli** — repo bir süre public'ti, herkes kopyalamış olabilir.

**Nasıl:** Dify Studio → Settings → API Access (her app için ayrı ayrı) → mevcut anahtarı revoke et → yeni anahtar oluştur → Coolify'daki ilgili `DIFY_APP_TOKEN_*` env değişkenlerini güncelle.

**Durum: Doğrulanamadı** (SSH yok) — muhtemelen hâlâ yapılmadı.

---

## 2. Dedicated Dataset/Knowledge API key oluştur → `DIFY_DATASET_API_KEY`
**Öncelik: HIGH — bugün bağlanan RAG grounding özelliğini fiilen çalıştırıyor.**

Bu oturumda `retrieval-orchestrator.ts` içindeki `realRetrieval()` fonksiyonunun yanlış endpoint'e istek attığı bulundu ve düzeltildi (`/document/search` → doğru endpoint `/datasets/{id}/retrieve`), ardından bu katman Part Matcher, Build Wizard, Blackbox Tuning ve Flight Critic'e bağlandı (bkz. commit `3229124`). Yerel testte doğrulandı: düzeltmeden sonra Dify artık 404 değil, temiz bir `401 unauthorized` JSON'u dönüyor — yani **endpoint doğru**, ama `.env.local`'deki `DIFY_API_KEY` bir chat-app anahtarı, Dataset/Knowledge API anahtarı değil (bu iki anahtar türü Dify'da farklıdır).

**Nasıl:**
1. Dify Studio → Knowledge (sol menü) → herhangi bir dataset'e gir → **API Access** sekmesi → yeni bir Knowledge API anahtarı oluştur (bu anahtar hesap/workspace seviyesinde tüm dataset'lere erişebilir, tek anahtar yeterli).
2. `.env.local`'e ekle: `DIFY_DATASET_API_KEY=<yeni-anahtar>`
3. Coolify → fpvlovers-frontend app → Environment Variables → aynı değişkeni ekle → redeploy (Coolify otomatik yapar, push'a gerek yok).

**Kendi kendine doğrulama (anahtarı ekledikten sonra çalıştır):**
```bash
node -e '
const apiKey = process.env.DIFY_DATASET_API_KEY;
fetch("https://dify.affexai.tr/v1/datasets/d1d5e44b-4dde-445a-a686-67a1cc0d926c/retrieve", {
  method: "POST",
  headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: "PID tuning oscillation", retrieval_model: { search_method: "hybrid_search", reranking_enable: false, top_k: 2, score_threshold_enabled: true, score_threshold: 0.3 } }),
}).then(r => r.json()).then(d => console.log(JSON.stringify(d).slice(0, 500)))'
```
Başarılıysa `records` alanı dolu bir JSON dönmeli (401/404 değil).

**Durum: Yapılmadı** — bu madde bu oturumda ilk kez tespit edildi.

---

## 3. Production'da `ENABLE_REAL_RAG=true` olduğunu Coolify'dan teyit et
**Öncelik: HIGH — madde 2 ile birlikte RAG grounding'in canlıda çalışıp çalışmadığını belirliyor.**

`.env.local`'de bu bayrak `true`, ama production ortamında aynı olup olmadığı önceki denetimde de doğrulanamamıştı, bu oturumda SSH erişimi olmadığı için yine doğrulanamadı. **Eğer production'da bu bayrak yoksa veya `false` ise**, `retrieval-orchestrator.ts` sessizce simüle edilmiş (sahte/`Math.random()`) veriye düşer — ama merak etme, bugün eklenen `retrieval-grounding.ts` katmanı bu sahte veriyi kesin olarak filtreliyor, yani kullanıcıya asla sahte kaynak gösterilmez; sadece gerçek grounding hiç devreye girmez.

**Nasıl:** Coolify → fpvlovers-frontend app → Environment Variables → `ENABLE_REAL_RAG` değerini kontrol et, yoksa `true` olarak ekle.

**Durum: Doğrulanamadı.**

---

## 4. GitHub repo secret `CRON_SECRET` ekle + eski host crontab'ını kapat
**Öncelik: HIGH.**

İçerik üretim pipeline'ının zamanlamasını, denetlenemeyen bir host crontab'ından version-kontrollü bir GitHub Actions workflow'una taşıdık (`7f6cbe6`, `.github/workflows/content-pipeline-cron.yml`). Bu workflow bir `CRON_SECRET` repo secret'ı bekliyor.

**Nasıl:**
1. GitHub → `hazarvolga/fpvlovers-v02` → Settings → Secrets and variables → Actions → New repository secret → `CRON_SECRET` (workflow dosyasının başındaki talimata göre bir değer belirle).
2. Actions sekmesinden workflow'u `workflow_dispatch` ile bir kez elle tetikleyip başarılı çalıştığını doğrula.
3. Ancak o zaman eski host crontab'ını kapat (`crontab -e` üzerinden, production sunucuda — SSH gerektirir).

**Durum: Doğrulanamadı** (hem secret eklenmiş mi hem crontab hâlâ aktif mi — SSH yok).

---

## 5. Dify workflow'una "sadece verilen context'ten alıntı yap" kuralı ekle
**Öncelik: MEDIUM.**

Makale gövdesi üretim prompt'u Dify Studio'da yaşıyor, bu repodan değiştirilemez. İdeation brief'lerindeki sahte-retrieval sorunu koddan düzeltildi (`0adfd42`), ama asıl makale-gövdesi workflow'unun system prompt'una "sana verilen RAG context dışında bilgi/kaynak uydurma" kuralını eklemek Dify Studio tarafında elle yapılması gereken ayrı bir iş.

**Nasıl:** Dify Studio → ilgili content-generation workflow/chatflow → System Prompt düzenle → grounding kısıtlamasını ekle → test et.

**Durum: Yapılmadı.**

---

## 6. 7 bağlı olmayan Dify workflow DSL'ini import et (opsiyonel, düşük öncelik)
`master-routing-tables.ts`'deki `WORKFLOW_IDS` değerleri hâlâ `'TODO-import-to-dify-first'`. `dify_workflows/` klasöründeki DSL'ler Dify Studio'ya elle import edilmeyi bekliyor. İstersen atlanabilir.

**Durum: Yapılmadı.**

---

## Özet Tablosu

| # | Adım | Öncelik | Nerede | Durum |
|---|------|---------|--------|-------|
| 1 | 7 API anahtarını rotate et | CRITICAL | Dify Studio | Doğrulanamadı |
| 2 | `DIFY_DATASET_API_KEY` oluştur + ekle | HIGH | Dify Studio + Coolify + `.env.local` | Yapılmadı |
| 3 | `ENABLE_REAL_RAG=true` prod'da teyit | HIGH | Coolify | Doğrulanamadı |
| 4 | `CRON_SECRET` ekle + eski crontab kapat | HIGH | GitHub + sunucu | Doğrulanamadı |
| 5 | Dify workflow grounding kuralı | Orta | Dify Studio | Yapılmadı |
| 6 | 7 workflow DSL import (opsiyonel) | Düşük | Dify Studio | Yapılmadı |

**Bir sonraki oturumda SSH ile devam etmek istersen:** doğru kullanıcı adı, port ve/veya kullanılacak private key yolunu paylaşman yeterli — bu oturumdaki agent'taki anahtar bu sunucularda yetkili değil.
