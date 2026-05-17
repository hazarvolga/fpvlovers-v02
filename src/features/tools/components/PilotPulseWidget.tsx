'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Radio } from 'lucide-react';

interface NewsItem {
  id: string;
  type: string;
  headline: string;
  score: number;
}

const pulseNews: NewsItem[] = [
  { id: '1', type: 'LEAK', headline: 'DJI Goggles 3 FCC Filing Revealed', score: 9 },
  { id: '2', type: 'FIRMWARE', headline: 'ELRS 3.4 Official Release is Live', score: 8 },
  { id: '3', type: 'STOCK', headline: 'O3 Air Units Restocked Globally', score: 7 },
  { id: '4', type: 'HARDWARE', headline: 'New Apex EVO Frame Sneak Peek', score: 5 },
];

export function PilotPulseWidget() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % pulseNews.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const currentNews = pulseNews[index];

  return (
    <div className="w-full bg-[#050505] border border-[#333333] hidden md:flex items-center text-xs font-mono uppercase px-4 py-2 relative overflow-hidden group">
        <div className="absolute left-0 w-1 h-full bg-[#00F2FF]/80 shadow-[0_0_10px_rgba(0,242,255,0.5)]" />

        <div className="flex items-center gap-3 shrink-0 mr-6">
           <Radio className="w-4 h-4 text-[#00F2FF] animate-pulse" />
           <span className="font-black tracking-widest text-[#00F2FF]">LIVE // RADAR ACTIVE</span>
        </div>

        <div className="flex-1 relative h-5 overflow-hidden">
           <AnimatePresence mode="popLayout">
               <motion.div
                 key={currentNews.id}
                 initial={{ y: 20, opacity: 0, filter: 'blur(4px)' }}
                 animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                 exit={{ y: -20, opacity: 0, filter: 'blur(4px)' }}
                 transition={{ duration: 0.4, ease: "easeOut" }}
                 className="absolute inset-0 flex items-center gap-3"
               >
                 <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${currentNews.type === 'LEAK' ? 'bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/40 shadow-[0_0_8px_rgba(255,92,0,0.3)]' : currentNews.type === 'STOCK' ? 'bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/40 shadow-[0_0_8px_rgba(0,255,102,0.3)]' : 'bg-[#00F2FF]/20 text-[#00F2FF] border border-[#00F2FF]/40 shadow-[0_0_8px_rgba(0,242,255,0.3)]'}`}>
                   {currentNews.type}
                 </span>
                 <span className="text-white truncate">{currentNews.headline}</span>
                 <span className="ml-auto flex items-center gap-1 text-[#00F2FF] shrink-0">
                   IMPACT: <span className="text-white">{currentNews.score}/10</span>
                 </span>
               </motion.div>
           </AnimatePresence>
        </div>

        <Link href="/pilot-pulse" className="shrink-0 ml-6 hover:text-[#00F2FF] transition-colors border-l border-[#333333] pl-6 flex items-center gap-2">
           OPEN PULSE RADAR
        </Link>
    </div>
  );
}
