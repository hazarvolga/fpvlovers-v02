import { WarningBlock } from '@/types/blocks';

export function WarningBlockView({ block }: { block: WarningBlock }) {
  const colors: Record<string, string> = { info: 'blue', caution: 'yellow', danger: 'red' };
  const c = colors[block.severity] || 'gray';
  return (
    <div className={`warning-block rounded-lg border border-${c}-500/40 bg-${c}-500/10 p-3`}>
      <p className={`text-xs text-${c}-300`}>{block.message}</p>
    </div>
  );
}
