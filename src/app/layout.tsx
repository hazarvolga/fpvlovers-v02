import type { Metadata } from 'next';
import './globals.css';

import { Navbar } from '@/features/layout/components/Navbar';
import { SearchSection } from '@/features/layout/components/SearchSection';
import { SiteFooter } from '@/features/layout/components/SiteFooter';
import { MobileUtilityBar } from '@/features/layout/components/MobileUtilityBar';
import { CookieBanner } from '@/features/layout/components/CookieBanner';
import { Analytics } from '@vercel/analytics/react';
import { GoogleAnalytics } from '@next/third-parties/google';
import { SessionProvider } from 'next-auth/react';
import { buildCoverImageUrl } from '@/lib/content-automation/content-media';

const DEFAULT_SITE_COVER = buildCoverImageUrl('site-default');

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
        <SessionProvider>
          {/* Subtle global atmosphere. Tool pages can opt into heavier cockpit UI locally. */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute inset-0 carbon-grid opacity-35" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff5a1f]/45 to-transparent" />
          </div>

          <Navbar />
          <SearchSection />
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
