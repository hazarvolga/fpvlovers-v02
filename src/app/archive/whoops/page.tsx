import React from 'react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { Cpu, ShieldCheck, Target, Activity, Settings, Info, Calendar, User, Zap } from 'lucide-react';
import Image from 'next/image';

export const metadata = {
  title: 'Whoops Species | DRONE ARCHIVE V2',
  description: 'FPV Species Database: 65mm-75mm micro ducted aircraft. Historic evolution, BT2.0 power delivery, brushless micro stators, and indoor flight telemetry.'
};

export default function WhoopsPage() {
  const breadcrumbs = [
    { label: 'Drone Archive', href: '/archive' },
    { label: 'Whoops & Micro', isCurrentPage: true }
  ];

  const whoopSpecs = [
    { label: 'Wheelbase Size', val: '65mm - 75mm (Motor-to-motor diagonal)' },
    { label: 'Propeller Size', val: '31mm - 40mm (1.2" - 1.6" Ducted Polycarbonate)' },
    { label: 'Motor Stators', val: '0702 / 0802 Brushless' },
    { label: 'Motor KV Range', val: '19,000KV - 28,000KV (Optimized for 1S voltage curves)' },
    { label: 'Battery Spec', val: '1S LiHV (300mAh - 450mAh)' },
    { label: 'Power Connector', val: 'BT2.0 / A30 (Solid pin high-current connectors)' },
    { label: 'Video System', val: 'Analog / HDZero / Walksnail (Sub-2g lightweight 1S VTX)' },
    { label: 'Dry Weight', val: '17g - 35g (Extremely low inertia)' },
  ];

  const representativeAircraft = [
    {
      name: 'BETAFPV METEOR65 AIR (65mm Spec)',
      class: 'Milestone: The Ultra-Light Weight Benchmark',
      desc: 'Redefined micro weight envelopes by reducing dry weight to 17.5g, optimizing throttle resolution and indoor agility.',
      designRationale: 'Uses an integrated single-piece ultra-light canopy, 0702 27000KV motors, and a thin-wall flexible frame structure to absorb direct impact without cracking.',
      impact: 'Set the current industry standard for sub-20g indoor spec class racing.'
    },
    {
      name: 'HAPPYMODEL MOBULA6 (65mm Brushless)',
      class: 'Milestone: The Brushless Micro Pioneer',
      desc: 'The seminal platform that proved brushless motors could entirely replace brushed toy-grade cores in micro frames.',
      designRationale: 'Integrated a highly robust Crazybee F4 AIO board with on-board receiver and ESC, matching 0802 motors for raw acro throttle authority.',
      impact: 'Ended the brushed micro era, standardizing high-power brushless indoor acro.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 text-[#f8fafc] font-mono">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Content Area */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Header Billboard */}
          <div className="relative h-64 md:h-80 w-full overflow-hidden hex-panel border border-[#00F2FF]/30 shadow-[0_0_50px_rgba(0,242,255,0.1)] rounded-lg">
            <Image
              src="https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=1200&auto=format&fit=crop&q=70"
              alt="Whoops & Micro FPV Drone"
              fill
              className="object-cover opacity-30 mix-blend-screen grayscale"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050810] via-transparent to-[#00F2FF]/5 z-10" />
            <div className="absolute inset-0 scanline-anim bg-gradient-to-b from-transparent via-[#00F2FF]/5 to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-8 left-8 z-20">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-5 h-5 text-[#00F2FF]" />
                <span className="text-[10px] font-black uppercase text-[#00F2FF] tracking-widest">AERODYNAMIC SPECIES: DUCTED MICRO</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter shadow-black drop-shadow-xl">
                Tiny <span className="text-[#00F2FF]">Whoops</span>
              </h1>
            </div>
          </div>

          {/* Species Introductory Block */}
          <div className="glass-panel p-6 border-l-2 border-[#00F2FF] bg-[#00F2FF]/5 text-xs text-[#b0bfd6] leading-relaxed rounded-md">
            {"// AERODYNAMIC SPECIES TAXONOMY: 65mm-75mm micro ducted aircraft. Designed not as consumer toys, but as high-repetition training platforms to build sub-conscious flight control. Outfitted with full-protection ducted rings, Whoops navigate highly dense indoor spaces safely, eliminating the risk of damage while training."}
          </div>

          {/* Mission Profile Section */}
          <div className="border border-[#1A1A1A] bg-[#050810]/40 p-6 rounded-lg">
            <h3 className="text-lg font-black uppercase text-white border-b border-[#1f2937] pb-3 mb-4 tracking-wide flex items-center gap-2">
              <Target className="w-4 h-4 text-[#00F2FF]" /> Mission Profile Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
              <div>
                <span className="text-[#00F2FF] font-black uppercase block mb-1">MISSION PURPOSE:</span>
                <p className="text-[#b0bfd6]">High-repetition indoor training, close-proximity navigation, and flight control refinement under low physical risk envelopes.</p>
              </div>
              <div>
                <span className="text-[#00F2FF] font-black uppercase block mb-1">TYPICAL OBJECTIVES:</span>
                <p className="text-[#b0bfd6]">Proximity gate navigation, office track laps, and indoor freestyle loops using low-inertia momentum recovery.</p>
              </div>
              <div>
                <span className="text-[#00F2FF] font-black uppercase block mb-1">TYPICAL ENVIRONMENT:</span>
                <p className="text-[#b0bfd6]">Living rooms, indoor garages, closed halls, offices, and tight proximity environments where outdoor aircraft cannot operate.</p>
              </div>
              <div>
                <span className="text-[#00F2FF] font-black uppercase block mb-1">PILOTING DIFFICULTY:</span>
                <p className="text-[#b0bfd6]">**Beginner Friendly** due to low overall crash damage, yet extremely rewarding for **Advanced Racers** pushing lap limits.</p>
              </div>
            </div>
          </div>

          {/* Evolution Timeline */}
          <div className="border border-[#1A1A1A] bg-[#050810]/40 p-6 rounded-lg">
            <h3 className="text-lg font-black uppercase text-white border-b border-[#1f2937] pb-3 mb-4 tracking-wide flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#00F2FF]" /> Evolution Timeline
            </h3>
            <div className="space-y-4 text-xs">
              <div className="border-l border-[#00F2FF]/30 pl-4 relative">
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[#00F2FF] -left-[6px] top-1" />
                <span className="text-white font-bold block">2014 — The Toy Era (Horizon Inductrix)</span>
                <p className="text-[#A0A0A0] mt-1">Brushed motors, heavy plastic frames, and toy transmitters. Pilots began harvesting the flight controller to build early indoor micro setups.</p>
              </div>
              <div className="border-l border-[#00F2FF]/30 pl-4 relative">
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[#00F2FF] -left-[6px] top-1" />
                <span className="text-white font-bold block">2017 — The Brushless Shift</span>
                <p className="text-[#A0A0A0] mt-1">Introduction of brushless outrunner motors (0802) replacing friction-prone brushed cores. Flight times and throttle agility doubled.</p>
              </div>
              <div className="border-l border-[#00F2FF]/30 pl-4 relative">
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[#00F2FF] -left-[6px] top-1" />
                <span className="text-white font-bold block">2019 — Crazybee & AIO Stacks</span>
                <p className="text-[#A0A0A0] mt-1">All-in-One (AIO) flight controllers integrate the receiver, ESCs, OSD, and FC onto a single lightweight board, cutting total micro weight by 40%.</p>
              </div>
              <div className="border-l border-[#00F2FF]/30 pl-4 relative">
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[#00F2FF] -left-[6px] top-1" />
                <span className="text-white font-bold block">2021 — Solid Pin connectors (BT2.0)</span>
                <p className="text-[#A0A0A0] mt-1">The transition from lossy PH2.0 folded-pin plugs to solid-pin BT2.0/A30, preventing voltage drops and solving early throttle-sag limits.</p>
              </div>
              <div className="border-l border-[#00F2FF]/30 pl-4 relative">
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[#00F2FF] -left-[6px] top-1" />
                <span className="text-white font-bold block">2023 — Micro Digital HD feeds</span>
                <p className="text-[#A0A0A0] mt-1">Arrival of ultra-lightweight (1.8g) digital VTX modules from HDZero and Walksnail, delivering HD static feeds under 20g weights.</p>
              </div>
            </div>
          </div>

          {/* Technical Specs Panel */}
          <div className="border border-[#1A1A1A] bg-[#050810]/40 p-6 rounded-lg">
            <h3 className="text-lg font-black uppercase text-white border-b border-[#1f2937] pb-3 mb-4 tracking-wide flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#00F2FF]" /> Telemetry & Hardware Blueprint
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {whoopSpecs.map((spec, idx) => (
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
              <Activity className="w-4 h-4 text-[#00F2FF]" /> Flight DNA
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-[#b0bfd6]">
              <div className="p-4 border border-white/[0.02] bg-white/[0.01] rounded">
                <span className="text-white font-black block mb-1">FORGIVING PHYSICS:</span>
                Under 30g total weight means crashes carry virtually zero kinetic damage. A pilot can crash, trigger turtle-mode (flip-over-after-crash), and resume flight immediately.
              </div>
              <div className="p-4 border border-white/[0.02] bg-white/[0.01] rounded">
                <span className="text-white font-black block mb-1">DUCT BOUNDARY EFFECTS:</span>
                Propeller ducts create a clean cylinder of airflow, maximizing low-end thrust efficiency while protecting the blades from hitting objects.
              </div>
              <div className="p-4 border border-white/[0.02] bg-white/[0.01] rounded">
                <span className="text-white font-black block mb-1">LOW-INERTIA RECOVERY:</span>
                The lack of mass means whoops change directions instantly, but lose speed quickly when the throttle is cut, requiring active throttle control to surf corners.
              </div>
              <div className="p-4 border border-white/[0.02] bg-white/[0.01] rounded">
                <span className="text-white font-black block mb-1">1S VOLTAGE MANAGEMENT:</span>
                Squeezing high currents from 4.35V LiHV cells requires aggressive battery maintenance and clean connectors to avoid sag mid-acro.
              </div>
            </div>
          </div>

          {/* Seminal Aircraft Archetypes */}
          <div className="space-y-6">
            <h3 className="text-lg font-black uppercase text-white border-b border-[#1f2937] pb-3 tracking-wide flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00F2FF]" /> Seminal Reference Aircraft
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {representativeAircraft.map((build, idx) => (
                <div key={idx} className="p-5 border border-[#1f2937] bg-[#050810]/30 hover:border-[#00F2FF]/40 transition-colors duration-200 rounded-lg flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-[#00F2FF] font-black uppercase tracking-wider">{build.class}</span>
                    <h4 className="text-base font-black text-white uppercase mt-1 mb-2">{build.name}</h4>
                    <p className="text-xs text-[#8d8981] leading-relaxed mb-3">{build.desc}</p>
                    
                    <div className="space-y-2 border-t border-white/[0.04] pt-3 text-[11px]">
                      <div>
                        <span className="text-[#8d8981] uppercase font-semibold">DESIGN CHOICE:</span>
                        <p className="text-white mt-0.5 leading-relaxed">{build.designRationale}</p>
                      </div>
                      <div className="mt-2">
                        <span className="text-[#00F2FF] uppercase font-semibold">HISTORICAL IMPACT:</span>
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
                <li>Zero physical danger flying around humans/interiors.</li>
                <li>Highly durable frames that absorb high-speed wall crashes.</li>
                <li>Ultra low cost of batteries and spare frames.</li>
                <li>Turtle mode allows instant recovery without picking up.</li>
              </ul>
            </div>
            <div className="border border-red-500/20 bg-red-500/[0.02] p-5 rounded-lg text-xs">
              <h4 className="text-red-400 font-bold uppercase mb-2">LIMITATIONS</h4>
              <ul className="space-y-2 list-disc list-inside text-[#b0bfd6]">
                <li>Highly sensitive to outdoor winds (cannot fly over 10km/h).</li>
                <li>Extremely short flight times (usually 3 to 4 minutes).</li>
                <li>High battery degradation rate due to high draw on 1S cells.</li>
                <li>Very low payload limits (cannot carry action cameras).</li>
              </ul>
            </div>
          </div>

          {/* Required Articles & Knowledge base */}
          <div className="border border-[#1f2937] bg-[#050810]/20 p-6 rounded-lg">
            <h3 className="text-lg font-black uppercase text-white border-b border-[#1f2937] pb-3 mb-4 tracking-wide flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00F2FF]" /> Core Species Knowledge Database
            </h3>
            <ul className="space-y-3 text-xs text-[#b0bfd6]">
              <li className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span>1. Evolution of Tiny Whoops: From toy toy-grade brushed Inductrix to brushless micro racers</span>
                <a href="/academy/roadmap" className="text-[#00F2FF] hover:underline font-bold">Read Article →</a>
              </li>
              <li className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span>2. Why Tiny Whoops Create Better Pilots: The physics of high-repetition muscle memory</span>
                <a href="/academy/roadmap" className="text-[#00F2FF] hover:underline font-bold">Read Article →</a>
              </li>
              <li className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span>3. Indoor Flight Fundamentals: Managing indoor ground effects and dynamic throttle curves</span>
                <a href="/academy/roadmap" className="text-[#00F2FF] hover:underline font-bold">Read Article →</a>
              </li>
              <li className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span>4. Whoop Build DNA: Selecting 0702 motors, solid connectors, and thin-wall frame materials</span>
                <a href="/academy/roadmap" className="text-[#00F2FF] hover:underline font-bold">Read Article →</a>
              </li>
              <li className="flex justify-between items-center">
                <span>5. The Rise of Brushless Whoops: The AIO Crazybee integration that ended the brushed era</span>
                <a href="/engineering/workshop" className="text-[#00F2FF] hover:underline font-bold">Read Article →</a>
              </li>
            </ul>
          </div>

          {/* Related Reference Academy Guides */}
          <div className="border border-[#1f2937] bg-[#050810]/20 p-6 rounded-lg">
            <h3 className="text-lg font-black uppercase text-white border-b border-[#1f2937] pb-3 mb-4 tracking-wide flex items-center gap-2">
              <Target className="w-4 h-4 text-[#00F2FF]" /> Related Reference Academy Guides
            </h3>
            <ul className="space-y-3 text-xs">
              <li className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span className="text-white">How to Bind Your Tiny Whoop: ELRS Flashing & Binding Passphrase</span>
                <a href="/academy/roadmap" className="text-[#00F2FF] hover:underline uppercase font-bold">Open Guide →</a>
              </li>
              <li className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span className="text-white">1S LiPo Battery Charging & Storage: BT2.0 Voltage Safety</span>
                <a href="/regulations/battery" className="text-[#00F2FF] hover:underline uppercase font-bold">Open Guide →</a>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-white">Soldering Tiny Pads on 1S AIO Boards: Temperature & Flow Rules</span>
                <a href="/engineering/workshop" className="text-[#00F2FF] hover:underline uppercase font-bold">Open Guide →</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 hidden lg:flex flex-col gap-6">
          <AdStickySidebar />
        </aside>
      </div>
    </div>
  );
}


