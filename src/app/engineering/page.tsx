import React from 'react';
import Link from 'next/link';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { Cpu, Radio, Wrench, Target, Activity, ChevronRight, Binary, Waves, Zap, Compass, ShieldCheck } from 'lucide-react';
import { generateSeoMetadata } from '@/lib/seo/metadata';

export const metadata = generateSeoMetadata({
  title: 'Engineering Lab | FPV Research Division',
  description: 'Advanced technical FPV drone research. Blackbox logs spectral analysis, PID loop control theory, RF link budget metrics, LiPo chemical thermal modeling, and structural airframe resonance.',
  path: '/engineering',
});

function TelemetryMeter({ label, value, unit, status, color = '#FF5C00' }: { label: string; value: string; unit: string; status: string; color?: string }) {
  return (
    <div className="bg-[#0b0c10] border border-white/5 p-4 rounded-sm font-mono flex flex-col justify-between">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[9px] uppercase tracking-widest text-white/40">{label}</span>
        <span className="text-[9px] uppercase px-1.5 py-0.5 bg-white/5 rounded" style={{ color }}>{status}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black tracking-tighter text-white">{value}</span>
        <span className="text-[10px] text-white/50">{unit}</span>
      </div>
      <div className="w-full bg-white/5 h-1 mt-3 rounded-full overflow-hidden">
        <div className="h-full rounded-full animate-pulse" style={{ backgroundColor: color, width: '75%' }} />
      </div>
    </div>
  );
}

