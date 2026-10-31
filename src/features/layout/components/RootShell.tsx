import type { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import type { Locale } from '@/lib/i18n/locale';
import { SITE_JSON_LD } from '@/lib/seo/root-metadata';
import { Navbar } from './Navbar';
import { SiteFooter } from './SiteFooter';
import { MobileUtilityBar } from './MobileUtilityBar';
import { CookieBanner } from './CookieBanner';
import { ConsentProvider } from './ConsentProvider';
import { ConsentGatedAnalytics } from './ConsentGatedAnalytics';
import { getLegalController, isLegalControllerConfigured } from '@/lib/legal/controller';

export function RootShell({ lang, children }: { lang: Locale; children: ReactNode }) {
  const enableVercelAnalytics = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS === 'true';
  // Without a configured controller the legal pages 404, so production must not
  // ask for consent or load analytics either.
  const consentSurfacesEnabled =
    process.env.NODE_ENV !== 'production' || isLegalControllerConfigured(getLegalController());

  return (
    <html lang={lang} className="dark">
      <body className="font-sans min-h-screen antialiased selection:bg-[#ff5a1f]/30 selection:text-white relative" suppressHydrationWarning>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: SITE_JSON_LD }} />
        <SessionProvider>
          <ConsentProvider>
            {/* Subtle global atmosphere. Tool pages can opt into heavier cockpit UI locally. */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
              <div className="absolute inset-0 carbon-grid opacity-35" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff5a1f]/45 to-transparent" />
            </div>

            <Navbar locale={lang} />
            <main className="relative z-10 pb-16 lg:pb-0">{children}</main>
            <MobileUtilityBar locale={lang} />
            {consentSurfacesEnabled && <CookieBanner locale={lang} />}
            <SiteFooter locale={lang} />
            {consentSurfacesEnabled && (
              <ConsentGatedAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} vercelEnabled={enableVercelAnalytics} />
            )}
          </ConsentProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
