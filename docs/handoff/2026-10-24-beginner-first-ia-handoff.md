# FPVLovers — Beginner-First IA Redesign, Duplicate Cleanup & Handoff

**Date:** 2026-10-24 (session paused ~16:10 TSİ)
**Repository:** `https://github.com/hazarvolga/fpvlovers-v02` (`main` @ `6e26bd5` + this handoff commit)
**Production:** `https://fpvlovers.com.tr` — deployed and verified after every phase
**Coolify app:** `fpvlovers-web` (`jnlhgqmjnqwpdgefsoskew5n`) in project `FPV Lovers` (`whqhxcqeyjvps3pdurplad1c`)
**Previous handoff:** `docs/handoff/2026-10-24-contabo-single-node-consolidation-handoff.md` (infra move, still valid)

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

**Live verification (2026-10-24 ~16:05):** `/`, `/academy`, `/guides`, `/guides?level=beginner`, `/academy/roadmap`, `/search`, article pages, `/api/health` = 200; all 10 retired slugs = 308 -> canonical; `/pilot-pulse` = 308 -> `/racing/news`; `/category*` = 308; sitemap = **196 URLs** (was 206), no retired slugs; search shows **153 published articles** (was 163); cover text renders readable.

## 4. New/changed building blocks (where to look)

- `src/lib/navigationData.ts` — single source for desktop nav, mobile menu and footer groups.
- `src/lib/content-taxonomy.ts` — `GUIDE_GROUPS`, `getGuideGroup(category)`, `READER_LEVELS`, `toReaderLevel()` (`expert` -> Advanced).
- `src/components/ui/level-badge.tsx` — renders nothing when difficulty is unknown.
- `src/app/guides/page.tsx` — server-rendered filters via URL params.
- `src/app/academy/page.tsx` — Start Here steps; `articleSlugs` are priority lists, missing slugs are skipped.
- `src/lib/content-automation/retired-articles.json` — add future duplicates here (both the filter and the 301s read it).
- `src/app/api/content/media/cover/[slug]/route.ts` + `buildCoverImageSvg(..., artworkOnly)`.

## 5. Open items (priority order)

1. **Google Search Console:** submit `https://fpvlovers.com.tr/sitemap.xml` (196 URLs) — owner action.
2. **Review-widget covers (12 live articles)** still show customer photos from `judgeme.imgix.net` (e.g. `first-hover-training` shows a helicopter). Fix with the existing cost-free `localOnly` semantic cover repair: **dry-run first, show the slug->cover distribution, get explicit owner approval, then `dryRun: false`**, verify persisted JSON + asset HTTP 200 + live pages. Combine with the paused **38-record source-cache repair** (see `NEXT_ACTIONS.md` "PAUSED HERE (2026-08-14)"). The endpoint needs admin session/cron secret — run it with the owner from the admin panel.
3. **Missing metadata on recent (July) articles:** no `metadata.difficulty/audience`, so no level badges and they never match Guides level filters. Pre-existing `metadata:test` failure has the list.
4. **Content pipeline is idle:** fresh Dify at `https://dify.affexai.tr` is not initialized (owner: `/install`, Gemini key in Dify, 9 datasets, import `dify_workflows/*.yml`, then update `DIFY_API_KEY` / `DIFY_APP_KEY` in Coolify). Until then nightly generate produces nothing and `/racing/news` stays empty (0 articles).
5. **Admin panel review** (owner request, deferred): `src/app/admin/page.tsx` Pilot Registry + usage chart are hardcoded demo data; `affiliateData` unused.
6. **Phase C (later):** Turkish UI layer (i18n, route/SEO strategy needed first), translate top beginner guides, Turkey-specific SHGM content (no hallucination — source-backed only), real news feed.
7. **Retired duplicates in production storage:** rows in `fpvlovers_app.published_content` / `published_articles_shadow` and files in the `/app/content/published` volume still exist (hidden by code). Purge only with a backup and explicit approval.
8. **Pre-existing failing tests on `main`:** `metadata:test`, `public:editorial-test` (verified identical before/after this work). `commercial:readiness-test` passes again after link repointing.
9. Known tech debt: root `components/` legacy dir and `fpvlovers-live-site-code/` copy duplicate `src/`; `isEditorialImageCandidate` (crawl-image-match) is GitNexus **CRITICAL** — avoid editing without approval.

## 6. Operational lessons from this session

- **Owner's Mac:** no `npm`, use `pnpm dev`. The linked Linux shell cannot run the repo's macOS `node_modules` (esbuild/sharp/swc are darwin binaries) — build/test in a clean clone instead: `npm ci --legacy-peer-deps --ignore-scripts && npx next build` (Dockerfile uses `--legacy-peer-deps`).
- **Pushing:** the repo remote is SSH (`git@github.com:…`); the linked shell has no SSH keys. Working path: `git bundle create x.bundle <origin/main>..main` on the device -> fetch the bundle in a cloud clone -> fast-forward push over HTTPS -> `git update-ref refs/remotes/origin/main <sha>` locally.
- **Deploy:** Coolify auto-deploy from GitHub is **off** for `fpvlovers-web`; the owner presses **Deploy** (Restart does not rebuild). Builds take ~3–6 min.
- **GitNexus:** `npx gitnexus analyze` rewrites the GitNexus block in `CLAUDE.md` (and the git-excluded `AGENTS.md`) and drops skill folders under `.claude/skills/` + `.agents/skills/`. Revert `CLAUDE.md` with `git checkout -- CLAUDE.md` before committing. Deleting index lock files needs delete permission on the folder.
- **Impact results seen:** `toHomepageCard` HIGH, `listPublishedContent` HIGH, `isEditorialImageCandidate` CRITICAL, `shouldExposePublishedArtifact` / `categoryHref` / `buildCoverImageSvg` / layout components LOW. `detect-changes` reports "critical" for any homepage/layout change because many flows pass through them — check the changed-symbol list, not just the label.
- **Image caching:** after cover changes, `.next/cache/images` (next/image optimizer) and browsers (cover route sends `max-age=86400`) can show old images for a while.
- **Content storage:** production reads content from repo-seeded files in the persistent volume **and** Postgres; repo edits to `content/published/*.json` do not reach the live volume. Use code-level filters/redirects or the admin APIs for production content changes.

## 7. Copy-paste prompt for the next agent

```text
FPVLovers (fpvlovers.com.tr) — continue from the 2026-10-24 handoff.
Read first, in order:
1. docs/handoff/2026-10-24-beginner-first-ia-handoff.md
2. docs/handoff/2026-10-24-contabo-single-node-consolidation-handoff.md
3. NEXT_ACTIONS.md (top two sections)
4. PROJECT_MEMORY.md ("Current Known State")
Rules: English-first site; Coolify-native only (only redeploy fpvlovers-web; never touch AffeXAI Cortex or Bimmetraj);
do not read/log .env; run GitNexus impact before editing symbols and warn on HIGH/CRITICAL; production data changes
(cover repair, deletes) need dry-run + explicit owner approval; push only when the owner asks, the owner presses Deploy.
Suggested next step: with the owner, run the localOnly cover repair dry-run for the 12 review-widget covers plus the
paused 38 source-cache records, then review the admin panel.
```
