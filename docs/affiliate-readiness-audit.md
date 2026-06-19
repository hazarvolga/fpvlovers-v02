# FPVLovers Affiliate & Sponsor Readiness Audit

Evidence date: 2026-06-19
Scope: repository source and content inventory only; production behavior and affiliate-network status were not verified.

## Executive verdict

FPVLovers has meaningful topical depth, dedicated Reviews, Comparisons, and Buyer Guides hubs, 117 readable published artifacts in the project content audit, and most core trust pages. The baseline was nevertheless **52/100 (not ready)** because public copy made unsupported Amazon participation, hands-on testing, licensed-editor, and manual-publishing claims; commercial link handling was incomplete; and no advertising policy existed.

This implementation removed those unsupported claims, added `/advertise`, exposed trust links in the footer, added `rel="sponsored"` to shared affiliate components, introduced a product-review-only human approval gate, withheld legacy review scores, added article-level trust/disclosure UI, and excluded nine thin commercial artifacts from indexing, sitemap, and commercial hubs. The verified source-level score is now **81/100 (conditionally ready)**. Do not submit broad applications until live QA and the remaining source/content blockers are closed.

## Scorecard

| Category | Before | After | Evidence and remaining deduction |
|---|---:|---:|---|
| Trust and legal | 12/20 | 19/20 | Seven substantive trust routes exist; product-evaluation terms and named review editor are explicit; production visibility still requires live QA |
| Commercial content | 15/20 | 14/20 | Ten commercial artifacts exceed 600 words, but source provenance/internal linking is uneven and no legacy product review currently satisfies the approval contract |
| Editorial quality | 6/15 | 12/15 | Review-only human gate, methodology, testing status, editor identity, and score suppression are implemented; legacy evidence records remain incomplete |
| Affiliate compliance | 5/15 | 13/15 | Disclosure corrected, shared links marked sponsored, and article-level commercial notice added; destination validation remains open |
| Technical SEO | 7/15 | 10/15 | Metadata base, canonical, OG/Twitter, Article JSON-LD, noindex policy, and sitemap filtering are implemented; broader metadata and schema validation remain |
| Social and brand system | 4/10 | 9/10 | Launch direction existed; this pass adds a platform playbook and reusable templates, but accounts/assets are not live-verified |
| Measurement and operations | 3/5 | 4/5 | Analytics and affiliate event code exist; no traffic/conversion claims were accepted as evidence |
| **Total** | **52/100** | **81/100** | **Conditionally ready after remaining P0 work** |

## Strengths

- The project content audit reads 117 published artifacts. The static filename inventory sees 118 unique stems across 235 Markdown/JSON files; the one-item difference requires reconciliation before using either count externally.
- Existing commercial foundations include at least six review slugs, eight comparison-oriented slugs, and eight buyer/starter/checklist slugs by filename evidence.
- Dedicated hubs exist at `/reviews`, `/comparisons`, and `/buyers-guides`.
- Trust routes exist for `/about`, `/contact`, `/privacy`, `/terms`, `/editorial-policy`, and `/disclosure`.
- `data/affiliates.json` contains 15 product records and `data/fpv-products.catalog.json` contains 89 catalog products. These are inventory inputs, not proof of affiliate approval or live availability.
- Shared click tracking exists in `src/features/monetization/components/AffiliateButton.tsx` and `src/lib/analytics`.
- The brand already has a credible "FPV Knowledge Operating System" direction and the `FOLLOW THE SIGNAL` launch concept.

## Findings and priorities

| Priority | Finding | Evidence | Risk | Required action |
|---|---|---|---|---|
| P0 | Affiliate program status is unverified | Previous `/disclosure` copy claimed Amazon participation; repository contains retailer URLs but no approval evidence | Application rejection and misleading disclosure | Keep neutral disclosure until each approval is confirmed; then add exact required network language |
| P0 | Live trust/commercial UX is unverified | Audit covered source only | Broken route or mobile issue can invalidate application credibility | Verify homepage, footer, seven trust pages, hubs, article CTA, and contact flow in production/mobile |
| P0 | Production behavior is not verified | Changes are source-level and local-only | A broken trust route or hidden disclosure can still weaken approval | Deploy only after current security prerequisites, then test desktop/mobile trust and commercial flows |
| P0 | Legacy commercial source provenance is incomplete | 19 commercial artifacts; nine are 67-121 words and all lack structured evidence records | Thin-affiliate and unsupported-claim risk | Nine thin pages are excluded from index/hubs; enrich and source the ten substantial pages before broad applications |
| P0 | CTA destinations are seed/search URLs and may not be affiliate links | `data/affiliates.json` includes retailer search/product URLs with zero tracked outcomes | Broken or non-monetized application story | Validate availability, geography, affiliate tag, redirect, and landing relevance before activation |
| P1 | Product/Review schema is intentionally withheld | No current legacy review satisfies hands-on approval/evidence rules | Invalid rich-result markup if old scores are emitted | Add Product/Review JSON-LD only after Hazar Volga Ekiz approves a real evidence record |
| P1 | Authorship/source state is incomplete on legacy articles | New trust panel is explicit, but old artifacts have no structured source/editor records | Editorial credibility risk | Backfill source evidence and update dates without fabricating approval |
| P1 | Commercial cluster depth is uneven | Current filenames show goggles/radios/video-system strength; charger/cinewhoop/budget/long-range roundups are thinner | Applications look opportunistic rather than editorial | Execute the 90-day roadmap and connect clusters with internal links |
| P1 | Static metadata coverage is incomplete | Inventory reports metadata on 41 of 59 page routes after `/advertise` | Index/share quality varies by route | Audit the 18 uncovered routes; exclude utility/admin routes before assigning work |
| P2 | Footer trust navigation lacked policy breadth | Before this pass footer linked Privacy, Terms, Disclosure only | Trust pages were harder for reviewers to find | Implemented Editorial, Advertise, and Contact footer links |
| P2 | Shared affiliate links lacked sponsored relationship | `AffiliateButton` used nofollow only; `AffiliateBlockView` lacked rel/target | Compliance signal gap | Implemented `nofollow sponsored noopener noreferrer` |

