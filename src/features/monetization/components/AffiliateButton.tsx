import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackAffiliateClick } from '@/lib/analytics';

interface AffiliateButtonProps {
  url: string;
  price?: string;
  label?: string;
  provider?: string;
  className?: string;
  productId?: string;
  network?: string;
  articleSlug?: string;
}

function trackClick(productId: string, network: string) {
  fetch('/api/admin/affiliates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'track-click', productId, network }),
  }).catch(() => {});
}

export function AffiliateButton({ url, price, label = "Check Price", provider = "Amazon", className, productId, network, articleSlug }: AffiliateButtonProps) {
  const handleClick = () => {
    if (productId && network) {
      trackClick(productId, network);
    }
    trackAffiliateClick(articleSlug || 'direct', provider, url, {
      price,
      label,
      productId,
      network
    });
  };


  return (
    <Button
      variant="amber"
      size="lg"
      className={cn("w-full sm:w-auto relative group overflow-hidden shine-effect", className)}
      asChild
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow sponsored"
        className="flex items-center gap-2"
        onClick={handleClick}
      >
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
