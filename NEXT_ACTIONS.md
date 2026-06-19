# FPVLovers Next Actions

Last updated: 2026-06-19

## Approved Affiliate + Social/Video Program (2026-06-19)

Execute in this order; do not start social/video implementation before the affiliate publication boundary is verified.

1. **Affiliate Phase 1 - Governance contract:** add regression tests and types for product-review-only human approval, Hazar Volga Ekiz editor identity, evidence/testing/product-relationship fields, and autonomous non-review quality gates.
2. **Affiliate Phase 2 - Publishing boundary:** stop cron from directly publishing product reviews; store them as review drafts, add explicit approval transitions, and keep qualified non-review content autonomous.
3. **Affiliate Phase 3 - Public trust layer:** correct unsupported partnership language, expose article-level disclosures and methodology, publish independent product-evaluation terms, and hide review scores until their evidence and approval contract is satisfied.
4. **Affiliate Phase 4 - Commercial readiness:** remediate thin flagship reviews/comparisons/buyer guides, verify metadata/schema/internal links/CTAs, then produce an evidence-backed readiness score and application shortlist.
5. **Social Phase 1 - Content distribution:** create structured social jobs and reusable Facebook, Instagram, LinkedIn, YouTube Shorts, TikTok, X, and Reddit-safe templates derived from approved article facts.
6. **Social Phase 2 - Video pipeline:** add a Dify video-director manifest, deterministic validation, TTS/render job boundary, and private-by-default YouTube upload adapter with synthetic/paid-product metadata support.
7. **Social Phase 3 - MVP proof:** render and QA one 45-second English educational Short (initial topic: DJI O3 vs Walksnail). Do not frame it as hands-on testing unless real test evidence exists.
8. **Operations:** preserve the rescue branch until production verification, use dry-run for external publishing/upload, and record local/pushed/deployed boundaries in memory and handoff.

Canonical documents:

- `docs/superpowers/specs/2026-06-19-affiliate-editorial-governance-design.md`
- `docs/superpowers/plans/2026-06-19-affiliate-editorial-governance.md`
- `docs/superpowers/specs/2026-06-19-social-video-automation-design.md`
- `docs/superpowers/plans/2026-06-19-social-video-automation.md`

### Local commit status

- ✅ Affiliate governance contract and regression suite implemented.
- ✅ Product-review-only Hazar Volga Ekiz approval boundary implemented in cron, admin transitions, and artifact publisher.
- ✅ Trust pages, product-evaluation terms, inline article disclosure, score suppression, thin-commercial noindex/hub/sitemap policy, canonical/social metadata, and Article JSON-LD implemented.
- ✅ Affiliate audit/application/media-kit/roadmap/playbook updated; source-level score moved from 52/100 to 81/100.
- ✅ Seven-platform social fact-pack/job/variant system and protected admin dry-run endpoint implemented.
- ✅ Dify video-director adapter and strict private video manifest implemented through the guarded Dify client.
- ✅ Private-by-default YouTube resumable upload adapter implemented; live upload remains disabled.
- ✅ 45-second 1080x1920/30fps English Short MVP rendered locally with TTS and visually inspected; generated output remains in the rescue snapshot while reproducible source and narration remain on `main`.
- ✅ Reconciled implementation committed as `2b025b1`; readiness skill and playbooks committed as `e3a7c8a`.
- ✅ Full 2026-06-19 release gate passed, including the 120-page production build with committed-content fallback when the Coolify-only PostgreSQL hostname was unavailable locally.

### Remaining launch operations

1. Preserve the rescue snapshot at `rescue/pre-main-cleanup-2026-06-19` until the reconciled commits are pushed and verified.
2. Install/authorize HyperFrames CLI, then run `lint`, `inspect`, and native render against `video/fpvlovers-short/`; compare with the verified fallback MP4 preserved in rescue commit `592912a`.
3. Import/publish the Dify social-video-director workflow and set `DIFY_VIDEO_DIRECTOR_TOKEN`; validate with `CRAWL_DRY_RUN=true` first.
4. Configure YouTube OAuth secrets and test one private upload. Keep `ENABLE_YOUTUBE_UPLOAD` false until the private payload and account are verified.
5. Deploy only after existing security/credential prerequisites, then browser-test trust routes, commercial hubs, article trust panels, sitemap, and mobile footer/disclosure behavior.
6. Backfill sources/internal links for the ten substantial commercial pages and obtain the first real product-review evidence/approval from Hazar Volga Ekiz.
7. Apply selectively to verified Wave 1 programs only after the live gates pass; keep GetFPV/RDQ and unverified brands in direct-outreach status.

