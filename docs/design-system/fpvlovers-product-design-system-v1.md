# FPVLovers Product Design System V1

Status: Review draft, no implementation code generated
Restore point: `restore-before-design-system-audit-2026-06-28`
Reference sources: root `design/` images, `frontend.png`, `forntendend_full.png`, `subpages.png`, attached Product Design System brief
Primary principle: FPVLovers is not a blog skin. It is the operating system for FPV pilots, with an editorial public surface and cockpit-grade product surfaces.

## Executive Verdict

FPVLovers already has a strong dark tactical base, but it needs a formal design system before further UI implementation. The references define a coherent product language: cinematic public media brand, aviation-grade mission planning, pilot identity, dense telemetry tools, and affiliate-safe editorial trust.

The main design risk is mixing all modes at once. Public pages must feel like a premium FPV media platform. Tool, dossier, build, flight, and admin surfaces can feel denser and more cockpit-like. If the whole site becomes an internal telemetry dashboard, affiliate trust and beginner clarity suffer. If the whole site becomes a generic blog, the product vision loses its edge.

## Product Definition

FPVLovers is the tactical FPV knowledge system for beginners, builders, racers, cinematic pilots, and technical operators.

The ecosystem includes:

- Public website: homepage, academy, glossary, tools, drone archive, racing, blog, reviews, comparisons, buyer guides, about, contact, editorial, disclosure, advertise.
- Pilot product layer: Pilot Dossier, roadmap, achievements, learning state, build history, flight profile, recommendations.
- Mission/product tools: Mission Builder, Build DNA Explorer, Flight DNA Explorer, calculators, analyzers, setup advisors.
- Commercial/affiliate layer: buyer guides, comparisons, reviews, deal surfaces, sponsor-safe placements.
- Operations layer: admin dashboard, crawler/content status, editorial governance, affiliate readiness, automation oversight.

## Design DNA Extracted From References

### Frontpage References

`frontend.png`, `forntendend_full.png`, and `design/frontpage-mockup.png` define the public brand surface.

Core traits:

- Full-width cinematic FPV hero with real drone photography or high-quality cinematic render.
- Strong black/charcoal cockpit background, but public-facing hierarchy is editorial and simple.
- Red primary CTA, restrained secondary outline CTA.
- Top navigation is compact, confident, and media-like.
- Category rail presents the platform as Academy, Glossary, Tools, Drone Archive, Racing, and commercial content where appropriate.
- Cards use image-led storytelling, red action states, thin borders, subtle depth.
- Trust sections, newsletter, footer, legal links, and social routes must feel real, not placeholder.

Critical rule:

- Dates, testimonials, partner logos, user counts, and events in concept images are placeholders. Live UI must never show stale dates, fake partnerships, fake testimonials, or invented scale.

### Subpage Reference

`subpages.png` defines the hub and detail page grammar.

Core traits:

- Each major hub has a cinematic header but tighter than homepage.
- Category filters and content cards should be modular and consistent.
- Tool pages can be denser, with dashboard imagery and grid utilities.
- Article detail pages need stronger editorial trust: author, date freshness, update status, disclosure where relevant, table of contents, related content, and readable body rhythm.
- Racing, pilots, teams, tracks, and events require live-data discipline. If current data is unavailable, use evergreen explanations instead of outdated event cards.

### Mission Builder Reference

`design/Futuristic FPV mission builder UI.png` defines product surfaces.

Core traits:

- Multi-panel mission planning layout.
- Step-by-step mission selection, budget constraints, loadout recommendations, learning path, upgrade path.
- Build DNA uses exploded drone visualization, component stacks, spec panels, comparison tables, build tips, and popular builds.
- Flight DNA uses radar chart, tuning metrics, flight skill analysis, recommendations, and logging CTAs.
- Dense information is acceptable here because the user intent is technical decision-making.

### Pilot Dossier Reference

`design/pilot-dossier.png` defines logged-in identity and progress surfaces.

Core traits:

- Persistent app shell with sidebar.
- Pilot profile card, rank, callsign, class, progress, build ownership, achievements, recent activity.
- Dashboard cards, radar charts, mini charts, mission recommendations, last flights, and map/log modules.
- The tone is operator-grade, but still readable and motivating.

