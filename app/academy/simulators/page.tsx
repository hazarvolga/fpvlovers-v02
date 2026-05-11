import React from 'react';
import { CyberBreadcrumb } from '@/components/navigation/Breadcrumb';
import { AdStickySidebar } from '@/components/monetization/NativeAds';
import { AISummaryBox } from '@/components/ui/AISummaryBox';
import { AffiliateCard } from '@/components/monetization/AffiliateCard';
import { MonitorPlay, Trophy, Cpu } from 'lucide-react';

export const metadata = {
  title: 'Simulator Training | FPV LOVERS ACADEMY',
  description: 'Master the sticks before you fly real carbon. AI-recommended simulator hardware and software setups.',
};

async function fetchDataFromDify() {
  // Mock Dify RAG Response
  await new Promise(r => setTimeout(r, 600));
  return {
    summary: "Simulators are the definitive entry point to FPV. Data indicates pilots who spend 40+ hours in Acro mode on VelociDrone or Liftoff face a 75% lower crash rate on their first maiden flight. Avoid Bluetooth controllers; a dedicated radio transmitter via USB is mandatory for muscle memory mapping.",
    topSims: [
      { name: "Liftoff FPV", type: "Software", focus: "Freestyle & Realism", price: "$19.99" },
      { name: "VelociDrone", type: "Software", focus: "Racing & Physics", price: "$22.00" }
    ],
    gear: [
      {
        title: "Radiomaster TX16S MKII",
        description: "The gold standard for EdgeTX/ELRS. Hall effect gimbals offer precise telemetry control.",
        price: "$199.99",
        url: "#",
        image: "https://picsum.photos/seed/sim1/800/600",
        tag: "TOP RADIO CHOICE"
      },
      {
        title: "Radiomaster Pocket",
        description: "Compact, affordable ELRS radio perfect for throwing in a backpack.",
        price: "$64.99",
        url: "#",
        image: "https://picsum.photos/seed/sim2/800/600",
        tag: "BUDGET ENTRY"
      }
    ]
  };
}

export default async function SimulatorsPage() {
  const data = await fetchDataFromDify();
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

          {/* MAIN CONTENT */}
          <div className="space-y-6">
             <div className="flex items-center gap-2 border-b border-[#333333] pb-2">
                <Cpu className="w-5 h-5 text-[#00A8B3]" />
                <h3 className="text-lg font-black uppercase text-[#f8fafc] tracking-widest">Recommended Training Software</h3>
             </div>
             
             <div className="grid sm:grid-cols-2 gap-4 font-mono text-sm">
                {data.topSims.map((sim, i) => (
                   <div key={i} className="bg-black/50 p-4 border border-[#1A1A1A] hex-panel relative group hover:border-[#00F2FF]/50 transition-colors">
                      <div className="text-[10px] text-[#00F2FF] mb-1">{sim.type}</div>
                      <div className="text-white font-bold text-lg mb-2">{sim.name}</div>
                      <div className="text-[#A0A0A0] text-xs mb-4">FOCUS: {sim.focus}</div>
                      <div className="text-[#FF5C00] font-black">{sim.price}</div>
                   </div>
                ))}
             </div>
          </div>

          <div className="space-y-6">
             <div className="flex items-center gap-2 border-b border-[#333333] pb-2 mt-4">
                <Trophy className="w-5 h-5 text-[#FF5C00]" />
                <h3 className="text-lg font-black uppercase text-[#f8fafc] tracking-widest">Required Interface Hardware</h3>
             </div>
             
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