function ResearchCategoryCard({
  id,
  title,
  subtitle,
  icon: Icon,
  color,
  metrics,
  papers,
  href,
}: {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  color: string;
  metrics: { label: string; value: string }[];
  papers: { title: string; slug: string }[];
  href: string;
}) {
  return (
    <div className="relative group overflow-hidden border border-white/10 bg-[#07080c]/60 backdrop-blur-md rounded-md p-6 hover:border-white/20 transition-all flex flex-col justify-between">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute left-0 top-0 w-1 h-full" style={{ backgroundColor: color }} />
      
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-sm">
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">RESEARCH DIVISION // {id}</span>
              <h2 className="text-xl font-black uppercase tracking-tight text-white mt-0.5">{title}</h2>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 border border-white/10 bg-white/5 rounded text-white/50">SECURED</span>
          </div>
        </div>

        <p className="text-xs text-white/60 mb-6 leading-relaxed font-sans">{subtitle}</p>

        {/* Division Telemetries */}
        <div className="grid grid-cols-2 gap-2 mb-6 font-mono text-[10px]">
          {metrics.map((m, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/5 p-2 rounded-sm">
              <span className="text-white/40 block text-[8px] uppercase tracking-widest">{m.label}</span>
              <span className="font-bold block mt-0.5" style={{ color }}>{m.value}</span>
            </div>
          ))}
        </div>

        {/* FLAGSHIPS LIST */}
        <div className="space-y-2 mb-8 border-t border-white/5 pt-4">
          <h3 className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#FF5C00]/80 mb-3">Flagship Publications:</h3>
          {papers.map((p, i) => (
            <Link
              key={i}
              href={`/article/${p.slug}`}
              className="flex items-center justify-between p-2.5 bg-black/40 border border-white/5 hover:border-white/10 transition-colors group/link rounded-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-[9px] text-white/30">[{String(i + 1).padStart(2, '0')}]</span>
                <span className="text-xs font-bold text-white/80 group-hover/link:text-white truncate uppercase tracking-tight">{p.title}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover/link:text-white transition-transform group-hover/link:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>

      <Link
        href={href}
        className="w-full block border border-white/10 font-mono text-[10px] uppercase tracking-widest py-3 text-center text-white/60 group-hover:text-white group-hover:border-white/30 hover:bg-white/5 rounded-sm transition-all"
      >
        ACCESS_DIVISION_HUD
      </Link>
    </div>
  );
}

export default function EngineeringHomepage() {
  const breadcrumbs = [
    { label: 'Engineering Lab', isCurrentPage: true },
  ];

  return (
    <div className="min-h-screen bg-[#030406]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
        <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* MAIN COLUMN */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* HERO MODULE */}
            <section className="relative border border-white/10 bg-[#07080c]/80 backdrop-blur-sm p-8 overflow-hidden rounded-md">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, white 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 flex items-center justify-center bg-[#FF5C00]/10 border border-[#FF5C00]/20 rounded-md">
                    <Wrench className="w-6 h-6 text-[#FF5C00]" />
                  </div>
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#FF5C00]">FPV RESEARCH DIVISION // V2</span>
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mt-1">
                      ENGINEERING <span className="text-[#FF5C00]">LAB</span>
                    </h1>
                  </div>
                </div>
                <p className="text-xs text-white/50 leading-relaxed font-sans max-w-3xl mb-6">
                  Advanced theoretical and structural multirotor research. Designed exclusively for builders, tuners, and competitive pilots investigating the physical limits and mathematical constraints governing flight performance.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <TelemetryMeter label="FC Target Rate" value="8.00" unit="kHz" status="OPTIMAL" color="#00FF66" />
                  <TelemetryMeter label="Average Latency" value="14.20" unit="ms" status="LOW_SYS" color="#00F2FF" />
                  <TelemetryMeter label="Link Packet Rate" value="500" unit="Hz" status="STABLE" color="#FF5C00" />
                </div>
              </div>
            </section>

            {/* RESEARCH DIVISIONS HUB */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <div className="w-6 h-6 flex items-center justify-center bg-[#FF5C00]/10 border border-[#FF5C00]/30 rounded-sm">
                  <Compass className="w-3.5 h-3.5 text-[#FF5C00]" />
                </div>
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">SYS_COCKPIT_MAPPING</span>
                  <h3 className="text-base font-black uppercase text-white tracking-wider">Research Divisions & Sectors</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResearchCategoryCard
                  id="FLIGHT_CTRL"
                  title="Flight Control Research"
                  subtitle="Investigating feedback loop control dynamics, high-frequency filtering strategies, and software tuning diagnostics using logs."
                  icon={Cpu}
                  color="#00FF66"
                  metrics={[
                    { label: 'Control Loop', value: 'PID_ATTITUDE' },
                    { label: 'Filter Pipeline', value: 'DYNAMIC_NOTCH' }
                  ]}
                  papers={[
                    { title: "Blackbox Analysis Masterclass", slug: "blackbox-analysis-masterclass" },
                    { title: "PID Tuning Beyond Presets", slug: "pid-tuning-beyond-presets" },
                    { title: "Betaflight Filter Architecture", slug: "modern-betaflight-filter-architecture" }
                  ]}
                  href="/engineering/flight-control"
                />

                <ResearchCategoryCard
                  id="PROPULSION"
                  title="Propulsion & Power"
                  subtitle="Scientific study of electrical power delivery, brushless stator electromagnetism, propeller disk loading, and thermal boundaries."
                  icon={Target}
                  color="#FF5C00"
                  metrics={[
                    { label: 'Bus Voltage', value: '22.2V (6S)' },
                    { label: 'Discharge Limit', value: '150C_BURST' }
                  ]}
                  papers={[
                    { title: "Motor Efficiency Engineering", slug: "motor-efficiency-engineering" },
                    { title: "ESC Protocol Deep Dive", slug: "esc-protocol-deep-dive" },
                    { title: "FPV Propeller Engineering", slug: "fpv-propeller-engineering" },
                    { title: "LiPo Performance Engineering", slug: "lipo-performance-engineering" }
                  ]}
                  href="/engineering/propulsion"
                />

                <ResearchCategoryCard
                  id="COMMUNICATION"
                  title="RF & Video Link"
                  subtitle="Performance analysis of GHz control signals, link budget thresholds, diversity propagation, and digital glass-to-glass latency encoding."
                  icon={Radio}
                  color="#00F2FF"
                  metrics={[
                    { label: 'RF Protocol', value: 'EXPRESSLRS_LoRa' },
                    { label: 'Video codec', value: 'H.265_COMPRESSED' }
                  ]}
                  papers={[
                    { title: "RF Link Engineering", slug: "rf-link-engineering" },
                    { title: "Video Latency Engineering", slug: "video-latency-engineering" }
                  ]}
                  href="/engineering/communication"
                />

                <ResearchCategoryCard
                  id="AIRCRAFT_SYS"
                  title="Aircraft Systems"
                  subtitle="Structural engineering detailing carbon fiber resonances, GPS failsafe navigation reliability, and unified system signal integration."
                  icon={Activity}
                  color="#FFB800"
                  metrics={[
                    { label: 'Arm Resonance', value: '240Hz_PEAK' },
                    { label: 'GPS Coordinates', value: 'WGS84_GEOMETRY' }
                  ]}
                  papers={[
                    { title: "Frame Resonance & Vibrations", slug: "frame-resonance-vibration-analysis" },
                    { title: "GPS Rescue Reliability", slug: "gps-rescue-reliability" },
                    { title: "How FPV Systems Work Together", slug: "how-fpv-systems-work-together" }
                  ]}
                  href="/engineering/systems"
                />
              </div>
            </section>

            {/* ACADEMY PROGRESSION CAPTURE */}
            <section className="bg-gradient-to-r from-transparent to-white/[0.02] border border-white/10 p-6 rounded-md font-mono text-xs text-white/50 leading-relaxed flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex gap-3 items-center">
                <ShieldCheck className="w-5 h-5 text-[#00FF66] shrink-0" />
                <p className="font-sans">
                  Completed the baseline theoretical studies? Head to the **Pilot Academy** to chart your custom flight roadmap.
                </p>
              </div>
              <Link href="/academy" className="px-4 py-2 border border-white/20 hover:border-white/40 text-white rounded uppercase tracking-wider text-[10px] shrink-0 hover:bg-white/5 transition-all">
                Access Academy
              </Link>
            </section>
          </div>

          {/* SIDEBAR COLUMN */}
          <aside className="lg:col-span-4 hidden lg:flex flex-col gap-6">
            <AdStickySidebar />
          </aside>
        </div>
      </div>
    </div>
  );
}
