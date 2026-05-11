import React from 'react';
import { CyberBreadcrumb } from '@/components/navigation/Breadcrumb';
import { AdStickySidebar } from '@/components/monetization/NativeAds';
import { Activity, Calculator as CalcIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Build Calculator | AI ORACLE',
  description: 'Weight, Thrust, and Efficiency estimations for custom FPV drone builds.',
};

export default function CalculatorPage() {
  const breadcrumbs = [
    { label: 'Oracle Tools', href: '/tools' },
    { label: 'Build Calculator', isCurrentPage: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-10">
          
          <div className="relative p-8 hex-panel glass-panel overflow-hidden border-[#00A8B3]/20 shadow-[inset_0_0_80px_rgba(0,168,179,0.05)] text-center sm:text-left">
             <CalcIcon className="w-12 h-12 text-[#00A8B3] mb-6 opacity-80 inline-block sm:block" />
             <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter mb-4">
               Thrust <span className="text-[#00A8B3]">Calculator</span>
             </h1>
             <p className="text-sm font-mono text-[#A0A0A0] max-w-2xl leading-relaxed uppercase tracking-widest mx-auto sm:mx-0">
{"// Calculate optimal motor KV, prop pitch, and cell count for your target All-Up-Weight (AUW)."}
</p>
          </div>

          <div className="bg-[#050505] p-8 border border-[#333333] hex-panel relative">
             <div className="flex flex-col gap-6">
                 <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black tracking-widest uppercase text-[#00A8B3]">Est. Frame Weight (g)</label>
                       <input type="number" defaultValue={130} className="w-full bg-[#0A0A0B] border border-[#333333] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#00A8B3]" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black tracking-widest uppercase text-[#00A8B3]">Battery Weight (g)</label>
                       <input type="number" defaultValue={180} className="w-full bg-[#0A0A0B] border border-[#333333] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#00A8B3]" />
                    </div>
                 </div>
                 
                 <div className="bg-black/50 p-6 border border-[#333333] mt-4 flex justify-between items-center text-center font-mono">
                    <div>
                       <div className="text-[10px] text-[#A0A0A0] mb-1">TOTAL AUW</div>
                       <div className="text-2xl font-black text-white">310g</div>
                    </div>
                    <div className="text-[#333333] text-4xl">/</div>
                    <div>
                       <div className="text-[10px] text-[#A0A0A0] mb-1">REQ. THRUST (3:1)</div>
                       <div className="text-2xl font-black text-[#FF5C00]">930g</div>
                    </div>
                 </div>
                 
                 <Button variant="cyber" className="w-full">RUN FULL DIAGNOSTIC</Button>
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
