# FPVLovers Production Validation & Affiliate Launch Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `fpv-memory`, `seo-analiz`, `monetizasyon`, and `icerik-uretim`. Execute one phase at a time, verify the exit gate, then update the operating report. This is an operations plan, not a feature-development plan.

**Goal:** Move FPVLovers from development into a 30-day production-validation cycle that can earn and measure its first affiliate revenue.

**Architecture:** Keep the current Next.js, Dify, Crawl4AI, metadata, discovery, commercial, trust, and analytics architecture unchanged. Work is limited to production verification, small launch-blocker corrections, commercial content improvement, affiliate applications, Search Console operations, and KPI reporting.

**Tech Stack:** FPVLovers production site, Google Search Console, GA4, existing PostgreSQL analytics events, Dify, Crawl4AI, and current affiliate resolver.

---

## 0. Executive Decision

FPVLovers is technically deployable but is **not yet affiliate-application ready**.

Current evidence:

- 117 published artifacts; 18 are classified as commercial content.
- Live hubs work: 5 reviews, 3 comparisons, and buyer-guide content are discoverable.
- The live RadioMaster Boxer review is only about 151 visible words.
- The live FPV Goggles buyer guide is about 3,442 visible words but has no commercial CTA.
- `/reviews`, `/comparisons`, and `/buyers-guides` have unique H1/title/description, but no canonical or JSON-LD.
- The three commercial hubs are absent from the current sitemap static-page list.
- `review_click`, `comparison_click`, `buyer_guide_click`, and `affiliate_click` emit events.
- The current dashboard does not calculate true CTR because hub/card impressions and article/CTA impressions are not used as denominators.
- Affiliate CTA links use `nofollow`, but the component does not currently add `sponsored`.
- Amazon’s official review process requires at least three qualifying sales in the first 180 days, robust original content, and generally at least ten public posts. FPVLovers has enough total posts, but the review corpus is not yet strong enough to risk a one-shot rejection.
- New closure work and the iFlight cover fallback remain local-only; the deployed production commit boundary must be recorded before applications.

**Launch recommendation:** spend Days 1–7 closing commercial-readiness gaps, then apply to low-friction/general networks. Apply to Amazon and selective brand programs only after five flagship reviews and three commercial hubs meet the quality gate.

## 1. Non-Goals and Guardrails

- No new major features.
- No frontend redesign.
- No new sections or routes.
- No architecture refactor.
- No new orchestration system.
- Do not enable autonomous commercial publishing during this cycle.
- Do not use unverified prices, lab claims, commission rates, product availability, or program terms.
- Every commercial page remains editorial-first and includes visible disclosure.
- Product links use `rel="nofollow sponsored"`.
- Search-demand scores below are planning proxies until Search Console data exists; refresh them after 14 and 28 days.

## 2. Phase 1 — Affiliate Launch Plan

### Application-readiness checklist

- [ ] Production commit is deployed and recorded.
- [ ] `/about`, `/contact`, `/privacy`, `/terms`, `/editorial-policy`, and `/disclosure` return 200.
- [ ] Disclosure contains the exact Amazon Associate disclosure when Amazon is activated.
- [ ] Five flagship reviews pass the review quality gate.
- [ ] Three comparison pages pass the comparison quality gate.
- [ ] Five buyer guides contain tested, relevant commercial CTAs.
- [ ] Affiliate links use real issued IDs rather than fallback tags.
- [ ] Every affiliate CTA emits `affiliate_click` with slug, provider, product ID, placement, and network.
- [ ] No dead product link, placeholder image, false price, or unsupported bench-test claim remains.
- [ ] Public content is recent and production is crawlable.
- [ ] Application pack contains site URL, audience statement, traffic channels, content examples, disclosure URL, contact email, and payout/tax details.

### Priority list

