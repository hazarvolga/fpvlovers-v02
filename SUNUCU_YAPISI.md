# FPVLovers Sunucu ve Altyapı Mimarisi (Canlı Canlı Doğrulanmış Durum)

**Son Canlı Envanter & Denetim (SSH Live Audit):** 26 Temmuz 2026  
**Proje:** `fpvlovers.com.tr`  

---

## 📌 Sunucu Sağlık ve Kaynak Haritası

Tüm erişilebilir Oracle Free Tier sunucularına SSH ile bağlanılarak çalışan Docker konteynerları, uygulama isimleri, imajları ve sistem kaynakları canlı olarak çıkarılmıştır.

| Sunucu Adı | Public IP | Çalışan Ana Servisler & Konteynerlar | Sistem Kaynakları | Durum |
| :--- | :--- | :--- | :--- | :--- |
| **`instance-hulyaekiz`** | `161.118.171.201` | 🚀 **FPVLovers Web App**<br>🕷 **Crawl4AI Web Scraper**<br>⚙️ **n8n Workflow Automation**<br>🐘 **PostgreSQL 17 & 16**<br>🌐 **Cloudflare Tunnel** & Traefik | **RAM:** 23 GB (3 GB kullanımda)<br>**Disk:** 78 GB (**%52 dolu, 38 GB boş**)<br>**Uptime:** 305 Gün | ✅ **%100 SAĞLIKLI & CANLI** |
| **`instance-aluplan-one`** | `80.225.231.62` | 🤖 **Dify AI Platform (v1.14.0)**<br>• Dify API, Web, Workers & Beat<br>• Qdrant Vector DB (v1.8.3)<br>• Dify Code Sandbox & Nginx<br>• Dify Postgres & Redis | **RAM:** 23 GB (4.5 GB kullanımda)<br>**Disk:** 78 GB (**%55 dolu, 36 GB boş**)<br>**Uptime:** 305 Gün | ✅ **%100 SAĞLIKLI & CANLI** |
| **`instance-orko`** | `141.148.206.187` | 🕷 **Crawl4AI Backup Node**<br>🧠 **Ollama AI Engine**<br>🛠 Coolify Base & Proxy Services | **RAM:** 23 GB (2.4 GB kullanımda)<br>**Disk:** 45 GB (**%50 dolu, 23 GB boş**)<br>**Uptime:** 139 Gün | ✅ **%100 SAĞLIKLI & TEMİZLENDİ** |

---

## 📦 SUNUCU BAZLI DETAYLI UYGULAMA VE KONTEYNER ENVANTERİ

### 1. `instance-hulyaekiz` (`161.118.171.201`) — Web & Otomasyon Sunucusu

Bu sunucu ana web sitesini, içerik otomasyonunu ve veri tarayıcılarını barındırır:

| Uygulama / Servis Adı | Konteyner İsmi / Img | Docker İmajı | Portlar / Protokol | Görev & İşlevi |
| :--- | :--- | :--- | :--- | :--- |
| **FPVLovers Web App** | `r0c44ok0cskc800gs...` | `r0c44ok0cskc800gs...:latest` | `3000/tcp` (Internal) | `fpvlovers.com.tr` canlı Next.js 15 Standalone web uygulaması. |
| **Crawl4AI Scraper** | `kkoswgkwcocc88kk...` | `unclecode/crawl4ai:latest` | `80/tcp`, `6379/tcp` | FPV içerikleri ve web tarama (scraping) motoru. |
| **Crawler Proxy** | `crawler-proxy` | `alpine/socat` | `3002:3002/tcp` | Tarayıcı trafiği yönlendirici proxy. |
| **n8n Automation** | `n8n-tow48sswo4ck...` | `n8nio/n8n:2.10.2` | `5678/tcp` | İçerik ve iş akışı otomasyon platformu. |
| **n8n Task Runners** | `task-runners-tow...` | `n8nio/runners:2.10.2` | `5680/tcp` | n8n arka plan görev işleyicileri. |
| **App PostgreSQL** | `yo4kkoc08kgw080k...` | `postgres:17-alpine` | `5432/tcp` | FPVLovers ana PostgreSQL 17 veritabanı. |
| **n8n PostgreSQL** | `postgresql-tow48...` | `postgres:16-alpine` | `5432/tcp` | n8n otomasyon veritabanı. |
| **Redis Cache** | `m0cs4gs4c8ks4c00...` | `redis:7.2` | `6379:6379/tcp` | Önbellek ve kuyruk veritabanı. |
| **Cloudflare Tunnel** | `cloudflared-uoo4...` | `cloudflare/cloudflared:latest` | Outbound Tunnel | Güvenli Cloudflare ağ tüneli. |
| **Coolify Core** | `coolify`, `coolify-proxy`, `coolify-db`, `coolify-redis` | `traefik:v3.1`, `postgres:15-alpine` | `80`, `443`, `8000`, `6001` | Coolify PaaS yönetim ve Traefik reverse proxy katmanı. |

