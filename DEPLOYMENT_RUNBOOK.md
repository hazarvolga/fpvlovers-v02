# FPVLovers Deployment Runbook

Last updated: 2026-10-25

## Target

- Repository: `hazarvolga/fpvlovers-v02`
- Branch: `main`
- Platform: Coolify (`https://coolify.affexai.tr`) on Contabo Single-Node VPS (`169.58.96.15` / `affexai-prod-01`)
- Coolify Project: `FPV Lovers` (`uuid: whqhxcqeyjvps3pdurplad1c`) -> `production` (`uuid: 1iqv0jce7xaocip7s52356vb`)
- Application Resource: `fpvlovers-web` (`uuid: jnlhgqmjnqwpdgefsoskew5n`)
- Runtime: Dockerfile / Next.js 15 standalone
- Port: `3000`
- Healthcheck: `http://127.0.0.1:3000/api/health` (`health_check_host` MUST stay `127.0.0.1`, not `localhost`)
- Readiness endpoint: `/api/ready`
- Production domain: `https://fpvlovers.com.tr`
- Dify Console domain: `https://dify.affexai.tr` (`uuid: ta4t6npg4cc65ua7rwhdixjk`)

## Pre-Deploy Checks

Run from the repository root:

```bash
pnpm media:audit
pnpm metadata:test
pnpm security:audit
```

## Required Coolify Env Vars (`fpvlovers-web`)

Use Coolify environment variables (`is_buildtime=false` on `NODE_ENV` and `CRON_SECRET`). Do not commit real secret values.

Core:
- `NODE_ENV=production` (`is_buildtime=false`)
- `APP_URL=https://fpvlovers.com.tr`
- `NEXT_PUBLIC_APP_URL=https://fpvlovers.com.tr`
- `AUTH_SECRET` (required in production; minimum 32 chars)
- `CRON_SECRET` (`is_buildtime=false`)
- `FPV_DATABASE_URL` / `DATABASE_URL` -> `postgresql://fpvlovers:<pass>@gkmzgwnnirofcgpw2yh0bnlh:5432/fpvlovers`
- `REDIS_URL` -> `redis://:<pass>@erzatjqls2op2wuz3fxav1kf:6379`

AI / Dify / Crawler:
- `GEMINI_API_KEY`
- `GEMINI_PRIMARY_MODEL=gemini-flash-latest`
- `DIFY_BASE_URL=https://dify.affexai.tr/v1`
- `DIFY_API_KEY` (Dataset API token)
- `DIFY_DATASET_TOKEN_*` (9 dataset tokens)
- `DIFY_WORKFLOW_*_TOKEN` & `DIFY_*_APP_TOKEN` (9 workflow + 2 chat app tokens)
- `CRAWL4AI_PRIMARY_URL=http://crawl4ai-bgm2kq7nnehl1yx8myffsz1i:11235/crawl`
- `CRAWL4AI_PRIMARY_HEALTH_URL=http://crawl4ai-bgm2kq7nnehl1yx8myffsz1i:11235/health`
- `CRAWL4AI_BACKUP_URL=http://crawl4ai-bgm2kq7nnehl1yx8myffsz1i:11235/crawl`
- `CRAWL4AI_BACKUP_HEALTH_URL=http://crawl4ai-bgm2kq7nnehl1yx8myffsz1i:11235/health`

## Deployment Steps

1. Commit and push changes to `hazarvolga/fpvlovers-v02:main`.
2. Trigger a deployment in Coolify UI (`fpvlovers-web` -> **Deploy**) or via the Coolify deployment queue on `affexai-prod`.
3. Verify after deploy:

```bash
curl -I https://fpvlovers.com.tr
curl -fsS https://fpvlovers.com.tr/api/health
curl -fsS https://fpvlovers.com.tr/api/ready
```

4. Verify `/admin` authentication guard:

```bash
curl -I https://fpvlovers.com.tr/admin
```

## Rollback

Use Coolify rollback to the previous image tag (`jnlhgqmjnqwpdgefsoskew5n:<commit-sha>`) or push a revert commit and redeploy.
