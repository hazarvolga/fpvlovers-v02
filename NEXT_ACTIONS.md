# FPVLovers Next Actions

Last updated: 2026-06-01

## Immediate Priority

1. DONE Walkthrough remediation (2026-05-29): route audit is single-tree aware, content audit/smoke scripts run from local `tsx`, and admin Dify workflows route through `src/lib/dify-client.ts`.
2. DONE Phase 1 (2026-05-21): cron endpoints require a shared secret, `cron/crawl` uses `src/lib/crawl-queue.ts`, and dual cron routes are synced.
3. DONE Phase 2 (2026-05-21): `cron/generate` now enqueues real jobs, blocks safely without `DIFY_APP_KEY`, and publishes Dify output when production credentials are present.
4. DONE Phase 3 update (2026-05-29): legacy `app/` and `lib/` trees are decommissioned; `npm run routes:audit` now guards that single-tree state.
5. DONE Phase 4 (2026-05-21): final deploy gate passed, runtime files ignored, handoff refreshed, and release candidate commit prepared.
6. DONE Tool activation phase (2026-05-29): Build Calculator, Component Duel, and Part Matcher now run on deterministic local/catalog-backed engines; Playwright Chromium render/click smoke passed.
7. DONE Blackbox Tuning phase (2026-05-29): client Gemini SDK removed, `/api/tools/blackbox-tuning` server route added, AI enrichment aligned to Dify Blackbox app via `src/lib/dify-client.ts`, deterministic fallback active.
8. DONE Dify-brain correction (2026-05-29): local Gemini key usage removed from app code; Flight Critic, Blackbox Tuning, and Hardware Analyzer now use Dify-first API routes with deterministic fallback.
9. DONE Tool Dify alignment Phase 1 (2026-05-29): Build Wizard and Part Matcher now have Dify-first API review routes plus explicit UI review panels; deterministic calculators remain the guardrail.
10. DONE Blackbox live Dify validation (2026-05-29): production-mode smoke reached Dify through `src/lib/dify-client.ts`, but Dify returned provider credential error `[models] Error: 'google_api_key'`.
11. DONE Blackbox Dify provider fix (2026-05-29): Dify Gemini credential validated/updated via service layer using the full `AQ.` key format, and production-mode Blackbox smoke now returns `ok=true`, `dryRun=false`.
12. IN PROGRESS Tool live-data alignment (2026-05-29): Flight Critic is deferred, tool routes are hardened for short-timeout fallback, `npm run tools:audit` is the truth gate, `data/fpv-product-source-pack.json` is the crawler source pack, `data/fpv-products.catalog.json` is now the normalized product catalog input for Part Matcher / Component Duel, `npm run catalog:extract` can transform Crawl4AI markdown/JSON output into catalog records, Admin > Catalog Ops exposes the source/extract/write controls with queue-derived source statuses, and all 16 product catalog sources are now queued.
13. DONE Public language cleanup (2026-05-29): visible public/admin product copy no longer uses `AutoBlog`, `AI`, or `Dify`; implementation details stay internal behind FPVLovers/pilot-tool/workflow wording.
14. DONE Part Matcher stabilization (2026-06-01): duplicate demo CTA removed, neutral standby diagnostic state added, guided review disabled until required parts are selected, select accessibility wiring added, missing battery `cellCount` now warns instead of passing via motor fallback, catalog cache added, and `npm run tools:part-matcher:test` covers the voltage-data regression.
15. DONE Blackbox critical GAP closure phase (2026-06-01): API now exposes `answerMode`, `gatewayStatus`, `sources`, and `retrievalConfidence`; UI no longer accepts raw `.bbl/.bfl`; CSV/text telemetry summary support, regression test, smoke script, hardened audit, and Blackbox source backlog were added.
16. DONE Blackbox corpus queue phase (2026-06-01): 11 Blackbox/PID/filter/troubleshooting sources were connected to the general RAG backlog and enqueued into `data/crawl-queue.json`; `npm run tools:blackbox:sources` now reports pending/queued/crawled state.

## Code Tasks Before Push

