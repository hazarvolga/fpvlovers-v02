# Technical Spec Trust Layer Handoff

Generated at: 2026-07-02T00:00:00+03:00

## Branch State

- Branch: `feat/spec-trust-layer`
- Scope: evidence-bound product specs, catalog quarantine/conflict ingestion, and engineering-safety guardrails for FPV tools.
- Production state: not deployed from this branch in this handoff.

## What Changed

- Added strict evidence-bound spec schemas and safe legacy spec accessors.
- Added additive PostgreSQL migration `0008_spec_trust_layer.sql` for product trust status, conflict log, and deterministic filter columns.
- Hardened migration runner advisory locking so migrations run under one checked-out client and uncertain unlocks evict the client.
- Updated crawler extraction so parsed specs are evidence-bound, unverified, and quarantined by default.
- Added crawler catalog normalization that rejects malformed evidence, preserves valid reviewed evidence, and quarantines unsafe legacy rows.
- Added trust-aware catalog ingestion with critical-field conflict detection, `REVIEW_REQUIRED` status, conflict logs, and optional typed DB upsert.
- Added engineering-safety guardrails to Part Matcher, Hardware Analyzer, and Build Wizard/Calculator outputs.

## Safety Rules Now Enforced

- Crawler, retailer, manufacturer, and manual sources do not auto-verify specs.
- Missing critical specs remain unknown; no default inference is treated as engineering-safe.
- New crawler products are quarantined, even if an incoming payload claims `VERIFIED`.
- Existing verified evidence is not overwritten by passive unverified recrawls.
- Critical conflicts across equivalent products from different URLs are collapsed into one product and marked `REVIEW_REQUIRED`.
- Build/compatibility tools expose `engineeringSafety.isEngineeringSafe`; custom/default inputs are always educational-only.

## Verification Run

- `npm run spec-trust:test` passed.
- `npm run tools:part-matcher:test` passed.
- `npx tsc --noEmit` passed.
- Targeted ESLint on modified spec-trust/catalog/tool files passed.
- `git diff --check` passed.
- `npm run build` compiled successfully but failed page-data collection without `DIFY_API_KEY`; `DIFY_API_KEY=dummy npm run build` passed and generated 121 static pages.

## Review Notes

- Task 3 spec review found a P1 false-verified persisted catalog case; fixed in `fix(catalog): require evidence for verified trust`.
- Task 4 spec review found three P1s: passive verified downgrade, URL-only identity missing cross-source conflicts, and DB upsert verified leak. All were fixed with regression coverage.
- Task 5 review agent timed out; manual review plus TypeScript, ESLint, and regression tests passed.

## Residual Risks

- The DB upsert helper is typed and executable but was verified with a fake client, not a live production database write.
- Full `npm run lint` was not used as the primary gate because previous project history showed long/no-output lint behavior; targeted ESLint and TypeScript were used for this branch.
- Production deploy and live browser verification remain separate steps after push.

## Next Move

1. Run final branch-wide verification.
2. Push `feat/spec-trust-layer`.
3. Open/review merge path into `main`.
4. After merge/deploy, live-test Part Matcher, Hardware Analyzer, Build Calculator, and admin catalog extract write=false/write=true.
