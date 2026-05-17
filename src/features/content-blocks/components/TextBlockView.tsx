import { TextBlock } from '@/types/blocks';

export function TextBlockView({ block }: { block: TextBlock }) {
  return (
    <div className="text-block rounded-lg bg-gray-900 p-4">
      {block.heading && <h3 className="text-sm font-semibold text-gray-400 mb-2">{block.heading}</h3>}
      <p className="text-sm text-gray-200">{block.content}</p>
    </div>
  );
}
