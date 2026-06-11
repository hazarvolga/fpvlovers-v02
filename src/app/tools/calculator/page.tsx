import React from 'react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { Calculator as CalcIcon } from 'lucide-react';
import { BuildCalculatorWidget } from '@/features/tools/components/BuildCalculatorWidget';

export const metadata = {
  title: 'Build Calculator | Pilot Tools',
  description: 'Weight, Thrust, and Efficiency estimations for custom FPV drone builds.',
};

export default function CalculatorPage() {
  const breadcrumbs = [
    { label: 'Pilot Tools', href: '/tools' },
    { label: 'Build Calculator', isCurrentPage: true }
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      {/* Main Container */}
      <div className="flex flex-col gap-10">
        <div className="relative p-8 border border-white/5 bg-zinc-950 rounded-xl shadow-2xl overflow-hidden text-center sm:text-left">
           <CalcIcon className="w-12 h-12 text-[#FF5C00] mb-6 opacity-80 inline-block sm:block" />
           <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-100 mb-4">
             Thrust <span className="text-[#FF5C00]">Calculator</span>
           </h1>
           <p className="text-sm font-sans text-zinc-400 max-w-2xl leading-relaxed mx-auto sm:mx-0">
              Calculate optimal motor KV, prop pitch, and cell count for your target All-Up-Weight (AUW).
           </p>
        </div>

        {/* Widescreen widget */}
        <BuildCalculatorWidget />

        <div className="mt-12 hidden lg:block w-full border border-white/5 bg-zinc-950 rounded-xl p-6 text-center text-xs font-mono text-zinc-500 uppercase tracking-[0.2em]">
          <AdStickySidebar />
        </div>
      </div>
    </div>
  );
}
