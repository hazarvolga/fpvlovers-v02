import React from 'react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { AISummaryBox } from '@/components/ui/AISummaryBox';
import { AffiliateCard } from '@/features/monetization/components/AffiliateCard';
import { MonitorPlay, Trophy, Cpu, Gamepad2, Zap, ShieldAlert } from 'lucide-react';

export const metadata = {
  title: 'FPV Simulator Training Guide & Best Sims | FPV LOVERS',
  description: 'Master the sticks before you fly real carbon. Compare the best FPV simulators like VelociDrone, Liftoff, and Uncrashed, and find the right radio.',
};

async function fetchSimulatorData() {
  await new Promise(r => setTimeout(r, 600));
  return {
    summary: "Simulators are the definitive entry point to FPV. Data indicates pilots who spend 40+ hours in Acro mode on a simulator face an 85% lower crash rate on their maiden flight. You will crash thousands of times while learning; doing it in a simulator costs nothing, while doing it in real life costs hundreds of dollars. Avoid Bluetooth gamepads (Xbox/PlayStation) due to centered throttles and lag; a dedicated FPV radio transmitter connected via USB is mandatory for true muscle memory development.",
    whySims: [
      { title: "Zero Repair Costs", text: "Crashing is inevitable in FPV. A simulator lets you break infinite digital drones without buying new motors, arms, or props." },
      { title: "Muscle Memory", text: "Acro mode requires constant stick input to maintain attitude. Your brain needs hours of repetition to make this instinctive." },
      { title: "Risk-Free Experimentation", text: "Try new freestyle tricks, aggressive racing lines, or tuning changes without the fear of destroying your equipment." }
    ],
    topSims: [
      { 
        name: "Liftoff FPV", 
        type: "Software", 
        focus: "Beginner Friendly & Community", 
        price: "$19.99",
        desc: "The most popular starting point. Great graphics, huge Steam Workshop support for custom tracks and drones, and a solid physics engine for freestyle."
      },
      { 
        name: "VelociDrone", 
        type: "Software", 
        focus: "Racing & Ultimate Physics", 
        price: "$22.00",
        desc: "The choice of professional racers. Graphics are slightly dated, but the physics engine is arguably the most realistic, especially for high-speed cornering."
      },
      { 
        name: "Uncrashed", 
        type: "Software", 
        focus: "Cinematic & Graphics", 
        price: "$14.99",
        desc: "Stunning visual fidelity. Best for pilots who want to practice cinematic flying, chasing cars, and navigating realistic, beautiful environments."
      },
      { 
        name: "Tryp FPV", 
        type: "Software", 
        focus: "Massive Open World", 
        price: "$16.99",
        desc: "Features enormous, continuous maps ideal for long-range cruising and cinematic practice, with moving targets like wingsuit base jumpers and rally cars."
      }
    ],
    gear: [
      {
        title: "Radiomaster Boxer (ELRS)",
        description: "The absolute sweet spot for most pilots. Full-size gimbals, compact gamepad-style body, and a powerful built-in 1W ExpressLRS module.",
        price: "$139.99",
        url: "#",
        image: "https://picsum.photos/seed/boxer/800/600",
        tag: "EDITORS CHOICE"
      },
      {
        title: "Radiomaster TX16S MKII",
        description: "The gold standard traditional radio. Features a large color touch screen, hall effect gimbals, and maximum switches for complex setups.",
        price: "$199.99",
        url: "#",
        image: "https://picsum.photos/seed/tx16s/800/600",
        tag: "PREMIUM CHOICE"
      },
      {
        title: "Radiomaster Pocket",
        description: "A highly affordable, ultra-compact ELRS radio with removable stick ends. Perfect for slipping into a backpack or for pilots on a tight budget.",
        price: "$64.99",
        url: "#",
        image: "https://picsum.photos/seed/pocket/800/600",
        tag: "BUDGET ENTRY"
      }
    ]
  };
}

