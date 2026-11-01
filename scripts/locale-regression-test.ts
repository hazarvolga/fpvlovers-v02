import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_LOCALE,
  TRANSLATED_PATHS,
  isLocale,
  isTranslatedPath,
  localizeArticleLink,
  localizeArticlePath,
  localizePath,
  resolveLocale,
  splitLocalePath,
} from '../src/lib/i18n/locale';
import { foldTurkish, normalizeSearchText } from '../src/lib/i18n/search-text';
import { START_STEPS } from '../src/lib/i18n/start-steps';
import {
  GUIDE_GROUPS,
  READER_LEVELS,
  getGuideGroupDescription,
  getGuideGroupLabel,
  getReaderLevelLabel,
} from '../src/lib/content-taxonomy';
import {
  getPublishedContentBySlug,
  hasLanguageMismatch,
  hasTurkishLanguageLeak,
  isTranslationPair,
  listPublishedContent,
  publishedDirFor,
  type PublishedArtifact,
} from '../src/lib/content-automation/content-reader';
import { buildContentMedia, buildCoverImageUrl } from '../src/lib/content-automation/content-media';
import { navigationData } from '../src/lib/navigationData';
import {
  CHROME_COPY,
  FOOTER_COPY_TR,
  NAV_COPY_TR,
  getChromeCopy,
  getFooterCopy,
  getNavigation,
} from '../src/lib/i18n/labels';

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

check('translated path allowlist is explicit', () => {
  assert.deepEqual([...TRANSLATED_PATHS], ['/', '/academy', '/guides', '/search']);
});

check('trailing slashes do not defeat the allowlist', () => {
  assert.equal(isTranslatedPath('/academy/'), true);
  assert.equal(localizePath('/academy/', 'tr'), '/tr/academy');
  assert.equal(localizePath('/', 'tr'), '/tr');
  assert.equal(localizePath('/guides/?level=beginner', 'tr'), '/tr/guides?level=beginner');
  assert.equal(localizePath('/academy/', 'en'), '/academy/');
});

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

check('English listing keeps its artifacts and default locale', () => {
  const english = listPublishedContent('en');
  assert.ok(english.length > 100, `expected >100 English artifacts, got ${english.length}`);
  assert.equal(english.length, listPublishedContent().length);
});

check('Turkish listing contains only Turkish artifacts', () => {
  const turkish = listPublishedContent('tr');
  for (const artifact of turkish) {
    assert.equal(artifact.locale, 'tr', `artifact ${artifact.slug} is in the tr tree without locale "tr"`);
    assert.ok(artifact.translationOf, `artifact ${artifact.slug} has no translationOf pairing`);
    assert.ok(getPublishedContentBySlug(artifact.translationOf as string, 'en'), `${artifact.slug} pairs with a missing English source`);
  }
});

check('Slug lookup respects the locale', () => {
  const slug = 'fpv-beginner-setup-guide-the-easiest-way-to-get-flying';
  assert.ok(getPublishedContentBySlug(slug, 'en'));
  assert.equal(getPublishedContentBySlug(slug, 'tr')?.translationOf, slug);
  assert.equal(getPublishedContentBySlug('acro-mode-mental-model-for-fpv-beginners', 'tr'), null);
});

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

check('navbar localizes the home and search destinations', () => {
  const source = readFileSync('src/features/layout/components/Navbar.tsx', 'utf8');
  assert.match(source, /localizePath\(\s*'\/'\s*,\s*locale\s*\)/, 'navbar logo must localize "/"');
  assert.match(source, /localizePath\(\s*'\/search'\s*,\s*locale\s*\)/, 'navbar search must localize "/search"');
});

check('footer tiles resolve Turkish titles from the navigation catalog', () => {
  const tr = getFooterCopy('tr');
  assert.equal(tr['/tools/calculator'], 'Yapım Hesaplayıcısı');
  assert.equal(tr['/tools/part-matcher'], 'Parça Eşleştirici');
  assert.equal(tr['/racing/news'], 'Yarış Haberleri');
  assert.equal(tr['/regulations/battery'], 'Batarya Güvenliği');
  assert.equal(tr['/privacy'], 'Gizlilik Politikası');
  assert.equal(tr['/regulations'], 'Kurallar');
  assert.equal(tr['/academy/glossary'], 'Sözlük');
});

check('start steps exist for both locales', () => {
  for (const locale of ['en', 'tr'] as const) {
    assert.equal(START_STEPS[locale].length, 6, `${locale} must have six steps`);
    for (const step of START_STEPS[locale]) {
      assert.ok(step.title, `${locale} step is missing a title`);
      assert.ok(step.why, `${locale} step is missing a rationale`);
      assert.ok(step.todo.length > 0, `${locale} step ${step.title} has no actions`);
    }
  }
});

check('Turkish start steps reference only published Turkish artifacts', () => {
  const trSlugs = new Set(listPublishedContent('tr').map((artifact) => artifact.slug));
  const referenced = START_STEPS.tr.flatMap((step) => step.articleSlugs);
  assert.ok(referenced.length > 0, 'the first Turkish article must be linked from the start steps');
  for (const slug of referenced) {
    assert.ok(trSlugs.has(slug), `missing Turkish artifact: ${slug}`);
  }
});

check('guide taxonomy labels are translated for every group and level', () => {
  for (const group of GUIDE_GROUPS) {
    assert.equal(getGuideGroupLabel(group, 'en'), group.label);
    assert.notEqual(getGuideGroupLabel(group, 'tr'), group.label, `missing tr label for ${group.id}`);
    assert.notEqual(getGuideGroupDescription(group, 'tr'), group.description, `missing tr description for ${group.id}`);
  }
  for (const level of READER_LEVELS) {
    assert.equal(getReaderLevelLabel(level.id, 'en'), level.label);
    assert.notEqual(getReaderLevelLabel(level.id, 'tr'), level.label, `missing tr label for ${level.id}`);
  }
});

check('search client folds both document and query text', () => {
  const source = readFileSync('src/features/search/components/SearchClient.tsx', 'utf8');
  assert.match(source, /normalizeSearchText/, 'SearchClient must use the shared folding helper');
  assert.match(source, /normalizeSearchText\(query\.trim\(\), locale\)/, 'the query memo must fold through the helper');
  assert.doesNotMatch(source, /query\.trim\(\)\.toLowerCase\(\)/, 'raw toLowerCase on the query bypasses folding');
});

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

check('sitemap advertises Turkish alternates for translated pages', () => {
  const source = readFileSync('src/app/sitemap.xml/route.ts', 'utf8');
  assert.match(source, /xmlns:xhtml=/, 'sitemap must declare the xhtml namespace');
  assert.match(source, /if \(!isTranslatedPath\(path\)\) return ''/, 'untranslated paths must not advertise an alternate');
  assert.match(source, /\.filter\(page => isTranslatedPath\(page\.url\)\)/, 'Turkish static URLs must be gated on translated paths');
  assert.match(source, /localizePath\(page\.url, 'tr'\)/, 'Turkish static URLs must go through localizePath');
});

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

check('translation pairing requires an explicit translationOf', () => {
  const translated = { translationOf: 'fpv-kit', slug: 'fpv-kit' } as PublishedArtifact;
  const sameSlugOnly = { slug: 'fpv-kit' } as PublishedArtifact;
  assert.equal(isTranslationPair('fpv-kit', translated), true);
  assert.equal(isTranslationPair('fpv-kit', sameSlugOnly), false);
  assert.equal(isTranslationPair('fpv-kit', null), false);
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