## Immediate Security Actions

1. Rotate the Dify console credential and `CRON_SECRET` in their owning systems; current Git files no longer contain the exposed values, but removal does not revoke them.
2. After rotation, plan a coordinated Git-history rewrite and force-push window so all collaborators can re-clone safely.
3. Keep `pnpm security:audit` in the local release gate to prevent tracked credential values, hardcoded Dify tokens, and developer-specific audit paths from returning.

## Deployment Tasks

1. ✅ Production read-only verification completed on 2026-06-19: the healthy Coolify container and `origin/main` both run `061f0f705a415046b7ba5e07df77ece3f41c56e8`.
2. ✅ Complete local release gate passed after the affiliate/social reconciliation commits.
3. ✅ Replaced the broken Cloudflare Pages action with repository-root CI validation; Coolify remains the only production deploy path.
4. Rotate the exposed Dify and cron credentials before deploying a build that depends on the new env-only credential paths.
5. Deploy through Coolify only after rotation and remote Git synchronization; record the live commit and post-deploy smoke evidence.
6. After deploy, browser-verify the iFlight review cover fallback because local port binding was blocked during this session.

## Completed (2026-06-19 Topic-Aware Fallback Covers)

- Added 12 approved topic-family covers plus one generic final fallback, optimized as `1536x960` WebP assets (2.4 MB total).
- Added deterministic metadata routing and the browser error chain `original -> topic -> generic` for homepage cards and article covers.
- Preserved explicit article covers instead of promoting unrelated body-section or gallery images over them.
- Passed topic-cover regression, TypeScript, ESLint, content integrity, full production build, desktop Browser QA, and `390x844` mobile Browser QA with clean console output.
- Deployed through Coolify from `origin/main` as commit `061f0f7`; live container health was verified on 2026-06-19.

## Completed (2026-06-18 Post-Analysis Phase 1)

- Removed tracked operational credential values from current documentation.
- Removed hardcoded Dify token fallbacks from YouTube generation and retrieval testing.
- Routed retrieval quality tests through `src/lib/dify-client.ts`.
- Moved the unified metadata report to `reports/unified-metadata-report.md` and added `pnpm metadata:audit`.
- Added `pnpm security:audit`; fresh security audit, metadata audit, TypeScript, and whitespace checks pass locally.

## Completed (2026-06-18 Post-Analysis Phase 2)

- Completed discovery metadata for all 117 published artifacts; all six audited metadata fields now report zero missing values.
- Canonicalized `Buyers Guides` to `Buyer Guides` in existing artifacts and the commercial content generator.
- Replaced the destructive target-only migration with an idempotent merge migration that preserves review, comparison, and buyer-guide metadata.
- Added `pnpm metadata:test` and `pnpm metadata:migrate`; regression, metadata, content-integrity, and TypeScript gates pass locally.

## Completed (2026-06-18 Post-Analysis Phase 3)

- Removed all 13 semantic `any` annotations introduced in the 18 June change range.
- Removed all 82 trailing-whitespace and extra-EOF-newline violations in the same range.
- Added `pnpm quality:recent`, with an overridable `QUALITY_BASE_REF`, to prevent regressions.
- Fresh recent-quality, TypeScript, and full-repository ESLint gates pass locally.

## Completed (2026-06-18 Post-Analysis Phase 4)

- Reconciled project memory and next actions with commits `e3813ae`, `55b8f6c`, and `a16bdcb`.
- Replaced the obsolete May Task 2 handoff generator with a Git-aware release-verification handoff.
- Updated the Opencode brief to preserve local, pushed, deployed, and live-verified boundaries.
- Added `pnpm handoff:test`; generated handoff and stale-state regression checks pass locally.

## Completed (2026-06-18 Post-Analysis Phase 5 Local Verification)

