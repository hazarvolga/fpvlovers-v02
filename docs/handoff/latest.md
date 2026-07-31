# FPVLovers Handoff Packet

Generated at: 2026-07-30T08:30:24.290Z

## Git State

- Branch: `codex-trust-ops-foundation-2026-07-30`
- HEAD: `942d0f4b2771`
- Against `origin/main`: behind 0, ahead 2

## What Happened

- **2026-07-23 source-cache media hardening:** the repeated/placeholder homepage image problem was traced to stale external catalog/media URLs, not a broken fallback component. A new `npm run media:source-cache` workflow caches source-backed commercial/recent images into `public/images/source-cache/` while preserving original source/provenance fields on artifacts. `npm run media:audit` now fails commercial/buyer-intent artifacts that still hotlink external media, use generated covers, or reference missing source-cache files. Current local evidence: `32/32` commercial covers use `/images/source-cache/`, `0` commercial external hotlinks remain in JSON, `217` cached source image files are committed, `npm run media:audit` passes with `123` unique primary covers and only `4` recent display fallbacks for the intentionally generated noncommercial troubleshooting articles.
- **2026-07-23 homepage media repair:** the live “almost no images” issue was traced to homepage/latest presentation and media resilience, not broken `/api/content/media/cover` responses. Homepage now renders 12 recent cards instead of 6, reduces grayscale/dim opacity on visual cards, and avoids repeating Latest cards in the Featured Guides feed. `ResilientCoverImage` now renders external source URLs without Next optimizer/remote-pattern coupling and falls back after 1.8s to topic-aware local covers when a hotlinked source image hangs or fails. `scripts/backfill-catalog-media.ts` + `npm run media:backfill-catalog` backfilled 21 commercial/gear artifacts with source-backed catalog media and source references while deliberately excluding product reviews and news/racing articles. `npm run media:audit` now blocks generated/empty media for recent homepage candidates and commercial/buyer-intent artifacts; it currently passes with 105 unique primary covers and 12 non-commercial generated covers. Local Browser QA on `localhost:3015` confirmed `22/22` homepage images loaded and `0` visible broken images after fallback.
- **2026-07-23 score-closure working phase:** production-only shadow artifacts were exported from the live container back into `content/published`, bringing committed/local content inventory to **133** artifacts and `npm run production:shadow-parity` to **133 local / 133 live / 0 live-only / 0 local-only**. The new artifacts are production-generated commercial evergreen pages and must stay in Git so production shadow content is not lost during rebuilds.
- **2026-07-23 automation capacity repair:** the finite content plan was expanded into a larger autonomous evergreen backlog. `npm run automation:backlog-audit` reports **94 planned briefs**, **69 available briefs**, and a projected **56-publication / 14-day** capacity against the 4/day target. The cron/generate route now checks both published slugs and published `jobId`s, including `brief-<slug>`, so production cannot re-enqueue already-published briefs after file/DB drift.
- **2026-07-23 cron hygiene:** direct `/api/admin/cron/*` crontab entries were removed from the user crontab. The server root crontab remains wrapper-based through `/usr/local/bin/fpvlovers-cron-call`, which reads `CRON_SECRET` from the controlled root secret file instead of exposing it in crontab. Do not reintroduce raw cron endpoint lines.
- **2026-07-23 affiliate application readiness boundary:** `npm run affiliate:application-readiness` now measures application readiness separately from live CTA activation. Current result is **100/100 application-ready**, **ctaActivationReady=false**, `19` commercial artifacts, `9` trust/legal/SEO routes, and `0` verified affiliate destinations. This is intentional because no affiliate program acceptance has been claimed. `npm run catalog:affiliate-audit` remains the stricter monetization activation gate and correctly reports `blocked-pending-network-verification` until real network approvals and verification evidence exist.
- **2026-07-23 unverified commercial CTA lock:** legacy/Dify fallback article pages no longer hard-code affiliate links or render source URLs as sponsored CTAs. They render `Commercial CTA Locked` unless `commerceVerified === true` and a valid HTTP(S) affiliate URL is present. The public BETAFPV Cetus X markdown was aligned with its JSON editorial record and no longer says “We tested”; it remains a spec-analysis review unless a real Hazar Volga Ekiz evidence package exists.
- **2026-07-23 deployment evidence:** score-closure code commit `5a28a33` was pushed and deployed through Coolify deployment `rokw88g4wck8k4so0o80444s`. A follow-up docs-sync deployment `wgcwww4s80ccgkc4okkws004` is now healthy on image `r0c44ok0cskc800gs0c8o8wk:67b751134c9f432e3d1637da489dfd7b3d825607`. Post-deploy `npm run production:smoke` passed 7/7. The server cron wrapper dry-run returned `action=would_enqueue` for `brief-fpv-drone-wont-arm-troubleshooting`, proving the new backlog selector is live without spending Dify budget.
- **2026-07-15 automation/data-safety closure:** `cc292bf` fixed generated-cover preservation, slug-specific fallback normalization, production `FPV_DATABASE_URL` raw-content access, and persisted crawl source markdown. `81f142f` added Dify-budget-aware generation deferral; `d55f36f` added transparent `retired` crawler status and explicit 14-day publication metrics. Production is healthy on `b896114` after Coolify deployment `9ae2d621-f1b9-4bff-88a2-4c01eb1b28b7`. The live queue is `40 completed + 9 retired`, with `unresolved failed=0/pending=0`; the 9 retired rows preserve unreachable/stale reasons and are not falsely reported as successful crawls.
- **Backup/shadow durability:** production PostgreSQL was dumped to `/root/fpvlovers-db-backups/fpv-20260715T122308Z.sql.gz` (SHA-256 `79854ec7233afea72bd6b720d73c762e18961993319cd33ca7f12bf9bdbe0e96`) before queue mutation. A root cron at `17 2 * * *` now runs `/usr/local/sbin/fpvlovers-db-backup`, writes gzip + checksum files, and retains 30 days. Seven production-only shadow artifacts were exported and committed in `ea5ec6e`; content audit now reports 124 published artifacts.
- **Current publication evidence:** the monitor now exposes `publishedLast14d`, `observedDays14d`, `dailyAverage14d`, and `targetMet14d`. Current production evidence is `6` publications in 14 days, `1` in 24 hours, across `2` observed days, so the 4/day target is instrumented but **not yet proven**. One previously recorded Dify budget-failed job is queued for `2026-07-16T00:05:00Z`; no additional generation was forced against the exhausted budget.
- **Trust/commerce closure:** `b896114` makes raw source persistence fail-closed before Dify upload, writes top-level `sourceHints`/`sourceReferences` into new artifacts, exposes a visible source trail on article trust panels, blocks `#`/invalid affiliate CTAs, marks unverified catalog rows as source-pending/quarantine, and adds the Hazar Volga Ekiz product-review intake form plus workflow documentation. Mobile Search now routes to `/search` and subpage actions remain tappable on small screens. No affiliate partnership or real hands-on test was invented.

## Current Blockers

- Plan a coordinated Git-history rewrite and force-push window so all collaborators can re-clone safely.
- Keep `pnpm security:audit` in the local release gate to prevent tracked credential values, hardcoded Dify tokens, and developer-specific audit paths from returning.
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

- `/Users/hazarvolgaekiz/dev/products/fpvlovers.com.tr-clean/PROJECT_MEMORY.md`
- `/Users/hazarvolgaekiz/dev/products/fpvlovers.com.tr-clean/NEXT_ACTIONS.md`
- `/Users/hazarvolgaekiz/dev/products/fpvlovers.com.tr-clean/docs/superpowers/plans/2026-06-18-post-analysis-gap-closure.md`

## Copy-Paste Continuation Prompt

```text
Continue FPVLovers from the latest handoff packet.

Read PROJECT_MEMORY.md, NEXT_ACTIONS.md, and docs/handoff/latest.md first.
Start with the recorded Next Move. Inspect current Git state before acting, keep credential rotation, Git-history cleanup, push, deploy, and live-verification boundaries explicit, and update project memory after obtaining fresh evidence.
```
