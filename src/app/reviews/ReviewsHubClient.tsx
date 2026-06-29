'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ThumbsUp, ThumbsDown, Award, ArrowRight } from 'lucide-react';
import type { PublishedArtifact } from '@/lib/content-automation/content-reader';
import { trackReviewClick } from '@/lib/analytics';
import { isApprovedHandsOnReview } from '@/lib/content-automation/editorial-governance';

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
    <div id="reviews" className="mt-10">
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
                  ? 'border-[#FF5C00] bg-[#FF5C00]/10 text-[#FF5C00] shadow-[0_0_18px_rgba(255,92,0,0.14)]'
                  : 'border-white/10 text-white/60 hover:border-[#FF5C00]/40 hover:text-white'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {filteredReviews.length === 0 ? (
        <div className="rounded-lg border border-white/5 bg-[#050810]/40 py-20 text-center">
          <p className="text-[#A0A0A0] font-mono text-sm uppercase tracking-widest">
            No published reviews found matching selection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredReviews.map((rev) => {
            const meta = rev.metadata!.review!;
            const coverImage = rev.media?.coverImage?.src || rev.coverImage;
            const showScore = isApprovedHandsOnReview(rev.editorial);

            return (
              <div
                key={rev.slug}
                className="fpv-public-card fpv-public-card-hover group relative flex flex-col overflow-hidden rounded-lg transition-all duration-500"
              >
                {/* Evidence badge */}
                <div className="absolute right-4 top-4 z-20 flex h-14 min-w-14 items-center justify-center rounded-full border-2 border-[#FF5C00]/70 bg-black/85 px-2 text-center font-mono shadow-[0_0_18px_rgba(255,92,0,0.18)]">
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-black leading-none text-white">{showScore ? meta.reviewScore : 'SPEC'}</span>
                    <span className="text-[7px] font-bold uppercase tracking-tighter text-[#FF5C00]">{showScore ? 'SCORE' : 'ASSESS'}</span>
                  </div>
                </div>

                {/* Cover Image */}
                {coverImage && (
                  <div className="relative h-48 w-full overflow-hidden border-b border-white/5 bg-black/50">
                    <Image
                      src={coverImage}
                      alt={`${meta.productBrand} ${meta.productModel}`}
                      fill
                      className="object-cover opacity-72 transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050607] to-transparent" />
                  </div>
                )}

                <div className="flex flex-1 flex-col p-6 md:p-8">
                  {/* Brand & Category info */}
                  <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#ff9b71]">
                    <span className="font-black px-2 py-0.5 bg-white/5 border border-white/10 rounded text-white/80">
                      {meta.productBrand}
                    </span>
                    <span>&bull;</span>
                    <span>{meta.productCategory}</span>
                    <span>&bull;</span>
                    <span className="text-white/40">{meta.releaseYear}</span>
                  </div>

                  {/* Title */}
                  <h3 className="mb-3 text-2xl font-black uppercase leading-tight tracking-tight text-white transition-colors group-hover:text-[#FF5C00]">
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
                      {showScore ? 'Read Full Review' : 'Read Assessment'}
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