### Footer Reference

`design/footer.png` and `forntendend_full.png` define commercial trust expectations.

Core traits:

- Footer is not a dumping ground. It is a trust and navigation layer.
- It should include brand promise, legal links, contact, editorial/disclosure/advertise links, community/social routes, popular topics, and newsletter CTA.
- Fake partner logos are forbidden unless relationships exist. If brand names are listed, the label must be "Covered brands" or "Topics we cover", not "Partnered with" unless verified.

## Current Implementation Snapshot

Observed implementation strengths:

- `src/app/globals.css` already has dark aerospace tokens, glass cards, orange/cyan/green telemetry colors, carbon grid, scanline/glitch utilities, and cockpit atmosphere.
- `src/app/page.tsx` already moved away from fake scale with honest metrics such as published artifacts, tools, core hubs, fake event dates, and editorial owner.
- `src/features/layout/components/SiteFooter.tsx` includes important trust links: privacy, terms, editorial policy, disclosure, advertise, contact, sitemap.
- `src/features/layout/components/Navbar.tsx` has route-aware navigation and authenticated/local dossier states.
- Shared `Button` and `Card` components provide a starting component layer.

Main gaps:

- Tokens are functional but not yet governed as a full product system.
- Public pages and cockpit/product surfaces share visual language but do not yet have clear mode boundaries.
- Some current text such as "Mission Control", "Telemetry online", "Encrypted transmission", and emoji-based user menu labels can feel more like an internal system than a premium public FPV media brand.
- Component primitives do not yet encode the reference system's states, density levels, editorial/commercial trust variants, or data/telemetry variants.
- Homepage and subpage visual direction is partially implemented, but the reference system requires a stronger formal grid, section grammar, card taxonomy, and trust hierarchy.
- Footer has the right links, but should become more marketable and less internal-telemetry in public mode.

## Mode System

The design system must support three modes.

### 1. Public Editorial Mode

Used for homepage, hubs, articles, reviews, comparisons, buyer guides, about, contact, disclosure, editorial policy, advertise.

Design rules:

- Cinematic, premium, readable.
- Strong hero visuals and clear editorial value proposition.
- Avoid excessive telemetry jargon above the fold.
- Prioritize trust, freshness, disclosure, and helpful navigation.
- Use red as primary brand/action accent.
- Use cyan/green sparingly for metadata, status, or technical utility.

### 2. Pilot Cockpit Mode

Used for Pilot Dossier, academy progress, mission builder, build DNA, flight DNA, tools with active analysis.

Design rules:

- Dense, dashboard-like, technical.
- Use sidebars, metric cards, charts, radar plots, states, comparison panels.
- Telemetry language is appropriate when tied to actual user data or tool output.
- Red indicates primary action or active selection.
- Cyan indicates data/analysis.
- Green indicates success/valid state.
- Amber indicates caution or optimization opportunity.

### 3. Operations/Admin Mode

Used for admin, crawler/content automation, governance, release checks.

Design rules:

- Function over spectacle.
- Compact tables, status chips, logs, filters, retries, clear destructive action states.
- No marketing flourish.
- Strong separation between automation suggestions and human approval.

## Color System

### Core Neutrals

- Deep background: `#050608` / near-black cockpit shell.
- Main surface: charcoal black with subtle blue undertone.
- Elevated surface: dark graphite with low-contrast border.
- Border: white at 6-14 percent opacity depending on elevation.
- Text primary: near-white.
- Text secondary: zinc/warm gray.
- Text muted: low-contrast gray, never below accessibility threshold for body text.

### Brand Accents

- FPV Red: primary brand action, hero keyword, active nav, urgent CTA.
- Telemetry Cyan: data, analysis, hover affordance, technical readout.
- Success Green: valid state, completed task, healthy system.
- Warning Amber: caution, battery, safety, configuration risk.
- Purple/Blue: category-specific accents for archive, glossary, and advanced tools.

Color rule:

- Public editorial pages should be red-led.
- Cockpit/product pages can use red + cyan + green + amber.
- Admin surfaces should use status colors only when meaningful.

## Typography System

