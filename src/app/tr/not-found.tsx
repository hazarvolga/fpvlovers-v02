import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sayfa bulunamadı | FPVLovers',
  description: 'Aradığın sayfa mevcut değil.',
  robots: { index: false, follow: false },
};

/**
 * Segment-level 404 for the Turkish tree. Rendered inside `tr/layout.tsx`,
 * so it must not own `<html>` / `<body>` — the layout supplies the document,
 * navbar and footer. Mirrors `(en)/not-found.tsx` so the two cannot drift.
 */
export default function TurkishNotFound() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-6 py-24">
      <p className="mb-4 font-mono text-xs uppercase tracking-[0.35em] text-[#ff3131]">404 / sinyal kayboldu</p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">Sayfa bulunamadı</h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-400">
        Bu sayfayı bulamadık — taşınmış veya adı değişmiş olabilir.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-4 text-sm">
        <Link
          href="/tr"
          className="rounded-md bg-[#ff3131] px-4 py-2 font-medium text-white transition-colors hover:bg-[#e12227]"
        >
          Ana sayfaya dön
        </Link>
        <Link
          href="/tr/search"
          className="rounded-md border border-zinc-700 px-4 py-2 font-medium text-zinc-300 transition-colors hover:border-[#ff3131] hover:text-white"
        >
          Sitede ara
        </Link>
      </div>
    </section>
  );
}
