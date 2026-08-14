# Manuel Adımlar — Handoff (2026-08-01)

Bu doküman, `2026-08-01-comprehensive-platform-audit.md` denetiminden çıkan ve **koddan çözülemeyen, sadece senin Dify Studio / GitHub / Coolify üzerinden yapabileceğin** adımların tek listesidir. Her madde: ne, neden, nasıl, öncelik.

> **Güncelleme (2026-08-02, aynı gün ikinci geçiş):** SSH bağlantısı `SECRETS-MOVE-OUT-OF-REPO/server-info/` altındaki doğru anahtarlarla (`ubuntu@<ip>` + ilgili `.key` dosyası) başarıyla kuruldu, üç sunucuya da bağlanıldı. Aşağıdaki liste buna göre güncellendi — 2 ve 3 numaralı maddeler **canlıda doğrulanıp kapatıldı**, ama yeni ve daha acil bir sorun bulundu: **Coolify auto-deploy webhook'u çalışmıyor görünüyor** (bkz. madde 0).

---

## 0. YENİ — Coolify auto-deploy webhook'u çalışmıyor
**Öncelik: CRITICAL — bugün pushlanan RAG entegrasyonu (ve gelecekteki her push) canlıya çıkmıyor.**

`161.118.171.201` üzerinde çalışan app container'ı hâlâ `925e4e2` commit'inin build'i (dün 08:05 UTC'de deploy edilmiş, 20+ saattir "Up"). Bugün push edilen `3229124` ve `6ef6465` commit'leri için **hiçbir Coolify deployment job'ı tetiklenmemiş** (`docker logs coolify --since 2h` boş döndü — normalde her push'tan ~4 dakika sonra bir `ApplicationDeploymentJob RUNNING/DONE` çifti görünüyordu, bu oturumdan önceki tüm pushlar için böyleydi).

Yani **RAG orchestrator düzeltmesi şu an canlıda değil**, sadece GitHub'da.

**Nasıl:** Coolify paneli (`coolify.fpvlovers.com.tr`) → ilgili application → Deployments/Webhooks ayarına bak, GitHub webhook'unun hâlâ kayıtlı ve doğru secret'a sahip olduğunu doğrula (GitHub repo → Settings → Webhooks → son delivery'lerin durumuna bak, muhtemelen 404/401 dönüyordur). Sorunu bulana kadar geçici çözüm: Coolify panelinden ilgili application'ı elle "Redeploy" et.

**Durum: Doğrulandı, açık, çözülmedi.**

---

## 1. ~~7 sızdırılmış Dify API anahtarını rotate et~~ — TAMAMEN KAPANDI
**Durum: ✅ Tamamlandı (2026-08-02).**

31 Temmuz 2026 GAP denetiminde, public `hazarvolga/fpvlovers-v02` reposunda 7 canlı Dify API anahtarının düz metin commit edildiği tespit edilmişti (1 dataset key + 6 app key: Expert, Build Wizard, Part Matcher, Blackbox, Community, SEO workflow). Dosyalar redakte edildi (`1a2a7ba`), sonra bu turda tam rotasyon tamamlandı:

1. Dify Studio'da her 7 uygulama/dataset için suffix eşleştirmesiyle doğru app doğrulandı, yeni anahtar oluşturuldu (eskiler o an silinmedi — kesintisiz geçiş için).
2. Yeni değerler `SECRETS-MOVE-OUT-OF-REPO/canli-environtmens-degerleri.md`'ye yazıldı.
3. Sen Coolify'a girip 7 env değişkenini güncelleyip redeploy ettin.
4. SSH ile production container'ının (`48c9921` image) gerçekten yeni anahtarları kullandığı fingerprint eşleştirmesiyle doğrulandı; Part Matcher ve Blackbox Tuning canlıda gerçek RAG kaynaklarıyla (`retrievalGrade: medium/high`, dataset'ten gerçek chunk'lar) test edildi, çalıştı.
5. Ben Dify Studio'ya dönüp **7 ESKİ (sızdırılmış) anahtarın hepsini sildim** — Blackbox, Part Matcher, Build Wizard, FPV Expert Assistant, Community Hub, SEO Content Generator workflow, Dataset API key. Her birinde 1'den fazla eski anahtar VARSA (dataset key'de 4 tane daha eski, bu denetimin kapsamı dışındaki anahtar vardı) onlara dokunulmadı — sadece bu denetimde işaretlenen 7 tanesi silindi.

Artık sadece yeni anahtarlar aktif, sızıntı riski kapandı.

---

## 2. ~~Dedicated Dataset/Knowledge API key oluştur~~ — ÇÖZÜLDÜ, aksiyon gerekmiyor
**Durum: ✅ Canlıda doğrulandı, ek işlem gerekmiyor.**

SSH ile production container'ının (`161.118.171.201`) mevcut `DIFY_API_KEY` env değişkeni sunucu üzerinden (değeri hiç ekrana yazdırılmadan) doğrudan test edildi:
```
POST https://dify.affexai.tr/v1/datasets/d1d5e44b-4dde-445a-a686-67a1cc0d926c/retrieve
→ HTTP 200, gerçek Betaflight PID Tuning Guide içeriği döndü.
```
Yani production'daki `DIFY_API_KEY` **zaten geçerli bir Dataset/Knowledge API anahtarı** — chat-app anahtarı değil, endişe edilen tür farkı sorun değilmiş. Kod tarafında eklediğim `DIFY_DATASET_API_KEY` fallback'i (`retrieval-orchestrator.ts`) zaten `DIFY_API_KEY`'e düşecek şekilde yazılmıştı, yeni bir anahtar oluşturmaya gerek yok. (Yerelde `.env.local`'deki anahtarın 401 vermesi ayrı bir konu — muhtemelen eski/farklı bir anahtar, production'ı etkilemiyor.)

---

## 3. ~~`ENABLE_REAL_RAG=true` prod'da teyit~~ — ÇÖZÜLDÜ
**Durum: ✅ Canlıda doğrulandı.** `161.118.171.201` üzerindeki app container'ının env'inde `ENABLE_REAL_RAG=true` olduğu SSH ile doğrudan teyit edildi.

**Tek kalan blokaj artık madde 0'daki deploy sorunu** — anahtar ve bayrak doğru, ama düzeltilmiş kod henüz canlıda çalışmıyor çünkü yeni build hiç tetiklenmedi.

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

## 5. ~~Dify workflow'una "sadece verilen context'ten alıntı yap" kuralı ekle~~ — ÇÖZÜLDÜ VE YAYINDA
**Durum: ✅ Tamamlandı ve publish edildi (2026-08-02).**

Makale gövdesi üretim workflow'u **"SEO Content Generator"** (Dify Studio → Workflow) olarak bulundu — node zinciri: Start → SEO Research → RAG Retrieval → Metadata Enrichment → Outline Generator → **Article Generator** → Affiliate Injection → Schema Generator → End. Grounding kuralı eksik olan node `Article Generator`'ın system prompt'uydu — "Include specific product names, specs, and real performance notes" gibi talimatlar var ama RAG bağlamı boş/zayıf olduğunda uydurmayı engelleyen açık bir kısıtlama yoktu (tam olarak bu turda kapatılan tools-hallucination sorununun içerik-üretim tarafındaki eşleniği).

Eklenen kural (Article Generator system prompt'unun sonuna):
> "CRITICAL grounding rule: only state product names, specs, prices, or performance figures that appear in the retrieved knowledge base content above. If the retrieved knowledge is empty or does not cover a detail the outline calls for, write general non-specific guidance instead and do not invent a source, statistic, or spec to fill the gap."

**Yan bulgu + düzeltme:** Publish sırasında ilgisiz, önceden var olan bir engel bulundu — `RAG Retrieval` node'unun rerank ayarı "Rerank Model" seçiliydi ama yapılandırılmış model artık "Incompatible" (muhtemelen bir plugin kaldırılmış/güncellenmiş). Bu, yeni bir Dify sürüm doğrulama kuralı yüzünden yayınlamayı tamamen engelliyordu (workflow zaten 2 aydır bu haliyle canlıydı, yani sorun yeni değil, sadece publish'i şimdi engelliyordu). Model gerektirmeyen **"Weighted Score"** moduna geçirerek çözüldü (semantic 0.7 / keyword 0.3 — Dify'ın standart varsayılanı). Bunu ayrıca doğrulaman gerekmiyor, düşük riskli bir ayar değişikliği.

**Durum: ✅ Yayında, doğrulama gerekmiyor** — bir sonraki içerik üretiminde otomatik devreye girer.

---

## 6. 7 bağlı olmayan Dify workflow DSL'ini import et (opsiyonel, düşük öncelik)
`master-routing-tables.ts`'deki `WORKFLOW_IDS` değerleri hâlâ `'TODO-import-to-dify-first'`. `dify_workflows/` klasöründeki DSL'ler Dify Studio'ya elle import edilmeyi bekliyor. İstersen atlanabilir.

**Durum: Yapılmadı.**

---

## Özet Tablosu

| # | Adım | Öncelik | Nerede | Durum |
|---|------|---------|--------|-------|
| 0 | Coolify auto-deploy webhook'unu düzelt | CRITICAL | Coolify + GitHub | **Açık — yeni bulundu** |
| 1 | 7 API anahtarını rotate et | — | — | ✅ Tamamen kapandı — eski anahtarlar silindi |
| 2 | Dataset API key | — | — | ✅ Çözüldü — aksiyon gerekmiyor |
| 3 | `ENABLE_REAL_RAG=true` prod'da teyit | — | — | ✅ Çözüldü — canlıda `true` |
| 4 | `CRON_SECRET` ekle + eski crontab kapat | HIGH | GitHub + sunucu | Doğrulanamadı |
| 5 | Dify workflow grounding kuralı | — | — | ✅ Çözüldü — yayında |
| 6 | 7 workflow DSL import (opsiyonel) | Düşük | Dify Studio | Yapılmadı |

SSH artık çalışıyor (`SECRETS-MOVE-OUT-OF-REPO/server-info/` altındaki `ubuntu@<ip>` + `.key` kombinasyonlarıyla), bir sonraki oturumda tekrar kullanılabilir.
