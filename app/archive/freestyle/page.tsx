import React from 'react';
import { CyberBreadcrumb } from '@/components/navigation/Breadcrumb';
import { AdStickySidebar } from '@/components/monetization/NativeAds';
import { Video, ExternalLink, Database } from 'lucide-react';
import Image from 'next/image';
import { getArchivePage } from '@/lib/dify-archive';

export const metadata = {
  title: 'Freestyle & Cinematic | DRONE ARCHIVE',
  description: '5-inch pure freestyle frames and cinematic cruisers from the knowledge base.',
};

export default async function FreestylePage() {
  const data = await getArchivePage('freestyle',
    'High-G freestyle frames, cinematic cruisers, and the components that power them. Knowledge base data available.',
    'Freestyle Components'
  );
  const breadcrumbs = [
    { label: 'Drone Archive', href: '/archive' },
    { label: 'Freestyle & Cinematic', isCurrentPage: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-10">
          
          <div className="relative h-64 md:h-80 w-full overflow-hidden hex-panel border border-[#FF5C00]/30 shadow-[0_0_50px_rgba(255,92,0,0.1)]">
             <Image 
                src="https://picsum.photos/seed/freestyle/1200/800"
                alt="Freestyle FPV Drone"
                fill
                className="object-cover opacity-50 mix-blend-hard-light grayscale-[40%]"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#FF5C00]/10 z-10" />
             <div className="absolute inset-0 scanline-anim bg-gradient-to-b from-transparent via-[#FF5C00]/10 to-transparent z-10 pointer-events-none" />
             <div className="absolute bottom-8 left-8 z-20">
                <div className="flex items-center gap-2 mb-2">
                   <Video className="w-5 h-5 text-[#FF5C00]" />
                   <span className="text-[10px] font-black uppercase text-[#FF5C00] tracking-widest">AERODYNAMIC CLASS: 5 INCH</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter shadow-black drop-shadow-xl">
                  Freestyle <span className="text-[#FF5C00]">Cinematic</span>
                </h1>
             </div>
          </div>

          <div className="glass-panel p-6 border-l-2 border-[#FF5C00] font-mono text-sm text-[#A0A0A0] leading-relaxed">
{"// The 5-inch freestyle drone is the apex predator of the FPV ecosystem. Optimized for extreme acrobatics, snap-rolls, and carrying a full-sized GoPro. High torque 2207 / 2306 motors on 6S LiPo configurations offer unparalleled power and momentum handling."}
</div>

        </div>

        <aside className="lg:col-span-4 hidden lg:flex flex-col gap-6">
           <AdStickySidebar />
        </aside>
      </div>
    </div>
  );
}
