import React from 'react';
import { FlightCriticWidget } from '@/features/tools/components/FlightCriticWidget';
import { Badge } from '@/components/ui/badge';
import { Cpu, Wind, Video } from 'lucide-react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';

export const metadata = {
  title: 'Flight Review Lab | FPVLovers',
  description: 'Conservative FPV training rubric for uploaded flight files. Per-frame visual intelligence remains disabled until the verified analysis pipeline is live.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function FlightLabPage() {
  const breadcrumbs = [
    { label: 'Tools', href: '/tools' },
    { label: 'Flight Critic', isCurrentPage: true }
  ];

  return (
    <div className="min-h-screen pt-12 pb-24 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-[#00F5FF]/10 to-transparent pointer-events-none" />
        <div className="mesh-glow top-0 right-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-16">
           <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

           <div className="text-center mb-16">
              <Badge variant="outline" className="mb-6 mx-auto text-[#00F5FF] border-[#00F5FF]/30">
                 SYSTEM.FLIGHT_LAB_ACCESS
              </Badge>
              <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-6 leading-none">
                 Flight <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F5FF] to-blue-600 text-glow">Critic</span>
              </h1>
              <p className="text-white/50 max-w-2xl mx-auto font-semibold leading-relaxed">
                 Upload a flight file for a conservative training rubric. This version does not claim per-frame visual analysis or official ranking.
              </p>

              <div className="flex justify-center gap-8 mt-8">
                 <div className="flex flex-col items-center gap-2 text-[#00F5FF]/60 hover:text-[#00F5FF] transition-colors">
                    <Video className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">File Review</span>
                 </div>
                 <div className="flex flex-col items-center gap-2 text-[#00F5FF]/60 hover:text-[#00F5FF] transition-colors">
                    <Cpu className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Training Logic</span>
                 </div>
                 <div className="flex flex-col items-center gap-2 text-[#00F5FF]/60 hover:text-[#00F5FF] transition-colors">
                    <Wind className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Rubric Output</span>
                 </div>
              </div>
           </div>

           <div className="mt-12">
             <FlightCriticWidget />
           </div>
        </div>
    </div>
  )
}
