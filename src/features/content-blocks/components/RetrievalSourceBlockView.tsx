import { RetrievalSourceBlock } from '@/types/blocks';

export function RetrievalSourceBlockView({ block }: { block: RetrievalSourceBlock }) {
  return (
    <div className="retrieval-source-block rounded-lg bg-gray-800/50 p-3">
      <p className="text-xs text-gray-500 mb-1">Kaynaklar ({block.confidence})</p>
      {block.sources.map((s, i) => (
        <div key={i} className="text-xs text-gray-400">
          {s.dataset} — {(s.score * 100).toFixed(0)}%
        </div>
      ))}
    </div>
  );
}
