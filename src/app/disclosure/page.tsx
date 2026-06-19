import type { Metadata } from 'next';
import Link from 'next/link';
import { Award, DollarSign, HelpingHand, ShieldAlert } from 'lucide-react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';

export const metadata: Metadata = {
  title: 'Affiliate Disclosure | FPVLovers',
  description: 'Understand how FPVLovers identifies and uses affiliate links to support free pilot tools and guides.',
};

const sections = [
  {
    icon: ShieldAlert,
    title: '1. What Is an Affiliate Link?',
    paragraphs: [
      'Some product links on FPVLovers may be affiliate links. When a link is marked as affiliate or sponsored, FPVLovers may receive a commission if you click and make an eligible purchase.',
      'Using an affiliate link should not increase the price you pay. Retailer pricing, availability, cookies, and eligibility remain controlled by the retailer.',
    ],
  },
  {
    icon: DollarSign,
    title: '2. Retailer and Program Status',
    paragraphs: [
      'FPVLovers may link to Amazon and specialist FPV retailers such as GetFPV, RaceDayQuads, and Banggood. A retailer link does not by itself mean FPVLovers has been accepted into that retailer\'s affiliate program.',
      'Active affiliate relationships will be named here only after approval is confirmed. Until then, retailer references are product-discovery links and must not be treated as partnership endorsements.',
    ],
  },
  {
    icon: Award,
    title: '3. Trust-First Recommendations',
    paragraphs: [
      'Commercial relationships do not determine FPVLovers editorial conclusions. Recommendations should consider compatibility, safety, documented specifications, use case, and value before monetization.',
      'Sponsored placements and supplied products must be labeled clearly. Affiliate or sponsor compensation does not guarantee a positive verdict or remove material drawbacks.',
    ],
  },
];

export default function DisclosurePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 text-zinc-300 font-sans">
      <CyberBreadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Affiliate Disclosure', isCurrentPage: true },
      ]} className="mb-8" />

      <div className="relative p-8 md:p-12 border border-white/5 bg-zinc-950 rounded-xl shadow-2xl overflow-hidden mb-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00F2FF]/40 to-transparent" />
        <div className="pointer-events-none absolute inset-0 carbon-grid opacity-10" />
        <div className="relative z-10">
          <DollarSign className="w-12 h-12 text-[#00F2FF] mb-6" />
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-100 mb-4 uppercase">
            Affiliate <span className="text-[#00F2FF]">Disclosure</span>
          </h1>
          <p className="text-[10px] uppercase text-[#A0A0A0] tracking-widest leading-relaxed font-mono">
            {'// PROTOCOL ID: SYS.AFFILIATE_REVENUE_TRANSPARENCY_v1.1'}
          </p>
          <p className="text-xs text-zinc-500 font-mono mt-2 uppercase tracking-widest">
            Last Updated: June 19, 2026
          </p>
        </div>
      </div>

      <div className="p-6 mb-8 border border-[#00F2FF]/30 bg-[#00F2FF]/5 rounded-lg text-sm font-mono text-zinc-100 flex items-start gap-4">
        <HelpingHand className="w-6 h-6 text-[#00F2FF] flex-shrink-0 mt-0.5" />
        <div>
          <span className="text-xs uppercase text-[#00F2FF] font-black tracking-widest block mb-1">Reader Notice</span>
          Commercial links are labeled. Program participation is never implied until it has been confirmed and disclosed on this page.
        </div>
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.title} className="p-6 md:p-8 border border-white/5 bg-zinc-900/40 rounded-xl">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
              <section.icon className="w-5 h-5 text-[#00F2FF]" />
              <h2 className="text-lg font-bold uppercase text-zinc-100 tracking-wider">{section.title}</h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-zinc-400">
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 text-center p-6 border-t border-white/5 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
        <p>FPVLovers operates transparently with its flying community.</p>
        <Link href="/" className="mt-4 inline-block text-[#00F2FF] hover:underline">Return to Mission Control</Link>
      </div>
    </div>
  );
}
