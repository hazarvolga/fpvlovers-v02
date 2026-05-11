import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import '../globals.css';
import Link from 'next/link';
import { Command, Shield, Zap } from 'lucide-react';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'FPV Lovers | Admin Panel',
  description: 'FPV Lovers Admin Control Center — RAG Hub, Monetization, Analytics, Orchestrator',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${jetbrainsMono.variable}`}>
      <body className="bg-[#050508] text-[#A0A0A0] font-mono min-h-screen antialiased" suppressHydrationWarning>
        {/* Admin Header */}
        <header className="sticky top-0 z-50 border-b border-[#1A1A1A] bg-[#050508]/95 backdrop-blur-sm">
          <div className="max-w-full mx-auto px-6 h-12 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Command className="w-5 h-5 text-[#FF5C00]" />
                <span className="text-white font-mono text-sm font-bold tracking-wide">FPV ADMIN</span>
              </Link>
              <span className="text-[#333] text-xs">|</span>
              <span className="text-[#666] text-[10px] font-mono uppercase tracking-widest">Control Center</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-[#666] hover:text-white text-[10px] font-mono uppercase tracking-widest transition-colors flex items-center gap-1">
                <Zap className="w-3 h-3" /> Site
              </Link>
              <div className="flex items-center gap-1 text-[#00FF66]/50 text-[10px] font-mono">
                <Shield className="w-3 h-3" />
                <span>v8.0</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="min-h-[calc(100vh-3rem)]">{children}</main>

        {/* Subtle admin background */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[#FF5C00] opacity-[0.015] mix-blend-overlay" />
          <div className="absolute top-12 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FF5C00]/10 to-transparent" />
        </div>
      </body>
    </html>
  );
}
