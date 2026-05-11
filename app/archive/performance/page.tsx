import React from 'react';
import { CyberBreadcrumb } from '@/components/navigation/Breadcrumb';
import { AdStickySidebar } from '@/components/monetization/NativeAds'; from '@/components/monetization/NativeAds';
import { AISummaryBox } from '@/components/ui/AISummaryBox';
import { Crosshair, Wind } from 'lucide-react';

export const metadata = {
  title: 'Long-Range & Performance | DRONE ARCHIVE',
  description: 'High-speed 6S racing drones and 7-inch long-range mountain surfing machines.',
};

export default function PerformanceArchivePage() {
  const breadcrumbs = [
    { label: 'Drone Archive', href: '/archive' },
    { label: 'Long-Range & Performance', isCurrentPage: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-10">
          
          <div className="relative p-8 hex-panel glass-panel overflow-hidden border-[#00F2FF]/20 shadow-[inset_0_0_80px_rgba(0,242,255,0.05)] text-center sm:text-left">
             <Crosshair className="w-12 h-12 text-[#00F2FF] mb-6 opacity-80 inline-block sm:block" />
             <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter mb-4">
               Extreme <span className="text-[#00F2FF]">Performance</span>
             </h1>
             <p className="text-sm font-mono text-[#A0A0A0] max-w-2xl leading-relaxed uppercase tracking-widest mx-auto sm:mx-0">
{"// Surpassing standard visual line of sight distances and racing velocity thresholds."}
</p>
          </div>

          <AISummaryBox 
             content="Mountain surfing relies on 7-inch low-KV platforms paired with Li-Ion packs (e.g., 6S2P Molicel P42A) for max flight time. Conversely, tight track racing utilizes stripped-down 5-inch frames maximizing thrust-to-weight, with zero regards for battery efficiency." 
             title="SYS.PERFORMANCE_SPECS" 
          />
          
          <div className="p-8 border border-white/5 bg-black/50 overflow-hidden flex flex-col items-center justify-center min-h-[200px] text-center">
             <Wind className="w-10 h-10 text-white/20 mb-4 animate-[spin_4s_linear_infinite]" />
             <span className="text-sm font-black uppercase tracking-widest text-white/40">NO SIGNAL_</span>
             <span className="text-[10px] font-mono text-white/20 mt-2">Connecting to long-range archive databanks...</span>
          </div>

        </div>

        <aside className="lg:col-span-4 hidden lg:flex flex-col gap-6">
           <AdStickySidebar />
        </aside>
      </div>
    </div>
  );
}
