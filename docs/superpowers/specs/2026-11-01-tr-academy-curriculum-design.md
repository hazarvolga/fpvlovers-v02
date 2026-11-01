# Turkish academy curriculum — design

Date: 2026-11-01
Status: draft for approval
Builds on: [2026-10-31-turkish-articles-c2.md](../plans/2026-10-31-turkish-articles-c2.md)

## Intent

`/tr/academy` promises a Turkish path from "what is FPV" to a first flight. Today it
delivers one Turkish article; four of its six steps hand the reader to English pages.
The academy becomes a translation of the English beginner path wherever the knowledge
is universal, and original Turkish writing wherever the answer depends on Turkey
(regulation).

## Why now

- The translation pipeline, gate, and Turkish route already shipped (C2): the second
  Turkish article costs the same as the first.
- The Turkish tree is live and indexable, so every English link inside `/tr/academy` is
  a promise the site cannot keep.
- The image gap is measured (below): it is a crawl-data problem with a partial fix, not
  a rendering bug.

## Current state

Facts as of 2026-11-01, verified against the code on this branch.

| Area | State |
| --- | --- |
| Turkish articles | 1 published (`fpv-beginner-setup-guide-…`), `locale: "tr"`, `translationOf` set |
| `/tr/academy` steps | 6 steps in [`start-steps.ts`](../../../src/lib/i18n/start-steps.ts); step 1 has 1 article, steps 2–6 have none |
| Step resolution | `resolveArticles()` looks slugs up in the locale-scoped list, so an untranslated slug renders nothing — no 404 risk |
| Step page links | `page.href` goes through `localizePath`, which never prefixes `/article/*`; `/academy/glossary`, `/academy/simulators`, `/academy/starter-kits`, `/regulations` have no Turkish route and therefore render as English links |
| Translated page routes | `TRANSLATED_PATHS = ['/', '/academy', '/guides', '/search']` |
| Production read path | `FPV_STORAGE_MODE=dual`: the app reads `published_articles_shadow.metadata` first, then committed files |
| Shadow rows | 153 `en`, 0 `tr` — English serves from the DB, Turkish serves from the files |
| Article galleries | 95 of 154 artifacts carry inline images; 59 have `media.gallery = []` |
| Raw crawl sources | `content_engine.raw_content`: 31 active rows, 22 with markdown images — the backfill can only cover artifacts whose sources are among those rows |
| Localizer workflow | The Dify `content-localizer-tr` workflow does not exist; translation runs through `scripts/translate-article.ts --from-file` plus the publish gate |
| Original Turkish articles | Not representable yet: `assertPublishableLocale` throws for any `tr` artifact without `translationOf` |

## Goals

1. Every one of the six `/tr/academy` steps shows at least one Turkish article.
2. No step's only next action is an English page.
3. The Turkish regulation step is original Turkish writing grounded in official sources.
4. Translated articles inherit whatever imagery their English source carries; the image
   gap is reduced by data, not papered over with stock filler.

## Non-goals

- Turkish sub-pages (`/tr/academy/glossary`, `/tr/academy/simulators`,
  `/tr/academy/starter-kits`, `/tr/academy/roadmap`).
- Translating the whole 153-article catalogue.
- Hero CTA localisation (`/academy/roadmap`, `/buyers-guides` stay English).
- Regenerating cover artwork with Turkish text.
- Localising the article sidebar (`NativeAds`) or the artwork credit.

## Anti-goals

- A Turkish article that is a machine translation nobody edited.
- SHGM/SHY-İHA claims without an official source behind each claim.
- TL prices or availability we have not verified (AGENTS.md forbids it).
- Stock photographs sprinkled into empty galleries to make a page look full.

## Constraints

- Gate: ≥1200 words, SEO ≥80, Turkish-only metadata, `locale: "tr"`; translations also
  carry `translationOf`.
- Translated slugs stay identical to their English source so pairing and covers work.
- English artifact changes reach production only after `pnpm db:backfill-published`
  rewrites `published_articles_shadow.metadata`; once a Turkish row exists, the same is
  true for Turkish.
- The content language audit stays green for both trees.

## Approaches considered

**A — Translate the English beginner path wholesale.** Cheapest per article, but
translates advice that is wrong for Turkey (US regulation) and yields a site that reads
like a translation.

**B — Write the Turkish academy from scratch.** Best voice and local fit, but discards
153 researched articles, the working gate, and the translation pipeline.

**C — Hybrid, ordered (chosen).** Translate the universal concepts; write Turkish from
scratch only where the answer is Turkey-specific; repair images at the source before
translating so Turkish inherits them.

