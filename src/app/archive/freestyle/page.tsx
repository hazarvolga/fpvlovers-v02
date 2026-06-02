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
          <div className="relative h-64 md:h-80 w-full overflow-hidden hex-panel border border-[#FF5C00]/30 shadow-[0_0_50px_rgba(255,92,0,0.1)] rounded-lg">
             <Image
                src="https://images.unsplash.com/photo-1524522173746-f628baad3644?w=1200&auto=format&fit=crop&q=70"
                alt="Freestyle FPV Drone"
                fill
                className="object-cover opacity-30 mix-blend-hard-light grayscale-[40%]"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#FF5C00]/10 z-10" />
             <div className="absolute inset-0 scanline-anim bg-gradient-to-b from-transparent via-[#FF5C00]/10 to-transparent z-10 pointer-events-none" />
             <div className="absolute bottom-8 left-8 z-20">
                <div className="flex items-center gap-2 mb-2">
                   <Zap className="w-5 h-5 text-[#FF5C00]" />
                   <span className="text-[10px] font-black uppercase text-[#FF5C00] tracking-widest">AERODYNAMIC SPECIES: 5-INCH ACROBATIC</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter shadow-black drop-shadow-xl">
                  Freestyle <span className="text-[#FF5C00]">Tactician</span>
                </h1>
             </div>
          </div>

          {/* Species Introductory Block */}
          <div className="glass-panel p-6 border-l-2 border-[#FF5C00] bg-[#FF5C00]/5 text-xs text-[#b0bfd6] leading-relaxed rounded-md">
            {"// AERODYNAMIC SPECIES TAXONOMY: 5-inch acrobatic multirotor systems. The apex predator of the FPV ecosystem. Optimized for high-G structural endurance, mechanical symmetry, and carry limits. High torque-to-weight ratios allow pilots to surf architectural gaps, execute complex roll-pitch-yaw maneuvers, and carry full-sized action cameras."}
          </div>

          {/* Mission Profile Section */}
          <div className="border border-[#1A1A1A] bg-[#050810]/40 p-6 rounded-lg">
            <h3 className="text-lg font-black uppercase text-white border-b border-[#1f2937] pb-3 mb-4 tracking-wide flex items-center gap-2">
              <Target className="w-4 h-4 text-[#FF5C00]" /> Mission Profile Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
              <div>
                <span className="text-[#FF5C00] font-black uppercase block mb-1">MISSION PURPOSE:</span>
                <p className="text-[#b0bfd6]">High-G acrobatic maneuvers, structural collision resistance, architectural proximity surfing, and gravity-defying momentum control.</p>
              </div>
              <div>
                <span className="text-[#FF5C00] font-black uppercase block mb-1">TYPICAL OBJECTIVES:</span>
                <p className="text-[#b0bfd6]">Acro flips, bando dives, power loops, yaw-spin transitions, and creative artistic flow tracking.</p>
              </div>
              <div>
                <span className="text-[#FF5C00] font-black uppercase block mb-1">TYPICAL ENVIRONMENT:</span>
                <p className="text-[#b0bfd6]">Abandoned urban complexes (bandos), skateparks, dense forest canopies, open fields with architectural structural markers, and dynamic vertical structures.</p>
              </div>
              <div>
                <span className="text-[#FF5C00] font-black uppercase block mb-1">PILOTING DIFFICULTY:</span>
                <p className="text-[#b0bfd6]">**Intermediate to Advanced**. Requires fine stick muscle memory and sub-conscious acro muscle reactions under steep physical penalties for error.</p>
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
                <span className="text-white font-bold block">2015 — Early H-Frame & Brushed Acro</span>
                <p className="text-[#A0A0A0] mt-1">Introduction of thick carbon H-frames. Heavy components and low battery cell configurations limited acrobatic throttle range.</p>
              </div>
              <div className="border-l border-[#FF5C00]/30 pl-4 relative">
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[#FF5C00] -left-[6px] top-1" />
                <span className="text-white font-bold block">2017 — True-X and 4S Standardization</span>
                <p className="text-[#A0A0A0] mt-1">Frames transition to pure symmetrical True-X geometries, aligning pitching and rolling inertia. High discharge 4S LiPos become the standard.</p>
              </div>
              <div className="border-l border-[#FF5C00]/30 pl-4 relative">
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[#FF5C00] -left-[6px] top-1" />
                <span className="text-white font-bold block">2019 — The 6S Voltage Revolution</span>
                <p className="text-[#A0A0A0] mt-1">Pilots migrate to 6S high voltage battery cells paired with low-KV motors, drastically reducing sag, cooling electronics, and widening acro envelopes.</p>
              </div>
              <div className="border-l border-[#FF5C00]/30 pl-4 relative">
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[#FF5C00] -left-[6px] top-1" />
                <span className="text-white font-bold block">2021 — Carbon Resonance Analysis</span>
                <p className="text-[#A0A0A0] mt-1">Introduction of harmonic modeling in frame carbon design. Software gyro filtering is optimized, allowing crisp, propwash-free acro tunes.</p>
              </div>
              <div className="border-l border-[#FF5C00]/30 pl-4 relative">
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[#FF5C00] -left-[6px] top-1" />
                <span className="text-white font-bold block">2023 — Clean digital recording integration</span>
                <p className="text-[#A0A0A0] mt-1">Arrival of high-bitrate HD systems capable of 4K stabilized capture directly onboard, removing the absolute dependency on secondary heavy action cams.</p>
              </div>
            </div>
          </div>

          {/* Technical Specs Panel */}
          <div className="border border-[#1A1A1A] bg-[#050810]/40 p-6 rounded-lg">
            <h3 className="text-lg font-black uppercase text-white border-b border-[#1f2937] pb-3 mb-4 tracking-wide flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#FF5C00]" /> Telemetry & Hardware Blueprint
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {freestyleSpecs.map((spec, idx) => (
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
                <span className="text-white font-black block mb-1">MOMENTUM SURFING:</span>
                The 5-inch species has the perfect kinetic mass envelope. Pilots cut the throttle and &quot;throw&quot; the drone, allowing it to surf gravity arcs with highly predictable trajectories.
              </div>
              <div className="p-4 border border-white/[0.02] bg-white/[0.01] rounded">
                <span className="text-white font-black block mb-1">PROPWASH SUSCEPTIBILITY:</span>
                Freestyle drones frequently descend back through their own dynamic thrust wake, creating aerodynamic instability (&quot;propwash&quot;) that requires optimized PID/D-term dampening.
              </div>
              <div className="p-4 border border-white/[0.02] bg-white/[0.01] rounded">
                <span className="text-white font-black block mb-1">AXIS BALANCED INERTIA:</span>
                Aligning mass along the central roll-pitch line creates highly symmetrical rotational physics, ensuring acro snaps (rolls/flips) complete without axial drift.
              </div>
              <div className="p-4 border border-white/[0.02] bg-white/[0.01] rounded">
                <span className="text-white font-black block mb-1">AGGRESSIVE POWER RAILS:</span>
                Fast 2207 stators can draw massive transient current spikes (up to 120A burst), requiring ultra-low ESR capacitors (35V 1000uF) to prevent video static.
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
                <li>Unmatched power-to-weight ratio (up to 12:1 thrust curves).</li>
                <li>Highly durable design with cheap, modular arms.</li>
                <li>Excellent flight control resolution under Betaflight tuning.</li>
                <li>Carries full-sized heavy action cameras effortlessly.</li>
              </ul>
            </div>
            <div className="border border-red-500/20 bg-red-500/[0.02] p-5 rounded-lg text-xs">
              <h4 className="text-red-400 font-bold uppercase mb-2">LIMITATIONS</h4>
              <ul className="space-y-2 list-disc list-inside text-[#b0bfd6]">
                <li>High noise signature, attracting attention in public areas.</li>
                <li>Exposed, dangerous propellers—cannot operate near humans.</li>
                <li>Short overall flight duration (typically 4 to 5 minutes).</li>
                <li>High kinetic damage index in steep high-speed crashes.</li>
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
                <span>1. Evolution of Freestyle FPV: From heavy carbon boxes to advanced, optimized acro structures</span>
                <a href="/academy/roadmap" className="text-[#FF5C00] hover:underline font-bold">Read Article →</a>
              </li>
              <li className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span>2. Why 5-Inch Became the Standard: The golden ratio of disk loading, weight, and momentum</span>
                <a href="/academy/roadmap" className="text-[#FF5C00] hover:underline font-bold">Read Article →</a>
              </li>
              <li className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span>3. Modern Freestyle Build DNA: Framing carbon weave specs, standoffs, and electronics isolation</span>
                <a href="/academy/roadmap" className="text-[#FF5C00] hover:underline font-bold">Read Article →</a>
              </li>
              <li className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span>4. Frame Geometry Analysis: Deconstructing Squashed-X, True-X, and Wide-X axis control</span>
                <a href="/academy/roadmap" className="text-[#FF5C00] hover:underline font-bold">Read Article →</a>
              </li>
              <li className="flex justify-between items-center">
                <span>5. Freestyle Flight DNA: Gravity transitions, momentum arcs, and dynamic propwash tuning</span>
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
                <span className="text-white">Betaflight PID Basics: Understanding P, I, D and Feedforward Tuning</span>
                <a href="/academy/roadmap" className="text-[#FF5C00] hover:underline uppercase font-bold">Open Guide →</a>
              </li>
              <li className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span className="text-white">How to Pick the Best 5-Inch FPV Frame: Stretchy vs Squashed Geometry</span>
                <a href="/academy/roadmap" className="text-[#FF5C00] hover:underline uppercase font-bold">Open Guide →</a>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-white">Capacitor Soldering: Preventing Spikes and Video Noise in 6S Builds</span>
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

