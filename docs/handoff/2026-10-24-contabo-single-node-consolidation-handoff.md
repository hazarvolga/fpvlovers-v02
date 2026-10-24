# FPVLovers — Contabo Single-Node Consolidation & Coolify Handoff

**Date:** 2026-10-24
**Repository:** `https://github.com/hazarvolga/fpvlovers-v02` (`main`)
**Production Domain:** `https://fpvlovers.com.tr`
**Dify Console Domain:** `https://dify.affexai.tr`
**Coolify Dashboard:** `https://coolify.affexai.tr/project/whqhxcqeyjvps3pdurplad1c/environment/1iqv0jce7xaocip7s52356vb`

---

## 1. Executive Summary (What Changed & Why)

- **Legacy 3-Server Oracle Free Tier Architecture Decommissioned:** The previous three Oracle Cloud Free Tier servers (`80.225.231.62` Dify/DB, `161.118.171.201` Crawl4AI Primary, `141.148.206.187` Crawl4AI Backup) were terminated by Oracle due to unannounced Free Tier limit reductions.
- **Consolidated onto Single Contabo VPS (`169.58.96.15` / `affexai-prod-01`):** All FPVLovers infrastructure was rebuilt natively inside **Coolify** (`https://coolify.affexai.tr`) on the Contabo Cloud VPS 8 NVMe (`8 vCPU`, `24 GB RAM`, `150 GB NVMe`, Ubuntu 24.04 LTS, Timezone `Europe/Istanbul` UTC+3).
- **Strict Operational Rule (Coolify-Native Only):** Per explicit owner directive, **every service, database, application, environment variable, and scheduled task MUST be managed natively through Coolify UI / Coolify REST API** so the owner can inspect, monitor, and control everything from the Coolify web interface. Do **NOT** install unmanaged host-level `crontab` scripts, standalone `docker run` daemons, or custom disk setups outside Coolify.

---

## 2. Server Capacity & Co-Tenancy (`169.58.96.15`)

This Contabo server also hosts two other production projects in Coolify:
1. **AffeXAI Cortex (`project_id: 1`)** — `affexai-cortex-staging`, `affexai-mail` (Stalwart), `affexai-webmail` (Roundcube)
2. **Bimmetraj (`project_id: 3`)** — `bimmetraj.com` web + PostgreSQL

### Post-Deployment Resource Footprint (All 25 Containers Running)
- **Total RAM Used:** `5.6 GiB / 23.5 GiB` (**`17 GiB` available**)
- **Total Disk Used:** `44 GB / 145 GB` (**`31%` used, `101 GB` free** — after cleaning `~67 GB` of stale Docker build cache and unused images on 2026-10-24)
- **Baseline CPU Load:** `2.4% – 3.1%` (`96%+ idle`, Load Average `0.25 – 0.89`)

---

## 3. Coolify Inventory (`FPV Lovers` → `production`)

- **Coolify Project:** `FPV Lovers` (`id: 2`, `uuid: whqhxcqeyjvps3pdurplad1c`)
- **Coolify Environment:** `production` (`id: 2`, `uuid: 1iqv0jce7xaocip7s52356vb`)
- **Coolify Server:** `AffeXAI Production` (`uuid: gfd4soydj4te7pf8m8omivbs`, `localhost` / `169.58.96.15`)

| Resource Name | Coolify Type | Coolify UUID | Internal Hostname / Port (`coolify` network) | Resource Limits | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`fpvlovers-postgres`** | `StandalonePostgresql` (`postgres:17-alpine`) | `gkmzgwnnirofcgpw2yh0bnlh` | `gkmzgwnnirofcgpw2yh0bnlh:5432` (DB: `fpvlovers`, User: `fpvlovers`) | `1024M` RAM / `1` CPU | 🟢 `Up (healthy)` |
| **`fpvlovers-redis`** | `StandaloneRedis` (`redis:7-alpine`) | `erzatjqls2op2wuz3fxav1kf` | `erzatjqls2op2wuz3fxav1kf:6379` | `512M` RAM / `1` CPU | 🟢 `Up (healthy)` |
| **`fpvlovers-crawl4ai`** | `Service` (`unclecode/crawl4ai:latest`) | `bgm2kq7nnehl1yx8myffsz1i` | `crawl4ai-bgm2kq7nnehl1yx8myffsz1i:11235` | `2560m` RAM / `2.0` CPU (`shm_size: 1gb`) | 🟢 `Up (healthy)` |
| **`dify-ai`** | `Service` (10-container Dify v1.14.0 stack + Qdrant v1.8.3) | `ta4t6npg4cc65ua7rwhdixjk` | Public: `https://dify.affexai.tr` / Internal gateway: `dify-gateway-ta4t6npg4cc65ua7rwhdixjk:80` | `CELERY_WORKER_AMOUNT=2`, Qdrant `1536m`, DB `1024m` | 🟢 `Up (healthy)` |
| **`fpvlovers-web`** | `Application` (`Dockerfile` from `hazarvolga/fpvlovers-v02:main`) | `jnlhgqmjnqwpdgefsoskew5n` | Public: `https://fpvlovers.com.tr`, `https://www.fpvlovers.com.tr` (Port `3000`) | `1536M` RAM / `2` CPU | 🟢 `Up (healthy)` |

