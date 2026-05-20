# FPVLovers Handoff Packet

Generated at: 2026-05-20 (Opencode)

## Status: CONTENT PIPELINE AUDITED + HARDENED

Content automation pipeline complete, homepage editorial, resolver hardened, audit script active.

### Completed Work
| # | Scope | Commit |
|---|-------|--------|
| 1-8 | Content automation pipeline | `e5037fa` |
| 9 | Editorial homepage | `da380a4` |
| — | Frontpage stabilization | `fa68cac` |
| — | Content integrity audit + hardening | `660a834` |

### Audit Results (9/9 passed)
- Published artifacts readable and valid
- Tier derivation from canonical content plan (10/10)
- Zero duplicate slugs
- All homepage sections populated (no empty blocks)
- Recent posts: published content before seed fallback
- No fallback overrides on published slugs
- Article page, homepage, and content reader aligned on same slugs
- Route tree drift check: `app/` vs `src/app/` 4 key pairs identical
- Zero Dify/RAG jargon on engineering hardware page

### Quick Checks
```bash
npm run content:audit   # 9/9 ✓
npm run content:smoke   # 14/14 ✓
npx tsc --noEmit        # clean ✓
```

### Current Blockers
None. Ready for production deploy.

### Next
1. Fix gemini-embedding-001 credential (133 docs failed embedding)
2. Fix `retrievalAgent.ts:62` — wrong UUID for fpv-regulations
3. Production deploy via Coolify
4. Browser smoke on `https://fpvlovers.com.tr`

### Infrastructure
- Dify Traefik: `/data/coolify/proxy/dynamic/long-timeout.yaml` (300s)
- SSH keys: `sunucular/project-track/servers-ssh-keys/`
- Published content: 3 articles in `content/published/`
- Seed fallback: 10 articles from `content-plan.ts`
