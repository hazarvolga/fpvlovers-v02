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
import { foldTurkish, normalizeSearchText } from '../src/lib/i18n/search-text';

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
