# FPVLovers Next Actions

Last updated: 2026-08-02

## Current Priority After 2026-08-02 Comprehensive Audit + Image Persistence Root Cause

1. **DONE - Comprehensive 9-axis product audit:** `docs/gap-reports/2026-08-02-comprehensive-product-gap-report.md` covers GAP/BUG/UX/UI/mobile/SEO/GEO/security/performance with beginner-persona journey walkthroughs. 28 findings, all CRITICAL/HIGH and code-fixable MEDIUM/LOW items closed the same session (see items 2-3 below); thin-content, glossary depth, and 26-article metadata gaps remain editorial/Dify work, not code.
2. **DONE - Security/API hardening (commit `9bc50df`):** `rehype-sanitize` now sanitizes `rehypeRaw` output in `MarkdownRenderer` (article bodies can carry crawled/LLM raw HTML); `/api/pilot/register` gained zod validation, an 8-char password minimum, and rate-limiting; `/api/contact`, `/api/newsletter/subscribe`, `/api/analytics/event` are now rate-limited; raw `error.message` no longer leaks on 500s; PII console.log removed from the contact route.
3. **DONE - Mobile nav, SEO/GEO, search relevance (commit `3a75071`):** fixed the navbar logo overflow that was intercepting taps on the hamburger/search at 375px; removed `SearchSection` (always rendered behind the fixed navbar at every breakpoint, never visible); raised touch targets to 44px; added Organization/WebSite + BreadcrumbList JSON-LD sitewide; rewrote search from substring match to per-word AND-matching with field-weighted relevance; fixed WCAG contrast failures; de-emphasized the homepage editorial-trust section into one compact disclosure line per product decision (no affiliate program applied to yet).
4. **DONE - Lockfile fix (commit `887907d`):** Coolify's `npm ci` failed because `package-lock.json` (git-tracked, what the Docker build actually uses) was never updated when `rehype-sanitize` was added via `pnpm add` (`pnpm-lock.yaml` is gitignored, npm never reads it — **there is no `npm` binary in this dev environment**, only `pnpm`, so any future dependency change must have `package-lock.json` updated by hand against real npm registry data, or from a machine that has npm). Deploy succeeded after the fix: Coolify deployment finished healthy at 2026-08-02T08:30:29Z on commit `887907d`.
5. **DONE - Persist `public/images/source-cache/` across deploys.** Root cause: `backfill-images/route.ts` and `publish-artifact.ts` write harvested images to `public/images/source-cache/` on the container's own disk; `docker inspect` showed `Mounts: []`, no persistent volume, so every redeploy wiped newly-harvested real photos (89 phantom DB references confirmed, `/api/images/source-cache/...` pointing at files that existed nowhere). **Layer 1 fix:** user added a Coolify persistent volume (Source `/data/coolify/applications/r0c44ok0cskc800gs0c8o8wk/source-cache`, Destination `/app/public/images/source-cache`) and redeployed; `docker inspect` confirmed the bind mount was live. **Layer 2 (found immediately after):** the freshly-created host directory was `root:root` 0755, the app runs as `nextjs` uid 1001/gid 65533, so every `fs.writeFileSync` into it failed with `EACCES` — and the route silently fell back to hotlinking the external URL while still reporting `status: 'updated'`, so the first post-volume Backfill Images run claimed "87 updated" while writing zero files (same symptom, new cause). Fixed with `chown -R 1001:65533` + `chmod -R 755` on the host directory (verified with an actual `touch` as uid 1001 before declaring it fixed). **Also fixed in code (commit `85e797e`):** `backfill-images/route.ts` now reports a distinct `updated_hotlink_fallback` status with a logged reason instead of silently degrading to `'updated'`, and `PublishedContentPanel` renders that case as a separate amber-warning line. **Verified end-to-end after re-running Backfill Images:** container-side `ls /app/public/images/source-cache | wc -l` = 87, host-side `find .../source-cache -type f | wc -l` = 87 (counts match → persistent), and a live `curl` against `https://fpvlovers.com.tr/api/images/source-cache/acro-stick-control-drills-for-fpv-beginners-cover-1-5fad8bf2.png` returned `HTTP 200, 32943 bytes, image/png`. Do not treat a future backfill "N updated" summary as proof of local caching without independently checking file existence and the `updated` vs `updated_hotlink_fallback` split — the DB/UI claiming success was wrong twice in the same day for two different underlying reasons.
6. **NEXT (lower priority) - Admin panel "Pilot Registry" and usage chart are 100% hardcoded demo data:** `src/app/admin/page.tsx` — `subscribersData` (`alex@example.com` etc.) and `usageVsGrowthData` are static const arrays, never wired to the database. Real counts as of 2026-08-02: `fpvlovers_app.users`=1 (the owner's own admin account), `newsletter_subscribers`=2, `pilot_progress`=0. `affiliateData` in the same file is defined but unused (dead code). Wire the Pilot Registry table to real `newsletter_subscribers` rows and the usage chart to a real metric (or remove it) before treating admin-panel numbers as reportable.
7. **DEFERRED (S3):** longer-term, move harvested images to S3-compatible object storage instead of container-local disk (Coolify already has an S3 Storages feature, not yet connected) — the persistent-volume fix above is the immediate, code-free stopgap for this single-server deployment; revisit S3 if the deployment ever goes multi-instance.

## Current Priority After 2026-07-23 Score-Closure Phase

0. **DONE - Source-cache media hardening:** `npm run media:source-cache` now caches source-backed commercial/recent images into `public/images/source-cache/` and preserves provenance on the article artifact. `npm run media:audit` now blocks commercial hotlinked external media, generated commercial covers, and missing source-cache files. Current evidence: `32/32` commercial covers are local source-cache assets, `0` commercial external hotlinks remain in JSON, and the homepage should no longer collapse commercial cards into repeated category fallback art after deploy.
0. **DONE - Homepage media repair:** homepage/latest now shows 12 recent cards, uses brighter non-grayscale visuals, avoids repeating Latest cards in Featured Guides, and `ResilientCoverImage` falls back after 1.8s when an external source image hangs or fails. `npm run media:backfill-catalog` backfilled 21 commercial/gear artifacts with source-backed catalog media, while product reviews and news/racing articles stayed excluded to protect evidence boundaries. `npm run media:audit` now fails recent/commercial generated or empty media; local Browser QA confirmed `22/22` homepage images loaded and no visible broken image boxes on `localhost:3015`.
1. **DONE - Production shadow parity:** nine production-only artifacts were exported from the live container into `content/published`. `npm run content:audit` reports **133** published artifacts, and `npm run production:shadow-parity` reports **133 local / 133 live / 0 live-only / 0 local-only**.
2. **DONE - Four-per-day capacity gate:** `npm run automation:backlog-audit` reports **94 planned briefs**, **69 available briefs**, and **56 projected publications over 14 days** with the current eight daily cron windows. This proves capacity, not the 14-day observed result. Keep the production monitor running until the rolling window shows 56+ real shadow publications.
3. **DONE - Duplicate generation guard:** `cron/generate` now excludes already-published `jobId`s as well as slugs, including `brief-<slug>` IDs. This protects production from re-enqueueing content already present in shadow/Git after file/DB drift.
4. **DONE - Cron secret hygiene:** direct raw cron endpoint entries were removed from the user crontab. Keep only the root `/usr/local/bin/fpvlovers-cron-call` wrapper path; never store `CRON_SECRET` directly in crontab or Git.
5. **DONE - Affiliate application readiness, not monetization activation:** `npm run affiliate:application-readiness` is **100/100** and application-ready with honest language, trust routes, commercial depth, review boundaries, and no unsupported claims. `ctaActivationReady=false` is expected because no affiliate program has been accepted. `npm run catalog:affiliate-audit` remains `blocked-pending-network-verification` until real affiliate URLs and evidence are added.
6. **DONE - Unverified CTA lock:** Dify/legacy article fallback pages no longer render source URLs as commercial CTAs. They show `Commercial CTA Locked` unless `commerceVerified === true`.
7. **DONE - Deploy and verify the new backlog/gate release:** score-closure code commit `5a28a33` was deployed through Coolify deployment `rokw88g4wck8k4so0o80444s`; the final docs-sync deployment `wgcwww4s80ccgkc4okkws004` is healthy on image `67b751134c9f432e3d1637da489dfd7b3d825607`. Post-deploy production smoke passed 7/7. The server wrapper dry-run returned `action=would_enqueue` for `brief-fpv-drone-wont-arm-troubleshooting`, so the new backlog selector is live without spending Dify budget.
8. **NEXT - Monitor real cron output:** let the scheduled wrapper run normally and verify the next real generated/published artifacts through `automation:status`, `published_articles_shadow`, and the content audit. Do not manually force real crawl/generation unless Dify budget and source quality are confirmed.
9. **NEXT - Monetization phase stays separate:** use `$monetizasyon` later to add real affiliate URL verification, evidence URLs, application submissions, and source-backed CTA activation. Do not claim Amazon Associate status, official partnerships, supplied products, traffic, conversions, or hands-on testing before they are real.
10. **NEXT - Catalog provenance cleanup:** source-cache fixes rendering stability, but the product catalog still contains old/stale remote image URLs and a few topic/product mismatches. Next monetization/catalog phase should replace catalog seed URLs with verified manufacturer/retailer source pages and evidence timestamps before enabling live affiliate CTAs.

## Current Priority After 2026-07-15 Automation/Data-Safety Closure

1. **DONE - Close crawler queue safely:** production now reports `40 completed`, `9 retired` (`7 unreachable`, `2 stale pending`), and `unresolved failed=0/pending=0`. Retired history remains queryable; do not re-enable those blocked URLs without a replacement source.
2. **DONE - Persist shadow content and backups:** seven production-only shadow artifacts are committed in `ea5ec6e`; daily gzip+checksum PostgreSQL backup runs at 02:17 UTC with 30-day retention. Restore rehearsal remains a follow-up, not yet claimed complete.
3. **DONE - Budget-aware generation:** commit `81f142f` defers Dify budget failures until the next UTC reset; one evidence-backed job is scheduled for `2026-07-16T00:05Z`. Never force a real generation/crawl while the Dify budget is exhausted.
4. **IN PROGRESS - Prove 4/day:** monitor `GET /api/admin/automation/status` for 14 consecutive days. Baseline after this phase is `6/14d`, `1/24h`, `2 observed days`, `dailyAverage14d=0.43`, `targetMet14d=false`. Do not report 10/10 until 56+ shadow publications are observed in the rolling window.
5. **IN PROGRESS - Product catalog evidence:** `npm run catalog:affiliate-audit` is now the release gate. Current result is `15` active seeds, `0` verified affiliate destinations, and `89` crawler rows without evidence specs; unverified rows are fail-closed in recommendations and labeled source-only in the Simulator. Add only real affiliate URLs after account approval and destination evidence; do not enrich with guessed tags.
6. **IN PROGRESS - First real review:** use `/advertise#product-evaluation` or `/contact`, record a physical product/evidence event, then run the admin `generated -> reviewed -> approved -> published` chain as Hazar Volga Ekiz. Existing reviews remain spec-analysis; no hands-on score may be added without evidence.
7. **DONE - Provenance and CTA/mobile guardrails:** `a5f8196` is live through Coolify deployment `p0ccskwkscck84go4csoo4s0`; source references, fail-closed raw storage, safe external URL checks, no placeholder affiliate blocks, mobile Search routing, visible subpage CTAs, and source-only Simulator labels are deployed. Host smoke passed public 200 routes, `/api/ready=ready`, and `/admin=401`.
8. **DONE - Restore rehearsal:** the 2026-07-15 gzip backup restored into an isolated PostgreSQL 17 container with `ON_ERROR_STOP=1`; shadow/queue counts were readable (`124/49/101`) and the temporary container was removed. **Next:** replace retired anti-bot/500 URLs with accessible official/manual sources before any controlled crawl window.

## Current Priority After 2026-07-06 Automation Recovery Start

0.4. **DONE - Homepage content gateway repair and production deploy:** source commit `72d08fe` (memory follow-up `8737bf5`) implements the five-minute ISR/revalidation path, six-card featured-plus-supporting editorial layout, visible archive CTA, data-backed archive count, compact race status, zero-view suppression, and mobile-safe card geometry. Coolify deployment `h4ccws4g8o8csc0sskgsw0sg` is healthy on image `8737bf5`; `/api/health` returned `200`, and live desktop/mobile browser checks confirmed six cards, visible Browse all, 117 published marker, and no horizontal overflow. The wider project remains below 10/10; follow `docs/gap-reports/2026-07-14-brutal-score-10-10-strategy.md` for measured closure gates.
0.5. **DONE - Public editorial consistency and release evidence:** commit `5eb2fac` is live and healthy; public search language, commercial hub geometry/evidence labels, blur/motion behavior, and mobile tap targets were hardened. Commit `4482d5b` adds `production:smoke` (7 live checks) and `commercial:readiness-test` (19 commercial artifacts pass). Re-score only from fresh automated, browser, and production evidence; the wider project is not claimed as 10/10.
0.3. **DONE - Automatic crawl failover repair:** commit `250de61` is live and healthy with explicit primary/backup health URLs in Coolify; `/api/ready` is `ready` and both crawler health endpoints return `200`. Health paths are derived from crawl URLs when envs are omitted. Anti-bot/Cloudflare/HTTP-403 responses now terminalize as `failed`; real cron runs moved target blocks to `failed` without Dify upload. Current read-only queue snapshot: `completed=39`, `failed=7`, `pending=3`, `throttled=0`. Keep the three Oscar Liang jobs behind the embedding budget guard until a controlled real crawl window is approved.
0. **DONE - Release quality gate cleanup:** commit `7be7c5e` removed the five documentation whitespace/EOF violations; `quality:recent`, TypeScript, and `git diff --check` pass. Next: remove the isolated-build dependency on Google Fonts.
0.1. **DONE - Offline build hardening:** removed `next/font/google`; standalone build generated 122 routes successfully with committed-content fallback when local DB DNS was unavailable. TypeScript, lint, content smoke, route audit, and quality gate pass. Next: reconcile production crawl pending/throttled state.
0.2. **DONE - Crawl retry exhaustion fix and deploy:** commit `2709840` is deployed healthy; crawl dry-run confirms the worker selects without mutation. The two provider-failure rows remain throttled until a controlled real worker window; do not bypass the embedding budget guard.
1. **DONE - Backup before automation changes:** Production PostgreSQL backup created on `hulyaekiz` at `/root/fpvlovers-db-backups/fpvlovers_prod_20260706T110705Z.dump`, SHA-256 `06e21a737efbbf574a9108a7055e8b056b404ab96b03bc1017558e6a12c42293`.
2. **DONE - Automation monitor phase:** added `src/lib/automation/automation-status.ts`, protected `GET /api/admin/automation/status`, and `npm run automation:status` with daily target `4`. Local typecheck and targeted ESLint passed. Deployed `fcbcc20` through Coolify deployment `f0w8k4gg4o008c0oko8ks04s`; authenticated live smoke returned `overall=critical`, `publishedLast24h=0`, `staleGenerating=39`, `staleQueued=1`, `throttled=1`.
3. **DONE - Stale recovery command added:** `npm run automation:recover-stale` is dry-run by default and `--apply` marks stale `generating`/`queued` content jobs as `failed` with audit metadata instead of deleting rows. Local `npx tsc --noEmit` and targeted ESLint passed. Committed and pushed as `bc4b5fa`.
4. **DONE - Production stale recovery applied:** production DB recovery marked 40 stale rows as `failed` without deletion. Monitor verification showed `staleGenerating=0` and `staleQueued=0`.
5. **DONE - Scheduler source restored:** root crontab on `hulyaekiz` now uses `/usr/local/bin/fpvlovers-cron-call`; generate runs every 3 hours and crawl runs twice daily. The wrapper reads `CRON_SECRET` from the controlled root secret file and does not expose the value in crontab.
6. **DONE - Close file/DB drift permanently:** `FPV_CONTENT_JOBS_STORAGE_MODE=postgres` is deployed in Coolify, content jobs are isolated from global `FPV_STORAGE_MODE=dual`, cron racing brief selection no longer writes file-backed duplicates, and the stale `street-league-spec-upcoming-races-empty` file queue was hot-cleaned from the live container.
7. **DONE - Extend Dify generation timeout:** content generation now runs through `src/lib/dify-client.ts` with a 180s workflow timeout; the first live retry completed Dify execution instead of aborting at 30s.
8. **DONE - Attach real source hints to autonomous briefs:** commit `0b045c8` deployed trusted category-level source URL hints for content-plan briefs. The previously held beginner-drone job was refreshed in production, rerun through the normal cron wrapper, and published successfully.
9. **DONE - Validate four-per-day generation target:** production shadow reports 4 new published articles in the last 24 hours, with healthy generate runs and no stale content jobs. Continue monitoring, but the target is met.
10. **Embedding budget guard:** recent crawl throttling shows `Daily embedding budget exceeded (500+500/500)`. The crawl cadence/content volume plan must not spend embedding budget blindly; prioritize source quality and daily quota visibility. Keep the four old pending Oscar Liang jobs queued until the next controlled worker window.
11. **DONE - Published shadow parity:** production plain-Node upsert reconciled all 117 committed artifacts into the shadow table without deleting five runtime-generated rows; local-only parity difference is zero.
12. **Affiliate evidence boundary:** commercial pages pass the 600-word/indexability and internal-link gates. Ten pages under 1,200 words remain editorial enrichment work. A genuine hands-on review remains blocked until Hazar Volga Ekiz records a real product/evidence event; never synthesize that evidence.
13. **FINAL STATUS - 2026-07-14:** all currently controllable GAP/BUG phases are closed and pushed through `4482d5b`; runtime UX is live from `5eb2fac` and live smoke is 7/7. Remaining work is monitored/evidence-dependent: controlled crawl retry after embedding budget approval, optional enrichment of 10 sub-1200-word commercial pages, and one genuine Hazar-approved hands-on review when a product/evidence event exists.
11. **Phase discipline:** after each successful phase, update `PROJECT_MEMORY.md`, update this file, run the fastest relevant verification, commit, and push before moving to the next phase.

## Previous Priority After 2026-06-25 GAP Closure

1. **Tool corpus phase:** keep Build Wizard, Part Matcher, Component Duel, Hardware Analyzer, and Blackbox Tuning marketed as partial/guardrailed until `fpv-build-guides`, `fpv-components-specs`, `fpv-pid-profiles`, and `fpv-troubleshooting` receive source-backed docs.
2. **Racing workflow phase:** Dify racing workflow currently falls back locally when Dify returns unsuccessful structured output. Fix Dify workflow output shape/token status before claiming full autonomous racing intelligence.
3. **First real hands-on review:** obtain or purchase one product, record test method/evidence/images, and publish a true hands-on review approved by Hazar Volga Ekiz. Existing review pages are spec-analysis, not hands-on testing.
4. **Live mobile QA:** verify homepage, buyer guide hub, reviews hub, one article trust panel, footer trust links, and mobile menu at 360x800 and 390x844 after deploy.

## Completed (2026-06-25 Affiliate/Social Readiness Closure)

- ✅ Created and updated two brutal GAP reports:
  - `docs/gap-reports/2026-06-25-project-operations-gap-report.md`
  - `docs/gap-reports/2026-06-25-design-ux-gap-report.md`
- ✅ Fixed release blockers: missing `react-is`, recent-quality explicit `any` violations, middleware role typing, ideation output normalization, and lint performance.
- ✅ Closed Dify workflow bypass in content generation by routing workflow calls through `src/lib/dify-client.ts`.
- ✅ Added `/api/ready` for env, Dify budget, DB, and crawler readiness.
- ✅ Expanded commercial content and internal links: commercial scan now reports `commercial=20`, `thin=0`, `noLinks=0`.
- ✅ Converted existing product review pages into honest editor-approved `spec-analysis` records; no hands-on claims were added.
- ✅ Repositioned homepage and article copy toward editorial FPV media/buyer intelligence while preserving the dark tactical FPVLovers identity.
- ✅ Added racing workflow local fallback that produces review-required briefs when Dify returns unsuccessful structured output.
- ✅ Standardized package manager state by removing tracked `pnpm-lock.yaml`; npm lock remains authoritative.
- ✅ Final local verification passed: `quality:recent`, `tsc`, `lint:ci`, `content:audit`, `metadata:audit`, `media:audit`, `editorial:governance-test`, `social:contracts-test`, `routes:audit`, `tools:audit`, `racing:workflow:smoke`, and `npm run build`.
- ✅ Local production smoke: `/`, `/buyers-guides`, `/article/best-fpv-goggles-2026`, and `/api/health` returned 200; `/api/ready` returned 503 because local DB/crawler dependencies were intentionally unavailable.
- ✅ Deployed commit `1ca1b72` to production through Coolify deployment `go0888cg0cksswos40wgcgc4`; live container is healthy on image `1ca1b72`.
- ✅ Live production smoke passed: `/`, `/buyers-guides`, `/reviews`, `/article/best-fpv-goggles-2026`, `/api/health`, and `/api/ready` returned 200. `/api/ready` reports `ready` with DB and Crawl4AI Primary passing.

## Approved Affiliate + Social/Video Program (2026-06-19)

Execute in this order; do not start social/video implementation before the affiliate publication boundary is verified.

1. **Affiliate Phase 1 - Governance contract:** add regression tests and types for product-review-only human approval, Hazar Volga Ekiz editor identity, evidence/testing/product-relationship fields, and autonomous non-review quality gates.
2. **Affiliate Phase 2 - Publishing boundary:** stop cron from directly publishing product reviews; store them as review drafts, add explicit approval transitions, and keep qualified non-review content autonomous.
3. **Affiliate Phase 3 - Public trust layer:** correct unsupported partnership language, expose article-level disclosures and methodology, publish independent product-evaluation terms, and hide review scores until their evidence and approval contract is satisfied.
4. **Affiliate Phase 4 - Commercial readiness:** remediate thin flagship reviews/comparisons/buyer guides, verify metadata/schema/internal links/CTAs, then produce an evidence-backed readiness score and application shortlist.
5. **Social Phase 1 - Content distribution:** create structured social jobs and reusable Facebook, Instagram, LinkedIn, YouTube Shorts, TikTok, X, and Reddit-safe templates derived from approved article facts.
6. **Social Phase 2 - Video pipeline:** add a Dify video-director manifest, deterministic validation, TTS/render job boundary, and private-by-default YouTube upload adapter with synthetic/paid-product metadata support.
7. **Social Phase 3 - MVP proof:** render and QA one 45-second English educational Short (initial topic: DJI O3 vs Walksnail). Do not frame it as hands-on testing unless real test evidence exists.
8. **Operations:** preserve the rescue branch until production verification, use dry-run for external publishing/upload, and record local/pushed/deployed boundaries in memory and handoff.

Canonical documents:

- `docs/superpowers/specs/2026-06-19-affiliate-editorial-governance-design.md`
- `docs/superpowers/plans/2026-06-19-affiliate-editorial-governance.md`
- `docs/superpowers/specs/2026-06-19-social-video-automation-design.md`
- `docs/superpowers/plans/2026-06-19-social-video-automation.md`

### Local commit status

- ✅ Affiliate governance contract and regression suite implemented.
- ✅ Product-review-only Hazar Volga Ekiz approval boundary implemented in cron, admin transitions, and artifact publisher.
- ✅ Trust pages, product-evaluation terms, inline article disclosure, score suppression, thin-commercial noindex/hub/sitemap policy, canonical/social metadata, and Article JSON-LD implemented.
- ✅ Affiliate audit/application/media-kit/roadmap/playbook updated; source-level score moved from 52/100 to 81/100.
- ✅ Seven-platform social fact-pack/job/variant system and protected admin dry-run endpoint implemented.
- ✅ Dify video-director adapter and strict private video manifest implemented through the guarded Dify client.
- ✅ Private-by-default YouTube resumable upload adapter implemented; live upload remains disabled.
- ✅ 45-second 1080x1920/30fps English Short MVP rendered locally with TTS and visually inspected; generated output remains in the rescue snapshot while reproducible source and narration remain on `main`.
- ✅ Reconciled implementation committed as `2b025b1`; readiness skill and playbooks committed as `e3a7c8a`.
- ✅ Full 2026-06-19 release gate passed, including the 120-page production build with committed-content fallback when the Coolify-only PostgreSQL hostname was unavailable locally.

### Remaining launch operations

1. Preserve the rescue snapshot at `rescue/pre-main-cleanup-2026-06-19` until the reconciled commits are pushed and verified.
2. Install/authorize HyperFrames CLI, then run `lint`, `inspect`, and native render against `video/fpvlovers-short/`; compare with the verified fallback MP4 preserved in rescue commit `592912a`.
3. Import/publish the Dify social-video-director workflow and set `DIFY_VIDEO_DIRECTOR_TOKEN`; validate with `CRAWL_DRY_RUN=true` first.
4. Configure YouTube OAuth secrets and test one private upload. Keep `ENABLE_YOUTUBE_UPLOAD` false until the private payload and account are verified.
5. Deploy only after existing security/credential prerequisites, then browser-test trust routes, commercial hubs, article trust panels, sitemap, and mobile footer/disclosure behavior.
6. Backfill sources/internal links for the ten substantial commercial pages and obtain the first real product-review evidence/approval from Hazar Volga Ekiz.
7. Apply selectively to verified Wave 1 programs only after the live gates pass; keep GetFPV/RDQ and unverified brands in direct-outreach status.

## Immediate Security Actions

1. ✅ Rotated `CRON_SECRET`, the Dify dataset token, and seven unique active Dify app/workflow token groups; verified replacements and revoked old tokens.
2. Plan a coordinated Git-history rewrite and force-push window so all collaborators can re-clone safely.
3. Keep `pnpm security:audit` in the local release gate to prevent tracked credential values, hardcoded Dify tokens, and developer-specific audit paths from returning.

## Deployment Tasks

0. ✅ Coolify persistent volume for `/app/public/images/source-cache` is live, host-directory ownership matches the app's uid 1001, and Backfill Images was re-run and verified end-to-end on 2026-08-02 (87/87 files present on the persistent host path, live `curl` returned `image/png`). See the 2026-08-02 priority section above for full evidence.
0. **PAUSED HERE (2026-08-02) — resume point:** Wire `src/app/admin/page.tsx`'s "Pilot Registry" table and usage chart to real `newsletter_subscribers`/`published_articles_shadow` data instead of the current hardcoded demo arrays (`subscribersData`, `usageVsGrowthData`). This is the next open task; nothing is mid-flight/broken. Everything else from the 2026-08-02 session is closed and deployed.
1. ✅ Production read-only verification completed on 2026-06-19: the healthy Coolify container and `origin/main` both run `061f0f705a415046b7ba5e07df77ece3f41c56e8`.
2. ✅ Complete local release gate passed after the affiliate/social reconciliation commits.
3. ✅ Replaced the broken Cloudflare Pages action with repository-root CI validation; Coolify remains the only production deploy path.
4. ✅ Pushed the reconciled stack, passed repository-root GitHub CI, and deployed the healthy production container through a manually queued Coolify deployment.
5. ✅ Kept global `FPV_STORAGE_MODE=dual`, isolated the crawl queue with `FPV_CRAWL_QUEUE_STORAGE_MODE=postgres`, and enabled the guarded worker after dry-run proof.
6. ✅ Authenticated dry-run previewed exactly one pending Postgres job without changing queue counts.
7. ✅ Completed one real primary-Crawl4AI job and independently verified its Dify document as indexed; corrected the queue row after discovering the DB store update defect.
8. ✅ Reduced crawl cadence from every 5 minutes to every 6 hours; generation remains every 20 minutes only while it stays `noop`/low-cost.
9. ✅ Deployed and verified the final crawl hotfix: DB state persistence, atomic JSONB metadata, visible update failures, 1,500-character/500-token upload cap, preflight daily-budget rejection, and UTC budget reset.
10. ✅ Repaired backup Crawl4AI routing to container port `11235` and restricted `/c4ai` to the Hulya application server; health now returns `200` internally and `403` externally.
11. Browser-verify article trust panels and the iFlight cover fallback; public health, legal/trust routes, and commercial hubs already returned HTTP `200` after deploy.

## Completed (2026-06-19 Topic-Aware Fallback Covers)

- Added 12 approved topic-family covers plus one generic final fallback, optimized as `1536x960` WebP assets (2.4 MB total).
- Added deterministic metadata routing and the browser error chain `original -> topic -> generic` for homepage cards and article covers.
- Preserved explicit article covers instead of promoting unrelated body-section or gallery images over them.
- Passed topic-cover regression, TypeScript, ESLint, content integrity, full production build, desktop Browser QA, and `390x844` mobile Browser QA with clean console output.
- Deployed through Coolify from `origin/main` as commit `061f0f7`; live container health was verified on 2026-06-19.

## Completed (2026-06-18 Post-Analysis Phase 1)

- Removed tracked operational credential values from current documentation.
- Removed hardcoded Dify token fallbacks from YouTube generation and retrieval testing.
- Routed retrieval quality tests through `src/lib/dify-client.ts`.
- Moved the unified metadata report to `reports/unified-metadata-report.md` and added `pnpm metadata:audit`.
- Added `pnpm security:audit`; fresh security audit, metadata audit, TypeScript, and whitespace checks pass locally.

## Completed (2026-06-18 Post-Analysis Phase 2)

- Completed discovery metadata for all 117 published artifacts; all six audited metadata fields now report zero missing values.
- Canonicalized `Buyers Guides` to `Buyer Guides` in existing artifacts and the commercial content generator.
- Replaced the destructive target-only migration with an idempotent merge migration that preserves review, comparison, and buyer-guide metadata.
- Added `pnpm metadata:test` and `pnpm metadata:migrate`; regression, metadata, content-integrity, and TypeScript gates pass locally.

## Completed (2026-06-18 Post-Analysis Phase 3)

- Removed all 13 semantic `any` annotations introduced in the 18 June change range.
- Removed all 82 trailing-whitespace and extra-EOF-newline violations in the same range.
- Added `pnpm quality:recent`, with an overridable `QUALITY_BASE_REF`, to prevent regressions.
- Fresh recent-quality, TypeScript, and full-repository ESLint gates pass locally.

## Completed (2026-06-18 Post-Analysis Phase 4)

- Reconciled project memory and next actions with commits `e3813ae`, `55b8f6c`, and `a16bdcb`.
- Replaced the obsolete May Task 2 handoff generator with a Git-aware release-verification handoff.
- Updated the Opencode brief to preserve local, pushed, deployed, and live-verified boundaries.
- Added `pnpm handoff:test`; generated handoff and stale-state regression checks pass locally.

## Completed (2026-06-18 Post-Analysis Phase 5 Local Verification)

- Passed the complete dry-run release gate and generated a 118-page production build.
- Verified the live healthy container is exactly image commit `845afc598a5022f6b003fd961a516a8caa334920`.
- Browser-smoked homepage, Reviews, Comparisons, Buyer Guides, and Reviews-to-article navigation with clean console output.
- Added resilient article-cover fallback after live QA exposed an unavailable external iFlight catalog image.
- Kept local-only, pushed, deployed, and live-verified states explicit; the new closure commits are not pushed or deployed.

## ✅ Completed (2026-06-14 GAP Closure Sprint)

- GAP raporu yazıldı (25 bulgu, 17'si çözüldü)
- 11 Dify token'ı env var'a taşındı (hardcoded → .env)
- NEXT_PUBLIC_GEMINI_API_KEY → GEMINI_API_KEY rename
- 31 admin route'a inline auth guard eklendi
- CRON_SECRET bypass kaldırıldı
- Token budget mismatch düzeltildi (dosyada 100000, her zaman 500)
- Retrieval orchestrator gerçek Dify Dataset API'ye bağlandı (ENABLE_REAL_RAG=true)
- 5 boş dataset için 10 seed URL eklendi
- 89 eski makaledeki genel stok/placeholder referansları temizlendi
- Crawl kaynak görsellerini koruyan medya politikası netleştirildi
- Unsplash/Pexels/Picsum için runtime denylist ve `media:audit` eklendi
- Published artifact filesystem + PostgreSQL dayanıklılığı eklendi
- Content smoke testi gerçek kuyruktan izole edildi
- Canlıda üretilen 7 eksik makale Git çalışma ağacına senkronize edildi
- YouTube transcript otomatik altyazı desteği eklendi
- deploy-clean branch'inden eksik 3 özellik main'e alındı
- Kullanılmayan paketler kaldırıldı (@hookform/resolvers, react-hook-form, react-is)
- Affiliate tıklama takibi eklendi
- NativeAds dinamik props tabanlı hale getirildi
- URL allowlist + SSRF koruması eklendi
- View counter 0 değerini de gösteriyor (artık hep görünür)
- Production env var'ları Coolify'da tanımlandı
- Generate pipeline çalışıyor, içerik üretiliyor (Racing)
- Crawl pipeline çalışıyor (CRAWL_DRY_RUN=false)

## 2026-07-14 Production Readiness Closure Phase

- ✅ Commit `0399899` pushed to `origin/main`: product/spec trust is fail-closed. Unverified products cannot produce a build-ready verdict, calculator output, duel winner, or affiliate purchase card.
- ✅ Added `npm run tools:part-matcher:test` coverage for complete-but-unverified raw specs; the result is blocked and calculator output is deferred.
- ✅ Added `npm run tools:calculator:test`; 1S whoop calculations now preserve 3.7V nominal / 4.2V full voltage instead of clamping to 2S.
- ✅ Added SEO/AI discovery controls: `en_US` OG locale, valid `/logo-type.png` publisher logo, global OG/favicon, dynamic sitemap hub coverage with `lastmod`, publish-triggered sitemap revalidation, planned-seed `noindex`, Article/BreadcrumbList schema, conditional hands-on Review/Product schema, and `/llms.txt`.
- ✅ Added `npm run seo:discoverability-test` for metadata, robots, sitemap, schema, seed noindex, and llms.txt regression checks.
- ✅ Removed dead `#` affiliate destinations. Native ads now render a real linked CTA only when a valid HTTP(S) product URL is present; otherwise they show an editorial placeholder. Battery safety recommendations are research checklists, not fake purchase cards.
- ✅ Search now sends a lightweight server-built index to the client instead of serializing all 117 article bodies.
- Local verification passed: TypeScript, focused ESLint, content/audit/language/editorial gates, SEO discovery, calculator, Part Matcher, quality, and content smoke.
- ✅ Runtime commits `1f08ad0` + docs `df76a58` deployed through Coolify on 2026-07-15 (deployment `zowkok880k88k0ws844kwscw`). New container `df76a58...` is healthy; server-side smoke passed public 200 routes, admin 401 boundaries, homepage latest-card markers, `/llms.txt`, sitemap hubs, and article schema/language checks.
- ⏳ Remaining evidence-dependent blockers: verified primary-source product mappings, first genuine Hazar-approved hands-on review, 14-day four-publish reliability window, crawl failure retirement/retry decisions, rollback rehearsal, and full accessibility/route visual matrix.

## 2026-07-23 Closure Sprint State

- ✅ Homepage media policy hardened: recent homepage cards now render a non-generated display cover even when a new autonomous article only has a generated API cover. Commercial/buyer-intent pages still require source-backed media before release.
- ✅ Production cron/generate flow restored: failed backlog jobs no longer block autonomous first-wave selection, and middleware accepts the same cron secret formats as the route handler.
- ✅ Real production generation tested with Dify: 4 articles published in the last 24 hours. Current production automation status: `overall=ok`, `publishedLast24h=4`, `publishedLast14d=19`, `targetMet14d=false`.
- ✅ Production shadow content synced back to Git working tree: 137 local articles and 137 live shadow articles, with no live-only/local-only drift.
- ✅ Metadata gap closed: `metadata:audit` reports 137/137 valid metadata and 0 missing metadata fields.
- ✅ Affiliate application readiness is 100/100 with honest boundaries. Live CTA activation remains intentionally disabled until verified affiliate program URLs exist.
- ⏳ True 10/10 evidence still requires time-based proof: monitor 4 articles/day for 14 consecutive days, then `targetMet14d` can move from false to true.
- ⏳ Monetization follow-up remains separate: use `$monetizasyon` for verified affiliate program applications, verified affiliate URLs, sponsor outreach, and first Hazar Volga Ekiz evidence-backed product review flow.
- ✅ Source-backed media cache deployed: commit `8c45dd0`, Coolify deployment `m8csk44cg4w0040kk4gckwo4`, production image `8c45dd0b4812389db45f5c3b03973a3399f78e2c`. Browser live audit after lazy-load scroll: `22/22` images loaded, `0` real broken images, Latest Content `12/12` loaded with `8` source-cache covers, `4` local autonomous troubleshooting fallbacks, `0` generated API covers, `0` external hotlinks.
- ✅ Crawler queue active blocker closed in production: `completed=40`, `retired=9`, `pending=0`, `failed=0`, `throttled=0`.
- ✅ Content-job terminal state model added and applied in production: resolved historical failed rows moved to first-class `retired` without deleting data. Current production counts: `published=66`, `queued=1`, `retired=46`, `failed=0`.

## Manuel Yapılacak (Coolify)

1. ✅ `be392db` production deploy tamamlandı; container healthy ve restart sayısı 0
2. ✅ Published artifact backfill tamamlandı: 109 benzersiz slug, 0 eksik metadata
3. ✅ `/api/health`, homepage ve crawl/üretici görselli makale doğrulandı
4. Crawl/generate cron'ları aktif (5dk/20dk); yeni üretimlerin shadow tabloya otomatik yazıldığını izlemeye devam et

## Ertelenen (Düşük Öncelik)

- Admin panel 1676 satır → modüler bileşenlere böl (GAP-TECH-001)
- 43 boş catch bloğuna console.error ekle (GAP-TECH-004)
- 7 Dify workflow DSL import (Dify UI manuel işlem)
- Racing intelligence store → pending-review girişleri doğrula
- İçerik pipeline'ına monetizasyon enjeksiyonu (derin entegrasyon)
- Husky deprecation uyarılarını düzelt (.husky/pre-commit, .husky/commit-msg)

## Sunucu Bilgileri

- **Hulyaekiz (161.118.171.201):** fpvlovers Coolify + Crawl4AI primary
- **Aluplan-one (80.225.231.62):** Dify + PostgreSQL + Redis + Qdrant
- **Orko (141.148.206.187):** Crawl4AI backup
- **Dify console URL:** https://dify.affexai.tr (credentials are managed outside Git)
- **Coolify:** https://coolify.fpvlovers.com.tr (hulyaekiz üzerinde)
- **Cron:** 5dk crawl, 20dk generate (hulyaekiz crontab)
- **Cron authentication:** `CRON_SECRET` is managed in Coolify and the server crontab; never record its value in Git

## Restore Points

- `backup/pre-gap-plan-2026-06-14` → GAP düzeltmeleri öncesi snapshot
- `sprint/gap-fixes-round2-2026-06-14` → Round 2 başlangıcı
