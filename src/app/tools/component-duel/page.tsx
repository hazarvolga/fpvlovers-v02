import React from 'react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { Zap } from 'lucide-react';
import { ComponentDuelWidget } from '@/features/tools/components/ComponentDuelWidget';
import { getFpvProductCatalog } from '@/lib/tools/fpv-product-catalog';

export const metadata = {
  title: 'Component Duel | AI ORACLE',
  description: 'Side-by-Side FPV Hardware Comparisons.',
};

export default function ComponentDuelPage() {
  const products = getFpvProductCatalog();
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
{"// comparing hardware against each other using reference data."}
</p>
          </div>

          <ComponentDuelWidget products={products} />

        </div>

        <aside className="lg:col-span-4 hidden lg:flex flex-col gap-6">
           <AdStickySidebar />
        </aside>
      </div>
    </div>
  );
}
