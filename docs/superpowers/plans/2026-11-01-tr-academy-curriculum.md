# Turkish Academy Curriculum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all six `/tr/academy` steps lead to Turkish articles — five translated from the English beginner path, one written originally in Turkish for Turkish drone regulation — and repair article imagery at the source before translating.

**Architecture:** Turkish articles stay file-backed (`content/published/tr/`, published with `--files-only`) exactly like the one live Turkish article; production merges the shadow table (empty for `tr`) with the committed files, so the file is authoritative. An original Turkish article is enabled by a small `origin: "tr"` contract extension instead of a fake `translationOf`. Image repair runs against the crawl database first, so the localizer copies repaired figures into each translation.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Node `tsx` regression scripts, `pnpm` scripts, PostgreSQL `content_engine.raw_content` (read) via `pg`, Dify localizer output consumed from a local JSON file (`--from-file`).

**Spec:** `docs/superpowers/specs/2026-11-01-tr-academy-curriculum-design.md`

## Global Constraints

- Never read or log `.env` contents; reference key names only. No secret enters the repo.
- Turkish artifacts live only in `content/published/tr/` and are published with `--files-only`. Do not create `published_articles_shadow` rows with `locale='tr'` in this slice; production falls back to the committed file when no row exists.
- Translated slugs stay byte-identical to their English source. The original article uses an English-style slug so a future English translation can pair through `translationOf`.
- Publish gate for every article: ≥1200 words, SEO ≥80 (`computeSeoScore`), Turkish body (`hasLanguageMismatch(content, 'tr') === false`), valid metadata. Translations also carry `translationOf`; originals carry `origin: "tr"`.
- Currency figures from the English source stay byte-identical (e.g. `$100`, `$350`). Never convert to TL, never introduce a price or availability claim that is not in the English source.
- Product/model names and technical claims are copied from the English source unchanged. No new recommendations.
- SHGM/SHY-İHA facts come only from official sources fetched live in this task; every claim is traceable to a listed URL. No interpretation of grey areas, no numeric threshold without a source.
- Product reviews and regulation content are never machine-translated (`scripts/translate-article.ts` blocks both).
- Conventional Commits (`type(scope): description`). Use `pnpm` and `./node_modules/.bin/*`; there is no working `npm` in this repo.
- Regression tests are append-only: add checks, do not delete existing ones except where a task explicitly rewrites an assertion whose contract changed.
- GitNexus CLI is unavailable on macOS here (`node .gitnexus/run.cjs` prints install instructions). Substitute: `grep -rn` caller enumeration, `./node_modules/.bin/tsc --noEmit`, the regression suites, and `pnpm build`. State this limitation in commit/PR notes instead of claiming a graph check.
- Before any `pnpm build`, stop the dev server. A production build wipes `.next` under a running `next dev` and corrupts the dev server (`Cannot find module './vendor-chunks/…'`).

### Content authoring contract (shared by Tasks 5–9)

Every translation is produced as a localizer JSON file consumed by `parseLocalizedRewriteOutput`:

```json
{
  "title": "Türkçe başlık",
  "excerpt": "Türkçe özet",
  "body_sections": [
    { "id": "article-sub-1", "title": "Türkçe bölüm başlığı", "content": "Türkçe gövde" }
  ],
  "seo": {
    "slug": "<english-slug, unchanged>",
    "metaDescription": "<120-160 characters, Turkish>",
    "keywords": ["<primary Turkish keyword>", "<secondary>", "<secondary>"]
  },
  "metadata": {},
  "internal_links": ["/article/<related-slug>"],
  "publish_notes": ["İngilizce kaynağın Türkçe yerelleştirmesi; ..."],
  "localization_notes": ["..."]
}
```

Rules that the gate enforces or the reviewer checks:

1. `body_sections` ids and count must equal the source list given in the task, in order. `validateLocalizedRewrite` fails on any drift.
2. `metadata` is copied verbatim from `content/published/<english-slug>.json` → `.metadata`. The gate fails if `contentType` or `difficulty` drift.
3. `seo.slug` equals the English slug.
4. `seo.keywords[0]` must appear in `title` and its density across the body must land in 1.5–2.5% (`computeSeoScore` gives 0/25 otherwise).
5. `seo.metaDescription` length is 120–160 characters.
6. `internal_links` starts from the English artifact's `internalLinks`. Where the source list is empty, add exactly the single related link named in the task — that one link is what keeps the gate's 10 link points in play; never invent others. Untranslated targets stay on English URLs by design.
7. Body is written from scratch in Turkish, section by section, faithful to the English source. No sentence is left in English, no section is abridged. Total Turkish words ≥ the English source word count (source counts are listed per task).
8. `publish_notes` states that the article is a Turkish localization of the named English source.

The gate runs before media is attached, so the practical ceiling at gate time is 90 (the 10 image points are unavailable). Rules 1–8 land an artifact at 80–90; anything under 80 means one rule is unmet.

Drafts live in `content/drafts/tr/localizer/` (new directory). They are committed so the translation is reviewable and re-runnable with `--from-file`.

---

### Task 1: `origin: "tr"` contract for original Turkish articles

**Files:**
- Modify: `src/lib/content-automation/content-reader.ts:94-111`
- Modify: `src/lib/content-automation/publish-artifact.ts:115-126`, `:288-309`
- Modify: `scripts/content-language-audit.ts:46-56`
- Test: `scripts/locale-regression-test.ts`

**Interfaces:**
- Produces: `PublishedArtifact.origin?: 'tr'`
- Produces: `PublishArtifactOptions.origin?: 'tr'`
- Produces: `assertPublishableLocale(locale: Locale, translationOf: string | undefined, origin?: 'tr'): void`

- [ ] **Step 1: Write the failing tests**

In `scripts/locale-regression-test.ts`, add `assertPublishableLocale` to the `publish-artifact` import block at the top (create the import line):

```ts
import { assertPublishableLocale } from '../src/lib/content-automation/publish-artifact';
```

Replace the existing `check('Turkish listing contains only Turkish artifacts', ...)` body so originals are allowed:

```ts
check('Turkish listing contains only Turkish artifacts', () => {
  const turkish = listPublishedContent('tr');
  for (const artifact of turkish) {
    assert.equal(artifact.locale, 'tr', `artifact ${artifact.slug} is in the tr tree without locale "tr"`);
    assert.ok(
      artifact.translationOf || artifact.origin === 'tr',
      `artifact ${artifact.slug} has neither translationOf nor origin "tr"`,
    );
    if (artifact.translationOf) {
      assert.ok(
        getPublishedContentBySlug(artifact.translationOf, 'en'),
        `${artifact.slug} pairs with a missing English source`,
      );
    }
  }
});
```

Update the existing publisher assertion inside `check('publishers write Turkish artifacts into content/published/tr', ...)`:

```ts
  assert.match(source, /assertPublishableLocale\(locale, options\.translationOf, options\.origin\)/);
  assert.match(source, /Turkish artifacts require translationOf/);
```

Append two new checks before `let failed = 0;`:

```ts
check('Turkish artifacts accept either a translation pairing or an original origin', () => {
  assert.doesNotThrow(() => assertPublishableLocale('tr', 'english-slug'));
  assert.doesNotThrow(() => assertPublishableLocale('tr', undefined, 'tr'));
  assert.throws(
    () => assertPublishableLocale('tr', undefined),
    /Turkish artifacts require translationOf/,
  );
  assert.doesNotThrow(() => assertPublishableLocale('en', undefined));
});

check('publish artifact records the origin marker when given one', () => {
  const source = readFileSync('src/lib/content-automation/publish-artifact.ts', 'utf8');
  assert.match(source, /\.\.\.\(options\.origin \? \{ origin: options\.origin \} : \{\}\)/);
  assert.match(source, /export type PublishOrigin = 'tr'/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm locale:test`
Expected: FAIL — `assertPublishableLocale is not a function` or the new assertions fail.

- [ ] **Step 3: Implement the contract**

In `src/lib/content-automation/content-reader.ts`, add to `PublishedArtifact` after `translationOf`:

```ts
  /** Marks content written originally in Turkish, with no English counterpart. */
  origin?: 'tr';
```

In `src/lib/content-automation/publish-artifact.ts`, replace the options type and assert:

```ts
export type PublishOrigin = 'tr';

export type PublishArtifactOptions = {
  locale?: Locale;
  translationOf?: string;
  origin?: PublishOrigin;
  metadata?: ContentMetadata;
  sourceReferences?: string[];
};

export function assertPublishableLocale(
  locale: Locale,
  translationOf: string | undefined,
  origin?: PublishOrigin,
): void {
  if (locale === 'tr' && !translationOf && origin !== 'tr') {
    throw new Error(
      'Turkish artifacts require translationOf or origin "tr": one of them names where the content came from.',
    );
  }
}
```

Update the call site:

```ts
  assertPublishableLocale(locale, options.translationOf, options.origin);
```

Add the marker to the artifact object next to `translationOf`:

```ts
    ...(options.translationOf ? { translationOf: options.translationOf } : {}),
    ...(options.origin ? { origin: options.origin } : {}),
```

In `scripts/content-language-audit.ts`, replace the pairing check:

```ts
      if (!artifact.translationOf && artifact.origin !== 'tr') {
        failures.push({ file, slug: artifact.slug, reason: 'Missing translationOf or origin:"tr"' });
      }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm locale:test`
