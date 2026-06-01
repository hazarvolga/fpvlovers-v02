# FPVLovers Handoff Packet

Generated at: 2026-06-01T11:32:17.075Z

## What happened

- GAP closure execution was reset into a phase-by-phase Codex plan on 2026-05-21 at `docs/superpowers/plans/2026-05-21-gap-closure-execution-plan.md`.
- OpenCode commit `2fb816a` is documentation-only; the automation implementation is `34369ec`.
- Local verification before the new phase plan: `npx tsc --noEmit`, `npm run content:audit`, and `npm run content:smoke` passed.
- Remaining launch blockers are operational rather than editorial: cron auth, crawl queue compliance, real content generation loop, duplicate route strategy, and final deploy gate.
- Phase 1 completed by Codex on 2026-05-21: cron endpoints now require `CRON_SECRET`/`CRON_AUTH_TOKEN`, `cron/crawl` enqueues through `src/lib/crawl-queue.ts` instead of calling Crawl4AI directly, and `app/` plus `src/app/` cron route copies are synced. Verification passed: `npx tsc --noEmit`, route smoke (`401` without secret, `200` with secret), `npm run content:audit`, and `npm run content:smoke`.
- Phase 2 completed by Codex on 2026-05-21: `cron/generate` now actually enqueues missing editorial briefs, blocks safely when `DIFY_APP_KEY` is absent, and can generate via Dify plus publish successful artifacts through the shared `publishGeneratedContentArtifact()` helper. Verification passed: `npx tsc --noEmit`, dry-run route smoke, enqueue/blocker route smoke, `npm run content:audit`, and `npm run content:smoke`. Live Dify generation still needs production env verification.
- Phase 3 completed by Codex on 2026-05-21: duplicate `app/` and `src/app/` route trees were synced and guarded with `npm run routes:audit` via `scripts/route-tree-drift-audit.mjs`. The repo keeps dual route trees for this deploy to avoid runtime precedence surprises, but full drift detection is now part of the gate. Verification passed: `npm run routes:audit` (77 files synced), `npx tsc --noEmit`, `npm run content:audit`, and `npm run build`.
- Phase 4 completed by Codex on 2026-05-21: final deploy hygiene added runtime/tool ignores, removed tracked `tsconfig.tsbuildinfo`, preserved published media artifacts, and refreshed handoff for Coolify cron setup. Final gate passed locally: `npx tsc --noEmit`, `npm run routes:audit`, `npm run content:audit`, `npm run content:smoke`, and `npm run build`.

## Current blockers

1. DONE Walkthrough remediation (2026-05-29): route audit is single-tree aware, content audit/smoke scripts run from local `tsx`, and admin Dify workflows route through `src/lib/dify-client.ts`.
2. DONE Phase 1 (2026-05-21): cron endpoints require a shared secret, `cron/crawl` uses `src/lib/crawl-queue.ts`, and dual cron routes are synced.
3. DONE Phase 2 (2026-05-21): `cron/generate` now enqueues real jobs, blocks safely without `DIFY_APP_KEY`, and publishes Dify output when production credentials are present.

## Relevant follow-ups

- Normalize all dataset/app routing to the 9-dataset model.
- Correct any stale `fpv-regulations` dataset ID references.
- Add env-based crawler provider config for primary/backup.
- Decide whether crawl queue state should stay file-based or move to a persistent store once the Excel seed batches are fully processed; current file-based queue is still empty while workbook batches are going straight through ingest.
- Decide whether `too_short` URLs should be excluded up front or kept as explicit retries for a different crawl strategy.
- Consider whether `t-motor` should remain in the seed workbook at all, since both the path and origin failed crawl retries.

## Working agreement

- Use Dify v1.14 as the LLMOps/RAG backend.
- Use crawler providers directly from Next.js server-side API routes.
- Keep n8n out of the active launch path.
- Use 9 RAG datasets, including `fpv-regulations`.
- Treat `FPV_RAG_Web_List_CLEAN.xlsx` as the canonical seed workbook for crawl batches.
- Treat published content artifacts plus their generated media metadata as the source of truth for public surfaces.

