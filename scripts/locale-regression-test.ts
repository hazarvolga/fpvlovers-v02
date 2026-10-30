import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_LOCALE,
  TRANSLATED_PATHS,
  isLocale,
  isTranslatedPath,
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
  listPublishedContent,
  type PublishedArtifact,
} from '../src/lib/content-automation/content-reader';
import { buildCoverImageUrl } from '../src/lib/content-automation/content-media';
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

check('Turkish listing is empty until the tr content directory exists', () => {
  assert.deepEqual(listPublishedContent('tr'), []);
});

check('Slug lookup respects the locale', () => {
  assert.ok(getPublishedContentBySlug('fpv-beginner-setup-guide-the-easiest-way-to-get-flying', 'en'));
  assert.equal(getPublishedContentBySlug('fpv-beginner-setup-guide-the-easiest-way-to-get-flying', 'tr'), null);
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

check('Turkish start steps ship as a shell without English article slugs', () => {
  assert.ok(START_STEPS.tr.every((step) => step.articleSlugs.length === 0));
  assert.ok(START_STEPS.en[0].articleSlugs.length > 0);
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
