# FPVLovers Next Actions

Last updated: 2026-05-18

## Immediate Priority

1. Content automation Task 1 DONE (2026-05-18): types, queue, contract doc created. Next: Task 2 — move prompt construction into shared generator, standardize JSON shape, parse Dify responses, update admin endpoints.
2. Treat `https://www.t-motor.com/download` as a terminal crawl exception for now, and decide whether to replace it with a different manufacturer source or a manually captured page.
3. Clean remaining lint debt in dashboard/admin components so pre-commit can run without `--no-verify`.
4. Verify admin auth behavior on production.
5. Move JSON/runtime state that must survive deploys to Postgres or a mounted persistent volume.
6. Fill the new source backlog with the missing high-value URLs: `INAV`, `MEPS King`, `Fpvtips`, `IntoFPV`, `RCGroups`, and `SpeedyBee`.
7. Use `data/fpv-rag-source-pack.json` as the next ingest target list; first three are `IntoFPV`, `RCGroups`, and `SpeedyBee`.
8. With local admin smoke unblocked, continue using `/api/admin/retrieval` for UI sanity checks.
9. Apply the same `retrieval_mode=multiple` and `multiple_retrieval_config` pattern to any other Dify workflows with Knowledge Retrieval nodes before trusting them.

## Code Tasks Before Push

- Review current git status and separate unrelated pre-existing changes from deploy-critical fixes.
- Keep `sunucular/` out of Git. It is outside the frontend repo today and must stay private.
- Confirm `credentials.json` and secret-like files are ignored.
- Fix or defer lint debt intentionally. Current deployment requires build/typecheck first.

## Deployment Tasks

- Production deploy is complete on Coolify.
- Confirm Docker image/container exists after future builds.
- Confirm Traefik route for `fpvlovers.com.tr` after future FQDN changes.
- Confirm app serves port `3000`.
- Confirm health endpoint returns JSON `status: ok`.

## Infrastructure Follow-Up

- Fix Crawl4AI Docker healthcheck on primary and backup nodes. The API is healthy on port `80`, but the container healthcheck checks `11235`.
- Review public exposure of Redis/crawler ports on the crawler node.
- Check Oracle volume sizing. Expected capacity is 4 CPU / 24 GB RAM / 200 GB disk per server, but live root mounts showed smaller filesystems.

## Architecture Follow-Up

- Normalize all dataset/app routing to the 9-dataset model.
- Correct any stale `fpv-regulations` dataset ID references.
- Add env-based crawler provider config for primary/backup.
- Decide whether crawl queue state should stay file-based or move to a persistent store once the Excel seed batches are fully processed; current file-based queue is still empty while workbook batches are going straight through ingest.
- Decide whether `too_short` URLs should be excluded up front or kept as explicit retries for a different crawl strategy.
- Consider whether `t-motor` should remain in the seed workbook at all, since both the path and origin failed crawl retries.
- Keep the retrieval logic mirrored between `lib/` and `src/lib/` whenever corpus rules change so the live app and fallback copy do not drift again.
- Use `npm run seeds:backlog` as the quick check for which sources still need to be found.
- Use `npm run seeds:backlog-pack` to regenerate the next ingest-ready three-source pack.
- Keep n8n out of active product flow unless a future automation feature needs it.
- When Opencode continues implementation, use `docs/superpowers/plans/2026-05-18-opencode-codex-collaboration-protocol.md` as the shared working protocol and keep `PROJECT_MEMORY.md` plus this file in sync after each handoff.
- Use `npm run handoff` whenever the next agent needs a fresh shared state packet; it writes `docs/handoff/latest.md` for humans and `docs/handoff/latest.json` for automatic finished-task / blocker detection.
- Use `npm run opencode:brief` to print a concise task brief from `docs/handoff/latest.json` so Opencode can begin without a manual explanation.
- Dify workflow blockers RESOLVED (2026-05-18): `retrieval_mode`, `multiple_retrieval_config`, and `google_api_key` all fixed. Full pipeline smoke test passed.

## Known Risks

- Lint currently has dashboard component debt and should be cleaned before strict CI.
- JSON runtime state should eventually move to Postgres or a mounted persistent volume.
- Coolify may preserve stale custom Traefik labels. If domain changes do not apply, clear app `custom_labels` and redeploy.
