# Coolify Runtime Hygiene Runbook

Date: 2026-07-03

## Current State

Production runs on Coolify with the Dockerfile build pack. Coolify's default Dockerfile deployment behavior was observed passing application environment variables into Docker build logs and build context.

Mitigations applied:

- Added `.dockerignore` so `.env`, `.env.*`, private keys, local caches, and sensitive local files do not enter Docker build context.
- Applied a server-side Coolify hotfix on `hulyaekiz` so Docker build args and injected Dockerfile `ARG` entries are limited to public-safe keys:
  - `NEXT_PUBLIC_*`
  - `APP_URL`
  - `NEXT_TELEMETRY_DISABLED`
  - `NODE_ENV`
- Redacted historical Coolify deployment logs for the FPVLovers frontend app where build logs contained environment/build-arg material.
- Rotated locally controlled `ADMIN_PASS` and `CRON_SECRET`.

## Important Operational Warning

The Coolify hotfix is applied inside the running Coolify container, not in this repository. A Coolify image update, container replacement, or full Coolify reinstall can remove the hotfix.

Before any future production deploy after a Coolify update:

1. Confirm the hotfix still exists in:
   `/var/www/html/app/Jobs/ApplicationDeploymentJob.php`
2. Confirm `private function isSafeBuildEnvironmentKey` is present.
3. Trigger a test deploy.
4. Scan the deployment log for:
   - `--build-arg DIFY`
   - `--build-arg GEMINI`
   - `--build-arg SMTP`
   - `--build-arg YOUTUBE`
   - `--build-arg CRON_SECRET`
   - `--build-arg ADMIN_PASS`
   - `--build-arg FPV_DATABASE_URL`
   - provider token prefixes such as `dataset-`, `app-`, `postgresql://`, `re_`

## Provider-Side Rotation Still Required

The following credentials cannot be safely rotated from the application repo alone:

- Dify dataset/app/workflow tokens
- Gemini API key
- Resend/SMTP API key
- YouTube/Google API key
- Database password, if the exposed historical build log should be treated as compromised

Rotate these in their provider consoles, then update Coolify runtime env values. After updating, run a hygiene verification deploy and redact logs again if any sensitive pattern appears.

## Verification Evidence

Latest verified production deploy:

- Commit: `1c63eb6`
- Container image tag: `r0c44ok0cskc800gs0c8o8wk:1c63eb6...`
- Health: `/api/health` returned `200`
- Tool guardrails remained active after deploy.

