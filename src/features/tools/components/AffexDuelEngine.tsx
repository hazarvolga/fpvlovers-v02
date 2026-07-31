'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Zap, Check, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DuelProduct, DuelResult, getSpecWinner } from '@/lib/duelEngine';
import { isSafeExternalHttpUrl } from '@/lib/monetization/safe-external-url';

interface DuelEngineProps {
  productA: DuelProduct;
  productB: DuelProduct;
  result: DuelResult;
}

export function AffexDuelEngine({ productA, productB, result }: DuelEngineProps) {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Offset based on navbar height (80px)
      setIsSticky(window.scrollY > 250);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const renderProductColumn = (product: DuelProduct, isWinner: boolean, warning: string) => (
    <div className={cn("flex flex-col gap-6 relative p-6 glass-panel rounded-2xl transition-all duration-300", isWinner ? "border-[#00F5FF]/50 shadow-[0_0_30px_rgba(0,245,255,0.15)] bg-[#00F5FF]/5" : "border-white/5 opacity-90")}>

       {isWinner && (
         <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-[#00F5FF] text-[#050810] font-black pointer-events-none shadow-[0_0_10px_#00F5FF]"><Check className="w-3 h-3 mr-1" /> BEST PICK</Badge>
         </div>
       )}

       <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black border border-white/10 group">
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050810] to-transparent opacity-80" />
          <div className="absolute bottom-4 left-4 right-4">
             <div className="text-[10px] font-bold text-[#00F5FF] uppercase tracking-widest">{product.brand}</div>
             <div className="text-xl font-black uppercase text-white leading-tight">{product.name}</div>
          </div>
       </div>

       <div className="rounded-md border border-yellow-300/20 bg-yellow-300/5 p-2 text-[10px] font-bold uppercase tracking-widest text-yellow-100">
         {product.referenceLabel} - live price, stock, and affiliate status disabled
       </div>

       {/* Honest Mechanic Warning */}
       <div className="bg-[#FFB800]/5 border border-[#FFB800]/20 rounded-md p-3">
          <div className="flex items-center gap-1.5 mb-1.5 text-[#FFB800]">
             <AlertTriangle className="w-4 h-4" />
             <span className="text-[10px] uppercase font-bold tracking-widest">Mechanic&apos;s Warning</span>
          </div>
          <p className="text-xs text-white/70 leading-relaxed font-medium">
             &quot;{warning}&quot;
          </p>
       </div>

       {/* Vendor Price Table */}
       <div className="flex flex-col gap-2 mt-auto">
          <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest border-b border-white/10 pb-1">Source Verification</h4>
          {product.vendors.map((vendor, i) => isSafeExternalHttpUrl(vendor.url) ? (
             <a href={vendor.url} key={i} target="_blank" rel="nofollow sponsored noopener noreferrer" className={cn("flex items-center justify-between p-2 rounded border transition-colors group", vendor.verified ? "bg-white/5 border-white/10 hover:border-[#00F5FF]/50 hover:bg-[#00F5FF]/5" : "bg-black/40 border-dashed border-white/10 opacity-50 cursor-not-allowed")}>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase">{vendor.name}</span>
                  <span className={cn("text-xs font-black", vendor.verified ? "text-[#00F5FF]" : "text-white/30")}>
                    {vendor.status}
                  </span>
                </div>
             </a>
          ) : (
            <div key={i} className="flex items-center justify-between rounded border border-yellow-300/20 bg-yellow-300/5 p-2 text-yellow-100">
              <span className="text-[10px] uppercase tracking-widest">{vendor.name}: {vendor.status}</span>
            </div>
          ))}
       </div>
    </div>
  );

  return (
    <div className="w-full flex flex-col gap-12 relative">
      {/* STICKY COMPARISON BAR */}
      <AnimatePresence>
         {isSticky && (
           <motion.div
             initial={{ y: -100 }}
             animate={{ y: 0 }}
             exit={{ y: -100 }}
             className="fixed top-20 left-0 w-full z-40 px-4 py-3 bg-[#050810]/90 backdrop-blur-xl border-b border-[#00F5FF]/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] md:block hidden"
           >
              <div className="max-w-5xl mx-auto flex items-center justify-between">
                 <div className="flex items-center gap-4 flex-1 justify-center">
                    <span className="text-sm font-black uppercase text-white truncate max-w-[200px]">{productA.name}</span>
                    <Badge variant="outline" className="h-8 text-[10px]">Evidence pending</Badge>
                 </div>

                 <div className="w-[2px] h-8 bg-gradient-to-b from-transparent via-[#00F5FF] to-transparent mx-8 opacity-50" />

                 <div className="flex items-center gap-4 flex-1 justify-center">
                    <Badge variant="outline" className="h-8 text-[10px]">Evidence pending</Badge>
                    <span className="text-sm font-black uppercase text-white truncate max-w-[200px]">{productB.name}</span>
                 </div>
              </div>
           </motion.div>
         )}
      </AnimatePresence>

      <div className="text-center flex flex-col items-center">
         <Badge variant="outline" className="mb-4 text-[#00F5FF] border-[#00F5FF]/30 tracking-widest"><Zap className="w-3 h-3 mr-1" /> FPV COMPARISON ENGINE</Badge>
         <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-2 leading-none">
           Component <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">Duel</span>
         </h1>
         <p className="text-white/50 text-sm font-semibold max-w-lg">Static benchmark comparison. Live prices, stock, and affiliate recommendations stay locked until source verification is complete.</p>
      </div>

      <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-8 items-stretch relative max-w-6xl mx-auto w-full">

         {/* ITEM A */}
         {renderProductColumn(productA, result.winnerId === productA.id, result.warnings[productA.id])}

         {/* VS ENERGY BEAM */}
         <div className="hidden md:flex flex-col items-center justify-center relative w-12">
            <div className="absolute top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-[#00F5FF] to-transparent shadow-[0_0_15px_#00F5FF] pointer-events-none" />
            <div className="relative z-10 w-12 h-12 rounded-full bg-[#050810] border border-[#00F5FF] flex items-center justify-center shadow-[0_0_20px_rgba(0,245,255,0.4)]">
               <span className="font-black italic tracking-tighter text-[#00F5FF] text-xl">VS</span>
            </div>
         </div>

         {/* ITEM B */}
         {renderProductColumn(productB, result.winnerId === productB.id, result.warnings[productB.id])}
      </div>

      {/* MATRIX TACTICAL COMPARISON */}
      <div className="max-w-4xl mx-auto w-full glass p-6 neon-border relative overflow-hidden">
         <div className="mesh-glow -top-20 -right-20 opacity-50" />
         <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#00F5FF] mb-6 border-b border-[#00F5FF]/20 pb-2">Telemetry Matrix</h3>

         <div className="flex flex-col gap-4 relative z-10">
            {Object.keys(productA.specs).map((specKey) => {
               const valA = Number(productA.specs[specKey]);
               const valB = Number(productB.specs[specKey]);
               const winner = getSpecWinner(valA, valB, specKey);

               return (
                 <div key={specKey} className="grid grid-cols-3 items-center gap-4 bg-black/40 rounded-md p-3 border border-white/5">
                    {/* A Value */}
                    <div className={cn("text-center font-mono text-sm md:text-base font-bold", winner === "A" ? "text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" : (winner === "B" ? "text-red-400 opacity-80" : "text-white"))}>
                       {productA.specs[specKey]}
                    </div>
                    {/* Spec Label */}
                    <div className="text-center font-bold text-[10px] md:text-xs text-white/50 uppercase tracking-widest break-words leading-tight">
                       {specKey}
                    </div>
                    {/* B Value */}
                    <div className={cn("text-center font-mono text-sm md:text-base font-bold", winner === "B" ? "text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" : (winner === "A" ? "text-red-400 opacity-80" : "text-white"))}>
                       {productB.specs[specKey]}
                    </div>
                 </div>
               )
            })}
         </div>
      </div>

      {/* VICTORY CARD */}
      <div className="max-w-4xl mx-auto w-full p-[2px] rounded-2xl bg-gradient-to-r from-[#00F5FF]/50 via-[#FFB800]/50 to-[#00F5FF]/50 animate-[shimmer_3s_linear_infinite] overflow-hidden group">
         <div className="bg-[#050810] rounded-2xl p-6 md:p-8 relative flex flex-col md:flex-row items-center gap-6 h-full w-full">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
            <div className="w-16 h-16 rounded-full bg-[#FFB800]/10 flex flex-shrink-0 items-center justify-center border border-[#FFB800]/30 shadow-[0_0_20px_rgba(255,184,0,0.2)]">
               <TrendingUp className="w-8 h-8 text-[#FFB800]" />
            </div>
            <div className="flex-1 text-center md:text-left">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Official Build Protocol Verdict</h4>
               <p className="text-lg md:text-xl font-bold text-white leading-relaxed">
                 {result.verdictReason}
               </p>
            </div>
         </div>
      </div>

      {/* SMART UPSELL */}
      <div className="max-w-4xl mx-auto w-full glass border-[#00F5FF]/30 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6 relative overflow-hidden bg-gradient-to-br from-[#00F5FF]/5 to-transparent">
         <div className="absolute top-0 left-0 w-1 h-full bg-[#00F5FF]" />
         <div className="w-24 h-24 relative rounded-xl overflow-hidden border border-white/20 flex-shrink-0">
             {result.upsell.imageUrl && <Image src={result.upsell.imageUrl} alt={result.upsell.name} fill className="object-cover" />}
         </div>
         <div className="flex-1">
            <Badge variant="outline" className="text-[#00F5FF] border-[#00F5FF]/30 mb-2">SMART ALTERNATIVE</Badge>
            <h4 className="text-xl font-black uppercase text-white mb-2 tracking-tight">{result.upsell.name}</h4>
            <p className="text-sm font-medium text-white/60 leading-relaxed mb-4">{result.upsell.reason}</p>
         </div>
         <div className="flex-shrink-0 w-full md:w-auto">
            <Button variant="cyber" className="w-full">
              VIEW UPSELL <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
         </div>
      </div>

    </div>
  );
}
