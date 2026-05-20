import React from 'react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { AISummaryBox } from '@/components/ui/AISummaryBox';
import { AffiliateCard } from '@/features/monetization/components/AffiliateCard';
import { Cpu, Radio, Activity, Wrench, Wind, Gauge, Thermometer, Zap } from 'lucide-react';
import { getHardwareData } from '@/lib/dify-datasets';
import { PropellerLabSection } from '@/features/engineering/components/PropellerLabSection';

import { generateSeoMetadata } from '@/lib/seo/metadata';

export const metadata = generateSeoMetadata({
  title: 'FPV Hardware Reference | ENGINEERING LAB',
  description: 'FPV drone hardware database: motors, ESCs, flight controllers, VTX, and cameras.',
  path: '/engineering/hardware',
  ogImage: 'https://picsum.photos/seed/fpv-hardware/1200/630',
});

function TelemetryChip({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-[#1c1b1b] border-l-2 p-2" style={{ borderLeftColor: accent }}>
      <p className="font-mono text-[9px] uppercase tracking-widest text-[#e4bfb1]/60">{label}</p>
      <p className="font-mono text-sm font-bold tracking-tighter" style={{ color: accent }}>{value}</p>
    </div>
  );
}

function ModulePanel({ id, title, children, accent }: { id: string; title: string; children: React.ReactNode; accent?: string }) {
  const borderColor = accent || '#5b4137';
  return (
    <div className="border p-5 relative" style={{ borderColor }}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#e4bfb1]/50">MOD_{id}</span>
        </div>
        <div className="flex gap-2">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_6px]" style={{ backgroundColor: accent || '#ffb599', boxShadow: `0 0 6px ${accent || '#ffb599'}` }} />
          <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: accent || '#ffb599' }}>ACTIVE</span>
        </div>
      </div>
      <h3 className="font-bold text-[#e5e2e1] uppercase tracking-wide text-sm mb-1">{title}</h3>
      {children}
    </div>
  );
}

function SegmentedBar({ value, max, accent }: { value: number; max: number; accent: string }) {
  const segments = 10;
  const filled = Math.round((value / max) * segments);
  return (
    <div className="h-2 bg-[#201f1f] flex gap-px">
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className="flex-1"
          style={{ backgroundColor: i < filled ? accent : '#353534' }}
        />
      ))}
    </div>
  );
}

