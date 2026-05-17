import React from 'react';
import { cn } from '@/lib/utils';
import { Flame, Tag, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AdBanner({ className, title = "TOP TIER SPONSOR" }: { className?: string, title?: string }) {
  return (
    <div className={cn("glass-panel relative flex flex-col sm:flex-row items-center justify-between p-4 min-h-[90px] overflow-hidden group border-[#00F2FF]/20 hex-panel", className)}>
      <div className="flex items-center gap-4 z-10 relative mb-4 sm:mb-0 w-full sm:w-auto">
        <div className="w-12 h-12 bg-[#00F2FF]/10 flex items-center justify-center hex-panel border border-[#00F2FF]/30 flex-shrink-0">
          <Zap className="w-6 h-6 text-[#00F2FF]" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#00F2FF]/80 font-bold mb-1">{title}</div>
          <div className="text-[#A0A0A0] text-sm font-black uppercase tracking-tight">DJI O3 Air Unit - Flash Sale</div>
        </div>
      </div>

      <div className="z-10 relative flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
        <div className="text-right hidden md:block">
           <div className="text-[10px] text-white/30 line-through">$229.00</div>
           <div className="text-[#FF5C00] font-black tracking-tighter">$199.00</div>
        </div>
        <Button variant="amber" size="sm" className="h-10 text-[10px] w-full sm:w-auto">CLAIM DEAL</Button>
      </div>

      {/* Cyberpunk scanning line effect */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-[#00F2FF]/50 shadow-[0_0_10px_#00F2FF] opacity-0 group-hover:animate-[scan_2s_ease-in-out_infinite]" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00F2FF]/5 to-transparent skew-x-[-20deg] group-hover:animate-[shimmer_2s_infinite]" />
    </div>
  );
}

export function AdInFeed({ className }: { className?: string }) {
  return (
    <div className={cn("glass-panel relative flex flex-col p-6 hex-panel overflow-hidden group border-dashed border-[#FF5C00]/30", className)}>
      <div className="absolute inset-0 carbon-grid opacity-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#FF5C00]/50" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#FF5C00]/50" />

      <div className="flex items-center justify-between mb-4 z-10">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF5C00]">System Recommendation</span>
        <Tag className="w-4 h-4 text-[#FF5C00]" />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center z-10 relative">
         <div className="w-20 h-20 mb-4 hex-panel bg-[#FF5C00]/10 flex items-center justify-center border border-[#FF5C00]/20 relative">
            <div className="absolute inset-0 bg-[#FF5C00]/20 blur-xl hex-panel" />
            <Flame className="w-10 h-10 text-[#FF5C00] relative z-10" />
         </div>
         <h4 className="text-white font-black uppercase text-lg mb-2 tracking-tighter">Premium Battery Packs</h4>
         <p className="text-[#A0A0A0] text-[10px] uppercase tracking-widest leading-relaxed mb-4">Extend your flight time with CNHL 6S 1200mAh series.</p>
         <Button variant="outline" className="w-full text-[#FF5C00] border-[#FF5C00] hover:bg-[#FF5C00]/10 text-[10px] object-bottom mt-auto">SHOP NOW</Button>
      </div>
    </div>
  );
}

export function AdStickySidebar({ className }: { className?: string }) {
  return (
    <div className={cn("glass-panel p-4 hex-panel flex flex-col border-[#00F2FF]/20 sticky top-24 neon-border bg-[#0A0A0B]/90", className)}>
       <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4 text-center">Partner Network</div>
       <div className="flex flex-col gap-4">
         <div className="bg-[#050505] p-3 group hover:border-[#00F2FF]/40 border-b border-[#333333] transition-colors cursor-pointer relative">
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00F2FF]/50 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="w-full h-24 bg-gradient-to-br from-[#00F2FF]/20 to-transparent mb-3 flex items-center justify-center border border-[#00F2FF]/20 overflow-hidden relative hex-panel">
               <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/tbs/200/100')] bg-cover bg-center opacity-40 mix-blend-screen" />
               <span className="text-[10px] text-[#00F2FF] font-black uppercase tracking-widest z-10 bg-black/50 px-2 py-1 backdrop-blur-sm border border-[#00F2FF]/30">AD SPACE</span>
            </div>
            <div className="text-xs font-black uppercase tracking-tight text-[#A0A0A0] mb-1">TBS Crossfire TX</div>
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-[#FF5C00] font-black tracking-widest">$149.99</div>
              <div className="w-5 h-5 hex-panel bg-[#00F2FF]/10 flex items-center justify-center border border-[#00F2FF]/30">
                <span className="text-[8px] text-[#00F2FF]">↗</span>
              </div>
            </div>
         </div>
       </div>
    </div>
  );
}
