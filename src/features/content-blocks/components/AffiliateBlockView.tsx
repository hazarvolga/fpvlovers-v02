import { AffiliateBlock } from '@/types/blocks';

export function AffiliateBlockView({ block }: { block: AffiliateBlock }) {
  return (
    <div className="affiliate-block rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-center justify-between">
      <p className="text-sm text-gray-200">{block.productName}</p>
      <a href={block.affiliateUrl} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">
        {block.ctaText} →
      </a>
    </div>
  );
}
