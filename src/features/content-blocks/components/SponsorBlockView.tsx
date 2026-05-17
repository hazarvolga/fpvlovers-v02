import { SponsorBlock } from '@/types/blocks';

export function SponsorBlockView({ block }: { block: SponsorBlock }) {
  return (
    <div className="sponsor-block rounded-lg border border-gray-700 bg-gray-800/30 p-3">
      <p className="text-xs text-gray-500 mb-1">Sponsor</p>
      <p className="text-sm text-gray-300">{block.sponsorName}</p>
      <p className="text-xs text-gray-500">{block.message}</p>
    </div>
  );
}
