import type { Metadata } from 'next';
import './globals.css';

import { Navbar } from '@/features/layout/components/Navbar';
import { SiteFooter } from '@/features/layout/components/SiteFooter';
import { MobileUtilityBar } from '@/features/layout/components/MobileUtilityBar';
import { CookieBanner } from '@/features/layout/components/CookieBanner';
import { Analytics } from '@vercel/analytics/react';
import { GoogleAnalytics } from '@next/third-parties/google';
import { SessionProvider } from 'next-auth/react';
import { buildCoverImageUrl } from '@/lib/content-automation/content-media';

const SITE_URL = process.env.APP_URL || 'https://fpvlovers.com.tr';
const DEFAULT_SITE_COVER = buildCoverImageUrl('site-default');

// Baseline Organization/WebSite structured data for every page. Article pages layer
// their own Article/BreadcrumbList/Review schema on top of this via their own script tag.
const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'FPVLovers',
      url: SITE_URL,
      logo: `${SITE_URL}/logo-type.png`,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'FPVLovers',
      url: SITE_URL,
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};
const safeSiteJsonLd = JSON.stringify(siteJsonLd).replace(/</g, '\\u003c');

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || 'https://fpvlovers.com.tr'),
  title: 'FPV LOVERS | Learn, Build, Race, Fly, Tools, News',
  description: 'English-first FPV guides, engineering references, and practical pilot tools for building, tuning, and learning faster.',
  keywords: ['FPV', 'Learn', 'Build', 'Race', 'Fly', 'Tools', 'News', 'Build Guides', 'Troubleshooting'],
  icons: { icon: '/logo-type.png', shortcut: '/logo-type.png' },
  openGraph: {
    type: 'website',
    siteName: 'FPVLovers',
    title: 'FPVLovers | Learn, Build, Race, Fly',
    description: 'English-first FPV guides, engineering references, and practical pilot tools.',
    images: [{ url: DEFAULT_SITE_COVER, width: 1200, height: 675, alt: 'FPVLovers FPV editorial guides' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FPVLovers | Learn, Build, Race, Fly',
    description: 'English-first FPV guides, engineering references, and practical pilot tools.',
    images: [DEFAULT_SITE_COVER],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const enableVercelAnalytics = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS === 'true';

  return (
    <html lang="en" className="dark">
      <body className="font-sans min-h-screen antialiased selection:bg-[#ff5a1f]/30 selection:text-white relative" suppressHydrationWarning>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeSiteJsonLd }} />
        <SessionProvider>
          {/* Subtle global atmosphere. Tool pages can opt into heavier cockpit UI locally. */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute inset-0 carbon-grid opacity-35" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff5a1f]/45 to-transparent" />
          </div>

          <Navbar />
          <main className="relative z-10 pb-16 lg:pb-0">{children}</main>
          <MobileUtilityBar />
          <CookieBanner />
          <SiteFooter />
          {enableVercelAnalytics && <Analytics />}
          {process.env.NEXT_PUBLIC_GA_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          )}
        </SessionProvider>
      </body>
    </html>
  );
}
