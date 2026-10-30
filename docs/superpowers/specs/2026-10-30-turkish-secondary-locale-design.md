# Turkish Secondary Locale Design

**Date:** 2026-10-30

**Status:** Approved (design) — implementation not started

## Objective

Add Turkish as a second publishing locale without translating the site into a parallel copy. The English site stays primary and unchanged at its current URLs; Turkish is delivered as a localized second publishing lane with its own routes, its own content-key semantics, its own SEO surface, and its own generation input.

This is explicitly **not** a string-translation layer. Four systems currently assume a single locale, and each one must change:

| Assumption | Where | Effect today |
| --- | --- | --- |
| Turkish content is hidden | `src/lib/content-automation/content-reader.ts:43-60` (`hasTurkishLanguageLeak`, `shouldExposePublishedArtifact`) | A Turkish artifact is filtered out of lists, search, sitemap and slug lookups. `ALLOW_NON_ENGLISH_PUBLISHED=true` is the only escape hatch. |
| One artifact per slug | `src/lib/server/published-content-store.ts:20` (`ON CONFLICT (slug)`) | A Turkish translation of an English article overwrites the English row. No `locale` column exists. |
| One document language | `src/app/layout.tsx:69` (`<html lang="en">`) | No `[locale]` segment, no middleware, no i18n dependency. `lang` also drives CSS `text-transform: uppercase`, so Turkish renders `PILOT` instead of `PİLOT`. |
| One SEO locale | `src/app/sitemap.xml/route.ts`, `src/lib/seo/metadata.ts:26,35` | No `hreflang` alternates, absolute canonical, `og:locale: en_US`. |
| One search grammar | `src/app/search/page.tsx:17-31` | `searchText.toLowerCase()` with client-side filtering; `ucus` never matches `uçuş`, `sogutma` never matches `soğutma`. |

## Owner Decisions (binding)

1. **URL shape:** Turkish lives under `/tr/*` as a separate route tree. English routes are not moved and keep their URLs.
2. **First Turkish scope:** SHGM/regulations content plus the six-step academy. Not a bulk translation of the existing 153 English articles.
3. **Slug policy:** English slugs are reused under `/tr` (`/tr/article/fpv-simulator-guide`). No localized slug map, no per-locale redirect table.
4. Inherited from `docs/handoff/2026-10-24-beginner-first-ia-handoff.md`: English is primary; no v03 rewrite; each phase is deployed and verified separately; Coolify-native only, never touch AffeXAI Cortex or Bimmetraj.
5. Inherited from `AGENTS.md`: SHGM/SHY content must never be hallucinated — it is generated from the `fpv-regulations` RAG dataset with sources, never machine-translated prose.

## Scope

In scope:

- A locale concept in the content model, storage key, expose guard, navigation, taxonomy labels, search normalization, cover cache key, sitemap and metadata.
- A Turkish route tree (`/tr`) with its own `<html lang="tr">`.
- Turkish navigation, footer, mobile bar and language switch.
- Turkish academy (six steps, partial fill allowed) and a source-backed SHGM regulations page.
- Locale plumbing in the content-generation pipeline (job/brief field, Dify input, publish gate).
- Regression tests for the language gate, locale storage key, search folding and hreflang output.

Out of scope:

- Translating all 153 English articles.
- A third locale, or a general locale registry beyond `en | tr`.
- Localized slugs, subdomains, or a `[locale]` dynamic segment.
- A full design-token migration of the repository (92 files currently use arbitrary hex classes); token adoption is limited to files this project touches.
- Cross-locale search (a Turkish query searching English articles and vice versa).
- Automated EN→TR translation of regulated content.

## Architecture

### 1. Locale model

`src/lib/i18n/locale.ts`:

- `type Locale = 'en' | 'tr'`, `DEFAULT_LOCALE = 'en'`, `isLocale(value)`.
- `PublishedArtifact` gains `locale?: Locale` and `translationOf?: string` (the English slug a Turkish artifact translates). Absent `locale` means `en`, so the 153 existing artifacts need no migration.

`translationOf` is the only honest source for `hreflang` pairing; deriving pairs from matching slugs is a heuristic and will break as soon as an article exists in only one locale.

### 2. Storage key

`fpvlovers_app.published_articles_shadow` gains `locale text NOT NULL DEFAULT 'en'`; the single-column `slug` uniqueness is replaced by `unique (slug, locale)`; existing rows backfill to `'en'`.

Store functions take an explicit locale:

- `upsertPublishedArtifact(artifact)` derives locale from `artifact.locale ?? 'en'`.
- `loadPublishedArtifacts(locale?)` and `getPublishedArtifact(slug, locale = 'en')` gain the locale parameter; `content-reader.ts:439-470` passes it through when merging file and database results.

