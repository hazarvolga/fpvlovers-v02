# FPVLovers GAP Closure Execution Plan

Date: 2026-05-21
Owner: Codex
Mode: phase-by-phase, verify after each phase, update project memory, commit each phase.

## Current Baseline

- Branch: `deploy-clean`
- Remote delta: ahead of `origin/main`
- OpenCode claim checked: `2fb816a` is documentation-only; the technical automation work is `34369ec`.
- Local verification before this plan:
  - `npx tsc --noEmit` passed.
  - `npm run content:audit` passed.
  - `npm run content:smoke` passed.
- Dirty tree at plan start:
  - Modified: `content/published/fpv-components-wiring-guide.json`, `content/published/fpv-troubleshooting-guide.json`, `tsconfig.tsbuildinfo`
  - Untracked: `.gitnexus/`, `.kiro/`, `CONTRIBUTING.md`, `data/content-last-auto-run.json`, `data/crawl-last-auto-run.json`, `tsc_errors.txt`, `tsconfig.check-old.json`

## GAP Reality Check

The GAP is not closed at production-operational level yet.

- Cron endpoints exist, but `cron/crawl` bypasses `src/lib/crawl-queue.ts` and calls Crawl4AI directly.
- Cron endpoints are public `GET` side-effect routes and need a shared secret before deployment.
- `cron/generate` can enqueue or mark a job as `generating`, but it does not complete the Dify generation and publish cycle.
- Route trees are synced, but not cleaned: both `app/` and `src/app/` still exist.
- Published content count is 2; the soft launch target is at least 3.

## Phase Plan

### Phase 0 - Baseline and Execution Contract

Goal: lock the real status and the phase plan in repo docs.

Actions:
- Add this plan.
- Update `PROJECT_MEMORY.md`.
- Update `NEXT_ACTIONS.md`.

Verification:
- `git diff --check`

Commit:
- `docs: add gap closure execution plan`

### Phase 1 - Safe Cron Foundation

Goal: make cron endpoints safe to expose and stop bypassing project control paths.

Actions:
- Add shared cron auth helper.
- Require `CRON_SECRET` or equivalent header/query token for side-effect cron endpoints.
- Change `cron/crawl` from direct Crawl4AI calls to queueing jobs through `src/lib/crawl-queue.ts`.
- Keep the batch small and deterministic.
- Sync `app/` and `src/app/` copies while the repo still uses dual route trees.
- Add/adjust status output so Coolify Scheduled Tasks can see the latest state.

Verification:
- `npx tsc --noEmit`
- `npm run content:audit`
- Direct handler or route-level smoke for unauthorized and authorized cron paths.

Commit:
- `fix(cron): secure crawl automation and use queue`

### Phase 2 - Real Content Automation Loop

Goal: make `cron/generate` do real work instead of only changing statuses.

Actions:
- Convert queued jobs through the content automation state machine.
- Run Dify generation through the existing wrapper when credentials are available.
- Support dry-run/no-secret-safe local smoke mode.
- Publish successful generated artifacts.
- Write `data/content-last-auto-run.json` with truthful status.

Verification:
- `npx tsc --noEmit`
- `npm run content:smoke`
- Local cron generate smoke
- Confirm `content/published/` has at least 3 valid artifacts or explicitly record why live generation is blocked.

Commit:
- `fix(cron): complete content generation loop`

### Phase 3 - Route Tree Decision

Goal: remove or formally contain the duplicate route risk.

Actions:
- Compare `app/` and `src/app/` route trees.
- If safe, move to a single active route tree.
- If not safe before launch, keep dual-tree sync and add a stronger drift guard for cron/admin routes.

Verification:
- `npm run build`
- `npm run content:audit`

Commit:
- `fix(routes): close route tree drift risk`

### Phase 4 - Final Deploy Gate

Goal: produce a deploy-ready state with clean handoff.

Actions:
- Clean runtime/generated dirty files intentionally.
- Update `PROJECT_MEMORY.md`, `NEXT_ACTIONS.md`, and `docs/handoff/latest.md`.
- Run full local gate.
- Prepare Coolify Scheduled Task setup notes.

Verification:
- `npx tsc --noEmit`
- `npm run content:audit`
- `npm run content:smoke`
- `npm run build`
- `git status --short`

Commit:
- `docs: finalize deploy handoff`

## Stop Rules

- Do not read or print `.env.local`.
- Do not run real crawl outside `src/lib/crawl-queue.ts`.
- Do not commit `sunucular/` or secret material.
- Do not force push.
- If live Dify or Crawl4AI access is blocked, record the blocker and keep local verification honest.
