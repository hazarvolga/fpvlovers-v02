# Affiliate Editorial Governance Implementation Plan

Date: 2026-06-19
Design: `docs/superpowers/specs/2026-06-19-affiliate-editorial-governance-design.md`

## Phase 1 - Contract and regression tests

1. Add `src/lib/content-automation/editorial-governance.ts` with pure classification and publication-decision functions.
2. Extend content job and published-artifact types with optional backward-compatible editorial metadata.
3. Add `scripts/editorial-governance-regression-test.ts` covering reviews, spec analyses, comparisons, buyer guides, missing evidence, and Hazar Volga Ekiz approval.
4. Add a scoped package script and run the test red, then green.

Verification: `pnpm editorial:governance-test` and `pnpm exec tsc --noEmit`.

## Phase 2 - Publication boundary

1. Update `src/app/api/admin/cron/generate/route.ts` so product reviews are stored as generated drafts and never directly published.
2. Update `src/app/api/admin/content/jobs/[id]/route.ts` so review transitions record evidence, method, relationship, reviewer, and timestamp before approval/publish.
3. Update `src/lib/content-automation/publish-artifact.ts` to persist editorial metadata.
4. Keep autonomous non-review publication behind deterministic quality gates.

Verification: governance regression, cron dry-run smoke, content smoke, TypeScript.

## Phase 3 - Public trust and product evaluation

1. Correct `/disclosure`, `/editorial-policy`, and `/about` so they describe actual behavior and never claim unconfirmed partnerships.
2. Add product-evaluation terms to `/advertise` with supplied/loaned-unit disclosure and no-positive-review guarantee.
3. Add an article trust panel for methodology, source evidence, editor, review date, and product relationship.
4. Suppress numeric scores for legacy or new reviews that do not satisfy the review evidence contract.
5. Add relevant schema fields only when supported by stored evidence.

Verification: targeted component tests, `pnpm routes:audit`, browser checks on trust routes and representative articles.

## Phase 4 - Commercial content readiness

1. Audit all review, comparison, buyer-guide, and roundup artifacts for depth, intent match, sources, internal links, and CTA integrity.
2. Reclassify unsupported hands-on review language as spec analysis or hold the page from commercial promotion.
3. Improve the highest-priority ten commercial pages without inventing tests, prices, availability, or partnerships.
4. Refresh the affiliate audit, application pack, roadmap, and sponsor copy from verified project state.

Verification: content audit/smoke, metadata audit, link/schema checks, TypeScript, lint, production build.

## Commit Boundary

The workspace contains unrelated concurrent fallback-cover work. Do not clean or reset it. After each verified phase, stage only the files listed by that phase and inspect `git diff --cached` before any commit.
