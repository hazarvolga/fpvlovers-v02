# FPVLovers Brutal Score 10/10 Closure Strategy

**Date:** 2026-07-14  
**Scope:** Homepage content presentation report, wider public UX system, affiliate readiness, and production operations.  
**Rule:** A score reaches 10/10 only when the claim is backed by an automated check, a route-level or browser-level observation, and production evidence. A design opinion alone cannot close a score.

## Executive Truth

The homepage bottleneck identified in the report is now closed in production code commit `8737bf5` (source implementation commit `72d08fe`). Live verification shows six article cards, a visible `Browse all` action, `Editorial index · 117 published`, 284px mobile cards at 390px viewport width, and no horizontal overflow. This raises the homepage content gateway materially.

The project is **not yet 10/10 overall**. The remaining gap is no longer “there is content but the homepage hides it”. The remaining gap is evidence, consistency, and operational proof: public dashboard language and scrolling blur were reduced in the live shell, but a formal shared card contract and full accessibility baseline are still open; ten commercial pages need enrichment, a genuine hands-on review does not yet exist, and crawl/embedding debt still requires controlled operations.

## Closure Update — 2026-07-14

The following gates are now evidenced rather than planned:

- Commit `5eb2fac` is live in Coolify deployment `hk08wc0skcoksw04coww8848`. Public search context uses editorial language, commercial hubs expose evidence labels, `.fpv-public-panel` no longer uses scrolling `backdrop-filter`, and reduced-motion handling covers the remaining decorative animations. Live DOM verification found six latest-content cards, a visible `Browse all` CTA, `Editorial search`, no legacy `LINK ACTIVE`/`SYS.SCANNER: STANDBY` labels, and no inspected viewport overflow.
- Commit `4482d5b` adds `npm run production:smoke` and `npm run commercial:readiness-test`. The live smoke suite passed 7/7: homepage, health, readiness, robots, sitemap, admin page auth, and admin API auth. The commercial suite passed all 19 commercial artifacts with a hard gate of 600+ body words, two internal article links, disclosure, and review evidence/testing contracts.
- Read-only production queue observation reports `completed=39`, `failed=7`, `pending=3`, `throttled=0`. The three pending jobs are Oscar Liang sources and remain behind the embedding budget guard; the seven failed rows are terminal target/provider blocks and are not treated as crawler-service outages.

This update closes the controllable release, public-shell, and commercial-governance gaps. It does **not** claim the overall score is 10/10: the ten sub-1,200-word enrichment candidates, a genuine Hazar-approved hands-on review, a controlled real crawl window, a full route/accessibility matrix, and rollback rehearsal remain evidence-dependent.

## Scoreboard and Exit Gates

| Score area | Report baseline | Current verified state | 10/10 exit gate |
| --- | ---: | ---: | --- |
| Content availability | 8/10 | 8/10 | Inventory and production shadow parity stay within the documented tolerance; no stale publish jobs. |
| Homepage discovery | 3/10 | 9/10 | Six-card layout, visible archive CTA, mobile no-overflow, and a synthetic publish-to-homepage regression pass in CI and production. |
| Editorial hierarchy | 5/10 | 7/10 | Latest, editor picks, and commercial intent are separate jobs with shared card anatomy across homepage and hubs. |
| Desktop card usability | 4/10 | 8/10 | Visual baseline at 1440px confirms readable titles, no clipping, and stable layout under long FPV titles. |
| Mobile content flow | 5/10 | 8/10 | 360x800 and 390x844 Playwright checks pass for CTA visibility, focus order, tap targets, and no horizontal overflow. |
| Trust and honesty | 8/10 | 8/10 | Review evidence contract is enforced and one real product/evidence event is published without unsupported claims. |
| Affiliate conversion readiness | 5/10 | 7/10 | Ten enrichment pages, schema/CTA checks, source links, disclosure placement, and an honest application evidence pack pass. |
| Public visual system | 6/10 | 7/10 | Public telemetry language, blur scope, reduced-motion behavior, and commercial hub evidence labels are covered; shared card contract, contrast, and focus baselines remain. |
| Automation reliability | 6/10 | 7/10 | Four publishable non-review items/day is sustained for 14 days with zero stale jobs and bounded Dify/crawl failures. |
| Release confidence | 7/10 | 9/10 | All release gates, image-SHA verification, health/ready checks, rollback rehearsal, and post-deploy smoke pass. |

