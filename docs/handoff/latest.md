# FPVLovers Handoff Packet

Generated at: 2026-08-02T09:55:48.213Z

## Git State

- Branch: `main`
- HEAD: `887907dd03c5`
- Against `origin/main`: behind 0, ahead 0

## What Happened

- **2026-08-02 image-cache persistence root cause found (fix in progress):** `backfill-images/route.ts` and `publish-artifact.ts` both write harvested cover/gallery images to `public/images/source-cache/` on the app container's own disk; `docker inspect` confirmed `Mounts: []` — no persistent volume. Cross-referencing the DB against actually-existing files proved all 87 `published_articles_shadow` rows whose `coverImage.src` pointed at `/api/images/source-cache/...` were phantom (file missing both on disk and in git); the 220 files that do exist are an earlier batch that happened to get git-committed. Every redeploy silently wipes newly-harvested real photos, including ones the normal autonomous publish pipeline (not just manual backfill) downloads going forward. Fix: user is adding a Coolify persistent volume (Source `/data/coolify/applications/r0c44ok0cskc800gs0c8o8wk/source-cache`, Destination `/app/public/images/source-cache`), then will redeploy and re-run Backfill Images for real. Do not report the image pipeline healthy again without re-verifying file existence on disk post-redeploy.
- **2026-08-02 admin panel fake-data finding:** `src/app/admin/page.tsx`'s "Pilot Registry" table (`subscribersData`) and usage-growth chart (`usageVsGrowthData`) are hardcoded demo arrays (`alex@example.com` etc.), never wired to the database — not yet fixed. Real counts verified via direct Postgres query: `fpvlovers_app.users`=1 (owner's own admin account only), `newsletter_subscribers`=2, `pilot_progress`=0. `affiliateData` in the same file is also hardcoded and additionally unused (dead code).
- **2026-08-02 comprehensive 9-axis GAP audit + same-session remediation:** `docs/gap-reports/2026-08-02-comprehensive-product-gap-report.md` covers GAP/BUG/UX/UI/mobile/SEO/GEO/security/performance with beginner-persona journey walkthroughs (28 findings). User approved closing all CRITICAL/HIGH and code-fixable MEDIUM/LOW items in the same session: `9bc50df` (rehype-sanitize on MarkdownRenderer's rehypeRaw output, zod validation + rate-limit + password policy on `/api/pilot/register`, rate-limits on contact/newsletter/analytics, no more raw error.message leakage, no PII console.log), `3a75071` (fixed navbar logo overflow that intercepted mobile taps on the hamburger/search at 375px, removed `SearchSection` which always rendered behind the fixed navbar and was never visible at any breakpoint, 44px touch targets, sitewide Organization/WebSite + BreadcrumbList JSON-LD, search rewritten from substring match to per-word AND + field-weighted relevance scoring, WCAG contrast fixes, homepage editorial-trust section condensed to one disclosure line per user decision since no affiliate program has been applied to yet), `f5e5906` (docs), `887907d` (package-lock.json manually synced with the rehype-sanitize dependency — **no `npm` binary exists in this dev environment**, only `pnpm`; `pnpm add` only updates the gitignored `pnpm-lock.yaml`, so Coolify's `npm ci` build broke until `package-lock.json` was hand-patched against real npm registry data with verified integrity hashes). Deploy confirmed healthy on `887907d` at 2026-08-02T08:30:29Z via Coolify deployment log.
- **2026-07-23 source-cache media hardening:** the repeated/placeholder homepage image problem was traced to stale external catalog/media URLs, not a broken fallback component. A new `npm run media:source-cache` workflow caches source-backed commercial/recent images into `public/images/source-cache/` while preserving original source/provenance fields on artifacts. `npm run media:audit` now fails commercial/buyer-intent artifacts that still hotlink external media, use generated covers, or reference missing source-cache files. Current local evidence: `32/32` commercial covers use `/images/source-cache/`, `0` commercial external hotlinks remain in JSON, `217` cached source image files are committed, `npm run media:audit` passes with `123` unique primary covers and only `4` recent display fallbacks for the intentionally generated noncommercial troubleshooting articles.
- **2026-07-23 homepage media repair:** the live “almost no images” issue was traced to homepage/latest presentation and media resilience, not broken `/api/content/media/cover` responses. Homepage now renders 12 recent cards instead of 6, reduces grayscale/dim opacity on visual cards, and avoids repeating Latest cards in the Featured Guides feed. `ResilientCoverImage` now renders external source URLs without Next optimizer/remote-pattern coupling and falls back after 1.8s to topic-aware local covers when a hotlinked source image hangs or fails. `scripts/backfill-catalog-media.ts` + `npm run media:backfill-catalog` backfilled 21 commercial/gear artifacts with source-backed catalog media and source references while deliberately excluding product reviews and news/racing articles. `npm run media:audit` now blocks generated/empty media for recent homepage candidates and commercial/buyer-intent artifacts; it currently passes with 105 unique primary covers and 12 non-commercial generated covers. Local Browser QA on `localhost:3015` confirmed `22/22` homepage images loaded and `0` visible broken images after fallback.
- **2026-07-23 score-closure working phase:** production-only shadow artifacts were exported from the live container back into `content/published`, bringing committed/local content inventory to **133** artifacts and `npm run production:shadow-parity` to **133 local / 133 live / 0 live-only / 0 local-only**. The new artifacts are production-generated commercial evergreen pages and must stay in Git so production shadow content is not lost during rebuilds.
- **2026-07-23 automation capacity repair:** the finite content plan was expanded into a larger autonomous evergreen backlog. `npm run automation:backlog-audit` reports **94 planned briefs**, **69 available briefs**, and a projected **56-publication / 14-day** capacity against the 4/day target. The cron/generate route now checks both published slugs and published `jobId`s, including `brief-<slug>`, so production cannot re-enqueue already-published briefs after file/DB drift.
- **2026-07-23 cron hygiene:** direct `/api/admin/cron/*` crontab entries were removed from the user crontab. The server root crontab remains wrapper-based through `/usr/local/bin/fpvlovers-cron-call`, which reads `CRON_SECRET` from the controlled root secret file instead of exposing it in crontab. Do not reintroduce raw cron endpoint lines.
- **2026-07-23 affiliate application readiness boundary:** `npm run affiliate:application-readiness` now measures application readiness separately from live CTA activation. Current result is **100/100 application-ready**, **ctaActivationReady=false**, `19` commercial artifacts, `9` trust/legal/SEO routes, and `0` verified affiliate destinations. This is intentional because no affiliate program acceptance has been claimed. `npm run catalog:affiliate-audit` remains the stricter monetization activation gate and correctly reports `blocked-pending-network-verification` until real network approvals and verification evidence exist.
- **2026-07-23 unverified commercial CTA lock:** legacy/Dify fallback article pages no longer hard-code affiliate links or render source URLs as sponsored CTAs. They render `Commercial CTA Locked` unless `commerceVerified === true` and a valid HTTP(S) affiliate URL is present. The public BETAFPV Cetus X markdown was aligned with its JSON editorial record and no longer says “We tested”; it remains a spec-analysis review unless a real Hazar Volga Ekiz evidence package exists.
- **2026-07-23 deployment evidence:** score-closure code commit `5a28a33` was pushed and deployed through Coolify deployment `rokw88g4wck8k4so0o80444s`. A follow-up docs-sync deployment `wgcwww4s80ccgkc4okkws004` is now healthy on image `r0c44ok0cskc800gs0c8o8wk:67b751134c9f432e3d1637da489dfd7b3d825607`. Post-deploy `npm run production:smoke` passed 7/7. The server cron wrapper dry-run returned `action=would_enqueue` for `brief-fpv-drone-wont-arm-troubleshooting`, proving the new backlog selector is live without spending Dify budget.
- **2026-07-15 automation/data-safety closure:** `cc292bf` fixed generated-cover preservation, slug-specific fallback normalization, production `FPV_DATABASE_URL` raw-content access, and persisted crawl source markdown. `81f142f` added Dify-budget-aware generation deferral; `d55f36f` added transparent `retired` crawler status and explicit 14-day publication metrics. Production is healthy on `b896114` after Coolify deployment `9ae2d621-f1b9-4bff-88a2-4c01eb1b28b7`. The live queue is `40 completed + 9 retired`, with `unresolved failed=0/pending=0`; the 9 retired rows preserve unreachable/stale reasons and are not falsely reported as successful crawls.

