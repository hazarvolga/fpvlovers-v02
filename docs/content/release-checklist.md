# Content Automation Release Checklist

Run these checks before tagging a release that includes the content automation pipeline.

## Pre-Release

- [ ] `npx tsc --noEmit --pretty false` passes with zero errors
- [ ] `npm run content:smoke` passes all phases
- [ ] `data/content-jobs.json` queue file is writable from the app runtime
- [ ] `content/published/` directory is writable from the app runtime
- [ ] `DIFY_APP_KEY` env var is set (required for content generation)
- [ ] `DIFY_BASE_URL` (or `DIFY_INTERNAL_BASE_URL`) points to a reachable Dify instance
- [ ] Dify `SEO Content Generator` workflow is published and passing smoke tests
- [ ] Admin Basic Auth (`ADMIN_USER` / `ADMIN_PASS`) is configured in production
- [ ] Content jobs tab renders in admin dashboard
- [ ] Generation endpoint returns valid JSON from Dify workflow

## Smoke Test Phases

| # | Phase | What it verifies |
|---|-------|-----------------|
| 1 | Create sample job | Queue write, enqueue with dedup |
| 2 | State advance | brief → queued → generating → generated → reviewed → approved |
| 3 | Reviewer feedback | `feedback` field persists across save/load |
| 4 | GeneratedContent shape | Title, SEO, bodySections, excerpt, notes fields |
| 5 | Publish artifact | `content/published/<slug>.json` and `.md` created |
| 6 | Idempotent publish | Re-publish does not duplicate files |
| 7 | Queue integrity | Exact job count after operations |
| 8 | Cleanup | Queue and published files removed |

## Post-Release

- [ ] Open admin dashboard at `/admin`
- [ ] Navigate to "Content Jobs" tab
- [ ] Create a brief via "New Brief" form
- [ ] Click "Queue" then "Generate" (requires live Dify)
- [ ] Verify job advances to `generated` with token count in feedback
- [ ] Click "Review" → "Approve" → "Publish"
- [ ] Verify files in `content/published/<slug>.json` and `.md`
- [ ] Re-click "Publish" — confirm idempotent (no duplicate)
- [ ] Homepage still renders normally
