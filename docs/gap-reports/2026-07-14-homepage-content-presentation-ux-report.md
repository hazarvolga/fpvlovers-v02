# FPVLovers Homepage Content Presentation & UX GAP Report

**Date:** 2026-07-14  
**Scope:** Homepage content discovery, editorial presentation, visual hierarchy, responsive behavior, trust/commercial framing, and the relationship between the live UI and the approved design references.  
**Mode:** Analysis only. No source-code or runtime behavior was changed for this report.

## Executive Verdict

FPVLovers does not have a content-volume problem on the homepage. It has a **content distribution and presentation problem**.

The repository contains **117 committed published artifacts** and production has previously reported **122 published shadow rows**, but the homepage exposes only **three** items in `Latest Content`. The resolver prepares six recent cards, then `src/app/page.tsx` truncates them to three. The three cards are placed in a narrow left column beside the race-status module and each card uses a fixed `8.5rem` image column. At the verified desktop viewport, this produces approximately `232px`-wide cards with titles that visually collapse or truncate. At `390px` mobile width, the same cards become a long vertical stack and the `Browse all` CTA is hidden.

This is not a cosmetic defect. The homepage currently fails as the platform's primary content gateway:

- It under-signals the size and breadth of the editorial archive.
- It makes the newest content look like three isolated samples instead of a living publication.
- It gives a truthful but oversized empty race state roughly one third of the row.
- It hides the most important discovery CTA on small screens.
- It presents high-intent content (buyer guides and comparisons) without enough context, grouping, or next-step guidance.

**Brutal score:**

| Area | Score | Verdict |
| --- | ---: | --- |
| Content availability | 8/10 | The archive is substantial. |
| Homepage content discovery | 3/10 | The archive is hidden behind a three-card bottleneck. |
| Editorial hierarchy | 5/10 | The sections exist, but “latest”, “featured”, and “knowledge feed” overlap. |
| Desktop card usability | 4/10 | The cards are too narrow for their content. |
| Mobile content flow | 5/10 | No horizontal overflow, but excessive vertical cost and hidden CTA. |
| Trust and honesty | 8/10 | No fake event dates or inflated scale; the truth is visually over-weighted in the wrong places. |
| Affiliate/content conversion readiness | 5/10 | Commercial content exists, but the homepage does not route users into it effectively. |

## Evidence Base

### Repository evidence

- [`src/app/page.tsx:308-316`](../../src/app/page.tsx) sets `recentPostCards = content.recentPosts.slice(0, 3)`.
- [`src/app/page.tsx:259-295`](../../src/app/page.tsx) renders each latest card as a fixed `sm:grid-cols-[8.5rem_1fr]` media/text row.
- [`src/app/page.tsx:398-417`](../../src/app/page.tsx) gives the section a `lg:grid-cols-[1.45fr_0.85fr]` parent and a `lg:grid-cols-3` latest-card grid.
- [`src/app/page.tsx:402`](../../src/app/page.tsx) hides the `Browse all` link below the `sm` breakpoint.
- [`src/lib/homepage/homepage-content.ts:149-159`](../../src/lib/homepage/homepage-content.ts) resolves six `recentPosts` before the page truncates them to three.
- [`src/lib/content-automation/content-reader.ts:405-431`](../../src/lib/content-automation/content-reader.ts) merges committed content and the published shadow, then sorts by publication date.
- [`src/app/search/SearchClient.tsx:203-213`](../../src/app/search/SearchClient.tsx) can expose the full indexed result set, so the discovery capability exists outside the homepage.
- The local content inventory contains 117 published JSON artifacts. The category distribution includes Racing (51), Flight Guides (17), Buyer Guides (11), Build Guides (8), Reviews (5), Components (5), Flight Control (4), Propulsion (4), Comparisons (3), Systems (3), Troubleshooting (3), Communication (2), and Regulations (1).

### Live browser evidence

Verified at `https://fpvlovers.com.tr/` in the in-app browser:

