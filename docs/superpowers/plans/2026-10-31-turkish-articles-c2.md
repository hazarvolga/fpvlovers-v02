# Turkish Articles (C2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the first real Turkish article at `/tr/article/[slug]`, persisted with `locale='tr'` and an explicit `translationOf` pairing, produced by a new Dify "localized rewrite" workflow contract.

**Architecture:** The Turkish article tree gets its own Route Handler page that reads only Turkish artifacts (`content/published/tr` merged with `published_articles_shadow WHERE locale='tr'`) and never falls back to English seeds. Publishing gains locale-scoped output (`content/published/tr/`, artifact `locale` + `translationOf` + `metadata`), and the Dify localizer rewrites an English guide into Turkish while the app keeps ownership of slugs, section ids, media and publish gates. Sitemap/hreflang pairing moves from "same slug" to `translationOf`, which is the only honest pairing signal.

**Tech Stack:** Next.js 15.4.9 App Router, React 19, TypeScript, Node `tsx` regression scripts, Dify v1.14.0 workflow API, PostgreSQL `fpvlovers_app.published_articles_shadow` (keyed `(slug, locale)` by migration `0010`).

**Spec:** `docs/superpowers/specs/2026-10-30-turkish-secondary-locale-design.md` (lines 56-58, 69, 121-129 define `translationOf`, the Turkish file tree, and the "real content only" hreflang rule). Task 5 adds the runtime contract doc `docs/superpowers/specs/2026-10-31-dify-content-localizer-tr.md`.

## Global Constraints

- English site copy, English URLs, and the English article page's visible output stay unchanged. Only additive JSON-LD/hreflang metadata may appear on English pages.
- Turkish article slugs are byte-identical to the English source slug. The localizer never transliterates slugs.
- Every Turkish artifact MUST carry `locale: "tr"` and `translationOf: "<english-slug>"`. `translationOf` is the only pairing source for hreflang, sitemap, and related links.
- Turkish artifacts are written only to `content/published/tr/` and to `published_articles_shadow` rows with `locale='tr'`. Never write a Turkish artifact into `content/published/` root.
- Never log or read `.env` contents. New token names go into `.env.example` only.
- Do not write prices, stock, or specifications without verification (`Fiyat/spec doğrulamadan içerik yazma`). Do not hallucinate SHY/SHGM rules (`SHY/SHGM konularında halüsinasyon`). Do not recommend products without RAG evidence (`RAG sonucu olmadan ürün önerme`).
- Regulation content is generated from the Turkish RAG lane, never machine-translated. Product reviews require a human editor in the target language.
- No n8n/n8nac references in code or docs. Coolify-native only; never touch AffeXAI Cortex or Bimmetraj.
- Conventional Commits (`type(scope): description`). Use `pnpm` and `./node_modules/.bin/*`; there is no working `npm` in this repo.
- Before editing any symbol, run `node .gitnexus/run.cjs impact "<symbol>" --direction upstream --repo .`; before every commit, run `node .gitnexus/run.cjs detect-changes --scope all --repo .` and treat `partial: true`, `truncated: true`, or `UNKNOWN` as unresolved.
- Regression tests are append-only. Add new checks to `scripts/locale-regression-test.ts` or a new `scripts/*-regression-test.ts`; do not delete existing checks except where a task explicitly replaces one.

---

### Task 1: Article path helpers and the translation pairing contract

**Files:**
- Modify: `src/lib/i18n/locale.ts`
- Modify: `src/lib/content-automation/content-reader.ts:94-109`
- Test: `scripts/locale-regression-test.ts`

**Interfaces:**
- Produces: `localizeArticlePath(slug: string, locale: Locale): string`
- Produces: `localizeArticleLink(link: string, locale: Locale, translatedSlugs: ReadonlySet<string>): string`
- Produces: `PublishedArtifact.translationOf?: string`
- Produces: `isTranslationPair(sourceSlug: string, candidate: PublishedArtifact | null | undefined): boolean`

- [ ] **Step 1: Write the failing tests**

Append before `let failed = 0;` in `scripts/locale-regression-test.ts`, and add `localizeArticleLink`, `localizeArticlePath` to the `@/lib/i18n/locale` import and `isTranslationPair` to the `content-reader` import:

```ts
check('article paths localize without changing the slug', () => {
  assert.equal(localizeArticlePath('fpv-kit', 'en'), '/article/fpv-kit');
  assert.equal(localizeArticlePath('fpv-kit', 'tr'), '/tr/article/fpv-kit');
  assert.equal(localizeArticlePath('a b/c', 'tr'), '/tr/article/a%20b%2Fc');
});

check('article links switch to the Turkish tree only for published translations', () => {
  const translated = new Set(['fpv-kit']);
  assert.equal(localizeArticleLink('/article/fpv-kit', 'tr', translated), '/tr/article/fpv-kit');
  assert.equal(localizeArticleLink('/article/fpv-kit', 'en', translated), '/article/fpv-kit');
  assert.equal(localizeArticleLink('/article/other', 'tr', translated), '/article/other');
  assert.equal(localizeArticleLink('/guides', 'tr', translated), '/guides');
  assert.equal(localizeArticleLink('/article/fpv-kit?ref=x', 'tr', translated), '/tr/article/fpv-kit?ref=x');
});

check('translation pairing requires an explicit translationOf', () => {
  const translated = { translationOf: 'fpv-kit', slug: 'fpv-kit' } as PublishedArtifact;
  const sameSlugOnly = { slug: 'fpv-kit' } as PublishedArtifact;
  assert.equal(isTranslationPair('fpv-kit', translated), true);
  assert.equal(isTranslationPair('fpv-kit', sameSlugOnly), false);
  assert.equal(isTranslationPair('fpv-kit', null), false);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm locale:test`
Expected: FAIL — `localizeArticlePath is not a function` / `isTranslationPair is not exported`.

- [ ] **Step 3: Implement the helpers**

Add to `src/lib/i18n/locale.ts` after `localizePath`:

```ts
/** Article URLs are not in TRANSLATED_PATHS; the Turkish tree carries its own prefix. */
export function localizeArticlePath(slug: string, locale: Locale): string {
  const encoded = encodeURIComponent(slug);
  return locale === DEFAULT_LOCALE ? `/article/${encoded}` : `${TR_PREFIX}/article/${encoded}`;
}

/**
 * Rewrites an `/article/<slug>` link for the Turkish tree only when a Turkish
 * artifact exists for that slug. Untranslated targets stay on the English URL
 * so navigation never points at a 404.
 */
export function localizeArticleLink(
  link: string,
  locale: Locale,
  translatedSlugs: ReadonlySet<string>,
): string {
  const normalized = link.startsWith('/') ? link : `/${link}`;
  const match = normalized.match(/^\/article\/([^/?#]+)(.*)$/);
  if (!match) return normalized;
  const slug = decodeURIComponent(match[1]);
  const suffix = match[2];
  if (locale === 'tr' && translatedSlugs.has(slug)) {
    return `${localizeArticlePath(slug, 'tr')}${suffix}`;
  }
  return `/article/${encodeURIComponent(slug)}${suffix}`;
}
```

Add `translationOf` to `PublishedArtifact` in `src/lib/content-automation/content-reader.ts`:

```ts
export type PublishedArtifact = GeneratedContent & {
  slug: string;
  jobId: string;
  category: string;
  template: string;
  publishedAt: string;
  promptVersion: string;
  jobStatus: string;
  locale?: Locale;
  /** English slug this artifact translates; the only honest pairing source. */
  translationOf?: string;
  media?: ContentMedia;
  coverImage?: string;
  metadata?: ContentMetadata;
  editorial?: EditorialRecord;
  sourceHints?: string[];
  sourceReferences?: string[];
};
```

Add after the type:

```ts
export function isTranslationPair(
  sourceSlug: string,
  candidate: PublishedArtifact | null | undefined,
): boolean {
  return candidate?.translationOf === sourceSlug;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm locale:test`
Expected: PASS — the three new checks print `✓` and the suite exits 0.

- [ ] **Step 5: Graph check and commit**

```bash
node .gitnexus/run.cjs detect-changes --scope all --repo .
git add src/lib/i18n/locale.ts src/lib/content-automation/content-reader.ts scripts/locale-regression-test.ts
git commit -m "feat(i18n): add article path helpers and translation pairing contract"
```

---

### Task 2: Turkish article route with a reciprocal hreflang cluster

**Files:**
- Create: `src/lib/seo/article-alternates.ts`
- Create: `src/app/tr/article/[slug]/page.tsx`
- Modify: `src/lib/seo/metadata.ts:58-96`
- Modify: `src/app/(en)/article/[slug]/page.tsx:55-84,134-147`
- Test: `scripts/locale-regression-test.ts`, `scripts/seo-discoverability-regression-test.ts`

**Interfaces:**
- Consumes: `localizeArticlePath`, `localizeArticleLink`, `isTranslationPair`, `getPublishedContentBySlugAsync(slug, 'tr')`.
- Produces: `buildArticleAlternates(slug: string, hasEnglish: boolean, hasTurkish: boolean): Record<string, string>`
- Produces: `generateArticleSchema({ ..., inLanguage?: string })`

- [ ] **Step 1: Write the failing tests**

Add to `scripts/seo-discoverability-regression-test.ts` (top imports and bottom):

```ts
import { buildArticleAlternates } from '../src/lib/seo/article-alternates';
```

```ts
const paired = buildArticleAlternates('test-guide', true, true);
assert.equal(paired.en, 'https://fpvlovers.com.tr/article/test-guide');
assert.equal(paired.tr, 'https://fpvlovers.com.tr/tr/article/test-guide');
assert.equal(paired['x-default'], paired.en);
assert.deepEqual(buildArticleAlternates('test-guide', true, false), {});
assert.deepEqual(buildArticleAlternates('test-guide', false, true), {});

const localizedSchema = generateArticleSchema({
  title: 'Test guide',
  description: 'Test description',
  url: 'https://fpvlovers.com.tr/tr/article/test-guide',
  inLanguage: 'tr',
});
assert.equal((localizedSchema as { inLanguage?: string }).inLanguage, 'tr');
assert.equal('inLanguage' in articleSchema, false);
```

Add to `scripts/locale-regression-test.ts`:

