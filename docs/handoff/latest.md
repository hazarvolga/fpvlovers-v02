# FPVLovers Handoff Packet

Generated at: 2026-05-20T12:05:38.735Z

## What happened

- Local build and TypeScript were stabilized in this workspace after prior Coolify failures.
- Production deploy succeeded on 2026-05-17 from commit `b4055de`.
- `https://fpvlovers.com.tr` and `https://www.fpvlovers.com.tr` serve the frontend through Coolify.
- `/api/health` returns JSON `status: ok` on production.
- Coolify app routing was blocked by stale `custom_labels` containing the old `sslip.io` route; clearing them allowed FQDN-generated Traefik labels.
- `FPV_RAG_Web_List_CLEAN.xlsx` is now normalized by `scripts/import-fpv-rag-seeds.py` into `data/fpv-rag-seeds.manifest.json`; all 86 workbook rows have been processed through local pilot batches, `data/fpv-rag-seeds.failed.json` tracks retry candidates, and the only remaining crawl exception after retry is `https://www.t-motor.com/download` (also failed at the origin fallback).
- Retrieval simulation now respects dataset population in both `lib/` and `src/lib/`: empty datasets no longer fabricate evidence, sparse datasets are scored conservatively, and fallback confidence is capped when the primary corpus is missing.
- Live `/api/master?action=retrieval` verification on 2026-05-18 showed honest behavior: `tuning` high confidence, `parts` no-answer on an empty corpus, `build` fallback-only medium confidence, `troubleshooting` fallback-only low-medium confidence, and `regulations` high confidence.

## Current blockers

1. Content integrity audit DONE (2026-05-20): resolver hardened, audit script 9/9 pass, drift guard active, public shell copy normalized, published content artifacts tracked, and the media layer now has copyright-safe cover art. Next: fix embedding credential (gemini-embedding-001), fix retrievalAgent.ts UUID bug, production deploy.
2. Expand the media layer next: add gallery/figure support for selected articles and decide which future posts should carry real sponsored or reference assets instead of only generated cover art.
3. Treat `https://www.t-motor.com/download` as a terminal crawl exception for now, and decide whether to replace it with a different manufacturer source or a manually captured page.

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