The references demand a condensed technical editorial style rather than generic SaaS typography.

Recommended hierarchy:

- Display: condensed, strong, uppercase-capable, used for hero headlines and major section titles.
- UI sans: clean, highly readable, used for navigation, labels, cards, forms.
- Mono: telemetry labels, metrics, code-like values, filters, timestamps, version/status metadata.

Typography rules:

- Hero headings: short, muscular, high contrast.
- Body copy: never over-condensed. Beginner content must remain comfortable to read.
- Uppercase tracking is useful for labels, not long sentences.
- Mono should be seasoning, not the whole meal.
- Commercial pages need editorial readability more than cockpit styling.

## Layout System

### Page Width

- Public marketing/editorial max width: wide but readable, matching the cinematic mockups.
- Article body max width: narrow enough for reading, with side rails for table of contents and related content on desktop.
- Tool/dashboard width: wider, panel-based.
- Admin width: full workspace layout.

### Grid

- Homepage: hero, shortcut rail, five pillar cards, latest/commercial/racing modules, trust/newsletter/footer.
- Hubs: cinematic header, filter/search row, featured content, card grid, internal link modules.
- Article detail: metadata header, disclosure if commercial, TOC, body, inline media, related links, CTA.
- Tools: split layout or modular panels depending on tool complexity.
- Dossier: sidebar + top identity + dashboard grid.

### Spacing

- Public pages need more air and stronger editorial rhythm.
- Cockpit/product pages can use tighter spacing but must keep visual grouping.
- Mobile requires fewer simultaneous panels and stronger vertical sequencing.

## Component Taxonomy

### Navigation

Required variants:

- Public top nav.
- Mobile bottom utility/nav.
- Product/sidebar nav for Dossier and tools.
- Admin nav.

Public nav rules:

- Keep primary labels short.
- Search must be obvious.
- Auth CTA should not dominate public trust.
- Avoid emoji in professional/public nav states.

### Cards

Required card families:

- Editorial card: article/tutorial/review/buyer guide.
- Commercial card: product/comparison/deal/buyer intent.
- Tool card: calculator/analyzer/recommender.
- Telemetry card: metric/status/chart.
- Dossier card: progress/achievement/pilot identity.
- Admin card: queue/job/status.

Each card should define:

- Title length behavior.
- Image behavior.
- Metadata slots.
- Disclosure/trust slot where applicable.
- CTA behavior.
- Empty state.
- Loading state.
- Error state.

### Buttons

Required variants:

- Primary red.
- Secondary outline.
- Ghost/quiet.
- Technical cyan.
- Success green.
- Warning amber.
- Destructive red with stronger warning semantics.

Rules:

- Public CTAs use human language: Start Learning, Explore Guides, Compare Gear.
- Tool CTAs can use operational language: Analyze, Calculate, Generate Plan.
- Admin CTAs use direct operational verbs: Retry, Approve, Reject, Publish.

### Trust Components

Required components:

- Affiliate disclosure strip.
- Review evidence badge.
- Editorial owner badge.
- Last updated/freshness indicator.
- AI-assisted content note where relevant.
- Product sample/evidence state.
- Sponsor-safe label.

Rules:

- No fake review claims.
- No fake partner claims.
- Product reviews must distinguish hands-on review, research-based guide, comparison, and buyer guide.

### Data Components

Required components:

- Radar chart.
- Metric tile.
- Progress card.
- Comparison table.
- Spec table.
- Fit/recommendation score.
- Status chip.
- Timeline/activity feed.
- Empty state.

Rules:

- Data visuals must explain what the metric means.
- Scores require source/context.
- Avoid decorative telemetry if no real data backs it.

## Page Templates

### Homepage

Purpose: prove FPVLovers is a serious FPV operating system and editorial platform.

Required sections:

- Cinematic hero with clear pitch.
- Primary CTA and secondary CTA.
- Platform pillar rail.
- Built for pilots section.
- Latest content.
- Commercial/buyer guide entry points.
- Racing/community module without stale dates.
- Trust and editorial governance module.
- Newsletter/social CTA.
- Footer trust layer.

Hard constraints:

- No fake user count.
- No stale event date.
- No fake partner logo.
- No fake testimonial.

