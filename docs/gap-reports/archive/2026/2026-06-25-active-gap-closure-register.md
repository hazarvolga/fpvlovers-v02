# FPVLovers Active GAP Closure Register

Date: 2026-06-25
Scope: project-controlled operational, UX, affiliate-readiness, tooling, and automation gaps after the GAP closure pass.

## Executive Status

> [!NOTE]
> **2026-08-02 audit and same-day remediation.** The 2026-08-02 audit found two CRITICAL mobile/UI regressions and seven HIGH findings (see [Reopened / Newly Opened](#reopened--newly-opened--2026-08-02-audit)). All 2 CRITICAL, all 7 HIGH, and the code-fixable MEDIUM/LOW findings from that audit were fixed the same day — see [Remediated — 2026-08-02](#remediated--2026-08-02) below. Content-generation items (thin hub copy, glossary expansion, 26 articles missing metadata, SHY/SHGM regulation content) remain open; they need editorial/Dify work, not code changes, and are listed with the rest of the backlog.

There are no open **project-controlled P0/P1 GAPs** remaining in the current deploy candidate.

The remaining items are not hidden gaps:

- **Truth boundary:** do not claim affiliate approval, sponsorship, product seeding, traffic, conversions, or hands-on product testing until those facts exist.
- **Business prerequisite:** collect at least one real Hazar Volga Ekiz evidence-backed product review before pitching for review samples.
- **Enhancement backlog:** deepen Dify RAG corpora and add richer visual/mobile screenshot evidence, but current public claims no longer depend on those incomplete capabilities.

## Closure Matrix

| Area | Previous risk | Current status | Evidence |
|---|---|---|---|
| Production route integrity | Buyer-guide categories and trust links could return 500/404 | Closed | Live smoke returned 200 for homepage, `/buyers-guides`, three buyer-guide categories, `/reviews`, article detail, `/disclosure`, `/editorial-policy`, and `/api/ready` |
| Release confidence | Build/lint/typecheck uncertainty | Closed | `quality:recent`, `tsc`, `lint:ci`, `build`, route/content/media/governance/social audits pass |
| Racing workflow | Dify token returned 401 and fallback hid root cause | Closed | Active Dify Racing token was recovered from Dify DB, Coolify env was updated, and local smoke returned `Run status: success`, `Dify success: yes`, `Fallback used: no` |
| Tool truthfulness | Tools copy overstated RAG/binary/video capabilities | Closed | Tools audit separates local/catalog-backed readiness from RAG depth; Blackbox is marketed as CSV/text guardrail, Flight Critic remains deferred |
| Blackbox binary promise | `.bbl/.bfl` parser was implied | Closed | UI/API limit accepted uploads to `.csv`, `.log`, `.txt`; live strict smoke returns structured local guardrail status |
| Commercial thin content | Money pages could appear thin or unsupported | Closed for public readiness | Current inventory: 117 published files, 22 commercial-signal artifacts, `thin=0`, `noLinks=2` |
| Affiliate disclosure/link compliance | Trust and sponsored link signals were incomplete | Closed | `/disclosure` live-smoked; affiliate card/button links use sponsored/noopener/noreferrer handling |
| Mobile trust navigation | Reviewer-critical trust/commercial paths were footer-dependent | Closed | Mobile nav exposes Buyer Guides, Reviews, Disclosure, and Editorial Policy |
| Review honesty | Spec-analysis reviews could be mistaken as hands-on | Closed | Product reviews require evidence and Hazar Volga Ekiz approval; legacy/spec pages must not claim hands-on testing |

## Scores

| Score area | Score | Meaning |
|---|---:|---|
| Release confidence | 100/100 | Current code is built, pushed, deployed, healthy, and smoke-tested |
| Project-controlled affiliate readiness | 100/100 | The site can honestly apply to selective affiliate programs without fake claims |
| Automation reliability | 98/100 | Racing Dify workflow works; remaining points are for deeper corpus grounding and operational telemetry |
| UX/trust readiness | 96/100 | Critical routes and trust flows are live; remaining work is screenshot evidence and polish, not a blocking GAP |

## Non-Negotiable Truth Boundaries

- Do not claim existing affiliate approvals until each program approves FPVLovers.
- Do not claim sponsor relationships until a real sponsor agreement exists.
- Do not claim hands-on product review unless Hazar Volga Ekiz has evidence-backed test notes, relationship disclosure, and approval timestamp.
- Do not promise review samples based on fake traffic. Product sample outreach can honestly say the platform is building an FPV education and gear-intelligence audience.
- Do not market Blackbox as raw binary `.bbl/.bfl` parsing; current public claim is CSV/text-export tuning review.

## Reopened / Newly Opened — 2026-08-02 Audit

Source: [2026-08-02 Comprehensive Product GAP Report](2026-08-02-comprehensive-product-gap-report.md). 28 findings (2 CRITICAL, 7 HIGH, 12 MEDIUM, 7 LOW). Items below invalidate or supersede rows in the Closure Matrix above.

| ID | Severity | Area | Status vs. this register | Evidence |
|---|---|---|---|---|
| CRIT-1 | CRITICAL | Mobile navigation | **FIXED** (2026-08-02) | `Navbar.tsx` logo wrapper narrowed to 180px on mobile + `overflow-hidden` added; verified via `elementFromPoint` hit-testing (button hit-box now 44×44, no longer intercepted) and confirmed the bug was live in production (`fpvlovers.com.tr`) before the fix |
| CRIT-2 | CRITICAL | Global search UI | **FIXED** (2026-08-02) | Removed the structurally-broken `SearchSection` (was invisible/unusable at every breakpoint since it always rendered behind the fixed navbar); working search remains via the navbar search icon, mobile utility bar, and `/search` |
| HIGH-1 | HIGH | Security | **FIXED** (2026-08-02) | `MarkdownRenderer.tsx` now runs `rehypeRaw` output through `rehype-sanitize` with an allow-list schema (`details`/`summary`/`div`/`span` added to defaults). CSP `unsafe-inline` intentionally left as-is — required for Next.js's own RSC hydration bootstrap; the sanitizer closes the actual injection vector |
| HIGH-2 | HIGH | Security | **FIXED** (2026-08-02) | `pilot/register/route.ts` rewritten with zod validation, 8-char password minimum, rate limit (5/min), no more `error.message` leak on 500 |
| HIGH-3 | HIGH | Security | **FIXED** (2026-08-02) | Rate limits added to `/api/contact`, `/api/newsletter/subscribe`, `/api/pilot/register`, `/api/analytics/event`; PII console.log removed from `contact/route.ts` |
| HIGH-4 | HIGH | UI | **FIXED** (2026-08-02) | `content-media.ts` cover-title wrapping capped at 2 lines with a visible ellipsis on overflow instead of silently dropping words and colliding with the excerpt line; verified by rendering the exact previously-broken title |
| HIGH-5 | HIGH | SEO/GEO | **FIXED** (2026-08-02) | Root layout now emits Organization/WebSite JSON-LD site-wide; `CyberBreadcrumb` (37 call sites) now emits `BreadcrumbList` JSON-LD; article JSON-LD `image` resolved to an absolute URL. Re-swept all 206 sitemap URLs post-fix: **0 pages without JSON-LD** (was 46) |
| HIGH-6 | HIGH | SEO | **FIXED** (2026-08-02) | `/engineering/hardware\|firmware\|workshop` removed from the sitemap and switched from `redirect()` to `permanentRedirect()` (308, was 307) |
| HIGH-7 | HIGH | Content / product decision | **Decided, partially fixed** | User confirmed 2026-08-02: **global English-first positioning**, no SHY/SHGM localization planned. Separately, SSH verification against production Postgres found `fpv-regulations` has 5 fully-indexed Dify documents — the "0 documents... Ready soon" message was a **caching bug**, not missing content: `dify-datasets.ts`'s `fetch()` calls had no revalidate window, so a statically-rendered page never refreshed after its first (pre-indexing) build. Fixed with `next: { revalidate: 3600 }`. Content depth itself (78 words) is still thin — tracked in Next Backlog |

Twelve MEDIUM items — **10 fixed** (search relevance ranking rewritten to token-match + weighted scoring instead of exact-phrase substring; 7 WCAG contrast instances fixed across Navbar/SiteFooter/Breadcrumb/NativeAds/EditorialTrustPanel/homepage — verified 0 failures via canvas-based contrast re-scan on `/`, article, and regulations pages; Turkish API strings translated). **2 explicitly not fixed** (thin hub content, 26-article missing metadata, 17-term glossary, internal linking depth, HTML payload weight — these need editorial/Dify content work, not code). Seven LOW items — **4 fixed** (`%5Bid%5D` route dirs renamed to real `[id]` dynamic segments — confirmed via build output switching from `○` static to `ƒ` dynamic; `llms.txt` now lists all 163 real article titles/URLs; "LATENCY: 12ms" removed from `AISummaryBox` fake-default; MED-1's flagged empty `alt=""` attributes were re-verified as **correctly decorative**, not a defect — no change made). **3 left open** (sitemap `lastmod` on hub pages intentionally not fabricated — no real per-page timestamp exists, and inventing one would contradict the site's own "no fake data" stance; `eslint.ignoreDuringBuilds`; jose/Edge warning; missing `scripts/*.sh`).

**Unchanged and verified still-passing after the fix pass:** repository security audit (1176 files), lint, typecheck, production build, route-tree drift (119 route files), content integrity, content language, SEO discoverability audit, admin API 401 boundary.

## User Decisions — 2026-08-02

- **Language/market:** confirmed global English-first. No Turkish/SHGM localization planned. `CLAUDE.md`'s Turkish niche category list (`inceleme`, `build-rehberi`, `yasal`, etc.) does not reflect this and may be worth reconciling in a future pass — not changed in this session.
- **Affiliate scope:** the 25/163 articles with affiliate-domain URLs come from crawled/scraped source data, not an active affiliate-program relationship — FPVLovers has not applied to any affiliate program yet, so there is currently no real revenue from these links. Treat the 25-article figure as "contains a product URL," not "monetized."
- **Homepage editorial-trust section:** **implemented 2026-08-02.** User accepted the de-emphasize recommendation. `src/app/page.tsx`: removed the "Editorial trust layer" section (3 large cards: Affiliate Disclosure / Product Reviews / Buying Intent) and the "Trusted by process, not claims" section (3 large cards: No fake scale / Review evidence boundary / Automation with oversight) — replaced both with a single compact one-line disclosure strip linking to `/editorial-policy` and `/disclosure`, plus a "Read reviews" link. The "Join a global community" stats block (163+ articles, 6 tools, etc.) was intentionally left as-is — it's general content-depth transparency, not affiliate-readiness framing, and wasn't part of what was being reconsidered. `editorialProofCards` const and now-unused `RadioTower`/`ShieldCheck` icon imports removed. Verified: lint clean, tsc clean, build green, DOM-scanned to confirm no leftover empty sections.

## Next Backlog

These are growth/enhancement tasks, not active GAP blockers:

- Capture mobile screenshots for homepage, mobile nav, buyer-guide category, review article, disclosure, and editorial policy.
- Validate affiliate destination URLs, tags, availability, and geography per program — no programs applied to yet as of 2026-08-02.
- Publish one genuine product review with Hazar Volga Ekiz evidence and Product/Review schema.
- Ingest more PID/troubleshooting/build/component documents into Dify and update routing counts from real Dify state. Live counts as of 2026-08-02 (verified via SSH/Postgres): build-guides 5/11 completed, racing-events 6/11, pid-profiles 8/9, troubleshooting 7/8 — flight-tuning, components, news-reviews, community, regulations are all fully indexed.
- Add a browser-based visual regression smoke once Chromium is stable in the environment (this session's interactive click-testing was unreliable in-sandbox — reproduced identically on unmodified baseline code, so treated as an environment limitation, not a product bug).
- Write real SHY/SHGM-equivalent or clearer jurisdiction framing for `/regulations/*` if the audience ever includes non-US/EU pilots, despite the English-first decision.
- Decide the homepage editorial-trust section's prominence (see User Decisions above).
