import React from 'react';
import { CyberBreadcrumb } from '@/components/navigation/Breadcrumb';
import { AdStickySidebar } from '@/components/monetization/NativeAds';
import { Zap, Vibrate } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Component Duel | AI ORACLE',
  description: 'Side-by-Side Dify RAG Hardware Comparisons.',
};

export default function ComponentDuelPage() {
  const breadcrumbs = [
    { label: 'Oracle Tools', href: '/tools' },
    { label: 'Component Duel', isCurrentPage: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-10">
          
          <div className="relative p-8 hex-panel glass-panel overflow-hidden border-[#FF5C00]/20 shadow-[inset_0_0_80px_rgba(255,92,0,0.05)] text-center sm:text-left">
             <Zap className="w-12 h-12 text-[#FF5C00] mb-6 opacity-80 inline-block sm:block" />
             <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter mb-4">
               Component <span className="text-[#FF5C00]">Duel</span>
             </h1>
             <p className="text-sm font-mono text-[#A0A0A0] max-w-2xl leading-relaxed uppercase tracking-widest mx-auto sm:mx-0">
{"// pitting hardware against each other using Dify RAG consensus."}
</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
             <div className="bg-[#0A0A0B] border border-[#333333] p-6 text-center hex-panel h-48 flex flex-col items-center justify-center">
                 <input type="text" placeholder="Select Component Alpha" className="w-full bg-[#050505] border border-[#333333] px-4 py-3 font-mono text-xs text-white text-center focus:outline-none focus:border-[#FF5C00]" />
             </div>
             <div className="bg-[#0A0A0B] border border-[#333333] p-6 text-center hex-panel h-48 flex flex-col items-center justify-center">
                 <input type="text" placeholder="Select Component Beta" className="w-full bg-[#050505] border border-[#333333] px-4 py-3 font-mono text-xs text-white text-center focus:outline-none focus:border-[#00F2FF]" />
             </div>
          </div>
          
          <Button variant="default" size="lg" className="w-full h-16 text-xl tracking-widest font-black uppercase" disabled>
             INITIATE MATCHUP
          </Button>

        </div>

        <aside className="lg:col-span-4 hidden lg:flex flex-col gap-6">
           <AdStickySidebar />
        </aside>
      </div>
    </div>
  );
}
