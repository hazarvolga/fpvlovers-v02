# Post-Analysis Gap Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the security, metadata, taxonomy, type-quality, documentation, and release-verification gaps found after commits `d690953..845afc5` without mutating production data.

**Architecture:** Keep remediation deterministic and local-first. Repository audits become executable quality gates, content normalization works only on tracked published artifacts, and production is inspected read-only after the complete local release gate passes.

**Tech Stack:** Next.js 15, TypeScript, Node.js/tsx scripts, JSON published artifacts, Git, Coolify production target

---

### Task 1: Security and portable audits

**Files:**
- Modify: `scripts/audit-content-metadata.ts`
- Modify: `package.json`
- Modify: `NEXT_ACTIONS.md`
- Modify: `PROJECT_MEMORY.md`
- Test: `scripts/repository-security-audit.mjs`

- [x] **Step 1: Add a failing repository security audit**

Create a script that scans Git-tracked text files, rejects known operational credential values, rejects hardcoded Dify token fallbacks, and confirms metadata reports resolve below `reports/`.

- [x] **Step 2: Run the audit and confirm RED**

Run: `node scripts/repository-security-audit.mjs`

Expected: non-zero exit identifying tracked operational credential references and the non-portable metadata report path without printing secret values.

- [x] **Step 3: Apply the minimum remediation**

Replace operational values in tracked documentation with environment-variable instructions. Change the metadata report target to `reports/unified-metadata-report.md`, add a package script, and require env-only Dify credentials wherever a fallback exists.

- [x] **Step 4: Verify GREEN and baseline types**

Run: `node scripts/repository-security-audit.mjs`

Run: `pnpm metadata:audit`

Run: `pnpm exec tsc --noEmit`

Expected: all commands exit zero and the report is generated inside the repository.

- [x] **Step 5: Commit Phase 1**

Run: `git commit -m "fix(security): remove tracked operational secrets"`

### Task 2: Metadata and taxonomy completion

**Files:**
- Modify: `scripts/phase3-metadata-expansion.ts`
- Modify: `scripts/audit-content-metadata.ts`
- Modify: `scripts/generate-commercial-content.ts`
- Modify: `content/published/*.json`
- Test: `scripts/content-metadata-regression-test.ts`

- [x] **Step 1: Add a failing metadata regression test**

Assert that every published JSON artifact has a valid `metadata.contentType`, that commercial metadata contracts match their content type, and that `Buyers Guides` never appears as a category.

- [x] **Step 2: Run the test and confirm RED**

Run: `node --import tsx scripts/content-metadata-regression-test.ts`

Expected: non-zero exit reporting 65 missing content types and the plural taxonomy drift.

- [x] **Step 3: Normalize metadata deterministically**

Extend the existing migration to infer the allowed `ContentType` from existing template, category, title, and metadata fields. Normalize both top-level and metadata categories to `Buyer Guides` and update the commercial generator constant so drift cannot recur.

- [x] **Step 4: Verify GREEN and content integrity**

Run: `node --import tsx scripts/content-metadata-regression-test.ts`

Run: `pnpm metadata:audit`

Run: `pnpm content:audit`

Expected: 117 artifacts covered, zero missing content types, one canonical buyer-guide category, and zero integrity failures.

- [x] **Step 5: Commit Phase 2**

Run: `git commit -m "fix(content): complete metadata taxonomy migration"`

### Task 3: Type and formatting quality

**Files:**
- Modify: TypeScript files changed by `d690953..845afc5` that contain semantic `any`
- Modify: `.editorconfig` or repository lint configuration only if an equivalent guard is absent
- Test: `scripts/recent-code-quality-audit.mjs`

- [x] **Step 1: Add a failing recent-code quality audit**

Scan the target commit range for semantic `any` annotations and `git diff --check` failures while excluding prose occurrences of the English word "any".

- [x] **Step 2: Run the audit and confirm RED**

Run: `node scripts/recent-code-quality-audit.mjs`

Expected: non-zero exit listing file/line locations without dumping source contents.

- [x] **Step 3: Replace unsafe types and clean touched whitespace**

Use existing artifact, racing, metadata, React component, and analytics types where available; otherwise use `unknown` plus narrowing. Remove only whitespace in the affected files.

- [x] **Step 4: Verify GREEN**

Run: `node scripts/recent-code-quality-audit.mjs`

Run: `pnpm exec tsc --noEmit`

Run: `pnpm lint`

Expected: zero semantic `any` findings in the target range, zero diff-check errors, zero TypeScript errors, and no new ESLint errors.

- [x] **Step 5: Commit Phase 3**

Run: `git commit -m "refactor(types): harden recent discovery code"`

### Task 4: Memory and handoff reconciliation

**Files:**
- Modify: `PROJECT_MEMORY.md`
- Modify: `NEXT_ACTIONS.md`
- Regenerate: `docs/handoff/latest.md`
- Regenerate: `docs/handoff/latest.json`

- [x] **Step 1: Reconcile source-of-truth state**

Record the security/admin, discovery, commercial, metadata, and quality outcomes with commit IDs. Keep external secret rotation, Git-history rewrite, and production deployment explicitly open until verified.

- [x] **Step 2: Regenerate handoff artifacts**

Run: `pnpm handoff`

Run: `pnpm opencode:brief`

- [x] **Step 3: Verify documentation freshness**

Confirm the generated handoff references the current date and HEAD and no tracked credential values reappear.

- [x] **Step 4: Commit Phase 4**

Run: `git commit -m "docs: refresh fpvlovers release handoff"`

### Task 5: Release and production verification

**Files:**
- No production-data mutations
- Update documentation only if live evidence changes the recorded state

- [x] **Step 1: Run the complete local release gate**

Run: `pnpm exec tsc --noEmit`

Run: `pnpm routes:audit`

Run: `pnpm content:audit`

Run: `pnpm content:smoke`

Run: `pnpm media:audit`

Run: `pnpm build`

- [x] **Step 2: Inspect production read-only**

Compare the live application/container commit or image metadata with local HEAD, then smoke `/api/health`, `/`, `/reviews`, `/comparisons`, and `/buyers-guides` without changing deployment state.

- [x] **Step 3: Record the exact boundary**

If production is behind, leave the result as deploy-pending and list the required Coolify deployment and post-deploy smoke commands. Do not claim the release is live without matching commit/image evidence.
