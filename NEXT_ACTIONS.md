# FPVLovers Next Actions

Last updated: 2026-05-17

## Immediate Priority

1. Clean remaining lint debt in dashboard/admin components so pre-commit can run without `--no-verify`.
2. Verify admin auth behavior on production.
3. Move JSON/runtime state that must survive deploys to Postgres or a mounted persistent volume.
4. Add a small production smoke checklist for homepage, `/api/health`, admin protection, Dify-backed content, and crawler dry-run behavior.

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
- Keep n8n out of active product flow unless a future automation feature needs it.

## Known Risks

- Lint currently has dashboard component debt and should be cleaned before strict CI.
- JSON runtime state should eventually move to Postgres or a mounted persistent volume.
- Coolify may preserve stale custom Traefik labels. If domain changes do not apply, clear app `custom_labels` and redeploy.
