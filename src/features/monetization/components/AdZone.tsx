import React from 'react';
import { cn } from '@/lib/utils';

export function AdZone({ className, title = "SPONSORSHIP SLOT" }: { className?: string; title?: string }) {
  return (
    <div className={cn("glass-panel relative flex flex-col items-center justify-center min-h-[120px] rounded-xl overflow-hidden group", className)}>
      <div className="absolute top-2 left-3 text-[10px] uppercase tracking-widest text-[#00F5FF]/60 font-bold">
        {title}
      </div>

      {/* Placeholder for actual Ad script/content */}
      <div className="text-white/40 text-[10px] font-bold uppercase mt-4 flex flex-col items-center gap-2">
        <div className="w-8 h-8 rounded border border-dashed border-[#00F5FF]/30 flex items-center justify-center">
          <span className="text-[#00F5FF]/50">Ad</span>
        </div>
        <span>[ REVENUE_ZONE_ALPHA ]</span>
      </div>

      {/* Cyberpunk scanning line effect */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-[#00F5FF]/50 shadow-[0_0_10px_#00F5FF] opacity-0 group-hover:animate-[scan_2s_ease-in-out_infinite]" />
    </div>
  );
}
