import React from 'react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { Video, ScanText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Flight Critic | Pilot Tools',
  description: 'Video review and flight quality grading for FPV footage.',
};

export default function FlightCriticPage() {
  const breadcrumbs = [
    { label: 'Pilot Tools', href: '/tools' },
    { label: 'Flight Critic', isCurrentPage: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-10">

          <div className="relative p-8 hex-panel glass-panel overflow-hidden border-[#00F2FF]/20 shadow-[inset_0_0_80px_rgba(0,242,255,0.05)] text-center sm:text-left">
             <Video className="w-12 h-12 text-[#00F2FF] mb-6 opacity-80 inline-block sm:block" />
             <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter mb-4">
               Flight <span className="text-[#00F2FF]">Critic</span>
             </h1>
             <p className="text-sm font-mono text-[#A0A0A0] max-w-2xl leading-relaxed uppercase tracking-widest mx-auto sm:mx-0">
{"// Input a YouTube URL to review trick continuity, stick rates, and propwash handling."}
</p>
          </div>

          <div className="bg-[#050505] p-8 border border-[#333333] hex-panel relative">
             <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#00F2FF]/50" />
             <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#00F2FF]/50" />

             <div className="flex flex-col gap-4 max-w-md mx-auto text-center items-center justify-center min-h-[250px]">
                <ScanText className="w-12 h-12 text-[#333333] mb-2" />
                <h3 className="text-xl font-black uppercase text-white tracking-tight">System Offline</h3>
                <p className="text-xs font-mono text-[#A0A0A0]">Video ingestion module is preparing. Add a YouTube link to analyze continuity, stick rates, and propwash handling.</p>
                <div className="flex gap-4 mt-6 w-full">
                   <input type="text" placeholder="https://youtube.com/watch?v=..." disabled className="flex-1 bg-black/50 border border-[#333333] px-4 font-mono text-sm text-white focus:outline-none focus:border-[#00F2FF] opacity-50 cursor-not-allowed" />
                   <Button variant="cyber" disabled className="opacity-50">ANALYZE</Button>
                </div>
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
