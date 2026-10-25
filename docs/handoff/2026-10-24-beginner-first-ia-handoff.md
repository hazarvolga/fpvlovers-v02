# FPVLovers — Beginner-First IA Redesign, Duplicate Cleanup & Handoff

**Date:** 2026-10-25 (all post-IA & Dify initialization steps completed before break)
**Repository:** `https://github.com/hazarvolga/fpvlovers-v02` (`main` @ `bf78ca8` + docs update)
**Production:** `https://fpvlovers.com.tr` — deployed and verified after every phase (`/api/ready` = `ready`)
**Coolify app:** `fpvlovers-web` (`jnlhgqmjnqwpdgefsoskew5n`) in project `FPV Lovers` (`whqhxcqeyjvps3pdurplad1c`)
**Previous handoff:** `docs/handoff/2026-10-24-contabo-single-node-consolidation-handoff.md` (infra move + Dify setup, live)

---

## 1. Why this work happened

The owner asked for a brutal UX/IA review of the live site from a **total FPV beginner** perspective after the Contabo migration. Main findings (all addressed below unless marked open):

- 7 top-level nav items with double labels ("Learn / Get Started"), labels pointing to the wrong place ("News" -> a simulated telemetry HUD, "Build" -> academic research, "Fly" -> `/archive`), Race duplicated in two places.
- Buyer Guides / Reviews / Comparisons (the beginner's main question, and the affiliate revenue path) were missing from the desktop nav.
- At least 7 parallel taxonomies for 163 articles; `metadata.difficulty` / `audience` existed but were never used for navigation.
- "Start Learning" led to a gamified roadmap ("Guest Operator", "Authorize Session", LOCKED modules, soldering and KV math in Phase 0).
- Military/HUD tone everywhere; defensive homepage copy ("0 fake event dates", "not an internal dashboard").
- Server-rendered cover images showed tofu boxes (no fonts in the Alpine image).
- 10 duplicate articles; 14 covers taken from store review widgets (customer photos).

## 2. Owner decisions (binding for future work)

1. **English is the primary language** (global market). Turkish is secondary and will be added gradually. `lang="en"` stays.
2. **No v03 rewrite.** Redesign happens inside v02, page by page, each phase deployed and verified separately.
3. **Pilot Pulse is removed** (simulated telemetry page). Revisit only if the owner asks.
4. **Duplicates:** keep the richer/higher-quality article, remove the weaker one completely, 301 the old URL.
5. **Coolify-native only** (from the previous handoff): no host crontabs or ad-hoc containers; only `fpvlovers-web` is redeployed for app changes. Never touch AffeXAI Cortex or Bimmetraj.

## 3. What shipped (all on `main`, all deployed and verified live)

| Commit | Scope |
| :--- | :--- |
| `19f0843` | **Phase A — nav + homepage.** 5 journey groups: Start Here, Gear, Guides, Tools, Racing & News (`src/lib/navigationData.ts`). Pilot Pulse page/widget deleted, 301 `/pilot-pulse` -> `/racing/news`. Legacy `/category`, `/category/parts`, `/category/software` deleted with 301s. Homepage hero CTAs "New to FPV? Start Here" / "Choose Your Gear", "Where are you in your FPV journey?" cards, defensive copy removed. Mobile bottom bar = Home/Start/Gear/Search/Tools; collapsible mobile menu groups; compact cookie strip. Plain-language account menu. **Dockerfile installs `fontconfig ttf-dejavu`** (sharp needs fonts to render cover `<text>`). `hub-*` covers render artwork-only. |
| `3726758` | Docs: Contabo consolidation handoff committed. |
| `be064a2` | **Phase B — Start Here + Guides.** `/academy` = linear six-step path (understand FPV -> simulator -> radio -> first drone/goggles -> rules & battery safety -> first flight), unlocked, no account; article links resolved from published content at render time. New `/guides` hub with level (`?level=`) and topic (`?topic=`) filters. `src/lib/content-taxonomy.ts` maps 14 source categories to 7 reader groups (display-level only). `src/components/ui/level-badge.tsx`. Article breadcrumbs -> `/guides?topic=…`. Roadmap repositioned as optional "Progress Tracker" (guests see all modules open; "FQP" typo fixed). BackToTop no longer covers the mobile bar. |
| `0fd2024` | Docs: NEXT_ACTIONS for phases A/B. |
| `01a3d37` | **UI fixes.** Cover excerpt truncated to fit (52 chars). Article cover caption no longer overlapped by the badge row. Homepage level badges via slug lookup in `HomePage` (**`toHomepageCard` deliberately untouched — GitNexus impact HIGH**). Image harvest `HOST_DENYLIST` now blocks review-widget hosts (judge.me, Yotpo, Stamped, Loox, Okendo). |
| `3d40460` | **Duplicate cleanup.** `src/lib/content-automation/retired-articles.json` maps 10 retired slugs -> canonical. `shouldExposePublishedArtifact` (content-reader, impact LOW) hides retired slugs from every list/search/sitemap/slug lookup; `next.config.ts` 301s `/article/<retired>` -> canonical. Repo JSON/MD deleted, `scripts/copy-legacy-slugs.ts` (which created 7 pairs) deleted, roadmap/glossary/Start Here/archive refs and 40 in-content links repointed. |
| `6e26bd5` | Docs: NEXT_ACTIONS cleanup results. |
| `ee41128` | **Cover repair, metadata backfill & admin cleanup.** Repaired all broken `judgeme.imgix.net` covers, empty covers, and 18 bad external logo/portrait covers (`146 unique primary covers`, `0` violations in `pnpm media:audit`); backfilled `metadata.difficulty` and `metadata.audience` across all `153/153` published articles; removed hardcoded mock data (`subscribersData`, `usageVsGrowthData`, `affiliateData`) and Turkish UI leftovers from `src/app/admin/page.tsx`.Synced to `fpvlovers-postgres` and deployed live. |
| `48e2e5e` | **Gemini Model Deprecation Guard (`src/lib/llm-models.ts`).** Centralized model lifecycle registry with `gemini-flash-latest` primary alias, automatic fallback chain, `ntfy.sh/fpv-rag-alerts` deprecation notification, and `/api/admin/health` lifecycle check. |
| `ae85c54` | **Dify v1.14.0 live initialization & 9 RAG datasets seeded.** Created all 9 RAG datasets with canonical UUIDs, seeded 33 foundational documents (`indexing_status = completed` in Qdrant, `9/9 PASS` live retrieval), imported 9 workflows + 2 chat apps, and wired all 23 `DIFY_*` tokens into `fpvlovers-web` (`/api/ready` -> `status: "ready"`). |
| `bf78ca8` | **Dify v1.14.0 workflow node schema alignment & `apps.workflow_id` fix.** Linked `apps.workflow_id` for all 9 workflow/advanced-chat apps in `dify-db` and updated `parameter-extractor`, `knowledge-retrieval`, and `http-request` schemas across 126 nodes (`0` validation errors; all 11 Explore apps return `HTTP 200` and `Drone Build Recommender` verified live end-to-end). |

**Live verification (2026-10-24 ~16:05):** `/`, `/academy`, `/guides`, `/guides?level=beginner`, `/academy/roadmap`, `/search`, article pages, `/api/health` = 200; all 10 retired slugs = 308 -> canonical; `/pilot-pulse` = 308 -> `/racing/news`; `/category*` = 308; sitemap = **196 URLs** (was 206), no retired slugs; search shows **153 published articles** (was 163); cover text renders readable.

## 4. New/changed building blocks (where to look)

- `src/lib/navigationData.ts` — single source for desktop nav, mobile menu and footer groups.
- `src/lib/content-taxonomy.ts` — `GUIDE_GROUPS`, `getGuideGroup(category)`, `READER_LEVELS`, `toReaderLevel()` (`expert` -> Advanced).
- `src/components/ui/level-badge.tsx` — renders nothing when difficulty is unknown.
- `src/app/guides/page.tsx` — server-rendered filters via URL params.
- `src/app/academy/page.tsx` — Start Here steps; `articleSlugs` are priority lists, missing slugs are skipped.
- `src/lib/content-automation/retired-articles.json` — add future duplicates here (both the filter and the 301s read it).
- `src/app/api/content/media/cover/[slug]/route.ts` + `buildCoverImageSvg(..., artworkOnly)`.

## 5. Completed vs. Open items (updated 2026-10-25)

1. **DONE — Google Search Console:** `https://fpvlovers.com.tr/sitemap.xml` (196 URLs) submitted by owner.
2. **DONE (`ee41128`) — Review-widget & broken covers repaired:** All `judgeme.imgix.net`, empty, and logo/portrait covers across all 153 articles were repaired and synced to production (`pnpm media:audit` passes with `146 unique primary covers`, `0` violations).
3. **DONE (`ee41128`) — Missing metadata backfilled:** `metadata.difficulty` and `metadata.audience` are now populated on `153/153` published articles (`36 beginner`, `108 intermediate`, `9 advanced`); `pnpm metadata:test` passes.
4. **DONE (`ae85c54`, `bf78ca8`) — Dify v1.14.0 & Content Pipeline Live:** `https://dify.affexai.tr` is fully initialized with `gemini-flash-latest` and `gemini-embedding-001`, all 9 RAG datasets (`33` indexed documents in Qdrant, `100% PASS` retrieval), 9 published workflows + 2 chat apps (`11/11` Explore apps working), and all 23 `DIFY_*` tokens active in Coolify (`https://fpvlovers.com.tr/api/ready` -> `status: "ready"`).
5. **DONE (`ee41128`) — Admin panel review:** Removed hardcoded `subscribersData`, `usageVsGrowthData`, `affiliateData`, and duplicate Sponsors form from `src/app/admin/page.tsx`; translated remaining Turkish admin strings to English.
6. **NEXT (Phase C — when resuming after break):**
   - Check output of the Coolify nightly scheduled tasks (`FPVLovers Nightly Crawler` and `FPVLovers Early Morning Content Gen`) and verify `/racing/news` feed population.
   - Plan and implement the secondary Turkish UI layer (`i18n` route/SEO strategy first), translate top beginner guides, and publish source-backed SHGM regulations content.
7. **Deferred / Low Priority:**
   - Retired duplicate rows in `fpvlovers_app.published_content` / `published_articles_shadow` remain hidden by `shouldExposePublishedArtifact` and 308-redirected; purge only with a backup and explicit owner approval.
   - Root `components/` legacy dir and `fpvlovers-live-site-code/` copy remain untouched tech debt; `isEditorialImageCandidate` (crawl-image-match) is GitNexus **CRITICAL** — avoid editing without approval.

## 6. Operational lessons from this session

- **Owner's Mac:** no `npm`, use `pnpm dev`. The linked Linux shell cannot run the repo's macOS `node_modules` (esbuild/sharp/swc are darwin binaries) — build/test in a clean clone instead: `npm ci --legacy-peer-deps --ignore-scripts && npx next build` (Dockerfile uses `--legacy-peer-deps`).
- **Pushing:** the repo remote is SSH (`git@github.com:…`); direct `git push origin main` works on the owner's Mac.
- **Deploy:** Coolify (`https://coolify.affexai.tr`) manages `fpvlovers-web` (`jnlhgqmjnqwpdgefsoskew5n`). Builds take ~2–4 min.
- **GitNexus:** `npx gitnexus analyze` rewrites the GitNexus block in `CLAUDE.md` (and the git-excluded `AGENTS.md`) and drops skill folders under `.claude/skills/` + `.agents/skills/`. Revert `CLAUDE.md` with `git checkout -- CLAUDE.md` before committing if overwritten.
- **Impact results seen:** `toHomepageCard` HIGH, `listPublishedContent` HIGH, `isEditorialImageCandidate` CRITICAL, `shouldExposePublishedArtifact` / `categoryHref` / `buildCoverImageSvg` / layout components LOW. `detect-changes` reports "critical" for any homepage/layout change because many flows pass through them — check the changed-symbol list, not just the label.
- **Image caching:** after cover changes, `.next/cache/images` (next/image optimizer) and browsers (cover route sends `max-age=86400`) can show old images for a while.

## 7. Copy-paste prompt for the next agent

```text
FPVLovers (fpvlovers.com.tr) — continue from the 2026-10-25 handoff.
Read first, in order:
1. docs/handoff/2026-10-24-contabo-single-node-consolidation-handoff.md
2. docs/handoff/2026-10-24-beginner-first-ia-handoff.md
3. NEXT_ACTIONS.md (top section)
4. PROJECT_MEMORY.md ("Current Known State")
Rules: Always respond to the user in Turkish while keeping site/admin UI English-first; Coolify-native only (never touch AffeXAI Cortex or Bimmetraj); do not read/log .env; run GitNexus impact before editing symbols and warn on HIGH/CRITICAL.
All post-consolidation and Dify initialization steps (Steps 1-6) are COMPLETE and LIVE (/api/ready = ready, 9/9 RAG datasets seeded, 11/11 Dify apps working).
Next step (Phase C): inspect the output of the Coolify nightly crawler/content-gen scheduled tasks, verify /racing/news population, and plan Phase C (Turkish secondary language layer & SHGM content).
```