- DOM exposes exactly **3** article cards under `section#latest`.
- Desktop viewport `1427x1273`: the Latest panel is approximately `809px` wide; each card is approximately `232px` wide and `168px` tall.
- The visible cards are all dated **Jun 18, 2026**, which makes the section look like a single publishing batch rather than a continuing archive.
- The live cards show `0` views, which is honest but visually reads as zero engagement when repeated three times.
- The `Browse all` link is present in the DOM but not visible at the inspected viewport state because of the responsive `hidden sm:flex` class behavior.
- Mobile viewport `390x844`: the section contains the same three cards, each approximately `300x286px`, stacked into a section over `1,500px` tall. No horizontal overflow was detected, but the section consumes too much vertical attention for three compact content items.
- The adjacent `Upcoming Races` module is an empty QA/status state. It correctly avoids stale dates, but it consumes a large visual block without giving the user a content action beyond “View Calendar”.

### Design reference evidence

The approved references [`frontend.png`](../../frontend.png), [`design/frontpage-mockup.png`](../../design/frontpage-mockup.png), [`subpages.png`](../../subpages.png), and [`docs/design-system/fpvlovers-product-design-system-v1.md`](../design-system/fpvlovers-product-design-system-v1.md) consistently show:

- A cinematic editorial brand rather than an operations dashboard.
- Image-led article cards with enough horizontal room for titles and metadata.
- A wider latest-content module that competes successfully with, rather than loses to, race/event content.
- Stronger category and archive cues: users can see what kind of content they are entering before clicking.
- Dense telemetry reserved for tools and pilot surfaces, not for the primary public content gateway.

## What Is Actually Wrong

### P1 - Three-card bottleneck hides the archive

The data resolver prepares six recent cards, but the page discards half of them. This is an implementation-level presentation limit, not a data shortage.

**Impact:** The homepage advertises “117+ Articles” while only showing three. The proof claim and the visible experience disagree. Users must independently discover `/search`, `/buyers-guides`, `/reviews`, or `/comparisons` to see the platform's actual breadth.

**Correct direction:** Keep the server-side resolver limit separate from the visual display limit. Render six to eight cards in a deliberate editorial layout, then route the rest to a clearly labeled archive/search action.

### P0/P1 - The homepage can be stale even when the content pipeline succeeds

The homepage route has no explicit dynamic/ISR contract in `src/app/page.tsx`. The latest verified build classified `/` as static (`○ /`) while `/search` remained dynamic (`ƒ /search`). The publish route writes the artifact and publication shadow but does not call `revalidatePath('/')` (`src/app/api/admin/content/publish/route.ts:79-96`).

**Impact:** Autonomous publishing can succeed in the database while the live homepage continues showing an older build snapshot. This is a more serious issue than the three-card limit: even a redesigned grid can remain visibly stale until the next deploy. It also explains why the live homepage can remain around the Jun 18 batch while production has newer shadow rows.

**Correct direction:** Choose one explicit freshness contract:

- `force-dynamic` if immediate content freshness is more important than a database read on every homepage request; or
- a short ISR window (for example, five minutes) plus `revalidatePath('/')` after a successful approved publish.

The second option is the better production default if the publish path can revalidate idempotently. The public count and latest cards must use the same source-of-truth policy.

### P1 - Public content counts are hard-coded and can drift

`src/app/page.tsx:120-130` and the hero metric use hard-coded `117+` values, while the resolver/search pipeline is data-driven and production has previously reported 122 shadow rows.

**Impact:** After a successful publish, the homepage can show a count that is lower than the archive and lower than the actual publication shadow. That weakens trust precisely where the page is trying to establish editorial scale honestly.

**Correct direction:** Return an `archiveCount` from the homepage content model, document whether it represents committed artifacts, published shadow rows, or the merged public set, and use that same value in hero, Latest Content, and trust sections. If the count is intentionally conservative, label it `117+ committed guides` rather than implying it is the complete live inventory.

### P1 - The current card geometry guarantees title collapse

The Latest panel is the smaller column in a two-column row. Its inner grid then creates three columns. Each item reserves roughly 136px for the image, leaving too little room for a buyer-guide or comparison title.

**Impact:** “Best FPV Goggles…” and “DJI Goggles 2 vs DJI…” visually look clipped or incomplete. This damages perceived editorial quality and makes comparison content look like a narrow dashboard label.

**Correct direction:** Use an image-over-text editorial card for a 2x3 layout, or use one full-width chronological list with a stable thumbnail and a much wider title column. Do not add more cards until this geometry is fixed.