| Order | Program | Route | Readiness now | Approval probability after Day 7 | Why this order |
|---:|---|---|---|---:|---|
| 1 | Banggood | Public affiliate signup | Medium | 80% | Low-friction program and broad FPV catalog; useful for early tracking validation. |
| 2 | AliExpress | Official/network affiliate portal | Medium | 75% | Broad inventory and international reach; verify current accepting network and territory first. |
| 3 | SpeedyBee | Direct affiliate/creator application | Medium | 70% | Strong technical-product fit and focused content opportunity. |
| 4 | RadioMaster | Direct affiliate/creator application | Medium | 65% | Existing Boxer review/comparison creates a relevant application story after expansion. |
| 5 | BetaFPV | Direct affiliate/creator application | Medium | 65% | Cetus X and tiny-whoop content provide clear audience alignment. |
| 6 | Flywoo | Direct affiliate/creator application | Low–Medium | 60% | Strong niche fit; first publish a Flywoo-specific commercial asset. |
| 7 | GEPRC | Direct affiliate/creator application | Low–Medium | 55% | Strong product relevance but current site lacks a GEPRC flagship asset. |
| 8 | DJI | Official affiliate/network intake | Medium | 50% | High-value products and existing DJI content, but program availability and acceptance criteria must be rechecked. |
| 9 | GetFPV | Direct partnership/affiliate inquiry | Medium | 45% | Excellent buyer fit; approval is more credible after first traffic and CTR evidence. |
| 10 | RaceDayQuads | Direct partnership/affiliate inquiry | Low–Medium | 40% | Excellent niche fit; lead with measured US traffic and commercial engagement. |
| 11 | Amazon Associates | Country-specific Associates account | Low–Medium | 40% | Apply last to avoid wasting the 180-day/three-sale review window while content is still thin. |

Approval probabilities are internal planning estimates, not promises. Recheck each program’s current intake, geography, prohibited traffic sources, cookie terms, payment threshold, and commission schedule on application day.

### Application sequence

1. Days 6–7: Banggood and AliExpress.
2. Days 8–10: SpeedyBee, RadioMaster, and BetaFPV.
3. Days 11–14: Flywoo and GEPRC after matching content is published or strengthened.
4. Days 15–18: DJI if its current program accepts the operating geography.
5. Days 19–24: GetFPV and RaceDayQuads using early traffic/CTR evidence.
6. Days 25–30: Amazon only if five flagship reviews pass and the plan for three qualifying sales is credible.

**Exit gate:** at least two active affiliate accounts, issued IDs stored in production env, five manually tested tagged links, and zero placeholder/fallback tags on live commercial CTAs.

## 3. Phase 2 — Search Console Readiness

### Current audit result

| Surface | Crawlable | Unique title/description | H1 | Sitemap | Canonical | Structured data | Status |
|---|---:|---:|---:|---:|---:|---:|---|
| `/reviews` | Yes | Yes | Yes | No | No | No | Needs small blocker fixes |
| `/comparisons` | Yes | Yes | Yes | No | No | No | Needs small blocker fixes |
| `/buyers-guides` | Yes | Yes | Yes | No | No | No | Needs small blocker fixes |
| Commercial article pages | Yes | Yes | Yes | Yes | No | No | Indexable, not fully SEO-ready |

### Submission checklist

- [ ] Deploy the intended production commit.
- [ ] Confirm robots allows all public commercial surfaces and blocks only admin/API paths.
- [ ] Add the three existing commercial hubs to the existing sitemap list; do not create a new route/system.
- [ ] Add canonical metadata to the three hubs and commercial articles.
- [ ] Add appropriate existing-page JSON-LD: `ItemList` for hubs; `Product` + `Review` for reviews; comparison-compatible item/product markup; `Article` for buyer guides.
- [ ] Validate structured data with Google Rich Results Test.
- [ ] Verify sitemap returns 200 and only canonical HTTPS URLs.
- [ ] Add the domain property in Search Console and complete DNS verification.
- [ ] Submit `https://fpvlovers.com.tr/sitemap.xml` once.
- [ ] Inspect `/reviews`, `/comparisons`, `/buyers-guides`, and the five flagship article URLs.
- [ ] Request indexing only after each page passes content and canonical review.
- [ ] Record “Discovered”, “Crawled”, “Indexed”, or exclusion state in the weekly scorecard.
- [ ] Review Pages, Sitemaps, Core Web Vitals, HTTPS, and Manual Actions weekly.

**Exit gate:** all three hubs appear in sitemap, canonical and schema validation pass, five flagship URLs are submitted, and no accidental `noindex` or robots block exists.

## 4. Phase 3 — Top 20 Commercial Opportunities

Scoring: 1–5 for **Demand proxy**, **Affiliate potential**, **Commercial intent**, and **FPV relevance**. Maximum 20. Demand is a directional proxy until Search Console impressions exist.