```ts
check('Turkish article route reads only Turkish artifacts', () => {
  const source = readFileSync('src/app/tr/article/[slug]/page.tsx', 'utf8');
  assert.match(source, /getPublishedContentBySlugAsync\(slug, 'tr'\)/);
  assert.match(source, /if \(!article\) notFound\(\)/, 'missing Turkish artifacts must 404');
  assert.doesNotMatch(source, /firstWaveContentPlan/, 'no English editorial-plan shells in the Turkish tree');
  assert.doesNotMatch(source, /fetchEditorialInsights/, 'no legacy English insights in the Turkish tree');
  assert.match(source, /inLanguage: 'tr'/);
  assert.match(source, /locale="tr"/);
  assert.match(source, /locale: 'tr_TR'/);
});

check('English article metadata advertises published Turkish translations', () => {
  const source = readFileSync('src/app/(en)/article/[slug]/page.tsx', 'utf8');
  assert.match(source, /isTranslationPair\(published\.slug, turkish\)/);
  assert.match(source, /buildArticleAlternates/);
  assert.match(source, /inLanguage: 'en'/);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm locale:test && pnpm seo:discoverability-test`
Expected: FAIL — `Cannot find module '../src/lib/seo/article-alternates'` and missing route file.

- [ ] **Step 3: Implement `article-alternates.ts`**

```ts
import { localizeArticlePath } from '@/lib/i18n/locale';

const BASE_URL = process.env.APP_URL || 'https://fpvlovers.com.tr';

/**
 * Both sides of a translated article cluster must advertise the same alternate
 * set, so this only returns links when both trees have a published artifact.
 */
export function buildArticleAlternates(
  slug: string,
  hasEnglish: boolean,
  hasTurkish: boolean,
): Record<string, string> {
  if (!hasEnglish || !hasTurkish) return {};
  const english = `${BASE_URL}/article/${encodeURIComponent(slug)}`;
  return {
    en: english,
    tr: `${BASE_URL}${localizeArticlePath(slug, 'tr')}`,
    'x-default': english,
  };
}
```

- [ ] **Step 4: Add `inLanguage` to `generateArticleSchema`**

In `src/lib/seo/metadata.ts`, add the optional parameter and the conditional field:

```ts
export function generateArticleSchema({
  title,
  description,
  url,
  datePublished,
  dateModified,
  author = 'FPV Lovers',
  image,
  section,
  wordCount,
  citations = [],
  inLanguage,
}: {
  title: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
  image?: string;
  section?: string;
  wordCount?: number;
  citations?: string[];
  inLanguage?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    ...(inLanguage && { inLanguage }),
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    ...(image && { image: [image] }),
    ...(section && { articleSection: section }),
    ...(wordCount && { wordCount }),
    ...(citations.length > 0 && { citation: citations }),
    author: { '@type': 'Organization', name: author },
    publisher: { '@type': 'Organization', name: 'FPV Lovers', logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo-type.png` } },
  };
}
```

- [ ] **Step 5: Add the Turkish article page**

Create `src/app/tr/article/[slug]/page.tsx`:

```tsx
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, BookOpen, Cpu, Zap } from 'lucide-react';
import { LevelBadge } from '@/components/ui/level-badge';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { ResilientArticleCover } from '@/features/content/components/ResilientArticleCover';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { getGuideGroup, getGuideGroupLabel } from '@/lib/content-taxonomy';
import {
  getArtifactWordCount,
  getPublishedContentBySlugAsync,
  isIndexablePublishedArtifact,
  listPublishedContentAsync,
  type PublishedArtifact,
} from '@/lib/content-automation/content-reader';
import { resolveFallbackCover } from '@/lib/content-automation/fallback-cover';
import { generateArticleSchema } from '@/lib/seo/metadata';
import { buildArticleAlternates } from '@/lib/seo/article-alternates';
import { localizeArticleLink, localizeArticlePath, localizePath } from '@/lib/i18n/locale';

function categoryLabel(category: string | undefined): string {
  const group = getGuideGroup(category);
  return group ? getGuideGroupLabel(group, 'tr') : category || 'Makale';
}

function categoryHref(category: string | undefined): string {
  const group = getGuideGroup(category);
  return group ? `/tr/guides?topic=${group.id}` : '/tr/guides';
}

function contentLink(link: string, translatedSlugs: ReadonlySet<string>): string {
  return link.includes('/article/')
    ? localizeArticleLink(link, 'tr', translatedSlugs)
    : localizePath(link, 'tr');
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedContentBySlugAsync(slug, 'tr');
  if (!article) {
    return { title: 'Sayfa Bulunamadı | FPVLovers', robots: { index: false, follow: false } };
  }

  const englishSource = article.translationOf
    ? await getPublishedContentBySlugAsync(article.translationOf, 'en')
    : null;
  const canonical = localizeArticlePath(article.slug, 'tr');
  const languages = buildArticleAlternates(article.slug, Boolean(englishSource), true);
  const image = article.media?.coverImage?.src;
  const description = article.excerpt || article.seo.metaDescription;

  return {
    title: `${article.title} | FPVLovers`,
    description,
    keywords: article.seo.keywords,
    alternates: Object.keys(languages).length > 0 ? { canonical, languages } : { canonical },
    robots: isIndexablePublishedArtifact(article)
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      type: 'article' as const,
      url: canonical,
      title: article.title,
      description,
      publishedTime: article.publishedAt,
      locale: 'tr_TR',
      images: image ? [{ url: image, alt: article.media?.coverImage?.alt || article.title }] : [],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: article.title,
      description,
      images: image ? [image] : [],
    },
  };
}

