import React from 'react';
import Link from 'next/link';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { FileText, Scale, AlertTriangle, BookOpen } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | FPVLovers',
  description: 'Read the terms of service, pilot responsibility agreements, and engineering liability disclaimers for FPVLovers.',
};

export default function TermsPage() {
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Terms of Service', isCurrentPage: true },
  ];

  const sections = [
    {
      icon: Scale,
      title: '1. Agreement to Terms',
      content: `By accessing and using FPVLovers (fpvlovers.com.tr), you agree to be bound by these Terms of Service. If you do not agree, please do not access our engineering tools, pilot roadmaps, or RAG insights.
      
      This site is dedicated to drone builder educational references, diagnostic tools, and safety-focused calculation helpers.`,
    },
    {
      icon: AlertTriangle,
      title: '2. FPV Pilot Liability Disclaimer',
      content: `FPV drone racing and freestyle flight involve physical, regulatory, and electrical risks.
      
      - **Tuning and Electrical Guidance:** Any calculations made via our Build Calculator, hardware compatibility ratings via the Part Matcher, or filter/PID suggestions via the Blackbox Tuning Advisor are purely educational recommendations.
      - **Pilot Responsibility:** You are 100% responsible for verifying components, wiring connections, and soldering quality before applying power. We are not liable for burnt ESCs, shorted flight controllers, LiPo battery fires, property damage, or physical injuries.
      - **SHGM / FAA / Regulatory Compliance:** You must verify all local legal regulations (e.g. SHY-14 guidelines in Turkey, FAA registration in the US) regarding flight zones, pilot licensing, and radio transmission frequencies (VTX power and band limits).`,
    },
    {
      icon: BookOpen,
      title: '3. Intellectual Property and Content Use',
      content: `The editorial guides, calculation helpers, page layouts, and graphic indicators on FPVLovers are protected by copyright:
      
      - You may use the resources and study materials for personal learning and local drone builds.
      - Automated scraping of our compiled catalogs or dynamic guides for commercial use without express permission is strictly prohibited.`,
    },
    {
      icon: FileText,
      title: '4. Limitation of Liability',
      content: `FPVLovers, its developers, and contributors shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our tools, guides, or external product links. All tools are provided "as-is" without warranty of any kind.`,
    },
  ];

  return (
    <div className="fpv-public-shell mx-auto max-w-4xl px-4 py-12 pt-28 font-sans text-zinc-300 sm:px-6 lg:px-8">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      {/* Header Panel */}
      <div className="fpv-public-panel relative mb-10 overflow-hidden rounded-xl p-8 shadow-2xl md:p-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF5C00]/45 to-transparent" />
        <div className="pointer-events-none absolute inset-0 carbon-grid opacity-10" />

        <div className="relative z-10">
          <Scale className="mb-6 h-12 w-12 text-[#FF5C00]" />
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-100 mb-4 uppercase">
            Terms of <span className="text-[#FF5C00]">Service</span>
          </h1>
          <p className="fpv-kicker">
            User terms and safety disclaimer
          </p>
          <p className="text-xs text-zinc-500 font-mono mt-2 uppercase tracking-widest">
            Last Updated: June 12, 2026
          </p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="p-4 mb-8 bg-[#FF5C00]/10 border border-[#FF5C00]/30 rounded-lg text-xs text-[#FF5C00] font-mono uppercase tracking-widest">
        ⚠️ Attention Pilot: FPV building carries electrical risk. Always use a smoke stopper on the first battery plug-in.
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((section, idx) => (
          <div key={idx} className="p-6 md:p-8 border border-white/5 bg-zinc-900/40 rounded-xl">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
              <section.icon className="h-5 w-5 text-[#FF5C00]" />
              <h2 className="text-lg font-bold uppercase text-zinc-100 tracking-wider">
                {section.title}
              </h2>
            </div>
            <div className="text-sm leading-relaxed text-zinc-400 font-sans whitespace-pre-line">
              {section.content}
            </div>
          </div>
        ))}
      </div>

      {/* Legal Footer Note */}
      <div className="mt-12 text-center p-6 border-t border-white/5 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
        <p>FPVLovers operates in full compliance with global safety practices. Fly safe.</p>
        <Link href="/" className="mt-4 inline-block text-[#FF5C00] hover:underline">
          Return to homepage
        </Link>
      </div>
    </div>
  );
}
