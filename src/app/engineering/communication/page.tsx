import React from 'react';
import Link from 'next/link';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { Radio, Terminal, ChevronRight, Gauge, Activity } from 'lucide-react';
import { generateSeoMetadata } from '@/lib/seo/metadata';

export const metadata = generateSeoMetadata({
  title: 'RF & Video Link Research | ENGINEERING LAB',
  description: 'ExpressLRS packet rate latency, link budgets, RSSI vs Link Quality (LQ), video encoding codecs, and digital vs analog glass-to-glass latency calculations.',
  path: '/engineering/communication',
});

function DelayBar({ label, delay, color }: { label: string; delay: number; color: string }) {
  const maxDelay = 50;
  const percentage = Math.min((delay / maxDelay) * 100, 100);
  return (
    <div className="space-y-1 font-mono text-[10px]">
      <div className="flex justify-between text-white/60">
        <span>{label}</span>
        <span style={{ color }}>{delay} ms</span>
      </div>
      <div className="h-2 bg-white/5 border border-white/5 rounded-sm overflow-hidden">
        <div className="h-full rounded-sm transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function CommunicationPage() {
  const breadcrumbs = [
    { label: 'Engineering Lab', href: '/engineering' },
    { label: 'RF & Video Link', isCurrentPage: true }
  ];

  const flagshipPapers = [
    {
      title: "RF Link Engineering: ELRS Packet Rates, LQ Interpretation & Signal Propagation",
      slug: "rf-link-engineering",
      excerpt: "ExpressLRS packet rates, signal-to-noise ratios (SNR), RSSI vs Link Quality calculations, diversity systems, and failsafe recovery protocols.",
      id: "RF_PAPER_001"
    },
    {
      title: "Video Latency Engineering: Glass-to-Glass Measurements & Encoding Pipelines",
      slug: "video-latency-engineering",
      excerpt: "Digital encoding pipelines (H.264/H.265), variable vs fixed frame buffers, uncompressed digital latency (HDZero), and analog glass-to-glass delay constraints.",
      id: "RF_PAPER_002"
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
              <div className="absolute top-0 left-0 w-1 h-full bg-[#00F2FF]" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-[#00F2FF]/10 border border-[#00F2FF]/20 rounded-md">
                    <Radio className="w-5 h-5 text-[#00F2FF]" />
                  </div>
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#00F2FF]/70">RESEARCH DIVISION // DIVISION_03</span>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mt-0.5">
                      RF & Video <span className="text-[#00F2FF]">Link</span>
                    </h1>
                  </div>
                </div>
                <p className="text-xs text-white/50 leading-relaxed max-w-2xl font-sans">
                  Performance evaluation of digital high-speed video codecs and RF control propagation. Analyzing ExpressLRS packet transmission loops, signal refraction, and glass-to-glass delay factors.
                </p>
              </div>
            </section>

            {/* FLAGSHIP PAPERS */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <Terminal className="w-4 h-4 text-[#00F2FF]" />
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/60">Flagship Scientific Publications</h3>
              </div>

              <div className="flex flex-col gap-4">
                {flagshipPapers.map((paper, i) => (
                  <div key={i} className="bg-black/30 border border-white/5 p-6 rounded-md hover:border-white/10 transition-all group relative flex flex-col justify-between">
                    <div className="absolute left-0 top-0 w-1 h-full bg-[#00F2FF]/50" />
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-mono text-[9px] text-[#00F2FF] uppercase tracking-widest">{paper.id}</span>
                        <span className="font-mono text-[9px] text-white/30">FLAGSHIP PAPER</span>
                      </div>
                      <h4 className="text-base font-black uppercase text-white tracking-tight mb-2 group-hover:text-[#00F2FF] transition-colors">{paper.title}</h4>
                      <p className="text-xs text-white/50 leading-relaxed font-sans mb-5">{paper.excerpt}</p>
                    </div>
                    <Link
                      href={`/article/${paper.slug}`}
                      className="inline-flex items-center gap-2 text-[10px] font-mono text-[#00F2FF] hover:text-white uppercase tracking-widest font-bold self-start mt-2 group/btn"
                    >
                      READ_FULL_PAPER
                      <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            {/* LATENCY COMPARISON HUD */}
            <section className="border border-white/10 bg-[#07080c]/50 p-6 rounded-md">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
                <Activity className="w-4 h-4 text-[#00F2FF]" />
                <span className="font-mono text-[9px] uppercase tracking-widest text-white/50">SYS_LATENCY_CALIBRATION_CURVES</span>
              </div>
              <p className="text-xs text-white/60 mb-6 leading-relaxed font-sans">
                Below is a comparative breakdown of average glass-to-glass latency metrics measured across various FPV video technologies under optical test bench conditions:
              </p>
              <div className="space-y-4">
                <DelayBar label="Analog Video (Constant line scan)" delay={8} color="#00FF66" />
                <DelayBar label="HDZero Digital (Constant uncompressed)" delay={15} color="#00F2FF" />
                <DelayBar label="DJI Digital (Low Latency Mode - H.264)" delay={28} color="#FFB800" />
                <DelayBar label="Walksnail Digital (High Quality Mode - H.265)" delay={38} color="#FF5C00" />
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