| Rank | Opportunity | Format | State | Demand | Affiliate | Intent | FPV | Total |
|---:|---|---|---|---:|---:|---:|---:|---:|
| 1 | Best FPV Goggles 2026: DJI vs Walksnail vs HDZero vs Analog | Buyer guide | Strengthen existing cluster | 5 | 5 | 5 | 5 | 20 |
| 2 | Best FPV Radio 2026: Boxer, TX16S, Zorro, Pocket | Buyer guide | Create/merge cluster | 5 | 5 | 5 | 5 | 20 |
| 3 | DJI O4 Air Unit Pro Review | Review | Create | 5 | 5 | 5 | 5 | 20 |
| 4 | Best FPV Starter Kits 2026 | Buyer guide | Strengthen existing | 5 | 5 | 5 | 5 | 20 |
| 5 | DJI O4 Pro vs O3 Air Unit | Comparison | Create | 5 | 5 | 5 | 5 | 20 |
| 6 | RadioMaster Boxer ELRS Review | Review | Expand existing | 4 | 5 | 5 | 5 | 19 |
| 7 | RadioMaster Boxer vs TX16S MKII | Comparison | Expand existing | 4 | 5 | 5 | 5 | 19 |
| 8 | DJI Goggles 3 vs Goggles 2 vs Integra | Comparison | Expand topic | 5 | 5 | 5 | 4 | 19 |
| 9 | Best Tiny Whoop 2026 | Buyer guide | Expand existing topic | 5 | 4 | 5 | 5 | 19 |
| 10 | Best 5-Inch FPV Drone 2026 | Buyer guide | Create | 5 | 5 | 5 | 4 | 19 |
| 11 | BETAFPV Cetus X Review | Review | Expand existing | 4 | 4 | 5 | 5 | 18 |
| 12 | DJI O3 vs Walksnail Avatar HD Pro | Comparison | Expand existing | 4 | 5 | 5 | 4 | 18 |
| 13 | Best FPV LiPo Chargers 2026 | Buyer guide | Create | 4 | 5 | 5 | 4 | 18 |
| 14 | Best FPV FC/ESC Stacks 2026 | Buyer guide | Create | 4 | 5 | 5 | 4 | 18 |
| 15 | iFlight Nazgul Evoque F5 Review | Review | Expand existing | 4 | 4 | 5 | 5 | 18 |
| 16 | Best 2207 Motors for 5-Inch FPV | Buyer guide | Create | 4 | 5 | 5 | 4 | 18 |
| 17 | Best ELRS Receivers 2026 | Buyer guide | Create | 4 | 4 | 5 | 5 | 18 |
| 18 | SpeedyBee F405 V4 Stack Review | Review | Create | 4 | 4 | 5 | 5 | 18 |
| 19 | Best FPV Batteries for 5-Inch 6S Builds | Buyer guide | Create | 4 | 5 | 5 | 4 | 18 |
| 20 | GEPRC Mark5 vs iFlight Nazgul Evoque | Comparison | Create | 3 | 4 | 5 | 5 | 17 |

Do not publish all 20 in 30 days. The first month target is five flagship review upgrades, three comparison upgrades, and two buyer-guide cluster consolidations.

## 5. Phase 4 — Review Audit Report

### Existing review baseline

| Review | Current assessment | Primary gap | Action |
|---|---|---|---|
| RadioMaster Boxer ELRS | Strong product fit; live body is about 151 words | Depth, evidence, CTA, schema | Flagship #1 |
| BETAFPV Cetus X | Strong beginner/kit intent | Depth, test method, alternatives, CTA | Flagship #2 |
| DJI O3 Air Unit | High-value and high-interest product | Freshness vs O4, evidence, CTA | Flagship #3 |
| iFlight Nazgul Evoque F5 | High purchase intent | Broken-cover follow-up, evidence, depth | Flagship #4 |
| Jumper T-Pro ELRS | Relevant but lower priority | Depth and differentiation | Secondary |

### Five flagship pillar reviews

1. RadioMaster Boxer ELRS Review.
2. BETAFPV Cetus X Review.
3. DJI O3 Air Unit Review, reframed with an O4-era buying verdict.
4. iFlight Nazgul Evoque F5 Review.
5. DJI O4 Air Unit Pro Review as the only new flagship in Month 1.

### Review quality gate

Each flagship must contain:

- 1,500+ useful words, not padded prose.
- Clear “tested by / researched by” methodology and evidence boundary.
- Current product/version/date.
- Verified specifications with source provenance.
- Use-case verdict and “who should not buy it”.
- Pros, cons, alternatives, compatibility, and value assessment.
- At least two relevant internal links.
- Visible affiliate disclosure before the first commercial CTA.
- One primary and one alternate merchant only when relevant.
- No fabricated bench test or ownership claim.
- Product + Review schema validation.
- SEO score at least 80/100 under `seo-analiz`.

**Exit gate:** five flagship reviews pass a human editorial check and all commercial links work.

