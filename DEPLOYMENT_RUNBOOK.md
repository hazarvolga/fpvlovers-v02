# FPVLovers Deployment Runbook

Last updated: 2026-05-17

## Target

- Repository: `hazarvolga/fpvlovers.com.tr`
- Branch: `main`
- Platform: Coolify
- Runtime: Dockerfile / Next.js standalone
- Port: `3000`
- Health endpoint: `/api/health`
- Production domain: `https://fpvlovers.com.tr`

## Pre-Deploy Checks

Run from the frontend repository root:

```bash
npm run build
npx tsc --noEmit --pretty false
```

Known note:
`npx tsc --noEmit` can depend on generated `.next/types`, so run `npm run build` first if `.next` is stale.

Lint is currently a known debt area. Build and typecheck are the deployment blockers; lint cleanup should follow before CI is made strict.

## Required Coolify Env Vars

Use Coolify environment variables. Do not commit real values.

Required:

- `NODE_ENV=production`
- `APP_URL`
- `NEXT_PUBLIC_APP_URL`
- `ADMIN_USER`
- `ADMIN_PASS`
- `AUTH_SECRET` (or `NEXTAUTH_SECRET`) must be a unique high-entropy value with at least 32 characters.
- `DIFY_BASE_URL`
- `DIFY_API_KEY`
- `DIFY_APP_KEY`

Feature-dependent:

- `GROQ_API_KEY`
- `GROQ_MODEL`
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_DATABASE`
- `LLM_CACHE_ENABLED`
- `CRAWL_DRY_RUN`

## Current Coolify Findings

From live SSH inspection on 2026-05-17:

- Coolify application exists for `hazarvolga/fpvlovers.com.tr`.
- Application UUID: recorded in private operations notes.
- Build pack: `dockerfile`.
- Exposed port: `3000`.
- Production deploy succeeded from commit `b4055de`.
- Current container is healthy on port `3000`.
- Active FQDNs are `https://fpvlovers.com.tr` and `https://www.fpvlovers.com.tr`.
- Earlier failures were caused by a stale remote TSX build error, missing `/app/public` during Docker copy, and Next standalone binding to container hostname instead of `0.0.0.0`.
- Domain routing was blocked by stale Coolify `custom_labels` containing old `sslip.io` Traefik labels. Clear `custom_labels` if FQDN changes do not affect container labels.

## Deployment Steps

1. Ensure local build and typecheck pass.
2. Commit and push frontend fixes to `hazarvolga/fpvlovers.com.tr:main`.
3. In Coolify, redeploy the existing application.
4. Set or verify FQDN:

```text
https://fpvlovers.com.tr
```

5. Ensure health check points to:

```text
/api/health
```

6. Verify after deploy:

```bash
curl -I https://fpvlovers.com.tr
curl -fsS https://fpvlovers.com.tr/api/health
```

If `fpvlovers.com.tr` still returns Traefik `404` after a successful deploy, inspect container labels. The labels must contain `Host(\`fpvlovers.com.tr\`)`, not the old `sslip.io` host.

7. Verify admin route is protected:

```bash
curl -I https://fpvlovers.com.tr/admin
```

Expected unauthenticated result should be `401` or protected equivalent.

## Rollback

Use Coolify rollback to the last successful image if available. If no successful image exists, push a revert/fix commit and redeploy.

## Server Notes

Private server details, SSH key locations, Coolify IDs, and live audit results live outside the frontend repo under `sunucular/`.

Do not duplicate secrets in this file.
