import type { Locale } from './locale';

/**
 * ASCII counterparts for Turkish letters (and the Turkish diacritics used in
 * loanwords). Folding preserves case: `Ş` becomes `S`, not `s`, so
 * `foldTurkish` is a pure diacritic strip. `normalizeSearchText` lowercases
 * before folding, so its output is lowercase.
 *
 * `I` maps to itself: it is ASCII already, and Turkish lowercasing turns it
 * into `ı`, which the map then folds to `i`.
 */
const TURKISH_FOLD: Record<string, string> = {
  ı: 'i',
  İ: 'I',
  I: 'I',
  ş: 's',
  Ş: 'S',
  ğ: 'g',
  Ğ: 'G',
  ç: 'c',
  Ç: 'C',
  ö: 'o',
  Ö: 'O',
  ü: 'u',
  Ü: 'U',
  â: 'a',
  Â: 'A',
  î: 'i',
  Î: 'I',
  û: 'u',
  Û: 'U',
};

const TURKISH_LETTERS = /[ışŞğĞçÇöÖüÜİIâÂîÎûÛ]/g;

/**
 * Folds Turkish letters to their ASCII equivalents so `ucus` and `uçuş` meet
 * on the same token. Locale-independent: callers who must preserve diacritics
 * decide whether to call this at all.
 */
export function foldTurkish(input: string): string {
  return input.replace(TURKISH_LETTERS, (char) => TURKISH_FOLD[char] ?? char);
}

/**
 * Lowercases for search and, for Turkish only, folds the result. English
 * output stays byte-identical to `input.toLowerCase()`.
 */
export function normalizeSearchText(input: string, locale: Locale): string {
  const lowered = locale === 'tr' ? input.toLocaleLowerCase('tr-TR') : input.toLowerCase();
  return locale === 'tr' ? foldTurkish(lowered) : lowered;
}
