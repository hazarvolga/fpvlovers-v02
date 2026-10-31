import Link from 'next/link';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import type { LegalController } from '@/lib/legal/controller';
import type { LegalDocument } from '@/lib/legal/documents';
import { legalPath } from '@/lib/legal/paths';
import type { Locale } from '@/lib/i18n/locale';

export function LegalDocumentPage({
  locale,
  document,
  controller,
}: {
  locale: Locale;
  document: LegalDocument;
  controller: LegalController;
}) {
  const isTr = locale === 'tr';
  return (
    <div className="fpv-public-shell mx-auto max-w-4xl px-4 py-12 pt-28 font-sans text-zinc-300 sm:px-6 lg:px-8">
      <CyberBreadcrumb
        items={[
          { label: isTr ? 'Ana Sayfa' : 'Home', href: isTr ? '/tr' : '/' },
          { label: document.title, isCurrentPage: true },
        ]}
        className="mb-8"
      />

      <header className="fpv-public-panel relative mb-10 overflow-hidden rounded-xl p-8 shadow-2xl md:p-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF5C00]/45 to-transparent" />
        <h1 className="text-4xl font-black uppercase tracking-tight text-zinc-100 md:text-5xl">{document.title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">{document.description}</p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          {isTr ? 'Son güncelleme' : 'Last updated'}: {document.updated}
        </p>
      </header>

      <div className="space-y-8">
        {document.sections.map((section) => (
          <section key={section.heading} className="rounded-xl border border-white/5 bg-zinc-900/40 p-6 md:p-8">
            <h2 className="border-b border-white/5 pb-4 text-lg font-bold uppercase tracking-wider text-zinc-100">{section.heading}</h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-400">
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.bullets && (
                <ul className="list-disc space-y-2 pl-5">
                  {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-white/5 bg-zinc-950/60 p-6 text-sm text-zinc-400">
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">{isTr ? 'Veri sorumlusu' : 'Data controller'}</p>
        <p className="mt-2 text-zinc-200">{controller.name}</p>
        <p>{controller.address}</p>
        <p>{controller.email}{controller.kep ? ` · KEP: ${controller.kep}` : ''}{controller.taxId ? ` · ${isTr ? 'Vergi No' : 'Tax ID'}: ${controller.taxId}` : ''}</p>
      </div>

      <nav className="mt-8 flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
        <Link href={legalPath('privacy', locale)} className="hover:text-zinc-100">{isTr ? 'Gizlilik Politikası' : 'Privacy Policy'}</Link>
        <Link href={legalPath('cookies', locale)} className="hover:text-zinc-100">{isTr ? 'Çerez Politikası' : 'Cookie Policy'}</Link>
        <Link href={legalPath('terms', locale)} className="hover:text-zinc-100">{isTr ? 'Kullanım Koşulları' : 'Terms of Service'}</Link>
        {isTr && <Link href={legalPath('kvkk', locale)} className="hover:text-zinc-100">KVKK Aydınlatma</Link>}
      </nav>

      <p className="mt-6 font-mono text-[10px] text-zinc-600">
        {isTr ? 'Hukuki metin sürümü' : 'Legal document version'}: {document.updated}
      </p>
    </div>
  );
}