### P1 - “Latest Content” is not a useful editorial feed yet

The latest three items are all from the same Jun 18, 2026 window and include two comparisons plus one buyer guide. There is no visible freshness signal beyond the date, no category filter, no content count, no distinction between “newly published” and “editor’s selection”, and no indication of what a beginner should read first.

**Impact:** The user cannot quickly answer: “What is new?”, “What is relevant to my mission?”, or “Where should I start?” The archive becomes a static showcase instead of a repeat-visit surface.

**Correct direction:** Separate content jobs:

1. **Latest:** chronological, freshness-first, 6-8 items.
2. **Editor’s picks:** evergreen and high-value, not date-driven.
3. **Commercial path:** buyer guides, comparisons, starter kits, and reviews grouped by intent.

### P1 - The race empty state is truthful but visually mis-prioritized

The “Current race calendar only / No fake event dates” card is a good trust decision. The problem is its size and placement: it occupies a major share of the same row as the content feed while containing no current event to browse.

**Impact:** A quality-control message competes with the site's primary content inventory. The homepage feels empty precisely where it should feel active.

**Correct direction:** Collapse the race status to a compact “Calendar verification active” strip with a clear link to `/racing`. Give Latest Content two thirds of the row until verified events exist. When current event data is available, promote the module back to a full card grid.

### P1 - Mobile hides the archive CTA

The `Browse all` CTA is hidden at small widths. The mobile layout then shows three large stacked cards but no immediately visible route to the full archive.

**Impact:** Mobile users receive the highest vertical cost and the weakest discovery affordance. This is the opposite of what a content-heavy platform needs.

**Correct direction:** Always show a full-width “Browse all 117+ articles” action below the first content group. On mobile, it should be a primary or secondary button with a large tap target, not a hidden text link.

### P2 - Zero-view metadata is repeated without interpretation

The three cards expose `0` views. This is honest, but a repeated zero is not useful editorial metadata and can create an accidental “nobody reads this” signal.

**Correct direction:** Hide zero-value view counts from public cards, or replace them with useful signals such as reading time, updated date, source class, or “new”. Keep exact views for analytics/admin surfaces until there is meaningful volume.

### P2 - The homepage has too many competing modes

The current page moves from cinematic hero to platform shortcuts, five pillars, latest content, race QA, affiliate trust, pilot knowledge feed, community proof, editorial standards, newsletter, and covered brands. Each section is defensible, but the combined flow is long and the content gateway arrives after several navigation layers.

**Impact:** The homepage reads as a product manifesto plus compliance page plus archive teaser. The strongest commercial/editorial action is diluted.

**Correct direction:** Make the first content decision explicit:

- **Learn** for beginner progression.
- **Choose gear** for affiliate-intent content.
- **Tune/build** for technical users.
- **Race/fly** for community and mission content.

The section after the pillars should be a strong content gateway, not a large QA panel.

## Content Presentation Architecture

### Recommended homepage sequence

1. **Hero:** one promise, two actions, one honest proof row.
2. **Mission paths:** Learn / Choose Gear / Build & Tune / Race & Fly.
3. **Latest Content:** six cards, chronological, visible count, category labels.
4. **Commercial intent rail:** Buyer Guides / Comparisons / Reviews / Starter Kits.
5. **Technical knowledge rail:** Flight Control / Propulsion / RF & Video / Workshop.
6. **Race status:** compact verified-data strip; expanded event cards only when current data exists.
7. **Trust and disclosure:** concise, linked, below the content value.
8. **Newsletter and footer:** conversion and navigation.

### Recommended Latest Content component

**Desktop:**

- Latest panel receives approximately two thirds of the row.
- Six cards in a 2-column grid, each with a 16:9 image above the text.
- Card anatomy: category eyebrow, title, one-line excerpt, publication date, reading time, optional “New” badge.
- A visible header label such as `Latest Content · 117 indexed`.
- A full-width “Browse all articles” action after the grid.

**Tablet:**

- Two columns with image-over-text cards.
- Keep category filters as a horizontal, scrollable control if needed.

**Mobile:**

- One-column cards with a 16:9 image and readable title block.
- Show four cards initially, then the archive CTA. Six cards can remain available through a “Load more” or archive route if performance requires it.
- Never hide archive navigation below the first viewport of the section.

