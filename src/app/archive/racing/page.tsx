import React from 'react';
import Link from 'next/link';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { Flag, Settings, Activity, Target, Calendar, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

export const metadata = {
  title: 'Racing Species | DRONE ARCHIVE V2',
  description: 'FPV Species Database: Track racing FPV drones. Stretched-X frames, zero-latency video links (HDZero/Analog), weight reduction strategies, and historic evolution.',
};

export default function RacingPage() {
  const breadcrumbs = [
    { label: 'Drone Archive', href: '/archive' },
    { label: 'Track Racing Spec', isCurrentPage: true }
  ];

  const racingSpecs = [
    { label: 'Wheelbase Size', val: '200mm - 215mm (Minimal cockpit footprint)' },
    { label: 'Propeller Size', val: '5.0" - 5.1" (Tri-Blade / Aggressive Pitch 51466+)' },
    { label: 'Motor Stators', val: '2207 / 2208 / 2306' },
    { label: 'Motor KV Range', val: '1950KV - 2150KV (6S) / 2500KV - 2750KV (4S)' },
    { label: 'Battery Spec', val: '6S LiPo (1050mAh - 1200mAh 150C+ high discharge)' },
    { label: 'ESC Amp Rating', val: '60A - 65A 32-bit (Maximum burst handling & heat sink panels)' },
    { label: 'Video System', val: 'HDZero / Analog (Zero-latency 0.5ms digital glass-to-glass link)' },
    { label: 'Dry Weight', val: '260g - 320g (AUW ~450g - 520g without action cam)' },
  ];

  const representativeAircraft = [
    {
      name: 'FIVE33 LIGHTSWITCH V2 (5" Spec)',
      class: 'Milestone: The World Champion Track Layout',
      desc: 'The definitive professional track racing platform, famous for its extreme weight reduction and modular single-screw arm replacement design.',
      designRationale: 'Features a narrow central fuselage to reduce drag, custom titanium bolts, and a modular spine that isolates flight stack vibration from the high-stress arm plate.',
      impact: 'Standardized modern Spec-Class track racing, winning multiple world championships with its ultra-rigid carbon frame.'
    },
    {
      name: 'TBS SOURCE ONE V5 RACER (5" Open-Source)',
      class: 'Milestone: The Grassroots Pioneer',
      desc: 'The definitive open-source community-designed track frame, engineered to provide a robust, low-cost baseline for grassroots racing.',
      designRationale: 'Uses high-strength thick carbon plates in a symmetrical True-X shape, prioritizing easy hardware sourcing and crash durability over extreme weight shaving.',
      impact: 'Lowered entry barriers globally for FPV track racing, acting as the baseline training frame for local MultiGP chapters.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 text-[#f8fafc] font-mono">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-8">

          {/* Header Billboard */}
          <div className="relative h-64 md:h-80 w-full overflow-hidden hex-panel border border-[#FF5C00]/30 shadow-[0_0_50px_rgba(255,92,0,0.1)] rounded-lg">
             {/* Cyber Grid & Telemetry Tech Background (Zero Stock Images) */}
             <div className="absolute inset-0 bg-[#070709]" />
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#FF5C000c_1px,transparent_1px),linear-gradient(to_bottom,#FF5C000c_1px,transparent_1px)] bg-[size:32px_32px]" />
             <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-[#FF5C00]/15" />
             <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-[#FF5C00]/15" />
             <div className="absolute top-4 right-4 text-[9px] text-[#FF5C00]/40 font-mono tracking-widest uppercase">SYS.LOC: MULTIGP_T1 // RSSI: 99dBm // LATENCY: 2.1ms</div>
             <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#FF5C00]/10 z-10" />
             <div className="absolute inset-0 scanline-anim bg-gradient-to-b from-transparent via-[#FF5C00]/10 to-transparent z-10 pointer-events-none" />
             <div className="absolute bottom-8 left-8 z-20">
                <div className="flex items-center gap-2 mb-2">
                   <Flag className="w-5 h-5 text-[#FF5C00]" />
                   <span className="text-[10px] font-black uppercase text-[#FF5C00] tracking-widest">AERODYNAMIC SPECIES: TRACK RACING SPEC</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter shadow-black drop-shadow-xl">
                  Track <span className="text-[#FF5C00]">Racing</span>
                </h1>
             </div>
          </div>

          {/* Species Introductory Block */}
          <div className="glass-panel p-6 border-l-2 border-[#FF5C00] bg-[#FF5C00]/5 text-xs text-[#b0bfd6] leading-relaxed rounded-md">
            {"// AERODYNAMIC SPECIES TAXONOMY: Symmetrical stretched-X and true-X racing multirotors. Built for pure aerodynamic speed and latency-optimized gate navigation. Stripped of all non-essential hardware (no heavy action cams), Racing drones utilize aggressive high-pitch props, massive motor KV stators, and zero-latency video links."}
          </div>

          <div className="border border-[#00F2FF]/20 bg-[#00F2FF]/5 p-5 rounded-md text-xs leading-relaxed flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-[#00F2FF] font-black uppercase tracking-wider block mb-1">Competition ecosystem moved to Racing Division</span>
              <span className="text-[#b0bfd6]">This Archive page covers racing aircraft hardware. Events, pilots, teams, tracks, rankings, and racing history now live in the dedicated FPV Racing Division.</span>
            </div>
            <Link href="/racing" className="shrink-0 rounded border border-[#00F2FF]/30 px-4 py-2 font-black uppercase tracking-wider text-[#00F2FF] transition-colors hover:bg-[#00F2FF]/10 hover:text-white">
              Open Racing Division
            </Link>
          </div>

          {/* Mission Profile Section */}
          <div className="border border-[#1A1A1A] bg-[#050810]/40 p-6 rounded-lg">
            <h3 className="text-lg font-black uppercase text-white border-b border-[#1f2937] pb-3 mb-4 tracking-wide flex items-center gap-2">
              <Target className="w-4 h-4 text-[#FF5C00]" /> Mission Profile Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
              <div>
                <span className="text-[#FF5C00] font-black uppercase block mb-1">MISSION PURPOSE:</span>
                <p className="text-[#b0bfd6]">Navigating high-speed closed-circuit gate tracks in the shortest time envelope possible. Unmatched agility and rapid recovery from gate clip crashes.</p>
              </div>
              <div>
                <span className="text-[#FF5C00] font-black uppercase block mb-1">TYPICAL OBJECTIVES:</span>
                <p className="text-[#b0bfd6]">High-speed apex cornering, vertical slalom dives, extreme gate navigation, and lap-time optimization.</p>
              </div>
              <div>
                <span className="text-[#FF5C00] font-black uppercase block mb-1">TYPICAL ENVIRONMENT:</span>
                <p className="text-[#b0bfd6]">MultiGP timed track lawns, closed indoor LED stadiums, obstacle race fields, and high-frequency gate circuits.</p>
              </div>
              <div>
                <span className="text-[#FF5C00] font-black uppercase block mb-1">PILOTING DIFFICULTY:</span>
                <p className="text-[#FF5C00] font-black">**Advanced**. Requires lightning-fast reflexes, near-zero visual reaction latency, and extreme spatial awareness under high speeds (140km/h+).</p>
              </div>
            </div>
          </div>

          {/* Evolution Timeline */}
          <div className="border border-[#1A1A1A] bg-[#050810]/40 p-6 rounded-lg">
            <h3 className="text-lg font-black uppercase text-white border-b border-[#1f2937] pb-3 mb-4 tracking-wide flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#FF5C00]" /> Evolution Timeline
            </h3>
            <div className="space-y-4 text-xs">
              <div className="border-l border-[#FF5C00]/30 pl-4 relative">
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[#FF5C00] -left-[6px] top-1" />
                <span className="text-white font-bold block">2015 — Grassroots fields & Heavy H-Frames</span>
                <p className="text-[#A0A0A0] mt-1">MultiGP grassroots clubs formed. Drones used thick boxy structures with bulky heavy analog setups, leading to high roll inertia.</p>
              </div>
              <div className="border-l border-[#FF5C00]/30 pl-4 relative">
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[#FF5C00] -left-[6px] top-1" />
                <span className="text-white font-bold block">2017 — Symmetrical Stretched-X Geometries</span>
                <p className="text-[#A0A0A0] mt-1">Introduction of stretched-X layouts that extended the wheelbase on the pitch axis, stabilizing pitch authority during extreme horizontal flight leans.</p>
              </div>
              <div className="border-l border-[#FF5C00]/30 pl-4 relative">
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[#FF5C00] -left-[6px] top-1" />
                <span className="text-white font-bold block">2019 — 6S Spec Racing & Integrated ESCs</span>
                <p className="text-[#A0A0A0] mt-1">Transition to low-KV motors on high voltage 6S batteries. Integrated BLHeli_32 4-in-1 ESC stacks significantly streamlined the chassis layout.</p>
              </div>
              <div className="border-l border-[#FF5C00]/30 pl-4 relative">
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[#FF5C00] -left-[6px] top-1" />
                <span className="text-white font-bold block">2021 — Zero-Latency HDZero digital video</span>
                <p className="text-[#A0A0A0] mt-1">Arrival of HDZero digital systems, delivering stable HD video feeds at fixed 100 FPS frame rates and matching sub-millisecond analog latency (0.5ms).</p>
              </div>
              <div className="border-l border-[#FF5C00]/30 pl-4 relative">
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[#FF5C00] -left-[6px] top-1" />
                <span className="text-white font-bold block">2024 — Ultra-modular Single-Screw Arm plates</span>
                <p className="text-[#A0A0A0] mt-1">Introduction of modular carbon architectures where arms lock independently, allowing pit replacement in under 60 seconds.</p>
              </div>
            </div>
          </div>

          {/* Technical Specs Panel */}
          <div className="border border-[#1A1A1A] bg-[#050810]/40 p-6 rounded-lg">
            <h3 className="text-lg font-black uppercase text-white border-b border-[#1f2937] pb-3 mb-4 tracking-wide flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#FF5C00]" /> Telemetry & Hardware Blueprint
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {racingSpecs.map((spec, idx) => (
                <div key={idx} className="flex justify-between border-b border-white/[0.04] pb-2 text-xs">
                  <span className="text-[#8d8981] font-semibold">{spec.label}:</span>
                  <span className="text-white font-bold text-right">{spec.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Flight DNA Analysis */}
          <div className="border border-[#1A1A1A] bg-[#050810]/40 p-6 rounded-lg">
            <h3 className="text-lg font-black uppercase text-white border-b border-[#1f2937] pb-3 mb-4 tracking-wide flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#FF5C00]" /> Flight DNA
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-[#b0bfd6]">
              <div className="p-4 border border-white/[0.02] bg-white/[0.01] rounded">
                <span className="text-white font-black block mb-1">EXTREME POWER TO WEIGHT:</span>
                Without any camera payloads, dry weights drop to 270g. Paired with 2207.5 motors, they generate massive thrust ratios (14:1) that translate to lightning gate launches.
              </div>
              <div className="p-4 border border-white/[0.02] bg-white/[0.01] rounded">
                <span className="text-white font-black block mb-1">STRETCHED-X YAW STABILITY:</span>
                Extended motor distance along the pitch line separates propeller clean air columns, stabilizing yaw during sharp high-speed horizontal track corner turns.
              </div>
              <div className="p-4 border border-white/[0.02] bg-white/[0.01] rounded">
                <span className="text-white font-black block mb-1">ZERO LATENCY PILOT LINK:</span>
                Requires fixed glass-to-glass video links (HDZero/Analog) and high-frequency ExpressLRS packet rates (up to 1000Hz) to match rapid physical reflexes.
              </div>
              <div className="p-4 border border-white/[0.02] bg-white/[0.01] rounded">
                <span className="text-white font-black block mb-1">HIGH PITCH PROP disk:</span>
                Aggressive prop pitch envelopes (51466 / 5147) maximize high-speed air bite, but draw massive current spikes, draining battery packs in under 2 minutes.
              </div>
            </div>
          </div>

          {/* Seminal Aircraft Archetypes */}
          <div className="space-y-6">
            <h3 className="text-lg font-black uppercase text-white border-b border-[#1f2937] pb-3 tracking-wide flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#FF5C00]" /> Seminal Reference Aircraft
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {representativeAircraft.map((build, idx) => (
                <div key={idx} className="p-5 border border-[#1f2937] bg-[#050810]/30 hover:border-[#FF5C00]/40 transition-colors duration-200 rounded-lg flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-[#FF5C00] font-black uppercase tracking-wider">{build.class}</span>
                    <h4 className="text-base font-black text-white uppercase mt-1 mb-2">{build.name}</h4>
                    <p className="text-xs text-[#8d8981] leading-relaxed mb-3">{build.desc}</p>
                    
                    <div className="space-y-2 border-t border-white/[0.04] pt-3 text-[11px]">
                      <div>
                        <span className="text-[#8d8981] uppercase font-semibold">DESIGN CHOICE:</span>
                        <p className="text-white mt-0.5 leading-relaxed">{build.designRationale}</p>
                      </div>
                      <div className="mt-2">
                        <span className="text-[#FF5C00] uppercase font-semibold">HISTORICAL IMPACT:</span>
                        <p className="text-white mt-0.5 leading-relaxed">{build.impact}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advantages & Limitations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-green-500/20 bg-green-500/[0.02] p-5 rounded-lg text-xs">
              <h4 className="text-green-400 font-bold uppercase mb-2">ADVANTAGES</h4>
              <ul className="space-y-2 list-disc list-inside text-[#b0bfd6]">
                <li>Maximum top speeds reaching up to 160km/h+ in spec class.</li>
                <li>Modular layout designed for rapid 60-second pit arm replacement.</li>
                <li>Zero-latency control links to match real-time pilot reflexes.</li>
                <li>Highly optimized narrow frames that present tiny collision profiles.</li>
              </ul>
            </div>
            <div className="border border-red-500/20 bg-red-500/[0.02] p-5 rounded-lg text-xs">
              <h4 className="text-red-400 font-bold uppercase mb-2">LIMITATIONS</h4>
              <ul className="space-y-2 list-disc list-inside text-[#b0bfd6]">
                <li>Extremely short flight times (typically 1.5 to 2 minutes of hard flight).</li>
                <li>Zero structural capacity to carry secondary action cameras.</li>
                <li>Highly specialized, aggressive tuning profiles that crash in wind.</li>
                <li>Frequent high-current battery degradation under hard tracks.</li>
              </ul>
            </div>
          </div>

          {/* Required Articles & Knowledge base */}
          <div className="border border-[#1f2937] bg-[#050810]/20 p-6 rounded-lg">
            <h3 className="text-lg font-black uppercase text-white border-b border-[#1f2937] pb-3 mb-4 tracking-wide flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#FF5C00]" /> Core Species Knowledge Database
            </h3>
            <ul className="space-y-3 text-xs text-[#b0bfd6]">
              <li className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span>1. Evolution of FPV Racing: From local grassroots field lanes to international LED stadiums</span>
                <a href="/academy/roadmap" className="text-[#FF5C00] hover:underline font-bold">Read Article →</a>
              </li>
              <li className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span>2. Race Frame Engineering: Narrow fuselages, titanium hardware, and drag reduction</span>
                <a href="/academy/roadmap" className="text-[#FF5C00] hover:underline font-bold">Read Article →</a>
              </li>
              <li className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span>3. Weight Reduction Strategies: Eliminating redundant standoffs, titanium screws, and short wires</span>
                <a href="/academy/roadmap" className="text-[#FF5C00] hover:underline font-bold">Read Article →</a>
              </li>
              <li className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span>4. Latency Engineering: Deciphering 100 FPS fixed video feeds and 1000Hz ELRS packet rates</span>
                <a href="/academy/roadmap" className="text-[#FF5C00] hover:underline font-bold">Read Article →</a>
              </li>
              <li className="flex justify-between items-center">
                <span>5. Racing Build DNA: Steeping propeller pitch arrays, massive stators, and extreme C-rate LiPos</span>
                <a href="/engineering/workshop" className="text-[#FF5C00] hover:underline font-bold">Read Article →</a>
              </li>
            </ul>
          </div>

          {/* Related Reference Academy Guides */}
          <div className="border border-[#1f2937] bg-[#050810]/20 p-6 rounded-lg">
            <h3 className="text-lg font-black uppercase text-white border-b border-[#1f2937] pb-3 mb-4 tracking-wide flex items-center gap-2">
              <Target className="w-4 h-4 text-[#FF5C00]" /> Related Reference Academy Guides
            </h3>
            <ul className="space-y-3 text-xs">
              <li className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span className="text-white">HDZero Fixed-Latency setup: Aligning the Camera for 90 FPS Refresh Rates</span>
                <a href="/academy/roadmap" className="text-[#FF5C00] hover:underline uppercase font-bold">Open Guide →</a>
              </li>
              <li className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span className="text-white">FPV Racing Track Navigation: Pro Tips for Apex Turns & Slalom gates</span>
                <a href="/academy/roadmap" className="text-[#FF5C00] hover:underline uppercase font-bold">Open Guide →</a>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-white">High-Current Soldering: Wiring Heavy-Duty 6S battery leads correctly</span>
                <a href="/engineering/workshop" className="text-[#FF5C00] hover:underline uppercase font-bold">Open Guide →</a>
              </li>
            </ul>
          </div>

        </div>

        <aside className="lg:col-span-4 hidden lg:flex flex-col gap-6">
           <AdStickySidebar />
        </aside>
      </div>
    </div>
  );
}
