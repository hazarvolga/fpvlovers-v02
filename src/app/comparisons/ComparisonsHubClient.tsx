'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Award, ArrowRight } from 'lucide-react';
import type { PublishedArtifact } from '@/lib/content-automation/content-reader';
import { trackComparisonClick } from '@/lib/analytics';

interface ComparisonsHubClientProps {
  initialComparisons: PublishedArtifact[];
}

export function ComparisonsHubClient({ initialComparisons }: ComparisonsHubClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Extract all unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const c of initialComparisons) {
      if (c.metadata?.comparison?.comparisonCategory) {
        cats.add(c.metadata.comparison.comparisonCategory);
      }
    }
    return Array.from(cats);
  }, [initialComparisons]);

  // Filter comparisons
  const filteredComparisons = useMemo(() => {
    if (selectedCategory === 'all') return initialComparisons;
    return initialComparisons.filter(
      c => c.metadata?.comparison?.comparisonCategory === selectedCategory
    );
  }, [initialComparisons, selectedCategory]);

  const handleComparisonClick = (slug: string, productA: string, productB: string) => {
    trackComparisonClick(slug, { productA, productB, component: 'comparisons_hub_grid' });
  };

  return (
    <div id="comparisons" className="mt-10">
      {/* Category Filter Tabs */}
      <div className="mb-8 flex flex-wrap gap-2 border-b border-white/10 pb-6">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`border px-4 py-2 font-mono text-xs font-black uppercase tracking-wider transition-all duration-300 ${
            selectedCategory === 'all'
              ? 'border-[#FF5C00] bg-[#FF5C00]/10 text-[#FF5C00] shadow-[0_0_18px_rgba(255,92,0,0.14)]'
              : 'border-white/10 text-white/60 hover:border-[#FF5C00]/40 hover:text-white'
          }`}
        >
          All Categories ({initialComparisons.length})
        </button>
        {categories.map((cat) => {
          const count = initialComparisons.filter(
            c => c.metadata?.comparison?.comparisonCategory === cat
          ).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-xs font-mono font-black uppercase border tracking-wider transition-all duration-300 ${
                selectedCategory === cat
                  ? 'border-[#FF5C00] bg-[#FF5C00]/10 text-[#FF5C00] shadow-[0_0_18px_rgba(255,92,0,0.14)]'
                  : 'border-white/10 text-white/60 hover:border-[#FF5C00]/40 hover:text-white'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {filteredComparisons.length === 0 ? (
        <div className="rounded-lg border border-white/5 bg-[#050810]/40 py-20 text-center">
          <p className="text-[#A0A0A0] font-mono text-sm uppercase tracking-widest">
            No published comparisons found matching selection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredComparisons.map((comp) => {
            const meta = comp.metadata!.comparison!;
            const coverImage = comp.media?.coverImage?.src || comp.coverImage;

            return (
              <div
                key={comp.slug}
                className="fpv-public-card fpv-public-card-hover group relative flex flex-col overflow-hidden rounded-lg transition-all duration-500"
              >
                {/* Cover Image */}
                {coverImage && (
                  <div className="relative h-48 w-full overflow-hidden border-b border-white/5 bg-black/50">
                    <Image
                      src={coverImage}
                      alt={`${meta.productA} vs ${meta.productB}`}
                      fill
                      className="object-cover opacity-68 transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050607] to-transparent" />
                  </div>
                )}

                <div className="flex flex-1 flex-col p-6 md:p-8">
                  {/* Category info */}
                  <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#ff9b71]">
                    <span className="font-black px-2 py-0.5 bg-white/5 border border-white/10 rounded text-white/80">
                      VS Matchup
                    </span>
                    <span>&bull;</span>
                    <span>{meta.comparisonCategory}</span>
                    <span>&bull;</span>
                    <span className="text-white/55">Editorial comparison</span>
                  </div>

                  {/* Versus Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <div className="text-xs font-mono text-white/40 uppercase">Product A</div>
                      <div className="text-lg font-black text-white truncate">{meta.productA}</div>
                    </div>
                    <div className="px-3 py-1 bg-white/5 border border-white/10 rounded text-xs font-mono font-black text-[#FF5C00] tracking-tighter">
                      VS
                    </div>
                    <div className="flex-1 text-right">
                      <div className="text-xs font-mono text-white/40 uppercase">Product B</div>
                      <div className="text-lg font-black text-white truncate">{meta.productB}</div>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="mb-4 text-xl font-bold uppercase leading-tight tracking-tight text-white transition-colors group-hover:text-[#FF5C00]">
                    {comp.title}
                  </h3>

                  {/* Verdict evidence badge */}
                  <div className="mb-6 flex items-center justify-between rounded-lg border border-white/5 bg-zinc-950/80 p-4">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-[#00FF66]" />
                      <div>
                        <div className="font-mono text-[8px] uppercase tracking-widest text-white/40">BEST FIT</div>
                        <div className="text-sm font-mono font-black text-white uppercase">{meta.winner}</div>
                      </div>
                    </div>
                    <div className="rounded border border-[#FF5C00]/25 bg-[#FF5C00]/10 px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-[#FF5C00]">
                      {meta.winner.toLowerCase() === 'tie' ? 'DRAW' : 'CONTEXTUAL'}
                    </div>
                  </div>

                  {/* Excerpt */}
                  {comp.excerpt && (
                    <p className="text-sm text-white/70 font-sans mb-6 line-clamp-3 leading-relaxed">
                      {comp.excerpt}
                    </p>
                  )}

                  {/* Read Comparison CTA */}
                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <Link
                      href={`/article/${comp.slug}`}
                      className="inline-flex min-h-11 items-center gap-2 text-xs font-mono font-black uppercase tracking-widest text-white/80 hover:text-[#FF5C00] transition-colors group/link"
                      onClick={() => handleComparisonClick(comp.slug, meta.productA, meta.productB)}
                    >
                      Read Full Comparison
                      <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1.5 transition-all text-[#FF5C00]" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
