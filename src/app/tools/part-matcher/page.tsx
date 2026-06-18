import React from 'react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { Cpu } from 'lucide-react';
import { PartMatcherWidget } from '@/features/tools/components/PartMatcherWidget';
import { getFpvProductCatalog } from '@/lib/tools/fpv-product-catalog';

export const metadata = {
  title: 'Part Matcher | Tools',
  description: 'Catalog-backed component compatibility analysis for FPV drones.',
};

export default function PartMatcherPage() {
  const products = getFpvProductCatalog();
  const breadcrumbs = [
    { label: 'Tools', href: '/tools' },
    { label: 'Part Matcher', isCurrentPage: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-8 flex flex-col gap-10">

          <div className="relative p-10 border border-white/5 bg-zinc-950 rounded-xl shadow-2xl overflow-hidden">
             {/* HUD Brackets */}
             <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#00F2FF]/40" />
             <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#00F2FF]/40" />
             <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#00F2FF]/40" />
             <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#00F2FF]/40" />

             <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-zinc-900 border border-white/10 rounded-lg">
                        <Cpu className="w-10 h-10 text-[#00F2FF] animate-pulse" />
                    </div>
                    <div>
                        <div className="text-[10px] font-mono text-[#00F2FF] tracking-[0.5em] mb-1">SYSTEM_UTILITY_v2.0</div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-100">
                          Part <span className="text-[#00F2FF]">Matcher</span>
                        </h1>
                    </div>
                </div>
                <p className="text-sm font-sans text-zinc-400 max-w-2xl leading-relaxed border-l-2 border-[#00F2FF]/30 pl-6">
                  Catalog compatibility engine. Input your build components to verify electrical, physical, and propulsion synchronization before assembly.
                </p>
             </div>
          </div>

          <div className="bg-zinc-950 rounded-xl p-6 sm:p-10 border border-white/5 relative shadow-2xl">
             <PartMatcherWidget products={products} />
          </div>

        </div>

        <aside className="lg:col-span-4 hidden lg:flex flex-col gap-8">
           <div className="p-6 border border-white/5 bg-zinc-950 rounded-xl shadow-2xl">
              <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                 <div className="w-2 h-2 bg-[#00F2FF] rounded-full" /> HOW IT WORKS
              </h4>
              <ul className="space-y-4 font-mono text-[10px] text-zinc-400 uppercase leading-relaxed">
                 <li className="flex gap-3">
                    <span className="text-[#00F2FF]">01.</span>
                    <span>Input your planned components into the diagnostic array.</span>
                 </li>
                 <li className="flex gap-3">
                    <span className="text-[#00F2FF]">02.</span>
                    <span>Catalog logic cross-references voltage, KV, and mounting specs.</span>
                 </li>
                 <li className="flex gap-3">
                    <span className="text-[#00F2FF]">03.</span>
                    <span>Receive a full compatibility matrix and risk assessment.</span>
                 </li>
              </ul>
           </div>
           <AdStickySidebar />
        </aside>
      </div>
    </div>
  );
}