## Current Blockers

- Plan a coordinated Git-history rewrite and force-push window so all collaborators can re-clone safely.
- Keep `pnpm security:audit` in the local release gate to prevent tracked credential values, hardcoded Dify tokens, and developer-specific audit paths from returning.
- Add a Coolify persistent volume for the app (`r0c44ok0cskc800gs0c8o8wk`): Source `/data/coolify/applications/r0c44ok0cskc800gs0c8o8wk/source-cache`, Destination `/app/public/images/source-cache`. Redeploy, then re-run **Backfill Images** (real run) from the admin panel and re-verify file existence on disk, not just the DB `src` field — see 2026-08-02 priority section above for the full root-cause evidence.
- Wire `src/app/admin/page.tsx`'s "Pilot Registry" table and usage chart to real `newsletter_subscribers`/`published_articles_shadow` data instead of the current hardcoded demo arrays (`subscribersData`, `usageVsGrowthData`).
- Browser-verify article trust panels and the iFlight cover fallback; public health, legal/trust routes, and commercial hubs already returned HTTP `200` after deploy.

## Active Plan

**Goal:** Close the security, metadata, taxonomy, type-quality, documentation, and release-verification gaps found after commits `d690953..845afc5` without mutating production data.
### Task 1: Security and portable audits
### Task 2: Metadata and taxonomy completion
### Task 3: Type and formatting quality
### Task 4: Memory and handoff reconciliation
### Task 5: Release and production verification

## Next Move

- Plan a coordinated Git-history rewrite and force-push window so all collaborators can re-clone safely.
- Do not claim the release is live until the production image or commit matches the deployed revision.
- Do not deploy env-only credential changes until exposed credentials have been rotated in their owning systems.

## Source Of Truth

- `/Users/hazarvolgaekiz/dev/products/fpvlovers.com.tr/PROJECT_MEMORY.md`
- `/Users/hazarvolgaekiz/dev/products/fpvlovers.com.tr/NEXT_ACTIONS.md`
- `/Users/hazarvolgaekiz/dev/products/fpvlovers.com.tr/docs/superpowers/plans/2026-06-18-post-analysis-gap-closure.md`

## Copy-Paste Continuation Prompt

```text
Continue FPVLovers from the latest handoff packet.

Read PROJECT_MEMORY.md, NEXT_ACTIONS.md, and docs/handoff/latest.md first.
Start with the recorded Next Move. Inspect current Git state before acting, keep credential rotation, Git-history cleanup, push, deploy, and live-verification boundaries explicit, and update project memory after obtaining fresh evidence.
```
