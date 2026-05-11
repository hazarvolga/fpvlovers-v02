import React from 'react';
import { Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AISummaryBoxProps {
  content: string;
  title?: string;
  className?: string;
  latency?: string;
}

export function AISummaryBox({ content, title = "SYS.DIFY_SUMMARY", className, latency = "12ms" }: AISummaryBoxProps) {
  return (
    <div className={cn("glass-panel hex-panel p-6 relative border-l-2 border-[#00F2FF] group", className)}>
      <div className="absolute inset-0 carbon-grid opacity-10 pointer-events-none" />
      <div className="relative z-10 flex items-center justify-between mb-4 border-b border-[#333333] pb-2">
         <div className="flex items-center gap-2 text-[#00F2FF]">
            <Cpu className="w-4 h-4 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
         </div>
         <div className="text-[9px] text-[#A0A0A0] font-mono tracking-widest bg-black/50 px-2 py-0.5 border border-[#333333]">
           LATENCY: {latency}
         </div>
      </div>
      <p className="relative z-10 text-sm font-mono text-[#A0A0A0] leading-relaxed">
         {content}
      </p>
      
      {/* Decorative corners */}
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#00F2FF]/40 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#00F2FF]/40 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
