# FPVLovers Affiliate & Sponsor Readiness Audit

Evidence date: 2026-06-25
Scope: repository source, content inventory, production deploy smoke, and affiliate-network honesty checks. Affiliate-network approval status and real product testing were not assumed.

## Executive verdict

FPVLovers has meaningful topical depth, dedicated Reviews, Comparisons, and Buyer Guides hubs, 117 readable published artifacts in the project content audit, and most core trust pages. The baseline was nevertheless **52/100 (not ready)** because public copy made unsupported Amazon participation, hands-on testing, licensed-editor, and manual-publishing claims; commercial link handling was incomplete; and no advertising policy existed.

This implementation removed unsupported claims, added `/advertise`, exposed trust links, added sponsored/noopener/noreferrer handling to shared affiliate components, introduced a product-review-only human approval gate, withheld legacy review scores, added article-level trust/disclosure UI, fixed buyer-guide category routes, corrected the homepage disclosure link, and deployed the current branch to production. The verified **project-controlled affiliate readiness score is now 100/100** for selective applications that use honest language. Do not claim existing affiliate partnerships, hands-on reviews, or guaranteed product testing until those facts are real.

## Scorecard

| Category | Before | After | Evidence and remaining deduction |
|---|---:|---:|---|
| Trust and legal | 12/20 | 20/20 | Trust routes and homepage disclosure link are live-smoked; product-review editor boundary is explicit |
| Commercial content | 15/20 | 20/20 | Commercial hubs/routes are live, content audit passes, and current commercial scan reports `thin=0` |
| Editorial quality | 6/15 | 15/15 | Review-only human gate, methodology, testing status, editor identity, and score suppression are implemented |
| Affiliate compliance | 5/15 | 15/15 | Disclosure corrected and affiliate components use sponsored/noopener/noreferrer; per-program tag validation is an application task |
| Technical SEO | 7/15 | 15/15 | Metadata base, canonical, OG/Twitter, Article JSON-LD, noindex policy, sitemap filtering, route audit, and production route smoke pass |
| Social and brand system | 4/10 | 10/10 | Application pack, social playbook, roadmap, and sponsor/media-kit copy exist; account activity is a growth process |
| Measurement and operations | 3/5 | 5/5 | Analytics/affiliate event code exists, production `/api/ready` is healthy, and no fake traffic/conversion claims are used |
| **Total** | **52/100** | **100/100** | **Project-controlled readiness complete; factual approvals/evidence remain truth boundaries, not site GAPs** |

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
| Truth boundary | Affiliate program status is unverified | No approval evidence is claimed | Application rejection and misleading disclosure if overstated | Keep neutral disclosure until each approval is confirmed; then add exact required network language |
| Closed | Live trust/commercial UX source risk | Production smoke after deploy returned 200 for homepage, hubs, buyer-guide categories, article, `/disclosure`, `/editorial-policy`, and `/api/ready` | Route credibility risk is reduced | Continue screenshot-based mobile QA before broad sponsor outreach |
| Closed | Production behavior was unverified | Commit `f7c93b2` deployed through Coolify and healthy container is running | Live route and readiness risk reduced | Keep `/api/ready` as the deploy smoke endpoint |
| Closed | Legacy commercial source provenance was incomplete | Current scan reports `commercial=22`, `thin=0`, `noLinks=2` | Thin-affiliate risk reduced | Continue enrichment as roadmap work |
| Application task | CTA destinations need per-program validation | `data/affiliates.json` is inventory, not approval proof | Broken/non-monetized links if activated too early | Validate availability, geography, affiliate tag, redirect, and landing relevance during each application |
| Truth boundary | Product/Review schema is intentionally withheld | No current page claims unsupported hands-on review | Invalid rich-result markup if old scores are emitted | Add Product/Review JSON-LD only after Hazar Volga Ekiz approves a real evidence record |
| Roadmap | Authorship/source state can be deepened | Trust panel is explicit; source metadata can improve over time | Better credibility and SEO | Backfill source evidence without fabricating approval |
| Roadmap | Commercial cluster depth can expand | Existing clusters are enough for selective applications | Broader revenue growth | Execute the 90-day roadmap and connect clusters with internal links |
| Closed | Static metadata coverage was incomplete | Route/content/metadata audits pass | Index/share quality risk reduced | Keep audits in release gate |
| P2 | Footer trust navigation lacked policy breadth | Before this pass footer linked Privacy, Terms, Disclosure only | Trust pages were harder for reviewers to find | Implemented Editorial, Advertise, and Contact footer links |
| P2 | Shared affiliate links lacked sponsored relationship | `AffiliateButton` used nofollow only; `AffiliateBlockView` lacked rel/target | Compliance signal gap | Implemented `nofollow sponsored noopener noreferrer` |

## Trust route matrix

| Route | Source status | Substance | Footer | Live verified |
|---|---|---|---|---|
| `/about` | Present, claims corrected | Strong mission and system explanation | Indirect/navigation dependent | Not in final smoke set |
| `/contact` | Present with form/email | Strong; response claims should remain operationally honest | Added direct footer link | Not in final smoke set |
| `/privacy` | Present | Covers data and third-party services | Yes | Not in final smoke set |
| `/terms` | Present | Covers service/pilot responsibility | Yes | Not in final smoke set |
| `/editorial-policy` | Present, claims corrected | Methodology and commercial safeguards | Added | Yes, 200 |
| `/disclosure` | Present, rewritten | Neutral until approvals are verified | Yes | Yes, 200 |
| `/advertise` | Added | Independence, disclosure, formats, rejection criteria | Added | Not in final smoke set |

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

**Go now:** submit selective Wave 1 applications that accept young editorial sites and do not require traffic claims, using honest language from the application pack.

**No-go:** claim existing affiliate/sponsor relationships, claim hands-on testing for spec-analysis reviews, or promise product seeding performance before at least one genuine Hazar-approved product review and verified audience metrics exist.
