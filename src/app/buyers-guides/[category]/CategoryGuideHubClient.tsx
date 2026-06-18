'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  BookOpen, Star, GitCompare, Award, ArrowRight, 
  ThumbsUp, ThumbsDown, HelpCircle 
} from 'lucide-react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import type { PublishedArtifact } from '@/lib/content-automation/content-reader';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 pt-28">
      <CyberBreadcrumb 
        items={[
          { label: 'Home', href: '/' }, 
          { label: 'Buyer Guides', href: '/buyers-guides' },
          { label: categoryTitle, isCurrentPage: true }
        ]} 
        className="mb-8" 
      />

      {/* Cockpit HUD Header */}
      <div 
        className="relative mb-12 flex flex-col items-center justify-center p-8 bg-[#050810] border hex-panel overflow-hidden shadow-[inset_0_0_80px_rgba(0,242,255,0.05)]"
        style={{ borderColor: `${categoryColor}30` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] opacity-60 pointer-events-none" />
        <div 
          className="absolute right-6 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full border opacity-10 blur-sm pointer-events-none hidden md:block"
          style={{ borderColor: categoryColor }}
        />
        <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter mb-2 relative z-10">
          {categoryTitle} <span style={{ color: categoryColor }}>Guides</span>
        </h1>
        <p className="text-xs font-mono text-[#A0A0A0] max-w-2xl leading-relaxed uppercase tracking-widest text-center relative z-10 mb-4">
          {categoryDescription}
        </p>
        <div className="text-[10px] font-mono uppercase tracking-widest px-3 py-1 bg-black/60 border border-white/10 rounded text-white/60">
          {"// "}Datastream: {totalCount} matching articles found
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="text-center py-20 border border-white/5 bg-[#050810]/40 rounded-lg">
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
                      className="hex-panel glass-panel border border-white/10 hover:border-[#FF5C00]/50 bg-[#050810]/60 transition-all duration-300 rounded-lg overflow-hidden flex flex-col group"
                    >
                      {coverImage && (
                        <div className="relative w-full h-40 bg-black/40 overflow-hidden">
                          <Image
                            src={coverImage}
                            alt={guide.title}
                            fill
                            className="object-cover opacity-70 group-hover:scale-105 transition-transform duration-500"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#050810] to-transparent" />
                        </div>
                      )}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-bold uppercase tracking-tight text-white mb-2 line-clamp-2 leading-snug group-hover:text-[#00F2FF] transition-colors">
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
                <Star className="w-5 h-5 text-[#EAB308]" /> Bench Reviews
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((rev) => {
                  const meta = rev.metadata!.review!;
                  const coverImage = rev.media?.coverImage?.src || rev.coverImage;
                  return (
                    <div
                      key={rev.slug}
                      className="hex-panel glass-panel border border-white/10 hover:border-[#FF5C00]/50 bg-[#050810]/60 transition-all duration-300 rounded-lg overflow-hidden flex flex-col group relative"
                    >
                      {/* Score Badge */}
                      <div className="absolute top-4 right-4 z-20 flex items-center justify-center w-12 h-12 rounded-full border border-[#00F2FF]/40 bg-black/90 font-mono text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-white leading-none">{meta.reviewScore}</span>
                          <span className="text-[6px] text-[#00F2FF] font-bold uppercase tracking-tighter">SCORE</span>
                        </div>
                      </div>

                      {coverImage && (
                        <div className="relative w-full h-40 bg-black/40 overflow-hidden">
                          <Image
                            src={coverImage}
                            alt={rev.title}
                            fill
                            className="object-cover opacity-70 group-hover:scale-105 transition-transform duration-500"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#050810] to-transparent" />
                        </div>
                      )}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="text-[9px] font-mono uppercase tracking-widest text-[#00F2FF] mb-1">
                            {meta.productBrand} &bull; {meta.releaseYear}
                          </div>
                          <h3 className="text-lg font-bold uppercase tracking-tight text-white mb-2 line-clamp-2 leading-snug group-hover:text-[#00F2FF] transition-colors">
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
                          Read Review
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
                <GitCompare className="w-5 h-5 text-[#00F2FF]" /> Head-to-Head Comparisons
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {comparisons.map((comp) => {
                  const meta = comp.metadata!.comparison!;
                  const coverImage = comp.media?.coverImage?.src || comp.coverImage;
                  return (
                    <div
                      key={comp.slug}
                      className="hex-panel glass-panel border border-white/10 hover:border-[#FF5C00]/50 bg-[#050810]/60 transition-all duration-300 rounded-lg overflow-hidden flex flex-col group"
                    >
                      {coverImage && (
                        <div className="relative w-full h-40 bg-black/40 overflow-hidden">
                          <Image
                            src={coverImage}
                            alt={comp.title}
                            fill
                            className="object-cover opacity-70 group-hover:scale-105 transition-transform duration-500"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#050810] to-transparent" />
                        </div>
                      )}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] font-mono text-[#FF5C00] font-black uppercase mb-2">
                            {meta.productA} VS {meta.productB}
                          </div>
                          <h3 className="text-lg font-bold uppercase tracking-tight text-white mb-2 line-clamp-2 leading-snug group-hover:text-[#00F2FF] transition-colors">
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
