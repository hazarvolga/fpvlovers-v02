import React from 'react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { Settings, Activity, Target, Calendar, ShieldCheck, Zap } from 'lucide-react';
import Image from 'next/image';

export const metadata = {
  title: 'Freestyle Species | DRONE ARCHIVE V2',
  description: 'FPV Species Database: 5-inch freestyle aircraft. Core mechanical specifications, structural resonance analysis, acro flight DNA, and historic bando evolution.',
};

export default function FreestylePage() {
  const breadcrumbs = [
    { label: 'Drone Archive', href: '/archive' },
    { label: 'Freestyle Tactician', isCurrentPage: true }
  ];

  const freestyleSpecs = [
    { label: 'Wheelbase Size', val: '220mm - 235mm (5-inch standard)' },
    { label: 'Propeller Size', val: '5.0" - 5.1" (Tri-Blade / Aggressive Pitch)' },
    { label: 'Motor Stators', val: '2207 / 2306 / 2208 Brushless' },
    { label: 'Motor KV Range', val: '1750KV - 1950KV (6S) / 2400KV - 2550KV (4S)' },
    { label: 'Battery Spec', val: '6S LiPo (1050mAh - 1400mAh 120C+ high discharge)' },
    { label: 'ESC Amp Rating', val: '50A - 65A (Heavy-duty BLHeli_32 / AM32 Stack)' },
    { label: 'Video System', val: 'DJI O3 / Walksnail Avatar / Analog (Highly protected mid-mount)' },
    { label: 'Dry Weight', val: '350g - 420g (AUW ~650g - 750g with Action Cam)' },
  ];

  const representativeAircraft = [
    {
      name: 'IMPULSERC APEX HD (5" Spec)',
      class: 'Milestone: The High-Impact Durability Benchmark',
      desc: 'The definitive hardcore freestyle platform, famous for its interlocking arm key layout and exceptional structural rigidity under concrete impact.',
      designRationale: 'Uses high-grade carbon plates, custom injection-molded plastic bumpers, and a modular design that isolates arm torque from flight controller stack columns.',
      impact: 'Redefined bando freestyle flight, establishing the standard for rigid, vibration-resistant frame construction.'
    },
    {
      name: 'AOS 5 V2 (5" Resonance Designed)',
      class: 'Milestone: The Harmonic Engineering Pioneer',
      desc: 'Designed by Chris Rosser using finite element analysis (FEA) to model and optimize carbon plate vibration profiles.',
      designRationale: 'Features a unique truss-like top and bottom plate geometry, shifting structural resonance frequencies out of the gyro frequency bands to yield cleaner gyro readings.',
      impact: 'Pioneered resonance-optimized FPV frame engineering, eliminating the reliance on aggressive software filtering.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 text-[#f8fafc] font-mono">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-8">

          {/* Header Billboard */}
          <div className="relative h-64 md:h-80 w-full overflow-hidden border border-white/5 bg-[#18181b] rounded-sm">
             {/* Cyber Grid & Telemetry Tech Background (Zero Stock Images) */}
             <div className="absolute inset-0 bg-[#0c0c0e]" />
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#FF5C0009_1px,transparent_1px),linear-gradient(to_bottom,#FF5C0009_1px,transparent_1px)] bg-[size:32px_32px]" />
             <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-[#FF5C00]/10" />
             <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-[#FF5C00]/10" />
             <div className="absolute top-4 right-4 text-[9px] text-[#00FF66]/50 font-mono tracking-widest uppercase">SYS.LOC: ACRO_YARD // RSSI: 99dBm // MODE: ACRO</div>
             <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent z-10" />
             <div className="absolute inset-0 scanline-anim bg-gradient-to-b from-transparent via-[#00F2FF]/5 to-transparent z-10 pointer-events-none" />
             <div className="absolute bottom-8 left-8 z-20">
                <div className="flex items-center gap-3 mb-4">
                   <span className="flex h-1.5 w-1.5 rounded-full bg-[#00FF66] animate-pulse" />
                   <span className="text-[9px] font-bold uppercase text-[#00FF66] tracking-widest">AERODYNAMIC SPECIES: 5-INCH ACROBATIC</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold uppercase text-zinc-100 tracking-tight shadow-black drop-shadow-xl">
                  Freestyle <span className="text-[#FF5C00]">Tactician</span>
                </h1>
             </div>
          </div>

          {/* Species Introductory Block */}
          <div className="p-6 border-l-2 border-[#FF5C00] bg-[#18181b] text-[11px] text-zinc-400 font-mono leading-relaxed rounded-sm">
            {"// AERODYNAMIC SPECIES TAXONOMY: 5-inch acrobatic multirotor systems. The apex predator of the FPV ecosystem. Optimized for high-G structural endurance, mechanical symmetry, and carry limits. High torque-to-weight ratios allow pilots to surf architectural gaps, execute complex roll-pitch-yaw maneuvers, and carry full-sized action cameras."}
          </div>

          {/* Mission Profile Section */}
          <div className="border border-white/5 bg-[#18181b]/50 p-6 rounded-sm">
            <h3 className="text-[13px] font-bold uppercase text-zinc-100 border-b border-white/5 pb-3 mb-5 tracking-widest flex items-center gap-2">
              <Target className="w-4 h-4 text-[#00F2FF]" /> Mission Profile Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px] font-mono leading-relaxed">
              <div>
                <span className="text-zinc-500 font-bold uppercase block mb-1">MISSION PURPOSE</span>
                <p className="text-zinc-300">High-G acrobatic maneuvers, structural collision resistance, architectural proximity surfing, and gravity-defying momentum control.</p>
              </div>
              <div>
                <span className="text-zinc-500 font-bold uppercase block mb-1">TYPICAL OBJECTIVES</span>
                <p className="text-zinc-300">Acro flips, bando dives, power loops, yaw-spin transitions, and creative artistic flow tracking.</p>
              </div>
              <div>
                <span className="text-zinc-500 font-bold uppercase block mb-1">TYPICAL ENVIRONMENT</span>
                <p className="text-zinc-300">Abandoned urban complexes (bandos), skateparks, dense forest canopies, open fields with architectural structural markers, and dynamic vertical structures.</p>
              </div>
              <div>
                <span className="text-zinc-500 font-bold uppercase block mb-1">PILOTING DIFFICULTY</span>
                <p className="text-zinc-300">**Intermediate to Advanced**. Requires fine stick muscle memory and sub-conscious acro muscle reactions under steep physical penalties for error.</p>
              </div>
            </div>
          </div>

          {/* Evolution Timeline */}
          <div className="border border-white/5 bg-[#18181b]/50 p-6 rounded-sm">
            <h3 className="text-[13px] font-bold uppercase text-zinc-100 border-b border-white/5 pb-3 mb-5 tracking-widest flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#00F2FF]" /> Evolution Timeline
            </h3>
            <div className="space-y-6 text-[11px] font-mono">
              <div className="border-l border-white/10 pl-4 relative">
                <div className="absolute w-2 h-2 rounded-none bg-zinc-600 -left-[4.5px] top-1" />
                <span className="text-zinc-200 font-bold block uppercase tracking-wide">2015 — Early H-Frame & Brushed Acro</span>
                <p className="text-zinc-500 mt-1">Introduction of thick carbon H-frames. Heavy components and low battery cell configurations limited acrobatic throttle range.</p>
              </div>
              <div className="border-l border-white/10 pl-4 relative">
                <div className="absolute w-2 h-2 rounded-none bg-zinc-600 -left-[4.5px] top-1" />
                <span className="text-zinc-200 font-bold block uppercase tracking-wide">2017 — True-X and 4S Standardization</span>
                <p className="text-zinc-500 mt-1">Frames transition to pure symmetrical True-X geometries, aligning pitching and rolling inertia. High discharge 4S LiPos become the standard.</p>
              </div>
              <div className="border-l border-white/10 pl-4 relative">
                <div className="absolute w-2 h-2 rounded-none bg-zinc-600 -left-[4.5px] top-1" />
                <span className="text-zinc-200 font-bold block uppercase tracking-wide">2019 — The 6S Voltage Revolution</span>
                <p className="text-zinc-500 mt-1">Pilots migrate to 6S high voltage battery cells paired with low-KV motors, drastically reducing sag, cooling electronics, and widening acro envelopes.</p>
              </div>
              <div className="border-l border-white/10 pl-4 relative">
                <div className="absolute w-2 h-2 rounded-none bg-zinc-600 -left-[4.5px] top-1" />
                <span className="text-zinc-200 font-bold block uppercase tracking-wide">2021 — Carbon Resonance Analysis</span>
                <p className="text-zinc-500 mt-1">Introduction of harmonic modeling in frame carbon design. Software gyro filtering is optimized, allowing crisp, propwash-free acro tunes.</p>
              </div>
              <div className="border-l border-[#00F2FF]/50 pl-4 relative">
                <div className="absolute w-2 h-2 rounded-none bg-[#00F2FF] shadow-[0_0_10px_#00F2FF] -left-[4.5px] top-1" />
                <span className="text-zinc-200 font-bold block uppercase tracking-wide">2023 — Clean digital recording integration</span>
                <p className="text-zinc-500 mt-1">Arrival of high-bitrate HD systems capable of 4K stabilized capture directly onboard, removing the absolute dependency on secondary heavy action cams.</p>
              </div>
            </div>
          </div>

          {/* Technical Specs Panel */}
          <div className="border border-white/5 bg-[#18181b]/50 p-6 rounded-sm">
            <h3 className="text-[13px] font-bold uppercase text-zinc-100 border-b border-white/5 pb-3 mb-5 tracking-widest flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#00F2FF]" /> Telemetry & Hardware Blueprint
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {freestyleSpecs.map((spec, idx) => (
                <div key={idx} className="flex justify-between border-b border-white/5 pb-2 text-[10px] font-mono">
                  <span className="text-zinc-500 font-bold uppercase tracking-widest">{spec.label}</span>
                  <span className="text-zinc-200 font-bold text-right ml-4">{spec.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Flight DNA Analysis */}
          <div className="border border-white/5 bg-[#18181b]/50 p-6 rounded-sm">
            <h3 className="text-[13px] font-bold uppercase text-zinc-100 border-b border-white/5 pb-3 mb-5 tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00F2FF]" /> Flight DNA
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] font-mono leading-relaxed text-zinc-400">
              <div className="p-5 border border-white/5 bg-[#18181b] rounded-sm">
                <span className="text-zinc-200 font-bold block mb-2 uppercase tracking-wide">MOMENTUM SURFING</span>
                The 5-inch species has the perfect kinetic mass envelope. Pilots cut the throttle and &quot;throw&quot; the drone, allowing it to surf gravity arcs with highly predictable trajectories.
              </div>
              <div className="p-5 border border-white/5 bg-[#18181b] rounded-sm">
                <span className="text-zinc-200 font-bold block mb-2 uppercase tracking-wide">PROPWASH SUSCEPTIBILITY</span>
                Freestyle drones frequently descend back through their own dynamic thrust wake, creating aerodynamic instability (&quot;propwash&quot;) that requires optimized PID/D-term dampening.
              </div>
              <div className="p-5 border border-white/5 bg-[#18181b] rounded-sm">
                <span className="text-zinc-200 font-bold block mb-2 uppercase tracking-wide">AXIS BALANCED INERTIA</span>
                Aligning mass along the central roll-pitch line creates highly symmetrical rotational physics, ensuring acro snaps (rolls/flips) complete without axial drift.
              </div>
              <div className="p-5 border border-white/5 bg-[#18181b] rounded-sm">
                <span className="text-zinc-200 font-bold block mb-2 uppercase tracking-wide">AGGRESSIVE POWER RAILS</span>
                Fast 2207 stators can draw massive transient current spikes (up to 120A burst), requiring ultra-low ESR capacitors (35V 1000uF) to prevent video static.
              </div>
            </div>
          </div>

          {/* Seminal Aircraft Archetypes */}
          <div className="space-y-4">
            <h3 className="text-[13px] font-bold uppercase text-zinc-100 border-b border-white/5 pb-3 tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00F2FF]" /> Seminal Reference Aircraft
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {representativeAircraft.map((build, idx) => (
                <div key={idx} className="p-6 border border-white/5 bg-[#18181b]/50 hover:bg-[#18181b] transition-colors duration-200 rounded-sm flex flex-col justify-between group">
                  <div>
                    <span className="text-[9px] text-[#FF5C00] font-bold uppercase tracking-widest">{build.class}</span>
                    <h4 className="text-sm font-bold text-zinc-100 uppercase mt-2 mb-3 tracking-wide group-hover:text-[#00F2FF] transition-colors">{build.name}</h4>
                    <p className="text-[11px] font-mono text-zinc-400 leading-relaxed mb-4">{build.desc}</p>
                    
                    <div className="space-y-3 border-t border-white/5 pt-4 text-[10px] font-mono">
                      <div>
                        <span className="text-zinc-600 uppercase font-bold tracking-widest block mb-1">DESIGN CHOICE</span>
                        <p className="text-zinc-300 leading-relaxed">{build.designRationale}</p>
                      </div>
                      <div>
                        <span className="text-[#00F2FF] uppercase font-bold tracking-widest block mb-1">HISTORICAL IMPACT</span>
                        <p className="text-zinc-300 leading-relaxed">{build.impact}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advantages & Limitations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-[#00FF66]/20 bg-[#00FF66]/5 p-6 rounded-sm text-[11px] font-mono">
              <h4 className="text-[#00FF66] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#00FF66] rounded-none" /> Advantages
              </h4>
              <ul className="space-y-3 list-none text-zinc-300">
                <li className="flex gap-2 before:content-['+'] before:text-[#00FF66] before:font-bold">Unmatched power-to-weight ratio (up to 12:1 thrust curves).</li>
                <li className="flex gap-2 before:content-['+'] before:text-[#00FF66] before:font-bold">Highly durable design with cheap, modular arms.</li>
                <li className="flex gap-2 before:content-['+'] before:text-[#00FF66] before:font-bold">Excellent flight control resolution under Betaflight tuning.</li>
                <li className="flex gap-2 before:content-['+'] before:text-[#00FF66] before:font-bold">Carries full-sized heavy action cameras effortlessly.</li>
              </ul>
            </div>
            <div className="border border-[#FF5C00]/20 bg-[#FF5C00]/5 p-6 rounded-sm text-[11px] font-mono">
              <h4 className="text-[#FF5C00] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#FF5C00] rounded-none" /> Limitations
              </h4>
              <ul className="space-y-3 list-none text-zinc-300">
                <li className="flex gap-2 before:content-['-'] before:text-[#FF5C00] before:font-bold">High noise signature, attracting attention in public areas.</li>
                <li className="flex gap-2 before:content-['-'] before:text-[#FF5C00] before:font-bold">Exposed, dangerous propellers—cannot operate near humans.</li>
                <li className="flex gap-2 before:content-['-'] before:text-[#FF5C00] before:font-bold">Short overall flight duration (typically 4 to 5 minutes).</li>
                <li className="flex gap-2 before:content-['-'] before:text-[#FF5C00] before:font-bold">High kinetic damage index in steep high-speed crashes.</li>
              </ul>
            </div>
          </div>

          {/* Required Articles & Knowledge base */}
          <div className="border border-white/5 bg-[#18181b]/50 p-6 rounded-sm">
            <h3 className="text-[13px] font-bold uppercase text-zinc-100 border-b border-white/5 pb-3 mb-5 tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00F2FF]" /> Core Species Knowledge Database
            </h3>
            <ul className="space-y-4 text-[11px] font-mono text-zinc-400">
              <li className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-white/5 pb-3">
                <span>01. Evolution of Freestyle FPV: From heavy carbon boxes to advanced, optimized acro structures</span>
                <a href="/academy/roadmap" className="text-[#FF5C00] hover:text-white uppercase font-bold tracking-widest transition-colors flex-shrink-0">Read Article →</a>
              </li>
              <li className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-white/5 pb-3">
                <span>02. Why 5-Inch Became the Standard: The golden ratio of disk loading, weight, and momentum</span>
                <a href="/academy/roadmap" className="text-[#FF5C00] hover:text-white uppercase font-bold tracking-widest transition-colors flex-shrink-0">Read Article →</a>
              </li>
              <li className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-white/5 pb-3">
                <span>03. Modern Freestyle Build DNA: Framing carbon weave specs, standoffs, and electronics isolation</span>
                <a href="/academy/roadmap" className="text-[#FF5C00] hover:text-white uppercase font-bold tracking-widest transition-colors flex-shrink-0">Read Article →</a>
              </li>
              <li className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-white/5 pb-3">
                <span>04. Frame Geometry Analysis: Deconstructing Squashed-X, True-X, and Wide-X axis control</span>
                <a href="/academy/roadmap" className="text-[#FF5C00] hover:text-white uppercase font-bold tracking-widest transition-colors flex-shrink-0">Read Article →</a>
              </li>
              <li className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <span>05. Freestyle Flight DNA: Gravity transitions, momentum arcs, and dynamic propwash tuning</span>
                <a href="/engineering/workshop" className="text-[#FF5C00] hover:text-white uppercase font-bold tracking-widest transition-colors flex-shrink-0">Read Article →</a>
              </li>
            </ul>
          </div>

          {/* Related Reference Academy Guides */}
          <div className="border border-white/5 bg-[#18181b]/50 p-6 rounded-sm">
            <h3 className="text-[13px] font-bold uppercase text-zinc-100 border-b border-white/5 pb-3 mb-5 tracking-widest flex items-center gap-2">
              <Target className="w-4 h-4 text-[#00F2FF]" /> Related Reference Academy Guides
            </h3>
            <ul className="space-y-4 text-[11px] font-mono text-zinc-400">
              <li className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-white/5 pb-3">
                <span className="text-zinc-300">Betaflight PID Basics: Understanding P, I, D and Feedforward Tuning</span>
                <a href="/academy/roadmap" className="text-[#00F2FF] hover:text-white uppercase font-bold tracking-widest transition-colors flex-shrink-0">Open Guide →</a>
              </li>
              <li className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-white/5 pb-3">
                <span className="text-zinc-300">How to Pick the Best 5-Inch FPV Frame: Stretchy vs Squashed Geometry</span>
                <a href="/academy/roadmap" className="text-[#00F2FF] hover:text-white uppercase font-bold tracking-widest transition-colors flex-shrink-0">Open Guide →</a>
              </li>
              <li className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <span className="text-zinc-300">Capacitor Soldering: Preventing Spikes and Video Noise in 6S Builds</span>
                <a href="/engineering/workshop" className="text-[#00F2FF] hover:text-white uppercase font-bold tracking-widest transition-colors flex-shrink-0">Open Guide →</a>
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

