import React from 'react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { Zap } from 'lucide-react';
import { ComponentDuelWidget } from '@/features/tools/components/ComponentDuelWidget';
import { getFpvProductCatalog } from '@/lib/tools/fpv-product-catalog';

export const metadata = {
  title: 'Component Duel | Pilot Tools',
  description: 'Side-by-Side FPV Hardware Comparisons.',
};

export default function ComponentDuelPage() {
  const products = getFpvProductCatalog();
  const breadcrumbs = [
    { label: 'Oracle Tools', href: '/tools' },
    { label: 'Component Duel', isCurrentPage: true }
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="flex flex-col gap-10">

        <div className="relative p-8 border border-white/5 bg-zinc-950 rounded-xl shadow-2xl overflow-hidden text-center sm:text-left">
           <Zap className="w-12 h-12 text-[#FF5C00] mb-6 opacity-80 inline-block sm:block" />
           <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-100 mb-4">
             Component <span className="text-[#FF5C00]">Duel</span>
           </h1>
           <p className="text-sm font-sans text-zinc-400 max-w-2xl leading-relaxed mx-auto sm:mx-0">
             Compare hardware against each other using reference data.
           </p>
        </div>

        <ComponentDuelWidget products={products} />

        {/* Horizontal Ad Space */}
        <div className="mt-12 hidden lg:block w-full border border-white/5 bg-zinc-950 rounded-xl p-6 text-center text-xs font-mono text-zinc-500 uppercase tracking-[0.2em]">
          <AdStickySidebar />
        </div>
      </div>
    </div>
  );
}
