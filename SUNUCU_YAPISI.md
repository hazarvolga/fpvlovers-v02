# FPVLovers Sunucu ve Altyapı Mimarisi (Canlı Doğrulanmış Durum)

**Son Canlı Envanter & Denetim (SSH Live Audit):** 25 Ekim 2026  
**Proje:** `fpvlovers.com.tr` (`https://github.com/hazarvolga/fpvlovers-v02`)  
**Coolify Panel:** `https://coolify.affexai.tr/project/whqhxcqeyjvps3pdurplad1c/environment/1iqv0jce7xaocip7s52356vb`

---

## 📌 Sunucu Sağlık ve Kaynak Haritası (Contabo Tekil Sunucu Konsolidasyonu)

> **Not:** Eski 3'lü Oracle Cloud Free Tier sunucu mimarisi (`161.118.171.201`, `80.225.231.62`, `141.148.206.187`) Oracle limit kesintisi nedeniyle kalıcı olarak devre dışı bırakılmış ve tüm FPVLovers mimarisi **Contabo Cloud VPS 8 NVMe (`169.58.96.15` / `affexai-prod-01`)** üzerinde Coolify-native olarak konsolide edilmiştir. Detaylı handoff: `docs/handoff/2026-10-24-contabo-single-node-consolidation-handoff.md`.

| Sunucu Adı | Public IP | Donanım & OS | Sistem Kaynakları (25 Konteyner Aktif) | Durum |
| :--- | :--- | :--- | :--- | :--- |
| **`affexai-prod-01`** | `169.58.96.15` | Contabo Cloud VPS 8 NVMe (`8 vCPU`, `24 GB RAM`, `150 GB NVMe`, Ubuntu 24.04 LTS, `Europe/Istanbul`) | **RAM:** 23.5 GiB (~6.2 GiB kullanımda, ~17 GiB boş)<br>**Disk:** 145 GB (**%41 dolu, ~85 GB boş**) | ✅ **%100 SAĞLIKLI & CANLI** |

---

## 📦 COOLIFY (`FPV Lovers` → `production`) KAYNAK VE KONTEYNER ENVANTERİ

- **Coolify Proje UUID:** `whqhxcqeyjvps3pdurplad1c`
- **Coolify Ortam UUID:** `1iqv0jce7xaocip7s52356vb`

| Coolify Kaynağı | Tür & İmaj | Coolify UUID | İç Ağ Adresi / Public Alan Adı | Kaynak Limitleri | Durum & Görev |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`fpvlovers-web`** | `Application` (`Dockerfile` — Next.js 15 Standalone) | `jnlhgqmjnqwpdgefsoskew5n` | `https://fpvlovers.com.tr` (`Port 3000`, Healthcheck: `127.0.0.1:3000/api/health`) | `1536M` RAM / `2.0` CPU | 🟢 Canlı Web & Admin + Gece Scheduled Tasks (`01:15–04:45` Crawl, `05:30` Generate) |
| **`fpvlovers-postgres`** | `StandalonePostgresql` (`postgres:17-alpine`) | `gkmzgwnnirofcgpw2yh0bnlh` | `gkmzgwnnirofcgpw2yh0bnlh:5432` (`DB: fpvlovers`, `User: fpvlovers`) | `1024M` RAM / `1.0` CPU | 🟢 Ana PostgreSQL 17 (`fpvlovers_app`, `content_engine`, `public.llm_cache`) |
| **`fpvlovers-redis`** | `StandaloneRedis` (`redis:7-alpine`) | `erzatjqls2op2wuz3fxav1kf` | `erzatjqls2op2wuz3fxav1kf:6379` | `512M` RAM / `1.0` CPU | 🟢 Önbellek ve kuyruk yönetimi |
| **`fpvlovers-crawl4ai`** | `Service` (`unclecode/crawl4ai:0.9.5`) | `bgm2kq7nnehl1yx8myffsz1i` | `http://crawl4ai-bgm2kq7nnehl1yx8myffsz1i:11235` (`0.0.0.0:11235` internal) | `2560m` RAM / `2.0` CPU (`shm_size: 1gb`) | 🟢 Birleşik Primary/Backup Web Tarayıcı (Gece pencerelerinde aktif) |
| **`dify-ai`** | `Service` (10 Konteyner: Dify `v1.14.0` + Qdrant `v1.8.3`) | `ta4t6npg4cc65ua7rwhdixjk` | Public: `https://dify.affexai.tr`<br>Internal: `dify-gateway-ta4t6npg4cc65ua7rwhdixjk:80` | `CELERY_WORKER_AMOUNT=2`, Qdrant `1536m`, DB `1024m` | 🟢 9 RAG Dataset (`33 doküman`), 9 Workflow, 2 Chat Agent (`gemini-flash-latest` + `gemini-embedding-001`) |

---

## ⏰ Coolify Zamanlanmış Görevler (`fpvlovers-web`)

| Görev Adı | Coolify Task UUID | Cron (`Europe/Istanbul`) | Çalıştırılan Komut | Durum |
| :--- | :--- | :--- | :--- | :--- |
| **`FPVLovers Nightly Crawler`** | `xbkzuu5evfrwn7shmk3gf4fx` | `15,45 1,3,4 * * *` | `wget -qO- --header="x-cron-secret: $CRON_SECRET" http://127.0.0.1:3000/api/admin/cron/crawl` | ✅ Aktif |
| **`FPVLovers Early Morning Content Gen`** | `defc7nrm3galrd5nzoauprcr` | `30 5 * * *` | `wget -qO- --header="x-cron-secret: $CRON_SECRET" http://127.0.0.1:3000/api/admin/cron/generate` | ✅ Aktif |

---

## 🔒 Ağ Yapılandırması ve Operasyonel Kurallar
- **Coolify-Native Kuralı:** Tüm servisler, ortam değişkenleri ve zamanlanmış görevler yalnızca Coolify UI / API üzerinden yönetilir. Aynı sunucuda çalışan `AffeXAI Cortex` ve `Bimmetraj` projelerine ait konteynerlara kesinlikle müdahale edilmez.
- **Proxy & SSL:** Coolify Traefik Reverse Proxy üzerinden Let's Encrypt sertifikaları otomatik yönetilmektedir.
