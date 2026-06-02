import React from 'react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { Video, Settings, Activity, Target, Calendar, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

export const metadata = {
  title: 'Cinematic Species | DRONE ARCHIVE V2',
  description: 'FPV Species Database: 2.5-inch to 3.5-inch ducted cinematic camera platforms. Interior real estate flights, Gyroflow stabilization, pusher configurations, and historic evolution.',
};

export default function CinematicPage() {
  const breadcrumbs = [
    { label: 'Drone Archive', href: '/archive' },
    { label: 'Cinematic Operator', isCurrentPage: true }
  ];

  const cinematicSpecs = [
    { label: 'Wheelbase Size', val: '120mm - 150mm (CineWhoop standard)' },
    { label: 'Propeller Size', val: '2.5" - 3.5" (Fully ducted / prop-guarded Polycarbonate)' },
    { label: 'Motor Stators', val: '1404 / 2004 / 2105.5 Brushless' },
    { label: 'Motor KV Range', val: '2600KV - 3000KV (6S) / 3800KV - 4500KV (4S)' },
    { label: 'Battery Spec', val: '4S / 6S LiPo (650mAh - 1300mAh high capacity)' },
    { label: 'ESC Amp Rating', val: '35A - 45A AIO or 4-in-1 Stack' },
    { label: 'Video System', val: 'DJI O3 Air Unit / Walksnail Avatar (HD video, direct 4K recording)' },
    { label: 'Dry Weight', val: '150g - 250g (AUW ~380g - 480g with Action Cam)' },
  ];

  const representativeAircraft = [
    {
      name: 'DJI AVATA 2 (Integrated Cinewhoop)',
      class: 'Milestone: The Commercial Safety Standard',
      desc: 'An all-in-one consumer/commercial cinewhoop that integrated advanced optical flow sensing, automatic return-to-home, and prop guard shells.',
      designRationale: 'Uses a highly optimized dynamic plastic guard casing, integrated dynamic exposure cam, and a custom battery management rails to simplify commercial film set workflows.',
      impact: 'Redefined close-proximity filming on commercial movie sets, proving FPV could operate safely around cast members.'
    },
    {
      name: 'GEPRC CINELOG35 V2 (3.5" Pusher Spec)',
      class: 'Milestone: The Heavy Camera Lifter Benchmark',
      desc: 'The definitive open-source professional cinewhoop, utilizing a high-efficiency inverted (pusher) motor configuration.',
      designRationale: 'Features pusher-prop design pulling clean air from above, specialized soft TPU dampening rings to isolate camera gyro noise, and a carbon top-plate capable of carrying heavy GoPros.',
      impact: 'Standardized the 3.5-inch class as the ultimate indoor/outdoor dynamic real estate walkthrough tool.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 text-[#f8fafc] font-mono">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-8">

          {/* Header Billboard */}
          <div className="relative h-64 md:h-80 w-full overflow-hidden hex-panel border border-[#00F2FF]/30 shadow-[0_0_50px_rgba(0,242,255,0.1)] rounded-lg">
             <Image
                src="https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1200&auto=format&fit=crop&q=70"
                alt="Cinewhoop Drone"
                fill
                className="object-cover opacity-30 mix-blend-screen grayscale"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#00F2FF]/5 z-10" />
             <div className="absolute inset-0 scanline-anim bg-gradient-to-b from-transparent via-[#00F2FF]/5 to-transparent z-10 pointer-events-none" />
             <div className="absolute bottom-8 left-8 z-20">
                <div className="flex items-center gap-2 mb-2">
                   <Video className="w-5 h-5 text-[#00F2FF]" />
                   <span className="text-[10px] font-black uppercase text-[#00F2FF] tracking-widest">AERODYNAMIC SPECIES: DUCTED CAMERA SHIP</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter shadow-black drop-shadow-xl">
                  Cinematic <span className="text-[#00F2FF]">Operator</span>
                </h1>
             </div>
          </div>

          {/* Species Introductory Block */}
          <div className="glass-panel p-6 border-l-2 border-[#00F2FF] bg-[#00F2FF]/5 text-xs text-[#b0bfd6] leading-relaxed rounded-md">
            {"// AERODYNAMIC SPECIES TAXONOMY: 2.5-inch to 3.5-inch ducted CineWhoop platforms. Engineered specifically to carry high-resolution camera payloads closely around human subjects and fragile interior architecture. Standardized prop guards protect surroundings while the inverted motor geometry isolates camera feed from turbulence."}
          </div>

          {/* Mission Profile Section */}
          <div className="border border-[#1A1A1A] bg-[#050810]/40 p-6 rounded-lg">
            <h3 className="text-lg font-black uppercase text-white border-b border-[#1f2937] pb-3 mb-4 tracking-wide flex items-center gap-2">
              <Target className="w-4 h-4 text-[#00F2FF]" /> Mission Profile Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
              <div>
                <span className="text-[#00F2FF] font-black uppercase block mb-1">MISSION PURPOSE:</span>
                <p className="text-[#b0bfd6]">Smooth, dynamic close-quarters aerial cinematography, interior real estate walkthrough cruises, and professional advertising capture.</p>
              </div>
              <div>
                <span className="text-[#00F2FF] font-black uppercase block mb-1">TYPICAL OBJECTIVES:</span>
                <p className="text-[#b0bfd6]">Interior fly-throughs, close human orbits, low-speed tracking shots, dynamic architectural reveals, and cinematic storytelling.</p>
              </div>
              <div>
                <span className="text-[#00F2FF] font-black uppercase block mb-1">TYPICAL ENVIRONMENT:</span>
                <p className="text-[#b0bfd6]">Real estate interiors, active commercial film sets, crowded indoor spaces, dynamic outdoor tracking lanes, and narrow proximity valleys.</p>
              </div>
              <div>
                <span className="text-[#00F2FF] font-black uppercase block mb-1">PILOTING DIFFICULTY:</span>
                <p className="text-[#00F2FF] font-black">**Beginner to Intermediate** due to robust duct protection, yet **Advanced** camera control and smooth path planning are required for high-end gigs.</p>
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
                <span className="text-white font-bold block">2016 — The Early PVC duct hacks</span>
                <p className="text-[#A0A0A0] mt-1">Pilots hacked toy guards and 3D printed bulky heavy shells to protect blades, severely limiting lift capability.</p>
              </div>
              <div className="border-l border-[#00F2FF]/30 pl-4 relative">
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[#00F2FF] -left-[6px] top-1" />
                <span className="text-white font-bold block">2018 — Shendrones Squirt & 3-Inch Ducts</span>
                <p className="text-[#A0A0A0] mt-1">The Shendrones Squirt emerged as the first custom carbon cinewhoop, utilizing 3D-printed duct profiles to lift full-size GoPros.</p>
              </div>
              <div className="border-l border-[#00F2FF]/30 pl-4 relative">
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[#00F2FF] -left-[6px] top-1" />
                <span className="text-white font-bold block">2020 — AIO boards & Pusher Geometry</span>
                <p className="text-[#A0A0A0] mt-1">Motors are inverted (pusher style) to draw clean, non-turbulent air. Total chassis weight drops with advanced compact AIO ESC boards.</p>
              </div>
              <div className="border-l border-[#00F2FF]/30 pl-4 relative">
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[#00F2FF] -left-[6px] top-1" />
                <span className="text-white font-bold block">2022 — The DJI O3 Air Unit integration</span>
                <p className="text-[#A0A0A0] mt-1">Standardization of integrated 4K/60fps onboard camera modules, removing the need for a secondary heavy GoPro, cutting AUW by 120g.</p>
              </div>
              <div className="border-l border-[#00F2FF]/30 pl-4 relative">
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[#00F2FF] -left-[6px] top-1" />
                <span className="text-white font-bold block">2024 — Closed Prop Commercial Safety Certifications</span>
                <p className="text-[#A0A0A0] mt-1">Advanced dynamic plastic composites and flow design standardize whoops on commercial sets under explicit liability regulations.</p>
              </div>
            </div>
          </div>

          {/* Technical Specs Panel */}
          <div className="border border-[#1A1A1A] bg-[#050810]/40 p-6 rounded-lg">
            <h3 className="text-lg font-black uppercase text-white border-b border-[#1f2937] pb-3 mb-4 tracking-wide flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#00F2FF]" /> Telemetry & Hardware Blueprint
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cinematicSpecs.map((spec, idx) => (
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
                <span className="text-white font-black block mb-1">DAMPED STABILITY:</span>
                Cinematic tuning prioritizes stable, locked-in flight. Angular snap velocities are highly dampened to prevent jerky camera movements, yielding smooth sweeps.
              </div>
              <div className="p-4 border border-white/[0.02] bg-white/[0.01] rounded">
                <span className="text-white font-black block mb-1">HIGH DISK LOADING:</span>
                Carrying heavy camera payloads on small 3-inch props creates massive air loading, leading to high throttle requirements and high battery draw rates.
              </div>
              <div className="p-4 border border-white/[0.02] bg-white/[0.01] rounded">
                <span className="text-white font-black block mb-1">DUCT TURBULENCE:</span>
                Propeller ducts restrict airflow during horizontal drift, making cinewhoops highly sensitive to outdoor winds, which cause roll-axis wobbles.
              </div>
              <div className="p-4 border border-white/[0.02] bg-white/[0.01] rounded">
                <span className="text-white font-black block mb-1">STABILIZATION INTEGRATION:</span>
                Relies on logging raw gyroscope IMU data to post-process video through algorithms like Gyroflow, aligning visual frame lines.
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
                <li>Maximum physical safety operating near humans and property.</li>
                <li>Pusher design allows unobstructed camera views.</li>
                <li>Butter-smooth tracking paths with digital post-stabilization.</li>
                <li>Extremely compact footprint for narrow window fly-throughs.</li>
              </ul>
            </div>
            <div className="border border-red-500/20 bg-red-500/[0.02] p-5 rounded-lg text-xs">
              <h4 className="text-red-400 font-bold uppercase mb-2">LIMITATIONS</h4>
              <ul className="space-y-2 list-disc list-inside text-[#b0bfd6]">
                <li>Very low aerodynamic efficiency, draining batteries in ~4 min.</li>
                <li>Highly sensitive to outdoor crosswinds due to duct surface area.</li>
                <li>Audible high-pitched hum signature on set.</li>
                <li>Sluggish acro response compared to open-prop 5-inch frames.</li>
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
                <span>1. Evolution of Cinewhoops: From heavy PVC custom hacks to carbon pusher designs</span>
                <a href="/academy/roadmap" className="text-[#00F2FF] hover:underline font-bold">Read Article →</a>
              </li>
              <li className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span>2. Real Estate FPV Operations: Indoor navigation, dynamic light handling, and room-framing</span>
                <a href="/academy/roadmap" className="text-[#00F2FF] hover:underline font-bold">Read Article →</a>
              </li>
              <li className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span>3. Travel & Adventure Cinematic Flying: Luggage limits, custom packaging, and field assembly</span>
                <a href="/academy/roadmap" className="text-[#00F2FF] hover:underline font-bold">Read Article →</a>
              </li>
              <li className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span>4. Smoothness vs Agility: Tuning filter delays and dynamic D-term parameters for stability</span>
                <a href="/academy/roadmap" className="text-[#00F2FF] hover:underline font-bold">Read Article →</a>
              </li>
              <li className="flex justify-between items-center">
                <span>5. Cinematic Build DNA: Deciphering TPU guard dampening, prop clearance, and pusher motors</span>
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
                <span className="text-white">Smooth FPV Camera Settings: Gutter/Angle Ratios for Indoor Cruises</span>
                <a href="/academy/roadmap" className="text-[#00F2FF] hover:underline uppercase font-bold">Open Guide →</a>
              </li>
              <li className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span className="text-white">Gyroflow stabilization Tutorial: Achieving Butter-Smooth 4K Outputs</span>
                <a href="/academy/roadmap" className="text-[#00F2FF] hover:underline uppercase font-bold">Open Guide →</a>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-white">Soldering Tiny VTX Wires on 20x20 Stack: Heat dissipation Rules</span>
                <a href="/engineering/workshop" className="text-[#00F2FF] hover:underline uppercase font-bold">Open Guide →</a>
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