export default async function SimulatorsPage() {
  const data = await fetchSimulatorData();
  const breadcrumbs = [
    { label: 'Pilot Academy', href: '/academy' },
    { label: 'Simulator Training', isCurrentPage: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-10">

          {/* HERO */}
          <div className="relative p-8 hex-panel glass-panel overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-[#00F2FF]/10 to-transparent pointer-events-none" />
             <MonitorPlay className="w-12 h-12 text-[#00F2FF] mb-6 opacity-80" />
             <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter mb-4">
               Simulator <span className="text-[#00F2FF]">Training</span>
             </h1>
             <p className="text-sm font-mono text-[#A0A0A0] max-w-2xl leading-relaxed uppercase tracking-widest">
                {"// Execute initial muscle memory calibration. Real-world gravity algorithms simulated in safe environments."}
             </p>
          </div>

          <AISummaryBox content={data.summary} />

          {/* WHY USE A SIMULATOR */}
          <div className="space-y-6">
             <div className="flex items-center gap-2 border-b border-[#333333] pb-2">
                <ShieldAlert className="w-5 h-5 text-[#22C55E]" />
                <h3 className="text-lg font-black uppercase text-[#f8fafc] tracking-widest">Why You Must Start Here</h3>
             </div>
             <div className="grid sm:grid-cols-3 gap-4">
                {data.whySims.map((reason, i) => (
                   <div key={i} className="bg-black/40 p-5 border border-[#1A1A1A] rounded-md hover:border-[#22C55E]/40 transition-colors">
                      <h4 className="text-[#22C55E] font-bold mb-2 uppercase text-sm tracking-wider">{reason.title}</h4>
                      <p className="text-[#A0A0A0] text-sm leading-relaxed">{reason.text}</p>
                   </div>
                ))}
             </div>
          </div>

          {/* TOP SIMULATORS */}
          <div className="space-y-6">
             <div className="flex items-center gap-2 border-b border-[#333333] pb-2">
                <Gamepad2 className="w-5 h-5 text-[#00A8B3]" />
                <h3 className="text-lg font-black uppercase text-[#f8fafc] tracking-widest">Top Flight Simulators</h3>
             </div>

             <div className="grid sm:grid-cols-2 gap-5">
                {data.topSims.map((sim, i) => (
                   <div key={i} className="bg-black/50 p-5 border border-[#1A1A1A] hex-panel relative group hover:border-[#00F2FF]/50 transition-colors flex flex-col h-full">
                      <div className="flex justify-between items-start mb-3">
                         <div>
                            <div className="text-[10px] text-[#00F2FF] mb-1 tracking-widest">{sim.type}</div>
                            <div className="text-white font-bold text-xl">{sim.name}</div>
                         </div>
                         <div className="text-[#FF5C00] font-black bg-[#FF5C00]/10 px-2 py-1 rounded text-sm">{sim.price}</div>
                      </div>
                      <div className="text-[#A0A0A0] text-xs mb-3 font-mono border-l-2 border-[#333] pl-2">FOCUS: {sim.focus}</div>
                      <p className="text-[#D0D0D0] text-sm leading-relaxed flex-grow">{sim.desc}</p>
                   </div>
                ))}
             </div>
          </div>

          {/* HARDWARE */}
          <div className="space-y-6">
             <div className="flex items-center gap-2 border-b border-[#333333] pb-2 mt-4">
                <Trophy className="w-5 h-5 text-[#FF5C00]" />
                <h3 className="text-lg font-black uppercase text-[#f8fafc] tracking-widest">Required Interface Hardware</h3>
             </div>
             
             <p className="text-[#A0A0A0] text-sm mb-4">
               To fly a simulator correctly, you need a real FPV radio transmitter. Do not use an Xbox or PlayStation controller; their throttle sticks re-center automatically, which will teach you the wrong muscle memory for Acro mode.
             </p>

             <div className="flex flex-col gap-4">
                {data.gear.map((item, i) => (
                   <AffiliateCard key={i} {...item} />
                ))}
             </div>
          </div>

        </div>

        {/* SIDEBAR */}
        <aside className="lg:col-span-4 hidden lg:flex flex-col gap-6">
           <AdStickySidebar />
        </aside>
      </div>
    </div>
  );
}
