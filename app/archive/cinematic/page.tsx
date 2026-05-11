import React from 'react';
import { CyberBreadcrumb } from '@/components/navigation/Breadcrumb';
import { AdStickySidebar } from '@/components/monetization/NativeAds'; from '@/components/monetization/NativeAds';
import { Video, Camera } from 'lucide-react';
import Image from 'next/image';

export const metadata = {
  title: 'Cinewhoops & Cinematic | DRONE ARCHIVE',
  description: 'Slow, smooth, and safe. Explore ducted cinewhoops for high-end video production.',
};

export default function CinematicPage() {
  const breadcrumbs = [
    { label: 'Drone Archive', href: '/archive' },
    { label: 'Cinematic FPV', isCurrentPage: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-10">
          
          <div className="relative h-64 md:h-80 w-full overflow-hidden hex-panel border border-[#00F2FF]/30 shadow-[0_0_50px_rgba(0,242,255,0.1)]">
             <Image 
                src="https://picsum.photos/seed/cinematic/1200/800"
                alt="Cinewhoop Drone"
                fill
                className="object-cover opacity-30 mix-blend-screen"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#00F2FF]/5 z-10" />
             <div className="absolute inset-0 scanline-anim bg-gradient-to-b from-transparent via-[#00F2FF]/5 to-transparent z-10 pointer-events-none" />
             <div className="absolute bottom-8 left-8 z-20">
                <div className="flex items-center gap-2 mb-2">
                   <Video className="w-5 h-5 text-[#00F2FF]" />
                   <span className="text-[10px] font-black uppercase text-[#00F2FF] tracking-widest">SURVEILLANCE CLASS: DUCTED</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter shadow-black drop-shadow-xl">
                  Cinewhoop <span className="text-[#00F2FF]">Systems</span>
                </h1>
             </div>
          </div>

          <div className="glass-panel p-6 border-l-2 border-[#00F2FF] font-mono text-sm text-[#A0A0A0] leading-relaxed">
{"// Characterized by propeller guards (ducts) that prevent blade strikes, cinewhoops (usually 2.5 to 3.5 inches) are designed to fly closely around human subjects and delicate indoor environments. They prioritize lifting heavy HD camera payloads over aerodynamic agility."}
</div>

        </div>

        <aside className="lg:col-span-4 hidden lg:flex flex-col gap-6">
           <AdStickySidebar />
        </aside>
      </div>
    </div>
  );
}
