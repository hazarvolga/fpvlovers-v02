# FPVLovers Next Actions

Last updated: 2026-05-17

## Immediate Priority

1. Commit/push the local frontend build fixes to `hazarvolga/fpvlovers.com.tr`.
2. Redeploy the existing Coolify frontend application.
3. Bind `https://fpvlovers.com.tr` to the frontend app in Coolify.
4. Verify `/api/health`, homepage, and admin auth.

## Code Tasks Before Push

- Review current git status and separate unrelated pre-existing changes from deploy-critical fixes.
- Keep `sunucular/` out of Git. It is outside the frontend repo today and must stay private.
- Confirm `credentials.json` and secret-like files are ignored.
- Fix or defer lint debt intentionally. Current deployment requires build/typecheck first.

## Deployment Tasks

- Redeploy application in Coolify after pushing fixes.
- Confirm Docker image/container exists after build.
- Confirm Traefik route for `fpvlovers.com.tr`.
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

- Remote Coolify deploys will fail until the build-fix commit reaches `main`.
- Domain currently returns `404` until Coolify route/FQDN is bound to the frontend app.
- Lint currently has dashboard component debt and should be cleaned before strict CI.
- JSON runtime state should eventually move to Postgres or a mounted persistent volume.
