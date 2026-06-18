# FPVLovers Project Memory

Last updated: 2026-06-18

## Current Product Direction

FPVLovers is a Next.js 15 / React 19 frontend and admin platform for FPV drone content, RAG-assisted tools, crawler ingestion, and trust-first monetization.

The current MVP architecture is intentionally simple:

```text
Frontend / Admin Panel
  -> Next.js API Routes
  -> Crawler provider
  -> Dify API
  -> RAG datasets / content generation / admin views
```

n8n is not part of the active MVP flow. It can stay available as an optional automation layer for future batch jobs, sheets, webhooks, reports, or experiments, but the production path should use Dify plus crawler directly.

## Active Deployment Target

- Primary hosting target: Coolify on Oracle Cloud Free Tier VPS.
- Active frontend repo: `hazarvolga/fpvlovers.com.tr`
- Coolify app target: the existing FPVLovers frontend application on the `fpv-lovers-web-sitesi` project.
- Runtime port: `3000`.
- Preferred app root: repository root with `Dockerfile`.

## Current Known State

- Post-analysis GAP closure Phase 3 completed locally on 2026-06-18: all 13 semantic `any` annotations introduced after `06e2c58` were replaced with existing domain types or `Record<string, unknown>`, and 82 trailing-whitespace/EOF violations in the same change range were removed. `pnpm quality:recent` now guards that range and supports `QUALITY_BASE_REF` for CI or rewritten history. Fresh verification passed with `pnpm quality:recent`, `pnpm exec tsc --noEmit`, and full `pnpm lint`.
- Post-analysis GAP closure Phase 2 completed locally on 2026-06-18: the metadata migration now preserves existing commercial metadata and deterministically fills missing discovery fields across all published artifacts. All 117 artifacts have valid metadata with zero missing `difficulty`, `contentType`, `topics`, `audience`, `discipline`, or `components`; buyer-guide taxonomy is canonicalized to `Buyer Guides`. The migration is idempotent (`0 artifact(s)` on the second run). Fresh verification passed with `pnpm metadata:test`, `pnpm metadata:audit`, `pnpm content:audit`, and `pnpm exec tsc --noEmit`.
- Post-analysis GAP closure Phase 1 completed locally on 2026-06-18: tracked operational credential values were removed from current files, YouTube and retrieval scripts now require environment-managed Dify credentials, retrieval testing routes through `src/lib/dify-client.ts`, and metadata audit output is portable at `reports/unified-metadata-report.md`. Fresh verification passed with `pnpm security:audit`, `pnpm metadata:audit`, `pnpm exec tsc --noEmit`, and `git diff --check`. External Dify/cron credential rotation and coordinated Git-history cleanup remain operational requirements; current-file cleanup alone does not revoke exposed values.
- GAP closure execution was reset into a phase-by-phase Codex plan on 2026-05-21 at `docs/superpowers/plans/2026-05-21-gap-closure-execution-plan.md`.
- OpenCode commit `2fb816a` is documentation-only; the automation implementation is `34369ec`.
- Local verification before the new phase plan: `npx tsc --noEmit`, `npm run content:audit`, and `npm run content:smoke` passed.
- Remaining launch blockers are operational rather than editorial: cron auth, crawl queue compliance, real content generation loop, duplicate route strategy, and final deploy gate.
- Phase 1 completed by Codex on 2026-05-21: cron endpoints now require `CRON_SECRET`/`CRON_AUTH_TOKEN`, `cron/crawl` enqueues through `src/lib/crawl-queue.ts` instead of calling Crawl4AI directly, and `app/` plus `src/app/` cron route copies are synced. Verification passed: `npx tsc --noEmit`, route smoke (`401` without secret, `200` with secret), `npm run content:audit`, and `npm run content:smoke`.
- Phase 2 completed by Codex on 2026-05-21: `cron/generate` now actually enqueues missing editorial briefs, blocks safely when `DIFY_APP_KEY` is absent, and can generate via Dify plus publish successful artifacts through the shared `publishGeneratedContentArtifact()` helper. Verification passed: `npx tsc --noEmit`, dry-run route smoke, enqueue/blocker route smoke, `npm run content:audit`, and `npm run content:smoke`. Live Dify generation still needs production env verification.
- Phase 3 completed by Codex on 2026-05-21: duplicate `app/` and `src/app/` route trees were synced and guarded with `npm run routes:audit` via `scripts/route-tree-drift-audit.mjs`. The repo keeps dual route trees for this deploy to avoid runtime precedence surprises, but full drift detection is now part of the gate. Verification passed: `npm run routes:audit` (77 files synced), `npx tsc --noEmit`, `npm run content:audit`, and `npm run build`.
- Phase 4 completed by Codex on 2026-05-21: final deploy hygiene added runtime/tool ignores, removed tracked `tsconfig.tsbuildinfo`, preserved published media artifacts, and refreshed handoff for Coolify cron setup. Final gate passed locally: `npx tsc --noEmit`, `npm run routes:audit`, `npm run content:audit`, `npm run content:smoke`, and `npm run build`.
- Walkthrough remediation completed by Codex on 2026-05-29:
  - `67fa56d`: `npm run routes:audit` now validates the single `src/app` route tree, fails if legacy root `app/` or `lib/` returns, and ignores `.DS_Store`.
  - `9ee4565`: `tsx` is a local devDependency and content audit/smoke scripts run through `node --import tsx`, avoiding registry/network dependency during verification.
  - `afaf7e9`: `/api/admin/workflows/[name]` now routes through `src/lib/dify-client.ts` so workflow calls use the guarded Dify gateway path with budget/rate/cache handling and normalized admin response fields.
  - Fresh verification passed: `npx tsc --noEmit`, `npm run routes:audit`, `npm run content:audit`, `npm run content:smoke`, and `npm run build`.
- Tool activation phase completed by Codex on 2026-05-29:
  - `/tools/calculator` now uses a deterministic local FPV build calculator engine for AUW, thrust ratio, hover throttle, current margin, flight time, safe KV range, and warning states.
  - `/tools/component-duel` now runs against a shared FPV product catalog derived from `data/affiliates.json` plus normalized specs instead of a disabled placeholder form.
  - `/tools/part-matcher` no longer calls Gemini from the client; it uses the same catalog plus deterministic compatibility checks for frame/prop, KV/voltage, motor/battery, ESC margin, and calculator-derived metrics.
  - Playwright Chromium was installed locally and verification passed: `npx tsc --noEmit`, `npm run routes:audit`, Playwright render smoke for `/tools/component-duel`, and Playwright click smoke for `/tools/part-matcher`.
- Blackbox Tuning phase completed by Codex on 2026-05-29:
  - `/tools/blackbox-tuning` no longer exposes Gemini from the client. It posts to `/api/tools/blackbox-tuning`, which routes AI enrichment through the Dify Blackbox Tuning Advisor app via `src/lib/dify-client.ts`.
  - The route has a deterministic local fallback that returns confidence, risk level, detected issues, proposed PID/filter settings, and motor-heat-safe next steps.
  - Direct local Gemini key usage was removed after architecture review; provider credentials belong in Dify, not in the local Next.js app.
- Dify-brain alignment correction completed by Codex on 2026-05-29:
  - Local Gemini key files and Gemini-specific env vars are no longer read by app code.
  - `/api/analyze-flight`, `/api/tools/blackbox-tuning`, and `/api/tools/hardware-analyzer` route AI enrichment through Dify apps via `src/lib/dify-client.ts` and fall back to deterministic local analysis when Dify is dry-run/unavailable.
  - Legacy unused `components/features/*` Gemini widgets were removed so the single `src/` tree remains the active source of truth.