---

### 2. `instance-aluplan-one` (`80.225.231.62`) — Yapay Zeka (Dify & Qdrant) Sunucusu

Bu sunucu Dify platformunu ve AI vektör veritabanlarını çalıştırır:

| Uygulama / Servis Adı | Konteyner İsmi | Docker İmajı | Portlar / Protokol | Görev & İşlevi |
| :--- | :--- | :--- | :--- | :--- |
| **Dify Web UI** | `web-mw8g48wcsc840...` | `langgenius/dify-web:1.14.0` | `3000/tcp` | Dify yönetim ve grafik arayüzü (`dify.affexai.tr`). |
| **Dify API Core** | `api-mw8g48wcsc840...` | `langgenius/dify-api:1.14.0` | `5001/tcp` | Dify REST API servis motoru. |
| **Dify Worker** | `worker-mw8g48wcsc...` | `langgenius/dify-api:1.14.0` | Internal | Dify Celery kuyruk işleyicisi (SEO, RAG, Video Director). |
| **Dify Beat** | `worker_beat-mw8g...` | `langgenius/dify-api:1.14.0` | Internal | Dify periyodik zamanlanmış görev motoru. |
| **Qdrant Vector DB** | `qdrant-mw8g48wcsc...` | `langgenius/qdrant:v1.8.3` | `6333-6334/tcp` | Vektör arama ve RAG bilgi havuzu veritabanı. |
| **Dify Code Sandbox** | `sandbox-mw8g48w...` | `langgenius/dify-sandbox:0.2.14` | Internal | Güvenli Python/JS kod çalıştırma alanı. |
| **Dify Plugin Daemon** | `plugin_daemon-mw...` | `langgenius/dify-plugin-daemon` | Internal | Dify eklenti yönetim servisi. |
| **Dify SSRF Proxy** | `ssrf_proxy-mw8g...` | `ubuntu/squid:latest` | `3128/tcp` | Dify dış istek güvenlik proxy'si (Squid). |
| **Dify Nginx Gateway** | `nginx-mw8g48wcsc...` | `nginx:latest` | `80/tcp` | Dify iç ağ HTTP ağ geçidi. |
| **Dify PostgreSQL** | `db-mw8g48wcsc840...` | `postgres:15-alpine` | `5432/tcp` | Dify uygulama veritabanı. |
| **Dify Redis** | `redis-mw8g48wcsc...` | `redis:7-alpine` | `6379/tcp` | Dify önbellek veritabanı. |
| **Coolify Core** | `coolify`, `coolify-proxy`, `coolify-db`, `coolify-redis` | `traefik:v3.6`, `postgres:15-alpine` | `80`, `443`, `8000`, `6001` | Coolify PaaS yönetim ve Traefik v3.6 reverse proxy katmanı. |

---

### 3. `instance-orko` (`141.148.206.187`) — Tarama & LLM Sunucusu

Bu sunucu ikincil tarayıcıyı ve yerel LLM servislerini barındırır:

| Uygulama / Servis Adı | Konteyner / Servis İsmi | İmaj / Servis Türü | Portlar / Protokol | Görev & İşlevi |
| :--- | :--- | :--- | :--- | :--- |
| **Crawl4AI Backup** | `crawl4ai-backup` | `unclecode/crawl4ai:latest` | `6379/tcp` | İkincil web tarama ve bilgi toplama botu. |
| **Ollama AI Engine** | `ollama serve` | Linux Service (Systemd) | `11434/tcp` | Yerel LLM çalıştırıcı (Llama3.2, Nomic-Embed-Text vb.). |
| **Coolify Core** | `coolify`, `coolify-proxy`, `coolify-db`, `coolify-redis` | `traefik:v3.1`, `postgres:15-alpine` | `80`, `443`, `8000`, `6001` | Coolify PaaS yönetim ve Traefik v3.1 reverse proxy katmanı. |

---

## 🔒 Ağ Yapılandırması ve Güvenlik
- **Proxy Engine:** Coolify Traefik Proxy (Port 80 / 443 / 8080).
- **SSL / TLS:** Let's Encrypt / Traefik üzerinden otomatik yönetilmektedir.
