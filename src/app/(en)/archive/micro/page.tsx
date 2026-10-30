import React from 'react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { Target } from 'lucide-react';
import Image from 'next/image';

export const metadata = {
  title: 'Micro & Whoop Drones | DRONE ARCHIVE',
  description: 'Indoor agility and extreme proximity micro FPV quadcopters. Reviews and builds.',
};

export default function MicroWhoopPage() {
  const breadcrumbs = [
    { label: 'Fly', href: '/archive' },
    { label: 'Micro / Whoops', isCurrentPage: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-10">

          <div className="relative h-64 md:h-80 w-full overflow-hidden hex-panel border border-[#333333]">
             <Image
                src="/api/content/media/cover/micro-whoop-drones"
                alt="Micro Drone"
                fill
                className="object-cover opacity-40 mix-blend-screen"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent z-10" />
             <div className="absolute bottom-8 left-8 z-20">
                <div className="flex items-center gap-2 mb-2">
                   <Target className="w-5 h-5 text-[#00F2FF]" />
                   <span className="text-[10px] font-black uppercase text-[#00F2FF] tracking-widest">DRONE CLASS: SUB-100G</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter">
                  Micro / Whoop <span className="text-[#00F2FF]">Tactical</span>
                </h1>
             </div>
          </div>

          <div className="glass-panel p-6 border-l-2 border-[#00F2FF] font-mono text-sm text-[#A0A0A0] leading-relaxed">
{"// Micro drones (65mm-85mm) rely on ducted frames to bounce off walls. Their power-to-weight ratio allows them to explore spaces too tight or hazardous for 5-inch platforms. The standard protocol runs on 1S or 2S LiHV cells, utilizing high-KV motors (up to 25000KV)."}
</div>

          <div className="grid md:grid-cols-2 gap-6">
             <div className="bg-[#0A0A0B] border border-[#333333] p-6 hover:border-[#00F2FF]/50 transition-colors">
                 <h4 className="text-xl font-black uppercase text-white mb-2 tracking-tight">Mobula 6 (2024)</h4>
                 <p className="text-xs text-[#A0A0A0] font-mono">Unmatched indoor freestyle. Lighter AIO boards give this drone legendary throttle resolution.</p>
                 <div className="mt-4 flex items-center justify-between text-[#00F2FF] text-[10px] uppercase font-bold tracking-widest border-t border-[#333333] pt-4">
                    <span>1S 300mAh</span>
                    <span>18 grams</span>
                 </div>
             </div>

             <div className="bg-[#0A0A0B] border border-[#333333] p-6 hover:border-[#00F2FF]/50 transition-colors">
                 <h4 className="text-xl font-black uppercase text-white mb-2 tracking-tight">CineLog 20</h4>
                 <p className="text-xs text-[#A0A0A0] font-mono">A robust 2-inch cinewhoop capable of carrying a stripped DJI O3 system without flight anxiety.</p>
                 <div className="mt-4 flex items-center justify-between text-[#00F2FF] text-[10px] uppercase font-bold tracking-widest border-t border-[#333333] pt-4">
                    <span>4S 660mAh</span>
                    <span>140 grams</span>
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
