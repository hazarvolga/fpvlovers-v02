import { RecommendationBlock } from '@/types/blocks';

export function RecommendationBlockView({ block }: { block: RecommendationBlock }) {
  return (
    <div className="recommendation-block grid gap-2">
      {block.items.map((item, i) => (
        <div key={i} className="rounded-lg bg-gray-800 p-3">
          <p className="text-sm font-medium text-white">{item.title}</p>
          <p className="text-xs text-gray-400">{item.reason}</p>
        </div>
      ))}
    </div>
  );
}