---

## 4. Database Migration & Backfill State (`fpvlovers-postgres`)

All schemas and migrations were applied and backfilled on 2026-10-24 into `fpvlovers-postgres` (`gkmzgwnnirofcgpw2yh0bnlh`):

1. **Applied Migrations (`fpvlovers_app.schema_migrations`):**
   - `0001_phase1_foundation.sql` through `0009_raw_crawl_content.sql` (`9/9` applied)
   - `migrations/add_llm_cache.sql` (`public.llm_cache` table + indexes)
2. **Backfilled Data Counts:**
   - `fpvlovers_app.published_content` (and `published_articles_shadow`): **`163 / 163`** published articles upserted from `content/published/*.json`
   - `fpvlovers_app.crawl_jobs`: **`159 / 159`** crawl jobs upserted from `data/crawl-queue.json`
   - `fpvlovers_app.content_jobs`: **`90 / 90`** content jobs upserted from `data/content-jobs.json`
   - `content_engine.raw_content`: **`17 / 17`** racing crawl markdown artifacts upserted from `data/racing-crawl-artifacts/*.json`

---

## 5. Nightly Crawler & Content Generation Schedule (Coolify Scheduled Tasks)

Based on `sysstat/sar` 24-hour CPU/Load telemetry and existing nighttime server jobs (`00:00` `logrotate`/`fstrim`, `02:17` `Stalwart TLS reload`, `03:00` `Bimmetraj PostgreSQL backup`, `06:00` `apt-daily-upgrade`), the lowest-load conflict-free windows on `169.58.96.15` (`Europe/Istanbul`, UTC+3) are **`01:15–02:00`** and **`03:45–05:30`**.

Two **Coolify Scheduled Tasks** are configured and active on `fpvlovers-web` (`https://coolify.affexai.tr/project/whqhxcqeyjvps3pdurplad1c/environment/1iqv0jce7xaocip7s52356vb/application/jnlhgqmjnqwpdgefsoskew5n/scheduled-tasks`):

| Task Name | Coolify Task UUID | Cron (`Europe/Istanbul`) | Command Executed in `fpvlovers-web` Container | Enabled |
| :--- | :--- | :--- | :--- | :--- |
| **`FPVLovers Nightly Crawler`** | `xbkzuu5evfrwn7shmk3gf4fx` | `15,45 1,3,4 * * *` *(01:15, 01:45, 03:45, 04:15, 04:45 TSİ)* | `wget -qO- --header="x-cron-secret: $CRON_SECRET" http://127.0.0.1:3000/api/admin/cron/crawl` | ✅ `true` |
| **`FPVLovers Early Morning Content Gen`** | `defc7nrm3galrd5nzoauprcr` | `30 5 * * *` *(05:30 TSİ)* | `wget -qO- --header="x-cron-secret: $CRON_SECRET" http://127.0.0.1:3000/api/admin/cron/generate` | ✅ `true` |

- **Why Nighttime-Only Crawling:** During daytime and evening hours (`05:00 – 01:14` TSİ), `fpvlovers-crawl4ai` receives no scheduled crawl jobs, keeping headless Chromium idle (`0%` CPU) so `fpvlovers-web`, `Bimmetraj`, and `AffeXAI Cortex` have full uncontested CPU/RAM headroom.

---

## 6. Critical Lessons & Fixes Applied During Consolidation

1. **`NODE_ENV=production` Build-Time Trap in Coolify:**
   - Setting `is_buildtime=true` on `NODE_ENV=production` in Coolify passes `--build-arg NODE_ENV=production` to `docker build`, causing `npm ci` in stage 1 (`deps`) to skip `devDependencies` and fail on `prepare: husky`.
   - **Rule:** Keep `is_buildtime=false` on `NODE_ENV` (and `CRON_SECRET`) in Coolify's `environment_variables` table for `fpvlovers-web`.
2. **Coolify Healthcheck IPv4 vs IPv6 (`localhost` vs `127.0.0.1`):**
   - On `node:22-alpine`, `wget http://localhost:3000/api/health` resolves `localhost` to IPv6 `::1`, while Next.js standalone binds to IPv4 `0.0.0.0:3000`.
   - **Rule:** `health_check_host` on `fpvlovers-web` is set to `127.0.0.1` (`health_check_path: /api/health`, `health_check_port: 3000`). Do not revert `health_check_host` to `localhost`.