- Passed the complete dry-run release gate and generated a 118-page production build.
- Verified the live healthy container is exactly image commit `845afc598a5022f6b003fd961a516a8caa334920`.
- Browser-smoked homepage, Reviews, Comparisons, Buyer Guides, and Reviews-to-article navigation with clean console output.
- Added resilient article-cover fallback after live QA exposed an unavailable external iFlight catalog image.
- Kept local-only, pushed, deployed, and live-verified states explicit; the new closure commits are not pushed or deployed.

## ✅ Completed (2026-06-14 GAP Closure Sprint)

- GAP raporu yazıldı (25 bulgu, 17'si çözüldü)
- 11 Dify token'ı env var'a taşındı (hardcoded → .env)
- NEXT_PUBLIC_GEMINI_API_KEY → GEMINI_API_KEY rename
- 31 admin route'a inline auth guard eklendi
- CRON_SECRET bypass kaldırıldı
- Token budget mismatch düzeltildi (dosyada 100000, her zaman 500)
- Retrieval orchestrator gerçek Dify Dataset API'ye bağlandı (ENABLE_REAL_RAG=true)
- 5 boş dataset için 10 seed URL eklendi
- 89 eski makaledeki genel stok/placeholder referansları temizlendi
- Crawl kaynak görsellerini koruyan medya politikası netleştirildi
- Unsplash/Pexels/Picsum için runtime denylist ve `media:audit` eklendi
- Published artifact filesystem + PostgreSQL dayanıklılığı eklendi
- Content smoke testi gerçek kuyruktan izole edildi
- Canlıda üretilen 7 eksik makale Git çalışma ağacına senkronize edildi
- YouTube transcript otomatik altyazı desteği eklendi
- deploy-clean branch'inden eksik 3 özellik main'e alındı
- Kullanılmayan paketler kaldırıldı (@hookform/resolvers, react-hook-form, react-is)
- Affiliate tıklama takibi eklendi
- NativeAds dinamik props tabanlı hale getirildi
- URL allowlist + SSRF koruması eklendi
- View counter 0 değerini de gösteriyor (artık hep görünür)
- Production env var'ları Coolify'da tanımlandı
- Generate pipeline çalışıyor, içerik üretiliyor (Racing)
- Crawl pipeline çalışıyor (CRAWL_DRY_RUN=false)

## Manuel Yapılacak (Coolify)

1. ✅ `be392db` production deploy tamamlandı; container healthy ve restart sayısı 0
2. ✅ Published artifact backfill tamamlandı: 109 benzersiz slug, 0 eksik metadata
3. ✅ `/api/health`, homepage ve crawl/üretici görselli makale doğrulandı
4. Crawl/generate cron'ları aktif (5dk/20dk); yeni üretimlerin shadow tabloya otomatik yazıldığını izlemeye devam et

## Ertelenen (Düşük Öncelik)

- Admin panel 1676 satır → modüler bileşenlere böl (GAP-TECH-001)
- 43 boş catch bloğuna console.error ekle (GAP-TECH-004)
- 7 Dify workflow DSL import (Dify UI manuel işlem)
- Racing intelligence store → pending-review girişleri doğrula
- İçerik pipeline'ına monetizasyon enjeksiyonu (derin entegrasyon)
- Husky deprecation uyarılarını düzelt (.husky/pre-commit, .husky/commit-msg)

## Sunucu Bilgileri

- **Hulyaekiz (161.118.171.201):** fpvlovers Coolify + Crawl4AI primary
- **Aluplan-one (80.225.231.62):** Dify + PostgreSQL + Redis + Qdrant
- **Orko (141.148.206.187):** Crawl4AI backup
- **Dify console URL:** https://dify.affexai.tr (credentials are managed outside Git)
- **Coolify:** https://coolify.fpvlovers.com.tr (hulyaekiz üzerinde)
- **Cron:** 5dk crawl, 20dk generate (hulyaekiz crontab)
- **Cron authentication:** `CRON_SECRET` is managed in Coolify and the server crontab; never record its value in Git

## Restore Points

- `backup/pre-gap-plan-2026-06-14` → GAP düzeltmeleri öncesi snapshot
- `sprint/gap-fixes-round2-2026-06-14` → Round 2 başlangıcı
