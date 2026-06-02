import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/features/layout/components/Navbar';
import { SearchSection } from '@/features/layout/components/SearchSection';
import { Analytics } from '@vercel/analytics/react';
import { SessionProvider } from 'next-auth/react';

export const metadata: Metadata = {
  title: 'FPV LOVERS | Editorial Hub, Academy, Engineering Lab, and Pilot Tools',
  description: 'English-first FPV guides, engineering references, and practical pilot tools for building, tuning, and learning faster.',
  keywords: ['FPV', 'Editorial', 'Academy', 'Engineering Lab', 'Pilot Tools', 'Build Guides', 'Troubleshooting'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
          <main className="relative z-10">{children}</main>
          <Analytics />
        </SessionProvider>
      </body>
    </html>
  );
}