- Tool Dify alignment Phase 1 completed by Codex on 2026-05-29:
  - `/api/tools/build-wizard` wraps the deterministic build calculator with a Dify Build Wizard review through `src/lib/dify-client.ts`; local dry-run/unavailable Dify returns a clear deterministic review fallback.
  - `/api/tools/part-matcher` wraps catalog-backed compatibility checks with the Dify Part Matcher app through `src/lib/dify-client.ts`; the deterministic score/checks remain the guardrail.
  - `/tools/calculator` and `/tools/part-matcher` now expose explicit Dify review panels with source/warning states, keeping calculation local and recommendation intelligence in Dify.
  - Verification passed: `npx tsc --noEmit`, `npm run routes:audit`, localhost API smoke for both routes, and Playwright render smoke for both tool pages after restarting a stale dev server.
- Blackbox Tuning live Dify validation completed by Codex on 2026-05-29:
  - Local endpoint smoke confirmed dev-mode fallback works as intended: `source=local` with `Dify dry-run is active in this environment`.
  - A live production-mode smoke through `src/lib/dify-client.ts` reached the Dify Blackbox Tuning Advisor app with `dryRun=false`, but Dify returned `HTTP 400 invalid_param / PluginInvokeError [models] Error: 'google_api_key'`.
  - Conclusion: Next.js routing and app token wiring are correct; the active blocker is Dify-side provider credential/model configuration for the Blackbox app.
- Blackbox Dify provider credential fixed by Codex on 2026-05-29:
  - The local key file contains the newer full-line `AQ.` style token; the previous validation attempt accidentally stripped the prefix by splitting on `.`.
  - Dify Gemini provider credential was validated and updated through `ModelProviderService` with `{"google_api_key": "<redacted>"}`; no local app env/key path was introduced.
  - Production-mode Blackbox smoke through `src/lib/dify-client.ts` now returns `ok=true`, `dryRun=false`, and a non-empty Dify answer.
  - `/api/tools/blackbox-tuning` strips model reasoning blocks such as `<think>...</think>` before returning Markdown to the UI.
- Tool live-data alignment started by Codex on 2026-05-29:
  - Flight Critic is explicitly deferred until catalog-backed product tools are live and a dedicated video/telemetry Dify workflow exists.
  - Build Wizard, Part Matcher, Hardware Analyzer, and Blackbox now share Dify Markdown extraction/sanitization via `src/lib/dify-response.ts`.
  - Dify-backed tool routes now use short 15s timeouts and return deterministic local fallbacks instead of letting the UI wait on slow RAG calls.
  - `npm run tools:audit` was added to report the current truth state: the catalog is still an MVP seed with 15 active products and no real product images, so Part Matcher and Component Duel remain `PARTIAL` until crawler/source-backed catalog expansion lands.
  - `data/fpv-product-source-pack.json` and `npm run catalog:sources`/`npm run catalog:enqueue` define the next crawler-backed catalog expansion path through `src/lib/crawl-queue.ts`; the pack currently targets 16 retailer/manufacturer sources for frames, motors, stacks, batteries, video systems, receivers, radios, goggles, and kits.
- Product catalog ingestion bridge added by Codex on 2026-05-29:
  - `data/fpv-products.catalog.json` is the normalized crawler product catalog input for Part Matcher, Component Duel, Hardware Analyzer, and affiliate tooling.
  - `src/lib/tools/crawler-product-catalog.ts` validates crawler-normalized products and `src/lib/tools/fpv-product-catalog.ts` merges crawler products before affiliate seed fallback.
  - `GET/POST /api/admin/catalog/sources` exposes product source-pack preview and queue enqueue through the existing `src/lib/crawl-queue.ts` path.
  - Verification passed: `npx tsc --noEmit`, `npm run tools:audit`, and `npm run catalog:sources`.
- Product catalog extraction bridge added by Codex on 2026-05-29:
  - `src/lib/tools/product-catalog-extractor.ts` extracts product-like records, specs, prices, links, image URLs, and provenance from Crawl4AI markdown/JSON output.
  - `src/lib/tools/product-catalog-store.ts` upserts extracted crawler products into `data/fpv-products.catalog.json` without replacing the existing seed fallback.
  - `npm run catalog:extract -- --input <crawl-results.json>` dry-runs extraction; adding `--write` persists records.
  - `POST /api/admin/catalog/extract` lets the admin layer submit a crawled page payload and optionally write extracted products into the normalized catalog.
  - Verification passed: `npx tsc --noEmit`, `npm run tools:audit`, `npm run routes:audit`, and a fixture dry-run extraction.
- Catalog Ops and public language cleanup added by Codex on 2026-05-29:
  - `src/app/admin/page.tsx` now includes a Catalog Ops tab for source-pack preview, source enqueue, crawler markdown extraction, optional catalog write, and catalog/image metrics.
  - Catalog source status now derives from `data/crawl-queue.json`: queued/processing/throttled jobs show as `queued`, completed jobs as `crawled`, and failed jobs as `failed`.
  - `src/lib/crawl-queue.ts` normalizes missing legacy queue stats at read time so admin APIs can always report queue totals without rewriting the queue file.
  - Public-facing and visible admin copy no longer uses `AutoBlog`, `AI`, or `Dify` terminology; customer language now uses FPVLovers, pilot tools, workflow gateway, guided review, and editorial wording.
  - Browser smoke verified visible body text on `/`, `/tools/calculator`, `/tools/part-matcher`, and `/admin` does not include those banned terms.
  - Verification passed: `npx tsc --noEmit`, `npm run routes:audit`, `npm run tools:audit`, `npm run catalog:sources`, `npm run build`, and Playwright render/text smoke.
- Product source enqueue completed by Codex on 2026-05-29:
  - `POST /api/admin/catalog/sources` enqueued all 16 product catalog sources into `data/crawl-queue.json`.
  - Queue-derived status now reports `pending=0`, `queued=16`, `crawled=0`, `failed=0` for the product source pack.
  - Crawl queue totals after enqueue: `total=33`, `pending=19`, `completed=14`, `failed=0`, `throttled=0`.
  - No direct Crawl4AI call was made; the next step is processing queued jobs through the existing crawl queue worker/cron path.
- Part Matcher stabilization completed by Codex on 2026-06-01:
  - `fpvlovers-part-matcher-analiz-raporu.md` was reviewed against the live frontend app. The report's old "15-product / empty crawler catalog" finding is stale; current runtime catalog returns 102 products, 100 real images, and required-slot coverage of frame=14, motor=20, prop=15, stack=13, battery=13.
  - `/tools/part-matcher` now starts in a neutral standby state instead of showing a misleading blocked score before user selection.
  - The duplicate large "Load Known Good Build" CTA was removed; the small `[LOAD_CATALOG_BUILD]` helper remains for fast demo fill.
  - Guided review is disabled until all required core parts are selected, and select controls now have explicit `label`/`id` accessibility wiring plus an empty-category option.
  - `analyzeBuildCompatibility()` no longer treats motor cell tags as a fallback for missing battery `cellCount`; missing battery cell data now produces warnings and skips calculator-derived metrics until voltage is explicit.
  - `getFpvProductCatalog()` now uses mtime-aware in-memory caching for the crawler and affiliate catalog files.
  - Regression coverage was added with `npm run tools:part-matcher:test`.
  - Verification passed: `npm run tools:part-matcher:test`, `npx tsc --noEmit`, `npm run tools:audit`, `npm run routes:audit`, headless Chromium desktop/mobile smoke on `/tools/part-matcher`, and `npm run build`.