File-mode storage mirrors the same rule: English stays in `content/published/*.json`, Turkish goes to `content/published/tr/*.json`. Filenames never collide.

### 3. Expose guard

Replace the binary "hide Turkish" rule with a mismatch rule:

- `hasLanguageMismatch(artifact, expectedLocale)` keeps the existing marker/heuristic detection (`TURKISH_LANGUAGE_MARKERS`, `TURKISH_SPECIFIC_CHARS`) but gains the inverse check for Turkish artifacts (an English-language body in the Turkish tree is a mismatch).
- `shouldExposePublishedArtifact(artifact, expectedLocale = 'en')` keeps the retired-slug rule first, then applies the mismatch rule.
- `ALLOW_NON_ENGLISH_PUBLISHED=true` remains an override, not the only path.
- `scripts/content-language-audit.ts` runs per directory: `content/published` (no Turkish) and `content/published/tr` (no English body).

Read paths that must pass the locale through: `listPublishedContent`, `listPublishedContentAsync`, `getPublishedContentBySlug`, `getPublishedContentBySlugAsync`, `getPublishedSlugs`, `getPublishedSlugsAsync`.

### 4. Routing and document language

The root `<html>` must change language per tree, and Next allows one `<html>` per document. The chosen structure is a route-group split:

- Existing pages move to `src/app/(en)/…`; the URL shape does not change because route groups do not contribute a path segment.
- `src/app/(en)/layout.tsx` renders `<html lang="en">`; `src/app/tr/layout.tsx` renders `<html lang="tr">`.
- Shared chrome (metadata, JSON-LD base graph, providers, cookie banner, analytics) is extracted into one component consumed by both layouts so the split does not duplicate behavior.
- Route handlers and metafiles (`api`, `sitemap.xml`, `robots.ts`, `llms.txt`) stay outside both groups.

This is the riskiest mechanical step and ships as its own phase (C0.5). Verification is a URL-set diff: the English sitemap must remain exactly the current 196 URLs, and every page must return the same status as before the move.

Fallback if the split proves unstable in Coolify: keep `app/layout.tsx` at `lang="en"` and wrap the Turkish tree in `<div lang="tr">`. This is accepted as a temporary borrow only; the `<html lang>` mismatch remains technical debt and must be recorded in the handoff.

### 5. Navigation, taxonomy, levels

- `navigationData.ts` exports `getNavigation(locale)`; labels and helper lines come from `src/lib/i18n/labels.ts` keyed by stable ids (`start-here`, `gear`, `guides`, `tools`, `racing-news`). Icons and hrefs stay locale-independent.
- `GUIDE_GROUPS` keeps its `id` and `categories` (the data values) and moves `label`/`description` into the label catalog. The display-level mapping invariant from the beginner-first handoff is preserved: no content category is renamed, no data migration happens.
- `READER_LEVELS` labels become catalog entries (Başlangıç / Orta / İleri); `LevelBadge` still renders nothing for unknown difficulty.

### 6. Search

- `normalizeSearchText(text, locale)` applies Turkish folding when `locale === 'tr'`: `İ→i`, `I→ı→i`, `ş→s`, `ğ→g`, `ç→c`, `ö→o`, `ü→u`, and the reverse for the query.
- Both the indexed `searchText` and the query go through the same function, so folding is symmetric.
- The Turkish search page indexes only Turkish artifacts; the English page only English ones. Cross-locale ranking is out of scope.

### 7. Covers

Slugs are shared across locales, so the cover cache key must carry the locale. `buildCoverImageUrl(slug, locale?)` adds a locale discriminator that reaches the route, the SVG text selection and the `Cache-Control` response. Without it a Turkish article renders the English cover caption.

The container installs `fontconfig ttf-dejavu` (commit `19f0843`); DejaVu Sans covers `ğ ş ı İ ç ö ü`. The Turkish cover must still be verified visually on production, not assumed.

### 8. Academy and regulations pilot

- `src/app/academy/page.tsx` keeps `articleSlugs` as priority lists; the Turkish page resolves a Turkish list and skips missing slugs. A partially translated academy is therefore publishable without broken links.
- `/tr/regulations` is written natively in Turkish from the `fpv-regulations` RAG dataset with explicit sources. It is not a translation of `/regulations`, whose HUD tone and inline hex styling are the leftover of a pre-Phase-A page and are simplified while the Turkish page is built.

### 9. Generation pipeline