Expected: `locale regression test passed (N checks)` with no failures.

Run: `pnpm content:language-audit`
Expected: `✓ content language audit passed (154 artifacts checked)`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/content-automation/content-reader.ts src/lib/content-automation/publish-artifact.ts scripts/content-language-audit.ts scripts/locale-regression-test.ts
git commit -m "feat(content): allow original Turkish artifacts with an origin marker"
```

---

### Task 2: Sitemap lists original Turkish articles without alternates

**Files:**
- Modify: `src/app/sitemap.xml/route.ts:125-164`
- Test: `scripts/locale-regression-test.ts`

**Interfaces:**
- Consumes: `PublishedArtifact.origin` (Task 1), `isIndexablePublishedArtifact`, `listPublishedContentAsync('tr')`
- Produces: one `<loc>` per indexable Turkish artifact that has no `translationOf`, with no `xhtml:link` children

- [ ] **Step 1: Write the failing test**

Append before `let failed = 0;` in `scripts/locale-regression-test.ts`:

```ts
check('sitemap lists original Turkish articles without alternates', () => {
  const source = readFileSync('src/app/sitemap.xml/route.ts', 'utf8');
  assert.match(source, /const turkishArticles = await listPublishedContentAsync\('tr'\)/, 'the Turkish tree must be loaded once');
  assert.match(source, /const turkishOriginals = turkishArticles[\s\S]{0,120}\.filter\(\(article\) => !article\.translationOf\)/, 'originals need their own URL list');
  assert.match(source, /\.\.\.turkishOriginalUrls/, 'original URLs must be emitted');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm locale:test`
Expected: FAIL — assertions on `turkishArticles`, `turkishOriginals`, `turkishOriginalUrls` are missing.

- [ ] **Step 3: Implement the sitemap change**

In `src/app/sitemap.xml/route.ts`, replace the Turkish index block:

```ts
  // Pairs only through translationOf; originals are emitted on their own below.
  const turkishArticles = await listPublishedContentAsync('tr');
  const turkishIndex = indexTranslationsBySource(turkishArticles, isIndexablePublishedArtifact);
  const turkishOriginals = turkishArticles
    .filter(isIndexablePublishedArtifact)
    .filter((article) => !article.translationOf);
```

Add the original URL block after `turkishArticleUrls`:

```ts
  const turkishOriginalUrls = turkishOriginals.map((article) => `
    <url>
      <loc>${BASE_URL}${turkishArticlePath(article.slug)}</loc>
      ${article.publishedAt ? `<lastmod>${new Date(article.publishedAt).toISOString()}</lastmod>` : ''}
      <priority>0.8</priority>
      <changefreq>weekly</changefreq>
    </url>`);
```

Include it in the `urls` array after `...turkishArticleUrls`:

```ts
    ...turkishArticleUrls,
    ...turkishOriginalUrls,
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm locale:test`
Expected: PASS. Also confirm no duplicate URL logic:

```bash
grep -n "turkishIndex\|turkishOriginals\|turkishOriginalUrls" src/app/sitemap.xml/route.ts
```

Expected: `turkishIndex` and `turkishOriginals` both derive from the single `turkishArticles` call; an original has no `translationOf`, so it cannot appear twice.

- [ ] **Step 5: Commit**

```bash
git add src/app/sitemap.xml/route.ts scripts/locale-regression-test.ts
git commit -m "feat(seo): list original Turkish articles in the sitemap"
```

---

### Task 3: Original-article validation and publishing CLI

**Files:**
- Create: `src/lib/content-automation/original-article.ts`
- Create: `scripts/publish-original-article.ts`
- Create: `scripts/original-article-regression-test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `OriginalArticleInput`
- Produces: `toGeneratedContent(input: OriginalArticleInput): GeneratedContent`
- Produces: `validateOriginalArticle(input: OriginalArticleInput): { ok: boolean; blockers: string[] }`
- Produces: `pnpm content:publish-original --file=<json> [--dry-run] [--files-only] [--force]`
- Produces: `pnpm content:original-test`

- [ ] **Step 1: Write the failing test**

Create `scripts/original-article-regression-test.ts`:

```ts
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  toGeneratedContent,
  validateOriginalArticle,
  type OriginalArticleInput,
} from '../src/lib/content-automation/original-article';

// The grader counts the primary keyword as a plain substring of title + bodies,
// so the fixture repeats one 12-word sentence containing "drone kuralları" and
// dilutes it with 11-word neutral sentences. 12 keyword + 42 neutral per section
// yields 1818 body words and a 1.97% density — comfortably inside every band.
const keywordSentence = 'drone kuralları yeni pilotlar için temel bilgileri ve güvenli uçuş pratiklerini açıklar.';
const neutralSentence = 'pil güvenliği ve ekipman bakımı uzun uçuşlar için düzenli kontrol gerektirir.';

function body(keywordCount: number, neutralCount: number): string {
  return [...Array(keywordCount).fill(keywordSentence), ...Array(neutralCount).fill(neutralSentence)].join(' ');
}

const valid: OriginalArticleInput = {
  slug: 'shy-iha-drone-rules-for-beginners-in-turkey',
  // The title must contain the primary keyword verbatim; "SHY-İHA" lowercases to
  // "shy-i̇ha" (dotted İ + combining mark) and never matches the ASCII keyword.
  title: "SHY-İHA: Türkiye'de Drone Kuralları ve Yeni Başlayanlar İçin Uçuş Rehberi",
  excerpt: 'Türkiye’de İHA uçuşlarına başlamadan önce bilinmesi gereken resmî çerçevenin kaynaklı özeti.',
  category: 'Regulations',
  template: 'regulation-guide',
  seo: {
    metaDescription: 'SHY-İHA kapsamında yeni başlayanlar için kayıt, yeterlilik ve uçuş öncesi kontrolleri resmî kaynaklara dayanarak özetleyen başlangıç rehberi.',
    keywords: ['drone kuralları', 'shy iha', 'iha mevzuatı'],
  },
  bodySections: [
    { id: 'kapsam', title: 'Kapsam ve Tanımlar', content: body(12, 42) },
    { id: 'kayit', title: 'Kayıt ve Yeterlilik', content: body(12, 42) },
    { id: 'ucus', title: 'Uçuş Öncesi Kontroller', content: body(12, 42) },
  ],
  internalLinks: ['/regulations'],
  publishNotes: ['Türkçe özgün içerik; her iddia resmî SHGM kaynağına dayanır.'],
  metadata: {
    difficulty: 'beginner',
    contentType: 'reference',
    topics: ['regulations'],
    audience: ['new-pilot'],
    discipline: ['general'],
  },
  sourceReferences: ['https://web.shgm.gov.tr/'],
};

assert.deepEqual(validateOriginalArticle(valid).blockers, []);
assert.equal(validateOriginalArticle(valid).ok, true);

const englishBody: OriginalArticleInput = {
  ...valid,
  title: 'Turkish drone rules for beginners',
  excerpt: 'A sourced summary of the official framework before your first flight.',
  seo: {
    ...valid.seo,
    keywords: ['drone rules'],
    metaDescription: 'The pilot should check the battery and the radio before the first flight and follow the local aviation authority rules.',
  },
  bodySections: [
    { id: 'kapsam', title: 'Scope', content: 'The pilot should check the battery and the radio before the first flight. '.repeat(80) },
    { id: 'kayit', title: 'Registration', content: 'The pilot should check the battery and the radio before the first flight. '.repeat(80) },
    { id: 'ucus', title: 'Checks', content: 'The pilot should check the battery and the radio before the first flight. '.repeat(80) },
  ],
};
assert.ok(validateOriginalArticle(englishBody).blockers.some((b) => b.includes('Turkish')));

const short: OriginalArticleInput = {
  ...valid,
  bodySections: [
    { id: 'kapsam', title: 'Kapsam', content: body(2, 2) },
    { id: 'kayit', title: 'Kayıt', content: body(2, 2) },
    { id: 'ucus', title: 'Uçuş', content: body(2, 2) },
  ],
};
assert.ok(validateOriginalArticle(short).blockers.some((b) => b.includes('1200')));

assert.ok(
  validateOriginalArticle({ ...valid, sourceReferences: [] }).blockers.some((b) => b.includes('source reference')),
);
assert.ok(
  validateOriginalArticle({ ...valid, sourceReferences: ['http://web.shgm.gov.tr/'] }).blockers.some((b) => b.includes('https')),
);
assert.ok(
  validateOriginalArticle({
    ...valid,
    bodySections: [
      { id: 'kapsam', title: 'Kapsam', content: body(10, 30) },
      { id: 'kapsam', title: 'Kayıt', content: body(10, 40) },
      { id: 'ucus', title: 'Uçuş', content: body(10, 40) },
    ],
  }).blockers.some((b) => b.includes('unique')),
);
assert.ok(
  validateOriginalArticle({
    ...valid,
    metadata: { ...valid.metadata, difficulty: 'legendary' as never },
  }).blockers.some((b) => b.includes('Metadata')),
);
assert.ok(
  // Dropping the keyword list leaves only words + meta + links (55), which is the
  // deterministic way to land under the gate: a title-only miss still scores 80.
  validateOriginalArticle({ ...valid, seo: { ...valid.seo, keywords: [] } }).blockers.some((b) => b.includes('SEO')),
);
assert.ok(
  validateOriginalArticle({ ...valid, template: 'product-review' as never }).blockers.some((b) => b.includes('template')),
);

const content = toGeneratedContent(valid);
assert.equal(content.seo.slug, valid.slug);
assert.equal(content.bodySections.length, 3);
assert.equal(content.internalLinks[0], '/regulations');

const script = fs.readFileSync('scripts/publish-original-article.ts', 'utf8');
assert.match(script, /origin: 'tr'/, 'the CLI must publish with an origin marker');
assert.match(script, /locale: 'tr'/);
assert.match(script, /--files-only/);

console.log('original article regression checks passed');
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --import tsx scripts/original-article-regression-test.ts`
Expected: FAIL — `Cannot find module '../src/lib/content-automation/original-article'`.

- [ ] **Step 3: Implement the validation module**

Create `src/lib/content-automation/original-article.ts`:

```ts
import { validateContentMetadata, type ContentMetadata } from '@/lib/content-metadata';
import type { ContentTemplate } from './types';
import type { GeneratedContent } from './parse-generated-content';
import { getArtifactWordCount, hasLanguageMismatch } from './content-reader';
import { computeSeoScore } from './seo-score';

const MIN_WORDS = 1200;
const MIN_SEO_SCORE = 80;
const TEMPLATES: readonly ContentTemplate[] = [
  'tech-article',
  'product-review',
  'build-guide',
  'comparison',
  'troubleshooting',
  'regulation-guide',
  'community-roundup',
];

export type OriginalArticleInput = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  template: ContentTemplate;
  seo: { metaDescription: string; keywords: string[] };
  bodySections: Array<{ id: string; title: string; content: string }>;
  internalLinks?: string[];
  publishNotes?: string[];
  metadata?: ContentMetadata;
  sourceReferences: string[];
};

export function toGeneratedContent(input: OriginalArticleInput): GeneratedContent {
  return {
    title: input.title,
    seo: {
      slug: input.slug,
      metaDescription: input.seo.metaDescription,
      keywords: input.seo.keywords,
    },
    excerpt: input.excerpt,
    bodySections: input.bodySections.map((section) => ({
      id: section.id,
      title: section.title,
      content: section.content,
    })),
    internalLinks: input.internalLinks || [],
    publishNotes: input.publishNotes || [],
  };
}

export function validateOriginalArticle(
  input: OriginalArticleInput,
): { ok: boolean; blockers: string[] } {
  const blockers: string[] = [];
  const content = toGeneratedContent(input);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
    blockers.push(`Invalid slug: ${input.slug || '(empty)'}.`);
  }
  if (!input.title.trim()) blockers.push('Title is empty.');
  if (!input.excerpt.trim()) blockers.push('Excerpt is empty.');
  if (!input.category.trim()) blockers.push('Category is empty.');
  if (!TEMPLATES.includes(input.template)) {
    blockers.push(`Unknown template: ${String(input.template)}.`);
  }
  if (input.template === 'product-review') {
    blockers.push('The product-review template requires a human editor in the target language.');
  }
  if (input.category.trim().toLowerCase() === 'reviews') {
    blockers.push('Product reviews require a human editor and cannot be published as originals.');
  }
  if (input.bodySections.length === 0) blockers.push('No body sections.');

  const ids = input.bodySections.map((section) => section.id);
  if (new Set(ids).size !== ids.length) blockers.push('Section ids must be unique.');
  if (ids.some((id) => !/^[a-z0-9-]+$/.test(id))) {
    blockers.push('Section ids must be lowercase kebab-case.');
  }

  const words = getArtifactWordCount(content);
  if (words < MIN_WORDS) blockers.push(`Body has ${words} words; ${MIN_WORDS} required.`);

  if (hasLanguageMismatch(content, 'tr')) blockers.push('Body does not read as Turkish.');

  const seo = computeSeoScore(content);
  if (seo.score < MIN_SEO_SCORE) {
    blockers.push(`SEO score ${seo.score} is below ${MIN_SEO_SCORE}: ${seo.reasons.join(' ')}`);
  }

  const metadata = validateContentMetadata(input.metadata || {});
  if (!metadata.isValid) blockers.push(`Metadata invalid: ${metadata.errors.join('; ')}`);

  const references = (input.sourceReferences || []).filter((value) => /^https:\/\//i.test(value));
  if (references.length === 0) {
    blockers.push('At least one https source reference is required.');
  } else if (references.length !== input.sourceReferences.length) {
    blockers.push('Every source reference must be an https URL.');
  }

  return { ok: blockers.length === 0, blockers };
}
```

- [ ] **Step 4: Run the test again**

Run: `node --import tsx scripts/original-article-regression-test.ts`
Expected: still FAIL, now on the missing `scripts/publish-original-article.ts` (ENOENT on the `readFileSync` at the end).

- [ ] **Step 5: Implement the publishing CLI**

Create `scripts/publish-original-article.ts`:

```ts
import fs from 'fs';
import path from 'path';
import { publishGeneratedContentArtifact } from '../src/lib/content-automation/publish-artifact';
import { getPublishedContentBySlug, getArtifactWordCount } from '../src/lib/content-automation/content-reader';
import {
  toGeneratedContent,
  validateOriginalArticle,
  type OriginalArticleInput,
} from '../src/lib/content-automation/original-article';
import { computeSeoScore } from '../src/lib/content-automation/seo-score';
import type { ContentJob } from '../src/lib/content-automation/types';

const ORIGINAL_PROMPT_VERSION = 'editorial-original-v1';

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = process.argv.find((value) => value.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function main() {
  const file = arg('file');
  const dryRun = hasFlag('dry-run');
  const force = hasFlag('force');
  if (!file) {
    throw new Error('Usage: pnpm content:publish-original --file=<article.json> [--dry-run] [--files-only] [--force]');
  }
  if (hasFlag('files-only')) {
    process.env.FPV_STORAGE_MODE = 'files';
  }

  const input = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8')) as OriginalArticleInput;
  if (getPublishedContentBySlug(input.slug, 'tr') && !force) {
    throw new Error(`Turkish artifact already exists for ${input.slug}; pass --force to overwrite.`);
  }

  const validation = validateOriginalArticle(input);
  if (!validation.ok) {
    console.error('✗ Original article failed the publish gate:');
    for (const blocker of validation.blockers) console.error(`  - ${blocker}`);
    process.exit(1);
  }

  const content = toGeneratedContent(input);
  const words = getArtifactWordCount(content);
  const seo = computeSeoScore(content);
  console.log(`✓ Gate passed: tr/${input.slug} (${words} words, SEO ${seo.score})`);
  console.log(`  sections: ${content.bodySections.map((section) => section.id).join(', ')}`);

  if (dryRun) {
    console.log('Dry run: no files written.');
    return;
  }

  const now = new Date().toISOString();
  const job: ContentJob = {
    id: `original-tr-${input.slug}-${Date.now().toString(36)}`,
    briefSlug: input.slug,
    title: content.title,
    category: input.category,
    status: 'published',
    topic: content.excerpt,
    language: 'tr',
    template: input.template,
    promptVersion: ORIGINAL_PROMPT_VERSION,
    sourceHints: [],
    seo: content.seo,
    createdAt: now,
    updatedAt: now,
  };

  const publishedFile = await publishGeneratedContentArtifact(input.slug, job, content, {
    locale: 'tr',
    origin: 'tr',
    metadata: input.metadata,
    sourceReferences: input.sourceReferences,
  });
  console.log(`✓ Published ${publishedFile}`);
}

main().catch((error) => {
  console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
```

Add both scripts to `package.json` next to `content:translate`:

```json
    "content:translate": "node --import tsx scripts/translate-article.ts",
    "content:publish-original": "node --import tsx scripts/publish-original-article.ts",
    "content:original-test": "node --import tsx scripts/original-article-regression-test.ts",
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm content:original-test`
Expected: `original article regression checks passed`.

Run: `./node_modules/.bin/tsc --noEmit`
Expected: no errors from `original-article.ts` or `publish-original-article.ts`.

- [ ] **Step 7: Commit**

```bash
git add src/lib/content-automation/original-article.ts scripts/publish-original-article.ts scripts/original-article-regression-test.ts package.json
git commit -m "feat(content): add a gated publishing path for original Turkish articles"
```

---

### Task 4: Repair article imagery and re-sync the English shadow rows

**Files:**
- Read/rewrite: `content/published/*.json` and `content/published/*.md` (via `pnpm db:inject-images`)
- No source-file changes; no algorithm changes to `scripts/db-inject-images-to-published.ts`

**Interfaces:**
- Consumes: `content_engine.raw_content` (read), `fpvlovers_app.published_articles_shadow` (write, `locale='en'` only)
- Produces: a measured before/after image-coverage report recorded in the commit message

- [ ] **Step 1: Measure the baseline**

```bash
node -e "const fs=require('fs'),p=require('path');const d='content/published';const files=fs.readdirSync(d).filter(f=>f.endsWith('.json'));let empty=0,filled=0,figs=0;for(const f of files){const a=JSON.parse(fs.readFileSync(p.join(d,f),'utf8'));const g=(a.media&&a.media.gallery)||[];const inline=(a.bodySections||[]).filter(s=>s.imageMatch).length;if(g.length===0&&inline===0)empty++;else filled++;figs+=inline;}console.log(JSON.stringify({files:files.length,filled,empty,figs}));"
```

Expected baseline (2026-11-01): `{"files":153,"filled":94,"empty":59,"figs":…}`. Record the exact numbers.

- [ ] **Step 2: Dry-run the injector**

```bash
pnpm db:inject-images --dry-run
```

Expected: `Loaded 31 crawled pages from DB.` followed by `matched N/M sections` lines and `Skip … no image matches found` lines, ending with a dry-run summary. No files change.

If it prints `DB not configured`, open a tunnel from another terminal and re-run with explicit host/port:

```bash
ssh -L 6432:gkmzgwnnirofcgpw2yh0bnlh:5432 root@169.58.96.15
DB_HOST=127.0.0.1 DB_PORT=6432 pnpm db:inject-images --dry-run
```

If it prints an authentication or connection-timeout error, stop and report it — do not edit the injector or invent credentials.

- [ ] **Step 3: Apply the injector**

```bash
pnpm db:inject-images
```

Expected: same match summary, artifacts rewritten. Confirm with `git status --short content/published`.

- [ ] **Step 4: Re-measure**

Run the Step 1 command again. Record `filled`, `empty`, `figs`. Expect `figs` to rise and `empty` to fall; the unpaid remainder is the known crawl gap and stays cover-only.

- [ ] **Step 5: Sync the English shadow rows**

```bash
FPV_STORAGE_MODE=dual node --import tsx scripts/db-backfill-published-content.ts
```

Expected: `[Published Content Backfill] Upserted 153/153 artifacts.` (the count must match the file count; this script iterates English artifacts only, which is correct here — Turkish has no shadow rows by design).

- [ ] **Step 6: Verify language and media policy are still green**

```bash
pnpm content:language-audit
pnpm media:audit
```

Expected: both pass. If `media:audit` flags a newly injected image, inspect the finding and drop that image from the artifact rather than loosening the audit.

- [ ] **Step 7: Commit with the measured coverage**

```bash
git add content/published
git commit -m "chore(content): repair inline article imagery from raw crawl data" -m "Coverage: <filled>/153 filled, <empty> empty, <figs> inline figures (was <before-empty> empty, <before-figs> figures)."
```

Fill the angle-bracket values with the numbers from Steps 1 and 4 before committing.

**Result (2026-11-01) — the plan's assumption did not survive contact with the data.**

Baseline measured: `{"files":153,"filled":95,"empty":58,"figs":110,"cover":153}` (the plan's guess was 94/59).

The injector as written could not run: `content_engine.raw_content` has no `domain` column
(`url, raw_markdown, source, content_hash, metadata, crawled_at, updated_at, is_active`).
After aligning the query, the first full run produced **60 articles "matched"**, and sampling
the output showed why that number was meaningless: "Who This Is For" was illustrated with
`Pilotos del SDT`, goggle evaluation criteria with a Drone Champions League photo. The pool
holds only league/team imagery (dronechampionsleague.com, multigp.com, f9u.it,
spaindroneteam.com, streetleague.io, droneracing.fai.org) while the empty articles are
tutorials sourced from betaflight.com and expresslrs.org.

That run was reverted. The injector now only uses images harvested from an article's own
declared sources and never replaces an existing figure (`f592e18`). Re-measured with the
scoped injector: 31 crawled pages, 51 editorial images, **2 source-bound matches, 0 new
figures** — and those two already carried the same figure. Coverage is therefore unchanged:
`{"files":153,"filled":95,"empty":58,"figs":110}`.

No shadow re-sync was needed because no artifact changed. Closing the remaining 58 needs the
articles' own source pages crawled (betaflight.com/docs/wiki, expresslrs.org, ...), which is a
crawl-pipeline job, not a media-repair one; until then those articles stay cover-only.

---

### Task 5: Translate the simulator practice plan (step 2)

**Files:**
- Create: `content/drafts/tr/localizer/fpv-simulator-practice-plan-first-30-days.json`
- Create (generated): `content/published/tr/fpv-simulator-practice-plan-first-30-days.json` and `.md`

**Interfaces:**
- Consumes: `pnpm content:translate --from-file`, the shared Content authoring contract
- Produces: a Turkish artifact with `locale: "tr"`, `translationOf: "fpv-simulator-practice-plan-first-30-days"`

- [ ] **Step 1: Write the localizer JSON**

Follow the Content authoring contract. Source facts:

- English title: `FPV Simulator Practice Plan: First 30 Days`
- English excerpt: `An evergreen FPVLovers guide focused on using simulator time with structure instead of random flying.`
- Source word count: **3326** (Turkish must reach at least this many words)
- `metadata` verbatim:
  ```json
  {"topics":["general-knowledge"],"components":["simulator"],"audience":["pilot"],"discipline":["general"],"difficulty":"intermediate","contentType":"guide"}
  ```
- `internal_links`: `["/article/first-hover-training"]` (the source has none; this is the one permitted addition, and it resolves to the Turkish tree once Task 9 publishes)
- Primary keyword suggestion: `fpv simülatör` (must appear in the Turkish title and land at 1.5–2.5% density)

Exact `body_sections` ids, in order (titles are translated, ids are not):

| id | English section title | source words |
| --- | --- | --- |
| `article-sub-1` | The Progressive FPV Pilot's Blueprint: A Tiered Simulator Practice Plan from Basic Controls to Freestyle Mastery | 105 |
| `article-sub-2` | Why FPV Simulators Are Your Best Co-Pilot | 397 |
| `article-sub-3` | Setting Up for Optimal Simulator Training | 555 |
| `article-sub-4` | The Progressive FPV Simulator Practice Plan: From Zero to Hero | 850 |
| `article-sub-5` | Optimizing Your Practice Sessions for Rapid Improvement | 378 |
| `article-sub-6` | Bridging the Gap: From Simulator to Real-World Flight | 365 |
| `article-sub-7` | Choosing Your FPV Simulator: The Right Tool for the Job | 371 |
| `article-sub-8` | Frequently Asked Questions About FPV Sim Practice | 229 |
| `article-sub-9` | Unlock Your FPV Potential Today | 76 |

Simulator names, protocols, rates, and any numeric practice durations are copied from the English source unchanged.

- [ ] **Step 2: Dry-run the gate**

```bash
pnpm content:translate --slug=fpv-simulator-practice-plan-first-30-days --from-file=content/drafts/tr/localizer/fpv-simulator-practice-plan-first-30-days.json --dry-run
```

Expected: `✓ Gate passed: fpv-simulator-practice-plan-first-30-days → tr (<N> words, SEO <S>)` followed by `Dry run: no files written.`

If it fails, the printed blockers name the cause. Fix the JSON — never edit `localized-rewrite.ts` constants to pass an article.

- [ ] **Step 3: Publish**

```bash
pnpm content:translate --slug=fpv-simulator-practice-plan-first-30-days --from-file=content/drafts/tr/localizer/fpv-simulator-practice-plan-first-30-days.json --files-only
```

Expected: `✓ Published content/published/tr/fpv-simulator-practice-plan-first-30-days.json`.

- [ ] **Step 4: Verify the artifact**

```bash
node -e "const a=require('./content/published/tr/fpv-simulator-practice-plan-first-30-days.json');const w=a.bodySections.reduce((n,s)=>n+s.content.split(/\s+/).filter(Boolean).length,0);console.log({locale:a.locale,translationOf:a.translationOf,origin:a.origin,sections:a.bodySections.length,words:w,inlang:a.metadata&&a.metadata.difficulty});if(a.locale!=='tr'||a.translationOf!=='fpv-simulator-practice-plan-first-30-days'||a.origin!==undefined||a.bodySections.length!==9||w<3326)process.exit(1);"
```

Expected: `{ locale: 'tr', translationOf: 'fpv-simulator-practice-plan-first-30-days', origin: undefined, sections: 9, words: ≥3326, inlang: 'intermediate' }` and exit 0.

- [ ] **Step 5: Commit**

```bash
git add content/drafts/tr/localizer/fpv-simulator-practice-plan-first-30-days.json content/published/tr/fpv-simulator-practice-plan-first-30-days.json content/published/tr/fpv-simulator-practice-plan-first-30-days.md
git commit -m "feat(content): translate the simulator practice plan into Turkish"
```

---

### Task 6: Translate the first-radio buying guide (step 3)

**Files:**
- Create: `content/drafts/tr/localizer/how-to-choose-your-first-fpv-radio-without-buying-twice.json`
- Create (generated): `content/published/tr/how-to-choose-your-first-fpv-radio-without-buying-twice.json` and `.md`

**Interfaces:**
- Consumes: the shared Content authoring contract
- Produces: a Turkish artifact paired with `translationOf: "how-to-choose-your-first-fpv-radio-without-buying-twice"`

- [ ] **Step 1: Write the localizer JSON**

Source facts:

- English title: `How to Choose Your First FPV Radio Without Buying Twice`
- English excerpt: `A practical buying guide that helps new pilots choose a radio based on protocol support, ergonomics, and future upgrade path.`
- Source word count: **2922** (Turkish floor)
- `metadata` verbatim:
  ```json
  {"topics":["general-knowledge"],"components":["radio"],"audience":["buyer"],"discipline":["general"],"difficulty":"intermediate","contentType":"buyer-guide","category":"Buyer Guides","buyerGuide":{"products":["RadioMaster Boxer","RadioMaster Pocket","Jumper T-Pro"]}}
  ```
- `internal_links` verbatim:
  ```json
  ["/article/best-fpv-starter-kits-2026-rtf-bundles-for-beginners","/article/best-fpv-goggles-2026","/article/fpv-goggles-buying-guide-analog-vs-digital-for-beginners","/article/how-to-choose-your-first-fpv-radio-without-buying-twice","/article/dji-o3-vs-walksnail-avatar-comparison"]
  ```
- Primary keyword suggestion: `fpv kumanda`

Prices `$100` and `$180` stay byte-identical. Product names (RadioMaster Boxer, RadioMaster Pocket, Jumper T-Pro) stay in Latin script, unaltered.

| id | English section title | source words |
| --- | --- | --- |
| `article-sub-1` | How to Choose Your First FPV Radio Without Buying Twice | 157 |
| `article-sub-2` | Why Your FPV Radio is Your Most Important Investment | 286 |
| `article-sub-3` | Essential Features for a Beginner FPV Radio | 607 |
| `article-sub-4` | Getting Started: Initial Radio Setup & Simulator Integration | 461 |
| `article-sub-5` | Buyer's Guide: Top FPV Radios for Beginners in 2024 | 630 |
| `article-sub-6` | Beyond the Basics: Your First Steps Towards Flying | 401 |
| `article-sub-7` | Frequently Asked Questions About Beginner FPV Radios | 307 |
| `article-sub-8` | Ready for Takeoff: Your FPV Journey Starts Here | 73 |

- [ ] **Step 2: Dry-run the gate**

```bash
pnpm content:translate --slug=how-to-choose-your-first-fpv-radio-without-buying-twice --from-file=content/drafts/tr/localizer/how-to-choose-your-first-fpv-radio-without-buying-twice.json --dry-run
```

Expected: `✓ Gate passed: … (≥2922 words, SEO ≥80)`.

- [ ] **Step 3: Publish**

```bash
pnpm content:translate --slug=how-to-choose-your-first-fpv-radio-without-buying-twice --from-file=content/drafts/tr/localizer/how-to-choose-your-first-fpv-radio-without-buying-twice.json --files-only
```

Expected: `✓ Published content/published/tr/how-to-choose-your-first-fpv-radio-without-buying-twice.json`.

- [ ] **Step 4: Verify the artifact and the preserved prices**

```bash
node -e "const a=require('./content/published/tr/how-to-choose-your-first-fpv-radio-without-buying-twice.json');const t=a.bodySections.map(s=>s.content).join(' ');const w=t.split(/\s+/).filter(Boolean).length;const prices=[...new Set(t.match(/\\\$\\s?\\d[\\d.,]*/g)||[])];console.log({sections:a.bodySections.length,words:w,prices,translationOf:a.translationOf});if(a.bodySections.length!==8||w<2922||a.translationOf!=='how-to-choose-your-first-fpv-radio-without-buying-twice')process.exit(1);if(prices.includes('₺')||/\\bTL\\b/.test(t)){console.error('TL currency introduced');process.exit(1);}"
```

Expected: 8 sections, ≥2922 words, only `$` figures, no `TL`/`₺`.

- [ ] **Step 5: Commit**

```bash
git add content/drafts/tr/localizer/how-to-choose-your-first-fpv-radio-without-buying-twice.json content/published/tr/how-to-choose-your-first-fpv-radio-without-buying-twice.json content/published/tr/how-to-choose-your-first-fpv-radio-without-buying-twice.md
git commit -m "feat(content): translate the first-radio buyer guide into Turkish"
```

---

### Task 7: Translate the RTF starter-kit comparison (step 4)

**Files:**
- Create: `content/drafts/tr/localizer/best-fpv-starter-kits-2026-rtf-bundles-for-beginners.json`
- Create (generated): `content/published/tr/best-fpv-starter-kits-2026-rtf-bundles-for-beginners.json` and `.md`

**Interfaces:**
- Consumes: the shared Content authoring contract
- Produces: a Turkish artifact paired with `translationOf: "best-fpv-starter-kits-2026-rtf-bundles-for-beginners"`

- [ ] **Step 1: Write the localizer JSON**

Source facts:

- English title: `Best FPV Starter Kits 2026: RTF Bundles for Beginners`
- English excerpt: `Compare the best ready-to-fly FPV starter kits and what you need to buy first.`
- Source word count: **2830** (Turkish floor)
- `metadata` verbatim:
  ```json
  {"topics":["general-knowledge"],"components":[],"audience":["new-pilot","buyer"],"discipline":["general"],"difficulty":"beginner","contentType":"buyer-guide","category":"Buyer Guides","buyerGuide":{"products":["BETAFPV Cetus X RTF","RadioMaster Pocket ELRS","Emax Tinyhawk III Plus"]}}
  ```
- `internal_links` verbatim (duplicate entry included as-is in the source):
  ```json
  ["/article/best-fpv-goggles-2026","/article/fpv-goggles-buying-guide-analog-vs-digital-for-beginners","/article/how-to-choose-your-first-fpv-radio-without-buying-twice","/article/how-to-choose-your-first-fpv-radio-without-buying-twice","/article/dji-o3-vs-walksnail-avatar-comparison"]
  ```
- Primary keyword suggestion: `fpv başlangıç seti`

Prices `$150`, `$250`, `$350` stay byte-identical. Kit names stay in Latin script.

| id | English section title | source words |
| --- | --- | --- |
| `article-sub-1` | Unleash the Skies: Your Gateway to FPV Drone Piloting | 302 |
| `article-sub-2` | Decoding the FPV Starter Kit: Essential Components Explained | 538 |
| `article-sub-3` | Ready-to-Fly (RTF) vs. Bind-and-Fly (BNF): Which Path is Right for You? | 302 |
| `article-sub-4` | Matching Your FPV Dreams: Kit Types for Every Pilot & Purpose | 222 |
| `article-sub-5` | The Ultimate Buyer's Guide: Choosing Your First FPV Starter Kit | 420 |
| `article-sub-6` | Top FPV Starter Kits Compared: Finding Your Perfect Match | 550 |
| `article-sub-7` | Frequently Asked Questions About FPV Starter Kits | 322 |
| `article-sub-8` | Your FPV Journey Starts Now: Take Flight with Confidence! | 174 |

- [ ] **Step 2: Dry-run the gate**

```bash
pnpm content:translate --slug=best-fpv-starter-kits-2026-rtf-bundles-for-beginners --from-file=content/drafts/tr/localizer/best-fpv-starter-kits-2026-rtf-bundles-for-beginners.json --dry-run
```

Expected: `✓ Gate passed: … (≥2830 words, SEO ≥80)`.

- [ ] **Step 3: Publish**

```bash
pnpm content:translate --slug=best-fpv-starter-kits-2026-rtf-bundles-for-beginners --from-file=content/drafts/tr/localizer/best-fpv-starter-kits-2026-rtf-bundles-for-beginners.json --files-only
```

Expected: `✓ Published content/published/tr/best-fpv-starter-kits-2026-rtf-bundles-for-beginners.json`.

- [ ] **Step 4: Verify the artifact and the preserved prices**

```bash
node -e "const a=require('./content/published/tr/best-fpv-starter-kits-2026-rtf-bundles-for-beginners.json');const t=a.bodySections.map(s=>s.content).join(' ');const w=t.split(/\s+/).filter(Boolean).length;const prices=[...new Set(t.match(/\\\$\\s?\\d[\\d.,]*/g)||[])];console.log({sections:a.bodySections.length,words:w,prices,translationOf:a.translationOf});if(a.bodySections.length!==8||w<2830||a.translationOf!=='best-fpv-starter-kits-2026-rtf-bundles-for-beginners')process.exit(1);if(/\\bTL\\b|₺/.test(t)){console.error('TL currency introduced');process.exit(1);}"
```

Expected: 8 sections, ≥2830 words, `$` figures only.

- [ ] **Step 5: Commit**

```bash
git add content/drafts/tr/localizer/best-fpv-starter-kits-2026-rtf-bundles-for-beginners.json content/published/tr/best-fpv-starter-kits-2026-rtf-bundles-for-beginners.json content/published/tr/best-fpv-starter-kits-2026-rtf-bundles-for-beginners.md
git commit -m "feat(content): translate the RTF starter-kit comparison into Turkish"
```

---

### Task 8: Translate the LiPo safety guide (step 5)

**Files:**
- Create: `content/drafts/tr/localizer/fpv-lipo-battery-safety-charging-guide-prevent-fires-and-fly-longer.json`
- Create (generated): `content/published/tr/fpv-lipo-battery-safety-charging-guide-prevent-fires-and-fly-longer.json` and `.md`

**Interfaces:**
- Consumes: the shared Content authoring contract
- Produces: a Turkish artifact paired with `translationOf: "fpv-lipo-battery-safety-charging-guide-prevent-fires-and-fly-longer"`

- [ ] **Step 1: Write the localizer JSON**

Source facts:

- English title: `FPV LiPo Battery Safety & Charging Guide: Prevent Fires and Fly Longer`
- English excerpt: `A comprehensive safety and configuration guide explaining how LiPo batteries work, safe charging rates (1C), storage voltage (3.8-3.85V), parallel charging, and how to safely dispose of damaged cells.`
- Source word count: **3376** (Turkish floor)
- `metadata` verbatim:
  ```json
  {"topics":["batteries"],"components":[],"audience":["pilot"],"discipline":["general"],"difficulty":"intermediate","contentType":"tutorial"}
  ```
- `internal_links`: `["/article/best-fpv-starter-kits-2026-rtf-bundles-for-beginners"]` (the source has none; this is the one permitted addition — the kits guide is where batteries are actually bought, and it resolves to the Turkish tree once Task 7 publishes)
- Primary keyword suggestion: `lipo batarya güvenliği`

Voltages, C-rates, storage voltages, and disposal steps are copied from the English source unchanged. Do not add Turkish-specific rules.

| id | English section title | source words |
| --- | --- | --- |
| `article-sub-1` | FPV LiPo Battery Safety & Charging Guide: Prevent Fires and Fly Longer | 14 |
| `article-sub-2` | Unleash Your Drone's True Power: Why Mastering FPV LiPo Batteries is Non-Negotiable | 145 |
| `article-sub-3` | Decoding the Powerhouse: What Makes an FPV LiPo Tick? | 593 |
| `article-sub-4` | Choosing Your Drone's Lifeline: Finding the Perfect FPV LiPo | 459 |
| `article-sub-5` | The Art of Charging: Maximizing Life and Ensuring Safety | 519 |
| `article-sub-6` | Beyond the Flight: Proper Storage and Maintenance for Longevity | 398 |
| `article-sub-7` | When to Retire: Troubleshooting and Safe LiPo Disposal | 505 |
| `article-sub-8` | The FPV Pilot's Arsenal: A Buyer's Guide to LiPo Batteries & Accessories | 357 |
| `article-sub-9` | FPV LiPo FAQs: Your Burning Questions Answered | 287 |
| `article-sub-10` | Conclusion: Master Your Power, Master Your Flight | 99 |

- [ ] **Step 2: Dry-run the gate**

```bash
pnpm content:translate --slug=fpv-lipo-battery-safety-charging-guide-prevent-fires-and-fly-longer --from-file=content/drafts/tr/localizer/fpv-lipo-battery-safety-charging-guide-prevent-fires-and-fly-longer.json --dry-run
```

Expected: `✓ Gate passed: … (≥3376 words, SEO ≥80)`.

- [ ] **Step 3: Publish**

```bash
pnpm content:translate --slug=fpv-lipo-battery-safety-charging-guide-prevent-fires-and-fly-longer --from-file=content/drafts/tr/localizer/fpv-lipo-battery-safety-charging-guide-prevent-fires-and-fly-longer.json --files-only
```

Expected: `✓ Published content/published/tr/fpv-lipo-battery-safety-charging-guide-prevent-fires-and-fly-longer.json`.

- [ ] **Step 4: Verify the artifact**

```bash
node -e "const a=require('./content/published/tr/fpv-lipo-battery-safety-charging-guide-prevent-fires-and-fly-longer.json');const w=a.bodySections.reduce((n,s)=>n+s.content.split(/\s+/).filter(Boolean).length,0);console.log({sections:a.bodySections.length,words:w,translationOf:a.translationOf});if(a.bodySections.length!==10||w<3376||a.translationOf!=='fpv-lipo-battery-safety-charging-guide-prevent-fires-and-fly-longer')process.exit(1);"
```

Expected: 10 sections, ≥3376 words, exit 0.

- [ ] **Step 5: Commit**

```bash
git add content/drafts/tr/localizer/fpv-lipo-battery-safety-charging-guide-prevent-fires-and-fly-longer.json content/published/tr/fpv-lipo-battery-safety-charging-guide-prevent-fires-and-fly-longer.json content/published/tr/fpv-lipo-battery-safety-charging-guide-prevent-fires-and-fly-longer.md
git commit -m "feat(content): translate the LiPo battery safety guide into Turkish"
```

---

### Task 9: Translate the first-hover protocol (step 6)

**Files:**
- Create: `content/drafts/tr/localizer/first-hover-training.json`
- Create (generated): `content/published/tr/first-hover-training.json` and `.md`

**Interfaces:**
- Consumes: the shared Content authoring contract
- Produces: a Turkish artifact paired with `translationOf: "first-hover-training"`

- [ ] **Step 1: Write the localizer JSON**

Source facts:

- English title: `First Hover Training: The Perfect Manual Takeoff Protocol`
- English excerpt: `A step-by-step procedure for your first battery in the real world. Learn physical layout checks, proper arming protocols, throttle hovering, and crash avoidance.`
- Source word count: **2761** (Turkish floor)
- `metadata` verbatim:
  ```json
  {"topics":["general-knowledge"],"components":[],"audience":["pilot"],"discipline":["general"],"difficulty":"intermediate","contentType":"guide"}
  ```
- `internal_links`: `["/article/fpv-simulator-practice-plan-first-30-days"]` (the source has none; this is the one permitted addition — the simulator plan is the prerequisite for this drill, and it resolves to the Turkish tree once Task 5 publishes)
- Primary keyword suggestion: `ilk hover`

| id | English section title | source words |
| --- | --- | --- |
| `article-sub-1` | First Hover Training: The Perfect Manual Takeoff Protocol | 112 |
| `article-sub-2` | The Foundation: Deconstructing FPV Controls for Hover | 470 |
| `article-sub-3` | The Crawl: Mastering Muscle Memory in the Simulator | 344 |
| `article-sub-4` | Pre-Flight Protocols: Setting the Stage for Real-World Success | 410 |
| `article-sub-5` | The Walk: Your First Real-World Hover Attempts | 384 |
| `article-sub-6` | Troubleshooting & Refining Your Hover Technique | 283 |
| `article-sub-7` | Essential Gear for Your Hover Journey | 321 |
| `article-sub-8` | Frequently Asked Questions About First Hover Training | 437 |

- [ ] **Step 2: Dry-run the gate**

```bash
pnpm content:translate --slug=first-hover-training --from-file=content/drafts/tr/localizer/first-hover-training.json --dry-run
```

Expected: `✓ Gate passed: … (≥2761 words, SEO ≥80)`.

- [ ] **Step 3: Publish**

```bash
pnpm content:translate --slug=first-hover-training --from-file=content/drafts/tr/localizer/first-hover-training.json --files-only
```

Expected: `✓ Published content/published/tr/first-hover-training.json`.

- [ ] **Step 4: Verify the artifact**

```bash
node -e "const a=require('./content/published/tr/first-hover-training.json');const w=a.bodySections.reduce((n,s)=>n+s.content.split(/\s+/).filter(Boolean).length,0);console.log({sections:a.bodySections.length,words:w,translationOf:a.translationOf});if(a.bodySections.length!==8||w<2761||a.translationOf!=='first-hover-training')process.exit(1);"
```

Expected: 8 sections, ≥2761 words, exit 0.

- [ ] **Step 5: Commit**

```bash
git add content/drafts/tr/localizer/first-hover-training.json content/published/tr/first-hover-training.json content/published/tr/first-hover-training.md
git commit -m "feat(content): translate the first-hover protocol into Turkish"
```

---

### Task 10: Write the original Turkish regulation summary (step 5)

**Files:**
- Create: `content/drafts/tr/shy-iha-drone-rules-for-beginners-in-turkey.json`
- Create (generated): `content/published/tr/shy-iha-drone-rules-for-beginners-in-turkey.json` and `.md`

**Interfaces:**
- Consumes: `pnpm content:publish-original` (Task 3), `PublishedArtifact.origin` (Task 1)
- Produces: the only Turkish artifact with `origin: "tr"` and no `translationOf`

- [ ] **Step 1: Collect and verify the official sources**

Search only official domains (SHGM, `mevzuat.gov.tr`, the official SHY-İHA text). For each candidate URL, verify it resolves before it may be cited:

```bash
for u in "<candidate-url-1>" "<candidate-url-2>"; do
  printf '%s ' "$u"
  curl -s -o /dev/null -w '%{http_code}\n' -L --max-time 20 "$u"
done
```

Expected: `200` for every URL that will be cited. Record the final URL and page title for each. Any URL that is not `200`, is a PDF you cannot verify, or is not on an official domain is dropped. If fewer than two official pages verify, stop this task, report the finding, and leave step 5 with the translated LiPo article only (the step still meets the "at least one Turkish article" goal).

- [ ] **Step 2: Write the article JSON**

Create `content/drafts/tr/shy-iha-drone-rules-for-beginners-in-turkey.json` with this shape:

```json
{
  "slug": "shy-iha-drone-rules-for-beginners-in-turkey",
  "title": "SHY-İHA: Yeni Başlayanlar İçin Türkiye'de Drone Kuralları",
  "excerpt": "Türkiye'de İHA uçuşlarına başlamadan önce bilinmesi gereken resmî çerçevenin, her iddiası kaynağına bağlı bir özeti.",
  "category": "Regulations",
  "template": "regulation-guide",
  "seo": {
    "metaDescription": "120-160 karakter arası Türkçe meta açıklama; ana anahtar kelimeyi içerir.",
    "keywords": ["drone kuralları", "shy iha", "iha mevzuatı"]
  },
  "bodySections": [
    { "id": "kapsam", "title": "Kapsam ve Tanımlar", "content": "..." },
    { "id": "kayit", "title": "Kayıt ve Yeterlilik", "content": "..." },
    { "id": "izin", "title": "Uçuş Öncesi İzin ve Alan Kontrolü", "content": "..." },
    { "id": "guvenlik", "title": "Güvenlik ve Sorumluluk", "content": "..." },
    { "id": "hatalar", "title": "Yeni Başlayanların Sık Yaptığı Hatalar", "content": "..." },
    { "id": "kaynakca", "title": "Resmî Kaynaklar", "content": "..." }
  ],
  "internalLinks": ["/regulations"],
  "publishNotes": ["Türkçe özgün içerik; her iddia Resmî Kaynaklar bölümündeki resmî sayfalara dayanır."],
  "metadata": {
    "difficulty": "beginner",
    "contentType": "reference",
    "topics": ["regulations"],
    "audience": ["new-pilot"],
    "discipline": ["general"]
  },
  "sourceReferences": [
    "<verified-official-url-1>",
    "<verified-official-url-2>"
  ]
}
```

Content rules, enforced by the reviewer and the gate:

- The block above is a schema, not the article. Replace every placeholder before running the gate: write a real 120–160 character `metaDescription`, replace all six `content` values with prose, and replace both `sourceReferences` entries with the URLs verified in Step 1. `kaynakca` must then list those same URLs.
- `keywords[0]` is `drone kuralları`, which the title already contains. Keep it at 1.5–2.5% density across the body — roughly 21–35 occurrences in a 1400-word body; the dry run prints a density blocker if it slips outside that band. `shy iha` stays as a secondary keyword only: `İ` lowercases to `i̇` (dotted i + combining mark), so the ASCII phrase can never match a title written `SHY-İHA`.
- Every factual claim (registration requirement, pilot competency, permission, altitude/distance limit, insurance) is written only if it appears on a verified official page, and the section names that page in prose, e.g. `(Kaynak: SHGM — İHA Kayıt Sistemi sayfası)`.
- If a limit has a number, copy the exact number and unit from the cited page. If the source is ambiguous or you cannot confirm it, omit the claim and say the official page should be checked before flying.
- No TL currency figures, no fees, no fines.
- No claim about which drones are "allowed" in a specific city without an official source.
- `kaynakca` lists every cited URL in plain text with a one-line description, and matches `sourceReferences` exactly.
- Body ≥1200 words (aim 1400–1800) and written in Turkish.

- [ ] **Step 3: Dry-run the gate**

```bash
pnpm content:publish-original --file=content/drafts/tr/shy-iha-drone-rules-for-beginners-in-turkey.json --dry-run
```

Expected: `✓ Gate passed: tr/shy-iha-drone-rules-for-beginners-in-turkey (<N> words, SEO <S>)`, with `N` ≥ 1200 and `S` in 80–90.

- [ ] **Step 4: Publish**

```bash
pnpm content:publish-original --file=content/drafts/tr/shy-iha-drone-rules-for-beginners-in-turkey.json --files-only
```

Expected: `✓ Published content/published/tr/shy-iha-drone-rules-for-beginners-in-turkey.json`.

- [ ] **Step 5: Verify the artifact, the marker, and the sources**

```bash
node -e "const a=require('./content/published/tr/shy-iha-drone-rules-for-beginners-in-turkey.json');const w=a.bodySections.reduce((n,s)=>n+s.content.split(/\s+/).filter(Boolean).length,0);console.log({locale:a.locale,origin:a.origin,translationOf:a.translationOf,sections:a.bodySections.length,words:w,refs:a.sourceReferences.length});if(a.locale!=='tr'||a.origin!=='tr'||a.translationOf!==undefined||w<1200||a.sourceReferences.length===0)process.exit(1);if(!a.sourceReferences.every(u=>u.startsWith('https://')))process.exit(1);"
```

Expected: `{ locale: 'tr', origin: 'tr', translationOf: undefined, sections: 6, words: ≥1200, refs: ≥2 }`, exit 0.

Then confirm every cited URL still resolves:

```bash
node -e "const a=require('./content/published/tr/shy-iha-drone-rules-for-beginners-in-turkey.json');console.log(a.sourceReferences.join('\n'))" | while read -r u; do printf '%s ' "$u"; curl -s -o /dev/null -w '%{http_code}\n' -L --max-time 20 "$u"; done
```

Expected: `200` for each.

- [ ] **Step 6: Commit**

```bash
git add content/drafts/tr/shy-iha-drone-rules-for-beginners-in-turkey.json content/published/tr/shy-iha-drone-rules-for-beginners-in-turkey.json content/published/tr/shy-iha-drone-rules-for-beginners-in-turkey.md
git commit -m "feat(content): publish an original Turkish SHY-IHA beginner summary"
```

---

### Task 11: Wire the Turkish start steps to the new articles

**Files:**
- Modify: `src/lib/i18n/start-steps.ts:80-124`
- Test: `scripts/locale-regression-test.ts`

**Interfaces:**
- Consumes: `StartStep`, published Turkish artifacts from Tasks 5–10
- Produces: six Turkish steps with no `page` fallback and at least one `articleSlugs` entry each

- [ ] **Step 1: Write the failing tests**

Append before `let failed = 0;` in `scripts/locale-regression-test.ts`:

```ts
check('Turkish start steps never fall back to an English page', () => {
  for (const step of START_STEPS.tr) {
    assert.equal(step.page, undefined, `${step.title} still links an untranslated page`);
  }
});

check('every Turkish start step has a published Turkish article', () => {
  const trSlugs = new Set(listPublishedContent('tr').map((artifact) => artifact.slug));
  for (const step of START_STEPS.tr) {
    assert.ok(step.articleSlugs.length > 0, `${step.title} has no Turkish article`);
    for (const slug of step.articleSlugs) {
      assert.ok(trSlugs.has(slug), `missing Turkish artifact: ${slug}`);
    }
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm locale:test`
Expected: FAIL — several Turkish steps still carry `page`, and steps 2–6 have no slugs.

- [ ] **Step 3: Rewire the Turkish steps**

In `src/lib/i18n/start-steps.ts`, replace the six `tr` entries' `articleSlugs` and delete every `page` key in the `tr` array. The `en` array stays byte-identical.

```ts
  tr: [
    {
      title: 'FPV nedir, anla',
      why: 'FPV (birinci şahıs görüntü), drone kamerasından gelen canlı görüntüyü gözlükle görerek uçmak demektir. FPV uçuşunun büyük kısmı tamamen manueldir; bu yüzden satın almadan önce pratik gelir.',
      todo: ['Bir genel bakış rehberini baştan sona oku', 'Bilmediğin terimler için sözlüğü işaretle'],
      articleSlugs: ['fpv-beginner-setup-guide-the-easiest-way-to-get-flying'],
    },
    {
      title: 'Simülatörde pratik yap',
      why: 'Simülatörde çarpmak bedava. Çubuk kontrolünü burada kurmak, ileride kırılan parça ve hayal kırıklığından tasarruf ettirir.',
      todo: ['Bir simülatör seç', 'Hover ve yumuşak dönüşleri doğal hissedene kadar tekrarla'],
      articleSlugs: ['fpv-simulator-practice-plan-first-30-days'],
    },
    {
      title: 'Kumandanı al',
      why: 'Kumanda şimdi simülatörle, sonra drone ile çalışır. Genellikle en uzun süre elinde tuttuğun ekipmandır.',
      todo: ['El ölçüne ve bütçene uyan bir kumanda seç', 'Kur ve simülatörde kullan'],
      articleSlugs: ['how-to-choose-your-first-fpv-radio-without-buying-twice'],
    },
    {
      title: 'İlk drone ve gözlüğünü seç',
      why: 'Uçmaya hazır bir set veya tiny whoop ile başla. Havalanmak için lehim ya da drone toplamak gerekmez.',
      todo: ['Bütçeye göre hazır setleri karşılaştır', 'Analog ve dijital görüntü arasında karar ver'],
      articleSlugs: ['best-fpv-starter-kits-2026-rtf-bundles-for-beginners'],
    },
    {
      title: 'Kuralları ve batarya güvenliğini öğren',
      why: 'Drone kuralları ülkeye göre değişir. Dışarıda uçmadan önce bulunduğun ülkenin havacılık kurumunu kontrol et ve LiPo bataryaları güvenli şarj etmeyi öğren.',
      todo: ['Yaşadığın yerdeki drone kurallarını kontrol et', 'Güvenli LiPo şarj ve saklama öğren'],
      articleSlugs: [
        'shy-iha-drone-rules-for-beginners-in-turkey',
        'fpv-lipo-battery-safety-charging-guide-prevent-fires-and-fly-longer',
      ],
      maxArticles: 2,
    },
    {
      title: 'İlk uçuşunu yap',
      why: 'Açık ve boş bir alan seç, hızlı bir uçuş öncesi kontrol yap ve kısa, yumuşak hoverlarla başla.',
      todo: ['Birkaç kısa ve alçak hover yap', 'Bir şey çalışmazsa neyi kontrol edeceğini bil'],
      articleSlugs: ['first-hover-training'],
    },
  ],
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm locale:test`
Expected: PASS, including both new checks.

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n/start-steps.ts scripts/locale-regression-test.ts
git commit -m "feat(i18n): point every Turkish academy step at Turkish articles"
```

---

### Task 12: Full local verification

**Files:**
- No source changes. Fix regressions in the task that introduced them.

**Interfaces:**
- Consumes: everything from Tasks 1–11

- [ ] **Step 1: Run the content and locale suites**

```bash
pnpm locale:test
pnpm locale:localizer-test
pnpm content:original-test
pnpm content:language-audit
pnpm seo:discoverability-test
pnpm metadata:test
```

Expected: every suite prints its pass line and exits 0. `content:language-audit` must report 160 artifacts (154 + 6 new Turkish articles) with no failures.

- [ ] **Step 2: Typecheck and lint**

```bash
./node_modules/.bin/tsc --noEmit
pnpm lint
```

Expected: no errors, no new warnings.

- [ ] **Step 3: Build with no dev server running**

```bash
pgrep -fl "next dev" || true
pnpm build
```

Expected: `Compiled successfully`. If `next dev` is running, stop it first — the build removes `.next`.

- [ ] **Step 4: Start the production build and verify the academy**

```bash
./node_modules/.bin/next start -p 3011 &
until curl -sf -o /dev/null http://localhost:3011/tr/academy; do sleep 1; done
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3011/tr/academy
curl -s http://localhost:3011/tr/academy | grep -o '/tr/article/[a-z0-9-]*' | sort -u
```

Expected: `200`; the unique list is exactly these seven URLs:

```
/tr/article/best-fpv-starter-kits-2026-rtf-bundles-for-beginners
/tr/article/first-hover-training
/tr/article/fpv-beginner-setup-guide-the-easiest-way-to-get-flying
/tr/article/fpv-lipo-battery-safety-charging-guide-prevent-fires-and-fly-longer
/tr/article/fpv-simulator-practice-plan-first-30-days
/tr/article/how-to-choose-your-first-fpv-radio-without-buying-twice
/tr/article/shy-iha-drone-rules-for-beginners-in-turkey
```

The "no English page as the only next action" rule is enforced by the `START_STEPS.tr` unit checks in Task 11, not by grepping the rendered page: the Turkish footer legitimately links `/regulations` and `/academy/glossary`, so a page-level grep cannot distinguish step links from chrome links.

- [ ] **Step 5: Verify each Turkish article page and its hreflang behaviour**

```bash
for slug in fpv-simulator-practice-plan-first-30-days how-to-choose-your-first-fpv-radio-without-buying-twice best-fpv-starter-kits-2026-rtf-bundles-for-beginners fpv-lipo-battery-safety-charging-guide-prevent-fires-and-fly-longer first-hover-training shy-iha-drone-rules-for-beginners-in-turkey; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3011/tr/article/$slug")
  tags=$(curl -s "http://localhost:3011/tr/article/$slug" | grep -o -i 'hreflang' | wc -l | tr -d ' ')
  echo "$slug status=$code hreflang_attr_count=$tags"
done
```

Expected:

- the five translations: `status=200`, `hreflang_attr_count=6` (three links, each with the attribute name in `rel`/`hreflang`);
- the original: `status=200`, `hreflang_attr_count=0`.

- [ ] **Step 6: Verify the sitemap**

```bash
curl -s http://localhost:3011/sitemap.xml | grep -c '<loc>'
curl -s http://localhost:3011/sitemap.xml | grep -A 4 'shy-iha-drone-rules-for-beginners-in-turkey'
```

Expected: `<loc>` count is the pre-task count plus 6 (one Turkish URL per new article: five translations and one original); the original's `<url>` block contains no `xhtml:link`.

- [ ] **Step 7: Stop the server and commit nothing**

```bash
kill %1 2>/dev/null || pkill -f "next start -p 3011"
git status --short
```

Expected: clean working tree (everything already committed per task). If a fix was needed, commit it in the task it belongs to before this step.

---

### Task 13: Deploy and verify production (requires explicit approval)

**Files:**
- No source changes.

**Interfaces:**
- Consumes: the pushed `main` branch, Coolify application `jnlhgqmjnqwpdgefsoskew5n`

- [ ] **Step 1: Ask for approval**

Ask the user before pushing or triggering Coolify. Do not push or deploy on the strength of this plan alone.

- [ ] **Step 2: Push and queue the deployment**

```bash
git push origin main
ssh affexai-prod 'docker exec coolify php artisan tinker --execute="\$a = App\\Models\\Application::where(\"uuid\",\"jnlhgqmjnqwpdgefsoskew5n\")->first(); \$u = new_public_id(); \$r = queue_application_deployment(application: \$a, deployment_uuid: \$u, force_rebuild: true, is_api: true, no_questions_asked: true); echo json_encode([\"deployment_uuid\"=>\$u, \"result\"=>\$r]);"'
```

Note: the commit SHA is null for API-triggered deploys, so the deployment row is not proof of the deployed code. Verify by image tag in Step 3.

- [ ] **Step 3: Verify the running image**

```bash
ssh affexai-prod 'docker ps --format "{{.Image}}" | grep jnlhgqmjnqwpdgefsoskew5n'
```

Expected: the image tag starts with the short SHA of the pushed commit. If the tag is unchanged after the deployment finishes, re-queue the deployment and re-check — a UI-triggered or API-triggered deploy can silently no-op.

- [ ] **Step 4: Verify production content**

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://fpvlovers.com.tr/tr/academy
curl -s https://fpvlovers.com.tr/tr/academy | grep -o '/tr/article/[a-z0-9-]*' | sort -u | wc -l
for slug in fpv-simulator-practice-plan-first-30-days how-to-choose-your-first-fpv-radio-without-buying-twice best-fpv-starter-kits-2026-rtf-bundles-for-beginners fpv-lipo-battery-safety-charging-guide-prevent-fires-and-fly-longer first-hover-training; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://fpvlovers.com.tr/tr/article/$slug")
  tags=$(curl -s "https://fpvlovers.com.tr/tr/article/$slug" | grep -o -i 'hreflang' | wc -l | tr -d ' ')
  echo "$slug status=$code hreflang_attr_count=$tags"
done
curl -s -o /dev/null -w '%{http_code}\n' https://fpvlovers.com.tr/tr/article/shy-iha-drone-rules-for-beginners-in-turkey
curl -s https://fpvlovers.com.tr/tr/article/shy-iha-drone-rules-for-beginners-in-turkey | grep -o -i 'hreflang' | wc -l
curl -s https://fpvlovers.com.tr/sitemap.xml | grep -c '<loc>'
```

Expected: `/tr/academy` returns `200` and links 7 unique Turkish articles; the five translations return `200` with 6 `hreflang` attributes each; the original returns `200` with `0`; the sitemap contains 6 more `<loc>` entries than before this work.

- [ ] **Step 5: Confirm the English tree is unchanged**

```bash
for url in /article/fpv-simulator-practice-plan-first-30-days /article/first-hover-training /academy /guides; do
  printf '%s ' "$url"
  curl -s -o /dev/null -w '%{http_code}\n' "https://fpvlovers.com.tr$url"
done
```

Expected: `200` for each. English titles and URLs are untouched; only additive JSON-LD/hreflang may differ.

---

## Self-Review

**Spec coverage**

| Spec item | Task |
| --- | --- |
| `origin: "tr"` contract (type, publisher, audit, tests) | 1 |
| Original article appears in sitemap with no alternates | 2 |
| Authoring path for an original Turkish article | 3, 10 |
| Image repair before translating (DB pass, coverage measured, shadow sync) | 4 |
| Step 2 translation (simulator) | 5 |
| Step 3 translation (radio) | 6 |
| Step 4 translation (starter kits) | 7 |
| Step 5 translation (LiPo) | 8 |
| Step 6 translation (first hover) | 9 |
| Step 5 original (SHGM / SHY-İHA) | 10 |
| Step wiring: drop `page`, add slugs | 11 |
| Verification suite and per-article checks | 12 |
| Deploy and live verification | 13 |

**Placeholder scan:** the regulation article's prose and meta description are authored in Task 10 Step 2 under explicit sourcing rules; the plan cannot pre-write official claims without the verified URLs that Step 1 collects, and Step 2 names every value that must be replaced before the gate runs. All code steps contain complete code, and every command has an expected output.

**Gate arithmetic:** the Task 3 fixture was measured against the real `computeSeoScore` (1818 body words, 1.97% density, 141-char meta, one internal link, keyword in title) → 90 with only the media reason, and 55 once `keywords` is emptied. The same 90 ceiling applies to every article in Tasks 5–10 because `computeSeoScore` runs before media is attached.

**Link policy:** three translations have no internal links in their English source (Tasks 5, 8, 9). Each gets exactly one related link, named in the task, to an article that resolves inside the Turkish tree once its own task publishes. Rule 6 of the authoring contract is what permits that single addition.

**Type consistency:** `PublishOrigin` is introduced in Task 1 and used by `publish-original-article.ts` in Task 3 via `origin: 'tr'`. `OriginalArticleInput` fields in Task 3's test match the JSON authored in Task 10. Step ids used in Task 7 match the artifacts produced in Tasks 5–10 (`article-sub-N` for translations, the six named ids for the original).
