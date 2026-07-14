"use client"; // client-side interactivity for deal click tracking

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Flame, Tag, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type AdProduct = {
  name: string;
  price: string;
  originalPrice?: string;
  url?: string;
  productId?: string;
  network?: string;
};

function isHttpUrl(value: string | undefined): value is string {
  return Boolean(value && /^https?:\/\//i.test(value));
}

function trackAffiliateClick(product: AdProduct) {
  if (!product.productId || !product.network) return;
  fetch('/api/admin/affiliates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'track-click',
      productId: product.productId,
      network: product.network,
    }),
  }).catch(() => {});
}

export function AdBanner({ className, title = "SPONSOR SLOT", product }: { className?: string; title?: string; product?: AdProduct }) {
  const hasProductLink = Boolean(product && isHttpUrl(product.url));
  const displayName = product?.name || 'Editorial placement reserved';
  const displayPrice = product?.price || 'No product selected';
  const originalPrice = product?.originalPrice;

  return (
    <div className={cn("glass-panel relative flex flex-col sm:flex-row items-center justify-between p-4 min-h-[90px] overflow-hidden group border-[#00F2FF]/20 hex-panel", className)}>
      <div className="flex items-center gap-4 z-10 relative mb-4 sm:mb-0 w-full sm:w-auto">
        <div className="w-12 h-12 bg-[#00F2FF]/10 flex items-center justify-center hex-panel border border-[#00F2FF]/30 flex-shrink-0">
          <Zap className="w-6 h-6 text-[#00F2FF]" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#00F2FF]/80 font-bold mb-1">{title}</div>
          <div className="text-[#A0A0A0] text-sm font-black uppercase tracking-tight">{displayName}</div>
        </div>
      </div>

      <div className="z-10 relative flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
        <div className="text-right hidden md:block">
           {originalPrice && <div className="text-[10px] text-white/30 line-through">{originalPrice}</div>}
           <div className="text-[#FF5C00] font-black tracking-tighter">{displayPrice}</div>
        </div>
        {hasProductLink ? (
          <Button variant="amber" size="sm" className="h-10 text-[10px] w-full sm:w-auto" asChild>
            <Link href={product!.url!} target="_blank" rel="nofollow sponsored noopener noreferrer" onClick={() => trackAffiliateClick(product!)}>
              VIEW PICK
            </Link>
          </Button>
        ) : (
          <span className="border border-white/10 px-3 py-2 text-center text-[9px] font-black uppercase tracking-widest text-white/40">Editorial slot reserved</span>
        )}
      </div>

      <div className="absolute top-0 left-0 w-full h-[2px] bg-[#00F2FF]/50 shadow-[0_0_10px_#00F2FF] opacity-0 group-hover:animate-[scan_2s_ease-in-out_infinite]" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00F2FF]/5 to-transparent skew-x-[-20deg] group-hover:animate-[shimmer_2s_infinite]" />
    </div>
  );
}

export function AdInFeed({ className, product }: { className?: string; product?: AdProduct }) {
  const hasProductLink = Boolean(product && isHttpUrl(product.url));
  const displayName = product?.name || 'Editorial gear reference';
  const displayDesc = product?.price ? `Starting at ${product.price}` : 'No sponsored product selected';

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
         <h4 className="text-white font-black uppercase text-lg mb-2 tracking-tighter">{displayName}</h4>
         <p className="text-[#A0A0A0] text-[10px] uppercase tracking-widest leading-relaxed mb-4">{displayDesc}</p>
         {hasProductLink ? (
           <Button variant="outline" className="w-full text-[#FF5C00] border-[#FF5C00] hover:bg-[#FF5C00]/10 text-[10px] object-bottom mt-auto" asChild>
             <Link href={product!.url!} target="_blank" rel="nofollow sponsored noopener noreferrer" onClick={() => trackAffiliateClick(product!)}>
               SHOP NOW
             </Link>
           </Button>
         ) : (
           <span className="w-full border border-white/10 px-3 py-2 text-center text-[9px] font-black uppercase tracking-widest text-white/40">Editorial slot reserved</span>
         )}
      </div>
    </div>
  );
}

export function AdStickySidebar({ className, product }: { className?: string; product?: AdProduct }) {
  const hasProductLink = Boolean(product && isHttpUrl(product.url));
  const displayName = product?.name || 'Curated FPV gear guide';
  const displayPrice = product?.price || 'No product selected';

  return (
    <div className={cn("fpv-public-panel sticky top-24 flex flex-col rounded-xl p-4 bg-[#0A0A0B]/90", className)}>
       <div className="mb-4 text-center text-[10px] font-bold uppercase tracking-widest text-white/45">Reader-supported gear reference</div>
       <div className="flex flex-col gap-4">
         <div
           className={cn('group relative rounded-lg border border-white/10 bg-[#050505] p-3 transition-colors', hasProductLink && 'cursor-pointer hover:border-[#FF5C00]/50')}
         >
            <div className="absolute right-0 top-0 h-2 w-2 border-r border-t border-[#FF5C00]/50 opacity-0 transition-opacity group-hover:opacity-100" />

            <div className="relative mb-3 flex h-24 w-full items-center justify-center overflow-hidden rounded-md border border-[#FF5C00]/20 bg-gradient-to-br from-[#FF5C00]/15 to-transparent">
               <span className="z-10 border border-[#FF5C00]/30 bg-black/50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5C00] backdrop-blur-sm">Editorial pick</span>
            </div>
            <div className="mb-1 text-xs font-black uppercase tracking-tight text-zinc-300">{displayName}</div>
            <p className="mb-3 text-[10px] leading-4 text-zinc-500">
              Commercial links are disclosed and do not change editorial verdicts.
            </p>
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-[#FF5C00] font-black tracking-widest">{displayPrice}</div>
              {hasProductLink ? (
                <Link href={product!.url!} target="_blank" rel="nofollow sponsored noopener noreferrer" onClick={() => trackAffiliateClick(product!)} className="flex h-5 w-5 items-center justify-center rounded border border-[#FF5C00]/30 bg-[#FF5C00]/10">
                  <span className="text-[8px] text-[#FF5C00]">↗</span>
                </Link>
              ) : (
                <span className="text-[9px] uppercase tracking-widest text-white/35">Reference only</span>
              )}
            </div>
         </div>
       </div>
    </div>
  );
}