### Recommended content labels

Use labels that answer user intent, not internal data state:

- `NEW` for a recent publication.
- `BUYING GUIDE` for commercial research.
- `COMPARISON` for a choice between products or systems.
- `FIELD GUIDE` for evergreen technical education.
- `REVIEW` only when the evidence and Hazar Volga Ekiz approval boundary are satisfied.

Do not expose internal labels such as `Seed content`, `Support`, `Pillar`, or `QA` in public editorial cards.

## Visual and Brand Direction

### What should be preserved

- Deep aerospace black and charcoal base.
- Red as the primary brand action accent.
- Cinematic FPV imagery and restrained image treatments.
- Thin, quiet borders and high-contrast headings.
- Honest editorial trust language and the “no fake event dates” rule.
- Strong distinction between public editorial mode and cockpit/tool mode, as defined in the design system.

### What should be corrected

- Reduce the number of dashboard-like status statements in the public content flow.
- Give article cards the same visual authority as the hero pillars.
- Increase editorial whitespace inside cards rather than adding more telemetry metadata.
- Use a more readable public editorial type scale for titles and excerpts; mono should remain metadata seasoning.
- Keep cards from becoming five small panels in a row when the content requires titles longer than two words.
- Use a consistent double-bezel or nested-card treatment only for key surfaces; applying dense borders to every block would make the page feel like admin telemetry.

## Wider Frontend UX Gaps

The Latest Content defect is the highest-signal problem, but it sits inside a larger presentation system that still mixes public editorial mode with cockpit and operations language.

### P1 - Public shell still sounds like an internal system

`src/features/layout/components/SearchSection.tsx:19-40` exposes `LINK ACTIVE` and `SYS.SCANNER: STANDBY` around the public search field. Similar telemetry language appears in public authentication/glossary surfaces. The design system explicitly says cockpit language belongs in pilot/product and operations modes, not across the public editorial surface.

**Recommendation:** Keep technical language in tools and admin. On public pages use plain editorial labels such as `Search FPV guides`, `Latest field notes`, `Browse by mission`, and `Updated`. This improves affiliate/sponsor credibility without removing the tactical visual identity.

### P1 - Generic system typography weakens the reference direction

`src/app/globals.css:21-24` uses `ui-sans-serif/system-ui` and a system mono stack. The reference images use a stronger condensed display/editorial hierarchy. There are no self-hosted font assets in `public/`, so this is a real asset/design-system gap rather than a missing CSS class.

**Recommendation:** Select and license one deterministic display face, self-host only the required subsets, and keep a readable UI sans for body copy. Do not reintroduce remote font fetching; the offline/Coolify build constraint remains valid.

### P1 - Blur and animation utilities are broader than the premium performance guardrail

`src/app/globals.css:69-103` applies `backdrop-filter` to generic scrolling cards and public panels. The high-end visual guardrail reserves blur for fixed/sticky surfaces because large scrolling blur regions increase mobile GPU cost. `scanline-anim` and `glitch-hover` also use linear timing, which conflicts with the premium easing language used by the newer homepage components.

**Recommendation:** Scope blur to navigation/overlay layers, replace scrolling-card blur with opaque/translucent surfaces, and keep decorative animation off the critical content path. Use the existing premium cubic-bezier token for intentional motion.

### P2 - Article and hub presentation is inconsistent

Buyer Guides uses a three-column grid while Reviews and Comparisons use two columns. The shared `SubpageChrome` exists, but the editorial card anatomy is not yet shared across hubs. Article detail uses dense mono metadata and large section gaps; review/comparison cards can become vertically expensive on mobile.

**Recommendation:** Define one editorial card contract: image ratio, title wrap, category/date slot, reading time, trust/disclosure slot, CTA, and empty/loading/error states. Let buyer guides, comparisons, and reviews vary by content badge and evidence fields, not by unrelated geometry.

### P2 - Accessibility and mobile semantics need a second pass

Several metadata classes use low-contrast zinc/white opacity values, and the fixed mobile utility bar should expose a semantic navigation label. The homepage's archive action must remain visible and keyboard reachable. Footer and long card labels should not be clipped to the point that the destination is unclear.

**Recommendation:** Run contrast checks on public metadata, add semantic labels to fixed utility navigation, verify focus order, and validate tap targets at 360px and 390px widths.

