'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, AlertTriangle, Box, Cpu, HardDrive } from 'lucide-react';
import { CyberBreadcrumb } from '@/components/navigation/Breadcrumb';

interface PulseNews {
  id: string;
  type: string;
  headline: string;
  summary: string;
  score: number;
  vibe: string;
  timestamp: string;
}

const mockNews: PulseNews[] = [
  {
    id: '1',
    type: 'LEAK',
    headline: 'DJI Goggles 3 FCC Filing Revealed',
    summary: 'Internal documents point to PiP pass-through and a new O4 transmission protocol. Could redefine digital flying bounds.',
    score: 10,
    vibe: 'Extreme Hype',
    timestamp: '15m AGO',
  },
  {
    id: '2',
    type: 'FIRMWARE',
    headline: 'ELRS 3.4 Official Release is Live',
    summary: 'Major update stabilizing SPI receivers and adding Gemini dual-antenna telemetry features.',
    score: 8,
    vibe: 'Stable & Ready',
    timestamp: '2h AGO',
  },
  {
    id: '3',
    type: 'STOCK',
    headline: 'O3 Air Units Restocked Globally',
    summary: 'Major retailers have received shipments. Quantities are limited following a 2-month drought.',
    score: 7,
    vibe: 'Relief',
    timestamp: '5h AGO',
  },
  {
    id: '4',
    type: 'HARDWARE',
    headline: 'New Apex EVO Frame Sneak Peek',
    summary: 'Revamped carbon geometry aimed at reducing front-end resonance in 5" setups. Release slated for Q3.',
    score: 5,
    vibe: 'Wait-and-See',
    timestamp: '1d AGO',
  }
];

const getTypeColor = (type: string) => {
  switch(type) {
    case 'LEAK': return 'border-[#FF5C00] text-[#FF5C00] drop-shadow-[0_0_8px_rgba(255,92,0,0.8)]';
    case 'STOCK': return 'border-[#00FF66] text-[#00FF66] drop-shadow-[0_0_8px_rgba(0,255,102,0.8)]';
    case 'FIRMWARE': return 'border-[#00F2FF] text-[#00F2FF] drop-shadow-[0_0_8px_rgba(0,242,255,0.8)]';
    default: return 'border-white/50 text-white/80';
  }
};

const getTypeIcon = (type: string) => {
  switch(type) {
    case 'LEAK': return <AlertTriangle className="w-5 h-5" />;
    case 'STOCK': return <Box className="w-5 h-5" />;
    case 'FIRMWARE': return <HardDrive className="w-5 h-5" />;
    default: return <Cpu className="w-5 h-5" />;
  }
};

export default function PilotPulsePage() {
  const [items] = useState<PulseNews[]>(mockNews);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 pt-28">
      <CyberBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Pilot Pulse', isCurrentPage: true }]} className="mb-8" />
      
      {/* Header section */}
      <div className="relative mb-12 flex flex-col items-center justify-center p-8 bg-[#050505] border border-[#333333] hex-panel overflow-hidden">
         {/* Radar SVG Animation */}
         <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
            <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
               className="w-96 h-96 rounded-full border border-dashed border-[#00F2FF]/40 relative flex items-center justify-center"
            >
               <div className="absolute top-0 right-1/2 w-1/2 h-1/2 bg-gradient-to-br from-[#00F2FF]/40 to-transparent origin-bottom-right" />
            </motion.div>
         </div>

         <Radio className="w-16 h-16 text-[#00F2FF] mb-6 relative z-10" />
         <h1 className="text-5xl md:text-6xl font-black uppercase text-white tracking-tighter mb-4 relative z-10">
           Pilot <span className="text-[#00F2FF]">Pulse</span>
         </h1>
         <p className="text-sm font-mono text-[#A0A0A0] max-w-2xl leading-relaxed uppercase tracking-widest text-center relative z-10">
           {"// GLOBAL FPV RADAR ACTIVE. MONITORING LEAKS, RELEASES, AND STOCK SIGNALS."}
         </p>
      </div>

      <div className="space-y-6">
         <AnimatePresence>
            {items.map((item, i) => (
               <motion.div
                 key={item.id}
                 initial={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
                 animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                 transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                 className={`group relative bg-[#0A0A0B] border border-[#333333] p-6 glass-panel hover:bg-[#0f0f12] transition-all duration-300 overflow-hidden cursor-pointer`}
               >
                 {/* Side glow indicator */}
                 <div className={`absolute top-0 left-0 bottom-0 w-1 ${item.type === 'LEAK' ? 'bg-[#FF5C00] shadow-[0_0_15px_#FF5C00]' : item.type === 'STOCK' ? 'bg-[#00FF66] shadow-[0_0_15px_#00FF66]' : item.type === 'FIRMWARE' ? 'bg-[#00F2FF] shadow-[0_0_15px_#00F2FF]' : 'bg-white/20'} transition-all`} />
                 
                 {/* HUD Corner Brackets */}
                 <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-transparent group-hover:border-[#00F2FF]/80 transition-all duration-300" />
                 <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-transparent group-hover:border-[#00F2FF]/80 transition-all duration-300" />

                 <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex flex-col items-center justify-center p-4 bg-[#050505] border border-[#333333] w-24 h-24 shrink-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                       <span className={`mb-2 ${getTypeColor(item.type).replace('border-', '')}`}>
                          {getTypeIcon(item.type)}
                       </span>
                       <span className="text-[10px] font-mono font-black text-[#A0A0A0] uppercase tracking-widest">{item.type}</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                       <div className="flex items-center justify-between mb-2">
                          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-[#A0A0A0] transition-all">
                             {item.headline}
                          </h2>
                          <div className="font-mono text-[10px] text-[#A0A0A0] whitespace-nowrap hidden sm:block">
                             {item.timestamp}
                          </div>
                       </div>
                       <p className="text-sm font-sans text-[#A0A0A0] leading-relaxed max-w-3xl">
                          {item.summary}
                       </p>
                    </div>

                    <div className="hidden md:flex flex-col justify-between shrink-0 font-mono text-xs uppercase text-right border-l border-[#333333] pl-6 w-32">
                       <div>
                          <div className="text-[#A0A0A0] mb-1">Impact</div>
                          <div className={`text-xl font-black ${item.score >= 8 ? 'text-[#FF5C00]' : 'text-white'}`}>
                             {item.score}/10
                          </div>
                       </div>
                       <div>
                          <div className="text-[#A0A0A0] mb-1">Vibe</div>
                          <div className="text-[#00F2FF]">{item.vibe}</div>
                       </div>
                    </div>
                 </div>
               </motion.div>
            ))}
         </AnimatePresence>
      </div>
    </div>
  );
}
