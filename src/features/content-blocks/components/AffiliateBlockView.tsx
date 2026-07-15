import { AffiliateBlock } from '@/types/blocks';
import { isSafeExternalHttpUrl } from '@/lib/monetization/safe-external-url';

export function AffiliateBlockView({ block }: { block: AffiliateBlock }) {
  if (!isSafeExternalHttpUrl(block.affiliateUrl)) {
    return (
      <div className="affiliate-block rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-100">
        Product source pending verification. No purchase link is shown until a real retailer or affiliate URL is recorded.
      </div>
    );
  }

  return (
    <div className="affiliate-block rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-center justify-between">
      <p className="text-sm text-gray-200">{block.productName}</p>
      <a
        href={block.affiliateUrl}
        target="_blank"
        rel="noopener noreferrer nofollow sponsored"
        className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
      >
        {block.ctaText} →
      </a>
    </div>
  );
}
