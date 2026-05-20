import React from 'react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { AISummaryBox } from '@/components/ui/AISummaryBox';
import { AffiliateCard } from '@/features/monetization/components/AffiliateCard';
import { Cpu, Activity } from 'lucide-react';
import { getHardwareData } from '@/lib/dify-datasets';
import { PropellerLabSection } from '@/features/engineering/components/PropellerLabSection';

import { generateSeoMetadata } from '@/lib/seo/metadata';

export const metadata = generateSeoMetadata({
  title: 'Hardware Reference | ENGINEERING LAB',
  description: 'FPV hardware reference for motors, ESCs, flight controllers, VTX, cameras, and propeller choices.',
  path: '/engineering/hardware',
  ogImage: 'https://picsum.photos/seed/fpv-hardware/1200/630',
});

export default async function HardwarePage() {
  const data = await getHardwareData();
  const breadcrumbs = [
    { label: 'Engineering Lab', href: '/engineering' },
    { label: 'Hardware Data', isCurrentPage: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-10">

          <div className="relative p-8 hex-panel glass-panel overflow-hidden border-[#00F2FF]/20 shadow-[inset_0_0_80px_rgba(0,242,255,0.05)]">
             <div className="absolute inset-0 carbon-grid opacity-20 pointer-events-none" />
             <Cpu className="w-12 h-12 text-[#00F2FF] mb-6 opacity-80" />
             <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter mb-4">
               Hardware <span className="text-[#00F2FF]">Reference</span>
             </h1>
             <p className="text-sm font-mono text-[#A0A0A0] max-w-2xl leading-relaxed uppercase tracking-widest">
              Electrical and structural intelligence for FPV builds — motors, ESCs, flight controllers, and video systems.
            </p>
          </div>

          <AISummaryBox content={data.summary} title="SYS.HARDWARE_SYNOPSIS" />

          <PropellerLabSection />

          <div className="space-y-6">
             <div className="flex items-center gap-2 border-b border-[#333333] pb-2 mt-4">
                <Activity className="w-5 h-5 text-[#00F2FF]" />
                <h3 className="text-lg font-black uppercase text-[#f8fafc] tracking-widest">Target Acquisition: Core Systems</h3>
             </div>

             <div className="flex flex-col gap-4">
                {data.hardware.map((item, i) => (
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