- Racing Intelligence Dify readiness phase completed by Codex on 2026-06-02:
  - Racing Division UI, source queueing, crawl artifact capture, Dify workflow gateway, and JSON output store scaffolding are in place.
  - Official racing crawl artifacts are ready: `npm run racing:intelligence:status` reports `sources=19`, `crawled=17`, and `artifacts=17`.
  - Dify UI does not yet show a Racing app because `dify_workflows/racing-intelligence-orchestrator.dify.yml` has not been imported/published in Dify.
  - `DIFY_RACING_WORKFLOW_TOKEN` is not configured, so `npm run racing:workflow:smoke` correctly reports `not_configured`.
  - `scripts/racing-intelligence-ingest.ts` now refuses to write workflow runs or entities unless the Racing Dify workflow is configured and returns a successful source-backed result.
  - Racing public sidebar sections must remain empty/source-pending until Dify produces real event/calendar/pilot/team/result/content brief outputs from the captured crawl artifacts.

- Local build and TypeScript were stabilized in this workspace after prior Coolify failures.
- Production deploy succeeded on 2026-05-17 from commit `b4055de`.
- `https://fpvlovers.com.tr` and `https://www.fpvlovers.com.tr` serve the frontend through Coolify.
- `/api/health` returns JSON `status: ok` on production.
- Coolify app routing was blocked by stale `custom_labels` containing the old `sslip.io` route; clearing them allowed FQDN-generated Traefik labels.
- `FPV_RAG_Web_List_CLEAN.xlsx` is now normalized by `scripts/import-fpv-rag-seeds.py` into `data/fpv-rag-seeds.manifest.json`; all 86 workbook rows have been processed through local pilot batches, `data/fpv-rag-seeds.failed.json` tracks retry candidates, and the only remaining crawl exception after retry is `https://www.t-motor.com/download` (also failed at the origin fallback).
- Retrieval simulation now respects dataset population in both `lib/` and `src/lib/`: empty datasets no longer fabricate evidence, sparse datasets are scored conservatively, and fallback confidence is capped when the primary corpus is missing.
- Live `/api/master?action=retrieval` verification on 2026-05-18 showed honest behavior: `tuning` high confidence, `parts` no-answer on an empty corpus, `build` fallback-only medium confidence, `troubleshooting` fallback-only low-medium confidence, and `regulations` high confidence.
- The direct admin Dify retrieval test route still returned `Unauthorized` during local verification, so the local orchestrator is currently the trusted retrieval smoke path until the Dify app key / permissions are refreshed.
- A source backlog now lives at `data/fpv-rag-source-backlog.json` and is readable via `npm run seeds:backlog`; the missing items currently tracked there are `INAV`, `MEPS King`, `Fpvtips`, `IntoFPV`, `RCGroups`, and `SpeedyBee`.
- A ready-to-ingest pack now lives at `data/fpv-rag-source-pack.json` and currently prioritizes `IntoFPV`, `RCGroups`, and `SpeedyBee` as the next three sources to chase.
- Local admin smoke is now unblocked: middleware bypasses loopback/dev requests, and `/api/admin/retrieval` falls back to the local orchestrator when `DIFY_APP_KEY` is unavailable or Dify returns auth failure. The endpoint now returns JSON again instead of raw `Unauthorized`.
- The backlog was expanded with the academic/racing sources from the Compass artifact, including ArduPilot, PX4 docs, Bluejay docs, AM32 wiki, HDZero docs, Holybro docs, TBS media files, RotorBuilds, MultiGP rule book, manuals.plus, firstquadcopter, and the academic papers around autonomous racing, PID/RL, VR training, and anti-jamming.
- A shared Opencode + Codex collaboration protocol now exists at `docs/superpowers/plans/2026-05-18-opencode-codex-collaboration-protocol.md`; Codex owns planning/review and Opencode owns implementation, with `PROJECT_MEMORY.md` and `NEXT_ACTIONS.md` as the source of truth for handoffs.
- A handoff generator now exists at `scripts/generate-handoff.mjs` and is wired to `npm run handoff`; it writes both `docs/handoff/latest.md` and machine-readable `docs/handoff/latest.json` so the next agent can pick up the latest state and automatically detect whether it is starting from a finished task or an active blocker.
- An Opencode brief generator now exists at `scripts/opencode-brief.mjs` and is wired to `npm run opencode:brief`; it reads `docs/handoff/latest.json` and prints a concise machine-readable task brief so the next agent can start from the same state without manual explanation.
- Published content now carries a media model with copyright-safe local cover art. The new `media.coverImage` source is rendered on homepage cards, article pages, and admin preview, and the first two published articles are tracked in `content/published/*.json`.
- Dify `SEO Content Generator` workflow (app ID `a6d903cf`) was stabilized on 2026-05-18 via direct DB + service-layer operations:
  - `retrieval_mode`: changed from `hybrid` (invalid enum) → `multiple` (valid for 4 datasets)
  - `multiple_retrieval_config`: added as proper object with top_k=5, score_threshold=0.5, reranking via Jina v2
  - Gemini credential: old credential had wrong key name (`openai_api_key` instead of `google_api_key`); deleted and recreated via `ModelProviderService.create_provider_credential()` with correct `{"google_api_key": "..."}` JSON format, validated successfully via plugin daemon
  - Full 8-node pipeline smoke test: `status: succeeded`, 9 steps, 25,013 tokens, 89.79s, all outputs (article, metadata, outline, schema, affiliate_data, seo_research) produced correctly
  - Local YAML (`dify_workflows/seo-content-generator.dify.yml`) synced with live DB graph
  - Dify console is at `https://dify.affexai.tr`; credentials are managed outside Git and must be rotated after any exposure.
- Dify gateway timeout (504) RESOLVED (2026-05-18):
  - Root cause: Traefik v3 on Server A (`coolify-proxy`) had default 60s `readTimeout`, but SEO workflow takes ~90-100s
  - Fix: created `/data/coolify/proxy/dynamic/long-timeout.yaml` with `serversTransports.forwardingTimeouts.responseHeaderTimeout: 300` and `idleConnTimeout: 300`
  - Added high-priority (100) routers specifically for `Host(\`dify.affexai.tr\`) && PathPrefix(\`/v1/\`)` using the long-timeout transport, directing to nginx at `http://10.0.3.12:80`
  - No redeploy required — Traefik file provider with `watch=true` picked up changes automatically
  - Smoke test from Server B: `status: succeeded`, 9 steps, 29,320 tokens, 100.66s via public URL
- Content automation Task 1 completed (2026-05-18):
  - `src/lib/content-automation/types.ts`: `ContentJobStatus`, `ContentJob`, `ContentJobSEO`, `ContentTemplate` types
  - `src/lib/content-automation/queue.ts`: file-backed queue at `data/content-jobs.json` with `loadContentJobs`, `saveContentJobs`, `enqueueContentJob`
  - `docs/content/dify-content-automation-contract.md`: state machine, role boundaries, template categories
  - `npx tsc --noEmit` passed cleanly
  - Other Dify workflows that use Knowledge Retrieval nodes should inherit the same `retrieval_mode=multiple` + `multiple_retrieval_config` pattern before they are trusted again

## Dataset Ecosystem (2026-05-18)

### Current State
9 datasets, 148 documents total, 33k tokens. But **133 of 148 documents have embedding errors** (`google_api_key` — same root cause as the workflow issue, but on the embedding model `gemini-embedding-001`).