## Trust route matrix

| Route | Source status | Substance | Footer | Live verified |
|---|---|---|---|---|
| `/about` | Present, claims corrected | Strong mission and system explanation | Indirect/navigation dependent | No |
| `/contact` | Present with form/email | Strong; response claims should remain operationally honest | Added direct footer link | No |
| `/privacy` | Present | Covers data and third-party services | Yes | No |
| `/terms` | Present | Covers service/pilot responsibility | Yes | No |
| `/editorial-policy` | Present, claims corrected | Methodology and commercial safeguards | Added | No |
| `/disclosure` | Present, rewritten | Neutral until approvals are verified | Yes | No |
| `/advertise` | Added | Independence, disclosure, formats, rejection criteria | Added | No |

## Commercial inventory snapshot

Structured inventory on 2026-06-19 found **19** commercial artifacts: five reviews, three comparisons, nine buyer guides, and two product roundups. Nine pages contain only **67-121 words** and are now excluded from indexable commercial surfaces. Ten pages exceed 600 words; seven exceed 2,800 words. All still require source-provenance review before broad affiliate applications.

Strong current examples include:

- Review filename signals: RadioMaster Boxer ELRS, DJI O3 Air Unit, BetaFPV Cetus X, iFlight Nazgul Evoque F5, Jumper T-Pro ELRS.
- Comparisons: DJI O3 vs Walksnail, DJI Goggles 2 vs Integra, RadioMaster Boxer vs TX16S, cinematic vs freestyle, analog/digital goggles.
- Buyer intent: Best FPV Goggles 2026, Best FPV Starter Kits 2026, goggles buyer guides, first-radio guide, best 5-inch frame.

Weak/missing clusters: best radios roundup, best LiPo chargers, best cinewhoop kits, beginner drones by budget, racing gear checklist, and long-range system buyer guide.

## Technical SEO and UX risks

- Root metadata now provides `metadataBase`, Open Graph, and Twitter defaults.
- Published articles now provide canonical, robots, Open Graph, Twitter, and Article JSON-LD metadata.
- Review/Product schema remains correctly disabled until the human-review evidence contract is met.
- Commercial internal links require semantic review; raw `internalLinks` keys do not prove useful links.
- Image-heavy remote covers and dynamic content can affect LCP and broken-image trust.
- Footer now contains more links; verify wrapping and tap targets at 320-390px widths.
- Sitemap/robots source exists, but generated URL completeness and production response need validation.

## Implemented in this pass

- Created the `affiliate-social-readiness` Codex skill and deterministic inventory script.
- Rewrote affiliate disclosure without unverified program participation.
- Corrected unsupported manual publishing, licensed pilot, bench-testing, and community-founder claims.
- Added `/advertise` with editorial-independence and disclosure rules.
- Added Editorial Policy, Advertise, and Contact links to the footer.
- Added sponsored/noopener/noreferrer handling to shared affiliate link components.
- Added product-review-only publication governance and named Hazar Volga Ekiz as Product Review Editor.
- Stopped cron from directly publishing product reviews and added evidence-backed admin transitions.
- Added article trust/disclosure UI and suppressed unapproved numeric review scores.
- Excluded thin/unapproved commercial artifacts from hubs, sitemap, and search indexing.
- Added canonical, social metadata, and Article JSON-LD to the primary article path.

## Go/no-go

- **Now:** no-go for broad batch applications and product-review claims.
- **After live QA plus source/internal-link remediation of ten substantial commercial pages:** go for selective Wave 1 applications.
- **After at least one genuine Hazar-approved review and verified performance evidence:** go for product-seeding and sponsor outreach.
- Created the application pack, social playbook, 90-day roadmap, and media-kit copy.

## Go/no-go

**Go:** prepare applications, create account profiles, and gather verified facts.
**No-go:** claim an existing affiliate/sponsor relationship or submit broad applications before P0 live QA, inline disclosure, and destination validation are complete.