## 6. Phase 5 — Buyer Guide Audit Report

### Current assessment

- Strongest asset: FPV Goggles buyer guide, with substantial depth.
- Weakness: meaningful commercial guides often lack live merchant CTAs.
- Duplication risk: two FPV goggles guides and two first-radio guides target overlapping intent.
- Thin asset: `best-fpv-goggles-2026` artifact needs consolidation rather than competing with the strong guide.
- Missing high-value categories: radios, LiPo chargers, FC/ESC stacks, 5-inch RTF quads, motors, batteries, ELRS receivers, VTX systems, action cameras, and tools/soldering.

### Top 10 next buyer guides

1. Best FPV Radios 2026.
2. Best FPV Goggles 2026.
3. Best 5-Inch FPV Drones 2026.
4. Best Tiny Whoops 2026.
5. Best FPV LiPo Chargers 2026.
6. Best FC/ESC Stacks 2026.
7. Best 2207 Motors for 5-Inch FPV.
8. Best 6S LiPo Batteries for FPV.
9. Best ELRS Receivers 2026.
10. Best FPV Soldering Tools and Bench Gear.

Month 1 action is limited to consolidating goggles/radio duplicates and producing two of the ten guides after Search Console evidence is available.

**Exit gate:** no competing duplicate URL targets the same primary keyword; five buyer guides have current recommendations, disclosures, verified links, and comparison tables.

## 7. Phase 6 — Analytics KPI Plan

### Event validation

| Event | Current state | Required validation |
|---|---|---|
| `affiliate_click` | Implemented | Verify one DB row per click and required metadata fields. |
| `review_click` | Implemented on hub cards | Verify hub/card/slug metadata and deduplication. |
| `comparison_click` | Implemented on hub cards | Verify hub/card/slug metadata and deduplication. |
| `buyer_guide_click` | Implemented on hub/category links | Verify both surfaces use consistent metadata. |
| `search_performed` | Implemented | Verify query/result count and privacy-safe storage. |
| Page/session metrics | GA4 available if production env is configured | Verify GA4 realtime and Data API credentials. |

### KPI definitions

| KPI | Formula | Day-30 target |
|---|---|---:|
| Affiliate CTR | `affiliate_clicks / commercial_article_views` | ≥ 3.0% |
| Review CTR | `review_clicks / reviews_hub_views` | ≥ 12% |
| Comparison CTR | `comparison_clicks / comparisons_hub_views` | ≥ 12% |
| Buyer Guide CTR | `buyer_guide_clicks / buyer_guides_hub_views` | ≥ 12% |
| Pages per Session | `page_views / sessions` | ≥ 1.8 |
| Search Usage | `sessions_with_search / sessions` | ≥ 5% |
| Affiliate outbound clicks | Count of valid affiliate clicks | ≥ 50 |
| Indexed commercial URLs | Indexed commercial URLs / submitted commercial URLs | ≥ 70% |

### Dashboard specification

Use the existing analytics/admin surface and a weekly operating sheet. Do not build a new dashboard during this phase.

Required views:

- Date range: 7, 14, and 30 days.
- Funnel: hub view → commercial article click → affiliate click.
- Breakdown: page type, slug, provider, product, placement, device, and acquisition channel.
- Search: searches, zero-result rate, search-result CTR, and top commercial queries.
- SEO: impressions, clicks, CTR, average position, submitted/indexed state.
- Revenue: clicks, orders, conversion rate, commission, EPC, and provider.

**Exit gate:** controlled production clicks appear once in the event store, GA4 realtime records page/session events, and the weekly scorecard can calculate every primary KPI without proxy denominators.

## 8. Phase 7 — 30-Day Operations Roadmap

### Days 1–3: Production and measurement truth

- Record local, pushed, deployed, and live-verified commit boundaries.
- Deploy only after credential rotation requirements are satisfied.
- Validate legal/trust pages, commercial hubs, event ingestion, GA4, robots, and sitemap.
- Fix only launch blockers: sitemap entries, canonical/schema, `sponsored` rel, and tracking metadata/denominators.
- Produce the baseline scorecard.

### Days 4–7: Commercial quality sprint

- Expand RadioMaster Boxer, BETAFPV Cetus X, DJI O3, iFlight Nazgul, and Jumper T-Pro reviews.
- Consolidate duplicate goggles and radio buyer-guide intent.
- Add verified CTAs and disclosures to five buyer guides.
- Run link, claim, metadata, and structured-data QA.
- Submit commercial hubs and five flagship URLs to Search Console.

