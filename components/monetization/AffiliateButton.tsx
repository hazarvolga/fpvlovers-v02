import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AffiliateButtonProps {
  url: string;
  price?: string;
  label?: string;
  provider?: 'Amazon' | 'Banggood' | 'Direct';
  className?: string;
}

export function AffiliateButton({ url, price, label = "Check Price", provider = "Amazon", className }: AffiliateButtonProps) {
  return (
    <Button 
      variant="amber" 
      size="lg" 
      className={cn("w-full sm:w-auto relative group overflow-hidden shine-effect", className)}
      asChild
    >
      <a href={url} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-2">
        <ShoppingCart className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
        <span className="flex flex-col items-start leading-none">
          <span className="text-[10px] font-bold tracking-widest uppercase opacity-80">{provider}</span>
          <span className="text-sm font-black tracking-tighter uppercase">{price ? `${price} - ${label}` : label}</span>
        </span>
        <ExternalLink className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        
        {/* Subtle shine animation overlay */}
        <div className="absolute inset-0 -translate-x-[150%] animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" />
      </a>
    </Button>
  );
}
