import { notFound } from 'next/navigation';

/**
 * Unmatched `/tr/*` URLs would otherwise fall through to the app-level
 * `global-not-found`, which only exists in English. Matching them here lets
 * Next render `tr/not-found.tsx` inside the Turkish layout, so the Turkish
 * 404 keeps Turkish chrome. Real `/tr` routes take precedence over this
 * catch-all.
 */
export default function TurkishCatchAll(): never {
  notFound();
}
