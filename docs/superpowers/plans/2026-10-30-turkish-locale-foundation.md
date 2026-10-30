# Turkish Locale Foundation Implementation Plan (Phase C0–C1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a real `locale` concept into content storage, exposure, search and routing, split the app into `(en)` and `tr` root layouts, and ship a Turkish shell (home, academy, guides, search) without changing a single English URL.

**Architecture:** Locale is a first-class value (`'en' | 'tr'`) that travels from storage key (`slug, locale`) through the expose guard, read paths, cover cache key, search folding and metadata. English keeps every current URL; Turkish is a separate `src/app/tr` tree with its own `<html lang="tr">`, and only pages that actually exist in both languages are linked or advertised via `hreflang`.

**Tech Stack:** Next.js 15 App Router (standalone), React 19, TypeScript 5.9, Tailwind 4, PostgreSQL 17 (`fpvlovers_app`), node:assert regression scripts run through `tsx`.

**Spec:** `docs/superpowers/specs/2026-10-30-turkish-secondary-locale-design.md`

## Global Constraints

- **Primary language stays English.** Site copy, commits and code comments are English; only `src/lib/i18n/*` carries Turkish strings.
- **No English URL may change.** `/`, `/academy`, `/guides`, `/article/<slug>`, all 196 sitemap URLs must keep returning the same content and status.
- **Never read or log `.env` contents.** No secrets in commits, no `.env` parsing in scripts.
- **Local tooling:** the owner's Mac has no `npm`. Use `pnpm`, `./node_modules/.bin/tsc`, `./node_modules/.bin/eslint`, and `node --import tsx scripts/<file>`.
- **CI runs `npm run …`** (GitHub Actions), local runs use `pnpm run …`.
- **Conventional Commits only** (`feat(scope): …`, `fix(scope): …`, `docs(scope): …`), enforced by commitlint.
- **GitNexus impact before editing a symbol.** The binary is broken on this Mac (`libssl.3.dylib`); run the impact in a clean clone or record a text-based caller check in the commit body, and report HIGH/CRITICAL risk to the owner before editing.
- **Coolify-native only.** Pushes do not auto-deploy; deploy `fpvlovers-web` (`jnlhgqmjnqwpdgefsoskew5n`) manually. Never touch AffeXAI Cortex or Bimmetraj.
- **Turkish content is never machine-translated regulation text.** SHGM/SHY content comes from the `fpv-regulations` RAG dataset with sources (this plan only prepares the plumbing).
- **No n8n references** in code or docs.

## Release Plan

| Release | Tasks | Ships |
| --- | --- | --- |
| R1 (C0) | 1–6 | Invisible foundation; English behaviour identical |
| R2 (C0.5) | 7 | `(en)` / `tr` root layouts; URLs unchanged |
| R3 (C1) | 8–12 | Turkish shell live at `/tr`, `/tr/academy`, `/tr/guides`, `/tr/search` |

Deploy after R1, R2 and R3 separately and verify before starting the next release.

## File Map

**Create**

| File | Responsibility |
| --- | --- |
| `src/lib/i18n/locale.ts` | `Locale` type, defaults, path localization, translated-path allowlist |
| `src/lib/i18n/search-text.ts` | Turkish-aware text folding for search |
| `src/lib/i18n/labels.ts` | Turkish navigation/footer/chrome copy overrides |
| `src/lib/i18n/start-steps.ts` | Six-step academy data per locale |
| `src/lib/seo/root-metadata.ts` | Per-locale root metadata + site JSON-LD |
| `src/features/layout/components/RootShell.tsx` | Shared `<html>`/`<body>` chrome for both root layouts |
| `src/features/layout/components/LanguageSwitch.tsx` | EN/TR switch shown only for translated pages |
| `src/features/academy/components/StartHereView.tsx` | Locale-aware renderer for the six steps |
| `src/features/guides/components/GuidesHub.tsx` | Locale-aware guides hub (filters + cards) |
| `src/app/(en)/layout.tsx` | English root layout (moved) |
| `src/app/tr/layout.tsx` | Turkish root layout, `<html lang="tr">` |
| `src/app/tr/page.tsx` | Turkish landing page |
| `src/app/tr/academy/page.tsx` | Turkish academy shell |
| `src/app/tr/guides/page.tsx` | Turkish guides hub |
| `src/app/tr/search/page.tsx` | Turkish search |
| `db/migrations/0010_published_content_locale.sql` | `locale` column + `(slug, locale)` key |
| `scripts/locale-regression-test.ts` | All locale unit assertions |

**Modify**

| File | Change |
| --- | --- |
| `src/lib/content-automation/content-reader.ts` | Bidirectional language guard, locale-scoped read paths |
| `src/lib/content-automation/content-media.ts` | `buildCoverImageUrl(slug, locale)` |
| `src/app/api/content/media/cover/[slug]/route.ts` | Read `?locale=`, fetch the matching artifact |
| `src/lib/server/published-content-store.ts` | `locale` in insert/conflict/read |
| `src/lib/navigationData.ts` | `getNavigation(locale)` |
| `src/features/layout/components/Navbar.tsx` | Locale prop, localized hrefs |
| `src/features/layout/components/SiteFooter.tsx` | Locale prop, localized links |
| `src/features/layout/components/MobileUtilityBar.tsx` | Locale prop, localized labels |
| `src/lib/seo/metadata.ts` | Locale-aware canonical, `hreflang`, OG locale |
| `src/app/sitemap.xml/route.ts` | Turkish entries for translated pages only |
| `src/app/search/SearchClient.tsx` | Locale prop, folded query/document matching |
| `src/lib/content-taxonomy.ts` | Locale-aware group/level labels |
| `src/app/academy/page.tsx`, `src/app/guides/page.tsx` | Thin wrappers over shared views |
| `package.json`, `.github/workflows/deploy.yml` | `locale:test` script + CI step |

---

### Task 1: Locale primitives and the regression test harness

**Files:**
- Create: `src/lib/i18n/locale.ts`
- Test: `scripts/locale-regression-test.ts`
- Modify: `package.json` (scripts block, after `"dify:client-test"`), `.github/workflows/deploy.yml:39-46`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type Locale = 'en' | 'tr'`
  - `DEFAULT_LOCALE: Locale`
  - `isLocale(value: unknown): value is Locale`
  - `resolveLocale(value: unknown): Locale`
  - `localizePath(path: string, locale: Locale): string` — returns the Turkish path only when the path is translated, otherwise the English path unchanged
  - `splitLocalePath(input: string): { locale: Locale; path: string }`
  - `isTranslatedPath(path: string): boolean`
  - `TRANSLATED_PATHS: readonly string[]` = `['/', '/academy', '/guides', '/search']`

- [ ] **Step 1: Write the failing test**

Create `scripts/locale-regression-test.ts`:

```ts
import assert from 'node:assert/strict';
import {
  DEFAULT_LOCALE,
  TRANSLATED_PATHS,
  isLocale,
  isTranslatedPath,
  localizePath,
  resolveLocale,
  splitLocalePath,
} from '../src/lib/i18n/locale';

const checks: { name: string; run: () => void }[] = [];
function check(name: string, run: () => void): void {
  checks.push({ name, run });
}

check('default locale is en', () => {
  assert.equal(DEFAULT_LOCALE, 'en');
});

check('isLocale accepts en and tr only', () => {
  assert.equal(isLocale('en'), true);
  assert.equal(isLocale('tr'), true);
  assert.equal(isLocale('de'), false);
  assert.equal(isLocale(undefined), false);
});

check('resolveLocale falls back to en', () => {
  assert.equal(resolveLocale('tr'), 'tr');
  assert.equal(resolveLocale(''), 'en');
  assert.equal(resolveLocale(null), 'en');
});

check('localizePath leaves English paths untouched', () => {
  assert.equal(localizePath('/academy', 'en'), '/academy');
  assert.equal(localizePath('/', 'en'), '/');
});

check('localizePath prefixes translated Turkish paths', () => {
  assert.equal(localizePath('/', 'tr'), '/tr');
  assert.equal(localizePath('/academy', 'tr'), '/tr/academy');
  assert.equal(localizePath('/guides?level=beginner', 'tr'), '/tr/guides?level=beginner');
});

check('localizePath keeps untranslated paths on English', () => {
  assert.equal(localizePath('/tools', 'tr'), '/tools');
  assert.equal(localizePath('/racing/news', 'tr'), '/racing/news');
});

check('splitLocalePath separates locale and path', () => {
  assert.deepEqual(splitLocalePath('/tr'), { locale: 'tr', path: '/' });
  assert.deepEqual(splitLocalePath('/tr/academy'), { locale: 'tr', path: '/academy' });
  assert.deepEqual(splitLocalePath('/academy'), { locale: 'en', path: '/academy' });
  assert.deepEqual(splitLocalePath('/tracks'), { locale: 'en', path: '/tracks' });
});

check('translated paths are listed explicitly', () => {
  assert.equal(isTranslatedPath('/academy'), true);
  assert.equal(isTranslatedPath('/tools/calculator'), false);
  assert.ok(TRANSLATED_PATHS.includes('/'));
});

