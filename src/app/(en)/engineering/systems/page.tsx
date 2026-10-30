import React from 'react';
import Link from 'next/link';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { Activity, Terminal, ChevronRight, Gauge } from 'lucide-react';
import { generateSeoMetadata } from '@/lib/seo/metadata';

export const metadata = generateSeoMetadata({
  title: 'Aircraft Systems Research | ENGINEERING LAB',
  description: 'Carbon fiber structural resonances, arm vibration damping, GPS satellite lock HDOP geometry, coordinate triangulation, and multirotor electrical/signal system pathways.',
  path: '/engineering/systems',
});

export default function AircraftSystemsPage() {
  const breadcrumbs = [
    { label: 'Engineering Lab', href: '/engineering' },
    { label: 'Aircraft Systems', isCurrentPage: true }
  ];

  const flagshipPapers = [
    {
      title: "Frame Resonance & Vibration Analysis: Carbon Fiber Mechanics",
      slug: "frame-resonance-vibration-analysis",
      excerpt: "Structural carbon stiffness parameters, arm resonance frequencies, motor vibration transfer pathways, and gyro noise contamination isolation.",
      id: "AS_PAPER_001"
    },
    {
      title: "GPS Rescue Reliability: Satellite Geometry & Failsafe Recovery Loops",
      slug: "gps-rescue-reliability",
      excerpt: "Home point coordinates lock geometry, Dilution of Precision (HDOP/PDOP), climb/turn failsafe loops, and satellite loss failure mitigations.",
      id: "AS_PAPER_002"
    },
    {
      title: "How FPV Systems Work Together: System Integration & Electrical Architecture",
      slug: "how-fpv-systems-work-together",
      excerpt: "Multirotor electrical bus lines, 5V/9V voltage regulators, CRSF signal pathways, ground loop video noise, and voltage sag system reboots.",
      id: "AS_PAPER_003"
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
              <div className="absolute top-0 left-0 w-1 h-full bg-[#FFB800]" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-[#FFB800]/10 border border-[#FFB800]/20 rounded-md">
                    <Activity className="w-5 h-5 text-[#FFB800]" />
                  </div>
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#FFB800]/70">RESEARCH DIVISION // DIVISION_04</span>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mt-0.5">
                      Aircraft Systems <span className="text-[#FFB800]">Research</span>
                    </h1>
                  </div>
                </div>
                <p className="text-xs text-white/50 leading-relaxed max-w-2xl font-sans">
                  Structural and systemic integration research. Investigating structural arm vibration transfers, carbon fiber weave resonances, global satellite triangulation geometry locks, and electrical ground loops.
                </p>
              </div>
            </section>

            {/* FLAGSHIP PAPERS */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <Terminal className="w-4 h-4 text-[#FFB800]" />
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/60">Flagship Scientific Publications</h3>
              </div>

              <div className="flex flex-col gap-4">
                {flagshipPapers.map((paper, i) => (
                  <div key={i} className="bg-black/30 border border-white/5 p-6 rounded-md hover:border-white/10 transition-all group relative flex flex-col justify-between">
                    <div className="absolute left-0 top-0 w-1 h-full bg-[#FFB800]/50" />
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-mono text-[9px] text-[#FFB800] uppercase tracking-widest">{paper.id}</span>
                        <span className="font-mono text-[9px] text-white/30">FLAGSHIP PAPER</span>
                      </div>
                      <h4 className="text-base font-black uppercase text-white tracking-tight mb-2 group-hover:text-[#FFB800] transition-colors">{paper.title}</h4>
                      <p className="text-xs text-white/50 leading-relaxed font-sans mb-5">{paper.excerpt}</p>
                    </div>
                    <Link
                      href={`/article/${paper.slug}`}
                      className="inline-flex items-center gap-2 text-[10px] font-mono text-[#FFB800] hover:text-white uppercase tracking-widest font-bold self-start mt-2 group/btn"
                    >
                      READ_FULL_PAPER
                      <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            {/* INTEGRATED SCHEMATIC HUD */}
            <section className="border border-white/10 bg-[#07080c]/50 p-6 rounded-md">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
                <Gauge className="w-4 h-4 text-[#FFB800]" />
                <span className="font-mono text-[9px] uppercase tracking-widest text-white/50">SYS_SYSTEM_ARCHITECTURE_MAP</span>
              </div>
              <p className="text-xs text-white/60 mb-6 leading-relaxed font-sans">
                Multirotor systems are closed loops where physical forces, electrical signals, and RF packets operate concurrently. A disturbance at any junction degrades the operational stability of all downstream systems.
              </p>
              <div className="font-mono text-[10px] text-white/40 bg-black/60 p-4 rounded border border-white/5 overflow-x-auto whitespace-pre leading-relaxed">
{`   [PHYSICAL FORCES]      [ELECTRICAL SYSTEMS]       [RF LINK CHANNELS]
   Motor Vibrations       LiPo Cell Discharge       ELRS Packet Rates
          |                        |                        |
   Arm Resonance (240Hz)   Ohmic Sag (V_Sag)         Packet Loss (LQ < 80%)
          |                        |                        |
   Gyro Sensor Noise       FC Regulators reboot     Failsafe Recovery Loop
          |                        |                        |
   D-Term Heat Spike       Mid-Air Disarm           CATASTROPHE`}
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
