# Production Deploy Checklist — Content Automation Pipeline

## Pre-Deploy Verification (Local)

- [x] `npx tsc --noEmit` passes (2026-05-18)
- [x] `npm run content:smoke` — 14/14 pass (2026-05-18)
- [x] Content reader reads 3 published artifacts (smoke-test-fpv-build, fpv-troubleshooting-guide, fpv-components-wiring-guide)
- [x] Missing article returns null (safe fallback)
- [x] All 5 article fields present (slug, title, bodySections, seo, excerpt)

## Pre-Deploy Verification (Production)

- [ ] Dev server renders `/article/<slug>` with real published content (blocked by motion-dom webpack issue — pre-existing, not introduced by Task 7)
- [ ] `/-clean-` `rm -rf .next && npm run build` succeeds
- [ ] `content/published/` directory exists and is writable
- [ ] `data/` directory exists and is writable
- [ ] `ADMIN_USER` and `ADMIN_PASS` set in production env
- [ ] Admin dashboard accessible at `/admin`
- [ ] "Published" tab lists all published articles
- [ ] "Content Jobs" tab shows queue state
- [ ] "View Live" link on published articles resolves correctly

## Deploy Steps

1. `git add -A && git commit -m "feat: content automation pipeline complete (tasks 1-7)"`
2. `git push origin main`
3. Coolify: redeploy `hazarvolga/fpvlovers.com.tr` app
4. Verify `npm run build` passes in Coolify deploy logs
5. Check container health on port 3000

## Post-Deploy Smoke

- [ ] `curl -I https://fpvlovers.com.tr` returns 200
- [ ] `curl -s https://fpvlovers.com.tr/api/health` returns `{"status":"ok"}`
- [ ] `curl -s https://fpvlovers.com.tr/article/smoke-test-fpv-build` renders article
- [ ] Admin at `/admin` loads with content tabs
- [ ] Dify workflow accessible via API (no 504)

## Rollback

- Coolify: rollback to previous image
- Or push revert commit: `git revert HEAD && git push`

## Known Issues

- Dev server has pre-existing `motion-dom.js` webpack chunk error (unrelated to content automation)
- Fix: `rm -rf .next && npm run build` for clean builds
- This issue exists before Task 7; it affects all pages using Framer Motion components
