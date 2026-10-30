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
    <div className="fpv-public-shell mx-auto max-w-4xl px-4 py-12 pt-28 font-sans text-zinc-300 sm:px-6 lg:px-8">
      <CyberBreadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Affiliate Disclosure', isCurrentPage: true },
      ]} className="mb-8" />

      <div className="fpv-public-panel relative mb-10 overflow-hidden rounded-xl p-8 shadow-2xl md:p-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF5C00]/45 to-transparent" />
        <div className="pointer-events-none absolute inset-0 carbon-grid opacity-10" />
        <div className="relative z-10">
          <DollarSign className="mb-6 h-12 w-12 text-[#FF5C00]" />
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-100 mb-4 uppercase">
            Affiliate <span className="text-[#FF5C00]">Disclosure</span>
          </h1>
          <p className="fpv-kicker">
            Revenue transparency for readers
          </p>
          <p className="text-xs text-zinc-500 font-mono mt-2 uppercase tracking-widest">
            Last Updated: June 19, 2026
          </p>
        </div>
      </div>

      <div className="mb-8 flex items-start gap-4 rounded-lg border border-[#FF5C00]/30 bg-[#FF5C00]/5 p-6 text-sm font-mono text-zinc-100">
        <HelpingHand className="mt-0.5 h-6 w-6 flex-shrink-0 text-[#FF5C00]" />
        <div>
          <span className="mb-1 block text-xs font-black uppercase tracking-widest text-[#FF5C00]">Reader Notice</span>
          Commercial links are labeled. Program participation is never implied until it has been confirmed and disclosed on this page.
        </div>
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.title} className="p-6 md:p-8 border border-white/5 bg-zinc-900/40 rounded-xl">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
              <section.icon className="h-5 w-5 text-[#FF5C00]" />
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
        <Link href="/" className="mt-4 inline-block text-[#FF5C00] hover:underline">Return to homepage</Link>
      </div>
    </div>
  );
}
