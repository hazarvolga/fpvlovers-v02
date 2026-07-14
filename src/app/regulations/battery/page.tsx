import React from 'react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { AISummaryBox } from '@/components/ui/AISummaryBox';
import { BatteryWarning, ShieldAlert } from 'lucide-react';

export const metadata = {
  title: 'LiPo Battery Safety | REGULATIONS',
  description: 'Lithium Polymer (LiPo) safety protocols, storage charges, and fire-resistant bags.',
};

export default function BatteryPage() {
  const breadcrumbs = [
    { label: 'Regulations', href: '/regulations' },
    { label: 'Battery Safety', isCurrentPage: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-10">

          <div className="relative p-8 hex-panel glass-panel overflow-hidden border-[#FF5C00]/20 shadow-[inset_0_0_80px_rgba(255,92,0,0.05)] text-center sm:text-left">
             <BatteryWarning className="w-12 h-12 text-[#FF5C00] mb-6 opacity-80 inline-block sm:block" />
             <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter mb-4">
               LiPo <span className="text-[#FF5C00]">Safety Protocols</span>
             </h1>
             <p className="text-sm font-mono text-[#A0A0A0] max-w-2xl leading-relaxed uppercase tracking-widest mx-auto sm:mx-0">
{"// Chemical instability warning. Lithium-ion polymer cells require strict charging parameters to prevent thermal runaway."}
</p>
          </div>

          <AISummaryBox
             content="Never charge a LiPo unattended. Always charge in a fire-proof LiPo bag or an ammo can. A fully charged LiPo cell is 4.2V, and a completely empty cell is 3.2V. Never leave a LiPo fully charged for more than 48 hours to prevent internal resistance degradation (puffing). Use a Storage Charge (3.8V per cell) for longevity."
             title="SYS.THERMAL_RUNAWAY_PREVENTION"
             className="border-[#FF5C00]"
          />

          <div className="space-y-6">
             <div className="flex items-center gap-2 border-b border-[#333333] pb-2 mt-4">
                <ShieldAlert className="w-5 h-5 text-[#00A8B3]" />
                <h3 className="text-lg font-black uppercase text-[#f8fafc] tracking-widest">Crucial Containment Gear</h3>
             </div>

             <div className="grid gap-4 md:grid-cols-2">
                {[
                  ['Smart charger checklist', 'Choose a charger with balance mode, cell-count detection, current limiting, and visible storage-charge controls.'],
                  ['LiPo containment checklist', 'Use a purpose-built fire-resistant bag or container, inspect packs before charging, and never leave a pack unattended.'],
                ].map(([title, description]) => (
                  <div key={title} className="border border-white/10 bg-black/30 p-5">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#FF5C00]">Research checklist</div>
                    <h4 className="mt-3 text-lg font-black uppercase tracking-tight text-white">{title}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</p>
                  </div>
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
