import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page not found | FPVLovers',
  description: 'The page you are looking for does not exist.',
  robots: { index: false, follow: false },
};

/**
 * Segment-level 404 for the English tree. Rendered inside `(en)/layout.tsx`,
 * so it must not own `<html>` / `<body>` — the layout supplies the document,
 * navbar and footer.
 */
export default function EnglishNotFound() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-6 py-24">
      <p className="mb-4 font-mono text-xs uppercase tracking-[0.35em] text-[#ff3131]">404 / signal lost</p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">Page not found</h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-400">
        We could not find that page — it may have been moved or renamed.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-4 text-sm">
        <Link
          href="/"
          className="rounded-md bg-[#ff3131] px-4 py-2 font-medium text-white transition-colors hover:bg-[#e12227]"
        >
          Back to home
        </Link>
        <Link
          href="/search"
          className="rounded-md border border-zinc-700 px-4 py-2 font-medium text-zinc-300 transition-colors hover:border-[#ff3131] hover:text-white"
        >
          Search the site
        </Link>
      </div>
    </section>
  );
}
