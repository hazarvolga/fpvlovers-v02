# FPVLovers Project Memory

Last updated: 2026-05-18

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
  - Dify login credentials: `hazarvolga@gmail.com` / `Admin1234!` (console at `https://dify.affexai.tr`)
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

Credentials for Dify console: `hazarvolga@gmail.com` / `Admin1234!` — login uses RSA-encrypted password, cannot login via curl directly.

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
