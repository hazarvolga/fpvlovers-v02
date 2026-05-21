# FPVLovers Handoff Packet

Generated at: 2026-05-21 (Codex — phased GAP closure, deploy candidate)

## Status: DEPLOY CANDIDATE — FINAL LOCAL GATE PASSED

### Completed by Codex

| Phase | Result |
|-------|--------|
| 0 | Execution plan added: `docs/superpowers/plans/2026-05-21-gap-closure-execution-plan.md` |
| 1 | Cron endpoints secured with `CRON_SECRET`; crawl automation uses `src/lib/crawl-queue.ts` |
| 2 | Generate cron enqueues real briefs, blocks safely without `DIFY_APP_KEY`, and publishes Dify output when credentials are present |
| 3 | Dual route trees synced and guarded with `npm run routes:audit` |
| 4 | Runtime/tool artifacts ignored, tracked `tsconfig.tsbuildinfo` removed, final gate passed |

### Automation Pipeline

| Endpoint | Job | Schedule |
|----------|-----|----------|
| `GET /api/admin/cron/crawl` | Enqueue missing/crawl-error backlog URLs into crawl queue (batch 3) | 6 hours |
| `GET /api/admin/cron/generate` | Enqueue next editorial brief, then generate and publish with Dify when queued | 4 hours |
| `GET /api/admin/cron/status` | Automation health check | manual / 12 hours |

All cron endpoints require `Authorization: Bearer $CRON_SECRET` or `x-cron-secret: $CRON_SECRET`.

### Local Verification

```bash
npx tsc --noEmit
npm run routes:audit
npm run content:audit
npm run content:smoke
npm run build
```

All passed locally on 2026-05-21.

### Deploy Next

1. Push `deploy-clean`.
2. Deploy through Coolify.
3. Set `CRON_SECRET` and ensure `DIFY_APP_KEY` is present in Coolify env.
4. Add Coolify Scheduled Tasks:
   - crawl every 6 hours
   - generate every 4 hours
   - status manual or every 12 hours
5. Browser smoke:
   - `https://fpvlovers.com.tr`
   - `/api/health`
   - `/admin`
   - `/api/admin/cron/status` with secret
   - `/article/fpv-troubleshooting-guide`
   - `/article/fpv-components-wiring-guide`