### Days 8–14: First applications and indexing

- Apply to Banggood, AliExpress, SpeedyBee, RadioMaster, and BetaFPV.
- Publish/upgrade two comparison pillars.
- Monitor Search Console coverage and inspect excluded URLs.
- Share three flagship assets through owned social/community channels without spam or incentivized clicks.
- End-of-week decision: continue, revise, or pause each affiliate application based on response and traffic evidence.

### Days 15–21: Intent-led content

- Refresh opportunity scores with first Search Console query/impression data.
- Publish DJI O4 Pro review only if evidence and current product data pass the quality gate.
- Produce one high-priority buyer guide selected by live impressions, not preference.
- Apply to Flywoo, GEPRC, and DJI when content alignment exists.
- Review funnel drop-off by page type and CTA placement.

### Days 22–30: Revenue validation

- Apply to GetFPV and RaceDayQuads with traffic/CTR evidence.
- Apply to Amazon only if the three-sale plan and content gate are credible.
- Refresh one underperforming review and one buyer guide based on CTR/query data.
- Record affiliate approvals, clicks, orders, revenue, EPC, indexed pages, and top queries.
- Make the Month-2 go/no-go decision.

### Month-2 go/no-go rules

**Go:** at least two approvals, 50 outbound affiliate clicks, ≥3% affiliate CTR, ≥70% submitted commercial URLs indexed, and at least one conversion or clear click-growth trend.

**Revise:** approvals exist but CTR is below 3%; improve content/offer alignment before increasing publishing volume.

**Pause autonomous expansion:** tracking is unreliable, pages remain unindexed, or commercial claims cannot be verified.

## 9. Phase 8 — Autonomous Pipeline Readiness Assessment

### Current verdict: NOT READY for autonomous commercial publishing

| Layer | Readiness | Evidence / missing control |
|---|---|---|
| Dify | Conditional | Generation path exists, but commercial claims need source-level evidence and human approval. |
| Crawl4AI | Conditional | Queue/health controls exist; merchant price/stock freshness and source rights need validation. |
| Metadata | Ready | 117 artifacts have complete discovery metadata after migration. |
| Discovery | Ready | Related/progression/search layers are present. |
| Commercial layer | Conditional | Hubs/types exist; review depth, CTAs, canonical/schema, and duplicate intent need work. |
| Analytics | Conditional | Events exist; funnel denominators and KPI reliability are not yet proven. |

Required before any autonomous review/comparison generation:

- Human approval remains mandatory for every commercial artifact.
- Minimum two independent/primary sources for specs and compatibility.
- Explicit distinction between hands-on testing, desk research, and manufacturer claims.
- Price and availability timestamps; no permanent price claims in prose.
- Product/version freshness check.
- Duplicate-intent and canonical check before generation.
- Affiliate link validation and program approval check.
- Legal disclosure insertion and `nofollow sponsored` validation.
- Claim/evidence audit and hallucination rejection.
- SEO, link, media, and structured-data gates.
- Rollback/unpublish procedure for unsafe or stale recommendations.
- At least 30 days of reliable human-published funnel data before considering supervised automation.

**Exit gate:** Month-1 quality and KPI thresholds pass, then permit supervised drafts only. Publishing remains manual until two consecutive monthly audits pass.

## 10. Deliverables and Operating Files

Create these operational artifacts during execution; none requires a new public route:

- `reports/production-validation/affiliate-launch-plan.md`
- `reports/production-validation/affiliate-application-tracker.csv`
- `reports/production-validation/search-console-checklist.md`
- `reports/production-validation/commercial-opportunities.csv`
- `reports/production-validation/review-audit.md`
- `reports/production-validation/buyer-guide-audit.md`
- `reports/production-validation/analytics-kpi-scorecard.csv`
- `reports/production-validation/30-day-operations-roadmap.md`
- `reports/production-validation/autonomous-pipeline-readiness.md`
- `reports/production-validation/final-recommendation.md`

## 11. Final Recommendation

Treat FPVLovers as a live media/affiliate business immediately, but do not confuse technical readiness with revenue readiness.

The fastest credible path is:

1. Close four small launch blockers.
2. Turn five thin reviews into evidence-backed pillars.
3. Add verified CTAs to the strongest existing buyer guides.
4. Validate the analytics funnel.
5. Apply to low-friction and high-fit programs in waves.
6. Let Search Console and outbound-click data choose Month-2 content.

The correct first business milestone is not “more content.” It is **one measurable path from Google impression → commercial page → affiliate click → approved network → first commission**.