## Phase 1 — scope for this slice

### Translations (5)

Aligned with the English first pick per step, so `/tr/academy` mirrors the English path.

| Step | English source | Words | Gallery |
| --- | --- | --- | --- |
| 1 — FPV nedir | *(already published: `fpv-beginner-setup-guide-the-easiest-way-to-get-flying`)* | 3479 | 0 |
| 2 — Simülatör | `fpv-simulator-practice-plan-first-30-days` | 3411 | 0 |
| 3 — Kumanda | `how-to-choose-your-first-fpv-radio-without-buying-twice` | 2985 | 1 |
| 4 — İlk drone | `best-fpv-starter-kits-2026-rtf-bundles-for-beginners` | — | 2 |
| 5 — Kurallar | `fpv-lipo-battery-safety-charging-guide-prevent-fires-and-fly-longer` | — | 1 |
| 6 — İlk uçuş | `first-hover-training` | 2817 | 0 |

### Original Turkish (1)

| Step | Article | Grounding |
| --- | --- | --- |
| 5 — Kurallar | SHGM / SHY-İHA beginner summary, `origin: "tr"` | Official SHGM pages; every claim traceable; no interpretation of grey areas, no TL figures |

Step 5's title and todos promise both rules and battery safety, so it receives two
articles: the original regulation summary and the translated LiPo guide.

### Contract change for originals

An original Turkish article has no English counterpart, so `translationOf` cannot be
honest. Small, explicit extension:

- Artifacts gain an optional `origin: "tr"` marker.
- `assertPublishableLocale(locale, translationOf, origin)` accepts `tr` when either
  `translationOf` or `origin === 'tr'` is set; the error message keeps demanding one of
  them.
- The language audit accepts `origin: "tr"` in place of `translationOf`.
- Pairing code does not change: without `translationOf` there is no hreflang cluster and
  no sitemap alternate, which is correct for a one-sided article.
- Tests in `scripts/locale-regression-test.ts` cover both accept paths and the rejection.

A future English translation of that article would have to declare `translationOf`
pointing at the Turkish slug; cross-direction pairing is out of scope here and is noted,
not built.

### Step wiring

- Remove `page` from the six Turkish steps; their next action becomes the article list,
  which renders through `localizeArticlePath` and therefore stays inside `/tr`.
- Add each newly published slug to its step's `articleSlugs`. Steps keep their English
  arrays untouched.
- Leave `maxArticles` as is; step 5 has two articles and a default cap of 3.

### Image work, before translating

1. Point `DB_*` at the production database through an SSH tunnel (or run a one-off
   container) — both scripts use that single connection: `db:inject-images` reads
   `content_engine.raw_content`, `db:backfill-published` writes
   `fpvlovers_app.published_articles_shadow`.
2. Dry run the backfill, then run it, so committed artifacts pick up the images that
   exist in raw content. Report how many of the 59 empty galleries the 31 raw rows fill.
   Low coverage is a crawl gap and becomes a separate task.
3. Sync rewritten artifacts to the shadow table so English production pages change too.
4. Translate **after** the backfill, so each Turkish article copies repaired media.
5. Any article that still has no inline figures ships with its generated cover only.

## Phase 2 — deferred

- Turkish sub-pages and the roadmap.
- TL budget guide — blocked until verified Turkish prices exist.
- Stock-figure fallback for permanently empty galleries.
- Article sidebar and cover-credit localisation.
- The Dify `content-localizer-tr` workflow.
- Cross-direction pairing for English translations of Turkish originals.

## Verification

- `pnpm locale:test`, `pnpm locale:localizer-test`, `pnpm content:language-audit`,
  `pnpm seo:discoverability-test`, `tsc --noEmit`, `pnpm build`.
- Per article: gate output, then the Turkish page returns 200 with reciprocal hreflang,
  Turkish body, Turkish category/level, no English leak in title, excerpt, or headings.
- `/tr/academy`: all six steps show a Turkish article; no step renders an English page
  link as its only next action.
- Sitemap grows by one `<loc>` per published Turkish article; the original regulation
  article appears with no alternates.
- Production: container image tag matches the pushed commit, then the checks above run
  against `https://fpvlovers.com.tr`.

## Left to the builder

- Turkish wording, headline, and meta description choices within the contract.
- Slug for the original regulation article (recommendation: English-style, so a future
  English translation can pair through `translationOf`).
- Publication order inside Phase 1, one by one or in a batch.
- Tunnel versus one-off container for the database pass, and how to measure backfill
  coverage before and after.