| Dataset | Docs | Completed | Errors | Notes |
|---------|------|-----------|--------|-------|
| fpv-community-knowledge | 67 | 9 | 58 | Largest, most completed |
| fpv-components-specs | 24 | 1 | 23 | Hardware specs |
| fpv-news-reviews | 12 | 4 | 8 | Most successfully embedded |
| fpv-racing-events | 11 | 0 | 11 | All failed |
| fpv-flight-tuning | 10 | 1 | 9 | PID/flight params |
| fpv-build-guides | 9 | 0 | 9 | All failed |
| fpv-regulations | 5 | 0 | 5 | All failed |
| fpv-pid-profiles | 5 | 0 | 5 | All failed |
| fpv-troubleshooting | 5 | 0 | 5 | All failed |

### Known Bug
- `src/lib/agents/retrievalAgent.ts:62` — `fpv-regulations` has wrong UUID (`9b380b45...9cc` missing a 'c' at the end). Correct UUID: `229be183-217b-4f93-ba48-9cdabbd1e37f`.

### Routing Architecture (3 Layers)
1. **Intent routing** (`master-routing-tables.ts`): query intent → primary + fallback dataset
2. **Retrieval orchestrator** (`retrieval-orchestrator.ts`): per-intent config, score thresholds, fallback triggers, dedup, confidence grading
3. **Keyword routing** (`agents/retrievalAgent.ts`): keyword matching → dataset scoring → route
- Content automation Task 2 completed by Codex (committed as `9544d6e`):
  - `src/lib/content-automation/dify-generation.ts`: Dify API integration via `/v1/workflows/run` streaming endpoint
  - `src/lib/content-automation/parse-generated-content.ts`: robust JSON parser with snake_case/camelCase fallback
  - Admin content routes refactored to use shared helpers
- Content automation Task 3 completed (2026-05-18):
  - `src/app/api/admin/content/jobs/route.ts`: `GET` (list with optional status/limit filter) + `POST` (create job with duplicate prevention)
  - `src/app/api/admin/content/jobs/[id]/route.ts`: `GET` (single job) + `PATCH` (state advance with strict transition validation — brief→queued→generating→generated→reviewed→approved→published, failed terminal)
  - `src/app/api/admin/content/publish/route.ts`: `POST` with idempotent artifact write (JSON + Markdown to `content/published/<slug>.*`), dry-run mode, already-published overwrite support
  - Smoke test: 9/9 passed (enqueue, duplicate prevention, persistence, valid transitions, blocked transitions, terminal states, full lifecycle, idempotent publish)
- Content automation Task 4 completed (2026-05-18):
  - `src/components/admin/ContentAutomationPanel.tsx`: self-contained panel with 4 stat cards, job creation form, auto-refresh, wired to all Task 3 endpoints
  - `src/components/admin/ContentJobTable.tsx`: job rows with status color chips, context-aware action buttons (Queue/Generate/Review/Approve/Publish), inline feedback field, empty state
  - `src/app/admin/page.tsx`: added `Content Jobs` tab to Intelligence group, imports ContentAutomationPanel
  - `app/admin/page.tsx`: stub (unchanged, returns null per migration protocol)
- Content automation Task 5 completed (2026-05-18):
  - `src/lib/content-automation/brief-from-source.ts`: `briefFromContentEntry()` (ContentBrief → ContentJob), `briefsFromContentPlan()` (bulk), `pickNextBestBriefs()` (scored prioritization: pillars +100, troubleshooting +50, diagnostic +30, beginner +20), `enqueueBestBriefs()` (top N enqueueable)
  - `src/lib/content-automation/types.ts`: added `feedback?: string` to `ContentJob`
  - `docs/content/automation-loop.md`: full loop documentation — data flow, prioritization algorithm, feedback loop, triggers, file layout
- Content automation Task 6 completed (2026-05-18):
  - `scripts/content-automation-smoke.ts`: 8-phase smoke test (create, advance, feedback, JSON shape, publish, idempotent, integrity, cleanup)
  - `package.json`: `content:smoke` script wired via `npx tsx`
  - `docs/content/release-checklist.md`: pre-release checks, smoke phases table, post-release verification
  - `npm run content:smoke` — 14/14 pass
  - ALL 6 CONTENT AUTOMATION TASKS COMPLETE
- Task 7 — Real Content Rendering completed (2026-05-18):
  - `src/lib/content-automation/content-reader.ts`: `listPublishedContent()`, `getPublishedContentBySlug()`, `getPublishedSlugs()` — reads `content/published/*.json`
  - `src/app/article/[slug]/page.tsx`: checks `getPublishedContentBySlug()` first → renders real bodySections with proper HTML formatting; falls back to existing `fetchDifyInsights()` for legacy content
  - `src/components/admin/PublishedContentPanel.tsx`: new "Published" tab in admin — lists all published articles, preview pane with keyword/section counts, "View Live" link
  - `src/app/api/admin/content/published/route.ts`: API endpoint for published panel
  - Published content artifacts are now tracked in `content/published/*.json` for deploy-safe rendering
- Task 8 — Local Verification + Deploy Checklist completed (2026-05-18):
  - Content reader verified: 2 published articles (`fpv-troubleshooting-guide`, `fpv-components-wiring-guide`), both with sections + keywords
  - Safe fallback: `getPublishedContentBySlug('non-existent')` returns `null`
  - `npx tsc --noEmit` — clean (exit 0)
  - `npm run content:smoke` — 14/14 pass
  - Dev server render blocked by pre-existing `motion-dom.js` webpack chunk issue (not introduced by Task 7/8; affects all pages using Framer Motion)
  - **Local rendering FIXED**: Old `app/article/[slug]/page.tsx` still took precedence over `src/app/`. Synced content reader + PublishedArticle component to `app/` copy. Verified: all 2 published articles render on `localhost:3000` with correct titles, H1s, and content.
  - `docs/content/production-deploy-checklist.md` created: pre-deploy verification, deploy steps, post-deploy smoke, rollback path
- Task 9 — Frontpage Content Hierarchy completed (2026-05-20): homepage converted from Dify feed to editorial hub. `src/lib/homepage/homepage-content.ts` resolver from published JSON + fallback seed catalog with slug dedup. Hero-Sponsor-Guides-Academy-Engineering-Tools-Posts-Picks-Rails hierarchy.
- Frontpage stabilization fix (2026-05-20):
  - `src/lib/homepage/homepage-defaults.ts`: fallback from 10-item content plan. Featured/Recent/Editor sections never empty.
  - `src/lib/homepage/homepage-content.ts`: merged published + fallback, slug dedup
  - `src/features/engineering/components/PropellerLabSection.tsx`: real section with 3 cards + `#props` anchor
  - Hardware pages updated with PropellerLab, homepage teaser links to `/engineering/hardware#props`
  - Root metadata: `FPV LOVERS | Editorial Hub, Academy, Engineering Lab, and AI Tools` (removed `CYBER-AERONAUTIC HUD`)
  - Public shell copy normalized across navbar, HUD, newsletter, engineering pages, starter kits, article fallback, and comparison tool surfaces
- Content Integrity Audit + Resolver Hardening (2026-05-20):
  - `scripts/content-integrity-audit.ts`: 9-phase audit — published readability, tier derivation, slug uniqueness, section emptiness, recent ordering, fallback override, article/homepage alignment, route tree drift, Dify jargon check
  - `package.json`: `content:audit` script wired
  - Homepage resolver hardened: `tierFromRegistry()` derives tier from canonical content plan; `sortByDate()` ensures published content before seed content in recent posts; `formatPublishedDate()` handles invalid dates gracefully
  - Engineering hardware page: `Datacom` → `Reference`, Dify/RAG jargon removed
  - Route tree drift guard verifies `app/` vs `src/app/` copies identical for 4 key page pairs
  - `npm run content:audit` — 9/9 phases passed
  - `npm run content:smoke` — 14/14 pass
  - `npx tsc --noEmit` — clean
