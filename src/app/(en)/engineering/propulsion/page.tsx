import React from 'react';
import Link from 'next/link';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { Target, Terminal, ChevronRight, Gauge, ShieldAlert } from 'lucide-react';
import { getHardwareData } from '@/lib/dify-datasets';
import { PropellerLabSection } from '@/features/engineering/components/PropellerLabSection';
import { generateSeoMetadata } from '@/lib/seo/metadata';

export const metadata = generateSeoMetadata({
  title: 'Propulsion & Power Research | ENGINEERING LAB',
  description: 'FPV drone propulsion mechanics, brushless motor stator KV scaling dynamics, dynamic DShot ESC protocols, propeller disk loading, and LiPo internal resistance sag.',
  path: '/engineering/propulsion',
});

export default async function PropulsionPage() {
  const difyData = await getHardwareData();
  const breadcrumbs = [
    { label: 'Engineering Lab', href: '/engineering' },
    { label: 'Propulsion & Power', isCurrentPage: true }
  ];

  const flagshipPapers = [
    {
      title: "Motor Efficiency Engineering: Torque, KV Scaling & Thermal Dynamics",
      slug: "motor-efficiency-engineering",
      excerpt: "Electromagnetic stator volume equations, magnetic flux constraints, copper wind resistance, and 4S/6S cell voltage efficiency curves.",
      id: "PP_PAPER_001"
    },
    {
      title: "ESC Protocol Deep Dive: Bidirectional DShot & Gate Drive Switche",
      slug: "esc-protocol-deep-dive",
      excerpt: "Three-phase bridge MOSFET gate topologies, Back-EMF RPM telemetry tracking, DShot baud rate structures, and thermal PWM switching.",
      id: "PP_PAPER_002"
    },
    {
      title: "FPV Propeller Engineering: Disc Loading, Blade Pitch & Drag Dynamics",
      slug: "fpv-propeller-engineering",
      excerpt: "Propeller disk loading formulas, aerodynamic lift drag equations, bi-blade vs tri-blade thermodynamic efficiency, and grip ratios.",
      id: "PP_PAPER_003"
    },
    {
      title: "LiPo Performance Engineering: Internal Resistance & Voltage Sag",
      slug: "lipo-performance-engineering",
      excerpt: "Lithium Polymer cell discharge chemistry, internal resistance degradation, continuous discharge ratings, and high-load sag mathematics.",
      id: "PP_PAPER_004"
    }
  ];

  return (
    <div className="min-h-screen bg-[#030406]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
        <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* MAIN CANVAS */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* DIVISION HERO */}
            <section className="relative border border-white/10 bg-[#07080c]/80 backdrop-blur-sm p-8 overflow-hidden rounded-md">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#FF5C00]" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-[#FF5C00]/10 border border-[#FF5C00]/20 rounded-md">
                    <Target className="w-5 h-5 text-[#FF5C00]" />
                  </div>
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#FF5C00]/70">RESEARCH DIVISION // DIVISION_02</span>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mt-0.5">
                      Propulsion & <span className="text-[#FF5C00]">Power</span>
                    </h1>
                  </div>
                </div>
                <p className="text-xs text-white/50 leading-relaxed max-w-2xl font-sans">
                  Scientific evaluation of aircraft propulsion mechanics and electrical power systems. Investigating electromagnetic stator torque curves, high-frequency ESC communications, lithium-chemistry discharge sags, and propeller blade aerodynamics.
                </p>
              </div>
            </section>

            {/* FLAGSHIP PAPERS */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <Terminal className="w-4 h-4 text-[#FF5C00]" />
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/60">Flagship Scientific Publications</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flagshipPapers.map((paper, i) => (
                  <div key={i} className="bg-black/30 border border-white/5 p-6 rounded-md hover:border-white/10 transition-all group relative flex flex-col justify-between">
                    <div className="absolute left-0 top-0 w-1 h-full bg-[#FF5C00]/50" />
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-mono text-[9px] text-[#FF5C00] uppercase tracking-widest">{paper.id}</span>
                        <span className="font-mono text-[9px] text-white/30">FLAGSHIP PAPER</span>
                      </div>
                      <h4 className="text-base font-black uppercase text-white tracking-tight mb-2 group-hover:text-[#FF5C00] transition-colors">{paper.title}</h4>
                      <p className="text-xs text-white/50 leading-relaxed font-sans mb-5 line-clamp-3">{paper.excerpt}</p>
                    </div>
                    <Link
                      href={`/article/${paper.slug}`}
                      className="inline-flex items-center gap-2 text-[10px] font-mono text-[#FF5C00] hover:text-white uppercase tracking-widest font-bold self-start mt-2 group/btn"
                    >
                      READ_FULL_PAPER
                      <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            {/* PROPELLER LAB INTERACTIVE MODULE */}
            <PropellerLabSection />

            {/* CATALOG KNOWLEDGE INJECTION */}
            <section className="border border-white/10 bg-[#07080c]/50 p-6 rounded-md">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-[#FF5C00]" />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-white/50">SYS_COMPONENT_INTELLIGENCE // 38bb7d60</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
                  <span className="font-mono text-[8px] uppercase tracking-widest text-[#00FF66]">LIVE_SYNC</span>
                </div>
              </div>
              <p className="text-[11px] font-mono text-[#FF5C00]/70 bg-black/40 border border-[#FF5C00]/10 p-3 rounded mb-4 leading-relaxed">
                {"// Real-time catalog component specs mapped dynamically from Dify fpv-components-specs dataset."}
              </p>
              
              <div className="grid gap-4">
                {difyData.hardware.slice(0, 3).map((item, i) => (
                  <div key={i} className="bg-black/60 border border-white/5 p-5 rounded font-mono text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <span className="text-[#FF5C00] font-bold block mb-1"># {item.title}</span>
                      <p className="text-white/60 leading-relaxed text-[11px] font-sans">{item.description}</p>
                    </div>
                    <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] uppercase tracking-widest text-white/40 shrink-0">{item.tag}</span>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* SIDEBAR */}
          <aside className="lg:col-span-4 hidden lg:flex flex-col gap-6">
            <AdStickySidebar />
          </aside>
        </div>
      </div>
    </div>
  );
}
