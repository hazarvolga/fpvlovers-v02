import React from 'react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { Compass, Settings, Activity, Target, Calendar, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

export const metadata = {
  title: 'Long-Range Species | DRONE ARCHIVE V2',
  description: 'FPV Species Database: 7.0-inch to 10.0-inch Deadcat long-range FPV drones. Li-Ion cell packs, alpine flight physics, ExpressLRS links, and historic evolution.',
};

export default function LongRangePage() {
  const breadcrumbs = [
    { label: 'Drone Archive', href: '/archive' },
    { label: 'Long-Range Cruising', isCurrentPage: true }
  ];

  const longRangeSpecs = [
    { label: 'Wheelbase Size', val: '280mm - 380mm (Deadcat geometry standard)' },
    { label: 'Propeller Size', val: '7.0" - 10.0" (Bi-Blade / Low Pitch for maximum cruise efficiency)' },
    { label: 'Motor Stators', val: '2807 / 2808 / 2507 Brushless' },
    { label: 'Motor KV Range', val: '1100KV - 1350KV (6S) / 1500KV (4S)' },
    { label: 'Battery Spec', val: '6S Li-Ion (3000mAh - 5000mAh Molicel P45B cell configurations)' },
    { label: 'ESC Amp Rating', val: '45A - 55A (Continuous efficiency over short-burst amp peaks)' },
    { label: 'Video System', val: 'DJI O3 Air Unit / Walksnail Avatar / High-Power 1.6W Analog VTX' },
    { label: 'Dry Weight', val: '480g - 650g (AUW ~950g - 1100g with GPS and Li-Ion pack)' },
  ];

  const representativeAircraft = [
    {
      name: 'GEPRC CHIMERA7 PRO V2 (7" Explorer)',
      class: 'Milestone: The Definitive Alpine Surfer',
      desc: 'The benchmark high-altitude, long-endurance FPV platform, engineered specifically to handle high wind currents and mountain descents.',
      designRationale: 'Features custom 6mm rigid arms in a Deadcat layout (keeping prop tips out of HD recording lines), a carbon dual-cage system to shield the GPS, and custom battery strap anchors for heavy Li-Ion packs.',
      impact: 'Established mountain surfing FPV as a mature media industry, acting as the primary film tool for extreme sports filmmakers.'
    },
    {
      name: 'FLYWOO EXPLORER LR 4" (Micro Cruiser)',
      class: 'Milestone: The Sub-250g Endurance Pioneer',
      desc: 'An ultra-lightweight 4-inch cruiser engineered to navigate close distances safely while complying with FAA weight limits.',
      designRationale: 'Uses an ultra-light skinny arm design, a low-draw 1404 power train running on a 4S 18650 Li-Ion cell, and an integrated GPS module with active return-to-home.',
      impact: 'Pioneered sub-250g long-range micro flight, proving that heavy frames were not mandatory for achieving 20+ minute flight times.'
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
             <div className="absolute top-4 right-4 text-[9px] text-[#FF5C00]/40 font-mono tracking-widest uppercase">SYS.LOC: ALPINE_GLIDE // GPS: 14_SATS // RSSI: 95dBm</div>
             <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#FF5C00]/10 z-10" />
             <div className="absolute inset-0 scanline-anim bg-gradient-to-b from-transparent via-[#FF5C00]/10 to-transparent z-10 pointer-events-none" />
             <div className="absolute bottom-8 left-8 z-20">
                <div className="flex items-center gap-2 mb-2">
                   <Compass className="w-5 h-5 text-[#FF5C00]" />
                   <span className="text-[10px] font-black uppercase text-[#FF5C00] tracking-widest">AERODYNAMIC SPECIES: CRUISE EXPLORER</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter shadow-black drop-shadow-xl">
                  Long <span className="text-[#FF5C00]">Range</span>
                </h1>
             </div>
          </div>

          {/* Species Introductory Block */}
          <div className="glass-panel p-6 border-l-2 border-[#FF5C00] bg-[#FF5C00]/5 text-xs text-[#b0bfd6] leading-relaxed rounded-md">
            {"// AERODYNAMIC SPECIES TAXONOMY: 7.0-inch to 10.0-inch deadcat long-range FPV systems. Engineered specifically to navigate alpine peaks, survive strong dynamic wind gusts, and cruising for extended envelopes (20-30m). Symmetrical deadcat layout isolates camera lines from propeller blades."}
          </div>

          {/* Mission Profile Section */}
          <div className="border border-[#1A1A1A] bg-[#050810]/40 p-6 rounded-lg">
            <h3 className="text-lg font-black uppercase text-white border-b border-[#1f2937] pb-3 mb-4 tracking-wide flex items-center gap-2">
              <Target className="w-4 h-4 text-[#FF5C00]" /> Mission Profile Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
              <div>
                <span className="text-[#FF5C00] font-black uppercase block mb-1">MISSION PURPOSE:</span>
                <p className="text-[#b0bfd6]">Extending dynamic range envelopes, high-altitude mountain peak surfing, stable alpine exploration, and maximum low-frequency RF penetration.</p>
              </div>
              <div>
                <span className="text-[#FF5C00] font-black uppercase block mb-1">TYPICAL OBJECTIVES:</span>
                <p className="text-[#b0bfd6]">Ridge-line surfing, low-altitude sweeping cruisers, alpine gap dives, long-distance signal testing, and exploration mapping.</p>
              </div>
              <div>
                <span className="text-[#FF5C00] font-black uppercase block mb-1">TYPICAL ENVIRONMENT:</span>
                <p className="text-[#b0bfd6]">Mountain ranges, open valleys, remote forest ranges, deep canyons, and coastal cliffs where retrieval is physically difficult.</p>
              </div>
              <div>
                <span className="text-[#FF5C00] font-black uppercase block mb-1">PILOTING DIFFICULTY:</span>
                <p className="text-[#FF5C00] font-black">**Advanced**. Requires extensive knowledge of RF physics, battery chemistry constraints under freezing temperatures, and active safety emergency procedures (GPS rescue).</p>
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
                <span className="text-white font-bold block">2015 — Heavy 10-inch analog frames</span>
                <p className="text-[#A0A0A0] mt-1">Early long range was limited to massive, heavy 10-inch frames running high-vibration power configurations, causing major RF sync static.</p>
              </div>
              <div className="border-l border-[#FF5C00]/30 pl-4 relative">
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[#FF5C00] -left-[6px] top-1" />
                <span className="text-white font-bold block">2018 — Symmetrical Deadcat geometry standard</span>
                <p className="text-[#A0A0A0] mt-1">Introduction of carbon configurations where the front arms are swept wider to keep high-pitch prop blades out of raw video feeds.</p>
              </div>
              <div className="border-l border-[#FF5C00]/30 pl-4 relative">
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[#FF5C00] -left-[6px] top-1" />
                <span className="text-white font-bold block">2020 — ExpressLRS 915MHz link stability</span>
                <p className="text-[#A0A0A0] mt-1">Introduction of open-source ExpressLRS, standardizing sub-GHz low-frequency long-penetration signals that extend ranges up to 20km+.</p>
              </div>
              <div className="border-l border-[#FF5C00]/30 pl-4 relative">
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[#FF5C00] -left-[6px] top-1" />
                <span className="text-white font-bold block">2022 — The Lithium-Ion (Li-Ion) Revolution</span>
                <p className="text-[#A0A0A0] mt-1">Migration from LiPo cell chemistry to high energy density Li-Ion (Molicel P45B), unlocking 30+ minutes of continuous cruising flight times.</p>
              </div>
              <div className="border-l border-[#FF5C00]/30 pl-4 relative">
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[#FF5C00] -left-[6px] top-1" />
                <span className="text-white font-bold block">2024 — High-power digital penetration (DJI O3/O4)</span>
                <p className="text-[#A0A0A0] mt-1">Standardization of high-bitrate digital links that maintain clean HD feeds through deep mountain ridges, raising commercial safety safety metrics.</p>
              </div>
            </div>
          </div>

          {/* Technical Specs Panel */}
          <div className="border border-[#1A1A1A] bg-[#050810]/40 p-6 rounded-lg">
            <h3 className="text-lg font-black uppercase text-white border-b border-[#1f2937] pb-3 mb-4 tracking-wide flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#FF5C00]" /> Telemetry & Hardware Blueprint
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {longRangeSpecs.map((spec, idx) => (
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
                <span className="text-white font-black block mb-1">HIGH ENDURANCE CRUISE:</span>
                Li-Ion cell chemistry maintains a highly steady voltage drop, allowing slow-speed, low-current cruises for extended durations (up to 30 minutes).
              </div>
              <div className="p-4 border border-white/[0.02] bg-white/[0.01] rounded">
                <span className="text-white font-black block mb-1">INERTIAL CRUISING:</span>
                Heavy dynamic weights (AUW ~1000g) mean long-range drones carry massive momentum, yielding highly predictable trajectories but slow acrobatic pitch/roll snap recovery.
              </div>
              <div className="p-4 border border-white/[0.02] bg-white/[0.01] rounded">
                <span className="text-white font-black block mb-1">GPS RESCUE PROTOCOLS:</span>
                Relies on an onboard GPS/Compass module to track location, enabling automatic fail-safe return-to-home procedures during radio signal loss behind mountain ridges.
              </div>
              <div className="p-4 border border-white/[0.02] bg-white/[0.01] rounded">
                <span className="text-white font-black block mb-1">LOW-FREQUENCY RF PATHS:</span>
                Utilizes sub-GHz frequencies (868/915MHz) for telemetry links, prioritizing massive signal wave penetration over high frame rate latency.
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
                <li>Exceptional flight durations exceeding 25+ minutes.</li>
                <li>Highly predictable, smooth cruise profiles ideal for landscape video.</li>
                <li>Robust active safety fallbacks (Betaflight GPS Rescue).</li>
                <li>Extended range capacity carrying signals past 15km line of sight.</li>
              </ul>
            </div>
            <div className="border border-red-500/20 bg-red-500/[0.02] p-5 rounded-lg text-xs">
              <h4 className="text-red-400 font-bold uppercase mb-2">LIMITATIONS</h4>
              <ul className="space-y-2 list-disc list-inside text-[#b0bfd6]">
                <li>Extremely sluggish acro response—high risk of crashing during tricks.</li>
                <li>Li-Ion cells have low amp draw limits (cannot handle high bursts).</li>
                <li>Heavy recovery penalties if a drone goes down in remote areas.</li>
                <li>High cost of premium telemetry components and GPS compass stacks.</li>
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
                <span>1. Evolution of Long Range FPV: From heavy analog boxes to carbon peak surfers</span>
                <a href="/academy/roadmap" className="text-[#FF5C00] hover:underline font-bold">Read Article →</a>
              </li>
              <li className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span>2. Li-Ion Revolution: How Samsung and Molicel cell chemistry unlocked 30-minute cruise lines</span>
                <a href="/academy/roadmap" className="text-[#FF5C00] hover:underline font-bold">Read Article →</a>
              </li>
              <li className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span>3. GPS Rescue & Navigation: Safe return-to-home setups, compass alignments, and emergency bounds</span>
                <a href="/academy/roadmap" className="text-[#FF5C00] hover:underline font-bold">Read Article →</a>
              </li>
              <li className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span>4. Mountain Surfing Culture: Analyzing dynamic alpine wind shears, thermals, and safety bounds</span>
                <a href="/academy/roadmap" className="text-[#FF5C00] hover:underline font-bold">Read Article →</a>
              </li>
              <li className="flex justify-between items-center">
                <span>5. Long Range Build DNA: Deciphering 7-inch Deadcat spacing, sub-GHz ELRS, and directional patch feeds</span>
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
                <span className="text-white">GPS Rescue setup in Betaflight: Safe recovery and automatic return-to-home procedures</span>
                <a href="/academy/roadmap" className="text-[#FF5C00] hover:underline uppercase font-bold">Open Guide →</a>
              </li>
              <li className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span className="text-white">Long Range FPV Basics: Managing RF penetration, battery chemistry, and high-gain antenna selection</span>
                <a href="/academy/roadmap" className="text-[#FF5C00] hover:underline uppercase font-bold">Open Guide →</a>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-white">Antenna polarization: LHCP vs RHCP: Choosing the correct circular polarization for long-range link stability</span>
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
