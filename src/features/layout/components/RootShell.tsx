import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { GoogleAnalytics } from '@next/third-parties/google';
import { SessionProvider } from 'next-auth/react';
import type { Locale } from '@/lib/i18n/locale';
import { SITE_JSON_LD } from '@/lib/seo/root-metadata';
import { Navbar } from './Navbar';
import { SiteFooter } from './SiteFooter';
import { MobileUtilityBar } from './MobileUtilityBar';
import { CookieBanner } from './CookieBanner';

export function RootShell({ lang, children }: { lang: Locale; children: ReactNode }) {
  const enableVercelAnalytics = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS === 'true';

  return (
    <html lang={lang} className="dark">
      <body className="font-sans min-h-screen antialiased selection:bg-[#ff5a1f]/30 selection:text-white relative" suppressHydrationWarning>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: SITE_JSON_LD }} />
        <SessionProvider>
          {/* Subtle global atmosphere. Tool pages can opt into heavier cockpit UI locally. */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute inset-0 carbon-grid opacity-35" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff5a1f]/45 to-transparent" />
          </div>

          <Navbar locale={lang} />
          <main className="relative z-10 pb-16 lg:pb-0">{children}</main>
          <MobileUtilityBar locale={lang} />
          <CookieBanner />
          <SiteFooter locale={lang} />
          {enableVercelAnalytics && <Analytics />}
          {process.env.NEXT_PUBLIC_GA_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          )}
        </SessionProvider>
      </body>
    </html>
  );
}
