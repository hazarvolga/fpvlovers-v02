import React from 'react';
import Link from 'next/link';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { Cpu, Terminal, FileText, ChevronRight, Gauge } from 'lucide-react';
import { getFirmwareData } from '@/lib/dify-datasets';
import { generateSeoMetadata } from '@/lib/seo/metadata';

export const metadata = generateSeoMetadata({
  title: 'Flight Control Research | ENGINEERING LAB',
  description: 'Multirotor closed-loop attitude feedback control theory, PID loop engineering, and Betaflight high-frequency gyro/D-term noise filtering structures.',
  path: '/engineering/flight-control',
});

export default async function FlightControlPage() {
  const difyData = await getFirmwareData();
  const breadcrumbs = [
    { label: 'Engineering Lab', href: '/engineering' },
    { label: 'Flight Control Research', isCurrentPage: true }
  ];

  const flagshipPapers = [
    {
      title: "Blackbox Analysis Masterclass: Decoding Gyro Spectral Densities & PID Traces",
      slug: "blackbox-analysis-masterclass",
      excerpt: "Deep technical guide on decoding raw multirotor gyro noise, validating dynamic notches, and analyzing propwash vortex oscillations.",
      id: "FC_PAPER_001"
    },
    {
      title: "PID Tuning Beyond Presets: Control Loop Mathematics & Dynamic Idle",
      slug: "pid-tuning-beyond-presets",
      excerpt: "Mathematical modeling of the PID closed-loop feedback controller, Feed ForwardStick acceleration, and dynamic low-throttle RPM stabilization.",
      id: "FC_PAPER_002"
    },
    {
      title: "Modern Betaflight Filter Architecture: Dynamic Notch & RPM Filtering",
      slug: "modern-betaflight-filter-architecture",
      excerpt: "Structural evaluation of multirotor noise filtering strategies, bi-directional DShot RPM tracking notches, and signal delay tradeoffs.",
      id: "FC_PAPER_003"
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
              <div className="absolute top-0 left-0 w-1 h-full bg-[#00FF66]" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-[#00FF66]/10 border border-[#00FF66]/20 rounded-md">
                    <Cpu className="w-5 h-5 text-[#00FF66]" />
                  </div>
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#00FF66]/70">RESEARCH DIVISION // DIVISION_01</span>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mt-0.5">
                      Flight Control <span className="text-[#00FF66]">Research</span>
                    </h1>
                  </div>
                </div>
                <p className="text-xs text-white/50 leading-relaxed max-w-2xl font-sans">
                  Theoretical analysis and telemetry diagnostics of closed-loop attitude feedback systems. Focusing on high-frequency noise mitigation, PID mathematics, and real-time blackbox trace diagnostics.
                </p>
              </div>
            </section>

            {/* FLAGSHIP PAPERS */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <Terminal className="w-4 h-4 text-[#00FF66]" />
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/60">Flagship Scientific Publications</h3>
              </div>

              <div className="flex flex-col gap-4">
                {flagshipPapers.map((paper, i) => (
                  <div key={i} className="bg-black/30 border border-white/5 p-6 rounded-md hover:border-white/10 transition-all group relative flex flex-col justify-between">
                    <div className="absolute left-0 top-0 w-1 h-full bg-[#00FF66]/50" />
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-mono text-[9px] text-[#00FF66] uppercase tracking-widest">{paper.id}</span>
                        <span className="font-mono text-[9px] text-white/30">FLAGSHIP PAPER</span>
                      </div>
                      <h4 className="text-base font-black uppercase text-white tracking-tight mb-2 group-hover:text-[#00FF66] transition-colors">{paper.title}</h4>
                      <p className="text-xs text-white/50 leading-relaxed font-sans mb-5">{paper.excerpt}</p>
                    </div>
                    <Link
                      href={`/article/${paper.slug}`}
                      className="inline-flex items-center gap-2 text-[10px] font-mono text-[#00FF66] hover:text-white uppercase tracking-widest font-bold self-start mt-2 group/btn"
                    >
                      READ_FULL_PAPER
                      <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            {/* DIFY ACTIVE KNOWLEDGE RETRIEVAL */}
            <section className="border border-white/10 bg-[#07080c]/50 p-6 rounded-md">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-[#00FF66]" />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-white/50">SYS_RAG_RETRIEVAL // d1d5e44b</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
                  <span className="font-mono text-[8px] uppercase tracking-widest text-[#00FF66]">LIVE_SYNC</span>
                </div>
              </div>
              <p className="text-[11px] font-mono text-[#00FF66]/70 bg-black/40 border border-[#00FF66]/10 p-3 rounded mb-4 leading-relaxed">
                {"// Real-time theoretical index loaded from Dify fpv-flight-tuning dataset."}
              </p>
              <div className="space-y-4">
                {difyData.cliCommands.slice(0, 3).map((item, i) => (
                  <div key={i} className="font-mono text-xs p-4 bg-black/60 border border-white/5 rounded-sm">
                    <span className="text-[#00FF66] block font-bold mb-2"># {item.title}</span>
                    <p className="text-white/60 leading-relaxed text-[11px] whitespace-pre-wrap">{item.content}</p>
                    <span className="text-white/20 block text-[9px] mt-2 italic">{item.tag}</span>
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
