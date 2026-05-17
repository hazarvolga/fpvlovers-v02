import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/features/layout/components/Navbar';
import { SystemHUD } from '@/features/layout/components/SystemHUD';
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: 'FPV LOVERS | CYBER-AERONAUTIC HUD',
  description: 'High-Tech FPV Drone & AI Portal powered by Dify RAG. Discover cutting-edge drone parts, AI flight software, and industry news.',
  keywords: ['FPV', 'Drones', 'AI', 'Dify', 'RAG', 'UAV', 'Flight Software', 'Tech'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#050505] text-[#A0A0A0] font-mono min-h-screen antialiased selection:bg-[#00F2FF]/30 selection:text-white carbon-grid relative" suppressHydrationWarning>
        {/* Global animated background and hud effects */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[#00F2FF] opacity-[0.02] mix-blend-overlay glitch-bg" />
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00F2FF]/20 to-transparent scanline-anim" />
        </div>

        <Navbar />
        <main>{children}</main>
        <SystemHUD />
        <Analytics />
      </body>
    </html>
  );
}