### Hub Pages

Required for:

- Academy.
- Glossary.
- Tools.
- Drone Archive.
- Racing.
- Buyer Guides.
- Reviews.
- Comparisons.

Required sections:

- Hub hero.
- Search/filter/category row.
- Featured cards.
- Main content grid.
- Internal links.
- Empty state if data unavailable.
- Commercial disclosure if commercial.

### Article Pages

Required sections:

- Breadcrumb.
- Category and intent labels.
- Title and deck.
- Author/editor.
- Published/updated dates.
- Disclosure if affiliate/commercial.
- Evidence state for reviews.
- TOC.
- Body with readable rhythm.
- Inline media.
- Related articles.
- CTA or next step.

### Product/Commercial Pages

Required sections:

- Buying intent label.
- Disclosure.
- Best-for summary.
- Pros/cons.
- Product comparison/spec table.
- Real review evidence state.
- Alternatives.
- Internal links.
- CTA with honest language.

### Tool Pages

Required sections:

- Tool purpose.
- Inputs.
- Result panel.
- Explanation.
- Safety/disclaimer where relevant.
- Save/share/export path if applicable.
- Related guides.

## Motion System

Motion must feel aviation-grade, not flashy.

Allowed:

- Subtle card lift.
- Slow image scale on hover.
- Smooth panel reveal.
- Focus rings.
- Progress fill.
- Chart/radar reveal when meaningful.

Avoid:

- Constant glitch effects.
- Excessive scanlines.
- Distracting neon pulses.
- Motion that reduces readability.

Rule:

- Motion supports comprehension or state change. Decorative motion should be rare.

## Responsive System

Mobile priorities:

- One primary action per screen.
- Cards become stacked with strong title and CTA.
- Dense dashboards collapse into focused panels.
- Tables need horizontal scroll, comparison summary, or stacked spec rows.
- Bottom navigation can support core surfaces but must not hide content.
- Hero image must not crush the value proposition.

Tablet priorities:

- Two-column cards.
- Sidebar can become top tabs.
- Tool panels can remain side-by-side only when readability holds.

Desktop priorities:

- Full cinematic hero.
- Multi-column rails.
- Side TOC for articles.
- Dashboard grids for tools and dossier.

## Accessibility Rules

- Body text contrast must remain readable over images and glass panels.
- Focus states must be visible on all interactive elements.
- Touch targets must be large enough on mobile.
- Icon-only actions require accessible labels.
- Status color must not be the only signal.
- Motion should respect reduced-motion preferences.
- Long uppercase text should be avoided in body content.

## Content And Trust Rules

These rules are mandatory for affiliate and sponsor readiness.

- "Partnered with" requires verified partnership.
- "Trusted by" requires real users/testimonials.
- User counts and traffic metrics require verified analytics.
- Event dates must be current or clearly archived.
- Product reviews must declare evidence level.
- AI-assisted content must remain under editorial governance.
- Hazar Volga Ekiz can be used as editorial owner/review boundary where appropriate.
- Autonomous content can support tutorials, glossary, tools, and research guides, but commercial product claims need stricter review.

## Brutal Gap List

### P0: Fake/Stale Commercial Trust Risk

Root cause: Reference mockups contain concept-only partner logos, testimonials, stats, and 2024 event dates.

Impact: If implemented literally, affiliate networks and sponsors may read the site as abandoned or dishonest.

Required fix: Convert all unverified trust signals into honest states: "covered brands", "editorial archive", "upcoming schedule unavailable", or remove.

Owner: Product + Editorial.

### P1: Public vs Cockpit Mode Blending

Root cause: Current UI language uses cockpit terms across public surfaces.

Impact: Beginners, sponsors, and affiliate reviewers may not immediately understand the value proposition.

Required fix: Define public/editorial copy and layout as primary for marketing pages; reserve telemetry language for tools, dossier, and admin.

Owner: Product Design.

### P1: Component System Is Not Yet Complete

Root cause: Existing primitives are useful but not variant-rich enough for editorial, commercial, telemetry, dossier, and admin needs.

Impact: Future pages will drift visually and semantically.

Required fix: Build component variants only after this design system is approved.