function TurkishArticle({
  article,
  translatedSlugs,
}: {
  article: PublishedArtifact;
  translatedSlugs: ReadonlySet<string>;
}) {
  const a = article;
  const fallbackCover = resolveFallbackCover({
    category: a.category,
    metadata: a.metadata,
    title: a.title,
    slug: a.slug,
  });
  const baseUrl = process.env.APP_URL || 'https://fpvlovers.com.tr';
  const articleUrl = `${baseUrl}${localizeArticlePath(a.slug, 'tr')}`;
  const evidenceSources = a.editorial?.contentClass === 'product-review'
    ? a.editorial.evidenceSources.filter((source) => /^https?:\/\//i.test(source))
    : [];
  const sourceReferences = (a.sourceReferences || evidenceSources).filter((source) => /^https?:\/\//i.test(source));
  const coverImageSrc = a.media?.coverImage?.src || `/api/content/media/cover/${encodeURIComponent(a.slug)}?locale=tr`;
  const absoluteCoverImage = /^https?:\/\//i.test(coverImageSrc) ? coverImageSrc : `${baseUrl}${coverImageSrc}`;
  const articleSchema = {
    ...generateArticleSchema({
      title: a.title,
      description: a.excerpt || a.seo.metaDescription,
      url: articleUrl,
      datePublished: a.publishedAt,
      dateModified: a.publishedAt,
      image: absoluteCoverImage,
      section: categoryLabel(a.category),
      wordCount: getArtifactWordCount(a),
      citations: sourceReferences,
      inLanguage: 'tr',
    }),
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
  };
  const breadcrumbs = [
    { label: 'İçerik', href: '/tr' },
    { label: categoryLabel(a.category), href: categoryHref(a.category) },
    { label: a.title, isCurrentPage: true },
  ];
  const breadcrumbSchema = {
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.isCurrentPage ? { item: articleUrl } : { item: `${baseUrl}${item.href}` }),
    })),
  };
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [articleSchema, breadcrumbSchema],
  };
  const safeJsonLd = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
  const sectionCount = a.bodySections?.length || 0;

  return (
    <div className="fpv-public-shell mx-auto max-w-7xl px-4 py-12 pt-28 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd }} />
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" includeSchema={false} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 col-span-1 flex flex-col gap-8 min-w-0">
          <article className="fpv-public-panel relative overflow-hidden rounded-xl bg-[#050810]/70">
            <div className="absolute inset-0 carbon-grid opacity-20 pointer-events-none" />
            {a.media?.coverImage?.src && (
              <ResilientArticleCover
                asset={a.media.coverImage}
                category={categoryLabel(a.category)}
                fallbackSrc={fallbackCover}
                title={a.title}
              />
            )}
            <div className={`p-8 md:p-12 lg:p-16 ${!a.media?.coverImage?.src ? 'pt-12' : 'pt-6 md:pt-8 lg:pt-10'} relative z-10`}>
              <div className="flex items-center gap-2 mb-6">
                <Link
                  href={categoryHref(a.category)}
                  className="rounded border border-white/10 bg-black/80 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-300 transition-colors hover:text-[#FF5C00]"
                >
                  {categoryLabel(a.category)}
                </Link>
                <LevelBadge difficulty={a.metadata?.difficulty} locale="tr" className="bg-black/80" />
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-white mb-6 leading-tight">
                {a.title}
              </h1>

              {a.excerpt && (
                <p className="mb-10 border-b border-white/10 pb-8 text-xl font-bold tracking-tight text-white/90 md:text-2xl">
                  {a.excerpt}
                </p>
              )}

              <div className="mb-12 grid grid-cols-2 gap-3 border-b border-white/10 pb-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 md:grid-cols-3">
                <span className="flex items-center gap-1.5"><Cpu className="w-3 h-3" /> FPVLÖVERS EDİTÖRYAL</span>
                {a.publishedAt && (
                  <span>{new Date(a.publishedAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                )}
                <span>{sectionCount} bölüm</span>
              </div>

              <div className="prose prose-invert mb-12 max-w-none text-white/70 antialiased prose-a:text-[#FF5C00] prose-headings:text-white">
                {(a.bodySections || []).map((section, idx) => (
                  <div key={section.id || `sec-${idx}`} className="mb-14">
                    <h2 className="text-3xl font-black uppercase tracking-tight text-white mt-12 mb-6">
                      {section.title}
                    </h2>

                    <MarkdownRenderer content={section.content} />

                    {section.imageMatch?.src && (
                      <figure className="not-prose relative my-10 overflow-hidden rounded-xl border border-white/10 bg-[#050810] p-1 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
                        <div className="absolute inset-0 carbon-grid opacity-10 pointer-events-none" />
                        <div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg">
                          <Image
                            src={section.imageMatch.src}
                            alt={section.imageMatch.alt || section.title}
                            fill
                            sizes="(min-width: 1024px) 66vw, 100vw"
                            unoptimized={true}
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        {(section.imageMatch.caption || section.imageMatch.credit) && (
                          <figcaption className="relative z-10 mt-1 flex flex-col gap-2 border-t border-white/10 bg-black/40 p-4 font-mono text-[10px] text-[#A0A0A0] md:flex-row md:items-center md:justify-between">
                            <span className="uppercase tracking-widest">{section.imageMatch.caption || section.imageMatch.alt}</span>
                            {section.imageMatch.credit && (
                              <div className="flex items-center gap-3 flex-wrap">
                                <span>{section.imageMatch.credit}</span>
                                {section.imageMatch.sourceUrl && (
                                  <a
                                    href={section.imageMatch.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-black uppercase tracking-widest text-[#FF5C00] transition-colors hover:text-[#FF7A33]"
                                  >
                                    [ Kaynağı Görüntüle ]
                                  </a>
                                )}
                              </div>
                            )}
                          </figcaption>
                        )}
                      </figure>
                    )}
                  </div>
                ))}
              </div>

              {a.internalLinks?.length > 0 && (
                <div className="mt-12 border-t border-white/10 pt-8">
                  <h3 className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#FF5C00]">
                    <Zap className="w-4 h-4" /> İLGİLİ REHBERLER
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {a.internalLinks.map((link: string, i: number) => {
                      const slug = link.split('/').pop() || link;
                      const label = slug
                        .split('-')
                        .filter(Boolean)
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ');
                      return (
                        <Link
                          key={i}
                          href={contentLink(link, translatedSlugs)}
                          className="rounded border border-white/10 bg-black/40 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 transition-colors hover:border-[#FF5C00]/50 hover:text-[#FF5C00]"
                        >
                          {label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {a.media?.attribution?.length ? (
                <div className="border-t border-white/5 pt-6 mt-8">
                  {a.media.attribution.map((note: string, i: number) => (
                    <p key={`attr-${i}`} className="text-[10px] text-[#A0A0A0] font-mono italic">{note}</p>
                  ))}
                </div>
              ) : null}
            </div>
          </article>

          <div className="fpv-public-panel rounded-xl p-6 bg-[#050810]/70">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#FF5C00]">
              <BookOpen className="w-4 h-4" /> DEVAM ET
            </h3>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/tr/guides"
                className="group flex flex-1 items-center justify-between rounded border border-white/5 bg-black/40 p-4 transition-all hover:border-[#FF5C00]/50"
              >
                <span className="font-bold text-white transition-colors group-hover:text-[#FF5C00]">Tüm rehberler</span>
                <ArrowRight className="h-4 w-4 text-zinc-500 transition-colors group-hover:text-[#FF5C00]" />
              </Link>
              <Link
                href="/tr/academy"
                className="group flex flex-1 items-center justify-between rounded border border-white/5 bg-black/40 p-4 transition-all hover:border-[#FF5C00]/50"
              >
                <span className="font-bold text-white transition-colors group-hover:text-[#FF5C00]">Akademi yol haritası</span>
                <ArrowRight className="h-4 w-4 text-zinc-500 transition-colors group-hover:text-[#FF5C00]" />
              </Link>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-4 col-span-1 hidden lg:flex flex-col gap-6 w-full h-full">
          <AdStickySidebar />
        </aside>
      </div>
    </div>
  );
}

export default async function TurkishArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedContentBySlugAsync(slug, 'tr');
  if (!article) notFound();

  if (process.env.NEXT_PHASE !== 'phase-production-build') {
    import('@/lib/server/analytics-store')
      .then(({ logAnalyticsEvent }) => {
        logAnalyticsEvent({
          eventType: 'page_view',
          contentSlug: slug,
          source: 'frontend',
        });
      })
      .catch((err) => {
        console.warn('[TurkishArticlePage] Failed to log page view:', err);
      });
  }

  const translatedSlugs = new Set((await listPublishedContentAsync('tr')).map((entry) => entry.slug));
  return <TurkishArticle article={article} translatedSlugs={translatedSlugs} />;
}
```

Product-review trust panels and the pilot dossier widget stay out of the Turkish page in C2: the localizer only handles autonomous guide content (enforced in Task 6), so there is no Turkish review to render until C3/C5 adds localized editorial UI.

- [ ] **Step 6: Add reciprocal hreflang to the English page**

In `src/app/(en)/article/[slug]/page.tsx`, extend the imports:

```ts
import {
  getPublishedContentBySlugAsync,
  getArtifactWordCount,
  isIndexablePublishedArtifact,
  isTranslationPair,
  type PublishedArtifact,
} from '@/lib/content-automation/content-reader';
import { buildArticleAlternates } from '@/lib/seo/article-alternates';
```

Replace the published branch of `generateMetadata` with:

```ts
  if (published) {
    const canonical = `/article/${published.slug}`;
    const turkish = await getPublishedContentBySlugAsync(published.slug, 'tr');
    const languages = buildArticleAlternates(
      published.slug,
      true,
      isTranslationPair(published.slug, turkish),
    );
    const image = published.media?.coverImage?.src;
    return {
      title: `${published.title} | FPVLovers`,
      description: published.excerpt || published.seo.metaDescription,
      keywords: published.seo.keywords,
      alternates: Object.keys(languages).length > 0 ? { canonical, languages } : { canonical },
      robots: isIndexablePublishedArtifact(published)
        ? { index: true, follow: true }
        : { index: false, follow: true },
      openGraph: {
        type: 'article' as const,
        url: canonical,
        title: published.title,
        description: published.excerpt || published.seo.metaDescription,
        publishedTime: published.publishedAt,
        images: image ? [{ url: image, alt: published.media?.coverImage?.alt || published.title }] : [],
      },
      twitter: {
        card: 'summary_large_image' as const,
        title: published.title,
        description: published.excerpt || published.seo.metaDescription,
        images: image ? [image] : [],
      },
    };
  }
```

Add `inLanguage: 'en'` to the `generateArticleSchema({ ... })` call inside `PublishedArticle`.

- [ ] **Step 7: Run the tests to verify they pass**

Run: `pnpm locale:test && pnpm seo:discoverability-test && ./node_modules/.bin/tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 8: Graph check and commit**

```bash
node .gitnexus/run.cjs detect-changes --scope all --repo .
git add src/lib/seo/article-alternates.ts src/app/tr/article/[slug]/page.tsx src/lib/seo/metadata.ts src/app/\(en\)/article/\[slug\]/page.tsx scripts/locale-regression-test.ts scripts/seo-discoverability-regression-test.ts
git commit -m "feat(i18n): serve Turkish articles at /tr/article with a reciprocal hreflang cluster"
```

---

### Task 3: Route every locale-aware article link through the article helper

**Files:**
- Modify: `src/features/guides/components/GuidesHub.tsx:164`
- Modify: `src/features/search/components/SearchClient.tsx:7,399`
- Modify: `src/features/academy/components/StartHereView.tsx:220`
- Test: `scripts/locale-regression-test.ts`

**Interfaces:**
- Consumes: `localizeArticlePath(slug, locale)` from Task 1.

- [ ] **Step 1: Replace the existing search-only check with the three-file check**

In `scripts/locale-regression-test.ts`, replace the check named `'search client localizes article links'` with:

```ts
check('article links use the article path helper in every locale-aware list', () => {
  for (const file of [
    'src/features/guides/components/GuidesHub.tsx',
    'src/features/search/components/SearchClient.tsx',
    'src/features/academy/components/StartHereView.tsx',
  ]) {
    const source = readFileSync(file, 'utf8');
    assert.match(source, /localizeArticlePath\(/, `${file} must use localizeArticlePath`);
    assert.doesNotMatch(source, /localizePath\(`\/article\//, `${file} must not route article links through localizePath`);
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm locale:test`
Expected: FAIL — none of the three files imports `localizeArticlePath`.

- [ ] **Step 3: Switch the three call sites**

`src/features/guides/components/GuidesHub.tsx:164`:

```tsx
      href={localizeArticlePath(article.slug, locale)}
```

Add `localizeArticlePath` to the existing import at line 20 (keep `localizePath` — it is still used on lines 135 and 224).

`src/features/academy/components/StartHereView.tsx:220`:

```tsx
                        href={localizeArticlePath(article.slug, locale)}
```

Add `localizeArticlePath` to the existing import at line 13 (keep `localizePath` — still used on lines 153 and 237).

`src/features/search/components/SearchClient.tsx:399`:

```tsx
                href={localizeArticlePath(a.slug, locale)}
```

Replace the import at line 7 (no other `localizePath` usage in this file):

```ts
import { DEFAULT_LOCALE, localizeArticlePath, type Locale } from '@/lib/i18n/locale';
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm locale:test`
Expected: PASS.

- [ ] **Step 5: Graph check and commit**

```bash
node .gitnexus/run.cjs detect-changes --scope all --repo .
git add src/features/guides/components/GuidesHub.tsx src/features/search/components/SearchClient.tsx src/features/academy/components/StartHereView.tsx scripts/locale-regression-test.ts
git commit -m "fix(i18n): point article links at the Turkish article tree"
```

---

### Task 4: Locale-scoped publishing and the DB `locale='tr'` write path

**Files:**
- Modify: `src/lib/content-automation/publish-artifact.ts:24,113-136,149-154,260-284,309-313`
- Modify: `src/lib/content-automation/content-media.ts:229-243`
- Modify: `src/lib/content-automation/content-reader.ts:133-165,421-530`
- Modify: `src/lib/content-automation/types.ts:91`
- Test: `scripts/locale-regression-test.ts`

**Interfaces:**
- Produces: `PublishArtifactOptions { locale?: Locale; translationOf?: string; metadata?: ContentMetadata; sourceReferences?: string[] }`
- Produces: `assertPublishableLocale(locale: Locale, translationOf: string | undefined): void`
- Changes: `publishGeneratedContentArtifact(slug, job, content, options?)`
- Changes: `buildContentMedia({ ..., locale? })`
- Changes: `ensureMediaArtifact(parsed, locale = DEFAULT_LOCALE)`
- Changes: `ContentJob.language: 'en' | 'tr'`

- [ ] **Step 1: Write the failing tests**

Add `import path from 'node:path';` to the top of `scripts/locale-regression-test.ts`, import `publishedDirFor` from `content-reader`, and import `buildContentMedia` alongside `buildCoverImageUrl`. Append:

```ts
check('Turkish covers are built with the locale qualifier', () => {
  assert.equal(
    buildContentMedia({ slug: 'fpv-kit', title: 'T', category: 'C', locale: 'tr' }).coverImage.src,
    '/api/content/media/cover/fpv-kit?locale=tr',
  );
  assert.equal(
    buildContentMedia({ slug: 'fpv-kit', title: 'T', category: 'C' }).coverImage.src,
    '/api/content/media/cover/fpv-kit',
  );
});

check('publishers write Turkish artifacts into content/published/tr', () => {
  assert.ok(publishedDirFor('tr').endsWith(path.join('content', 'published', 'tr')));
  assert.ok(publishedDirFor('en').endsWith(path.join('content', 'published')));
  assert.ok(!publishedDirFor('en').endsWith(path.join('published', 'en')));
  const source = readFileSync('src/lib/content-automation/publish-artifact.ts', 'utf8');
  assert.match(source, /assertPublishableLocale\(locale, options\.translationOf\)/);
  assert.match(source, /Turkish artifacts require translationOf/);
  assert.match(source, /publishedDirFor\(locale\)/);
  assert.match(source, /\.\.\.\(locale !== DEFAULT_LOCALE \? \{ locale \} : \{\}\)/);
  assert.match(source, /\.\.\.\(options\.translationOf \? \{ translationOf: options\.translationOf \} : \{\}\)/);
  assert.match(source, /\.\.\.\(options\.metadata \? \{ metadata: options\.metadata \} : \{\}\)/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm locale:test`
Expected: FAIL — `buildContentMedia` does not accept `locale`, and the publish source has no locale guard.

- [ ] **Step 3: Add `locale` to cover/media building**

In `src/lib/content-automation/content-media.ts`:

```ts
export function buildContentMedia(input: {
  slug: string;
  title: string;
  category: string;
  excerpt?: string;
  locale?: Locale;
}): ContentMedia {
  const caption = truncate(
    input.excerpt || `${input.title} cover art for the ${input.category} reference track`,
    120,
  );

  return {
    coverImage: {
      src: buildCoverImageUrl(input.slug, input.locale),
      alt: `${input.title} cover illustration`,
      caption,
      source: 'FPVLovers local media layer',
      credit: 'FPVLovers generated artwork',
      kind: 'generated-artwork',
    },
    gallery: [],
    figureCaptions: [],
    imageSources: ['Local SVG illustration generated from published content metadata'],
    attribution: ['Copyright-safe media generated locally by FPVLovers'],
  };
}
```

In `src/lib/content-automation/content-reader.ts`, change `ensureMediaArtifact` to accept the locale and use it for both the generated media and the fallback cover:

```ts
export function ensureMediaArtifact(
  parsed: Partial<PublishedArtifact>,
  locale: Locale = DEFAULT_LOCALE,
): PublishedArtifact | null {
  if (!parsed || typeof parsed.slug !== 'string') return null;
  const title = typeof parsed.title === 'string' && parsed.title ? parsed.title : parsed.slug;
  const category = typeof parsed.category === 'string' && parsed.category ? parsed.category : 'FPV Reference';
  const excerpt = typeof parsed.excerpt === 'string' ? parsed.excerpt : '';
  const resolvedMedia = buildContentMedia({ slug: parsed.slug, title, category, excerpt, locale });
```

and:

```ts
    src: buildCoverImageUrl(parsed.slug, locale),
```

Update the four call sites: `listPublishedContent` → `ensureMediaArtifact(parsed, locale)`, `getPublishedContentBySlug` → `ensureMediaArtifact(parsed, locale)`, `listPublishedContentAsyncUncached` → `ensureMediaArtifact(artifact, locale)`, `getPublishedContentBySlugAsyncUncached` → `ensureMediaArtifact(database, locale)`.

- [ ] **Step 4: Make publishing locale-aware**

In `src/lib/content-automation/publish-artifact.ts`:

Remove the `PUBLISHED_DIR` constant (keep `SOURCE_CACHE_DIR`) and add imports:

```ts
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locale';
import type { ContentMetadata } from '@/lib/content-metadata';
import { publishedDirFor } from './content-reader';
```

Add above the publish function:

```ts
export type PublishArtifactOptions = {
  locale?: Locale;
  translationOf?: string;
  metadata?: ContentMetadata;
  sourceReferences?: string[];
};

export function assertPublishableLocale(locale: Locale, translationOf: string | undefined): void {
  if (locale === 'tr' && !translationOf) {
    throw new Error('Turkish artifacts require translationOf: the English slug is the only pairing signal.');
  }
}
```

Replace the signature and directory setup:

```ts
export async function publishGeneratedContentArtifact(
  slug: string,
  job: ContentJob,
  content: GeneratedContent,
  options: PublishArtifactOptions = {},
): Promise<string> {
  const locale = options.locale ?? DEFAULT_LOCALE;
  assertPublishableLocale(locale, options.translationOf);

  const classification = classifyEditorialContent({
    category: job.category,
    template: job.template,
  });
  if (classification.contentClass === 'product-review') {
    const decision = evaluatePublicationReadiness({
      classification,
      review: job.editorial?.contentClass === 'product-review'
        ? job.editorial
        : undefined,
    });
    if (!decision.canPublish) {
      throw new Error(`Product review publication blocked: ${decision.blockers.join(' ')}`);
    }
  }

  const publishedDir = publishedDirFor(locale);
  ensureDir(publishedDir);
  const jsonPath = path.join(publishedDir, `${slug}.json`);
  const mdPath = path.join(publishedDir, `${slug}.md`);
```

Pass the locale when the cover has to be generated:

```ts
  const media = content.media || buildContentMedia({
    slug,
    title: content.title,
    category: job.category,
    excerpt: content.excerpt,
    locale,
  });
```

Merge caller-supplied sources:

```ts
  const sourceReferences = validHttpSources([
    ...(options.sourceReferences || []),
    ...job.sourceHints,
    ...(job.editorial?.contentClass === 'product-review' ? job.editorial.evidenceSources : []),
    ...media.gallery.map((asset) => asset.sourceUrl || ''),
  ]);
```

Add the localized fields to the artifact (English output stays byte-identical because every conditional is omitted for `en`):

```ts
  const artifact = {
    slug,
    ...(locale !== DEFAULT_LOCALE ? { locale } : {}),
    ...(options.translationOf ? { translationOf: options.translationOf } : {}),
    ...(options.metadata ? { metadata: options.metadata } : {}),
    title: content.title,
    jobId: job.id,
    category: job.category,
    template: job.template,
    seo: content.seo,
    excerpt: content.excerpt,
    bodySections: content.bodySections,
    internalLinks: content.internalLinks,
    publishNotes: filteredNotes,
    media,
    jobStatus: job.status,
    editorial: job.editorial,
    publishedAt: new Date().toISOString(),
    promptVersion: job.promptVersion,
    sourceHints: job.sourceHints,
    sourceReferences,
  };
```

Replace the hardcoded return with a computed relative path:

```ts
  return path.relative(process.cwd(), jsonPath).split(path.sep).join('/');
```

`upsertPublishedArtifact(artifact)` already keys the row by `resolveLocale(artifact.locale)`, so a Turkish publish lands in `published_articles_shadow (slug, 'tr')` with `json_path = content/published/tr/<slug>.json` and no migration is needed.

- [ ] **Step 5: Widen the job language**

In `src/lib/content-automation/types.ts`:

```ts
  language: 'en' | 'tr';
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm locale:test && ./node_modules/.bin/tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 7: Graph check and commit**

```bash
node .gitnexus/run.cjs detect-changes --scope all --repo .
git add src/lib/content-automation/publish-artifact.ts src/lib/content-automation/content-media.ts src/lib/content-automation/content-reader.ts src/lib/content-automation/types.ts scripts/locale-regression-test.ts
git commit -m "feat(content): publish Turkish artifacts with locale and translationOf"
```

---

### Task 5: Dify localizer contract and the localized-rewrite module

**Files:**
- Create: `docs/superpowers/specs/2026-10-31-dify-content-localizer-tr.md`
- Create: `src/lib/content-automation/localized-rewrite.ts`
- Create: `scripts/localized-rewrite-regression-test.ts`
- Modify: `src/lib/content-automation/parse-generated-content.ts:22` (export `extractJsonBlock`)
- Modify: `src/lib/content-automation/dify-generation.ts` (export `isRetryableWorkflowFailure`)
- Modify: `src/lib/content-automation/content-reader.ts:111` (widen `getArtifactWordCount` input)
- Modify: `.env.example:68`
- Modify: `package.json`

**Interfaces:**
- Produces: `LOCALIZER_WORKFLOW_ID = 'content-localizer-tr'`, `LOCALIZER_PROMPT_VERSION = 'localizer-v1'`
- Produces: `LocalizerSource`, `ParsedLocalizedRewrite`
- Produces: `buildLocalizerInputs(source): Record<string, string>`
- Produces: `parseLocalizedRewriteOutput(answer): ParsedLocalizedRewrite | null`
- Produces: `validateLocalizedRewrite(source, parsed): { ok: boolean; blockers: string[] }`
- Produces: `buildLocalizedContent(parsed, source): GeneratedContent`
- Produces: `runLocalizedRewrite(source): Promise<ParsedLocalizedRewrite & { workflowRunId: string | null }>`

- [ ] **Step 1: Write the workflow contract doc**

Create `docs/superpowers/specs/2026-10-31-dify-content-localizer-tr.md` with exactly this content:

````markdown
# Dify Content Localizer (TR) — Workflow Contract

**Workflow name:** `content-localizer-tr`
**Type:** Dify v1.14.0 Workflow (`/workflows/run`, blocking)
**Token env:** `DIFY_WORKFLOW_TOKEN_LOCALIZER`

## Start node inputs (all strings)

| Variable | Source |
| --- | --- |
| `source_slug` | English artifact `slug` |
| `source_title` | English artifact `title` |
| `source_excerpt` | English artifact `excerpt` |
| `source_category` | English artifact `category` |
| `content_type` | English `metadata.contentType` or `guide` |
| `source_body` | `## <section title>\n\n<section content>` joined with blank lines |
| `source_internal_links` | JSON array of `/article/<slug>` paths |
| `source_references` | Newline-separated source URLs |
| `target_locale` | Literal `tr` |

## Output variable

`localized_article` — a single string containing only a JSON object (no fences, no prose).

## LLM system prompt

```
Sen FPVLovers'ın Türkçe yerelleştirme editörüsün. Sana verilen İngilizce FPV makalesini, anlamı ve teknik doğruluğu koruyarak Türkçeye uyarlıyorsun. Çeviri değil, yerelleştirme yapıyorsun.

KURALLAR
1. Yalnızca geçerli JSON döndür; markdown kod bloğu, açıklama veya JSON dışı metin ekleme.
2. Kaynak metindeki teknik gerçekleri, sayıları, ürün adlarını, birimleri ve kaynak URL'lerini değiştirme; yeni fiyat, stok, spesifikasyon veya iddia ekleme.
3. "source_slug" değerini "seo.slug" alanına aynen yaz. Slug Türkçeleştirilmez.
4. "body_sections" dizisindeki bölüm sayısı ve "id" değerleri kaynakla birebir aynı olmalı. Yalnızca "title" ve "content" alanlarını Türkçeleştir.
5. Bölüm başlıklarını "## " ile başlatma; başlık "title" alanında, gövde "content" alanında olmalı.
6. Yaygın FPV terimlerini koru: FPV, drone, Betaflight, ELRS, PID, ESC, FC, VTX, LiPo, freestyle, whoop, FPV gözlük. Türkçe karşılığı yerleşmişse Türkçesini kullan (kumanda, pervane, pil, alıcı, uçuş kontrolcüsü).
7. Toplam gövde en az 1200 kelime olmalı. Kaynak daha uzunsa kısaltma; bilgi kaybı yaratma.
8. "seo.metaDescription" 120-160 karakter arasında Türkçe olmalı. "seo.keywords" en az 3 Türkçe anahtar kelime içermeli; birincisi başlıkta geçmeli.
9. "metadata" alanını kaynaktan birebir kopyala (difficulty, contentType, topics, audience, discipline, components); değerleri çevirme. "metadata.contentType" ve "metadata.difficulty" kaynakla aynı olmalı.
10. "internal_links" yalnızca kaynakta verilen bağlantıları içermeli; yeni bağlantı uydurma. Yolları /article/<slug> biçiminde bırak.
11. "publish_notes" ve "localization_notes" Türkçe kısa notlar olsun. "localization_notes" içinde koruduğun terimleri ve şüpheli noktaları belirt.
12. Üslup: deneyimli FPV pilotunun Türkçesi; sade, teknik, abartısız. "En iyi", "garantili", "kesinlikle" gibi doğrulanamaz ifadeler kullanma.
13. Kaynakta uyarı/güvenlik bölümü varsa koru ve Türkçeleştir; yeni güvenlik iddiası ekleme.
14. Çıktı şeması:
{
  "title": "string",
  "excerpt": "string",
  "body_sections": [{"id": "string", "title": "string", "content": "string"}],
  "seo": {"slug": "string", "metaDescription": "string", "keywords": ["string"]},
  "metadata": {"difficulty": "string", "contentType": "string", "topics": ["string"], "audience": ["string"], "discipline": ["string"], "components": ["string"]},
  "internal_links": ["string"],
  "publish_notes": ["string"],
  "localization_notes": ["string"]
}
```

## App-side gates (non-negotiable)

1. `seo.slug === source_slug`.
2. `body_sections` ids and order equal the source ids and order.
3. `hasLanguageMismatch(content, 'tr') === false`.
4. Body word count ≥ 1200.
5. `computeSeoScore(content).score ≥ 80`.
6. `metadata` passes `validateContentMetadata`; `contentType` and `difficulty` equal the source.
7. Product reviews and regulation content are rejected before the workflow runs (Task 6).
````

- [ ] **Step 2: Write the failing regression test**

Create `scripts/localized-rewrite-regression-test.ts`:

```ts
import assert from 'node:assert/strict';
import {
  buildLocalizedContent,
  buildLocalizerInputs,
  parseLocalizedRewriteOutput,
  validateLocalizedRewrite,
  type LocalizerSource,
} from '../src/lib/content-automation/localized-rewrite';

const keywordSentence = 'fpv başlangıç rehberi yeni pilotlar için temel bilgileri ve güvenli uçuş pratiklerini açıklar.';
const neutralSentence = 'Pil güvenliği ve ekipman bakımı uzun uçuşlar için her zaman düzenli kontrol gerektirir.';

function body(keywordCount: number, neutralCount: number): string {
  return [...Array(keywordCount).fill(keywordSentence), ...Array(neutralCount).fill(neutralSentence)].join(' ');
}

const sourceMetadata = {
  contentType: 'tutorial' as const,
  difficulty: 'beginner' as const,
  topics: ['setup'],
  audience: ['new-pilot' as const],
  discipline: ['general' as const],
};

const source: LocalizerSource = {
  slug: 'fpv-kit',
  title: 'FPV Starter Kit',
  excerpt: 'A starter guide for new pilots.',
  category: 'Flight Guides',
  contentType: 'tutorial',
  metadata: sourceMetadata,
  bodySections: [
    { id: 'intro', title: 'Intro', content: 'Intro body.' },
    { id: 'steps', title: 'Steps', content: 'Steps body.' },
  ],
  internalLinks: ['/article/fpv-kit'],
  sourceReferences: ['https://example.com/spec'],
};

const goodOutput = {
  title: 'FPV Başlangıç Rehberi: İlk Uçuşa Güvenli Başlangıç',
  excerpt: 'Yeni pilotlar için temel FPV bilgileri ve güvenli uçuş pratikleri.',
  body_sections: [
    { id: 'intro', title: 'Başlangıç', content: body(15, 45) },
    { id: 'steps', title: 'Adımlar', content: body(15, 65) },
  ],
  seo: {
    slug: 'fpv-kit',
    metaDescription: 'FPV başlangıç rehberi: ilk drone seçimi, kumanda ayarı, simülatör çalışması ve güvenli ilk uçuş için adım adım temel bilgiler.',
    keywords: ['fpv başlangıç', 'fpv drone', 'yeni pilot'],
  },
  metadata: sourceMetadata,
  internal_links: ['/article/fpv-kit'],
  publish_notes: ['Türkçe yerelleştirme'],
  localization_notes: ['FPV terimleri korundu'],
};

const wrap = (value: unknown) => '```json\n' + JSON.stringify(value) + '\n```';

const inputs = buildLocalizerInputs(source);
assert.equal(inputs.source_slug, 'fpv-kit');
assert.equal(inputs.target_locale, 'tr');
assert.match(inputs.source_body, /## Intro/);

const parsed = parseLocalizedRewriteOutput(wrap(goodOutput));
assert.ok(parsed, 'fenced JSON must parse');
assert.equal(parsed.metadata.difficulty, 'beginner');
assert.deepEqual(parsed.localizationNotes, ['FPV terimleri korundu']);

const accepted = validateLocalizedRewrite(source, parsed);
assert.deepEqual(accepted.blockers, []);
assert.equal(accepted.ok, true);

const slugDrift = parseLocalizedRewriteOutput(wrap({ ...goodOutput, seo: { ...goodOutput.seo, slug: 'drifted' } }));
assert.ok(slugDrift);
assert.ok(validateLocalizedRewrite(source, slugDrift).blockers.some((blocker) => blocker.includes('Slug mismatch')));

const sectionDrift = parseLocalizedRewriteOutput(wrap({
  ...goodOutput,
  body_sections: [{ id: 'intro', title: 'Başlangıç', content: body(30, 110) }],
}));
assert.ok(sectionDrift);
assert.ok(validateLocalizedRewrite(source, sectionDrift).blockers.some((blocker) => blocker.includes('Section ids drifted')));

const englishBody = parseLocalizedRewriteOutput(wrap({
  ...goodOutput,
  title: 'FPV Starter Guide',
  excerpt: 'A starter guide.',
  seo: { ...goodOutput.seo, metaDescription: 'A starter guide for new pilots who want to learn the basics before the first flight.' },
  body_sections: [
    { id: 'intro', title: 'Intro', content: 'The pilot should check the battery and the radio before the first flight. '.repeat(60) },
    { id: 'steps', title: 'Steps', content: 'The pilot should check the battery and the radio before the first flight. '.repeat(60) },
  ],
}));
assert.ok(englishBody);
assert.ok(validateLocalizedRewrite(source, englishBody).blockers.some((blocker) => blocker.includes('English')));

const shortBody = parseLocalizedRewriteOutput(wrap({
  ...goodOutput,
  body_sections: [
    { id: 'intro', title: 'Başlangıç', content: body(5, 5) },
    { id: 'steps', title: 'Adımlar', content: body(5, 5) },
  ],
}));
assert.ok(shortBody);
assert.ok(validateLocalizedRewrite(source, shortBody).blockers.some((blocker) => blocker.includes('1200')));

const metadataDrift = parseLocalizedRewriteOutput(wrap({
  ...goodOutput,
  metadata: { ...sourceMetadata, difficulty: 'advanced' },
}));
assert.ok(metadataDrift);
assert.ok(validateLocalizedRewrite(source, metadataDrift).blockers.some((blocker) => blocker.includes('difficulty drifted')));

const imageSource: LocalizerSource = {
  ...source,
  bodySections: [
    { id: 'intro', title: 'Intro', content: 'Intro body.', imageMatch: { src: '/images/intro.jpg', alt: 'Intro' } },
    { id: 'steps', title: 'Steps', content: 'Steps body.' },
  ],
};
const withImages = buildLocalizedContent(parsed.content, imageSource);
assert.equal(withImages.bodySections[0].imageMatch?.src, '/images/intro.jpg');
assert.equal(withImages.bodySections[1].imageMatch, undefined);

console.log('localized rewrite regression checks passed');
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `node --import tsx scripts/localized-rewrite-regression-test.ts`
Expected: FAIL — module `localized-rewrite` does not exist.

- [ ] **Step 4: Export the two helpers the module reuses**

In `src/lib/content-automation/parse-generated-content.ts`:

```ts
export const extractJsonBlock = (answer: string): string | null => {
```

In `src/lib/content-automation/dify-generation.ts`:

```ts
export function isRetryableWorkflowFailure(workflow: { success: boolean; status: string; error?: string }): boolean {
```

In `src/lib/content-automation/content-reader.ts`:

```ts
export function getArtifactWordCount(article: Pick<PublishedArtifact, 'bodySections'>): number {
```

- [ ] **Step 5: Implement the module**

Create `src/lib/content-automation/localized-rewrite.ts`:

```ts
import { runWorkflow as runDifyWorkflow } from '@/lib/dify-client';
import { validateContentMetadata, type ContentMetadata } from '@/lib/content-metadata';
import type { ContentMediaAsset } from './types';
import {
  getArtifactWordCount,
  hasLanguageMismatch,
  type PublishedArtifact,
} from './content-reader';
import { computeSeoScore } from './seo-score';
import { parseGeneratedContent, extractJsonBlock, type GeneratedContent } from './parse-generated-content';
import { isRetryableWorkflowFailure } from './dify-generation';

export const LOCALIZER_WORKFLOW_ID = 'content-localizer-tr';
export const LOCALIZER_PROMPT_VERSION = 'localizer-v1';
const MAX_WORKFLOW_ATTEMPTS = 3;
const MIN_WORDS = 1200;
const MIN_SEO_SCORE = 80;

export type LocalizerSource = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  contentType?: string;
  metadata?: ContentMetadata;
  bodySections: Array<{
    id: string;
    title: string;
    content: string;
    imageMatch?: ContentMediaAsset;
  }>;
  internalLinks: string[];
  sourceReferences: string[];
};

export type ParsedLocalizedRewrite = {
  content: GeneratedContent;
  metadata: ContentMetadata;
  metadataValid: boolean;
  metadataErrors: string[];
  localizationNotes: string[];
  rawAnswer: string;
};

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function buildLocalizerInputs(source: LocalizerSource): Record<string, string> {
  return {
    source_slug: source.slug,
    source_title: source.title,
    source_excerpt: source.excerpt,
    source_category: source.category,
    content_type: source.contentType || 'guide',
    source_body: source.bodySections
      .map((section) => `## ${section.title}\n\n${section.content}`)
      .join('\n\n'),
    source_internal_links: JSON.stringify(source.internalLinks),
    source_references: source.sourceReferences.join('\n'),
    target_locale: 'tr',
  };
}

export function parseLocalizedRewriteOutput(answer: string): ParsedLocalizedRewrite | null {
  const content = parseGeneratedContent(answer);
  const jsonText = extractJsonBlock(answer);
  if (!content || !jsonText) return null;

  let raw: { metadata?: unknown; localization_notes?: unknown };
  try {
    raw = JSON.parse(jsonText) as { metadata?: unknown; localization_notes?: unknown };
  } catch {
    return null;
  }

  const metadata = validateContentMetadata(raw.metadata);
  return {
    content,
    metadata: metadata.metadata || {},
    metadataValid: metadata.isValid,
    metadataErrors: metadata.errors,
    localizationNotes: Array.isArray(raw.localization_notes)
      ? raw.localization_notes.filter((note): note is string => typeof note === 'string' && note.trim().length > 0)
      : [],
    rawAnswer: answer,
  };
}

export function validateLocalizedRewrite(
  source: LocalizerSource,
  parsed: ParsedLocalizedRewrite,
): { ok: boolean; blockers: string[] } {
  const blockers: string[] = [];
  const content = parsed.content;

  if (content.seo.slug !== source.slug) {
    blockers.push(`Slug mismatch: expected ${source.slug}, got ${content.seo.slug || '(empty)'}.`);
  }

  const sourceIds = source.bodySections.map((section) => section.id);
  const outputIds = content.bodySections.map((section) => section.id);
  if (sourceIds.length !== outputIds.length || sourceIds.some((id, index) => id !== outputIds[index])) {
    blockers.push(`Section ids drifted from ${JSON.stringify(sourceIds)} to ${JSON.stringify(outputIds)}.`);
  }

  if (hasLanguageMismatch(content, 'tr')) {
    blockers.push('Body still reads as English.');
  }

  const words = getArtifactWordCount(content as Pick<PublishedArtifact, 'bodySections'>);
  if (words < MIN_WORDS) {
    blockers.push(`Body has ${words} words; ${MIN_WORDS} required.`);
  }

  const seo = computeSeoScore(content);
  if (seo.score < MIN_SEO_SCORE) {
    blockers.push(`SEO score ${seo.score} is below ${MIN_SEO_SCORE}: ${seo.reasons.join(' ')}`);
  }

  if (!parsed.metadataValid) {
    blockers.push(`Metadata invalid: ${parsed.metadataErrors.join('; ')}`);
  }
  if (source.metadata?.contentType && parsed.metadata.contentType !== source.metadata.contentType) {
    blockers.push(`contentType drifted from ${source.metadata.contentType} to ${parsed.metadata.contentType || '(missing)'}.`);
  }
  if (source.metadata?.difficulty && parsed.metadata.difficulty !== source.metadata.difficulty) {
    blockers.push(`difficulty drifted from ${source.metadata.difficulty} to ${parsed.metadata.difficulty || '(missing)'}.`);
  }

  return { ok: blockers.length === 0, blockers };
}

export function buildLocalizedContent(
  parsed: GeneratedContent,
  source: Pick<LocalizerSource, 'bodySections'>,
): GeneratedContent {
  const images = new Map(
    source.bodySections
      .filter((section) => section.imageMatch)
      .map((section) => [section.id, section.imageMatch as ContentMediaAsset]),
  );

  return {
    ...parsed,
    bodySections: parsed.bodySections.map((section) => {
      const imageMatch = images.get(section.id);
      return imageMatch ? { ...section, imageMatch } : section;
    }),
  };
}

export async function runLocalizedRewrite(
  source: LocalizerSource,
): Promise<ParsedLocalizedRewrite & { workflowRunId: string | null }> {
  const token = process.env.DIFY_WORKFLOW_TOKEN_LOCALIZER;
  if (!token) {
    throw new Error('DIFY_WORKFLOW_TOKEN_LOCALIZER is not configured.');
  }

  const inputs = buildLocalizerInputs(source);
  let workflow = await runDifyWorkflow(LOCALIZER_WORKFLOW_ID, inputs, token, 'content_gen', 180000);
  for (let attempt = 1; attempt < MAX_WORKFLOW_ATTEMPTS && isRetryableWorkflowFailure(workflow); attempt += 1) {
    await delay(attempt * 5000);
    workflow = await runDifyWorkflow(LOCALIZER_WORKFLOW_ID, inputs, token, 'content_gen', 180000);
  }

  if (!workflow.success) {
    throw new Error(`DIFY_WORKFLOW_${workflow.status}: ${workflow.error || 'Localizer workflow did not succeed'}`);
  }

  const rawAnswer = typeof workflow.outputs.localized_article === 'string'
    ? workflow.outputs.localized_article
    : JSON.stringify(workflow.outputs);
  const parsed = parseLocalizedRewriteOutput(rawAnswer);
  if (!parsed) {
    throw new Error('Localizer output is not a JSON object; check the workflow output variable.');
  }

  return { ...parsed, workflowRunId: workflow.workflowRunId || null };
}
```

- [ ] **Step 6: Register the token and the test command**

Append to the Dify workflow token block in `.env.example`:

```
DIFY_WORKFLOW_TOKEN_LOCALIZER=
```

Add to `package.json` scripts:

```json
"locale:localizer-test": "node --import tsx scripts/localized-rewrite-regression-test.ts",
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `pnpm locale:localizer-test && ./node_modules/.bin/tsc --noEmit`
Expected: `localized rewrite regression checks passed`, no type errors.

- [ ] **Step 8: Graph check and commit**

```bash
node .gitnexus/run.cjs detect-changes --scope all --repo .
git add docs/superpowers/specs/2026-10-31-dify-content-localizer-tr.md src/lib/content-automation/localized-rewrite.ts scripts/localized-rewrite-regression-test.ts src/lib/content-automation/parse-generated-content.ts src/lib/content-automation/dify-generation.ts src/lib/content-automation/content-reader.ts .env.example package.json
git commit -m "feat(content): add the Turkish localizer workflow contract"
```

---

### Task 6: Translate, gate, and publish the first Turkish article

**Files:**
- Create: `scripts/translate-article.ts`
- Modify: `src/lib/i18n/start-steps.ts:85`
- Modify: `scripts/locale-regression-test.ts`
- Modify: `package.json`
- Create (generated): `content/published/tr/fpv-beginner-setup-guide-the-easiest-way-to-get-flying.json`
- Create (generated): `content/published/tr/fpv-beginner-setup-guide-the-easiest-way-to-get-flying.md`

**Interfaces:**
- Consumes: `runLocalizedRewrite`, `parseLocalizedRewriteOutput`, `validateLocalizedRewrite`, `buildLocalizedContent`, `LOCALIZER_PROMPT_VERSION`.
- Consumes: `publishGeneratedContentArtifact(slug, job, content, { locale, translationOf, metadata, sourceReferences })`.
- Produces: the first committed Turkish artifact with `locale: "tr"` and `translationOf`.

**Prerequisite (operator, one time):** Create the `content-localizer-tr` workflow in Dify v1.14.0 with the start inputs, system prompt, and `localized_article` output from `docs/superpowers/specs/2026-10-31-dify-content-localizer-tr.md`, then place its token in the runtime environment as `DIFY_WORKFLOW_TOKEN_LOCALIZER`. Do not commit the token.

- [ ] **Step 1: Replace the shell check with the published-artifact check**

In `scripts/locale-regression-test.ts`, replace the check named `'Turkish start steps ship as a shell without English article slugs'` with:

```ts
check('Turkish start steps reference only published Turkish artifacts', () => {
  const trSlugs = new Set(listPublishedContent('tr').map((artifact) => artifact.slug));
  const referenced = START_STEPS.tr.flatMap((step) => step.articleSlugs);
  assert.ok(referenced.length > 0, 'the first Turkish article must be linked from the start steps');
  for (const slug of referenced) {
    assert.ok(trSlugs.has(slug), `missing Turkish artifact: ${slug}`);
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm locale:test`
Expected: FAIL — no Turkish artifact exists yet.

- [ ] **Step 3: Implement the translate script**

Create `scripts/translate-article.ts`:

```ts
import fs from 'fs';
import path from 'path';
import { getPublishedContentBySlug } from '../src/lib/content-automation/content-reader';
import { isRegulationContent } from '../src/lib/content-automation/editorial-governance';
import {
  LOCALIZER_PROMPT_VERSION,
  buildLocalizedContent,
  parseLocalizedRewriteOutput,
  runLocalizedRewrite,
  validateLocalizedRewrite,
  type LocalizerSource,
} from '../src/lib/content-automation/localized-rewrite';
import { publishGeneratedContentArtifact } from '../src/lib/content-automation/publish-artifact';
import { computeSeoScore } from '../src/lib/content-automation/seo-score';
import type { ContentJob, ContentTemplate } from '../src/lib/content-automation/types';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    else if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    process.env[key] = val;
  }
}

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = process.argv.find((value) => value.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

const TEMPLATES: readonly ContentTemplate[] = [
  'tech-article',
  'product-review',
  'build-guide',
  'comparison',
  'troubleshooting',
  'regulation-guide',
  'community-roundup',
];

async function main() {
  loadEnvLocal();

  const slug = arg('slug');
  const fromFile = arg('from-file');
  const dryRun = hasFlag('dry-run');
  const force = hasFlag('force');
  if (!slug) {
    throw new Error('Usage: pnpm content:translate --slug=<english-slug> [--dry-run] [--from-file=<localizer.json>] [--force] [--files-only]');
  }
  if (hasFlag('files-only')) {
    process.env.FPV_STORAGE_MODE = 'files';
  }

  const source = getPublishedContentBySlug(slug, 'en');
  if (!source) {
    throw new Error(`English artifact not found: content/published/${slug}.json`);
  }
  if (getPublishedContentBySlug(slug, 'tr') && !force) {
    throw new Error(`Turkish artifact already exists for ${slug}; pass --force to overwrite.`);
  }

  const template: ContentTemplate = TEMPLATES.includes(source.template as ContentTemplate)
    ? (source.template as ContentTemplate)
    : 'tech-article';

  if (source.editorial?.contentClass === 'product-review' || source.metadata?.contentType === 'review') {
    throw new Error('Product reviews require a human editor in the target language; machine translation is blocked.');
  }
  if (isRegulationContent({ category: source.category, template })) {
    throw new Error('Regulation content is generated from the Turkish RAG lane (C3), never machine-translated.');
  }

  const sourceReferences = (source.sourceReferences || []).filter((value) => /^https?:\/\//i.test(value));
  const localizerSource: LocalizerSource = {
    slug: source.slug,
    title: source.title,
    excerpt: source.excerpt,
    category: source.category,
    contentType: source.metadata?.contentType || 'guide',
    metadata: source.metadata,
    bodySections: (source.bodySections || []).map((section) => ({
      id: section.id,
      title: section.title,
      content: section.content,
      imageMatch: section.imageMatch,
    })),
    internalLinks: source.internalLinks || [],
    sourceReferences,
  };

  const parsed = fromFile
    ? parseLocalizedRewriteOutput(fs.readFileSync(path.resolve(fromFile), 'utf8'))
    : await runLocalizedRewrite(localizerSource);
  if (!parsed) {
    throw new Error('Localizer output could not be parsed as JSON.');
  }

  const validation = validateLocalizedRewrite(localizerSource, parsed);
  if (!validation.ok) {
    console.error('✗ Localizer output failed the publish gate:');
    for (const blocker of validation.blockers) {
      console.error(`  - ${blocker}`);
    }
    process.exit(1);
  }

  const content = buildLocalizedContent(parsed.content, localizerSource);
  const words = content.bodySections.reduce(
    (total, section) => total + section.content.split(/\s+/).filter(Boolean).length,
    0,
  );
  const seo = computeSeoScore(content);

  console.log(`✓ Gate passed: ${source.slug} → tr (${words} words, SEO ${seo.score})`);
  console.log(`  sections: ${content.bodySections.map((section) => section.id).join(', ')}`);
  console.log(`  notes: ${parsed.localizationNotes.join(' | ') || '(none)'}`);

  if (dryRun) {
    console.log('Dry run: no files written.');
    return;
  }

  const now = new Date().toISOString();
  const job: ContentJob = {
    id: `localize-${source.slug}-${Date.now().toString(36)}`,
    briefSlug: source.slug,
    title: content.title,
    category: source.category,
    status: 'published',
    topic: source.excerpt,
    language: 'tr',
    template,
    promptVersion: LOCALIZER_PROMPT_VERSION,
    sourceHints: sourceReferences,
    seo: content.seo,
    createdAt: now,
    updatedAt: now,
  };

  const publishedFile = await publishGeneratedContentArtifact(source.slug, job, content, {
    locale: 'tr',
    translationOf: source.slug,
    metadata: parsed.metadata,
    sourceReferences,
  });
  console.log(`✓ Published ${publishedFile}`);
}

main().catch((error) => {
  console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
```

Add to `package.json` scripts:

```json
"content:translate": "node --import tsx scripts/translate-article.ts",
```

- [ ] **Step 4: Dry-run against the candidate article**

Run:

```bash
pnpm content:translate --slug=fpv-beginner-setup-guide-the-easiest-way-to-get-flying --dry-run --files-only
```

Expected: `✓ Gate passed: fpv-beginner-setup-guide-the-easiest-way-to-get-flying → tr (<N> words, SEO <S>)` with `S >= 80` and one section id (`article`). No files written.

If `DIFY_WORKFLOW_TOKEN_LOCALIZER` is unavailable, run the workflow in the Dify UI with the inputs from the contract doc, save the `localized_article` string to `/tmp/localizer-fpv-beginner.json`, and re-run with `--from-file=/tmp/localizer-fpv-beginner.json`.

- [ ] **Step 5: Publish the article**

Run:

```bash
pnpm content:translate --slug=fpv-beginner-setup-guide-the-easiest-way-to-get-flying --files-only
```

Expected: `✓ Published content/published/tr/fpv-beginner-setup-guide-the-easiest-way-to-get-flying.json`.

Verify the artifact invariants:

```bash
node -e "const a=require('./content/published/tr/fpv-beginner-setup-guide-the-easiest-way-to-get-flying.json'); console.log(a.locale, a.translationOf, a.seo.slug, a.metadata.contentType, a.bodySections.map(s=>s.id));"
```

Expected: `tr fpv-beginner-setup-guide-the-easiest-way-to-get-flying fpv-beginner-setup-guide-the-easiest-way-to-get-flying tutorial [ 'article' ]` and `media.coverImage.src === '/api/content/media/cover/fpv-beginner-setup-guide-the-easiest-way-to-get-flying?locale=tr'`.

- [ ] **Step 6: Link the article from the Turkish start steps**

In `src/lib/i18n/start-steps.ts`, change the first Turkish step (line 85):

```ts
      articleSlugs: ['fpv-beginner-setup-guide-the-easiest-way-to-get-flying'],
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `pnpm locale:test && pnpm locale:localizer-test && pnpm content:language-audit`
Expected: PASS. The pre-C2 audit only scans the English tree, so the new Turkish file is ignored until Task 7 adds the Turkish tree to the scan.

- [ ] **Step 8: Graph check and commit**

```bash
node .gitnexus/run.cjs detect-changes --scope all --repo .
git add scripts/translate-article.ts src/lib/i18n/start-steps.ts scripts/locale-regression-test.ts package.json content/published/tr/fpv-beginner-setup-guide-the-easiest-way-to-get-flying.json content/published/tr/fpv-beginner-setup-guide-the-easiest-way-to-get-flying.md
git commit -m "feat(content): publish the first Turkish guide"
```

The DB row is written by `upsertPublishedArtifact` whenever the publish runs with a reachable database (`FPV_STORAGE_MODE=dual|postgres`). Local runs use `--files-only` because `.env.local` still points at the decommissioned database host; rendering reads the committed file, and the next publish with DB access mirrors it into `published_articles_shadow (slug, 'tr')`.

---

### Task 7: Translation-aware sitemap, scoped analytics queries, and the audit gate

**Files:**
- Create: `src/lib/content-automation/translation-index.ts`
- Modify: `src/app/sitemap.xml/route.ts:60-146`
- Modify: `src/lib/automation/automation-status.ts:222,226`
- Modify: `src/lib/server/newsletter-orchestrator.ts:18`
- Modify: `scripts/content-language-audit.ts`
- Test: `scripts/locale-regression-test.ts`

**Interfaces:**
- Produces: `indexTranslationsBySource(translations, isIndexable?): Map<string, PublishedArtifact>`
- Changes: sitemap pairs only through `translationOf`.

- [ ] **Step 1: Write the failing tests**

In `scripts/locale-regression-test.ts`, import `indexTranslationsBySource` and append:

```ts
check('translation index ignores same-slug artifacts without translationOf', () => {
  const translated = { slug: 'k', translationOf: 'k' } as PublishedArtifact;
  const sameSlugOnly = { slug: 'other' } as PublishedArtifact;
  const index = indexTranslationsBySource([translated, sameSlugOnly]);
  assert.equal(index.get('k'), translated);
  assert.equal(index.size, 1);
  assert.equal(indexTranslationsBySource([translated], () => false).size, 0);
});

check('sitemap pairs Turkish articles through translationOf', () => {
  const source = readFileSync('src/app/sitemap.xml/route.ts', 'utf8');
  assert.match(source, /indexTranslationsBySource/);
  assert.doesNotMatch(source, /turkishArticlesBySlug\.has\(slug\)/, 'same-slug coincidence must not create an hreflang cluster');
});

check('shadow-table analytics queries stay on the English tree', () => {
  const status = readFileSync('src/lib/automation/automation-status.ts', 'utf8');
  assert.match(status, /FROM fpvlovers_app\.published_articles_shadow\s+WHERE locale = 'en'/);
  const newsletter = readFileSync('src/lib/server/newsletter-orchestrator.ts', 'utf8');
  assert.match(newsletter, /FROM fpvlovers_app\.published_articles_shadow\s+WHERE locale = 'en'/);
});

check('content language audit covers both trees and the translation pairing', () => {
  const source = readFileSync('scripts/content-language-audit.ts', 'utf8');
  assert.match(source, /path\.join\(PUBLISHED_DIR, 'tr'\)/);
  assert.match(source, /hasLanguageMismatch\(artifact, 'tr'\)/);
  assert.match(source, /Missing translationOf/);
  assert.match(source, /Missing locale:"tr" marker/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm locale:test`
Expected: FAIL — no translation index module, sitemap still uses `turkishArticlesBySlug`, queries are unscoped.

- [ ] **Step 3: Add the translation index**

Create `src/lib/content-automation/translation-index.ts`:

```ts
import type { PublishedArtifact } from './content-reader';

/** Turkish artifacts keyed by the English slug they translate; ignores same-slug coincidence. */
export function indexTranslationsBySource(
  translations: readonly PublishedArtifact[],
  isIndexable: (article: PublishedArtifact) => boolean = () => true,
): Map<string, PublishedArtifact> {
  const index = new Map<string, PublishedArtifact>();
  for (const article of translations) {
    if (!article.slug || !article.translationOf) continue;
    if (!isIndexable(article)) continue;
    index.set(article.translationOf, article);
  }
  return index;
}
```

- [ ] **Step 4: Rewire the sitemap**

In `src/app/sitemap.xml/route.ts`, add the import:

```ts
import { indexTranslationsBySource } from '@/lib/content-automation/translation-index';
```

Replace `articleAlternates` so the two sides can carry different slugs (they must be equal by gate, but the sitemap should not assume it):

```ts
/**
 * A translated article pair carries both language alternates on both sides;
 * an article with no counterpart advertises nothing.
 */
function articleAlternates(slug: string, turkishSlug: string | undefined): string {
  if (!turkishSlug) return '';
  return [
    `      <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/article/${slug}" />`,
    `      <xhtml:link rel="alternate" hreflang="tr" href="${BASE_URL}${turkishArticlePath(turkishSlug)}" />`,
  ].map((link) => `\n${link}`).join('');
}
```

Replace the Turkish map with the index:

```ts
  // Pairs only through translationOf; listPublishedContentAsync('tr') falls back
  // to an empty list when the Turkish directory or database is unavailable.
  const turkishIndex = indexTranslationsBySource(
    await listPublishedContentAsync('tr'),
    isIndexablePublishedArtifact,
  );
```

Update the English dynamic URLs:

```ts
  const dynamicUrls = Array.from(articlesBySlug.entries()).map(([slug, publishedAt]) => `
    <url>
      <loc>${BASE_URL}/article/${slug}</loc>
      ${publishedAt ? `<lastmod>${new Date(publishedAt).toISOString()}</lastmod>` : ''}
      <priority>0.8</priority>
      <changefreq>weekly</changefreq>${articleAlternates(slug, turkishIndex.get(slug)?.slug)}
    </url>`);
```

Replace the Turkish dynamic URLs:

```ts
  const turkishArticleUrls = Array.from(turkishIndex.entries())
    .filter(([sourceSlug]) => articlesBySlug.has(sourceSlug))
    .map(([sourceSlug, article]) => `
    <url>
      <loc>${BASE_URL}${turkishArticlePath(article.slug)}</loc>
      ${article.publishedAt ? `<lastmod>${new Date(article.publishedAt).toISOString()}</lastmod>` : ''}
      <priority>0.8</priority>
      <changefreq>weekly</changefreq>${articleAlternates(sourceSlug, article.slug)}
    </url>`);
```

- [ ] **Step 5: Scope the shadow-table queries to English**

In `src/lib/automation/automation-status.ts`, both queries at lines 222 and 226:

```sql
      FROM fpvlovers_app.published_articles_shadow
      WHERE locale = 'en'
```

In `src/lib/server/newsletter-orchestrator.ts`:

```sql
        `SELECT title, excerpt, slug FROM fpvlovers_app.published_articles_shadow
         WHERE locale = 'en'
         ORDER BY published_at DESC NULLS LAST LIMIT 3`
```

- [ ] **Step 6: Extend the language audit to the Turkish tree**

Replace `scripts/content-language-audit.ts` with:

```ts
import fs from 'fs';
import path from 'path';
import {
  ensureMediaArtifact,
  hasLanguageMismatch,
  hasTurkishLanguageLeak,
  type PublishedArtifact,
} from '../src/lib/content-automation/content-reader';
import type { Locale } from '../src/lib/i18n/locale';

const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');

type AuditTree = { locale: Locale; dir: string };

const TREES: AuditTree[] = [
  { locale: 'en', dir: PUBLISHED_DIR },
  { locale: 'tr', dir: path.join(PUBLISHED_DIR, 'tr') },
];

type Failure = { file: string; slug: string; reason: string };

function readArtifact(dir: string, file: string, locale: Locale): PublishedArtifact | null {
  try {
    const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
    return ensureMediaArtifact(JSON.parse(raw), locale);
  } catch (error) {
    console.error(`[language-audit] cannot read ${file}:`, error);
    return null;
  }
}

let checked = 0;
const failures: Failure[] = [];

for (const tree of TREES) {
  if (!fs.existsSync(tree.dir)) continue;
  const files = fs.readdirSync(tree.dir).filter((file) => file.endsWith('.json')).sort();
  for (const file of files) {
    const artifact = readArtifact(tree.dir, file, tree.locale);
    if (!artifact) continue;
    checked += 1;

    if (tree.locale === 'en' && hasTurkishLanguageLeak(artifact)) {
      failures.push({ file, slug: artifact.slug, reason: 'Turkish text in the English tree' });
    }
    if (tree.locale === 'tr') {
      if (hasLanguageMismatch(artifact, 'tr')) {
        failures.push({ file, slug: artifact.slug, reason: 'English text in the Turkish tree' });
      }
      if (!artifact.translationOf) {
        failures.push({ file, slug: artifact.slug, reason: 'Missing translationOf' });
      }
      if (artifact.locale !== 'tr') {
        failures.push({ file, slug: artifact.slug, reason: `Missing locale:"tr" marker (found ${artifact.locale || 'none'})` });
      }
    }
  }
}

if (failures.length === 0) {
  console.log(`✓ content language audit passed (${checked} artifacts checked)`);
  process.exit(0);
}

console.error(`✗ content language audit failed: ${failures.length} issue(s) across ${checked} artifacts`);
for (const failure of failures) {
  console.error(`  - ${failure.slug} (${failure.file}): ${failure.reason}`);
}

process.exit(1);
```

- [ ] **Step 7: Run the full verification suite**

Run:

```bash
pnpm locale:test
pnpm locale:localizer-test
pnpm content:language-audit
pnpm seo:discoverability-test
./node_modules/.bin/tsc --noEmit
pnpm build
```

Expected: every script exits 0; `tsc` reports no errors; `next build` succeeds.

- [ ] **Step 8: Verify locally in a browser session**

```bash
PORT=3011 pnpm dev
```

In a second shell:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3011/tr/article/fpv-beginner-setup-guide-the-easiest-way-to-get-flying
curl -s http://localhost:3011/tr/article/fpv-beginner-setup-guide-the-easiest-way-to-get-flying | grep -i -c 'hreflang'
curl -s http://localhost:3011/article/fpv-beginner-setup-guide-the-easiest-way-to-get-flying | grep -i -c 'hreflang'
curl -s http://localhost:3011/sitemap.xml | grep -c '<loc>'
curl -s -o /dev/null -w '%{http_code}\n' 'http://localhost:3011/api/content/media/cover/fpv-beginner-setup-guide-the-easiest-way-to-get-flying?locale=tr'
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3011/tr/article/not-a-real-slug
```

Expected: `200`; both article pages emit `2` hreflang tags; sitemap grows by one `<loc>` versus the pre-C2 count with a Turkish article entry; the TR cover returns `200`; the unknown slug returns `404`. Open the Turkish article and confirm the body, breadcrumb, category, level badge, and "DEVAM ET" copy are Turkish and the cover is the `?locale=tr` artwork.

- [ ] **Step 9: Graph check and commit**

```bash
node .gitnexus/run.cjs detect-changes --scope all --repo .
git add src/lib/content-automation/translation-index.ts src/app/sitemap.xml/route.ts src/lib/automation/automation-status.ts src/lib/server/newsletter-orchestrator.ts scripts/content-language-audit.ts scripts/locale-regression-test.ts
git commit -m "feat(seo): pair Turkish articles through translationOf"
```

- [ ] **Step 10: Deploy and verify production (requires explicit approval)**

Ask for approval before pushing or triggering Coolify. Then:

```bash
git push origin main
ssh affexai-prod 'docker exec coolify php artisan tinker --execute="\$a = App\\Models\\Application::where(\"uuid\",\"jnlhgqmjnqwpdgefsoskew5n\")->first(); \$u = new_public_id(); \$r = queue_application_deployment(application: \$a, deployment_uuid: \$u, force_rebuild: true, is_api: true, no_questions_asked: true); echo json_encode([\"deployment_uuid\"=>\$u, \"result\"=>\$r]);"'
```

Poll `App\Models\ApplicationDeploymentQueue` (`status`, `commit`, `created_at`, `finished_at`, `force_rebuild`) until `finish`/`success`, then confirm `docker ps | grep jnlhgqmjnqwpdgefsoskew5n` shows the new commit tag. Live checks:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://fpvlovers.com.tr/tr/article/fpv-beginner-setup-guide-the-easiest-way-to-get-flying
curl -s https://fpvlovers.com.tr/tr/article/fpv-beginner-setup-guide-the-easiest-way-to-get-flying | grep -i -c 'hreflang'
curl -s https://fpvlovers.com.tr/article/fpv-beginner-setup-guide-the-easiest-way-to-get-flying | grep -i -c 'hreflang'
curl -s https://fpvlovers.com.tr/sitemap.xml | grep -c '<loc>'
```

Expected: `200`; `2` hreflang tags on both article pages; sitemap count equals the previous count + 1. Confirm `/tr/guides`, `/tr/search`, and `/tr/academy` now link to `/tr/article/fpv-beginner-setup-guide-the-easiest-way-to-get-flying`, and that the English tree still returns `200` on all previously verified URLs.

---

## Self-Review

**Spec coverage**

| Requirement | Task |
| --- | --- |
| `/tr/article/[slug]` route with Turkish-only reads | Task 2 |
| DB `locale='tr'` write path (`(slug, locale)` row, `json_path`) | Task 4 |
| `translationOf` population and single-source pairing | Tasks 1, 4, 6 |
| TR-tree article links (guides, search, start steps) | Task 3, Task 6 |
| Dify localized-rewrite workflow contract | Task 5 |
| First SHGM-adjacent guide published in Turkish | Task 6 |
| Sitemap/alternates and Turkish-only analytics | Task 7 |
| Language audit covering both trees | Task 7 |

**Placeholder scan:** every step contains exact code, exact commands, or exact expected output. The only runtime-dependent values are the article word count/SEO score printed by the gate and the sitemap count, both with explicit thresholds.

**Type consistency:** `localizeArticlePath(slug, locale)`, `localizeArticleLink(link, locale, set)`, `isTranslationPair(sourceSlug, candidate)`, `buildArticleAlternates(slug, hasEnglish, hasTurkish)`, `PublishArtifactOptions`, `assertPublishableLocale(locale, translationOf)`, `LocalizerSource`, `ParsedLocalizedRewrite`, `validateLocalizedRewrite(source, parsed)`, `buildLocalizedContent(parsed, source)`, and `indexTranslationsBySource(translations, isIndexable?)` are used with the same signatures in every task.