The current values are directional status, not marketing claims. Re-score after each gate using the evidence table below; never average away a P0 blocker.

## Workstreams

### P0 - Release and production proof

1. Keep `tsc`, `lint:ci`, `quality:recent`, route/content/metadata/media audits, editorial/social contracts, build, and `git diff --check` as required release gates.
2. Add a deploy smoke contract: `/api/health=200`, `/api/ready` reports `ready`, homepage and one route from each major hub return `200`, and the running image tag contains the deployed Git SHA.
3. Add a rollback rehearsal on Coolify using the immediately previous healthy image. Record start time, recovery time, and the exact image restored. Do not call release confidence 10/10 until this has been exercised once.
4. Add a synthetic publish test that creates an idempotent test artifact, calls the normal publish path, verifies `/` after revalidation, and cleans up the test row without deleting user data.

**Owner:** engineering/release.  
**Evidence:** CI run URL or log, route smoke output, Coolify image tag, rollback record, and production timestamp.

### P0 - Freshness and source-of-truth control

1. Keep the five-minute ISR contract and `revalidatePath('/')` on normal and idempotent publish paths.
2. Define one public archive-count source: merged published artifacts plus documented shadow policy. Emit the count in the homepage, archive metadata, and monitoring output from the same resolver.
3. Alert when the newest published shadow item is older than the newest committed/public artifact beyond the agreed threshold, or when the homepage count diverges from the resolver.

**Owner:** content platform.  
**Evidence:** freshness regression test, resolver snapshot, and a production synthetic check.

### P1 - Commercial and affiliate evidence

1. Enrich the ten commercial pages below 1,200 words with unique decision criteria, pros/cons, limitations, source links, internal links, disclosure placement, and a clear “who this is for” section. Do not pad word count.
2. Validate every commercial CTA destination in CI and run a production link smoke against the affiliate-safe redirect policy. Broken or unverified destinations fail the page.
3. Emit `Article` plus `Product`/`Review` JSON-LD only when the page has the corresponding evidence fields. A `spec-analysis` page must not imply hands-on testing, ownership, or a brand relationship.
4. Obtain one real product/evidence event. Hazar Volga Ekiz records product relationship, test method, date, images/measurements, limitations, and approval. Until then, keep review pages explicitly labeled `spec-analysis`.
5. Submit only after the application pack contains truthful audience, acquisition, compliance, and disclosure language. Never invent traffic, partnerships, or samples.

**Owner:** Hazar Volga Ekiz (product review editor) plus editorial/SEO.  
**Evidence:** page audit output, CTA status, JSON-LD snapshot, source links, and the signed evidence record.

### P1 - Public editorial visual system

1. Replace public `LINK ACTIVE`, `SYS.SCANNER`, and similar operational labels with editorial language. Keep telemetry vocabulary in tools, pilot surfaces, and admin only. **Completed for the homepage/search shell in `5eb2fac`; audit remaining public surfaces before marking the whole category closed.**
2. Define a shared `EditorialCard` contract for homepage, buyers guides, comparisons, and reviews: image ratio, category, date, title wrap, excerpt, reading time, trust slot, CTA, and empty/loading/error states.
3. Establish a deterministic display face only if licensing, subset size, and offline build constraints are documented. Keep body text in a readable sans stack; do not reintroduce remote font fetches.
4. Scope blur to fixed/sticky surfaces. Remove large scrolling `backdrop-filter` regions and replace them with opaque/translucent surfaces.
5. Replace linear decorative timing with the approved cubic-bezier token and keep non-essential motion off the critical content path.
6. Run WCAG AA contrast checks, keyboard focus checks, semantic labels for fixed mobile navigation, and 44px minimum tap-target checks at 360px and 390px.