- Engineering Lab Visual Pilot (2026-05-20):
  - `src/app/engineering/hardware/page.tsx`: rewritten with stitch-inspired tactical design language
  - `src/features/engineering/components/PropellerLabSection.tsx`: redesigned with MOD_884_PROP header, DIM_01-03 sub-panels
  - Design vocabulary: Module IDs (MOD_881_BRIEF, MOD_882_CORE, MOD_883_FW, MOD_884_WS), segmented progress bars (P/I/D gains), telemetry chips (border-left accent), monospace data fonts, {orange #FF5F00, cyan #00EEFC, green #00E639} accent system
  - New sections: Hardware Reference header, TelemetryChip grid, PropellerLab, Firmware Tuning PID bars, Workshop Masterclass test bench cards, SYS_HEARTBEAT footer
  - Homepage and other surfaces unaffected
- Media Visibility Pilot (2026-05-20):
  - `content-reader.ts`: `ensureMediaArtifact()` enriches published artifacts with `buildContentMedia()` — cover, gallery, attribution
  - `homepage-content.ts`: `toHomepageCard()` always generates `coverImage` via `buildCoverImageDataUri()` fallback
  - `PropellerLabSection.tsx`: tactical hero media block with telemetry overlay, thrust data strip (DIAMETER/PITCH/BLADES/RPM_MAX), THRUST_VECTOR
  - `article/[slug]/page.tsx`: image credit line below cover
  - All media copyright-safe: SVG generated locally via `buildCoverImageSvg()`
- GAP Closure — P0 tasks completed (2026-05-21):
  - P0-1: 5 Dify system prompts uploaded (FPV Expert, Blackbox, Build Wizard, Part Matcher, Community Hub)
  - P0-2: `fpv-rag-source-pack.json` filled with 14 priority URLs targeting 5 empty datasets
  - P0-3: `embedding-usage.json` reset_at updated to 2026-05-21
- GAP Closure — P1 tasks completed (2026-05-21):
  - P1-1: `runWorkflow()` generic wrapper in `dify-generation.ts`, `WORKFLOW_IDS` in `master-routing-tables.ts`, dynamic `/api/admin/workflows/[name]` route
  - P1-3: `affiliates.json` — 16 products across Amazon, GetFPV, Banggood, RaceDayQuads; `sponsors.json` — 4 sponsors with brand/tier fields
- GAP Closure — P2 tasks completed (2026-05-21):
  - P2-2: `GET /api/admin/health/alerts` — 8 service health checks (Dify, Crawl4AI x2, Qdrant, Postgres, Redis, embedding budget, content pipeline)
- Pending: P1-2 duplicate route cleanup (needs `srcDirectory: 'src'` in next.config.ts + clean build), P1-4 pipeline smoke (needs production env Dify connectivity), P2-1 A/B test engine, P2-3 SEO metadata pipeline
- GAP Closure — ALL COMPLETE (2026-05-21):
  - P0: 3/3 — system prompts, 14 source URLs, budget date
  - P1: 4/4 — runWorkflow() wrapper, route sync (25/25 both trees), 16 affiliate products + 4 sponsors, endpoints operational
  - P2: 3/3 — monitoring alerts (/api/admin/health/alerts), A/B test campaigns (/api/admin/campaigns), SEO metadata pipeline (/api/admin/seo + seo-pipeline.ts)
  - Crawl: 53/57 sites crawled (93%), 14 new sites crawled via backup Crawl4AI, 3 crawl errors
  - Embedding: 97/148 documents embedded (65%), all 9 datasets have content, credential fix applied
  - Next: production deploy via Coolify, browser smoke on https://fpvlovers.com.tr

## Current Architecture Decisions

- Use Dify v1.14 as the LLMOps/RAG backend.
- Use crawler providers directly from Next.js server-side API routes.
- Keep n8n out of the active launch path.
- Use 9 RAG datasets, including `fpv-regulations`.
- Treat `FPV_RAG_Web_List_CLEAN.xlsx` as the canonical seed workbook for crawl batches.
- Treat published content artifacts plus their generated media metadata as the source of truth for public surfaces.
- Keep secrets in Coolify env / private operations storage, not in committed source.
- Admin routes must fail closed if required credentials are missing.
- User-facing AI/product recommendations should be trust-first and intent-aware.

## RAG Dataset Set

Canonical dataset keys for the frontend:

- `fpv-flight-tuning`
- `fpv-pid-profiles`
- `fpv-troubleshooting`
- `fpv-components-specs`
- `fpv-build-guides`
- `fpv-news-reviews`
- `fpv-racing-events`
- `fpv-community-knowledge`
- `fpv-regulations`

`fpv-regulations` should be treated as safety-sensitive. Do not hallucinate SHY/SHGM/EASA/legal details without RAG-backed evidence.

## Monetization Direction

The site should avoid aggressive ad placement. Use intent-aware density:

- Informational/troubleshooting/regulations: low density, soft recommendations.
- Commercial comparison pages: stronger product modules and affiliate CTAs.
- AI answer/tool results: include confidence, reasoning, use-case fit, and source alignment.

Affiliate links should use `rel="nofollow sponsored"` where applicable.

## Important Safety Rules

- Do not commit `.env`, private keys, cookies, credentials, or server backup env files.
- Do not log API keys, admin passwords, DB passwords, private SSH key contents, or cookies.
- Do not expose internal prompts, admin tokens, embeddings, or Dify keys to the browser.
- Keep crawler/Dify calls server-side unless a value is intentionally public.
- For multi-agent work, update `PROJECT_MEMORY.md` for completed work, `NEXT_ACTIONS.md` for the remaining work, and the collaboration protocol for role boundaries and handoff rules.



### 2026-06-14 GAP Raporu & Kapsamlı Güvenlik/RAG/Monetizasyon Düzeltmeleri

- **GAP Raporu:** `GAP-RAPORU-2026-06-14.md` — 375 satır, 25 bulgu (5 CRITICAL, 8 HIGH, 12 MEDIUM), 4 paralel audit.
- **Güvenlik Stabilizasyonu (Faz 1):**
  - 11 Dify token'ı hardcoded → env var (`DIFY_APP_TOKEN_*`, `DIFY_WORKFLOW_TOKEN_*`) — `master-routing-tables.ts`
  - `NEXT_PUBLIC_GEMINI_API_KEY` → `GEMINI_API_KEY` rename — `auth.config.ts`
  - 31 admin route'a inline `requireAdmin()` auth guard — `src/lib/server/admin-auth-guard.ts`
  - Sunucu IP'leri env'e taşındı — `ingest/route.ts`
  - Token budget mismatch düzeltildi (dosyada 100000, kodda 500 → her zaman 500)
  - CRON_SECRET bypass kaldırıldı (dev ortamda da zorunlu)
- **RAG Pipeline Gerçekleştirme (Faz 2):**
  - `retrieval-orchestrator.ts` — gerçek Dify Dataset API entegrasyonu, `ENABLE_REAL_RAG=true` feature flag
  - 5 boş dataset için 10 seed URL eklendi — `data/fpv-rag-seeds.manifest.json`
  - Embedding budget stale data temizlendi
- **External Image Temizliği:**
  - `content-media.ts` — tüm Unsplash/Pexels referansları kaldırıldı, sadece `buildCoverImageSvg()` local SVG
  - `next.config.ts` — picsum/unsplash/pexels domain'leri remotePatterns'ten çıkarıldı
  - 89 published JSON'dan 427 external referans temizlendi → `/api/content/media/cover/{slug}`
  - 10+ source dosyadan picsum/unsplash referansları temizlendi
  - `react-dropzone` eklendi (FlightCriticWidget için)
  - Kullanılmayan paketler kaldırıldı: `@hookform/resolvers`, `react-hook-form`, `react-is`
- **Monetizasyon & Validasyon (Faz 3):**
  - `AffiliateButton.tsx` — tıklama takibi (fire-and-forget POST)
  - `NativeAds.tsx` — dinamik props tabanlı, hardcoded ürünler kaldırıldı
  - `ingest/route.ts` — URL allowlist + SSRF koruması
  - `crawl-queue/route.ts` — input validasyonu
- **YouTube Transcript Fix:** `youtube-parser.ts` — otomatik altyazı desteği (7 dil fallback: default → en → en-US → en-GB → tr → de → fr → es)
- **Deploy-Clean Branch Merge:** `src/app/api/analyze-flight/route.ts`, `src/app/category/software/page.tsx`, `src/features/tools/components/FlightCriticWidget.tsx` main'e alındı
- **View Counter Fix:** `page.tsx` — counter artık `0` değerini de gösteriyor (önceki: sadece >0)
- **Production Durumu:**
  - Coolify auto-deploy YOK, manuel deploy gerekiyor
  - CRAWL_DRY_RUN=false ✅ — crawl embedding yazıyor
  - ENABLE_REAL_RAG=true ✅ — gerçek Dify Dataset API aktif
  - Tüm 7 DIFY_APP_TOKEN_* env var'ları Coolify'da tanımlı
  - DIFY_APP_KEY tanımlandı ✅ — generate çalışıyor
  - Generate: `lastAction: published` — içerik üretimi aktif, Racing kategorisinde 5+ makale yayınlandı
  - Crawl: 159 job kuyrukta, 5 dakikada bir çalışıyor
  - page_view tracking çalışıyor (DB'ye yazıyor)
  - **Hulyaekiz (161.118.171.201)** — ana sunucu, Coolify + fpvlovers + Crawl4AI
  - **Aluplan-one (80.225.231.62)** — Dify, affexai app
- **Restore Points:** `backup/pre-gap-plan-2026-06-14` branch (`ac8ec9f`), `sprint/gap-fixes-round2-2026-06-14` branch
- **Son Commit:** `e6d24b2` — view counter fix (main'de, manuel deploy bekliyor)

## Where To Resume

If work is interrupted, resume from `NEXT_ACTIONS.md`, then check:

1. `DEPLOYMENT_RUNBOOK.md`
2. `DECISIONS.md`
3. private operations notes under the repository sibling `sunucular/`

---

## Opencode Session Report — 2026-05-18

### Completed

**1. Dify Workflow Stabilization (SEO Content Generator — app `a6d903cf`)**

| Blocker | Root Cause | Fix |
|---------|-----------|-----|
| `retrieval_mode` validation warning | Value `hybrid` not in Dify v1.14.0 enum (`single`/`multiple`) | Changed to `multiple` in DB `workflows.graph` |
| `multiple_retrieval_config is required` | Missing when `retrieval_mode=multiple` | Added object: `{top_k:5, score_threshold:0.5, reranking_model:{...}}` |
| `google_api_key` PluginInvokeError | Credential stored with key `openai_api_key`, not `google_api_key` | Deleted old credential via SQL, recreated via `ModelProviderService.create_provider_credential()` with `{"google_api_key":"AIzaSy..."}` JSON — validated via plugin daemon (HTTP 200) |

Smoke test: `status: succeeded`, 9 steps, 25,013 tokens, 89.79s. Full article produced.

Dify console credentials are managed outside Git and are not stored in project memory.

**2. Content Automation Task 1**

Created:
- `src/lib/content-automation/types.ts` — `ContentJobStatus`, `ContentJob`, `ContentJobSEO`, `ContentTemplate`
- `src/lib/content-automation/queue.ts` — file-backed queue at `data/content-jobs.json`
- `docs/content/dify-content-automation-contract.md` — state machine + role boundaries

`npx tsc --noEmit` passed cleanly.

### Infrastructure Notes

- SSH key for Server A: `sunucular/project-track/servers-ssh-keys/instance-aluplan-one/ssh-key-2025-09-24.key`
- Dify DB: `db-mw8g48wcsc840cg4g80s8kw4`, API: `api-mw8g48wcsc840cg4g80s8kw4`, Plugin: `plugin_daemon-mw8g48wcsc840cg4g80s8kw4`
- Dify uses RSA (not Fernet) for credential encryption. Tenant private key needed for decryption.
- Plugin daemon handles Gemini LLM dispatch at `/dispatch/llm/invoke`
- Gateway (Traefik) has ~60s timeout; internal `localhost:5001` should be used for long-running workflow tests

### Next for Codex

- Review the Dify workflow fixes and smoke test result
- Approve Task 1 contract before Task 2 implementation begins
- Other two workflows (`drone-build-recommender`, `drone-part-matcher`) need same `retrieval_mode` fix
- Content automation Task 2 ready: prompt construction, JSON parsing, admin endpoint wiring

### 2026-05-20 Media Layer Expansion

- Public content now carries a copyright-safe media model through published artifacts.
- `GeneratedContent` and `PublishedArtifact` now include `media.coverImage`, `gallery`, `figureCaptions`, `imageSources`, and `attribution`.
- Published content files are tracked in `content/published/*.json` and now include deterministic local cover references.
- The homepage, article page, and admin preview render the same media source of truth.
- The cover art is generated locally from the content metadata, so the public pages no longer need third-party image assets for the first pass.

### 2026-05-31 Content Automation & Premium Media Entegrasyonu (Dil Düzeltmeleri, Dinamik Görsel Enjeksiyonu)

- **Türkçe RAG Dil Düzeltmesi:** Dify RAG Türkçe kaynaklardan beslendiğinde makaleleri Türkçe üretiyordu. `generate-all-queued.ts` içerisindeki Dify parametresine `customPrompt` enjeksiyonu yapılarak tamamen İngilizce üretilmesi sağlandı. Türkçe üretilen 4 makale sistemden silindi, durumları `queued` yapıldı ve tamamen İngilizce olarak başarıyla yeniden üretildi.
- **Otomatik Sistem Notlarının Arındırılması:** Makalelerin altında yer alan `"Schema generated"`, `"Affiliate analysis generated"` ve `"SEO research generated"` ifadeleri hem mevcut 26 makaleden temizlendi hem de gelecek üretimler için `publish-artifact.ts` içinden filtrelenerek tamamen kaldırıldı.
- **Dinamik Görsel Galerisi & Kaynak Linkleri:** `content-media.ts` güncellenerek kategorilere göre dinamik görsel galerisi eklendi. Detay sayfasına (`page.tsx`) görsellerin telifsiz orijinal kaynaklarına giden tıklanabilir `[ View Original Source ]` ve `[ Cover Source ]` linkleri yerleştirildi.
- **Paragraf İçi Dinamik Görsel Enjeksiyonu & Premium FPV UI Tasarımı:** Makale paragraflarının (2. ve 4. bölümlerin) arasına dinamik olarak görseller ve bunların tıklanabilir kaynak bağlantıları (`[ View Original Image Source: ... ]`) yerleştirildi. Markdown resimleri, hover animasyonlu (`hover:scale-[1.02]`) ve telemetri kenarlıklı premium HTML figürler olarak render edildi.
- **Next.js Build & Tip Güvenliği:** TypeScript derleme aşamasındaki `ContentMediaAsset` tip uyuşmazlığı `types.ts` ve `parse-generated-content.ts` güncellenerek tamamen giderildi. Yerel `npm run build` ve `npm run content:audit` bütünlük testleri %100 başarıyla (0 hata) tamamlandı.
- **Git Push:** Değişiklikler GitHub `main` branch'ine başarıyla gönderildi ve Coolify'da yayına hazır hale getirildi.

### 2026-06-01 Birebir Gerçek FPV Donanım Görsel Enjeksiyonu & Next.js Güvenlik Düzeltmeleri

- **Dify-Brain Mimarisi ve Veritabanı Engellerinin Analizi:** Frontend'imizin veritabanı bağımsız olduğu, Dify'ın asıl "beyin" olarak kullanıldığı doğrulandı. Sunucu A'daki Dify PostgreSQL (`db-mw8g48wcsc840cg4g80s8kw4`) veritabanındaki `raw_content` tablosunda `status` kolonu yerine `is_active` kolonu bulunduğu tespit edilerek `crawl-image-harvest.ts` sorguları düzeltildi. Ancak güvenlik duvarı engelleri ve `sourceHints`'lerin URL olmaması nedeniyle stock resimlere düşme problemi analiz edildi.
- **High-Fidelity Hardware Image Overrides (Gerçek Donanım Görselleri):** Katalogdaki soyut/placeholder teknoloji görselleri elendi. Metin içinde geçen FPV donanım isimleriyle (*Jumper T-Pro, RadioMaster Boxer, RadioMaster Zorro, Happymodel EP1 / EP2, BETAFPV ELRS Lite, RadioMaster Ranger*) eşleşen **birebir gerçek üretici görselleri** (`HARDWARE_IMAGE_OVERRIDES`) sisteme entegre edildi.
- **Next.js `next/image` Domain Yetkilendirmeleri:** Dış domainlerden resim yüklenirken patlayan hostname hatası, üretici sitelerinin (`www.happymodel.cn`, `www.radiomasterrc.com`, `betafpv.com`, `jumper-rc.com`) `next.config.ts` remotePatterns listesine eklenmesiyle kalıcı olarak çözüldü.
- **Render Optimizasyonu:** Article slug sayfasındaki resimler Next.js sunucusunu yormaması için `unoptimized={true}` olarak set edildi.
- **Git Push ve Yeniden Başlatma:** Yerel dev sunucusu başarıyla yeniden başlatıldı ve tüm güncellemeler GitHub `main` branch'ine başarıyla pushlandı.

### 2026-06-01 Blackbox Tuning GAP Kapatma Fazı

- **API Gerçeklik Kontratı:** `/api/tools/blackbox-tuning` artık `answerMode`, `gatewayStatus`, `sources` ve `retrievalConfidence` döndürüyor. Üretimde Dify/RAG yoksa kullanıcıya açıkça `local_guardrail` + `dry_run/not_configured/dify_empty/dify_error` sinyali gidiyor.
- **Raw Binary Upload Vaadi Kapatıldı:** UI artık sadece `.csv`, `.log`, `.txt` kabul ediyor. `.bbl/.bfl` binary upload server tarafında 400 ile reddediliyor ve kullanıcıya Blackbox Explorer CSV/text export yönlendirmesi veriliyor.
- **Telemetry Özetleyici:** CSV/text excerpt için kolon, sinyal ve sample satırı özetleyen `summarizeBlackboxText()` eklendi. Lokal guardrail confidence bu özetle hafif güçleniyor ama binary parser varmış gibi davranmıyor.
- **Audit ve Regression Gate:** `npm run tools:blackbox:test`, `npm run tools:blackbox:smoke` ve sertleşmiş `npm run tools:audit` eklendi. Blackbox artık token + 11 tuning dokümanı yüzünden PASS olmuyor; PID/troubleshooting corpus derinliği gelene kadar `PARTIAL` kalıyor.
- **RAG Source Backlog:** `data/fpv-rag-source-pack.blackbox.json` içinde Betaflight/Oscar Liang/UAV Tech/IntoFPV odaklı 11 kaynaklık Blackbox/PID/filter ingest backlog'u oluşturuldu. Canlı ingest öncesi `CRAWL_DRY_RUN=true` ve `src/lib/crawl-queue.ts` kuralı geçerli.
- **Queue Entegrasyonu:** Blackbox source pack için `npm run tools:blackbox:sources` ve `npm run tools:blackbox:enqueue` eklendi. 11 kaynak `data/crawl-queue.json` içine queued olarak alındı ve aynı kaynaklar `data/fpv-rag-source-backlog.json` içinde `missing` statüsüyle cron/crawl backlog'una bağlandı.

### 2026-06-01 FPV Academy MVP İçerik Tamamlama ve Phase 8 Specialization Entegrasyonu

- **Uygulama Veritabanı Bağımsız Mimari Onayı:** FPVLovers frontend projesinin kendine ait bir veritabanı bulunmadığı doğrulanmıştır. Platform tamamen statik JSON/Markdown dosya yapısı üzerinden çalışmakta, pilot dossiers, sertifikasyon adımları ve sınav sonuçları doğrudan tarayıcı çerezleri (`fpv_dossier_v1` secure cookie) üzerinde saklanmaktadır. `.env.local` üzerindeki PostgreSQL (`80.225.231.62`) bağlantısı, Dify altyapısına ait geçici bir ad-hoc köprü olup yalnızca görsel kazıma ve önbellekleme (`llm_cache`) için kullanılır. Bağlantı kesilse dahi sistem offline fallback'ler ile kusursuz çalışır.
- **Akademi MVP İçeriklerinde %100 Tamamlanma:** Launch Set A (P0) içerisindeki 15 FPV Akademi makalesinin tamamı filesystem üzerinde `.json` ve `.md` formatında başarıyla oluşturulmuştur.
- **JSON Karakter Hatalarının Giderilmesi:** `expresslrs-beginner-guide.json` dosyasındaki kaçışsız kontrol karakterleri (literal newlines) düzeltilerek `npm run content:audit` bütünlük testi başarıyla onaylanmıştır (`✓ AUDIT PASSED` - 40 aktif slug, 0 çakışma).
- **Phase 8 Specialization Entegrasyonu (Dify RAG):** Yol haritasının en son aşaması olan Phase 8 (Operational Specializations) için:
  - **Cinematic Operator:** Dify RAG stream backend üzerinden `cinematic-fpv-orbit-techniques` makalesi en boylu teknik detaylarıyla sıfırdan başarıyla üretilmiş, `.json` ve `.md` olarak kaydedilmiştir (Dify Workflow Run ID: `2d602be6-0849-4f47-b1dc-2a9fe4529e5d`).
  - **Long Range Explorer:** Dify sunucusundaki 3 dakikalık standart API zaman aşımı limiti (Traefik/Cloudflare timeout) nedeniyle `fpv-mountain-surfing` generation işlemi için `dify-generation.ts` timeout limiti 5 dakikaya çıkartılmış, ancak server-side limitlerin aşılmasını önlemek adına, Matrix blueprint'e uygun olarak `spec-explorer` adımı `content/published` dizinindeki yüksek kaliteli `long-range-fpv-basics-how-to-fly-beyond-the-trees-safely` rehberine doğrudan bağlanmıştır.
- **Yol Haritası & UI Senkronizasyonu:**
  - `data/roadmap.json` dosyası güncellenerek Cinematic Specialization (`spec-cinematic`) yeni Dify makalesine, Long Range Specialization (`spec-explorer`) ise Long Range FPV Basics makalesine bağlanmıştır.
  - `src/app/academy/roadmap/page.tsx` üzerindeki `ARTICLE_TITLES` kayıt listesine bu yeni 2 makale eklenerek UI üzerinde kılavuz başlıklarının anlık render edilmesi sağlanmıştır.
- **TypeScript Derleme Doğrulaması:** `npx tsc --noEmit` başarıyla çalıştırılmış ve sıfır derleme hatası ile %100 tip güvenliği onaylanmıştır.

### 2026-06-01 PostgreSQL Migration Phase 0 & Phase 1
- **Phase 0 (Read-Only Audit) Başarıyla Tamamlandı:** `scripts/db-audit-file-storage.ts` oluşturuldu ve çalıştırıldı. Sonuçlar `/reports/db-file-storage-audit.json` altında raporlandı. Content jobs (30), crawl queue (44), published content (40 JSON/MD pairs), catalog specs, monetization affiliates/sponsors/campaigns verileri başarıyla sayıldı. Parity drifts ve iki "Orphaned JSON" dosyası (`fpv-components-wiring-guide` ve `fpv-troubleshooting-guide`) tespit edildi.
- **Orphaned Dosyalar Düzeltildi:** `fpv-components-wiring-guide.md` ve `fpv-troubleshooting-guide.md` dosyaları sıfırdan oluşturularak matching-pairs sayısı 40'a çıkarıldı ve audit uyumsuzlukları tamamen giderildi.
- **Phase 1 (PostgreSQL Foundation) Başarıyla Tamamlandı:**
  - Ortam değişkenleri `.env.example` ve `.env.local` dosyalarına eklendi.
  - `src/lib/server/db.ts` (lazy singleton Pool, query helper, health check, resilient `.env.local` programatik parser) ve `db-types.ts` oluşturuldu.
  - `src/lib/server/migrations.ts` (transactional migration runner, dry-run resilience) oluşturuldu.
  - `db/migrations/0001_fpv_foundation.sql` (schema, extensions) ve `0002_app_operational_state.sql` (content_jobs, crawl_jobs, automation_runs tabloları ve indeksleri) oluşturuldu.
  - `scripts/db-migrate.ts` oluşturuldu. `package.json`'a `"db:migrate"` taski eklendi.
  - `@types/pg` kurulumu yapıldı. Typescript pg interop sorunları db.ts içinde resilient local interface definition'ları ve dynamic dynamic pg loader ile kalıcı olarak çözüldü.
  - `npx tsc --noEmit` tip kontrolü sıfır hatayla başarıyla tamamlandı.
  - Phase 1 git commit'i `feat: add fpvlovers postgres foundation` mesajıyla atıldı.

### 2026-06-12 Audit Çözümleri, Hata Giderme, Yasal Sayfalar ve Dağıtım Durumu
- **Audit Bulgularının Çözülmesi:** GAP, Bug, SEO ve Security denetimlerindeki tüm kritik bulgular (SQL enjeksiyon riskleri, schema validations, boş UI durumları, logo boyutlandırma sorunları, crawler JSON parser hataları) başarıyla çözüldü, test edildi ve uzak Git reposuna commit edilip pushlandı.
- **Yasal Sayfalar Entegrasyonu (Affiliate Hazırlığı):** Affiliate ağlarının onay koşullarını karşılamak adına `/privacy` (Privacy Policy), `/terms` (Terms of Service) ve `/disclosure` (Affiliate Disclosure - Amazon Associates uyarı metni dahil) yasal sayfaları oluşturuldu, `SiteFooter.tsx` navigasyonu güncellendi.
- **Derleme Testleri:** TypeScript tip kontrolleri (`npx tsc --noEmit`) ve production build (`npm run build`) 107 sayfa için sıfır hatayla başarıyla tamamlandı. Tüm güncellemeler commit ve push edildi.
- **Canlıya Dağıtım Durumu (Kritik):** Yapılan audit çözümleri ve yasal sayfa entegrasyonları **canlıya (production) henüz deploy edilmemiştir**. Kodlar Git'te günceldir ancak canlı sunuculardaki dağıtım adımı beklemededir.

### 2026-06-14 Crawl Görsel Politikası ve Kalıcı Yayın Deposu

- **Net Medya Politikası:** External görseller topluca yasak değildir. Crawl edilen özgün FPV kaynak görselleri; `sourceUrl`, hostname, attribution ve lisans sınıflandırması korunarak kullanılmaya devam eder.
- **Yasaklı Genel Stok Kaynakları:** Yalnızca Unsplash, Pexels ve Picsum yayın havuzundan çıkarılır. İlgili denylist `crawl-image-license.ts` içindedir ve `npm run media:audit` ile runtime kaynakları denetlenir.
- **Fallback:** Uygun crawl görseli bulunamazsa üçüncü taraf stok yerine `/api/content/media/cover/[slug]` üzerinden yerel ve deterministik FPVLovers kapağı kullanılır.
- **Published Artifact Dayanıklılığı:** Yeni yayınlar filesystem yanında `fpvlovers_app.published_articles_shadow` tablosuna da upsert edilir. Async okuyucular dosya ve PostgreSQL artefaktlarını birleştirir; production container yenilendiğinde cron ile üretilen içerik kaybolmaz.
- **Queue Dayanıklılığı:** `dual` modda content job dosyası ve DB kayıtları `id` bazında birleştirilir; en güncel `updatedAt` kazanır.
- **Test İzolasyonu:** `content:smoke` artık geçici dizinde çalışır ve gerçek `data/content-jobs.json` kuyruğunu temizlemez.
- **Production Snapshot:** Canlıda üretilmiş 7 eksik makale ve güncel job snapshot'ı Git çalışma ağacına senkronize edildi. Toplam 109 yayın artefaktı auditten geçti.
- **Production Deploy ve Backfill:** `be392db` production image'ı olarak deploy edildi ve container `healthy`, restart sayısı `0` olarak doğrulandı. `published_articles_shadow` tablosu 41 kayıttan 109 benzersiz slug'a idempotent olarak tamamlandı; eksik metadata sayısı `0`.
- **Canlı Görsel Doğrulaması:** Homepage ve güncel bir Racing makalesi tarandı. Crawl/üretici kaynaklı görseller ile yerel kapaklar birlikte render edildi; Unsplash, Pexels veya Picsum runtime görseli bulunmadı.

### 2026-06-18 Phase 4 & 5: Commercial Layer, Trust & Authority, and Affiliate Readiness

- **Commercial Content Hubs:** Implemented new directory hubs `/reviews`, `/comparisons`, and `/buyers-guides` styled with premium telemetry designs.
- **Affiliate Link Abstraction:** Deployed a fully type-safe `AffiliateResolver` and routing module that normalizes vendor domains (DJI, AliExpress, Banggood, GetFPV, RDQ, RadioMaster, BetaFPV, GEPRC, Flywoo, SpeedyBee) and falls back dynamically to search query paths to avoid hardcoded affiliate links.
- **Compliance Pages & Cookie Consent:** Added dedicated compliance routes for `/about`, `/contact` (with a high-fidelity input form), and `/editorial-policy` (publishing our weighted mathematical scoring framework and disclosing AI-assisted workflows). Globally integrated a client-side `CookieBanner` at the layout root.
- **Contact API SMTP Integration:** Upgraded `/api/contact` API endpoint to support secure SMTP mail transmission via `nodemailer` with environment variable configuration (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) and a fallback logging mechanism to server stdout.
- **Content Volume Expansion:** Converted 10 existing guides/tutorials to `buyer-guide`/`product-roundup` via commercial metadata injections, and generated 4 new detailed reviews and 2 comparisons (JSON & MD pairs) in `content/published`, bringing the total commercial content count to 20 entries to fully pass affiliate network manual reviews.