## Dify / content automation context

**Goal:** Build a self-feeding FPV content system where content briefs are queued automatically, Dify generates structured English drafts, the app stores and previews them, and approved content can be published without manual rewriting.
**Architecture:** Treat content production as a pipeline with explicit states: brief -> queued -> generated -> reviewed -> approved -> published. Keep the workflow contract in shared TypeScript types, keep Dify prompts and response parsing in one place, and keep the admin UI focused on queue health, draft quality, and publish actions. The existing `src/app/api/admin/content/*` routes become the main integration points, while shared content helpers stay in `src/lib/content-automation/*` so the duplicated `app/` tree can stay thin.
**Tech Stack:** Next.js 15, React 19, TypeScript, local filesystem JSON/MD artifacts for queue state, existing Dify API integration, shadcn/ui, Playwright browser smoke, ESLint, `npx tsc`.
### Task 1: Define the content automation contract and queue model
### Task 2: Turn the existing Dify generation routes into a single structured content generator
### Task 3: Add content queue creation, review, and publish endpoints
### Task 4: Build the admin workflow UI for self-feeding content
### Task 5: Wire the self-feeding loop from source intelligence to content generation
- [ ] **Step 2: Create a loop that can generate the next best brief automatically**
### Task 6: Add smoke tests and a release checklist for the content engine

## Collaboration protocol excerpt

- Gemini provider was added and the workflow was published.
- Dify workflow blockers were resolved: `retrieval_mode=multiple`, `multiple_retrieval_config`, and `google_api_key` all fixed.
- Content automation Task 1 was completed: contract + queue model + docs.
- Current next fix: start Task 2 (shared prompt construction, JSON parsing, admin endpoint wiring).

## Roles
- **Codex**
- **Opencode**
## Source of Truth
- `/Users/hazarekiz/Projects/fpv-autoblog-v2/fpvlovers-frontend-websitesi/PROJECT_MEMORY.md`
- `/Users/hazarekiz/Projects/fpv-autoblog-v2/fpvlovers-frontend-websitesi/NEXT_ACTIONS.md`
- `/Users/hazarekiz/Projects/fpv-autoblog-v2/fpvlovers-frontend-websitesi/docs/superpowers/plans/2026-05-18-dify-content-automation.md`
## Update Order
- Write what changed to `PROJECT_MEMORY.md`.
- Write remaining work or blockers to `NEXT_ACTIONS.md`.
- If the work affects Dify/content automation, update the plan doc too.
## Handoff Rules
- Start from the latest memory note, not from old chat context.
- Do not duplicate work that is already finished in memory.

## Copy-paste prompt for Opencode

```text
Continue the FPVLovers work from the latest handoff packet.

Read first:
- /Users/hazarekiz/Projects/fpv-autoblog-v2/fpvlovers-frontend-websitesi/PROJECT_MEMORY.md
- /Users/hazarekiz/Projects/fpv-autoblog-v2/fpvlovers-frontend-websitesi/NEXT_ACTIONS.md
- /Users/hazarekiz/Projects/fpv-autoblog-v2/fpvlovers-frontend-websitesi/docs/superpowers/plans/2026-05-18-dify-content-automation.md
- /Users/hazarekiz/Projects/fpv-autoblog-v2/fpvlovers-frontend-websitesi/docs/superpowers/plans/2026-05-18-opencode-codex-collaboration-protocol.md

Current blocking issue:
- The Dify workflow still shows a validation warning on the RAG Retrieval node: retrieval_mode needs to be resaved or the node recreated.

Your next move:
- Fix the RAG Retrieval node config.
- Republish the Dify workflow.
- Run a smoke test against the live Dify app.
- Update PROJECT_MEMORY.md and NEXT_ACTIONS.md after the change.
```
