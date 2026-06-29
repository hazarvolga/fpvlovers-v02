'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen, Star, GitCompare, Award, ArrowRight,
  HelpCircle
} from 'lucide-react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import type { PublishedArtifact } from '@/lib/content-automation/content-reader';
import { isApprovedHandsOnReview } from '@/lib/content-automation/editorial-governance';
import {
  trackBuyerGuideClick,
  trackReviewClick,
  trackComparisonClick
} from '@/lib/analytics';

interface CategoryGuideHubClientProps {
  categoryTitle: string;
  categoryDescription: string;
  categorySlug: string;
  categoryColor: string;
  guides: PublishedArtifact[];
  reviews: PublishedArtifact[];
  comparisons: PublishedArtifact[];
}

export function CategoryGuideHubClient({
  categoryTitle,
  categoryDescription,
  categorySlug,
  categoryColor,
  guides,
  reviews,
  comparisons,
}: CategoryGuideHubClientProps) {
  const totalCount = guides.length + reviews.length + comparisons.length;

  return (
    <div className="fpv-public-shell mx-auto max-w-7xl px-4 py-12 pt-28 sm:px-6">
      <CyberBreadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Buyer Guides', href: '/buyers-guides' },
          { label: categoryTitle, isCurrentPage: true }
        ]}
        className="mb-8"
      />

      {/* Editorial category header */}
      <div
        className="fpv-public-panel relative mb-12 flex flex-col items-center justify-center overflow-hidden rounded-xl bg-[#050810] p-8"
        style={{ borderColor: `${categoryColor}30` }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,92,0,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,92,0,0.025)_1px,transparent_1px)] bg-[size:20px_20px] opacity-60" />
        <div
          className="pointer-events-none absolute right-6 top-1/2 hidden h-32 w-32 -translate-y-1/2 rounded-full border opacity-10 blur-sm md:block"
          style={{ borderColor: categoryColor }}
        />
        <p className="fpv-kicker relative z-10 mb-4">Buyer Guide Category</p>
        <h1 className="relative z-10 mb-2 text-4xl font-black uppercase tracking-tighter text-white md:text-5xl">
          {categoryTitle} <span style={{ color: categoryColor }}>Guides</span>
        </h1>
        <p className="relative z-10 mb-4 max-w-2xl text-center font-mono text-xs uppercase leading-relaxed tracking-widest text-[#A0A0A0]">
          {categoryDescription}
        </p>
        <div className="rounded border border-white/10 bg-black/60 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white/60">
          {totalCount} matching editorial resources
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="rounded-lg border border-white/5 bg-[#050810]/40 py-20 text-center">
          <HelpCircle className="w-12 h-12 text-[#FF5C00] mx-auto mb-4 animate-bounce" />
          <h3 className="text-lg font-mono font-black uppercase text-white tracking-widest mb-2">No Content Available</h3>
          <p className="text-[#A0A0A0] font-sans text-sm max-w-md mx-auto">
            Our autonomous content pipelines have not generated guides, reviews, or comparisons for this category yet. Check back soon.
          </p>
        </div>
      ) : (
        <div className="space-y-16">
          {/* 1. Buyer Guides & Roundups Section */}
          {guides.length > 0 && (
            <div>
              <h2 className="text-xl font-mono font-black uppercase text-white tracking-widest mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5" style={{ color: categoryColor }} /> Buyer Guides & Roundups
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {guides.map((guide) => {
                  const coverImage = guide.media?.coverImage?.src || guide.coverImage;
                  return (
                    <div
                      key={guide.slug}
                      className="fpv-public-card fpv-public-card-hover group flex flex-col overflow-hidden rounded-lg transition-all duration-300"
                    >
                      {coverImage && (
                        <div className="relative h-40 w-full overflow-hidden bg-black/40">
                          <Image
                            src={coverImage}
                            alt={guide.title}
                            fill
                            className="object-cover opacity-72 transition-transform duration-500 group-hover:scale-105"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#050607] to-transparent" />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col justify-between p-5">
                        <div>
                          <h3 className="mb-2 line-clamp-2 text-lg font-bold uppercase leading-snug tracking-tight text-white transition-colors group-hover:text-[#FF5C00]">
                            {guide.title}
                          </h3>
                          {guide.excerpt && (
                            <p className="text-xs text-white/60 font-sans leading-relaxed mb-6 line-clamp-3">
                              {guide.excerpt}
                            </p>
                          )}
                        </div>
                        <Link
                          href={`/article/${guide.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-mono font-black uppercase text-[#FF5C00] hover:text-white transition-colors group/link"
                          onClick={() => trackBuyerGuideClick(guide.slug, { category: categorySlug, component: 'category_guide_hub' })}
                        >
                          Open Guide
                          <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Reviews Section */}
          {reviews.length > 0 && (
            <div>
              <h2 className="text-xl font-mono font-black uppercase text-white tracking-widest mb-6 flex items-center gap-2">
                <Star className="w-5 h-5 text-[#EAB308]" /> Product Assessments
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((rev) => {
                  const meta = rev.metadata!.review!;
                  const coverImage = rev.media?.coverImage?.src || rev.coverImage;
                  const showScore = isApprovedHandsOnReview(rev.editorial);
                  return (
                    <div
                      key={rev.slug}
                      className="fpv-public-card fpv-public-card-hover group relative flex flex-col overflow-hidden rounded-lg transition-all duration-300"
                    >
                      {/* Evidence badge */}
                      <div className="absolute right-4 top-4 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-[#FF5C00]/60 bg-black/90 text-center font-mono">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black leading-none text-white">{showScore ? meta.reviewScore : 'SPEC'}</span>
                          <span className="text-[6px] font-bold uppercase tracking-tighter text-[#FF5C00]">{showScore ? 'SCORE' : 'ASSESS'}</span>
                        </div>
                      </div>

                      {coverImage && (
                        <div className="relative h-40 w-full overflow-hidden bg-black/40">
                          <Image
                            src={coverImage}
                            alt={rev.title}
                            fill
                            className="object-cover opacity-72 transition-transform duration-500 group-hover:scale-105"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#050607] to-transparent" />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col justify-between p-5">
                        <div>
                          <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-[#ff9b71]">
                            {meta.productBrand} &bull; {meta.releaseYear}
                          </div>
                          <h3 className="mb-2 line-clamp-2 text-lg font-bold uppercase leading-snug tracking-tight text-white transition-colors group-hover:text-[#FF5C00]">
                            {rev.title}
                          </h3>
                          {meta.bestFor && (
                            <div className="mb-4 text-[10px] font-mono text-[#00FF66] uppercase">
                              Best for: {meta.bestFor}
                            </div>
                          )}
                        </div>
                        <Link
                          href={`/article/${rev.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-mono font-black uppercase text-[#FF5C00] hover:text-white transition-colors group/link"
                          onClick={() => trackReviewClick(rev.slug, { brand: meta.productBrand, model: meta.productModel, category: categorySlug, component: 'category_guide_hub' })}
                        >
                          {showScore ? 'Read Review' : 'Read Assessment'}
                          <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Comparisons Section */}
          {comparisons.length > 0 && (
            <div>
              <h2 className="text-xl font-mono font-black uppercase text-white tracking-widest mb-6 flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-[#FF5C00]" /> Head-to-Head Comparisons
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {comparisons.map((comp) => {
                  const meta = comp.metadata!.comparison!;
                  const coverImage = comp.media?.coverImage?.src || comp.coverImage;
                  return (
                    <div
                      key={comp.slug}
                      className="fpv-public-card fpv-public-card-hover group flex flex-col overflow-hidden rounded-lg transition-all duration-300"
                    >
                      {coverImage && (
                        <div className="relative h-40 w-full overflow-hidden bg-black/40">
                          <Image
                            src={coverImage}
                            alt={comp.title}
                            fill
                            className="object-cover opacity-72 transition-transform duration-500 group-hover:scale-105"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#050607] to-transparent" />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col justify-between p-5">
                        <div>
                          <div className="text-[10px] font-mono text-[#FF5C00] font-black uppercase mb-2">
                            {meta.productA} VS {meta.productB}
                          </div>
                          <h3 className="mb-2 line-clamp-2 text-lg font-bold uppercase leading-snug tracking-tight text-white transition-colors group-hover:text-[#FF5C00]">
                            {comp.title}
                          </h3>
                          <div className="mb-4 inline-flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-mono uppercase text-white/80">
                            <Award className="w-3.5 h-3.5 text-[#00FF66]" />
                            <span>Winner: {meta.winner}</span>
                          </div>
                        </div>
                        <Link
                          href={`/article/${comp.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-mono font-black uppercase text-[#FF5C00] hover:text-white transition-colors group/link"
                          onClick={() => trackComparisonClick(comp.slug, { productA: meta.productA, productB: meta.productB, category: categorySlug, component: 'category_guide_hub' })}
                        >
                          Read Comparison
                          <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