- The content job/brief carries `locale`; the Dify `content-orchestrator` workflow receives it as an input.
- Turkish regulated content is generated, not translated, and must carry dataset sources.
- Non-regulated Turkish guides may be produced as translations of an English artifact, marked with `translatedFrom`. A translated artifact is stale when its English source changes; the publish gate does not silently republish it.
- The publish gate uses `hasLanguageMismatch(artifact, job.locale)` instead of the English-only guard.

### 10. SEO

- `alternates.languages` is emitted on both trees, only for pages that exist in both locales.
- `og:locale` becomes `tr_TR` for the Turkish tree; JSON-LD carries `inLanguage`.
- The sitemap gains Turkish entries only for pages with real content; stub pages are not published to search engines.
- Turkish indexing opens last (C5), after enough content exists to avoid a thin-content footprint.

## Phases

Each phase is a separate commit and a separate Coolify deployment with its own verification. No phase depends on a later one being merged.

| Phase | Deliverable | Verification |
| --- | --- | --- |
| C0 | Locale model, label catalog, mismatch guard, storage key with `locale`, search folding, hreflang helpers. No visible change. | `tsc --noEmit`, `eslint`, `content:language-audit`, `metadata:test`, new locale regression test. Production English pages unchanged. |
| C0.5 | `(en)` route-group split with dual root layouts. | Sitemap URL-set diff equals the current 196 URLs; status-code parity on all routes; `/api/ready` ready; no visual diff on `/`, `/academy`, `/guides`, an article page. |
| C1 | `/tr` tree: home, academy shell, guides, navigation/footer/mobile bar language switch. | `/tr` renders `<html lang="tr">`; Turkish uppercase correct; 360px layout without overflow; hreflang reciprocal with English. |
| C2 | SHGM regulations page from RAG sources + six-step academy articles + locale-aware covers. | Sources visible on the regulations page; cover caption in Turkish; academy links resolve; no Turkish leakage into English tree and vice versa. |
| C3 | Design debt on touched files only: hardcoded hex to `@theme` tokens, HUD leftovers simplified. | Visual regression on the touched pages; no raw hex introduced; `ui-designer` checklist (contrast, type scale, spacing). |
| C4 | Pipeline locale: job field, Dify input, publish gate, staleness rule. | One dry-run Turkish generation recorded; job shows locale; regulated output rejected if sources are missing. |
| C5 | SEO opening: Turkish sitemap entries, GSC property, hreflang validation. | Sitemap lists only populated Turkish pages; `hreflang` validates; no duplicate-content warnings in GSC after 7 days. |

## Risks and Blast Radius

- **C0.5 layout split.** Root layout and navigation are HIGH risk in GitNexus; the split touches every page's file location without changing imports (`@/` alias). Mitigation: purely mechanical move, URL diff, status parity, separate deploy.
- **Storage key change.** Changing the uniqueness constraint on `published_articles_shadow` requires a migration with a backup. Mitigation: additive column with default, constraint swap in one transaction, verified by read/write round-trip in the Coolify postgres terminal.
- **Guard inversion.** The language gate currently protects the English site from Turkish leakage; loosening it carelessly would let mixed content through. Mitigation: mismatch detection is bidirectional and covered by a regression test for both directions.
- **Search folding.** Folding changes English result ordering if applied unconditionally. Mitigation: folding is locale-gated.
- **Cover cache.** Existing covers are cached for 24h at the route and by the Next image optimizer; a locale key must be part of the URL, not a header, or caches will collide.
- **Thin content.** Turkish pages published before content exists would create low-value indexed pages. Mitigation: sitemap and indexing are opened last.

Tooling constraint: GitNexus native binary is currently broken on the owner's macOS host (`libssl.3.dylib`), so impact analysis for this project must run on a clean clone or fall back to text-based caller analysis, and every HIGH/CRITICAL warning must be reported to the owner before editing.

## Testing Strategy

- New `scripts/locale-regression-test.ts`: locale defaulting, storage key separation, bidirectional mismatch detection, Turkish search folding.
- Extend `scripts/content-language-audit.ts` to walk both locale directories with opposite expectations.
- Extend `scripts/seo-discoverability-regression-test.ts`: reciprocal hreflang, canonical correctness per locale, Turkish sitemap entries limited to populated pages.
- Manual browser verification for every Turkish page at 360px and 1440px, including uppercase rendering and the language switch.

## Rollback

Each phase is individually revertible:

- C0 and C0.5 are code-only; reverting restores the previous layout with no data impact.
- C1 and C2 are additive routes; deleting `src/app/tr` removes the Turkish site without touching English content.
- C4 keeps `locale` defaulted to `en`, so an English-only pipeline continues to work with the field present.
- The storage migration is additive (`DEFAULT 'en'`); rolling back the constraint change does not require deleting Turkish rows, only unexposing them via the guard.
