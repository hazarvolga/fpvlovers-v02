import React from 'react';
import Link from 'next/link';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import {
  FileText, ShieldCheck, Cpu, Star,
  HelpCircle, Users, Scale, Sparkles
} from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Editorial Policy & Scoring Methodology | FPVLovers',
  description: 'Learn how FPVLovers prepares reviews, comparisons, and buyer guides with transparent sourcing, scoring, corrections, and commercial safeguards.',
};

export default function EditorialPolicyPage() {
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Editorial Policy', isCurrentPage: true },
  ];

  const contentTypes = [
    {
      title: 'Educational Content',
      desc: 'Focuses strictly on pilot calibration, Betaflight logs, math formulas, and hardware wiring directories. Maintained in our RAG database for accurate diagnostic tools.',
    },
    {
      title: 'Review Content',
      desc: 'Evaluates documented specifications, compatibility, usability, value, and available field evidence. Each review states when hands-on testing has or has not occurred.',
    },
    {
      title: 'Comparison Content',
      desc: 'Head-to-head matchups comparing two components of the same category. Evaluates differences in specs, latency, and weight with a final winner selection.',
    },
    {
      title: 'Buyer Guides & Roundups',
      desc: 'Comprehensive lists of top components grouped by category or pilot style. Designed to index existing reviews/comparisons and provide budget vs. premium options.',
    },
  ];

  const scoringWeights = [
    { category: 'Build Quality & Durability', weight: '25%', desc: 'CNC structure, carbon fiber weave quality, solder pads spacing, and crash resistance.' },
    { category: 'RF Link & Signal Stability', weight: '25%', desc: 'Active power stability, signal penetration benchmarks, latency deviation, and receiver sensitivity.' },
    { category: 'Flight Performance & Gyro Noise', weight: '25%', desc: 'Acro flight dynamics, resonance mitigation, voltage sag management, and failsafe recovery speeds.' },
    { category: 'Software & Ease of Tuning', weight: '15%', desc: 'EdgeTX/Betaflight configuration ease, firmware flashing reliability, and telemetry configurations.' },
    { category: 'Value for Money', weight: '10%', desc: 'Retail cost compared to direct competitors and alternatives in the same class.' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 text-zinc-300 font-sans">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      {/* Header Panel */}
      <div className="relative p-8 md:p-12 border border-white/5 bg-zinc-950 rounded-xl shadow-2xl overflow-hidden mb-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00F2FF]/40 to-transparent" />
        <div className="pointer-events-none absolute inset-0 carbon-grid opacity-10" />

        <div className="relative z-10">
          <FileText className="w-12 h-12 text-[#00F2FF] mb-6 animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-100 mb-4 uppercase">
            Editorial <span className="text-[#00F2FF]">Policy</span>
          </h1>
          <p className="text-[10px] uppercase text-[#00F2FF] tracking-widest leading-relaxed font-mono">
            {"// PROTOCOL ID: SYS.EDITORIAL_GUIDELINES_v1.0"}
          </p>
          <p className="text-xs text-zinc-500 font-mono mt-2 uppercase tracking-widest">
            Last Updated: June 19, 2026
          </p>
        </div>
      </div>

      <div className="space-y-12 leading-relaxed">
        {/* Core Philosophy */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold uppercase text-zinc-100 tracking-wider flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#FF5C00]" /> 1. Integrity and Conflict of Interest
          </h2>
          <p className="text-sm text-zinc-400">
            At FPVLovers, pilot trust is our primary currency. Our reviews and guides are built on absolute editorial independence:
          </p>
          <ul className="list-disc pl-5 text-xs text-zinc-400 space-y-2">
            <li><strong>No Paid Positive Reviews:</strong> We never accept payments or sponsorships from hardware manufacturers in exchange for a positive review or higher rating.</li>
            <li><strong>Bad Hardware is Flagged:</strong> If a flight controller contains a faulty regulator design or an ESC has high blowout rates under 6S voltage, we will publish the warnings.</li>
            <li><strong>Independent Links:</strong> Our monetization relies on affiliate links. However, our recommendation logic is completely decoupled from affiliate tag margins. If a better, safer product has no affiliate link, we will still recommend it.</li>
          </ul>
        </section>

        {/* Content Creation Architecture */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold uppercase text-zinc-100 tracking-wider flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#00F2FF]" /> 2. AI-Assisted Workflows & Human Verification
          </h2>
          <p className="text-sm text-zinc-400">
            To keep pace with the rapidly evolving FPV ecosystem, FPVLovers uses a hybrid human-AI content generation pipeline:
          </p>

          <div className="p-4 bg-zinc-950/80 border border-white/5 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-[#00F2FF] uppercase font-black">
              <Sparkles className="w-4 h-4" /> The Harvester Pipeline:
            </div>
            <p className="text-xs text-zinc-400">
              1. **Crawling**: Crawl4AI scrapers extract hardware specs directly from retail stores and vendor directories.
              <br />
              2. **RAG Vectoring**: Specs are normalized for consistency, chunked, and embedded in Qdrant collections.
              <br />
              3. **Drafting**: Dify workflows compile drafts matching structured specifications.
            </p>
          </div>

          <div className="p-4 bg-[#FF5C00]/10 border border-[#FF5C00]/30 rounded-lg text-xs text-zinc-200">
            <strong className="block uppercase mb-1 text-white">The Human Guardrail:</strong>
            Non-review educational and commercial content may publish through the autonomous workflow after deterministic quality checks. Product reviews are the exception: they require recorded approval by Product Review Editor Hazar Volga Ekiz, a testing method, evidence, product-relationship disclosure, and a review timestamp. Automation never creates evidence of hands-on testing.
          </div>
        </section>

        {/* Content Types */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold uppercase text-zinc-100 tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#00FF66]" /> 3. Content Taxonomy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {contentTypes.map((type, idx) => (
              <div key={idx} className="p-5 border border-white/5 bg-zinc-900/40 rounded-lg">
                <h3 className="font-bold text-white uppercase text-sm mb-2">{type.title}</h3>
                <p className="text-xs text-zinc-400 leading-normal">{type.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Scoring Methodology */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold uppercase text-zinc-100 tracking-wider flex items-center gap-2">
            <Star className="w-5 h-5 text-[#EAB308]" /> 4. Repeatable Review & Scoring Framework
          </h2>
          <p className="text-sm text-zinc-400">
            To reduce arbitrary ratings, scored reviews use a consistent evaluation matrix. Criteria without verified evidence must be marked not tested rather than estimated:
          </p>

          <div className="overflow-x-auto border border-white/5 rounded-lg bg-zinc-950/50">
            <table className="w-full text-left font-mono text-xs text-zinc-400">
              <thead>
                <tr className="border-b border-white/10 bg-black/60 text-white uppercase">
                  <th className="p-4">Category</th>
                  <th className="p-4">Weight</th>
                  <th className="p-4">Focus Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {scoringWeights.map((w, idx) => (
                  <tr key={idx} className="hover:bg-white/5">
                    <td className="p-4 font-black text-white">{w.category}</td>
                    <td className="p-4 text-[#00F2FF] font-black">{w.weight}</td>
                    <td className="p-4 leading-normal">{w.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-zinc-950 border border-white/5 rounded-xl text-center">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">
              Formula Protocol
            </div>
            <div className="text-sm md:text-md font-mono font-black text-white bg-black/60 py-3 px-4 rounded border border-white/5 inline-block">
              Score = (Build * 0.25) + (RF * 0.25) + (Flight * 0.25) + (Software * 0.15) + (Value * 0.10)
            </div>
            <p className="text-[10px] text-zinc-400 font-sans mt-3">
              Scores are calibrated between 0 and 100. Ratings below 50 are categorized as **Risky/Unsafe**.
            </p>
          </div>
        </section>

        {/* Affiliate Disclosures */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold uppercase text-zinc-100 tracking-wider flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#00F2FF]" /> 5. Affiliate Disclosure Principles
          </h2>
          <p className="text-sm text-zinc-400">
            Some retailer links may become affiliate links. Commercial links and sponsored placements must be labeled without changing the editorial verdict. Read the full <Link href="/disclosure" className="text-[#00F2FF] hover:underline font-bold">Affiliate Disclosure</Link> and <Link href="/advertise" className="text-[#00F2FF] hover:underline font-bold">Advertising Policy</Link>.
          </p>
        </section>
      </div>

      {/* Return Button */}
      <div className="mt-12 text-center p-6 border-t border-white/5 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
        <Link href="/" className="inline-block text-[#00F2FF] hover:underline">
          Return to Mission Control
        </Link>
      </div>
    </div>
  );
}