export default async function HardwarePage() {
  const data = await getHardwareData();
  const breadcrumbs = [
    { label: 'Engineering Lab', href: '/engineering' },
    { label: 'Hardware Data', isCurrentPage: true },
  ];

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
        <CyberBreadcrumb items={breadcrumbs} className="mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── MAIN CANVAS ── */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* ── HEADER MODULE ── */}
            <section className="relative border border-[#5b4137] bg-[#131313]/80 backdrop-blur-sm p-6 overflow-hidden">
              <div className="absolute inset-0 opacity-5 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #ffb599 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-[#ff5f00]/10 border border-[#ff5f00]/20">
                    <Cpu className="w-5 h-5 text-[#ffb599]" />
                  </div>
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#e4bfb1]/40">ENGINEERING LAB // MODULE</span>
                    <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tighter text-[#e5e2e1] mt-0.5">
                      Hardware <span className="text-[#ffb599]">Reference</span>
                    </h1>
                  </div>
                </div>
                <p className="text-xs text-[#e4bfb1]/60 leading-relaxed max-w-2xl">
                  Electrical and structural intelligence for FPV builds — motors, ESCs, flight controllers, and video systems.
                </p>

                <div className="grid grid-cols-3 gap-3 mt-5">
                  <TelemetryChip label="Voltage" value="22.2V" accent="#ffb599" />
                  <TelemetryChip label="Components" value={String(data.hardware?.length || 0)} accent="#00eefc" />
                  <TelemetryChip label="Status" value="LIVE_FEED" accent="#00e639" />
                </div>
              </div>
            </section>

            {/* ── AISummaryBox (re-styled as tactical brief) ── */}
            <section className="border border-[#5b4137] bg-[#1c1b1b] p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#ffb599]">MOD_881_BRIEF</span>
                <div className="flex-1 h-px bg-[#353534]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#00e639] animate-pulse shadow-[0_0_4px_#00e639]" />
              </div>
              <AISummaryBox content={data.summary} title="SYS_HARDWARE_SYNOPSIS" />
            </section>

            {/* ── PROPELLER LAB ── */}
            <PropellerLabSection />

            {/* ── CORE SYSTEMS ── */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-[#5b4137] pb-3">
                <div className="w-6 h-6 flex items-center justify-center bg-[#00eefc]/10 border border-[#00eefc]/30">
                  <Activity className="w-3.5 h-3.5 text-[#00eefc]" />
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#e4bfb1]/50">MOD_882_CORE</span>
                  <h3 className="text-base font-bold uppercase text-[#e5e2e1] tracking-wide">Target Acquisition: Core Systems</h3>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {data.hardware?.map((item: any, i: number) => (
                  <AffiliateCard key={i} {...item} />
                ))}
              </div>
            </section>

            {/* ── ENGINEERING QUICK REFERENCE ── */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ModulePanel id="883_FW" title="Firmware Tuning" accent="#ffb599">
                <p className="text-xs text-[#e4bfb1]/60 mb-4 leading-relaxed">
                  Betaflight PID tuning, EdgeTX configuration, and ELRS setup workflows.
                </p>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between font-mono text-[10px] text-[#e4bfb1]/60">
                      <span>P_GAIN</span>
                      <span className="text-[#ffb599]">0.45</span>
                    </div>
                    <SegmentedBar value={0.45} max={1.0} accent="#ffb599" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between font-mono text-[10px] text-[#e4bfb1]/60">
                      <span>I_GAIN</span>
                      <span className="text-[#00eefc]">0.08</span>
                    </div>
                    <SegmentedBar value={0.08} max={0.5} accent="#00eefc" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between font-mono text-[10px] text-[#e4bfb1]/60">
                      <span>D_GAIN</span>
                      <span className="text-[#00e639]">0.32</span>
                    </div>
                    <SegmentedBar value={0.32} max={1.0} accent="#00e639" />
                  </div>
                </div>
                <a href="/engineering/firmware" className="block mt-4 border border-[#5b4137] font-mono text-[10px] uppercase tracking-widest py-2 text-center text-[#e4bfb1]/60 hover:bg-[#ff5f00]/10 hover:text-[#ffb599] hover:border-[#ff5f00]/40 transition-colors">
                  SYNC_PARAMETERS
                </a>
              </ModulePanel>

              <ModulePanel id="884_WS" title="Workshop Masterclass" accent="#00eefc">
                <p className="text-xs text-[#e4bfb1]/60 mb-4 leading-relaxed">
                  Advanced soldering, repair techniques, and drone maintenance.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 bg-[#0e0e0e] border border-[#353534]">
                    <Wrench className="w-4 h-4 text-[#ffb599]" />
                    <div>
                      <p className="font-mono text-[10px] text-[#e5e2e1] uppercase">Solder Station</p>
                      <p className="font-mono text-[9px] text-[#e4bfb1]/50">TEMP: 350°C // FB: 60/40</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-[#0e0e0e] border border-[#353534]">
                    <Gauge className="w-4 h-4 text-[#00eefc]" />
                    <div>
                      <p className="font-mono text-[10px] text-[#e5e2e1] uppercase">Test Bench</p>
                      <p className="font-mono text-[9px] text-[#e4bfb1]/50">SMOKE_STOPPER: ARMED</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-[#0e0e0e] border border-[#353534]">
                    <Thermometer className="w-4 h-4 text-[#00e639]" />
                    <div>
                      <p className="font-mono text-[10px] text-[#e5e2e1] uppercase">Conformal Coat</p>
                      <p className="font-mono text-[9px] text-[#e4bfb1]/50">HUMIDITY_BARRIER: ACTIVE</p>
                    </div>
                  </div>
                </div>
                <a href="/engineering/workshop" className="block mt-4 border border-[#5b4137] font-mono text-[10px] uppercase tracking-widest py-2 text-center text-[#e4bfb1]/60 hover:bg-[#00eefc]/10 hover:text-[#00eefc] hover:border-[#00eefc]/40 transition-colors">
                  INITIATE_REPAIR
                </a>
              </ModulePanel>
            </section>

            {/* ── SYSTEM STATUS FOOTER ── */}
            <footer className="border border-[#5b4137] bg-[#1c1b1b] p-4 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-widest">
              <div className="flex items-center gap-4">
                <span className="text-[#00e639]">SYS_HEARTBEAT: ACTIVE</span>
                <span className="text-[#e4bfb1]/40 hidden md:inline">REV: 1.0.4</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[#e4bfb1]/40">HARDWARE_REFERENCE</span>
                <span className="text-[#ffb599]">{data.hardware?.length || 0} MODULES</span>
              </div>
            </footer>
          </div>

          {/* ── SIDEBAR ── */}
          <aside className="lg:col-span-4 hidden lg:flex flex-col gap-6">
            <AdStickySidebar />
          </aside>
        </div>
      </div>
    </div>
  );
}
