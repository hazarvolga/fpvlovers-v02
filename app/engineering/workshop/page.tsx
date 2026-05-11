import React from 'react';
import { CyberBreadcrumb } from '@/components/navigation/Breadcrumb';
import { AdStickySidebar } from '@/components/monetization/NativeAds';
import { AISummaryBox } from '@/components/ui/AISummaryBox';
import { Activity, Flame, ShieldCheck } from 'lucide-react';
import { AffiliateCard } from '@/components/monetization/AffiliateCard';

export const metadata = {
  title: 'Workshop & Soldering | ENGINEERING LAB',
  description: 'Advanced FPV drone repair strategies, soldering techniques, and conformal coating safety.',
};

export default function WorkshopPage() {
  const breadcrumbs = [
    { label: 'Engineering Lab', href: '/engineering' },
    { label: 'Workshop Masterclass', isCurrentPage: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-10">
          
          <div className="relative p-8 hex-panel glass-panel overflow-hidden border-[#FF5C00]/20 shadow-[inset_0_0_80px_rgba(255,92,0,0.05)]">
             <div className="absolute inset-0 carbon-grid opacity-20 pointer-events-none" />
             <Flame className="w-12 h-12 text-[#FF5C00] mb-6 opacity-80" />
             <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter mb-4">
               Workshop <span className="text-[#FF5C00]">Masterclass</span>
             </h1>
             <p className="text-sm font-mono text-[#A0A0A0] max-w-2xl leading-relaxed uppercase tracking-widest">
{"// Board-level thermal bonding, circuitry repair, and water-resistance treatments."}
</p>
          </div>

          <AISummaryBox 
             content="A quality soldering iron is non-negotiable. Poor solder joints on high-current battery leads (XT60) will melt under 100A+ loads, causing terminal catastrophic failure mid-flight. Flux is your best friend; use it aggressively to achieve shiny, convex solder beads." 
             title="SYS.THERMAL_GUIDELINES" 
          />

          <div className="space-y-6">
             <div className="flex items-center gap-2 border-b border-[#333333] pb-2 mt-4">
                <ShieldCheck className="w-5 h-5 text-[#00F2FF]" />
                <h3 className="text-lg font-black uppercase text-[#f8fafc] tracking-widest">Required Bench Hardware</h3>
             </div>
             
             <div className="flex flex-col gap-4">
                <AffiliateCard 
                   title="TS101 Smart Soldering Iron"
                   description="USB-C PD compatible soldering iron reaching 400°C in seconds. Portable for field repairs."
                   price="$45.99"
                   url="#"
                   image="https://picsum.photos/seed/workshop1/800/600"
                   tag="FIELD ESSENTIAL"
                />
                <AffiliateCard 
                   title="MG Chemicals Silicone Conformal Coating"
                   description="Waterproofs your FC and ESC to survive wet grass and mild snow crashes."
                   price="$18.99"
                   url="#"
                   image="https://picsum.photos/seed/workshop2/800/600"
                   tag="HARDENING"
                />
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
