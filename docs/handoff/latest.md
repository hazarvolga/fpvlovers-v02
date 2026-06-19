# FPVLovers Handoff Packet

Generated at: 2026-06-19T16:41:55.644Z

## Git State

- Branch: `main`
- HEAD: `11fab2addc75`
- Against `origin/main`: behind 0, ahead 0

## What Happened

- Production credential rotation completed on 2026-06-19 without downtime. `CRON_SECRET`, the dataset API token, and seven unique active Dify app/workflow token groups were replaced in Coolify; the healthy application container was recreated, the host crontab was updated, new credentials were verified, old cron auth returns `401`, and old Dify tokens were revoked after cache invalidation. Secret values were not added to Git or project memory.
- Production automation audit on 2026-06-19 proved the host cron was firing, but no usable new crawl had reached the knowledge pipeline since 2026-06-09. The file queue reported 162 jobs (84 pending, 25 failed, 53 completed) while the Postgres queue held 49 jobs (32 pending, 17 completed), exposing `dual` storage drift. The crawl cron was subsequently reduced from every 5 minutes to every 6 hours; generation remains every 20 minutes while it stays low-cost/`noop`.
- Guarded production crawl worker committed as `748f8a2`. It consumes the orchestrated queue, uses primary-to-backup Crawl4AI failover, uploads only through `src/lib/dify-client.ts`, blocks private targets, processes at most one job by default, and stays disabled unless `ENABLE_CRAWL_WORKER=true`. Authenticated `?dry_run=true` previews one pending job without changing queue state or consuming crawl/embedding budget. Production must set `FPV_CRAWL_QUEUE_STORAGE_MODE=postgres` before enabling the worker; global `FPV_STORAGE_MODE` remains `dual` because the Postgres publication shadow has 109 records versus 117 committed artifacts.
- Production crawl recovery reached an end-to-end proof on 2026-06-19. Coolify runs global `FPV_STORAGE_MODE=dual`, queue-only `FPV_CRAWL_QUEUE_STORAGE_MODE=postgres`, and `ENABLE_CRAWL_WORKER=true`. Authenticated dry-run selected exactly one Postgres job without changing counts. A real Oscar Liang tuning source was crawled through the primary Crawl4AI service and indexed by Dify as document `292713d8-940d-45cd-b176-34e3a27b6d4b`; the document API reported `indexing_status=completed`. A GetFPV category URL blocked by Cloudflare was classified failed without consuming Dify budget. The backup Crawl4AI route still returns `502` and remains a resilience follow-up.
- Topic-aware fallback covers provide 12 topic families plus one generic safety-net asset under `public/images/fallbacks/`. Homepage and article covers transition `original -> topic -> generic` without mutating persisted artifacts, and explicit article covers are not overwritten by section/gallery images.
- The stale Cloudflare Pages GitHub workflow was converted to a root-level Node 20/pnpm validation workflow on 2026-06-19. It now runs contract, security, quality, route, content, metadata, media, handoff, type, lint, and build gates; production deployment remains owned exclusively by the existing Coolify application.
- Affiliate and social/video implementation was reconciled onto current `main` and committed as `2b025b1` on 2026-06-19. Product reviews require evidence, testing method, product relationship, timestamp, and Hazar Volga Ekiz approval; cron stores them as drafts instead of publishing. Non-review content remains autonomous but source/claim/duplicate/metadata/link/disclosure gates can hold it in `generated` state.
- Public trust and SEO remediation completed locally: unsupported affiliate/manual-testing claims were removed, `/advertise#product-evaluation` defines supplied/loaned-product terms, article trust/disclosure UI is present, legacy unapproved scores are hidden, nine 67-121 word commercial artifacts are excluded from commercial hubs/sitemap/indexing, and primary article metadata now includes canonical, robots, Open Graph, Twitter, and Article JSON-LD.
- Current source-level affiliate readiness score is **81/100**, up from the audited **52/100** baseline. This is conditionally ready, not permission for broad applications. Production/mobile QA, commercial source backfill, CTA destination validation, and at least one genuine editor-approved review remain application gates.
- Social/video system is committed locally: deterministic fact packs, seven platform-specific variants (Facebook, Instagram, YouTube Shorts, TikTok, X, Reddit, LinkedIn), idempotent social job storage, protected admin dry-run API, Dify video-director adapter through `src/lib/dify-client.ts`, strict manifest validation, and private-by-default YouTube resumable upload adapter guarded by `ENABLE_YOUTUBE_UPLOAD=true`.
- A 45-second English DJI O3 versus Walksnail Short MVP was rendered and visually verified at 1080x1920/30fps with TTS narration. Generated MP4, frame PNGs, and redundant AIFF remain recoverable in rescue commit `592912a`; `main` keeps the manifest, HTML composition, narration WAV/text, social copy, and deterministic render scripts so the output is reproducible without committing render caches.
- Fresh release gates passed after reconciliation: security audit (768 tracked files), recent-code quality, both cover regressions, editorial governance, social/video contracts, TypeScript, full lint, route audit (115 route files), content audit (117 artifacts), dry-run content smoke, metadata regression/audit, media policy, `git diff --check`, and a 120-page production build. Build-time PostgreSQL DNS was unavailable outside Coolify and correctly fell back to committed content.

## Current Blockers

- Plan a coordinated Git-history rewrite and force-push window so all collaborators can re-clone safely.
- Keep `pnpm security:audit` in the local release gate to prevent tracked credential values, hardcoded Dify tokens, and developer-specific audit paths from returning.
- Deploy and verify the crawl-store hotfix that removes the nonexistent `max_retries` read, writes JSONB metadata atomically, surfaces DB update failures, and accounts only for the 8,000 uploaded characters.
- Repair and validate the backup Crawl4AI route, which returned `502` during the production proof.
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

- `/Users/hazarekiz/Projects/fpv-autoblog-v2/fpvlovers-frontend-websitesi/PROJECT_MEMORY.md`
- `/Users/hazarekiz/Projects/fpv-autoblog-v2/fpvlovers-frontend-websitesi/NEXT_ACTIONS.md`
- `/Users/hazarekiz/Projects/fpv-autoblog-v2/fpvlovers-frontend-websitesi/docs/superpowers/plans/2026-06-18-post-analysis-gap-closure.md`

## Copy-Paste Continuation Prompt

```text
Continue FPVLovers from the latest handoff packet.

Read PROJECT_MEMORY.md, NEXT_ACTIONS.md, and docs/handoff/latest.md first.
Start with the recorded Next Move. Inspect current Git state before acting, keep credential rotation, Git-history cleanup, push, deploy, and live-verification boundaries explicit, and update project memory after obtaining fresh evidence.
```
