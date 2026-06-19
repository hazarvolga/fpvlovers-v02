import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgeCheck, FileSearch, Handshake, ShieldCheck } from 'lucide-react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';

export const metadata: Metadata = {
  title: 'Advertising & Sponsorship Policy | FPVLovers',
  description: 'Review FPVLovers advertising, sponsorship, supplied-product, disclosure, and editorial-independence standards.',
};

const principles = [
  {
    icon: ShieldCheck,
    title: 'Editorial Independence',
    body: 'Payment, product access, or campaign support cannot purchase a positive review, suppress material drawbacks, or override safety and compatibility guidance.',
  },
  {
    icon: BadgeCheck,
    title: 'Clear Disclosure',
    body: 'Sponsored content, paid placement, supplied products, and affiliate links must be labeled clearly and close to the relevant content.',
  },
  {
    icon: FileSearch,
    title: 'Evidence Before Claims',
    body: 'A partnership does not create product-testing evidence. Sourced specifications, editorial analysis, and first-hand observations must remain distinguishable.',
  },
];

export default function AdvertisePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 text-zinc-300 font-sans">
      <CyberBreadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Advertising Policy', isCurrentPage: true },
      ]} className="mb-8" />

      <header className="relative overflow-hidden rounded-xl border border-white/5 bg-zinc-950 p-8 shadow-2xl md:p-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF5C00]/50 to-transparent" />
        <div className="pointer-events-none absolute inset-0 carbon-grid opacity-10" />
        <div className="relative z-10">
          <Handshake className="mb-6 h-12 w-12 text-[#FF5C00]" />
          <h1 className="text-4xl font-black uppercase tracking-tight text-zinc-100 md:text-5xl">
            Advertising <span className="text-[#FF5C00]">Policy</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
            FPVLovers is open to relevant, useful collaborations that respect pilots and preserve editorial independence. No current partnership is implied by this policy.
          </p>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-zinc-500">Last Updated: June 19, 2026</p>
        </div>
      </header>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {principles.map((principle) => (
          <section key={principle.title} className="rounded-xl border border-white/5 bg-zinc-900/40 p-6">
            <principle.icon className="mb-4 h-5 w-5 text-[#00F2FF]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">{principle.title}</h2>
            <p className="mt-3 text-xs leading-6 text-zinc-400">{principle.body}</p>
          </section>
        ))}
      </div>

      <section className="mt-10 rounded-xl border border-[#00F2FF]/20 bg-[#00F2FF]/5 p-6 md:p-8">
        <h2 className="text-lg font-bold uppercase tracking-wider text-white">Collaboration Formats</h2>
        <p className="mt-3 text-sm leading-7 text-zinc-300">
          Potential formats include clearly labeled sponsored education, supplied-product evaluation, newsletter placement, event coverage, and campaign creative. Availability, scope, testing method, usage rights, and disclosure language are agreed in writing before publication.
        </p>
        <p className="mt-4 text-sm leading-7 text-zinc-400">
          FPVLovers may decline campaigns that create unsafe guidance, hide material relationships, demand guaranteed praise, or conflict with the needs of beginners, builders, racers, and cinematic pilots.
        </p>
      </section>

      <section id="product-evaluation" className="mt-10 rounded-xl border border-[#FF5C00]/30 bg-[#FF5C00]/5 p-6 md:p-8">
        <h2 className="text-lg font-bold uppercase tracking-wider text-white">Send a Product for Independent Evaluation</h2>
        <p className="mt-3 text-sm leading-7 text-zinc-300">
          FPV manufacturers and retailers may offer a product as a supplied unit or temporary loan for evaluation. Contact FPVLovers before shipping; unsolicited delivery does not guarantee acceptance, testing, coverage, timing, a backlink, or publication.
        </p>
        <p className="mt-4 text-sm leading-7 text-zinc-400">
          Product Review Editor Hazar Volga Ekiz controls the final review decision. Supplied and loaned units are disclosed near the review. FPVLovers does not trade positive verdicts or hidden omissions for product access, payment, or affiliate terms.
        </p>
      </section>

      <div className="mt-10 flex flex-col gap-3 border-t border-white/5 pt-8 sm:flex-row">
        <Link href="/contact" className="rounded-sm bg-[#FF5C00] px-5 py-3 text-center text-xs font-black uppercase tracking-widest text-black hover:bg-[#ff7a33]">
          Discuss a Collaboration
        </Link>
        <Link href="/editorial-policy" className="rounded-sm border border-white/10 px-5 py-3 text-center text-xs font-black uppercase tracking-widest text-zinc-200 hover:border-[#00F2FF]/50">
          Read Editorial Policy
        </Link>
      </div>
    </div>
  );
}
