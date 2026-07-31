# FPVLovers Strategic GAP Report

Date: 2026-07-30
Scope: local old checkout, clean GitHub checkout, live production, Oracle/Coolify runtime, affiliate/social readiness
Recommended sequence: A -> C -> B
Status: strategy/design document only; no application code, production data, deployment, or secret changes were made.

## Executive Summary

FPVLovers should continue from the clean remote repository clone, not from the old local working copy. The clean checkout matches the deployed Git commit (`ef64bf366d5393d4f22a5d14693e34a91bfa097a`) and builds successfully in an isolated Node 20/npm environment. The old local checkout has valuable recoverable material, but it also contains dirty tracked diffs, untracked workflow exports, server inventory, key material, and local secrets that make it unsuitable as the primary source of truth.

The product is not ready for an affiliate application sprint yet. The strongest path is:

1. A - Trust and operations foundation.
2. C - Evidence-safe AI/product maturity.
3. B - Affiliate and revenue activation.

This sequence delays monetization intentionally. The reason is simple: affiliate programs, sponsors, and serious FPV users will evaluate credibility before clicks. FPVLovers already has a promising content and tooling base, but it must first eliminate source-of-truth drift, misleading public claims, CI weakness, dependency/security exposure, and production-content parity gaps.

## Understanding Summary

- FPVLovers is a public FPV knowledge, tools, reviews, racing, and buyer-guide platform.
- The immediate goal is not feature implementation; it is a clean GAP report and contribution strategy.
- The clean GitHub state is the preferred working base; the old local copy remains a recovery/quarantine source.
- Production currently runs the same Git commit as the clean remote checkout, but live content has drifted beyond repo content.
- The project should not start affiliate outreach until trust, claim accuracy, security, CI, and measurement maturity improve.
- AI/product work should happen before revenue sprint only if it is evidence-safe and does not create exaggerated analysis claims.
- Production, server data, user records, secrets, and deployments are out of scope for mutation without explicit authorization.

## Assumptions

- Main working directory going forward: `/Users/hazarvolgaekiz/dev/products/fpvlovers.com.tr-clean`.
- Old working directory: `/Users/hazarvolgaekiz/dev/products/fpvlovers.com.tr`.
- Production target remains Coolify on Oracle Cloud Free Tier or similar low-cost VPS infrastructure.
- Preferred runtime for this repo is Node 20.20.2 with npm, because the clean repo tracks `package-lock.json` and CI/Docker use npm.
- "AI product maturity" means truthful, testable, cost-aware tools, not marketing-heavy AI claims.
- Affiliate readiness means verified merchant relationships, evidence-backed product data, disclosure, working measurement, and no fake sponsor/partner signals.

## Source-of-Truth Comparison

| Area | Finding | Decision |
| --- | --- | --- |
| Clean remote checkout | Clean `git status`, HEAD at `ef64bf366d5393d4f22a5d14693e34a91bfa097a`, isolated build passed | Use as primary base |
| Old local checkout | Same HEAD, but dirty tracked files and 269 untracked entries | Keep as recovery/quarantine |
| Production container | Runs the same commit and is healthy | Do not redeploy until CI/parity gates are fixed |
| Production content | Live/shadow content count exceeds repo content by 26 artifacts | Export/sync before any destructive deploy |
| Package manager | Clean repo uses npm lock; old local introduced pnpm drift | Keep npm for this repo unless deliberately migrated |
| CI | Latest main workflow failed before typecheck/lint/build due handoff regression | Fix CI gate before active development branches |
| Server inventory | Old local server folder contains keys, credentials, and sensitive operational notes | Quarantine; never commit or quote secrets |

## P0 Gaps

### P0.1 Production content is ahead of Git

Evidence: clean repo has 137 published content artifacts; production has 163 published/shadow artifacts. Production contains 26 live-only artifacts.

Impact: a clean redeploy from Git can erase or hide production-only editorial value unless content is exported and committed or intentionally migrated to a managed store.

Recommendation: create a read-only export from production DB/content shadow, compare against repo, review the 26 artifacts editorially, then commit approved content to clean repo. Add a CI parity gate so this does not happen silently again.

Acceptance gate: local repo content count equals production content count, with zero live-only sitemap entries before deploy.

### P0.2 CI is not a trustworthy deployment gate

Evidence: latest main GitHub Actions run for the deployed commit failed in the handoff regression stage; downstream typecheck, lint, and build did not run in CI.

Impact: production can run a commit whose full quality pipeline did not pass. This weakens confidence before any product or revenue sprint.

Recommendation: repair `docs/handoff/latest.json` or adjust the regression test so main reflects the real current branch/state. Require green CI before deployment.

Acceptance gate: main branch has green verify workflow including handoff, typecheck, lint, and build.

### P0.3 Authentication secret posture is weak

Evidence: production readiness showed no explicit `AUTH_SECRET`/`NEXTAUTH_SECRET`; code derives a fallback from other env values and contains a hardcoded fallback path.