### P2 - Fallback image repetition reduces editorial distinctiveness

Fallback assets are consistently sized and policy-compliant, but repeated category fallbacks can make multiple articles look like the same story. The references rely on image-led differentiation between articles and hubs.

**Recommendation:** Prefer harvested source imagery when licensed and available; otherwise use deterministic topic variants with title-specific composition or a restrained editorial index treatment. Do not reintroduce random stock URLs or unsupported brand imagery.

### Design reference gap

The reference mockups show the latest content area as a compact but legible editorial module with enough width for three meaningful article previews. The live page instead gives the race QA panel a comparable visual weight while shrinking the content cards. This is a hierarchy regression from the reference direction, not merely a spacing preference.

## Accessibility and Performance Checks

### Confirmed positives

- No horizontal overflow at the tested `390px` viewport.
- Article cards are links rather than non-interactive visual tiles.
- Images have descriptive alt text through `ResilientCoverImage`.
- Motion uses the project's premium cubic-bezier transition token in the inspected homepage components.
- The page avoids stale event dates rather than inventing current data.

### Risks to address

- Small card titles and low-contrast mono metadata need a contrast review at 360-390px widths.
- The hidden mobile archive CTA is a keyboard and discovery problem, not only a visual issue.
- Large hero imagery and many card images should preserve `sizes` correctness and lazy-loading behavior as the latest grid grows.
- Repeated zero-view counts should not become a negative social-proof signal.
- The content count shown in the hero (`117+`) and production shadow count (`122`) need one deliberate public counting rule to avoid trust drift.

## Phased Closure Plan

### Phase 1 - Content gateway repair (P0/P1)

- Define homepage freshness (`force-dynamic` or short ISR plus publish revalidation) before visual expansion.
- Remove the page-level three-card bottleneck.
- Redesign Latest Content as a 2x3 desktop editorial grid and one-column mobile stack.
- Make `Browse all` visible at every breakpoint.
- Add a visible indexed-content count sourced from the same publication model.
- Reduce the race empty state to a compact status strip.

### Phase 2 - Editorial segmentation (P1)

- Add separate Latest, Editor’s Picks, and Commercial Intent modules.
- Add category/intent labels and optional filter tabs.
- Keep product reviews visibly evidence-bound and separate from autonomous guides.
- Add internal links from each content group to the appropriate hub.

### Phase 3 - Mobile and accessibility hardening (P1/P2)

- Validate 360x800, 390x844, 768x1024, 1280x800, and 1440px desktop.
- Check title wrapping, focus rings, CTA visibility, image crops, contrast, and tap targets.
- Remove public zero-view metadata or replace it with useful freshness metadata.

### Phase 4 - Measurement and iteration (P2)

- Track clicks from Latest Content to article routes, `/search`, `/buyers-guides`, `/reviews`, and `/comparisons`.
- Compare card layout variants without inventing traffic or engagement claims.
- Review real click-through data after a meaningful observation window; do not use placeholder performance numbers.

## Acceptance Criteria

The gap is closed when all of the following are true:

- A newly approved published artifact is visible on the homepage within the documented freshness window without requiring an unrelated full deploy.
- Homepage visibly presents at least six current article cards on desktop or clearly exposes the remaining cards through an immediate archive action.
- Latest Content is not narrower than the adjacent status module on desktop.
- Article titles remain readable without severe clipping at 1280px and 390px.
- `Browse all` is visible and keyboard reachable at every supported breakpoint.
- Mobile Latest Content does not require over 1,500px of vertical scrolling for only three items.
- Zero-value views are not presented as repeated public proof points.
- Latest, evergreen/editorial picks, commercial intent, and race status are visually distinct jobs.
- The visible article count follows one documented source-of-truth rule.
- No stale race dates, fake partnerships, fake audience numbers, or unsupported review claims are introduced.

## Final Recommendation

Do not add more homepage sections. Fix the content gateway first.

The highest-leverage change is a **wider, six-card editorial Latest Content module with an always-visible archive CTA**, paired with a **compact race verification strip**. This will make the existing 117+ article inventory discoverable, improve affiliate-intent routing, reduce the dashboard feel, and align the live homepage with the approved FPVLovers media-brand direction without touching admin or crawler functionality.