**Owner:** frontend/design system.  
**Evidence:** component contract, visual baselines, contrast report, and mobile browser captures.

### P1 - Automation and crawl reliability

1. Sustain the approved target of at least four publishable non-review articles/day for 14 consecutive days; product reviews remain human-gated.
2. Keep Dify calls behind `src/lib/dify-client.ts`, enforce timeout/budget accounting, and record bounded failure reasons. A timeout is an observable failure, not a silent fallback to fabricated data.
3. Resolve the three pending crawl sources only in a controlled worker window with the embedding budget guard enabled. Anti-bot/403 sources stay terminally failed; they are not retried forever.
4. Keep the seven terminal target/provider failure rows visible in monitoring until an explicit retry or closure decision is recorded.
5. Add daily monitoring for stale jobs, publish target, crawl queue, Dify budget, and source-hint coverage. Alert on regressions instead of relying on manual inspection.

**Owner:** automation/platform.  
**Evidence:** 14-day monitor export, queue snapshots, budget ledger, and controlled worker log.

### P2 - Distribution and brand proof

1. Generate social variants only from approved article facts with a source URL and claim class. Product-review video variants require the same Hazar evidence boundary.
2. Keep YouTube upload private-by-default until a human QA pass confirms title, captions, claims, disclosure, thumbnail, and landing-page link.
3. Use the media kit and sponsor copy as positioning assets, not as proof of reach. Add real platform metrics only when they are measured and dated.

**Owner:** editorial/marketing.  
**Evidence:** fact-pack validation, private video QA checklist, and dated analytics export.

## 30/60/90-Day Sequence

### Days 0-7: Remove P0 uncertainty

- Add freshness and publish-to-homepage regression checks.
- Add production smoke plus image-SHA and rollback evidence to the release checklist.
- Replace public dashboard labels and run 360/390px accessibility checks.
- Re-score only the homepage gateway and release confidence after evidence is captured.

### Days 8-30: Make commercial pages defensible

- Enrich the ten sub-1,200-word commercial pages.
- Run schema, source, internal-link, CTA, disclosure, and canonical audits.
- Create the first real hands-on review evidence package if a product is available; otherwise do not publish a hands-on claim.
- Standardize the editorial card contract across all commercial hubs.

### Days 31-60: Prove the autonomous operating loop

- Sustain four non-review publishes/day for 14 days.
- Close or explicitly retry the pending/throttled crawl rows under budget control.
- Add alerting and a daily operations snapshot.
- Run a full live route matrix and visual regression set.

### Days 61-90: Re-audit and apply selectively

- Re-run both GAP reports and this scorecard against fresh evidence.
- Apply only to affiliate programs whose terms, product category, and disclosure requirements are satisfied.
- Publish a dated media-kit metrics section only from measured analytics.
- Mark a category 10/10 only when every exit gate passes; a single P0 failure keeps the category below 10.

## Remaining Blockers

- No genuine hands-on product review/evidence event exists yet.
- Ten commercial pages are still enrichment candidates even though they pass the 600-word/indexability gate.
- Three pending crawl sources and seven terminal target/provider failure rows require a controlled, budget-approved worker window or explicit source retirement.
- Public shell typography, full contrast/focus coverage, and shared hub-card anatomy remain open design-system work; the homepage/search telemetry-label and blur issues are closed.
- A full production route matrix and rollback rehearsal still need recorded evidence.

## Definition of Done

The project can honestly state “10/10” only when the scorecard is regenerated from fresh artifacts and all of the following are true:

- No P0 release, freshness, security, or data-integrity finding is open.
- Homepage and hubs expose the archive without clipping, hidden CTAs, or stale counts at desktop and mobile widths.
- Commercial pages are source-backed, internally linked, disclosed, schema-valid, and CTA-valid.
- Reviews clearly distinguish spec analysis from hands-on testing, and any hands-on review has Hazar Volga Ekiz approval and evidence.
- Four non-review publishes/day, crawl queue health, Dify budget, and stale-job alerts are green for the agreed observation window.
- Production deploy, health, ready, rollback, and live browser evidence all point to the same release SHA.