Impact: auth/session integrity depends on unstable or inappropriate secret derivation. This is a high-risk foundation issue.

Recommendation: set explicit high-entropy `AUTH_SECRET`, remove hardcoded fallback behavior for production, document rotation, and update `.env.example` and deployment runbook.

Acceptance gate: production refuses to boot without explicit auth secret and readiness confirms the expected secret configuration without exposing values.

### P0.4 Public misleading product claims exist

Evidence: `/category/parts` has hardcoded simulated price/stock/FOMO-like claims; `/category/software` and Flight Critic wording imply deeper video/frame analysis than the current API can support.

Impact: these pages create affiliate, SEO, and user-trust risk. They directly conflict with the site's "evidence first" positioning.

Recommendation: remove, deindex, or rewrite these routes until data and analysis claims are evidence-backed. Product tooling may stay, but claims must match actual inputs and outputs.

Acceptance gate: zero indexed pages with fake stock, fake urgency, fake sponsor, or unsupported AI analysis claims.

### P0.5 Sensitive local artifacts are too close to the repo

Evidence: old local checkout contains Oracle/Coolify server inventory, SSH keys, and `.env`-style backup files not protected broadly enough by `.gitignore`.

Impact: accidental `git add` can leak infrastructure access, credentials, or private operational notes.

Recommendation: keep the old checkout quarantined, extend ignore rules for local secret inventories/backups, and move secrets to a non-repo vault path.

Acceptance gate: secret scanning covers untracked local patterns; repo status cannot stage server inventories or env backups by accident.

## P1 Gaps

### P1.1 Dependency security debt

Finding: npm audit on clean commit reports critical/high vulnerabilities in auth, Next, nodemailer, postcss/sharp/esbuild-related dependency paths.

Recommendation: create a focused dependency-hardening branch. Upgrade auth/Next/mail packages in small steps and verify session, registration, protected admin, build, and contact flows.

### P1.2 Main branch is unprotected

Finding: GitHub branches are unprotected.

Recommendation: require PR review or at least required status checks for main. For solo-founder speed, keep it lean: require green CI and forbid force-push to main.

### P1.3 Cron-generated content does not revalidate consistently

Finding: cron publish path generates content but does not call the same revalidation path as manual publishing.

Recommendation: unify publish side effects so homepage, sitemap, and archive views refresh predictably.

### P1.4 Crawl queue is not idempotent

Finding: duplicate enqueue errors occur because pre-check only looks at pending jobs while the DB unique key applies across URL/dataset.

Recommendation: make enqueue conflict-aware, either by updating existing rows, using `ON CONFLICT`, or defining status-aware uniqueness intentionally.

### P1.5 Orphan public service on port 3003

Finding: server has a public Uvicorn service for YouTube/transcript intelligence that current repo does not appear to reference.

Recommendation: either decommission it, restrict it behind auth/VPN, or formally integrate it with rate limits, logs, and ownership.

## P2 Gaps

### P2.1 Affiliate catalog is intentionally fail-closed, but not ready

Finding: active affiliate seeds exist, but no verified affiliate URLs or evidence. This is correct as a safety posture, but it means revenue activation is not ready.

Recommendation: keep fail-closed behavior. Do not apply to affiliate programs until trust and product maturity gates are met.

### P2.2 Sponsor data model can imply unsupported partnerships

Finding: sponsor seeds exist with active-like metadata while homepage copy says brands are tracked, not partners.

Recommendation: require explicit sponsor agreement evidence before any sponsor is treated as active in UI/business logic.

### P2.3 User/contact/newsletter flows need abuse and consent hardening

Finding: registration, contact, newsletter, and analytics endpoints need stronger validation, rate limiting, consent capture, unsubscribe path, and truthful failure handling.

Recommendation: introduce schema validation, distributed rate limiting, double opt-in, public unsubscribe, and contact delivery observability.

### P2.4 Observability is too light

Finding: no clear Sentry/OpenTelemetry path; `/api/ready` exposes more operational detail than ideal.

Recommendation: add low-cost error tracking and reduce public readiness detail.

## P3 Gaps

### P3.1 Route audit misses encoded dynamic route folders

Finding: encoded `%5Bid%5D` route folders produce literal routes and likely 404s for intended dynamic URLs.

Recommendation: rename to real `[id]` dynamic route directories and add a route audit case.

### P3.2 Performance and accessibility gates are incomplete

Finding: build passes, but there is no complete Lighthouse/Core Web Vitals/accessibility gate.

Recommendation: add a small smoke matrix for homepage, article, tools, mobile viewport, and admin login surface.

### P3.3 Dify/workflow exports are not source-of-truth clean

Finding: old local has additional untracked Dify workflow exports that may match application references, but they are not reviewed or committed.

Recommendation: inventory, redact, import-test, then commit only clean exports that belong to the app.

## Recommended Strategy: A -> C -> B

### Phase A - Trust and Operations Foundation

Goal: make the platform safe to build on and safe to show to partners.

Timebox: 0-14 days.

Work:

