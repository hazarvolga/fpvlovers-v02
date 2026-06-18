import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
import { Navbar } from '@/features/layout/components/Navbar';
import { SearchSection } from '@/features/layout/components/SearchSection';
import { SiteFooter } from '@/features/layout/components/SiteFooter';
import { MobileUtilityBar } from '@/features/layout/components/MobileUtilityBar';
import { CookieBanner } from '@/features/layout/components/CookieBanner';
import { Analytics } from '@vercel/analytics/react';
import { GoogleAnalytics } from '@next/third-parties/google';
import { SessionProvider } from 'next-auth/react';

export const metadata: Metadata = {
  title: 'FPV LOVERS | Learn, Build, Race, Fly, Tools, News',
  description: 'English-first FPV guides, engineering references, and practical pilot tools for building, tuning, and learning faster.',
  keywords: ['FPV', 'Learn', 'Build', 'Race', 'Fly', 'Tools', 'News', 'Build Guides', 'Troubleshooting'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
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
          <Analytics />
          {process.env.NEXT_PUBLIC_GA_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          )}
        </SessionProvider>
      </body>
    </html>
  );
}