let failed = 0;
for (const { name, run } of checks) {
  try {
    run();
    console.log(`✓ ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`✗ ${name}: ${(error as Error).message}`);
  }
}
if (failed > 0) {
  console.error(`locale regression test failed (${failed}/${checks.length})`);
  process.exit(1);
}
console.log(`locale regression test passed (${checks.length} checks)`);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --import tsx scripts/locale-regression-test.ts`
Expected: FAIL with `Cannot find module '../src/lib/i18n/locale'`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/lib/i18n/locale.ts`:

```ts
export type Locale = 'en' | 'tr';

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALES: readonly Locale[] = ['en', 'tr'];

/**
 * Paths that exist in both languages. Anything not listed here stays on the
 * English URL for Turkish visitors until its translation ships, so navigation
 * never points at a 404.
 */
export const TRANSLATED_PATHS: readonly string[] = ['/', '/academy', '/guides', '/search'];

const TR_PREFIX = '/tr';

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'tr';
}

export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function isTranslatedPath(path: string): boolean {
  const pathOnly = path.split('?')[0].split('#')[0];
  const normalized = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  return TRANSLATED_PATHS.includes(normalized) || TRANSLATED_PATHS.includes(`${normalized}/`);
}

export function localizePath(path: string, locale: Locale): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE || !isTranslatedPath(normalized)) return normalized;
  const [, pathname, suffix = ''] = normalized.match(/^([^?#]*)(.*)$/) ?? [normalized, normalized, ''];
  if (pathname === '/' || pathname === '') return `${TR_PREFIX}${suffix}`;
  return `${TR_PREFIX}${pathname}${suffix}`;
}

export function splitLocalePath(input: string): { locale: Locale; path: string } {
  const normalized = input.startsWith('/') ? input : `/${input}`;
  if (normalized === TR_PREFIX) return { locale: 'tr', path: '/' };
  if (normalized.startsWith(`${TR_PREFIX}/`)) {
    return { locale: 'tr', path: normalized.slice(TR_PREFIX.length) };
  }
  return { locale: DEFAULT_LOCALE, path: normalized };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --import tsx scripts/locale-regression-test.ts`
Expected: PASS, `locale regression test passed (8 checks)`.

- [ ] **Step 5: Register the script and CI step**

In `package.json`, after the `"dify:client-test"` entry, add:

```json
    "locale:test": "node --import tsx scripts/locale-regression-test.ts"
```

In `.github/workflows/deploy.yml`, inside `Verify contracts`, after `npm run dify:client-test`, add:

```yaml
          npm run locale:test
```

- [ ] **Step 6: Verify the script wiring**

Run: `pnpm run locale:test`
Expected: PASS with 8 checks.

- [ ] **Step 7: Commit**

```bash
git add src/lib/i18n/locale.ts scripts/locale-regression-test.ts package.json .github/workflows/deploy.yml
git commit -m "feat(i18n): add locale primitives and translated-path allowlist"
```

---

### Task 2: Turkish-aware search folding

**Files:**
- Create: `src/lib/i18n/search-text.ts`
- Test: `scripts/locale-regression-test.ts` (append)

**Interfaces:**
- Consumes: `Locale` from `src/lib/i18n/locale.ts`.
- Produces:
  - `foldTurkish(input: string): string`
  - `normalizeSearchText(input: string, locale: Locale): string` — lowercases, then folds Turkish characters when `locale === 'tr'`

- [ ] **Step 1: Write the failing test**

Append to `scripts/locale-regression-test.ts`, above the `let failed = 0;` block, and add the import at the top:

```ts
import { foldTurkish, normalizeSearchText } from '../src/lib/i18n/search-text';
```

```ts
check('foldTurkish maps Turkish letters to ASCII', () => {
  assert.equal(foldTurkish('uçuş ışığı'), 'ucus isigi');
  assert.equal(foldTurkish('Şarj Ölçüm'), 'Sarj Olcum');
});

check('normalizeSearchText lowercases per locale', () => {
  assert.equal(normalizeSearchText('PILOT', 'en'), 'pilot');
  assert.equal(normalizeSearchText('PİLOT', 'tr'), 'pilot');
});

check('Turkish query and document fold to the same token', () => {
  const documentText = normalizeSearchText('İlk uçuş için simülatör rehberi', 'tr');
  const query = normalizeSearchText('UÇUŞ', 'tr');
  assert.ok(documentText.includes(query), `${documentText} should contain ${query}`);
});

check('English text is not folded', () => {
  assert.equal(normalizeSearchText('Uçuş', 'en'), 'uçuş');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --import tsx scripts/locale-regression-test.ts`
Expected: FAIL with `Cannot find module '../src/lib/i18n/search-text'`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/lib/i18n/search-text.ts`:

```ts
import type { Locale } from './locale';

const TURKISH_FOLD: Record<string, string> = {
  ı: 'i', İ: 'i', I: 'i',
  ş: 's', Ş: 's',
  ğ: 'g', Ğ: 'g',
  ç: 'c', Ç: 'c',
  ö: 'o', Ö: 'o',
  ü: 'u', Ü: 'u',
  â: 'a', Â: 'a', î: 'i', Î: 'i', û: 'u', Û: 'u',
};

const TURKISH_LETTERS = /[ışŞğĞçÇöÖüÜİIâÂîÎûÛ]/g;

export function foldTurkish(input: string): string {
  return input.replace(TURKISH_LETTERS, (char) => TURKISH_FOLD[char] ?? char);
}

export function normalizeSearchText(input: string, locale: Locale): string {
  const lowered = locale === 'tr' ? input.toLocaleLowerCase('tr-TR') : input.toLowerCase();
  return locale === 'tr' ? foldTurkish(lowered) : lowered;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --import tsx scripts/locale-regression-test.ts`
Expected: PASS, 12 checks.

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n/search-text.ts scripts/locale-regression-test.ts
git commit -m "feat(i18n): add Turkish search folding"
```

---

### Task 3: Bidirectional language guard

**Files:**
- Modify: `src/lib/content-automation/content-reader.ts:14-60`
- Test: `scripts/locale-regression-test.ts` (append)

**Interfaces:**
- Consumes: `Locale`, `DEFAULT_LOCALE` from `src/lib/i18n/locale.ts`.
- Produces:
  - `hasLanguageMismatch(article: LanguageSample, expectedLocale: Locale): boolean`
  - `shouldExposePublishedArtifact(article: PublishedArtifact, expectedLocale?: Locale): boolean` — default `'en'`
  - `hasTurkishLanguageLeak(article: LanguageSample): boolean` (kept, now built on the same detector)

`LanguageSample` is `Pick<PublishedArtifact, 'title' | 'excerpt' | 'bodySections'>`.

- [ ] **Step 1: Write the failing test**

Append to `scripts/locale-regression-test.ts`:

```ts
import {
  hasLanguageMismatch,
  hasTurkishLanguageLeak,
} from '../src/lib/content-automation/content-reader';

const turkishSample = {
  title: 'FPV Simülatör Rehberi',
  excerpt: 'Uçuş pratiği için en iyi simülatörler ve başlangıç tavsiyeleri.',
  bodySections: [
    { title: 'Başlangıç', content: 'Yeni başlayan pilotlar için uçuş pratiği: gözlüğünüzü takın ve kumandanızı ayarlayın. Türkiye’de uçuş kurallarını öğrenin.' },
  ],
} as unknown as Pick<PublishedArtifact, 'title' | 'excerpt' | 'bodySections'>;

const englishSample = {
  title: 'FPV Simulator Guide',
  excerpt: 'The best simulators for stick practice and how to build a routine.',
  bodySections: [
    { title: 'Why practice', content: 'The easiest way to learn is to practise with the simulator and with your radio before you buy a drone and goggles.' },
  ],
} as unknown as Pick<PublishedArtifact, 'title' | 'excerpt' | 'bodySections'>;

check('Turkish text is detected as Turkish', () => {
  assert.equal(hasTurkishLanguageLeak(turkishSample), true);
});

check('Turkish artifact is hidden from the English tree', () => {
  assert.equal(hasLanguageMismatch(turkishSample, 'en'), true);
});

check('Turkish artifact is exposed in the Turkish tree', () => {
  assert.equal(hasLanguageMismatch(turkishSample, 'tr'), false);
});

check('English artifact is exposed in the English tree', () => {
  assert.equal(hasLanguageMismatch(englishSample, 'en'), false);
});

check('English artifact is a mismatch in the Turkish tree', () => {
  assert.equal(hasLanguageMismatch(englishSample, 'tr'), true);
});
```

Add `import type { PublishedArtifact } from '../src/lib/content-automation/content-reader';` at the top of the script.

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --import tsx scripts/locale-regression-test.ts`
Expected: FAIL with `hasLanguageMismatch is not a function` (or a TS import error).

- [ ] **Step 3: Write the minimal implementation**

In `src/lib/content-automation/content-reader.ts`, replace the block at lines 14–60 with:

```ts
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locale';

const TURKISH_LANGUAGE_MARKERS = [
  'başlangıç',
  'öğren',
  'uçuş',
  'gökyüz',
  'satın alma',
  'yeni başlayan',
  'pratik ipucu',
  'tavsiye edilir',
  'türkiye',
  'şiddetle',
  'kumandanız',
  'drone\'unuz',
  'dronunuzu',
  'gözlüğ',
  'piller',
  'uçur',
] as const;

const TURKISH_SPECIFIC_CHARS = /[ğĞıİşŞüÜöÖçÇ]/g;
const ENGLISH_MARKERS = /\b(the|and|with|your|how|before|after|from|this)\b/gi;

export type LanguageSample = Pick<PublishedArtifact, 'title' | 'excerpt' | 'bodySections'>;

function getArtifactLanguageText(article: LanguageSample): string {
  return [
    article.title,
    article.excerpt,
    ...(article.bodySections || []).map((section) => `${section.title}\n${section.content}`),
  ].join('\n');
}

export function hasTurkishLanguageLeak(article: LanguageSample): boolean {
  const text = getArtifactLanguageText(article);
  const lower = text.toLocaleLowerCase('tr-TR');
  const markerHits = TURKISH_LANGUAGE_MARKERS.filter((marker) => lower.includes(marker)).length;
  const specificCharHits = text.match(TURKISH_SPECIFIC_CHARS)?.length || 0;

  return markerHits >= 2 || specificCharHits >= 12;
}

function looksEnglish(article: LanguageSample): boolean {
  const text = getArtifactLanguageText(article);
  const englishHits = text.match(ENGLISH_MARKERS)?.length || 0;
  const specificCharHits = text.match(TURKISH_SPECIFIC_CHARS)?.length || 0;

  return englishHits >= 10 && specificCharHits < 3;
}

/**
 * A guard, not a language detector: it only blocks text that is clearly the
 * wrong language, so a short Turkish snippet with few diacritics is not
 * rejected while an English body in the Turkish tree is.
 */
export function hasLanguageMismatch(article: LanguageSample, expectedLocale: Locale): boolean {
  if (expectedLocale === 'en') return hasTurkishLanguageLeak(article);
  return !hasTurkishLanguageLeak(article) && looksEnglish(article);
}

const RETIRED_ARTICLE_SLUGS = new Set(Object.keys(retiredArticles));

export function shouldExposePublishedArtifact(
  article: PublishedArtifact,
  expectedLocale: Locale = DEFAULT_LOCALE,
): boolean {
  // Retired duplicates stay hidden everywhere (lists, search, sitemap, slug
  // lookups); next.config.ts 301-redirects their URLs to the canonical article.
  if (RETIRED_ARTICLE_SLUGS.has(article.slug)) return false;
  if (process.env.ALLOW_NON_ENGLISH_PUBLISHED === 'true') return true;
  return !hasLanguageMismatch(article, expectedLocale);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --import tsx scripts/locale-regression-test.ts`
Expected: PASS, 17 checks.

- [ ] **Step 5: Verify the English site is unchanged**

Run: `node --import tsx scripts/content-language-audit.ts`
Expected: `✓ content language audit passed (153 artifacts checked)`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/content-automation/content-reader.ts scripts/locale-regression-test.ts
git commit -m "feat(i18n): make the published-content language guard bidirectional"
```

---

### Task 4: Locale-scoped content read paths

**Files:**
- Modify: `src/lib/content-automation/content-reader.ts:12, 391-487`
- Test: `scripts/locale-regression-test.ts` (append)

**Interfaces:**
- Consumes: `Locale`, `DEFAULT_LOCALE`, `shouldExposePublishedArtifact(article, locale)`.
- Produces:
  - `listPublishedContent(locale?: Locale): PublishedArtifact[]`
  - `getPublishedContentBySlug(slug: string, locale?: Locale): PublishedArtifact | null`
  - `getPublishedSlugs(locale?: Locale): string[]`
  - `listPublishedContentAsync(locale?: Locale): Promise<PublishedArtifact[]>`
  - `getPublishedContentBySlugAsync(slug: string, locale?: Locale): Promise<PublishedArtifact | null>`
  - `getPublishedSlugsAsync(locale?: Locale): Promise<string[]>`
  - `getPublishedJobIdsAsync(locale?: Locale): Promise<string[]>`
  - `publishedDirFor(locale: Locale): string` (`content/published` for `en`, `content/published/tr` for `tr`)

- [ ] **Step 1: Write the failing test**

Append to `scripts/locale-regression-test.ts` (import the new functions next to the existing content-reader import):

```ts
import {
  getPublishedContentBySlug,
  getPublishedJobIdsAsync,
  listPublishedContent,
} from '../src/lib/content-automation/content-reader';
```

```ts
check('English listing keeps its artifacts and default locale', () => {
  const english = listPublishedContent('en');
  assert.ok(english.length > 100, `expected >100 English artifacts, got ${english.length}`);
  assert.equal(english.length, listPublishedContent().length);
});

check('Turkish listing is empty until the tr content directory exists', () => {
  assert.deepEqual(listPublishedContent('tr'), []);
});

check('Slug lookup respects the locale', () => {
  assert.ok(getPublishedContentBySlug('fpv-beginner-setup-guide-the-easiest-way-to-get-flying', 'en'));
  assert.equal(getPublishedContentBySlug('fpv-beginner-setup-guide-the-easiest-way-to-get-flying', 'tr'), null);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --import tsx scripts/locale-regression-test.ts`
Expected: FAIL — `listPublishedContent('tr')` returns the English list because the locale argument is ignored.

- [ ] **Step 3: Write the minimal implementation**

In `src/lib/content-automation/content-reader.ts`, replace line 12 (`const PUBLISHED_DIR = …`) with:

```ts
const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');

export function publishedDirFor(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? PUBLISHED_DIR : path.join(PUBLISHED_DIR, locale);
}
```

Add at the top: `import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locale';` (already added in Task 3 — do not duplicate).

Replace `listPublishedContent`, `getPublishedContentBySlug`, `getPublishedSlugs`, the async functions and the job-id helper (lines 391–487) with:

```ts
export function listPublishedContent(locale: Locale = DEFAULT_LOCALE): PublishedArtifact[] {
  try {
    const directory = publishedDirFor(locale);
    const files = fs.readdirSync(directory).filter((f) => f.endsWith('.json'));
    return files
      .map((file) => {
        try {
          const raw = fs.readFileSync(path.join(directory, file), 'utf-8');
          const parsed = JSON.parse(raw);
          return ensureMediaArtifact(parsed);
        } catch {
          return null;
        }
      })
      .filter((a): a is PublishedArtifact => a !== null && typeof a.slug === 'string')
      .filter((artifact) => shouldExposePublishedArtifact(artifact, locale))
      .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
  } catch {
    return [];
  }
}

export function getPublishedContentBySlug(
  slug: string,
  locale: Locale = DEFAULT_LOCALE,
): PublishedArtifact | null {
  const filePath = path.join(publishedDirFor(locale), `${slug}.json`);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    const artifact = ensureMediaArtifact(parsed);
    if (artifact && shouldExposePublishedArtifact(artifact, locale)) return artifact;
    return null;
  } catch {
    return null;
  }
}

export function getPublishedSlugs(locale: Locale = DEFAULT_LOCALE): string[] {
  return listPublishedContent(locale).map((a) => a.slug);
}

async function listPublishedContentAsyncUncached(locale: Locale): Promise<PublishedArtifact[]> {
  const files = listPublishedContent(locale);

  try {
    const { loadPublishedArtifacts } = await import('@/lib/server/published-content-store');
    const database = await loadPublishedArtifacts(locale);
    const merged = new Map<string, PublishedArtifact>();

    for (const artifact of [...files, ...database]) {
      const normalized = ensureMediaArtifact(artifact);
      if (!normalized) continue;
      if (!shouldExposePublishedArtifact(normalized, locale)) continue;
      const existing = merged.get(normalized.slug);
      const existingTime = new Date(existing?.publishedAt || 0).getTime();
      const candidateTime = new Date(normalized.publishedAt || 0).getTime();
      if (!existing || candidateTime >= existingTime) {
        merged.set(normalized.slug, normalized);
      }
    }

    return [...merged.values()].sort(
      (a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime(),
    );
  } catch (error) {
    console.warn('[Published Content] Database read failed, using committed files:', error);
    return files;
  }
}
// cache() cannot carry a default parameter, so the exported helpers stay
// single-argument-compatible for the 40+ existing English call sites.
const cachedListPublishedContent = cache(listPublishedContentAsyncUncached);

export function listPublishedContentAsync(
  locale: Locale = DEFAULT_LOCALE,
): Promise<PublishedArtifact[]> {
  return cachedListPublishedContent(locale);
}

async function getPublishedContentBySlugAsyncUncached(
  slug: string,
  locale: Locale,
): Promise<PublishedArtifact | null> {
  try {
    const { getPublishedArtifact } = await import('@/lib/server/published-content-store');
    const database = await getPublishedArtifact(slug, locale);
    const normalized = database ? ensureMediaArtifact(database) : null;
    if (normalized && shouldExposePublishedArtifact(normalized, locale)) return normalized;
  } catch (error) {
    console.warn(`[Published Content] Database lookup failed for ${slug}, using committed file:`, error);
  }

  return getPublishedContentBySlug(slug, locale);
}

const cachedGetPublishedContentBySlug = cache(getPublishedContentBySlugAsyncUncached);

export function getPublishedContentBySlugAsync(
  slug: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<PublishedArtifact | null> {
  return cachedGetPublishedContentBySlug(slug, locale);
}

export async function getPublishedSlugsAsync(locale: Locale = DEFAULT_LOCALE): Promise<string[]> {
  return (await listPublishedContentAsync(locale)).map((artifact) => artifact.slug);
}

export async function getPublishedJobIdsAsync(locale: Locale = DEFAULT_LOCALE): Promise<string[]> {
  return (await listPublishedContentAsync(locale))
    .map((artifact) => artifact.jobId)
    .filter((jobId): jobId is string => typeof jobId === 'string' && jobId.trim().length > 0);
}
```

`cache()` from React keys on the argument list, so `listPublishedContentAsync('en')` and `listPublishedContentAsync('tr')` are cached separately without extra work.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --import tsx scripts/locale-regression-test.ts`
Expected: PASS, 20 checks.

- [ ] **Step 5: Confirm no English caller regressed**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: no errors (all existing call sites rely on the default `'en'`).

Run: `node --import tsx scripts/content-integrity-audit.ts`
Expected: PASS with the same artifact count as before the change.

- [ ] **Step 6: Commit**

```bash
git add src/lib/content-automation/content-reader.ts scripts/locale-regression-test.ts
git commit -m "feat(i18n): scope published-content reads by locale"
```

---

### Task 5: Locale-aware cover URL and route

**Files:**
- Modify: `src/lib/content-automation/content-media.ts:217-219`, `src/app/api/content/media/cover/[slug]/route.ts`
- Test: `scripts/locale-regression-test.ts` (append)

**Interfaces:**
- Consumes: `Locale`, `DEFAULT_LOCALE`; `getPublishedContentBySlugAsync(slug, locale)`.
- Produces: `buildCoverImageUrl(slug: string, locale?: Locale): string` — English returns the current URL unchanged; Turkish appends `?locale=tr`.

- [ ] **Step 1: Write the failing test**

Append to `scripts/locale-regression-test.ts`:

```ts
import { buildCoverImageUrl } from '../src/lib/content-automation/content-media';

check('English cover URLs are unchanged', () => {
  assert.equal(buildCoverImageUrl('fpv-simulator'), '/api/content/media/cover/fpv-simulator');
  assert.equal(buildCoverImageUrl('fpv-simulator', 'en'), '/api/content/media/cover/fpv-simulator');
});

check('Turkish cover URLs get a distinct cache key', () => {
  assert.equal(
    buildCoverImageUrl('fpv-simulator', 'tr'),
    '/api/content/media/cover/fpv-simulator?locale=tr',
  );
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --import tsx scripts/locale-regression-test.ts`
Expected: FAIL — `buildCoverImageUrl('fpv-simulator', 'tr')` returns the English URL without `?locale=tr`.

- [ ] **Step 3: Write the minimal implementation**

In `src/lib/content-automation/content-media.ts`, replace the builder:

```ts
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locale';

/**
 * Turkish and English share slugs, so the locale must be part of the URL —
 * a header or cookie would be invisible to the route cache and the Next image
 * optimizer, and the two covers would collide.
 */
export function buildCoverImageUrl(slug: string, locale: Locale = DEFAULT_LOCALE): string {
  const base = `/api/content/media/cover/${encodeURIComponent(slug)}`;
  return locale === DEFAULT_LOCALE ? base : `${base}?locale=${locale}`;
}
```

In `src/app/api/content/media/cover/[slug]/route.ts`, change the handler signature and the artifact lookup:

```ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const locale = resolveLocale(new URL(request.url).searchParams.get('locale'));
  const published = await getPublishedContentBySlugAsync(slug, locale);
```

and add the import:

```ts
import { resolveLocale } from '@/lib/i18n/locale';
```

Leave the `Cache-Control` header as is; the query string already separates the cache entries.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --import tsx scripts/locale-regression-test.ts`
Expected: PASS, 22 checks.

- [ ] **Step 5: Confirm the cover pipeline still passes**

Run: `pnpm run content:cover-test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/content-automation/content-media.ts "src/app/api/content/media/cover/[slug]/route.ts" scripts/locale-regression-test.ts
git commit -m "feat(i18n): key cover images by locale"
```

---

### Task 6: Shadow table locale key

**Files:**
- Create: `db/migrations/0010_published_content_locale.sql`
- Modify: `src/lib/server/published-content-store.ts`
- Test: `scripts/migration-runner-regression-test.ts` (existing, must keep passing)

**Interfaces:**
- Consumes: `resolveLocale`, `DEFAULT_LOCALE`, `Locale`.
- Produces:
  - `upsertPublishedArtifact(artifact)` writes `(slug, locale)`; the JSON path becomes `content/published/tr/<slug>.json` for Turkish
  - `loadPublishedArtifacts(locale?: Locale)` filters by locale
  - `getPublishedArtifact(slug: string, locale?: Locale)`
  - `artifactStoragePath(locale: Locale, slug: string): string`

- [ ] **Step 1: Write the migration**

Create `db/migrations/0010_published_content_locale.sql`:

```sql
-- ADD LOCALE TO PUBLISHED CONTENT SHADOW
-- One artifact per (slug, locale): Turkish reuses English slugs, so slug alone
-- can no longer be the primary key.
ALTER TABLE fpvlovers_app.published_articles_shadow
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en';

ALTER TABLE fpvlovers_app.published_articles_shadow
  DROP CONSTRAINT IF EXISTS published_articles_shadow_pkey;

ALTER TABLE fpvlovers_app.published_articles_shadow
  ADD CONSTRAINT published_articles_shadow_slug_locale_key UNIQUE (slug, locale);

CREATE INDEX IF NOT EXISTS idx_published_articles_shadow_locale_date
  ON fpvlovers_app.published_articles_shadow (locale, published_at DESC);
```

- [ ] **Step 2: Run the migration runner test to verify the new file is discovered**

Run: `node --import tsx scripts/migration-runner-regression-test.ts`
Expected: PASS, and its output lists `0010` among discovered migrations. If the test asserts a fixed migration count, update that expectation to include `0010`.

- [ ] **Step 3: Update the store**

Replace the top of `src/lib/server/published-content-store.ts` (`artifactHash` stays) with:

```ts
import { createHash } from 'crypto';
import type { PublishedArtifact } from '@/lib/content-automation/content-reader';
import { DEFAULT_LOCALE, resolveLocale, type Locale } from '@/lib/i18n/locale';
import { query } from './db';
import { getStorageMode } from './storage-mode';

export function artifactStoragePath(locale: Locale, slug: string): string {
  return locale === DEFAULT_LOCALE
    ? `content/published/${slug}.json`
    : `content/published/${locale}/${slug}.json`;
}
```

Replace `upsertPublishedArtifact` with:

```ts
export async function upsertPublishedArtifact(artifact: PublishedArtifact): Promise<void> {
  const mode = getStorageMode();
  if (mode === 'files') return;

  const locale = resolveLocale(artifact.locale);
  const tags = Array.isArray(artifact.seo?.keywords) ? artifact.seo.keywords : [];
  const publishedAt = artifact.publishedAt ? new Date(artifact.publishedAt) : new Date();
  const jsonPath = artifactStoragePath(locale, artifact.slug);
  const markdownPath = jsonPath.replace(/\.json$/, '.md');

  try {
    await query(
      `
        INSERT INTO fpvlovers_app.published_articles_shadow (
          slug, locale, title, excerpt, category, tags, published_at, updated_at,
          json_path, markdown_path, json_hash, markdown_hash, metadata, last_indexed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, $10, NULL, $11, NOW())
        ON CONFLICT (slug, locale) DO UPDATE SET
          title = EXCLUDED.title,
          excerpt = EXCLUDED.excerpt,
          category = EXCLUDED.category,
          tags = EXCLUDED.tags,
          published_at = EXCLUDED.published_at,
          updated_at = NOW(),
          json_path = EXCLUDED.json_path,
          markdown_path = EXCLUDED.markdown_path,
          json_hash = EXCLUDED.json_hash,
          metadata = EXCLUDED.metadata,
          last_indexed_at = NOW()
      `,
      [
        artifact.slug,
        locale,
        artifact.title,
        artifact.excerpt || null,
        artifact.category || null,
        tags,
        publishedAt,
        jsonPath,
        markdownPath,
        artifactHash(artifact),
        artifact,
      ],
    );
  } catch (error) {
    if (mode === 'dual') {
      console.warn(`[Published Content] Database mirror failed for ${artifact.slug} (${locale}):`, error);
      return;
    }
    throw error;
  }
}
```

Replace `loadPublishedArtifacts` and `getPublishedArtifact` with:

```ts
export async function loadPublishedArtifacts(locale: Locale = DEFAULT_LOCALE): Promise<PublishedArtifact[]> {
  const mode = getStorageMode();
  if (mode === 'files') return [];

  const result = await query<{ metadata: PublishedArtifact }>(
    `
      SELECT metadata
      FROM fpvlovers_app.published_articles_shadow
      WHERE locale = $1
      ORDER BY published_at DESC NULLS LAST, updated_at DESC NULLS LAST
    `,
    [locale],
  );

  return result.rows
    .map((row) => row.metadata)
    .filter((artifact): artifact is PublishedArtifact => (
      artifact !== null
      && typeof artifact === 'object'
      && typeof artifact.slug === 'string'
    ));
}

export async function getPublishedArtifact(
  slug: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<PublishedArtifact | null> {
  const mode = getStorageMode();
  if (mode === 'files') return null;

  const result = await query<{ metadata: PublishedArtifact }>(
    `
      SELECT metadata
      FROM fpvlovers_app.published_articles_shadow
      WHERE slug = $1 AND locale = $2
      LIMIT 1
    `,
    [slug, locale],
  );

  return result.rows[0]?.metadata || null;
}
```

- [ ] **Step 4: Type-check and run the migration test again**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: no errors.

Run: `node --import tsx scripts/migration-runner-regression-test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add db/migrations/0010_published_content_locale.sql src/lib/server/published-content-store.ts
git commit -m "feat(db): key published content by slug and locale"
```

- [ ] **Step 6: Apply the migration in production (after R1 deploy)**

The migration runner executes on container start (`next start` runs `scripts/db-migrate.ts`). After the R1 deploy completes, verify in the Coolify postgres terminal:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'fpvlovers_app'
  AND table_name = 'published_articles_shadow'
  AND column_name = 'locale';
```

Expected: one row, `locale`. If the column is missing, run `pnpm db:migrate` locally against the production database is **not** allowed; instead report to the owner and run the SQL from Step 1 manually in the terminal after a backup.

---

### Task 7: Split the app into `(en)` and root layouts (Phase C0.5)

**Files:**
- Move: every route directory under `src/app/` except `api`, `sitemap.xml`, `llms.txt`, `robots.ts`, `globals.css`
- Create: `src/app/(en)/layout.tsx`, `src/features/layout/components/RootShell.tsx`, `src/lib/seo/root-metadata.ts`
- Delete: `src/app/layout.tsx` (moved)

**Interfaces:**
- Consumes: `Locale`.
- Produces:
  - `<RootShell lang={Locale}>{children}</RootShell>` — owns `<html>`, `<body>`, JSON-LD, providers, analytics, Navbar, footer, cookie banner
  - `buildRootMetadata(locale: Locale): Metadata`
  - `SITE_JSON_LD: string`

- [ ] **Step 1: Capture the current URL set as the baseline**

Run:

```bash
find src/app -name "page.tsx" | sed -e 's|^src/app||' -e 's|/page.tsx$||' -e 's|\[[^]]*\]|:param|g' | sort > /tmp/urls-before.txt
cat /tmp/urls-before.txt | wc -l
```

Expected: a non-empty list of route paths. Keep `/tmp/urls-before.txt` for Step 7.

- [ ] **Step 2: Move the routes**

```bash
mkdir -p "src/app/(en)"
for dir in about academy admin advertise archive article auth buyers-guides comparisons components contact disclosure editorial-policy engineering guides privacy racing regulations reviews search terms tools topics; do
  git mv "src/app/$dir" "src/app/(en)/$dir"
done
git mv src/app/page.tsx "src/app/(en)/page.tsx"
git mv src/app/layout.tsx "src/app/(en)/layout.tsx"
```

Anything not listed (`api`, `sitemap.xml`, `llms.txt`, `robots.ts`, `globals.css`) stays at `src/app/`.

- [ ] **Step 3: Extract the shared metadata**

Create `src/lib/seo/root-metadata.ts` with the current English metadata block from `src/app/(en)/layout.tsx` (title, description, keywords, icons, openGraph, twitter) moved into `buildRootMetadata('en')`, plus the existing `siteJsonLd` object exported as `SITE_JSON_LD` (the `JSON.stringify(...).replace(/</g, '\\u003c')` result):

```ts
import type { Metadata } from 'next';
import type { Locale } from '@/lib/i18n/locale';
import { buildCoverImageUrl } from '@/lib/content-automation/content-media';

const SITE_URL = process.env.APP_URL || 'https://fpvlovers.com.tr';
const DEFAULT_SITE_COVER = buildCoverImageUrl('site-default');

const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'FPVLovers',
      url: SITE_URL,
      logo: `${SITE_URL}/logo-type.png`,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'FPVLovers',
      url: SITE_URL,
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export const SITE_JSON_LD = JSON.stringify(siteJsonLd).replace(/</g, '\\u003c');

export function buildRootMetadata(locale: Locale = 'en'): Metadata {
  const base = new URL(SITE_URL);
  const common = {
    metadataBase: base,
    icons: { icon: '/logo-type.png', shortcut: '/logo-type.png' },
  } as const;

  if (locale === 'tr') {
    return {
      ...common,
      title: 'FPVLovers | FPV Öğren, Topla, Uç',
      description: 'FPV rehberleri, ekipman seçimi, kurallar ve pratik araçlar. Sıfırdan başlayanlar için sade Türkçe anlatım.',
      keywords: ['FPV', 'Türkçe', 'Başlangıç', 'Drone', 'Simülatör', 'SHGM', 'Rehber'],
      alternates: { canonical: '/tr' },
      openGraph: {
        type: 'website',
        siteName: 'FPVLovers',
        title: 'FPVLovers | FPV Öğren, Topla, Uç',
        description: 'Sıfırdan başlayanlar için Türkçe FPV rehberleri.',
        images: [{ url: DEFAULT_SITE_COVER, width: 1200, height: 675, alt: 'FPVLovers FPV rehberleri' }],
        locale: 'tr_TR',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'FPVLovers | FPV Öğren, Topla, Uç',
        description: 'Sıfırdan başlayanlar için Türkçe FPV rehberleri.',
        images: [DEFAULT_SITE_COVER],
      },
    };
  }

  return {
    ...common,
    title: 'FPV LOVERS | Learn, Build, Race, Fly, Tools, News',
    description: 'English-first FPV guides, engineering references, and practical pilot tools for building, tuning, and learning faster.',
    keywords: ['FPV', 'Learn', 'Build', 'Race', 'Fly', 'Tools', 'News', 'Build Guides', 'Troubleshooting'],
    openGraph: {
      type: 'website',
      siteName: 'FPVLovers',
      title: 'FPVLovers | Learn, Build, Race, Fly',
      description: 'English-first FPV guides, engineering references, and practical pilot tools.',
      images: [{ url: DEFAULT_SITE_COVER, width: 1200, height: 675, alt: 'FPVLovers FPV editorial guides' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'FPVLovers | Learn, Build, Race, Fly',
      description: 'English-first FPV guides, engineering references, and practical pilot tools.',
      images: [DEFAULT_SITE_COVER],
    },
  };
}
```

- [ ] **Step 4: Extract the shared shell**

Create `src/features/layout/components/RootShell.tsx` by moving the `return` body of the old `RootLayout` into it, parameterized by `lang`:

```tsx
import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { GoogleAnalytics } from '@next/third-parties/google';
import { SessionProvider } from 'next-auth/react';
import type { Locale } from '@/lib/i18n/locale';
import { SITE_JSON_LD } from '@/lib/seo/root-metadata';
import { Navbar } from './Navbar';
import { SiteFooter } from './SiteFooter';
import { MobileUtilityBar } from './MobileUtilityBar';
import { CookieBanner } from './CookieBanner';

export function RootShell({ lang, children }: { lang: Locale; children: ReactNode }) {
  const enableVercelAnalytics = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS === 'true';

  return (
    <html lang={lang} className="dark">
      <body className="font-sans min-h-screen antialiased selection:bg-[#ff5a1f]/30 selection:text-white relative" suppressHydrationWarning>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: SITE_JSON_LD }} />
        <SessionProvider>
          {/* Subtle global atmosphere. Tool pages can opt into heavier cockpit UI locally. */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute inset-0 carbon-grid opacity-35" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff5a1f]/45 to-transparent" />
          </div>

          <Navbar locale={lang} />
          <main className="relative z-10 pb-16 lg:pb-0">{children}</main>
          <MobileUtilityBar locale={lang} />
          <CookieBanner />
          <SiteFooter locale={lang} />
          {enableVercelAnalytics && <Analytics />}
          {process.env.NEXT_PUBLIC_GA_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          )}
        </SessionProvider>
      </body>
    </html>
  );
}
```

The `locale` props on `Navbar`, `MobileUtilityBar` and `SiteFooter` are introduced in Task 8. For this task, add them as optional props with default `'en'` so the build stays green (see Task 8, Step 1).

- [ ] **Step 5: Rewrite the English root layout**

Replace `src/app/(en)/layout.tsx` with:

```tsx
import type { Metadata } from 'next';
import '../../globals.css';
import { RootShell } from '@/features/layout/components/RootShell';
import { buildRootMetadata } from '@/lib/seo/root-metadata';

export const metadata: Metadata = buildRootMetadata('en');

export default function EnglishRootLayout({ children }: { children: React.ReactNode }) {
  return <RootShell lang="en">{children}</RootShell>;
}
```

Import `globals.css` from `src/app/globals.css` (one level up, hence `../../globals.css`).

- [ ] **Step 6: Build and verify the route set is unchanged**

Run: `pnpm build`
Expected: build succeeds; the route table prints the same paths as before (route groups do not appear).

Run:

```bash
find "src/app/(en)" -name "page.tsx" | sed -e 's|^src/app/(en)||' -e 's|/page.tsx$||' -e 's|\[[^]]*\]|:param|g' | sort > /tmp/urls-after.txt
diff /tmp/urls-before.txt /tmp/urls-after.txt
```

Expected: no diff (empty output).

- [ ] **Step 7: Commit and deploy R2**

```bash
git add -A "src/app" src/features/layout/components/RootShell.tsx src/lib/seo/root-metadata.ts
git commit -m "refactor(app): split root layouts for a second locale"
```

After the Coolify deploy finishes, verify on production: `/` returns 200 in under 2s, `/academy` 200, an `/article/<slug>` 200, `/sitemap.xml` still lists 196 URLs, `/api/ready` reports `ready`. Report all four results in the task summary.

---

### Task 8: Turkish copy catalog and locale-aware chrome

**Files:**
- Create: `src/lib/i18n/labels.ts`
- Modify: `src/lib/navigationData.ts`, `src/features/layout/components/Navbar.tsx`, `src/features/layout/components/SiteFooter.tsx`, `src/features/layout/components/MobileUtilityBar.tsx`
- Create: `src/features/layout/components/LanguageSwitch.tsx`
- Test: `scripts/locale-regression-test.ts` (append)

**Interfaces:**
- Consumes: `navigationData` (English source of truth), `Locale`, `localizePath`.
- Produces:
  - `NAV_COPY_TR: { groups: Record<string, NavCopyEntry>; items: Record<string, NavCopyEntry> }`
  - `CHROME_COPY: Record<Locale, ChromeCopy>` with keys `home`, `search`, `openMenu`, `closeMenu`, `account`, `language`
  - `FOOTER_COPY_TR: Record<string, string>` (href → label)
  - `getNavigation(locale?: Locale): typeof navigationData`
  - `getChromeCopy(locale: Locale): ChromeCopy`
  - `getFooterCopy(locale: Locale): Record<string, string>`
  - `<LanguageSwitch locale={Locale} />`

- [ ] **Step 1: Write the failing test**

Append to `scripts/locale-regression-test.ts`:

```ts
import { navigationData } from '../src/lib/navigationData';
import {
  CHROME_COPY,
  FOOTER_COPY_TR,
  NAV_COPY_TR,
  getChromeCopy,
  getFooterCopy,
  getNavigation,
} from '../src/lib/i18n/labels';

check('every navigation group has Turkish copy', () => {
  for (const group of navigationData) {
    const copy = NAV_COPY_TR.groups[group.href];
    assert.ok(copy?.title, `missing tr title for group ${group.href}`);
    assert.ok(copy?.label, `missing tr label for group ${group.href}`);
    assert.ok(group.items.length > 0);
  }
});

check('every navigation item has Turkish copy', () => {
  for (const group of navigationData) {
    for (const item of group.items) {
      const copy = NAV_COPY_TR.items[`${group.href}|${item.href}`];
      assert.ok(copy?.title, `missing tr title for item ${group.href} -> ${item.href}`);
      assert.ok(copy?.description, `missing tr description for item ${group.href} -> ${item.href}`);
    }
  }
});

check('Turkish navigation keeps English structure and hrefs', () => {
  const tr = getNavigation('tr');
  assert.equal(tr.length, navigationData.length);
  tr.forEach((group, index) => {
    assert.deepEqual(group.items.map((item) => item.href), navigationData[index].items.map((item) => item.href));
  });
  assert.equal(getNavigation('en'), navigationData);
});

check('Turkish navigation is actually Turkish', () => {
  const tr = getNavigation('tr');
  const titles = tr.map((group) => group.title).join(' ');
  assert.notEqual(titles, getNavigation('en').map((group) => group.title).join(' '));
  assert.equal(tr[0].title, 'Buradan Başla');
});

check('chrome copy exists for both locales', () => {
  assert.equal(getChromeCopy('en').search, 'Search FPVLovers');
  assert.equal(getChromeCopy('tr').search, 'FPVLovers içinde ara');
  assert.ok(CHROME_COPY.tr.openMenu);
});

check('footer copy covers the Turkish legal links', () => {
  const tr = getFooterCopy('tr');
  assert.equal(tr['/privacy'], 'Gizlilik Politikası');
  assert.equal(tr['/terms'], 'Kullanım Koşulları');
  assert.ok(Object.keys(FOOTER_COPY_TR).length >= 8);
});

check('footer copy falls back to English for untranslated hrefs', () => {
  assert.equal(getFooterCopy('en')['/privacy'], undefined);
  assert.equal(getFooterCopy('tr')['/unknown-page'], undefined);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --import tsx scripts/locale-regression-test.ts`
Expected: FAIL with `Cannot find module '../src/lib/i18n/labels'`.

- [ ] **Step 3: Write the Turkish copy catalog**

Create `src/lib/i18n/labels.ts`:

```ts
import { navigationData } from '@/lib/navigationData';
import { DEFAULT_LOCALE, type Locale } from './locale';

export type NavCopyEntry = { title?: string; label?: string; description?: string };

/**
 * Turkish copy is an override map, not a second navigation tree: English stays
 * the single source of structure and hrefs, so the two languages cannot drift.
 * Group keys are the group href; item keys are `${groupHref}|${itemHref}`
 * because /academy is both a group and an item.
 */
export const NAV_COPY_TR: {
  groups: Record<string, NavCopyEntry>;
  items: Record<string, NavCopyEntry>;
} = {
  groups: {
    '/academy': { title: 'Buradan Başla', label: 'FPV\'ye yeni misin? Buradan başla' },
    '/buyers-guides': { title: 'Ekipman', label: 'Ne satın almalıyım?' },
    '/guides': { title: 'Rehberler', label: 'Öğren, onar, geliştir' },
    '/tools': { title: 'Araçlar', label: 'Hesaplayıcılar ve analiz araçları' },
    '/racing': { title: 'Yarış ve Haberler', label: 'Etkinlikler, sonuçlar ve gelişmeler' },
  },
  items: {
    '/academy|/academy': {
      title: 'İlk Uçuşa Altı Adım',
      description: 'Sıfırdan ilk gerçek uçuşa kadar sıralı yol haritası.',
    },
    '/academy|/academy/simulators': {
      title: 'Simülatör Eğitimi',
      description: 'Drone almadan önce çubuk kontrolünü güvenle öğren.',
    },
    '/academy|/regulations': {
      title: 'Kurallar ve Güvenlik',
      description: 'Nerede uçabilirsin, kayıt işlemleri ve batarya güvenliği.',
    },
    '/academy|/academy/glossary': {
      title: 'FPV Sözlüğü',
      description: 'Karşılaşacağın her kısaltmanın sade Türkçe karşılığı.',
    },
    '/academy|/academy/roadmap': {
      title: 'İlerleme Takibi',
      description: 'İsteğe bağlı: çalıştığın becerileri takip et.',
    },
    '/buyers-guides|/academy/starter-kits': {
      title: 'Başlangıç Setleri',
      description: 'Kutudan çıkar çıkmaz uçmaya hazır paketler.',
    },
    '/buyers-guides|/buyers-guides': {
      title: 'Satın Alma Rehberleri',
      description: 'Bütçene göre doğru ekipmanı seç.',
    },
    '/buyers-guides|/reviews': {
      title: 'İncelemeler',
      description: 'Gerçek kullanım deneyimine dayanan ürün incelemeleri.',
    },
    '/buyers-guides|/comparisons': {
      title: 'Karşılaştırmalar',
      description: 'İki model arasında kaldıysan yan yana bak.',
    },
    '/buyers-guides|/archive': {
      title: 'Drone Türleri',
      description: 'Tiny whoop, cinewhoop, 5 inç ve daha fazlası.',
    },
    '/guides|/guides?level=beginner': {
      title: 'Başlangıç Rehberleri',
      description: 'Hiç uçmamış biri için yazılmış rehberler.',
    },
    '/guides|/guides?topic=flying': {
      title: 'Uçuş Teknikleri',
      description: 'Kalkış, hover, dönüş ve iniş pratikleri.',
    },
    '/guides|/guides?topic=building': {
      title: 'Toplama ve Parçalar',
      description: 'Motor, ESC, uçuş kontrolcüsü, VTX ve gövde seçimi.',
    },
    '/guides|/guides?topic=troubleshooting': {
      title: 'Sorun Giderme',
      description: 'Görüntü yok, arm olmuyor, failsafe ve diğer sorunlar.',
    },
    '/guides|/engineering': {
      title: 'Mühendislik Detayları',
      description: 'Daha derine inmek isteyenler için teknik referanslar.',
    },
    '/tools|/tools/calculator': {
      title: 'Yapım Hesaplayıcısı',
      description: 'Ağırlık, itiş ve uçuş süresi tahmini.',
    },
    '/tools|/tools/part-matcher': {
      title: 'Parça Eşleştirici',
      description: 'Parçaların birbiriyle uyumlu olup olmadığını kontrol et.',
    },
    '/tools|/tools/component-duel': {
      title: 'Bileşen Düellosu',
      description: 'İki komponenti özelliklerine göre karşılaştır.',
    },
    '/tools|/tools/blackbox-tuning': {
      title: 'Blackbox Ayarı',
      description: 'Log verisinden titreşim ve PID ipuçları.',
    },
    '/tools|/tools/flight-critic': {
      title: 'Uçuş Eleştirmeni',
      description: 'Uçuşunu değerlendir, neyi geliştireceğini gör.',
    },
    '/racing|/racing/calendar': {
      title: 'Yarış Takvimi',
      description: 'Yaklaşan yarışlar ve tarihleri.',
    },
    '/racing|/racing/news': {
      title: 'Yarış Haberleri',
      description: 'Yarış dünyasından son gelişmeler.',
    },
    '/racing|/racing/rankings': {
      title: 'Sonuçlar ve Sıralamalar',
      description: 'Yarış sonuçları ve pilot sıralamaları.',
    },
  },
};

export type ChromeCopy = {
  home: string;
  search: string;
  openMenu: string;
  closeMenu: string;
  account: string;
  language: string;
};

export const CHROME_COPY: Record<Locale, ChromeCopy> = {
  en: {
    home: 'FPVLovers home',
    search: 'Search FPVLovers',
    openMenu: 'Open navigation',
    closeMenu: 'Close navigation',
    account: 'Account',
    language: 'Language',
  },
  tr: {
    home: 'FPVLovers ana sayfa',
    search: 'FPVLovers içinde ara',
    openMenu: 'Menüyü aç',
    closeMenu: 'Menüyü kapat',
    account: 'Hesap',
    language: 'Dil',
  },
};

export const FOOTER_COPY_TR: Record<string, string> = {
  '/privacy': 'Gizlilik Politikası',
  '/terms': 'Kullanım Koşulları',
  '/disclosure': 'Ortaklık Açıklaması',
  '/editorial-policy': 'Yayın İlkeleri',
  '/regulations': 'Kurallar',
  '/academy/glossary': 'Sözlük',
  '/advertise': 'Reklam',
  '/contact': 'İletişim',
  '/sitemap.xml': 'Site Haritası',
};

export function getNavigation(locale: Locale = DEFAULT_LOCALE): typeof navigationData {
  if (locale === DEFAULT_LOCALE) return navigationData;

  return navigationData.map((group) => {
    const groupCopy = NAV_COPY_TR.groups[group.href] ?? {};
    return {
      ...group,
      title: groupCopy.title ?? group.title,
      label: groupCopy.label ?? group.label,
      items: group.items.map((item) => {
        const itemCopy = NAV_COPY_TR.items[`${group.href}|${item.href}`] ?? {};
        return {
          ...item,
          title: itemCopy.title ?? item.title,
          description: itemCopy.description ?? item.description,
        };
      }),
    };
  });
}

export function getChromeCopy(locale: Locale): ChromeCopy {
  return CHROME_COPY[locale];
}

export function getFooterCopy(locale: Locale): Record<string, string> {
  return locale === 'tr' ? FOOTER_COPY_TR : {};
}
```

- [ ] **Step 4: Run the test to verify the catalog is complete**

Run: `node --import tsx scripts/locale-regression-test.ts`
Expected: PASS, 29 checks. If a check fails, add the missing Turkish string rather than weakening the test.

- [ ] **Step 5: Make the chrome locale-aware**

In `src/features/layout/components/Navbar.tsx`:

- Replace `import { navigationData } from '@/lib/navigationData';` with `import { getNavigation, getChromeCopy } from '@/lib/i18n/labels'; import { DEFAULT_LOCALE, localizePath, type Locale } from '@/lib/i18n/locale';`
- Change the signature to `export function Navbar({ locale = DEFAULT_LOCALE }: { locale?: Locale })` and the top-level data to `const copy = getChromeCopy(locale); const navLinks = getNavigation(locale).map((item) => ({ title: item.title, label: item.label, href: localizePath(item.href, locale), items: item.items.map((sub) => ({ ...sub, href: localizePath(sub.href, locale) })), icon: item.icon }));`
- Replace the hardcoded `aria-label="FPVLovers home"` with `aria-label={copy.home}`, `aria-label="Search FPVLovers"` with `aria-label={copy.search}`, and the mobile menu `aria-label` pair with `copy.closeMenu` / `copy.openMenu`.
- Render `<LanguageSwitch locale={locale} />` next to the search button in the desktop bar.

Do not change the dropdown markup or classnames; only data sources and aria labels.

In `src/features/layout/components/SiteFooter.tsx`:

- Import `getFooterCopy`, `getNavigation`, `localizePath`, `type Locale`, `DEFAULT_LOCALE`.
- Change the signature to `export function SiteFooter({ locale = DEFAULT_LOCALE }: { locale?: Locale })`.
- Replace `const footerGroups = navigationData …` with `getNavigation(locale)` and localize every href with `localizePath(href, locale)`.
- For the static link arrays, wrap each render with `getFooterCopy(locale)[href] ?? label` and localize the href.

In `src/features/layout/components/MobileUtilityBar.tsx`:

- Change the signature to `export function MobileUtilityBar({ locale = DEFAULT_LOCALE }: { locale?: Locale })`.
- Build the utilities with locale-specific names and `localizePath`:

```tsx
  const utilities = (locale === 'tr'
    ? [
        { name: 'Ana Sayfa', path: '/', icon: Home },
        { name: 'Başla', path: '/academy', icon: Rocket },
        { name: 'Ekipman', path: '/buyers-guides', icon: ShoppingBag },
        { name: 'Ara', path: '/search', icon: Search },
        { name: 'Araçlar', path: '/tools', icon: Cpu },
      ]
    : [
        { name: 'Home', path: '/', icon: Home },
        { name: 'Start', path: '/academy', icon: Rocket },
        { name: 'Gear', path: '/buyers-guides', icon: ShoppingBag },
        { name: 'Search', path: '/search', icon: Search },
        { name: 'Tools', path: '/tools', icon: Cpu },
      ]).map((item) => ({ ...item, href: localizePath(item.path, locale) }));
```

Keep the active-state comparison working for both trees by comparing `pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))`.

- [ ] **Step 6: Add the language switch**

Create `src/features/layout/components/LanguageSwitch.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Languages } from 'lucide-react';
import { DEFAULT_LOCALE, isTranslatedPath, localizePath, splitLocalePath, type Locale } from '@/lib/i18n/locale';

export function LanguageSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname() || '/';
  const { path } = splitLocalePath(pathname);
  if (!isTranslatedPath(path)) return null;

  const target: Locale = locale === 'tr' ? DEFAULT_LOCALE : 'tr';
  const label = target === 'tr' ? 'Türkçe' : 'English';

  return (
    <Link
      href={localizePath(path, target)}
      hrefLang={target}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400 transition-colors hover:border-white/25 hover:text-white"
      aria-label={target === 'tr' ? 'Türkçe sürüme geç' : 'Switch to English'}
    >
      <Languages className="h-3.5 w-3.5" strokeWidth={1.8} />
      {label}
    </Link>
  );
}
```

- [ ] **Step 7: Verify types, lint and the English site**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: no errors.

Run: `./node_modules/.bin/eslint src --ext .ts,.tsx`
Expected: no errors.

Run: `pnpm build`
Expected: success; the route list is unchanged.

- [ ] **Step 8: Commit**

```bash
git add src/lib/i18n/labels.ts src/lib/navigationData.ts src/features/layout/components scripts/locale-regression-test.ts
git commit -m "feat(i18n): add Turkish navigation copy and locale-aware chrome"
```

---

### Task 9: Turkish root layout and landing page

**Files:**
- Create: `src/app/tr/layout.tsx`, `src/app/tr/page.tsx`
- Modify: `src/features/layout/components/RootShell.tsx` (no change expected; verify locale flows through)

**Interfaces:**
- Consumes: `RootShell`, `buildRootMetadata('tr')`, `localizePath`.
- Produces: routes `/tr` rendering `<html lang="tr">`.

- [ ] **Step 1: Add the Turkish root layout**

Create `src/app/tr/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import '../globals.css';
import { RootShell } from '@/features/layout/components/RootShell';
import { buildRootMetadata } from '@/lib/seo/root-metadata';

export const metadata: Metadata = buildRootMetadata('tr');

export default function TurkishRootLayout({ children }: { children: React.ReactNode }) {
  return <RootShell lang="tr">{children}</RootShell>;
}
```

- [ ] **Step 2: Add the Turkish landing page**

Create `src/app/tr/page.tsx` using the existing subpage components (same components as `/academy`):

```tsx
import { BookOpen, Compass, ShieldAlert, Wrench } from 'lucide-react';
import { SubpageFeatureCard, SubpageHero, SubpageSectionHeader, SubpageShell } from '@/components/subpage/SubpageChrome';
import { HUB_COVER_IMAGES } from '@/lib/content-automation/hub-media';
import { generateSeoMetadata } from '@/lib/seo/metadata';

export const metadata = generateSeoMetadata({
  title: 'FPV\'ye Yeni Misin? Altı Adımda Başla | FPVLovers',
  description: 'FPV\'yi sıfırdan öğren: simülatör, kumanda seçimi, ilk drone, kurallar ve ilk uçuş. Hesap gerekmez.',
  path: '/',
  locale: 'tr',
  type: 'website',
});

export default function TurkishHomePage() {
  return (
    <SubpageShell>
      <SubpageHero
        label="Yeni Başlayanlar İçin"
        title="İlk uçuşuna"
        accent="altı adımda başla."
        description="FPV'yi sıfırdan öğren: simülatör, kumanda, ilk drone, kurallar ve ilk uçuş. Her adım neden önemli olduğunu ve hangi rehberi okuman gerektiğini anlatır. Hesap gerekmez."
        image={HUB_COVER_IMAGES.academy}
        imageAlt="FPV gözlüğü ve kumanda ile yeni başlayan pilot"
        stats={[
          { label: 'Adım', value: '6, sırayla' },
          { label: 'Hesap', value: 'Gerekmez' },
          { label: 'Lehim', value: 'Gerekmez' },
          { label: 'Başlangıç', value: 'Simülatör' },
        ]}
        actions={[
          { label: '1. adıma git', href: '/tr/academy#step-1' },
          { label: 'Başlangıç rehberleri', href: '/tr/guides?level=beginner' },
        ]}
      />

      <section className="mt-12">
        <SubpageSectionHeader label="Nereden başlamalıyım?" title="Yolculuğun" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SubpageFeatureCard
            title="Altı adımlık yol"
            description="FPV nedir sorusundan ilk gerçek uçuşa kadar sıralı rehber."
            href="/tr/academy"
            icon={Compass}
            meta="Başla"
            accent="cyan"
          />
          <SubpageFeatureCard
            title="Ekipman seçimi"
            description="Simülatör, kumanda, gözlük ve ilk drone: bütçene göre doğru seçim."
            href="/buyers-guides"
            icon={Wrench}
            meta="Ekipman"
            accent="amber"
          />
          <SubpageFeatureCard
            title="Kurallar ve güvenlik"
            description="Türkiye'de nerede uçabilirsin, kayıt işlemleri ve LiPo güvenliği."
            href="/regulations"
            icon={ShieldAlert}
            meta="Güvenlik"
            accent="green"
          />
          <SubpageFeatureCard
            title="Rehberler"
            description="Seviyene ve konuya göre filtrelenmiş rehber kütüphanesi."
            href="/tr/guides"
            icon={BookOpen}
            meta="Okuma"
            accent="cyan"
          />
        </div>
      </section>
    </SubpageShell>
  );
}
```

Note: `/buyers-guides` and `/regulations` are not translated yet, so they intentionally link to the English pages (that is exactly what `localizePath` would do). Keep those hrefs unprefixed.

- [ ] **Step 3: Add the `locale` parameter to `generateSeoMetadata`**

This is required for the page above to type-check. In `src/lib/seo/metadata.ts`, extend the options and canonical computation:

```ts
import { DEFAULT_LOCALE, isTranslatedPath, localizePath, type Locale } from '@/lib/i18n/locale';

export function generateSeoMetadata({
  title,
  description,
  path,
  ogImage,
  type = 'article',
  publishedAt,
  locale = DEFAULT_LOCALE,
}: {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  type?: 'article' | 'website' | 'product';
  publishedAt?: string;
  locale?: Locale;
}): Metadata {
  const canonicalPath = localizePath(path, locale);
  const url = `${BASE}${canonicalPath}`;
  const languages = isTranslatedPath(path)
    ? {
        en: `${BASE}${path}`,
        tr: `${BASE}${localizePath(path, 'tr')}`,
        'x-default': `${BASE}${path}`,
      }
    : undefined;

  return {
    title,
    description,
    alternates: languages ? { canonical: url, languages } : { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: type === 'product' ? 'website' : type,
      images: [{ url: ogImage || DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
      ...(publishedAt && { publishedTime: publishedAt }),
      siteName: 'FPV Lovers',
      locale: locale === 'tr' ? 'tr_TR' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage || DEFAULT_OG_IMAGE],
    },
    robots: { index: true, follow: true },
  };
}
```

- [ ] **Step 4: Build and verify the Turkish document language**

Run: `pnpm build`
Expected: success, `/tr` appears in the route table.

Run: `pnpm dev` in one terminal and:

```bash
curl -s http://localhost:3000/tr | grep -o '<html lang="[a-z]*"' | head -1
curl -s http://localhost:3000/ | grep -o '<html lang="[a-z]*"' | head -1
```

Expected: `<html lang="tr"` for `/tr` and `<html lang="en"` for `/`.

- [ ] **Step 5: Commit**

```bash
git add src/app/tr src/lib/seo/metadata.ts
git commit -m "feat(i18n): add Turkish root layout and landing page"
```

---

### Task 10: Turkish academy and guides shells

**Files:**
- Create: `src/lib/i18n/start-steps.ts`, `src/features/academy/components/StartHereView.tsx`, `src/features/guides/components/GuidesHub.tsx`, `src/app/tr/academy/page.tsx`, `src/app/tr/guides/page.tsx`
- Modify: `src/app/(en)/academy/page.tsx`, `src/app/(en)/guides/page.tsx`, `src/lib/content-taxonomy.ts`

**Interfaces:**
- Consumes: `listPublishedContentAsync(locale)`, `getGuideGroup`, `toReaderLevel`, `localizePath`.
- Produces:
  - `START_STEPS: Record<Locale, StartStep[]>` and `type StartStep`
  - `<StartHereView locale={Locale} />`
  - `<GuidesHub locale={Locale} level={string|undefined} topic={string|undefined} />`
  - `getGuideGroupLabel(group, locale): string`, `getReaderLevelLabel(level, locale): string`

- [ ] **Step 1: Move the six steps into locale data**

Create `src/lib/i18n/start-steps.ts`. The `StartStep` type is the existing one from `src/app/(en)/academy/page.tsx` (lines 23–31). For `START_STEPS.en`, copy the existing `steps` array (lines 33–98 of that file) verbatim — no wording changes, so the English page renders identically. Then add the Turkish list:

```ts
import type { Locale } from './locale';

export type StartStep = {
  title: string;
  why: string;
  todo: string[];
  /** Candidate article slugs in priority order; missing slugs are skipped. */
  articleSlugs: string[];
  maxArticles?: number;
  page?: { label: string; href: string };
};

export const START_STEPS: Record<Locale, StartStep[]> = {
  en: [
    // copy the existing English array (src/app/(en)/academy/page.tsx, lines 33-98) here, unchanged
  ],
  tr: [
    {
      title: 'FPV nedir, anla',
      why: 'FPV (birinci şahıs görüntü), drone kamerasından gelen canlı görüntüyü gözlükle görerek uçmak demektir. FPV uçuşunun büyük kısmı tamamen manueldir; bu yüzden satın almadan önce pratik gelir.',
      todo: ['Bir genel bakış rehberini baştan sona oku', 'Bilmediğin terimler için sözlüğü işaretle'],
      articleSlugs: [],
      page: { label: 'FPV sözlüğü', href: '/academy/glossary' },
    },
    {
      title: 'Simülatörde pratik yap',
      why: 'Simülatörde çarpmak bedava. Çubuk kontrolünü burada kurmak, ileride kırılan parça ve hayal kırıklığından tasarruf ettirir.',
      todo: ['Bir simülatör seç', 'Hover ve yumuşak dönüşleri doğal hissedene kadar tekrarla'],
      articleSlugs: [],
      page: { label: 'Simülatör eğitimi', href: '/academy/simulators' },
    },
    {
      title: 'Kumandanı al',
      why: 'Kumanda şimdi simülatörle, sonra drone ile çalışır. Genellikle en uzun süre elinde tuttuğun ekipmandır.',
      todo: ['El ölçüne ve bütçene uyan bir kumanda seç', 'Kur ve simülatörde kullan'],
      articleSlugs: [],
      maxArticles: 3,
    },
    {
      title: 'İlk drone ve gözlüğünü seç',
      why: 'Uçmaya hazır bir set veya tiny whoop ile başla. Havalanmak için lehim ya da drone toplamak gerekmez.',
      todo: ['Bütçeye göre hazır setleri karşılaştır', 'Analog ve dijital görüntü arasında karar ver'],
      articleSlugs: [],
      page: { label: 'Başlangıç setleri', href: '/academy/starter-kits' },
    },
    {
      title: 'Kuralları ve batarya güvenliğini öğren',
      why: 'Drone kuralları ülkeye göre değişir. Dışarıda uçmadan önce bulunduğun ülkenin havacılık kurumunu kontrol et ve LiPo bataryaları güvenli şarj etmeyi öğren.',
      todo: ['Yaşadığın yerdeki drone kurallarını kontrol et', 'Güvenli LiPo şarj ve saklama öğren'],
      articleSlugs: [],
      maxArticles: 2,
      page: { label: 'Kurallar ve güvenlik', href: '/regulations' },
    },
    {
      title: 'İlk uçuşunu yap',
      why: 'Açık ve boş bir alan seç, hızlı bir uçuş öncesi kontrol yap ve kısa, yumuşak hoverlarla başla.',
      todo: ['Birkaç kısa ve alçak hover yap', 'Bir şey çalışmazsa neyi kontrol edeceğini bil'],
      articleSlugs: [],
      maxArticles: 3,
    },
  ],
};
```

`articleSlugs` is intentionally empty for Turkish: the six steps ship as a shell, and Turkish article slugs are added when the content lands (C2). The view must therefore render the step even with zero articles.

- [ ] **Step 2: Extract the academy view**

Create `src/features/academy/components/StartHereView.tsx` from the JSX body of `src/app/(en)/academy/page.tsx`, with:

- `export async function StartHereView({ locale }: { locale: Locale })`
- `const steps = START_STEPS[locale]`
- `const content = await listPublishedContentAsync(locale)`
- article links: `href={localizePath(`/article/${article.slug}`, locale)}`
- step `page.href`: `localizePath(step.page.href, locale)`
- hero copy from a small inline map:

```tsx
const heroCopy = locale === 'tr'
  ? {
      label: 'Buradan Başla',
      title: 'İlk FPV uçuşun,',
      accent: 'altı adımda.',
      description: 'Adımları sırayla takip et. Her adım neden önemli olduğunu ve hangi rehberi okuman gerektiğini anlatır. Hesap gerekmez.',
      stats: [
        { label: 'Adım', value: '6, sırayla' },
        { label: 'Hesap', value: 'Gerekmez' },
        { label: 'Lehim', value: 'Gerekmez' },
        { label: 'Başlangıç', value: 'Simülatör' },
      ],
      actions: [
        { label: '1. adıma git', href: '#step-1' },
        { label: 'Başlangıç rehberleri', href: '/tr/guides?level=beginner' },
      ],
      sectionLabel: 'Sıfırdan ilk uçuşa',
      sectionTitle: 'Altı adım',
      readLabel: 'Oku',
      afterLabel: 'İlk uçuştan sonra',
      afterTitle: 'Devam et',
    }
  : { /* move the existing English copy here unchanged */ };
```

- When `articles.length === 0`, render one line instead of the list:

```tsx
{articles.length === 0 && (
  <p className="rounded-lg border border-dashed border-white/10 px-4 py-3 text-xs text-zinc-500">
    {locale === 'tr' ? 'Bu adımın Türkçe rehberleri hazırlanıyor.' : 'Guides for this step are being prepared.'}
  </p>
)}
```

- Keep the 3 "keep going" cards, localized for `tr`:

```tsx
const afterCards = locale === 'tr'
  ? [
      { title: 'Başlangıç rehberleri', description: 'Kurulum, pratik alıştırmalar ve ilk aylarda karşılaşılan sorunlar.', href: '/tr/guides?level=beginner', meta: 'Sıradaki okuma', accent: 'green' as const },
      { title: 'İlerlemeni takip et', description: 'İsteğe bağlı: çalıştığın becerileri kaydet ve sırada ne olduğunu gör.', href: '/academy/roadmap', meta: 'İsteğe bağlı', accent: 'cyan' as const },
      { title: 'Ekipmanını yükselt', description: 'Hazır olduğunda satın alma rehberleri, incelemeler ve karşılaştırmalar.', href: '/buyers-guides', meta: 'Ekipman', accent: 'amber' as const },
    ]
  : [ /* existing English cards */ ];
```

- [ ] **Step 3: Make both academy routes thin wrappers**

`src/app/(en)/academy/page.tsx`:

```tsx
import { StartHereView } from '@/features/academy/components/StartHereView';
import { generateSeoMetadata } from '@/lib/seo/metadata';

export const revalidate = 300;

export const metadata = generateSeoMetadata({
  title: 'Start Here: Your First FPV Flight in Six Steps | FPVLovers',
  description: 'New to FPV? Follow six steps in order: understand FPV, practice in a simulator, get a radio, choose your first drone, learn the rules, and make your first flight.',
  path: '/academy',
  type: 'website',
});

export default function StartHerePage() {
  return <StartHereView locale="en" />;
}
```

`src/app/tr/academy/page.tsx`:

```tsx
import { StartHereView } from '@/features/academy/components/StartHereView';
import { generateSeoMetadata } from '@/lib/seo/metadata';

export const revalidate = 300;

export const metadata = generateSeoMetadata({
  title: 'Buradan Başla: Altı Adımda İlk FPV Uçuşu | FPVLovers',
  description: 'FPV\'ye yeni misin? Altı adımı sırayla takip et: FPV nedir, simülatör pratiği, kumanda, ilk drone, kurallar ve ilk uçuş.',
  path: '/academy',
  locale: 'tr',
  type: 'website',
});

export default function TurkishStartHerePage() {
  return <StartHereView locale="tr" />;
}
```

- [ ] **Step 4: Build and verify the academy pages**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: no errors.

Run: `pnpm build`
Expected: success; `/academy` and `/tr/academy` both appear.

Run with `pnpm dev`:

```bash
curl -s http://localhost:3000/tr/academy | grep -c "Buradan Başla"
curl -s http://localhost:3000/academy | grep -c "Start Here"
```

Expected: `1` for each.

- [ ] **Step 5: Localize taxonomy labels**

In `src/lib/content-taxonomy.ts`, add locale-aware label accessors without changing the data mapping:

```ts
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locale';

const GROUP_LABELS_TR: Record<GuideGroupId, { label: string; description: string }> = {
  flying: { label: 'Uçuş Teknikleri', description: 'Kurulum, pratik planı ve uçuş tekniği.' },
  building: { label: 'Toplama ve Parçalar', description: 'Bileşenler, yapımlar, güç, radyo linki ve gövdeler.' },
  tuning: { label: 'Ayar ve Betaflight', description: 'PID ayarı, filtreler ve uçuş kontrolcüsü kurulumu.' },
  troubleshooting: { label: 'Sorun Giderme', description: 'Görüntü yok, arm olmuyor, failsafe ve diğer yaygın sorunlar.' },
  buying: { label: 'Satın Alma', description: 'Satın alma rehberleri, incelemeler ve karşılaştırmalar.' },
  'rules-safety': { label: 'Kurallar ve Güvenlik', description: 'Mevzuat, hava sahası ve güvenli uçuş.' },
  racing: { label: 'Yarış', description: 'Yarış formatları, etkinlikler ve müsabaka.' },
};

const LEVEL_LABELS_TR: Record<ReaderLevel, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
};

export function getGuideGroupLabel(group: GuideGroup, locale: Locale = DEFAULT_LOCALE): string {
  return locale === 'tr' ? GROUP_LABELS_TR[group.id].label : group.label;
}

export function getGuideGroupDescription(group: GuideGroup, locale: Locale = DEFAULT_LOCALE): string {
  return locale === 'tr' ? GROUP_LABELS_TR[group.id].description : group.description;
}

export function getReaderLevelLabel(level: ReaderLevel, locale: Locale = DEFAULT_LOCALE): string {
  return locale === 'tr' ? LEVEL_LABELS_TR[level] : (READER_LEVELS.find((item) => item.id === level)?.label ?? level);
}
```

Update the existing `getReaderLevelLabel(level)` signature usages to pass `locale` where the guides hub renders (Task 10, Step 6).

- [ ] **Step 6: Extract the guides hub**

Move the body of `src/app/(en)/guides/page.tsx` into `src/features/guides/components/GuidesHub.tsx`:

- `export async function GuidesHub({ locale, level, topic }: { locale: Locale; level?: string; topic?: string })`
- `const content = await listPublishedContentAsync(locale)`
- `buildHref` prefixes with `localizePath`, so filters stay inside `/tr/guides`
- article cards use `localizePath(`/article/${slug}`, locale)`
- group chips use `getGuideGroupLabel(group, locale)`, level chips use `getReaderLevelLabel(level.id, locale)`
- hero copy per locale, e.g. `tr`: label `Rehberler`, title `Her seviye için`, accent `FPV rehberleri.`, description `Seviyene ve konuya göre filtrele: uçuş, toplama, ayar, sorun giderme, satın alma, kurallar ve yarış.`
- empty state when `content.length === 0`: `Bu dilde yayınlanmış rehber henüz yok. İngilizce rehberlere göz atabilirsin.` with a link to `/guides`.

Then:

`src/app/(en)/guides/page.tsx` becomes:

```tsx
import { GuidesHub } from '@/features/guides/components/GuidesHub';
import { generateSeoMetadata } from '@/lib/seo/metadata';

export const revalidate = 300;

export const metadata = generateSeoMetadata({
  title: 'FPV Guides for Every Level | FPVLovers',
  description: 'Browse FPV guides by skill level and topic: flying skills, building, tuning, troubleshooting, buying advice, rules, and racing.',
  path: '/guides',
  type: 'website',
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function GuidesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <GuidesHub locale="en" level={firstParam(params.level)} topic={firstParam(params.topic)} />;
}
```

`src/app/tr/guides/page.tsx`:

```tsx
import { GuidesHub } from '@/features/guides/components/GuidesHub';
import { generateSeoMetadata } from '@/lib/seo/metadata';

export const revalidate = 300;

export const metadata = generateSeoMetadata({
  title: 'Her Seviye İçin FPV Rehberleri | FPVLovers',
  description: 'FPV rehberlerini seviyeye ve konuya göre filtrele: uçuş teknikleri, toplama, ayar, sorun giderme, satın alma, kurallar ve yarış.',
  path: '/guides',
  locale: 'tr',
  type: 'website',
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TurkishGuidesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <GuidesHub locale="tr" level={firstParam(params.level)} topic={firstParam(params.topic)} />;
}
```

- [ ] **Step 7: Verify with a browser at 360px**

Run `pnpm dev`, open `http://localhost:3000/tr`, `/tr/academy`, `/tr/guides` with browser automation at 360×800 and 1440×900.

Check and record:
- No horizontal scrollbar at 360px.
- Turkish navigation labels fit the mobile bar and dropdown.
- `UPPERCASE` labels render `BAŞLA` (dotted İ), not `BASLA`/`BAŞLAMA`.
- `/tr/guides` shows the empty state, not a broken grid.

- [ ] **Step 8: Commit**

```bash
git add src/lib/i18n/start-steps.ts src/features/academy src/features/guides src/lib/content-taxonomy.ts "src/app/(en)/academy/page.tsx" "src/app/(en)/guides/page.tsx" src/app/tr/academy src/app/tr/guides
git commit -m "feat(i18n): add Turkish academy and guides shells"
```

---

### Task 11: Turkish search with folded matching

**Files:**
- Create: `src/app/tr/search/page.tsx`
- Modify: `src/app/(en)/search/page.tsx`, `src/app/search/SearchClient.tsx`

**Interfaces:**
- Consumes: `normalizeSearchText`, `listPublishedContentAsync(locale)`, `locale`.
- Produces: `SearchClient` accepts `locale: Locale`; both document text and query are folded with the same function.

- [ ] **Step 1: Write the failing assertion**

Append to `scripts/locale-regression-test.ts`:

```ts
import { readFileSync } from 'node:fs';

check('search client folds both document and query text', () => {
  const source = readFileSync('src/app/search/SearchClient.tsx', 'utf8');
  assert.match(source, /normalizeSearchText/, 'SearchClient must use the shared folding helper');
  assert.doesNotMatch(source, /query\.trim\(\)\.toLowerCase\(\)/, 'raw toLowerCase on the query bypasses folding');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --import tsx scripts/locale-regression-test.ts`
Expected: FAIL — `SearchClient` does not import `normalizeSearchText`.

- [ ] **Step 3: Wire the folding into the client**

In `src/app/search/SearchClient.tsx`:

- Add `import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locale';` and `import { normalizeSearchText } from '@/lib/i18n/search-text';`
- Extend the props type with `locale?: Locale` and default it to `DEFAULT_LOCALE` in the signature.
- Replace `tokenize` and the scoring helpers so every text is folded:

```ts
function tokenize(query: string, locale: Locale): string[] {
  return normalizeSearchText(query, locale).split(/\s+/).map((t) => t.trim()).filter((t) => t.length > 1);
}

function matchesAllTokens(article: SearchDocument, tokens: string[]): boolean {
  return tokens.every((token) => article.searchText.includes(token));
}

function metadataText(article: SearchDocument, locale: Locale): string {
  return normalizeSearchText(
    [
      article.category,
      article.metadata?.contentType,
      article.metadata?.difficulty,
      ...(article.metadata?.topics || []),
      ...(article.metadata?.discipline || []),
      ...(article.metadata?.audience || []),
      ...(article.metadata?.components || []),
    ].filter(Boolean).join(' '),
    locale,
  );
}

function relevanceScore(article: SearchDocument, tokens: string[], phrase: string, locale: Locale): number {
  if (!tokens.length) return 0;
  const title = normalizeSearchText(article.title, locale);
  const excerpt = normalizeSearchText(article.excerpt || '', locale);
  const metaText = metadataText(article, locale);
  let score = 0;
  for (const token of tokens) {
    if (title.includes(token)) score += 20;
    if (excerpt.includes(token)) score += 8;
    if (metaText.includes(token)) score += 5;
    if (article.searchText.includes(token)) score += 1;
  }
  if (title.includes(phrase)) score += 50;
  return score;
}
```

- Replace the `useMemo` query expression with `const q = normalizeSearchText(query.trim(), locale);` and pass `locale` to `tokenize` / `relevanceScore`.

- [ ] **Step 4: Fold the search document on the server**

In `src/app/(en)/search/page.tsx`, build the document with folding and pass the locale:

```ts
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locale';
import { normalizeSearchText } from '@/lib/i18n/search-text';

function buildSearchDocument(article: PublishedArtifact, locale: Locale): SearchDocument {
  const searchText = normalizeSearchText(
    [
      article.title,
      article.excerpt,
      article.slug,
      article.category,
      article.metadata?.contentType,
      article.metadata?.difficulty,
      ...(article.metadata?.topics || []),
      ...(article.metadata?.discipline || []),
      ...(article.metadata?.audience || []),
      ...(article.metadata?.components || []),
      ...(article.bodySections || []).map((section) => `${section.title} ${section.content}`),
    ].filter(Boolean).join(' '),
    locale,
  );
  // …unchanged return
}
```

- Pass `<SearchClient locale="en" … />` from the English page and build documents with `buildSearchDocument(article, 'en')`. The English output is identical because folding is a no-op for `en`.

- [ ] **Step 5: Add the Turkish search page**

Create `src/app/tr/search/page.tsx` by mirroring `src/app/(en)/search/page.tsx` with:

- `const locale: Locale = 'tr';`
- `const allContent = await listPublishedContentAsync('tr');`
- documents built with `buildSearchDocument(article, 'tr')`
- Turkish metadata: `title: 'Arama | FPVLovers'`, `description: 'Türkçe FPV rehberlerinde ara.'`, `path: '/search'`, `locale: 'tr'`
- `<SearchClient locale="tr" … />`

Export `buildSearchDocument` from a small shared module rather than importing it from a page: move it to `src/lib/search/search-document.ts` and import it in both pages.

- [ ] **Step 6: Verify the folding end to end**

Run `pnpm dev`, then in the browser open `http://localhost:3000/tr/search` and type `ucus` — with no Turkish articles the result list is empty, but the page must render the Turkish empty state and must not throw.

Then verify the positive case with a temporary fixture. Create `content/published/tr/__locale-test__.json` with every field `ensureMediaArtifact` expects:

```json
{
  "slug": "__locale-test__",
  "jobId": "locale-test",
  "category": "Flight Guides",
  "template": "guide",
  "publishedAt": "2026-10-30T00:00:00.000Z",
  "promptVersion": "test",
  "jobStatus": "published",
  "title": "Uçuş Pratiği",
  "excerpt": "Simülatörde uçuş pratiği.",
  "seo": {
    "slug": "__locale-test__",
    "metaDescription": "Uçuş pratiği rehberi.",
    "keywords": []
  },
  "bodySections": [
    { "id": "section-1", "title": "Başlangıç", "content": "Yeni başlayanlar için uçuş pratiği." }
  ],
  "internalLinks": [],
  "publishNotes": []
}
```

Open `/tr/search` and search `ucus`. Expected: the fixture appears (the document contains `uçuş`, which folds to `ucus`). Delete the fixture afterwards and confirm `git status` shows no leftover file.

- [ ] **Step 7: Run the test and type check**

Run: `node --import tsx scripts/locale-regression-test.ts`
Expected: PASS, 30 checks.

Run: `./node_modules/.bin/tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/app/search/SearchClient.tsx src/lib/search/search-document.ts "src/app/(en)/search/page.tsx" src/app/tr/search scripts/locale-regression-test.ts
git commit -m "feat(i18n): fold Turkish search queries and documents"
```

---

### Task 12: Turkish SEO surface (hreflang, sitemap, robots)

**Files:**
- Modify: `src/app/sitemap.xml/route.ts`, `src/app/robots.ts`

**Interfaces:**
- Consumes: `isTranslatedPath`, `localizePath`, `listPublishedContentAsync('tr')`.
- Produces: sitemap entries with `xhtml:link` alternates; Turkish entries only for translated paths and published Turkish articles.

- [ ] **Step 1: Extend the sitemap**

In `src/app/sitemap.xml/route.ts`:

- Add `import { isTranslatedPath, localizePath } from '@/lib/i18n/locale';`
- Add the `xmlns:xhtml` namespace to the `<urlset>` element: `xmlns:xhtml="http://www.w3.org/1999/xhtml"`.
- Build alternates for every static page that is translated, and emit the Turkish URL as its own `<url>` entry:

```ts
function alternateLinks(path: string): string {
  if (!isTranslatedPath(path)) return '';
  return [
    `    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}${path}" />`,
    `    <xhtml:link rel="alternate" hreflang="tr" href="${BASE_URL}${localizePath(path, 'tr')}" />`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${path}" />`,
  ].join('\n');
}

const turkishStaticUrls = STATIC_PAGES
  .filter((page) => isTranslatedPath(page.url))
  .map((page) => `
    <url>
      <loc>${BASE_URL}${localizePath(page.url, 'tr')}</loc>
      <priority>${page.priority}</priority>
      <changefreq>${page.changefreq}</changefreq>
    </url>`);
```

- Insert `alternateLinks(page.url)` inside each static `<url>` block.
- Append `turkishStaticUrls.join('')` to the response body.
- For Turkish articles, add (guarded, so it stays a no-op until content lands):

```ts
  let turkishArticleUrls = '';
  try {
    const turkish = await listPublishedContentAsync('tr');
    turkishArticleUrls = turkish
      .filter((article) => article.slug && isIndexablePublishedArtifact(article))
      .map((article) => {
        const enHasArticle = articlesBySlug.has(article.slug);
        const alternates = enHasArticle
          ? [
              `    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/article/${article.slug}" />`,
              `    <xhtml:link rel="alternate" hreflang="tr" href="${BASE_URL}/tr/article/${article.slug}" />`,
            ].join('\n')
          : '';
        return `
    <url>
      <loc>${BASE_URL}/tr/article/${article.slug}</loc>
      <priority>0.8</priority>
      <changefreq>weekly</changefreq>
${alternates}
    </url>`;
      })
      .join('');
  } catch (err) {
    console.error('[Sitemap] Failed to load Turkish content:', err);
  }
```

- Append `turkishArticleUrls` to the body as well.

- [ ] **Step 2: Verify the English URL count is unchanged**

Run `pnpm dev`, then:

```bash
curl -s http://localhost:3000/sitemap.xml | grep -c "<loc>"
```

Expected: the English count (196) plus the 4 Turkish static pages = 200. English `<loc>` entries must remain 196; confirm by counting non-`/tr` locations:

```bash
curl -s http://localhost:3000/sitemap.xml | grep -o "<loc>[^<]*</loc>" | grep -vc "/tr"
```

Expected: `196`.

- [ ] **Step 3: Add the Turkish sitemap to robots**

In `src/app/robots.ts`, keep the existing sitemap entry; the Turkish URLs are inside the same sitemap, so no new line is required. Verify the file still returns one sitemap URL:

```bash
curl -s http://localhost:3000/robots.txt
```

Expected: `Sitemap: https://fpvlovers.com.tr/sitemap.xml`.

- [ ] **Step 4: Validate hreflang reciprocity in the rendered HTML**

Run with `pnpm dev`:

```bash
curl -s http://localhost:3000/tr | grep -o 'hreflang="[a-z-]*"[^>]*' | head -5
curl -s http://localhost:3000/tr/academy | grep -o '<link rel="canonical"[^>]*>'
```

Expected: `/tr` emits `hreflang="en"`, `hreflang="tr"` and `x-default`; `/tr/academy` canonical points to `https://fpvlovers.com.tr/tr/academy`.

Check a non-translated page:

```bash
curl -s http://localhost:3000/tools | grep -c 'hreflang='
```

Expected: `0` — untranslated pages must not advertise a Turkish alternate.

- [ ] **Step 5: Run the full verification set**

```bash
node --import tsx scripts/locale-regression-test.ts
node --import tsx scripts/seo-discoverability-regression-test.ts
node --import tsx scripts/content-language-audit.ts
node --import tsx scripts/content-integrity-audit.ts
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint src --ext .ts,.tsx
pnpm build
```

Expected: all pass; build succeeds.

- [ ] **Step 6: Commit and deploy R3**

```bash
git add src/app/sitemap.xml/route.ts src/app/robots.ts
git commit -m "feat(i18n): advertise Turkish pages with hreflang and sitemap entries"
```

Deploy `fpvlovers-web` in Coolify. Then verify on production:

```bash
curl -s -o /dev/null -w "%{http_code} %{time_total}\n" https://fpvlovers.com.tr/
curl -s -o /dev/null -w "%{http_code}\n" https://fpvlovers.com.tr/tr
curl -s -o /dev/null -w "%{http_code}\n" https://fpvlovers.com.tr/tr/academy
curl -s -o /dev/null -w "%{http_code}\n" https://fpvlovers.com.tr/tr/guides
curl -s https://fpvlovers.com.tr/api/ready
curl -s https://fpvlovers.com.tr/tr | grep -o '<html lang="[a-z]*"'
```

Expected: `200` for every page, `ready` for `/api/ready`, `<html lang="tr"`.

---

## Self-Review

**Spec coverage**

| Spec section | Task |
| --- | --- |
| 1. Locale model (`locale`, `translationOf`) | 1, 4 |
| 2. Storage key `(slug, locale)` | 6 |
| 3. Bidirectional expose guard | 3 |
| 4. Routing + `<html lang>` (route-group split) | 7, 9 |
| 5. Navigation, taxonomy, levels | 8, 10 |
| 6. Search folding | 2, 11 |
| 7. Locale-aware covers | 5 |
| 8. Academy / regulations pilot | 10 (academy shell), C2 plan (regulations content) |
| 9. Generation pipeline locale | C4 plan (out of this plan's scope by design) |
| 10. SEO (`hreflang`, sitemap, OG locale) | 9, 12 |

Deferred to later plans (documented, not gaps): `translationOf` population, `/tr/article/[slug]`, SHGM content, Dify locale input, Turkish GSC opening. These belong to C2–C5 and require content that does not exist yet.

**Placeholder scan:** the only intentional placeholder is the `START_STEPS.en` move instruction, which points at a specific existing array in a specific file rather than describing behaviour; the implementer copies it verbatim. No "TBD", no "add appropriate error handling".

**Type consistency:** `Locale` is defined once (Task 1) and imported everywhere; `shouldExposePublishedArtifact(article, expectedLocale)` keeps its second parameter optional with default `'en'`, matching every pre-existing call site; `listPublishedContentAsync(locale)` keeps the parameter optional so React `cache()` keys stay stable for English callers; `buildCoverImageUrl(slug, locale)` defaults to `'en'` and therefore leaves all existing cover URLs byte-identical.
