import React from 'react';
import Link from 'next/link';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { DollarSign, ShieldAlert, Award, HelpingHand } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Affiliate Disclosure | FPVLovers',
  description: 'Understand how FPVLovers uses affiliate links (Amazon, GetFPV, RDQ) to support and fund free pilot tools and guides.',
};

export default function DisclosurePage() {
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Affiliate Disclosure', isCurrentPage: true },
  ];

  const sections = [
    {
      icon: ShieldAlert,
      title: '1. What is an Affiliate Link?',
      content: `Many of the product links on FPVLovers are affiliate links. This means that if you click on the link and purchase the item, FPVLovers receives a small commission from the retailer.
      
      - **Zero Extra Cost:** Clicking these links does not cost you anything extra. The price of the product remains exactly the same as if you visited the retailer directly.
      - **Funding Free Tools:** These commissions directly support FPVLovers. They allow us to host our services, maintain the Dify RAG databases, crawl vendor specs, and keep all calculators and tuning tools 100% free and open for pilots.`,
    },
    {
      icon: DollarSign,
      title: '2. Program Participations & Statements',
      content: `FPVLovers participates in the following affiliate advertising programs:
      
      - **Amazon Associates Program:** FPVLovers is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. **As an Amazon Associate, we earn from qualifying purchases.**
      - **GetFPV Affiliate Program:** We link to FPV frames, motors, stacks, and accessories on GetFPV.
      - **RaceDayQuads (RDQ) Affiliate Program:** We link to hardware parts, battery chargers, and flight gear on RaceDayQuads.
      - **Banggood Affiliate Program:** We link to international drone packages, radios, and micro components on Banggood.`,
    },
    {
      icon: Award,
      title: '3. Our Trust-First Policy',
      content: `We prioritize pilot trust over short-term commission profits. 
      
      - **Intent-Aware Recommendations:** Our retrieval and recommendation agents (RetreivalAgent, RecommendationAgent) suggest components based on actual technical specifications, AUW weights, thrust ratios, and Qdrant RAG telemetry knowledge.
      - **Unbiased Reviews:** If a product is bad, unsafe, or has known defects, we will flag it or suggest safer alternatives, regardless of potential affiliate commissions. We do not promote inferior gear just to get a payout.`,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 text-zinc-300 font-sans">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      {/* Header Panel */}
      <div className="relative p-8 md:p-12 border border-white/5 bg-zinc-950 rounded-xl shadow-2xl overflow-hidden mb-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00F2FF]/40 to-transparent" />
        <div className="pointer-events-none absolute inset-0 carbon-grid opacity-10" />

        <div className="relative z-10">
          <DollarSign className="w-12 h-12 text-[#00F2FF] mb-6" />
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-100 mb-4 uppercase">
            Affiliate <span className="text-[#00F2FF]">Disclosure</span>
          </h1>
          <p className="text-[10px] uppercase text-[#A0A0A0] tracking-widest leading-relaxed font-mono">
            {"// PROTOCOL ID: SYS.AFFILIATE_REVENUE_TRANSPARENCY_v1.0"}
          </p>
          <p className="text-xs text-zinc-500 font-mono mt-2 uppercase tracking-widest">
            Last Updated: June 12, 2026
          </p>
        </div>
      </div>

      {/* Official Amazon Statement Box */}
      <div className="p-6 mb-8 border border-[#00F2FF]/30 bg-[#00F2FF]/5 rounded-lg text-sm font-mono text-zinc-100 flex items-start gap-4">
        <HelpingHand className="w-6 h-6 text-[#00F2FF] flex-shrink-0 mt-0.5" />
        <div>
          <span className="text-xs uppercase text-[#00F2FF] font-black tracking-widest block mb-1">Official Declaration:</span>
          As an Amazon Associate, FPVLovers earns from qualifying purchases. This declaration is required by Amazon Associates Operating Agreement guidelines.
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((section, idx) => (
          <div key={idx} className="p-6 md:p-8 border border-white/5 bg-zinc-900/40 rounded-xl">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
              <section.icon className="w-5 h-5 text-[#00F2FF]" />
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
        <p>FPVLovers operates in full transparency with our flying community. Thank you for your support.</p>
        <Link href="/" className="mt-4 inline-block text-[#00F2FF] hover:underline">
          Return to Mission Control
        </Link>
      </div>
    </div>
  );
}
