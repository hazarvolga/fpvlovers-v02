import type { Locale } from '@/lib/i18n/locale';

export function LegalConfigurationNotice({ locale }: { locale: Locale }) {
  return (
    <div className="fpv-public-shell mx-auto max-w-3xl px-4 py-12 pt-28">
      <div className="rounded-xl border border-[#FF5C00]/30 bg-[#FF5C00]/5 p-8 font-mono text-sm text-zinc-200">
        <h1 className="text-lg font-black uppercase tracking-wider text-[#FF5C00]">
          {locale === 'tr' ? 'Hukuki sayfa yapılandırması eksik' : 'Legal page configuration missing'}
        </h1>
        <p className="mt-4 leading-relaxed">
          {locale === 'tr'
            ? 'LEGAL_CONTROLLER_NAME, LEGAL_CONTROLLER_ADDRESS ve LEGAL_CONTROLLER_EMAIL ortam değişkenleri ayarlanmadan bu sayfa yayınlanmaz.'
            : 'Set LEGAL_CONTROLLER_NAME, LEGAL_CONTROLLER_ADDRESS and LEGAL_CONTROLLER_EMAIL before this page can be published.'}
        </p>
      </div>
    </div>
  );
}
