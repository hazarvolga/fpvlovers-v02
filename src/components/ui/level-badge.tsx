import { cn } from '@/lib/utils';
import { getReaderLevelLabel, toReaderLevel } from '@/lib/content-taxonomy';
import type { Locale } from '@/lib/i18n/locale';

const levelStyles = {
  beginner: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  intermediate: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  advanced: 'border-red-500/30 bg-red-500/10 text-red-300',
} as const;

/** Skill-level pill derived from an article's `metadata.difficulty`. Renders nothing when unknown. */
export function LevelBadge({
  difficulty,
  className,
  locale = 'en',
}: {
  difficulty?: string;
  className?: string;
  locale?: Locale;
}) {
  const level = toReaderLevel(difficulty);
  if (!level) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest',
        levelStyles[level],
        className,
      )}
    >
      {getReaderLevelLabel(level, locale)}
    </span>
  );
}