3. **Dify v1.14.0 Coolify Service (`ta4t6npg4cc65ua7rwhdixjk`) Nuances:**
   - `dify-gateway` inline nginx config requires escaped `$$host`, `$$remote_addr`, `$$proxy_add_x_forwarded_for` in Docker Compose YAML so Compose does not interpolate them to empty strings.
   - `dify-plugin-daemon` requires the `dify_plugin` PostgreSQL database inside `dify-db` (created on 2026-10-24) plus explicit `REDIS_HOST: dify-redis`, `REDIS_PORT: '6379'`, and `REDIS_PASSWORD`.
   - `dify-api` requires `/app/api/storage` to be owned by `1001:1001 (dify:dify)` (`chmod 775`) so `opendal` can write workspace RSA private keys (`privkeys/<tenant_id>/private.pem`) during `/install`.
   - `dify-web` MUST have `CONSOLE_API_URL: 'https://dify.affexai.tr'` and `APP_API_URL: 'https://dify.affexai.tr'` set in its environment (persisted in both `docker-compose.yml` and Coolify's `services` table) so `NEXT_PUBLIC_API_PREFIX` starts with `https://` and reads the `__Host-csrf_token` cookie set by `dify-api`.
4. **Crawler Failover Unified to Local Internal Network (`crawl4ai:0.9.5`):**
   - Both `CRAWL4AI_PRIMARY_*` and `CRAWL4AI_BACKUP_*` environment variables on `fpvlovers-web` point to `http://crawl4ai-bgm2kq7nnehl1yx8myffsz1i:11235` (`/health` and `/crawl`) over the internal `coolify` Docker bridge network (`<1ms` latency, zero public port exposure).
   - In `unclecode/crawl4ai:0.9.5`, `entrypoint.sh` defaults `GUNICORN_BIND` to `127.0.0.1:11235` unless configured for internal network binding; `GUNICORN_BIND` was updated to `0.0.0.0:11235` with internal-network public prefixes enabled so `fpvlovers-web` reaches `/health` and `/crawl` cleanly.
5. **Gemini Model Deprecation Guard (`gemini-flash-latest`):**
   - New Google AI Studio API keys return `404 NOT_FOUND` on static legacy model names (`models/gemini-2.5-flash` and `models/gemini-2.5-flash-lite` are no longer available to new users).
   - Added `src/lib/llm-models.ts` (centralized model lifecycle registry, fallback chain, `ntfy.sh/fpv-rag-alerts` alerting, and `/api/admin/health` lifecycle check) and migrated all 9 Dify workflows, 2 Dify chat apps, and `GEMINI_PRIMARY_MODEL` to the rolling alias **`gemini-flash-latest`** (with `gemini-embedding-001` for embeddings).

---

## 7. Completed Post-Consolidation Verification (2026-10-24 Evening)

1. **[x] Article Media Cover & Metadata Repair (`ee41128`, `48e2e5e`):**
   - Repaired all broken `judgeme.imgix.net` covers, empty covers, and 18 bad external logo/portrait covers across `content/published/*.json`; backfilled catalog media into `public/images/source-cache/` (`pnpm media:audit` → `146 unique primary covers`, `0` violations).
   - Backfilled `metadata.difficulty` and `metadata.audience` across all `153/153` published articles (`36 beginner`, `108 intermediate`, `9 advanced`).
   - Removed mock data (`subscribersData`, `usageVsGrowthData`, `affiliateData`) and duplicate Sponsors form from `src/app/admin/page.tsx`.
2. **[x] Google Search Console Sitemap Submission:**
   - `https://fpvlovers.com.tr/sitemap.xml` submitted in Google Search Console by owner.
3. **[x] Dify v1.14.0 Full Initialization, 9 RAG Datasets & 9 Workflows Published:**
   - Initialized `https://dify.affexai.tr` workspace (`hazarvolga's Workspace`) and configured `langgenius/gemini/google` (`FPV Lovers`).
   - Created all 9 RAG datasets with canonical UUIDs (`fpv-flight-tuning`, `fpv-pid-profiles`, `fpv-troubleshooting`, `fpv-components-specs`, `fpv-build-guides`, `fpv-news-reviews`, `fpv-racing-events`, `fpv-community-knowledge`, `fpv-regulations`) and seeded 33 foundational documents (`indexing_status = completed` in Qdrant).
   - Imported and published all 9 Dify workflows + 2 Chat Agent apps (`FPV Expert Assistant`, `Community Hub`), generated all 23 `DIFY_*` tokens, and synced them to Coolify (`fpvlovers-web`).
   - Verified live readiness (`https://fpvlovers.com.tr/api/ready` → `status: "ready"`, 4/4 checks `pass`), live 9-dataset RAG evaluation (`9/9 PASS — 100%`), and live `POST /v1/chat-messages` LLM agent inference (`HTTP 200`).
