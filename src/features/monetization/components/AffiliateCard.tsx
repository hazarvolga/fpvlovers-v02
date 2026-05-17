import React from 'react';
import { ShoppingCart, Zap, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

interface AffiliateCardProps {
  title: string;
  description: string;
  price: string;
  url: string;
  image: string;
  tag?: string;
  className?: string;
}

export function AffiliateCard({ title, description, price, url, image, tag, className }: AffiliateCardProps) {
  return (
    <div className={cn("glass-panel p-4 flex flex-col sm:flex-row gap-6 relative group overflow-hidden hex-panel border-[#333333] hover:border-[#FF5C00]/50 transition-colors", className)}>
      {/* Decorative Background */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#FF5C00]/5 rounded-full blur-2xl group-hover:bg-[#FF5C00]/10 transition-colors pointer-events-none" />

      {/* Image Section */}
      <div className="relative w-full sm:w-32 h-32 bg-black/50 border border-[#1A1A1A] hex-panel flex-shrink-0 overflow-hidden flex items-center justify-center">
         <Image
           src={image}
           alt={title}
           fill
           className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
         />
         <div className="absolute inset-0 bg-[#00F2FF]/10 mix-blend-overlay" />
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 z-10 justify-center">
         {tag && (
            <div className="flex items-center gap-1.5 mb-2">
               <Zap className="w-3 h-3 text-[#FF5C00]" />
               <span className="text-[9px] font-black uppercase tracking-widest text-[#FF5C00]">{tag}</span>
            </div>
         )}
         <h4 className="text-lg font-black uppercase tracking-tight text-[#f8fafc] mb-1 group-hover:text-[#00F2FF] transition-colors">{title}</h4>
         <p className="text-xs font-mono text-[#A0A0A0] line-clamp-2 leading-relaxed mb-4">{description}</p>

         <div className="mt-auto flex items-center justify-between border-t border-[#333333]/50 pt-3">
            <div className="text-lg font-black tracking-tighter text-[#A0A0A0]">{price}</div>
            <Button variant="amber" size="sm" asChild className="h-8 text-[10px] gap-2">
               <Link href={url} target="_blank" rel="noopener noreferrer">
                 ACQUIRE <ShoppingCart className="w-3 h-3" />
               </Link>
            </Button>
         </div>
      </div>
    </div>
  );
}
