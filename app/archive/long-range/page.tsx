import React from 'react';
import { CyberBreadcrumb } from '@/components/navigation/Breadcrumb';
import { AdStickySidebar } from '@/components/monetization/NativeAds';
import { Crosshair } from 'lucide-react';
import Image from 'next/image';

export const metadata = { title: 'Long Range | DRONE ARCHIVE', description: '7-inch long range FPV drones for mountain surfing and endurance.' };

export default function LongRangePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={[{ label: 'Drone Archive', href: '/archive' }, { label: 'Long Range', isCurrentPage: true }]} className="mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-10">
          <div className="relative h-64 md:h-80 w-full overflow-hidden hex-panel border border-[#FF5C00]/30">
            <Image src="https://picsum.photos/seed/longrange/1200/800" alt="Long Range" fill className="object-cover opacity-50" />
            <div className="absolute inset-0 flex items-center justify-center"><Crosshair className="w-16 h-16 text-[#FF5C00] opacity-50" /></div>
          </div>
          <h1 className="text-4xl font-black uppercase text-white">Long <span className="text-[#FF5C00]">Range</span></h1>
          <p className="text-[#A0A0A0] font-mono">7-inch long range platforms. Mountain surfing, GPS rescue, and endurance builds.</p>
        </div>
        <aside className="lg:col-span-4 hidden lg:flex flex-col gap-6"><AdStickySidebar /></aside>
      </div>
    </div>
  );
}
