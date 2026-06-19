---
name: affiliate-social-readiness
description: Audit and improve FPVLovers for affiliate applications, sponsor outreach, commercial content growth, technical SEO, trust, and professional social promotion. Use when Codex must assess affiliate or sponsor readiness, create the five affiliate/social deliverables under docs, plan a 90-day commercial roadmap, draft application or media-kit copy, inspect or implement legal/trust pages, or verify commercial pages and social launch assets without inventing traffic, partnerships, testing, or performance claims.
---

# Affiliate & Social Marketing Readiness

Turn the current FPVLovers repository into an evidence-backed, commit-ready affiliate and social marketing package. Inspect before writing, preserve the tactical/cinematic voice, and separate facts from proposals.

## Operating boundaries

- Work from the active app root containing `package.json`, `src/app`, `content`, and `data`. In the current checkout this is `fpvlovers-frontend-websitesi/`.
- Treat source files, generated content, and live behavior as different evidence classes. Do not describe a route as live merely because a file exists.
- Never invent traffic, conversion, audience-size, product-testing, partnership, commission, sponsor, or affiliate-approval claims.
- Do not imply participation in Amazon Associates or another program unless repository evidence or the user confirms approval. Flag unsupported participation language as a blocker.
- Keep prices, availability, program terms, disclosure requirements, and network eligibility labeled for live verification because they change.
- Preserve `data/*.json` schemas. Do not rename or delete existing fields.
- Use `src/app`; do not recreate legacy root `app/` or `lib/` trees.
- Do not call Dify or Crawl4AI for this audit. If later content generation is requested, obey the project gateways and use `CRAWL_DRY_RUN=true` first.
- Prefer improving existing files over creating duplicate routes or documents.
- Use English for public-facing copy and deliverables unless the user explicitly requests another language.

## Required workflow

### 1. Establish repository truth

Read `AGENTS.md`, `PROJECT_MEMORY.md`, and `NEXT_ACTIONS.md` when present. Inspect:

- `src/app/**/page.tsx`, `layout.tsx`, `robots.ts`, and sitemap implementation
- `content/published/*`, content roadmap files, and content-generation contracts
- `data/affiliates.json`, `data/ctas.json`, `data/sponsors.json`, product catalogs, and campaign data
- existing `docs/` outputs before creating new ones
- shared navigation/footer, affiliate components, article rendering, and analytics events

Run the deterministic inventory from the app root:

```bash
node .agents/skills/affiliate-social-readiness/scripts/audit-readiness.mjs \
  --root . \
  --out reports/affiliate-social-readiness-inventory.json
```

Treat the JSON as leads, not final conclusions. Confirm material findings in source and cite repo paths in the audit.

### 2. Score the baseline

Read [readiness-rubric.md](references/readiness-rubric.md). Score only evidence verified in the current run. Record:

- baseline score before changes
- evidence and deduction for every category
- critical blockers independently of the numeric score
- confidence and unverified/live-only items

Never manufacture a higher "after" score. Re-score only fixes actually implemented and verified.

### 3. Build the commercial content map

Inventory reviews, comparisons, buyer guides, starter kits, and evergreen buying-intent content by canonical slug, not raw file count. Markdown/JSON pairs may represent one article.

Create a 90-day roadmap with these seed clusters plus repository-discovered gaps:

- best beginner FPV drones
- best FPV goggles
- best FPV radios
- best cinewhoop kits
- best LiPo chargers
- DJI O3 vs Walksnail
- ELRS radio guide
- FPV starter kits by budget
- racing gear checklist
- long-range FPV setup guide

For every idea include search intent, affiliate potential, internal links, suggested product categories or verified catalog products, page type, priority, funnel stage, and dependency. Do not present keyword volume without sourced research.

### 4. Audit trust, compliance, and technical SEO

Verify route existence and substantive content for About, Contact, Privacy, Terms, Editorial Policy, Affiliate Disclosure, and Advertising/Sponsorship Policy. Check disclosure proximity on commercial pages, editorial independence, contact method, authorship, update dates, corrections policy, claims, and sponsor labeling.

Inspect metadata coverage, canonical URLs, Open Graph/Twitter cards, sitemap, robots, Article/Product/Review/Breadcrumb schema opportunities, internal links, CTA destinations and `rel` attributes, thin pages, duplicate metadata, mobile UX, and page-speed risks. Use the repo's existing Next.js metadata patterns; do not add a competing SEO library by default.

When implementation is relevant, create or improve the canonical routes:

- `/affiliate-disclosure` or retain `/disclosure` and make naming/linking explicit
- `/advertise`
- `/editorial-policy`
- `/contact`
- `/about`

Do not create aliases that cause duplicate indexable pages without redirects/canonical handling.

### 5. Create the application and promotion system

Read [brand-social-guidance.md](references/brand-social-guidance.md). Produce truthful application answers and reusable platform-native templates for Facebook, Instagram, YouTube Shorts, TikTok, X, and Reddit-friendly community posts.

Keep social copy cinematic, technical, credible, and community-first. Avoid fake urgency, exaggerated influencer language, engagement bait, hidden ads, and identical copy pasted across every platform.

### 6. Write or improve deliverables

Read [deliverable-contracts.md](references/deliverable-contracts.md). Create or update exactly:

- `docs/affiliate-readiness-audit.md`
- `docs/affiliate-application-pack.md`
- `docs/social-media-playbook.md`
- `docs/content-roadmap-affiliate.md`
- `docs/sponsor-media-kit-copy.md`

Use explicit placeholders such as `[INSERT VERIFIED MONTHLY SESSIONS]` when a form requires unavailable data. Do not bury blockers in optimistic prose.

### 7. Implement prioritized fixes

If the request includes implementation, fix P0/P1 trust and technical issues that can be proven locally. Keep edits scoped. For serious UI changes, run the local app and inspect desktop and mobile rendering with browser automation.

Do not apply to programs, contact sponsors, publish posts, deploy, rotate credentials, or modify production systems without explicit approval.

### 8. Verify and report

Run the fastest relevant checks first, then broaden based on changed files:

```bash
pnpm routes:audit
pnpm content:audit
pnpm exec tsc --noEmit
pnpm lint
```

Also run `git diff --check`, inspect changed docs for placeholders/unsupported claims, and rerun the inventory after implementation. For route/UI edits, verify rendered pages at mobile and desktop widths.

Report:

- files created or modified
- baseline and verified after score with category deltas
- remaining blockers and required owner
- checks run and exact failures/skips
- next actions ordered by application impact

Use the project response shape when summarizing execution:

```text
[UI|RAG|AGENT] ACTION: <work completed>
REASON: <effect on affiliate, sponsor, or social readiness>
IMPACT: tech: <effect> | ux: <effect> | ops: <effect>
```