- Keep clean repo as source of truth.
- Export and reconcile production-only content.
- Fix CI/handoff so main is green.
- Add explicit auth secret requirements.
- Patch or quarantine misleading public claims.
- Harden secret handling and local ignored patterns.
- Decommission or protect orphan public services.
- Add backup/offsite/restore proof.

Success metric: the platform can be redeployed from Git without losing content, leaking secrets, or publishing unsupported claims.

### Phase C - Evidence-Safe AI/Product Maturity

Goal: turn FPVLovers from "content site with tools" into a credible FPV decision engine.

Timebox: 15-45 days.

Work:

- Reframe Flight Critic around actual supported inputs, or build the real analysis pipeline before claiming frame/video intelligence.
- Make BuildDNA/Part Matcher evidence-backed with catalog provenance, freshness timestamps, and compatibility explanations.
- Formalize Dify workflow exports and budgets.
- Add evals for AI outputs: no fabricated specs, no fake test results, no unsupported sponsor or affiliate suggestions.
- Improve crawl/data ingestion reliability and traceability.
- Build internal product dashboards that show evidence coverage, not vanity metrics.

Success metric: AI/tool outputs become auditable, useful, and honest enough that affiliate partners and pilots can trust them.

### Phase B - Revenue and Affiliate Activation

Goal: monetize only after the site can pass trust review.

Timebox: 46-90 days.

Work:

- Apply to selected affiliate programs only after product and editorial gates pass.
- Verify affiliate URLs and attach evidence to offers.
- Activate CTAs only for verified programs.
- Create a simple media kit with real traffic, real engagement, content categories, and editorial policy.
- Build high-intent content clusters around starter kits, goggles/radio choices, LiPo safety, HD video systems, and build compatibility.
- Measure affiliate click-through, email signup, search-to-content conversion, and tool-assisted buyer intent.

Success metric: first affiliate approvals and conversions happen on top of a credible, low-risk foundation.

## Contribution Ideas

| Idea | Stage | Impact | Effort | Notes |
| --- | --- | --- | --- | --- |
| Production content export + parity gate | A | Very high | Medium | Prevents content loss and source drift |
| CI handoff repair + required checks | A | Very high | Low | Fast confidence win |
| Explicit auth secret enforcement | A | Very high | Low | Security foundation |
| Misleading route cleanup | A | Very high | Medium | Protects brand and affiliate readiness |
| Secret inventory quarantine and ignore expansion | A | High | Low | Reduces catastrophic leak risk |
| Orphan port 3003 decision | A | High | Low | Either productize or close |
| Crawl queue idempotency | A | Medium | Low | Removes recurring operational errors |
| Evidence-backed Part Matcher | C | Very high | Medium | Strong FPV utility and affiliate bridge |
| Flight Critic claim correction or real pipeline | C | Very high | High | Differentiator if truthful |
| AI output eval harness | C | High | Medium | Prevents fabricated product advice |
| Dify workflow source-of-truth cleanup | C | High | Medium | Makes AI layer deployable |
| Affiliate readiness dashboard | C | High | Medium | Shows when B can safely start |
| Verified affiliate CTA activation | B | Very high | Medium | Only after approval/evidence |
| Media kit with real metrics | B | High | Low | Helps sponsor/affiliate outreach |
| Buyer-intent content refresh sprint | B | High | Medium | Revenue engine after trust gates |

## Decision Log

| Decision | Alternatives | Rationale |
| --- | --- | --- |
| Use clean remote clone as base | Continue old local checkout | Old local has dirty and sensitive drift; clean clone matches remote/deployed commit |
| Keep old local copy as quarantine/recovery | Delete it or merge everything | It contains useful workflows/docs, but also secrets and unreviewed drift |
| Use A -> C -> B sequence | A -> B -> C, B first, C first | Affiliate outreach should wait until trust and product maturity are credible |
| Keep revenue sprint paused | Start affiliate applications now | Site needs stronger source, security, claim, and evidence maturity |
| Treat AI product work as evidence-safe maturity | Use AI claims for marketing speed | Unsupported AI claims are a trust liability |
| Do documentation first | Jump into implementation | User requested GAP report and brainstorming; implementation needs separate approval |

## Implementation Handoff

Recommended first implementation branch:

`codex/trust-ops-foundation-2026-07-30`

First sprint order:

1. Preserve production-only content through export/reconciliation.
2. Fix CI handoff regression and require green checks.
3. Enforce explicit production auth secret.
4. Remove or rewrite unsupported public claims.
5. Harden local secret handling and server inventory quarantine.
6. Close/protect port 3003 or document its ownership.
7. Add shadow parity and route-audit coverage.

Do not start affiliate applications until Phase A and the first Phase C product evidence gates are complete.

## Immediate Next Gate

Ready-to-implement criteria:

- This report is accepted as the working strategy.
- A separate implementation branch is created from the clean clone.
- Production content export is explicitly approved as read-only first.
- Secret values are never copied into docs, commits, prompts, or issue bodies.

Once those are true, the next safe action is Phase A Sprint 1.
