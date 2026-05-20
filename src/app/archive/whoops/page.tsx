import React from 'react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { Target } from 'lucide-react';
import Image from 'next/image';

export const metadata = { title: 'Whoops & Micro | DRONE ARCHIVE', description: 'Tiny FPV whoops for indoor and proximity flying.' };

export default function WhoopsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={[{ label: 'Drone Archive', href: '/archive' }, { label: 'Whoops & Micro', isCurrentPage: true }]} className="mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-10">
          <div className="relative h-64 md:h-80 w-full overflow-hidden hex-panel border border-[#00F2FF]/30">
            <Image src="https://picsum.photos/seed/whoops/1200/800" alt="Whoop" fill className="object-cover opacity-50" />
            <div className="absolute inset-0 flex items-center justify-center"><Target className="w-16 h-16 text-[#00F2FF] opacity-50" /></div>
          </div>
          <h1 className="text-4xl font-black uppercase text-white">Whoops & <span className="text-[#00F2FF]">Micro</span></h1>
          <p className="text-[#A0A0A0] font-mono">65mm-85mm brushless whoops for indoor and proximity flying. Guides and references are loading here now.</p>
        </div>
        <aside className="lg:col-span-4 hidden lg:flex flex-col gap-6"><AdStickySidebar /></aside>
      </div>
    </div>
  );
}
