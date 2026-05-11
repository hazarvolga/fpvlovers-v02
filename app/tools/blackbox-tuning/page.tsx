import React from 'react';
import { CyberBreadcrumb } from '@/components/navigation/Breadcrumb';
import { AdStickySidebar } from '@/components/monetization/NativeAds';
import { Radio } from 'lucide-react';
import { BlackboxTunerWidget } from '@/components/features/BlackboxTuner';

export const metadata = {
  title: 'Blackbox Tuning | AI ORACLE',
  description: 'Analyze flight log data to diagnose vibrations and optimize PID/Filter settings.',
};

export default function BlackboxTuningPage() {
  const breadcrumbs = [
    { label: 'Oracle Tools', href: '/tools' },
    { label: 'Blackbox Tuning', isCurrentPage: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-10">
          
          <div className="relative p-8 hex-panel glass-panel overflow-hidden border-[#FF5C00]/20 shadow-[inset_0_0_80px_rgba(255,92,0,0.05)] text-center sm:text-left">
             <Radio className="w-12 h-12 text-[#FF5C00] mb-6 opacity-80 inline-block sm:block" />
             <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter mb-4">
               Blackbox <span className="text-[#FF5C00]">Tuning</span>
             </h1>
             <p className="text-sm font-mono text-[#A0A0A0] max-w-2xl leading-relaxed uppercase tracking-widest mx-auto sm:mx-0">
               {"// Analyze flight log data to diagnose vibrations, oscillations, and optimize PID/Filter settings."}
             </p>
          </div>

          <div className="bg-[#050505] p-6 sm:p-8 border border-[#333333] hex-panel relative">
             <BlackboxTunerWidget />
          </div>

        </div>

        <aside className="lg:col-span-4 hidden lg:flex flex-col gap-6">
           <AdStickySidebar />
        </aside>
      </div>
    </div>
  );
}
