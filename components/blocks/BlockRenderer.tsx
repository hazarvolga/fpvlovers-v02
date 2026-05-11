'use client';

import { BlockResponse, BaseBlock } from '@/types/blocks';
import { TextBlockView } from './TextBlockView';
import { WarningBlockView } from './WarningBlockView';
import { RetrievalSourceBlockView } from './RetrievalSourceBlockView';
import { RecommendationBlockView } from './RecommendationBlockView';
import { AffiliateBlockView } from './AffiliateBlockView';
import { SponsorBlockView } from './SponsorBlockView';

interface Props { response: BlockResponse }

export function BlockRenderer({ response }: Props) {
  return (
    <div className={`block-layout layout-${response.layout} flex flex-col gap-4`}>
      {response.blocks.map(block => (
        <DynamicBlock key={block.id} block={block} />
      ))}
    </div>
  );
}

function DynamicBlock({ block }: { block: BaseBlock }) {
  switch (block.type) {
    case 'text_block':
      return <TextBlockView block={block as any} />;
    case 'warning_block':
      return <WarningBlockView block={block as any} />;
    case 'retrieval_source_block':
      return <RetrievalSourceBlockView block={block as any} />;
    case 'recommendation_block':
      return <RecommendationBlockView block={block as any} />;
    case 'affiliate_block':
      return <AffiliateBlockView block={block as any} />;
    case 'sponsor_block':
      return <SponsorBlockView block={block as any} />;
    default:
      return null;
  }
}
