import React from 'react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { AISummaryBox } from '@/components/ui/AISummaryBox';
import { AffiliateCard } from '@/features/monetization/components/AffiliateCard';
import { Zap, PackagePlus, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'Starter Kits & Bundles | FPV LOVERS ACADEMY',
  description: 'Whoops, RTF bundles, and your first gear. AI-curated FPV starter kits that bypass complex soldering requirements.',
};

async function fetchDataFromDify() {
  await new Promise(r => setTimeout(r, 600));
  return {
    summary: "For pilots uninitiated in PCB soldering and firmware flashing, Ready-To-Fly (RTF) kits offer immediate airspace access. Current AI models strongly recommend starting with a TinyWhoop class (65mm-75mm) due to low kinetic energy limits and high indoor durability. Avoid cheap analog goggles if your budget permits transitioning to digital later.",
    kits: [
      {
        title: "BetaFPV Cetus Pro Brushless Kit",
        description: "The ultimate beginner pack. Features altitude hold modes and turtle mode. Goggles and radio included.",
        price: "$229.00",
        url: "#",
        image: "https://picsum.photos/seed/starter1/800/600",
        tag: "ANALOG RTF"
      },
      {
        title: "EMAX Tinyhawk III Plus Freestyle",
        description: "Dual 18650 compatible radio and robust frame. Great for transitioning from indoor to outdoor freestyle.",
        price: "$289.99",
        url: "#",
        image: "https://picsum.photos/seed/starter2/800/600",
        tag: "OUTDOOR READY"
      }
    ]
  };
}

export default async function StarterKitsPage() {
  const data = await fetchDataFromDify();
  const breadcrumbs = [
    { label: 'Pilot Academy', href: '/academy' },
    { label: 'Starter Kits', isCurrentPage: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-10">

          <div className="relative p-8 hex-panel glass-panel overflow-hidden border-orange-500/20 shadow-[inset_0_0_50px_rgba(255,92,0,0.1)]">
             <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
             <PackagePlus className="w-12 h-12 text-[#FF5C00] mb-6 opacity-80" />
             <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter mb-4">
               Ready To Fly <span className="text-[#FF5C00]">Kits</span>
             </h1>
             <p className="text-sm font-mono text-[#A0A0A0] max-w-2xl leading-relaxed uppercase tracking-widest">
{"// Bypassing engineering protocols. Direct plug-and-play flight hardware for cadets."}
</p>
          </div>

          <AISummaryBox content={data.summary} title="SYS.RTF_ANALYSIS" />

          {/* WARNING BLOCK */}
          <div className="p-4 bg-[#FF5C00]/10 border border-[#FF5C00]/30 hex-panel flex items-start gap-4 text-[#A0A0A0] font-mono text-xs">
             <AlertTriangle className="w-6 h-6 text-[#FF5C00] flex-shrink-0" />
             <p className="leading-relaxed">
               <strong className="text-[#FF5C00] uppercase block mb-1">Dify Oracle Warning</strong>
               While RTF kits are excellent for immediate gratification, proprietary radios and analog goggles included in these kits are heavily bottlenecked. You will likely discard them when upgrading to a 5-inch digital quad.
             </p>
          </div>

          <div className="space-y-6">
             <div className="flex items-center gap-2 border-b border-[#333333] pb-2">
                <Zap className="w-5 h-5 text-[#00F2FF]" />
                <h3 className="text-lg font-black uppercase text-[#f8fafc] tracking-widest">Verified Hardware Modules</h3>
             </div>

             <div className="flex flex-col gap-4">
                {data.kits.map((item, i) => (
                   <AffiliateCard key={i} {...item} />
                ))}
             </div>
          </div>

        </div>

        <aside className="lg:col-span-4 hidden lg:flex flex-col gap-6">
           <AdStickySidebar />
        </aside>
      </div>
    </div>
  );
}
