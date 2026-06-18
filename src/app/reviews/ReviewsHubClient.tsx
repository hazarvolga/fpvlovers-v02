'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Shield, ThumbsUp, ThumbsDown, Award, Star, ArrowRight } from 'lucide-react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import type { PublishedArtifact } from '@/lib/content-automation/content-reader';
import { trackReviewClick } from '@/lib/analytics';

interface ReviewsHubClientProps {
  initialReviews: PublishedArtifact[];
}

export function ReviewsHubClient({ initialReviews }: ReviewsHubClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Extract all unique categories from the reviews
  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const r of initialReviews) {
      if (r.metadata?.review?.productCategory) {
        cats.add(r.metadata.review.productCategory);
      }
    }
    return Array.from(cats);
  }, [initialReviews]);

  // Filter reviews
  const filteredReviews = useMemo(() => {
    if (selectedCategory === 'all') return initialReviews;
    return initialReviews.filter(
      r => r.metadata?.review?.productCategory === selectedCategory
    );
  }, [initialReviews, selectedCategory]);

  const handleReviewClick = (slug: string, brand: string, model: string) => {
    trackReviewClick(slug, { brand, model, component: 'reviews_hub_grid' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 pt-28">
      <CyberBreadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Reviews', isCurrentPage: true }
        ]}
        className="mb-8"
      />

      {/* Cockpit HUD Header */}
      <div className="relative mb-12 flex flex-col items-center justify-center p-8 bg-[#050810] border border-[#00F2FF]/20 hex-panel overflow-hidden shadow-[inset_0_0_80px_rgba(0,242,255,0.05)]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] opacity-60 pointer-events-none" />
        <Star className="w-16 h-16 text-[#00F2FF] mb-4 relative z-10 animate-pulse" />
        <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter mb-2 relative z-10">
          Hardware <span className="text-[#00F2FF]">Reviews</span>
        </h1>
        <p className="text-xs font-mono text-[#00F2FF] max-w-2xl leading-relaxed uppercase tracking-widest text-center relative z-10">
          {"// DEEP LAB BENCH TESTS. UNBIASED TELEMETRY, SPEC SHEET DISSECTIONS AND PERFORMANCE METRICS."}
        </p>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-6">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 text-xs font-mono font-black uppercase border tracking-wider transition-all duration-300 ${
            selectedCategory === 'all'
              ? 'bg-[#00F2FF]/10 border-[#00F2FF] text-[#00F2FF] shadow-[0_0_15px_rgba(0,242,255,0.15)]'
              : 'border-white/10 text-white/60 hover:border-white/30 hover:text-white'
          }`}
        >
          All Categories ({initialReviews.length})
        </button>
        {categories.map((cat) => {
          const count = initialReviews.filter(
            r => r.metadata?.review?.productCategory === cat
          ).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-xs font-mono font-black uppercase border tracking-wider transition-all duration-300 ${
                selectedCategory === cat
                  ? 'bg-[#00F2FF]/10 border-[#00F2FF] text-[#00F2FF] shadow-[0_0_15px_rgba(0,242,255,0.15)]'
                  : 'border-white/10 text-white/60 hover:border-white/30 hover:text-white'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {filteredReviews.length === 0 ? (
        <div className="text-center py-20 border border-white/5 bg-[#050810]/40 rounded-lg">
          <p className="text-[#A0A0A0] font-mono text-sm uppercase tracking-widest">
            No published reviews found matching selection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredReviews.map((rev) => {
            const meta = rev.metadata!.review!;
            const coverImage = rev.media?.coverImage?.src || rev.coverImage;

            return (
              <div
                key={rev.slug}
                className="hex-panel glass-panel border border-white/10 bg-[#050810]/70 hover:border-[#FF5C00]/50 transition-all duration-500 rounded-lg overflow-hidden flex flex-col group relative"
              >
                {/* Score telemetry badge */}
                <div className="absolute top-4 right-4 z-20 flex items-center justify-center w-14 h-14 rounded-full border-2 border-[#00F2FF] bg-black/80 shadow-[0_0_15px_rgba(0,242,255,0.2)] font-mono text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-black text-white leading-none">{meta.reviewScore}</span>
                    <span className="text-[7px] text-[#00F2FF] font-bold uppercase tracking-tighter">SCORE</span>
                  </div>
                </div>

                {/* Cover Image */}
                {coverImage && (
                  <div className="relative w-full h-48 bg-black/50 border-b border-white/5 overflow-hidden">
                    <Image
                      src={coverImage}
                      alt={`${meta.productBrand} ${meta.productModel}`}
                      fill
                      className="object-cover opacity-70 group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050810] to-transparent" />
                  </div>
                )}

                <div className="p-6 md:p-8 flex-1 flex flex-col">
                  {/* Brand & Category info */}
                  <div className="flex items-center gap-2 mb-3 text-[10px] font-mono uppercase tracking-widest text-[#00F2FF]">
                    <span className="font-black px-2 py-0.5 bg-white/5 border border-white/10 rounded text-white/80">
                      {meta.productBrand}
                    </span>
                    <span>&bull;</span>
                    <span>{meta.productCategory}</span>
                    <span>&bull;</span>
                    <span className="text-white/40">{meta.releaseYear}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-3 group-hover:text-[#FF5C00] transition-colors leading-tight">
                    {rev.title}
                  </h3>

                  {/* Best For Badge */}
                  {meta.bestFor && (
                    <div className="mb-4 inline-flex items-center gap-1.5 p-2 bg-[#00FF66]/10 border border-[#00FF66]/20 rounded text-[10px] font-mono uppercase text-[#00FF66]">
                      <Award className="w-3.5 h-3.5" />
                      <span>Best For: {meta.bestFor}</span>
                    </div>
                  )}

                  {/* Excerpt */}
                  {rev.excerpt && (
                    <p className="text-sm text-white/70 font-sans mb-6 line-clamp-2 leading-relaxed">
                      {rev.excerpt}
                    </p>
                  )}

                  {/* Pros & Cons (Grid) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 pt-4 border-t border-white/5">
                    {/* Pros */}
                    <div>
                      <h4 className="text-[10px] font-mono font-black uppercase tracking-wider text-[#00FF66] mb-2 flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5" /> PROS
                      </h4>
                      <ul className="space-y-1.5">
                        {meta.pros.slice(0, 3).map((pro, index) => (
                          <li key={index} className="text-[11px] font-mono text-[#A0A0A0] leading-snug flex items-start gap-1">
                            <span className="text-[#00FF66] shrink-0 font-bold">+</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Cons */}
                    <div>
                      <h4 className="text-[10px] font-mono font-black uppercase tracking-wider text-[#FF5C00] mb-2 flex items-center gap-1">
                        <ThumbsDown className="w-3.5 h-3.5" /> CONS
                      </h4>
                      <ul className="space-y-1.5">
                        {meta.cons.slice(0, 3).map((con, index) => (
                          <li key={index} className="text-[11px] font-mono text-[#A0A0A0] leading-snug flex items-start gap-1">
                            <span className="text-[#FF5C00] shrink-0 font-bold">-</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Read Review CTA */}
                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <Link
                      href={`/article/${rev.slug}`}
                      className="inline-flex items-center gap-2 text-xs font-mono font-black uppercase tracking-widest text-white/80 hover:text-[#FF5C00] transition-colors group/link"
                      onClick={() => handleReviewClick(rev.slug, meta.productBrand, meta.productModel)}
                    >
                      Read Full Review
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