Owner: Frontend.

### P1: Commercial Page Trust Presentation Needs Dedicated Patterns

Root cause: Buyer/review/comparison pages need visible evidence, disclosure, pros/cons, spec tables, and internal linking.

Impact: Thin or generic commercial pages can look like affiliate spam even with good styling.

Required fix: Create commercial article template with disclosure, evidence badge, comparison table, best-for summary, alternatives, and internal links.

Owner: Editorial + Frontend.

### P2: Motion/Neon Can Become Overpowering

Root cause: Existing utilities include glitch and scanline patterns.

Impact: Overuse weakens premium editorial feel.

Required fix: Limit glitch/scanline to rare product moments; default to slower, premium transitions.

Owner: Product Design + Frontend.

### P2: Footer Needs Public Trust Reframing

Root cause: Current footer is useful but partially internal-system phrased.

Impact: The footer does not yet fully match the polished media/trust role shown in references.

Required fix: Reframe footer language around knowledge, editorial standards, contact, community, legal, and popular topics.

Owner: Product Design.

## Approval Gates Before Implementation

Gate 1: Product direction approval

- Confirm FPVLovers positioning: "tactical FPV knowledge system / operating system for FPV pilots."
- Confirm three-mode model: Public Editorial, Pilot Cockpit, Operations/Admin.

Gate 2: Trust policy approval

- Confirm no fake partners, no fake traffic, no fake testimonials, no stale events.
- Confirm review evidence boundary under Hazar Volga Ekiz.

Gate 3: Visual system approval

- Confirm red-led public brand, cyan/green/amber telemetry for product surfaces.
- Confirm cinematic public pages and dense cockpit product pages.

Gate 4: Implementation phase approval

- Phase 1: Design tokens and public layout primitives.
- Phase 2: Homepage and footer refinements.
- Phase 3: Hub/subpage template system.
- Phase 4: Article/commercial trust templates.
- Phase 5: Pilot Dossier and tool cockpit components.
- Phase 6: Admin/operations polish.
- Phase 7: Visual QA, accessibility, responsive, performance.

## Recommended Implementation Strategy After Approval

### Phase 1: Foundation

- Formalize tokens in global CSS and component variants.
- Remove or isolate overly decorative effects.
- Define card, button, badge, status, trust, and layout primitives.

### Phase 2: Public Frontpage

- Align homepage to reference hierarchy.
- Keep honest stats only.
- Replace stale racing examples with live-safe evergreen modules.
- Add stronger trust and editorial governance section.

### Phase 3: Global Navigation And Footer

- Reframe public nav/auth/footer copy.
- Add trust/legal/community/social structure.
- Keep logged-in cockpit states separate from public marketing state.

### Phase 4: Subpage Templates

- Build consistent hub hero, filters, cards, empty states, internal link sections.
- Apply to Academy, Glossary, Tools, Drone Archive, Racing, Buyer Guides, Reviews, Comparisons.

### Phase 5: Article And Commercial Templates

- Add disclosure/evidence/freshness/TOC/related modules.
- Create commercial comparison and review patterns.
- Add affiliate-safe CTA system.

### Phase 6: Cockpit Product Surfaces

- Apply dense product language to Mission Builder, Build DNA, Flight DNA, Pilot Dossier, calculators, analyzers.
- Add chart/radar/table/status component grammar.

### Phase 7: Verification

- Run route, type, lint/build where practical.
- Browser-check homepage, selected hubs, article detail, buyer guide, tool page, dossier page, mobile nav.
- Capture before/after screenshots.

## Definition Of 100/100 Design Readiness

FPVLovers reaches 100/100 design readiness only when:

- Public pages communicate the platform clearly within the first screen.
- No fake/stale trust claims exist.
- Commercial pages visibly declare disclosure and evidence level.
- Hubs use consistent section grammar.
- Article pages are readable and sponsor-safe.
- Tools and dossier use cockpit density without hurting usability.
- Footer and legal/trust layer are polished.
- Mobile layouts are intentionally designed, not merely collapsed.
- The component system prevents future visual drift.
- The site feels like a premium FPV media/product ecosystem, not a generic blog and not an internal-only dashboard.
