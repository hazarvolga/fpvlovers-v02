import React from 'react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { Calculator as CalcIcon } from 'lucide-react';
import { BuildCalculatorWidget } from '@/features/tools/components/BuildCalculatorWidget';

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

          <BuildCalculatorWidget />

        </div>

        <aside className="lg:col-span-4 hidden lg:flex flex-col gap-6">
           <AdStickySidebar />
        </aside>
      </div>
    </div>
  );
}
