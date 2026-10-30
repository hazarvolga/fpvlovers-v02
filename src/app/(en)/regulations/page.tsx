import React from 'react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { AISummaryBox } from '@/components/ui/AISummaryBox';
import { ShieldAlert, BookOpen } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Aviation Regulations | REGULATIONS',
  description: 'Global airspace rules, compliance, and safety standards for FPV pilots.',
};

export default function RegulationsPage() {
  const breadcrumbs = [
    { label: 'Regulations', isCurrentPage: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-10">

          <div className="relative p-8 hex-panel glass-panel overflow-hidden border-[#FF5C00]/20 shadow-[inset_0_0_80px_rgba(255,92,0,0.05)] text-center sm:text-left">
             <ShieldAlert className="w-12 h-12 text-[#FF5C00] mb-6 opacity-80 inline-block sm:block" />
             <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter mb-4">
               Safety & <span className="text-[#FF5C00]">Regulations</span>
             </h1>
             <p className="text-sm font-mono text-[#A0A0A0] max-w-2xl leading-relaxed uppercase tracking-widest mx-auto sm:mx-0">
{"// The strict boundaries between recreational flying and federal airspace violations."}
</p>
          </div>

          <AISummaryBox
             content="Aviation safety is a zero-tolerance discipline. Ignorance of local laws does not grant immunity from massive fines or confiscation of equipment. Always maintain Visual Line of Sight (VLOS) or fly with a certified spotter."
             title="SYS.SAFETY_DIRECTIVE"
             className="border-[#FF5C00]"
          />

          <div className="grid sm:grid-cols-2 gap-6">
             <Link href="/regulations/airspace" className="group block">
               <div className="bg-[#050505] border border-[#333333] p-6 hover:border-[#FF5C00]/50 transition-colors hex-panel h-full">
                  <h3 className="text-xl font-black uppercase text-white mb-2 group-hover:text-[#FF5C00] transition-colors">Airspace & Remote ID</h3>
                  <p className="text-sm font-mono text-[#A0A0A0]">Altitude limits, restricted zones, and broadcasting requirements.</p>
               </div>
             </Link>

             <Link href="/regulations/battery" className="group block">
               <div className="bg-[#050505] border border-[#333333] p-6 hover:border-[#00F2FF]/50 transition-colors hex-panel h-full">
                  <h3 className="text-xl font-black uppercase text-white mb-2 group-hover:text-[#00F2FF] transition-colors">LiPo Battery Safety</h3>
                  <p className="text-sm font-mono text-[#A0A0A0]">Chemical handling, charging parameters, and fire prevention.</p>
               </div>
             </Link>
          </div>

        </div>

        <aside className="lg:col-span-4 hidden lg:flex flex-col gap-6">
           <AdStickySidebar />
        </aside>
      </div>
    </div>
  );
}