- Review current git status and separate unrelated pre-existing changes from deploy-critical fixes.
- After deploy, run `BLACKBOX_SMOKE_BASE_URL=https://fpvlovers.com.tr npm run tools:blackbox:smoke:strict` and confirm the gateway is no longer `dry_run` if live Dify should be active.
- Keep Blackbox Tuning marked `PARTIAL` until queued Blackbox sources are crawled/ingested and `fpv-pid-profiles` plus `fpv-troubleshooting` have real corpus depth; current audit requires flight>=20, pid>=5, troubleshooting>=5 before PASS.
- Process the 11 queued Blackbox source jobs through the existing crawl queue/cron path; do not bypass `src/lib/crawl-queue.ts`.
- Defer Flight Critic until catalog-backed product tools are live; when resumed, require a dedicated Dify video/telemetry workflow before public positioning as true frame-level DVR analysis.
- Verify Build Wizard and Part Matcher against production Dify credentials with `CRAWL_DRY_RUN=true` or equivalent safe mode before presenting the Dify response as live RAG-backed guidance.
- Continue improving catalog quality before presenting Part Matcher or Component Duel as fully production-ready: current runtime has 102 products and 100 real images, but `npm run tools:audit` still marks product tools `PARTIAL` until crawler-backed specs and source provenance are stronger.
- Preview product catalog source coverage with `npm run catalog:sources`; enqueue with `npm run catalog:enqueue` only when ready to populate the crawl queue intentionally.
- Catalog source status is derived from crawl queue jobs, so enqueue first, then use Admin > Catalog Ops or `npm run catalog:sources` to confirm queued/crawled/failed status before extraction.
- Process the 16 queued product source jobs through the existing crawl queue/cron path, then feed the resulting markdown into `POST /api/admin/catalog/extract` or `npm run catalog:extract -- --write`.
- After product crawls complete, run `npm run catalog:extract -- --input <crawl-results.json> --write` or `POST /api/admin/catalog/extract` with `write: true` to transform extracted product pages into `data/fpv-products.catalog.json` with real image/provenance fields.
- Use `GET /api/admin/catalog/sources` in production after deploy to confirm source-pack and normalized product catalog readiness before enqueueing.
- Run `npm run tools:audit` after every catalog/tool phase and keep any `PARTIAL` status explicit in handoff notes.
- Keep implementation/vendor terms out of customer-facing copy. Prefer FPVLovers, pilot tools, workflow gateway, guided review, editorial workflow, catalog logic, and source-backed guidance.
- Do not include unreviewed runtime files (`data/*last-auto-run.json`) or local tool folders (`.kiro/`, `.gitnexus/`) in deploy commits unless they are intentionally promoted.
- Keep `sunucular/` out of Git. It is outside the frontend repo today and must stay private.
- Confirm `credentials.json` and secret-like files are ignored.
- Fix or defer lint debt intentionally. Current deployment requires build/typecheck first.

## Deployment Tasks

- Push `deploy-clean` and deploy the latest release candidate through Coolify.
- Set `CRON_SECRET` in Coolify environment before enabling scheduled tasks.
- Configure Coolify Scheduled Tasks:
  - `GET https://fpvlovers.com.tr/api/admin/cron/crawl` every 6 hours with `Authorization: Bearer $CRON_SECRET`
  - `GET https://fpvlovers.com.tr/api/admin/cron/generate` every 4 hours with `Authorization: Bearer $CRON_SECRET`
  - `GET https://fpvlovers.com.tr/api/admin/cron/status` manually or every 12 hours with `Authorization: Bearer $CRON_SECRET`
- After deploy, verify `/api/health`, `/api/admin/cron/status`, homepage, `/admin`, and two published articles in browser.
- Run one production `cron/generate?dry_run=true` before enabling real generation.
- Verify `/api/admin/workflows/seoContentGenerator` with production env in `CRAWL_DRY_RUN=true` or an equivalent safe mode before enabling live workflow calls.

## Infrastructure Follow-Up

- Fix Crawl4AI Docker healthcheck on primary and backup nodes. The API is healthy on port `80`, but the container healthcheck checks `11235`.
- Review public exposure of Redis/crawler ports on the crawler node.
- Check Oracle volume sizing. Expected capacity is 4 CPU / 24 GB RAM / 200 GB disk per server, but live root mounts showed smaller filesystems.

## Architecture Follow-Up

- Normalize all dataset/app routing to the 9-dataset model.
- Correct any stale `fpv-regulations` dataset ID references.
- Add env-based crawler provider config for primary/backup.
- Decide whether crawl queue state should stay file-based or move to a persistent store once the Excel seed batches are fully processed; current file-based queue is still empty while workbook batches are going straight through ingest.
- Decide whether `too_short` URLs should be excluded up front or kept as explicit retries for a different crawl strategy.
- Consider whether `t-motor` should remain in the seed workbook at all, since both the path and origin failed crawl retries.
- Do not reintroduce root `app/` or `lib/`; all active route and shared logic changes belong under `src/app` and `src/lib`.
- Use `npm run seeds:backlog` as the quick check for which sources still need to be found.
- Use `npm run seeds:backlog-pack` to regenerate the next ingest-ready three-source pack.
- Keep n8n out of active product flow unless a future automation feature needs it.
- When Opencode continues implementation, use `docs/superpowers/plans/2026-05-18-opencode-codex-collaboration-protocol.md` as the shared working protocol and keep `PROJECT_MEMORY.md` plus this file in sync after each handoff.
- Use `npm run handoff` whenever the next agent needs a fresh shared state packet; it writes `docs/handoff/latest.md` for humans and `docs/handoff/latest.json` for automatic finished-task / blocker detection.
- Use `npm run opencode:brief` to print a concise task brief from `docs/handoff/latest.json` so Opencode can begin without a manual explanation.
- Dify workflow blockers RESOLVED (2026-05-18): `retrieval_mode`, `multiple_retrieval_config`, and `google_api_key` all fixed. Full pipeline smoke test passed.

## Known Risks

- Lint currently has dashboard component debt and should be cleaned before strict CI.
- JSON runtime state should eventually move to Postgres or a mounted persistent volume.
- Coolify may preserve stale custom Traefik labels. If domain changes do not apply, clear app `custom_labels` and redeploy.
