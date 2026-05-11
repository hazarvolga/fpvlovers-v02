import React from 'react';
import { CyberBreadcrumb } from '@/components/navigation/Breadcrumb';
import { AdStickySidebar } from '@/components/monetization/NativeAds';
import { AISummaryBox } from '@/components/ui/AISummaryBox';
import { Map as MapIcon, Flag, CheckSquare } from 'lucide-react';
import fs from 'fs';
import path from 'path';

export const metadata = {
  title: 'Pilot Roadmap | FPV LOVERS ACADEMY',
  description: 'Step-by-step zero-to-hero roadmap for new FPV drone pilots.',
};

async function fetchDataFromDify() {
  try {
    const filePath = path.join(process.cwd(), 'content', 'roadmap.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const content = JSON.parse(raw);
      if (content.summary && content.steps) return content;
    }
  } catch {}
  return {
    summary: "The most common failure point for new pilots is rushing into real flights without sufficient simulator hours. The Dify database strongly recommends a 3-phase approach: 1. Radio+Simulator (40 hours minimum) 2. Analog Whoop flying indoors 3. Transition to 5-inch digital freestyle.",
    steps: [
      { phase: "PHASE 01: VIRTUAL CALIBRATION", items: ["Acquire ELRS Protocol Radio", "Install Liftoff or VelociDrone", "Master Acro Mode Hovering", "Complete 40 Hours Logged"] },
      { phase: "PHASE 02: MICRO OPERATIONS", items: ["Acquire 65mm/75mm 1S Whoop", "Analog Goggles (Entry level)", "Navigate Indoor Obstacles", "Master Throttle Management"] },
      { phase: "PHASE 03: FULL AERODYNAMICS", items: ["Build or Buy 5-Inch 6S Quad", "Upgrade to Digital VTX (O3/Walksnail)", "Open Field Maiden Flight", "Basic Freestyle Combos"] }
    ]
  };
}

export default async function RoadmapPage() {
  const data = await fetchDataFromDify();
  const breadcrumbs = [
    { label: 'Pilot Academy', href: '/academy' },
    { label: 'Pilot Roadmap', isCurrentPage: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-10">
          
          <div className="relative p-8 hex-panel glass-panel overflow-hidden border-[#00F2FF]/20 shadow-[inset_0_0_80px_rgba(0,F2,FF,0.05)]">
             <div className="absolute inset-0 carbon-grid opacity-20 pointer-events-none" />
             <MapIcon className="w-12 h-12 text-[#00F2FF] mb-6 opacity-80" />
             <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter mb-4">
               Pilot <span className="text-[#00F2FF]">Roadmap</span>
             </h1>
             <p className="text-sm font-mono text-[#A0A0A0] max-w-2xl leading-relaxed uppercase tracking-widest">
{"// Structured trajectory from absolute beginner to high-G acrobatic operator."}
</p>
          </div>

          <AISummaryBox content={data.summary} title="SYS.TRAJECTORY_ANALYSIS" />

          <div className="space-y-6">
             <div className="flex items-center gap-2 border-b border-[#333333] pb-2 mt-4">
                <Flag className="w-5 h-5 text-[#00F2FF]" />
                <h3 className="text-lg font-black uppercase text-[#f8fafc] tracking-widest">Operation Sequences</h3>
             </div>
             
             <div className="flex flex-col gap-6">
                {data.steps.map((step, i) => (
                   <div key={i} className="bg-black/50 p-6 border border-[#1A1A1A] border-l-2 border-l-[#00F2FF] hex-panel hover:bg-[#0A0A0B] transition-colors relative">
                      <h4 className="text-xl font-black uppercase tracking-tight text-white mb-4">{step.phase}</h4>
                      <ul className="grid gap-3">
                        {step.items.map((item, j) => (
                           <li key={j} className="flex items-start gap-3 text-sm font-mono text-[#A0A0A0]">
                             <CheckSquare className="w-4 h-4 text-[#00F2FF] mt-0.5 flex-shrink-0" />
                             {item}
                           </li>
                        ))}
                      </ul>
                   </div>
                ))}
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
