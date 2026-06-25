'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen, Eye, Radio, Battery, Video, HelpCircle,
  Compass, ArrowRight, Gauge, Layers
} from 'lucide-react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import type { PublishedArtifact } from '@/lib/content-automation/content-reader';
import {
  BUYERS_GUIDE_CATEGORIES,
  type BuyersGuideIconKey,
} from '@/lib/buyers-guide-categories';
import { trackBuyerGuideClick } from '@/lib/analytics';

const CATEGORY_ICONS = {
  eye: Eye,
  radio: Radio,
  video: Video,
  battery: Battery,
  layers: Layers,
  compass: Compass,
  help: HelpCircle,
} satisfies Record<BuyersGuideIconKey, React.ComponentType<{ className?: string }>>;

interface BuyersGuidesHubClientProps {
  initialGuides: PublishedArtifact[];
}

export function BuyersGuidesHubClient({ initialGuides }: BuyersGuidesHubClientProps) {
  const handleGuideClick = (slug: string) => {
    trackBuyerGuideClick(slug, { component: 'buyers_guides_hub_list' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 pt-28">
      <CyberBreadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Buyer Guides', isCurrentPage: true }
        ]}
        className="mb-8"
      />

      {/* Cockpit HUD Header */}
      <div className="relative mb-12 flex flex-col items-center justify-center p-8 bg-[#050810] border border-[#00F2FF]/20 hex-panel overflow-hidden shadow-[inset_0_0_80px_rgba(0,242,255,0.05)]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] opacity-60 pointer-events-none" />
        <BookOpen className="w-16 h-16 text-[#00F2FF] mb-4 relative z-10 animate-pulse" />
        <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter mb-2 relative z-10">
          Buyer <span className="text-[#00F2FF]">Guides</span>
        </h1>
        <p className="text-xs font-mono text-[#00F2FF] max-w-2xl leading-relaxed uppercase tracking-widest text-center relative z-10">
          {"// EMPIRICAL SELECTION HANDBOOKS. AGGREGATING REVIEWS, COMPARISONS AND RECOMMENDATIONS."}
        </p>
      </div>

      {/* 7 Core Aggregator Hub Cards */}
      <h2 className="text-lg font-mono font-black uppercase text-white tracking-widest mb-6 flex items-center gap-2">
        <Gauge className="w-5 h-5 text-[#00F2FF]" /> Shop By Component Class
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {BUYERS_GUIDE_CATEGORIES.map((cat) => {
          const IconComponent = CATEGORY_ICONS[cat.iconKey];
          // Calculate matching guides for this category tab
          const matchingCount = initialGuides.filter(
            g => g.metadata && cat.matcher(g.metadata)
          ).length;

          return (
            <div
              key={cat.slug}
              className="hex-panel glass-panel border border-white/10 hover:border-[#00F2FF]/50 bg-[#050810]/40 transition-all duration-300 p-6 flex flex-col justify-between group rounded-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="p-3 border rounded-lg bg-black/40"
                    style={{ borderColor: `${cat.color}20`, color: cat.color }}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono text-white/40 uppercase font-black">
                    {matchingCount} {matchingCount === 1 ? 'Guide' : 'Guides'}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white uppercase mb-2 group-hover:text-[#00F2FF] transition-colors">
                  {cat.title}
                </h3>
                <p className="text-xs text-white/60 font-sans leading-relaxed mb-6">
                  {cat.description}
                </p>
              </div>

              <Link
                href={`/buyers-guides/${cat.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-black uppercase text-[#00F2FF] hover:text-[#FF5C00] transition-colors"
              >
                Browse Guides
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          );
        })}
      </div>

      {/* List of guides */}
      <h2 className="text-lg font-mono font-black uppercase text-white tracking-widest mb-6 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-[#FF5C00]" /> Published Buying Handbooks
      </h2>

      {initialGuides.length === 0 ? (
        <div className="text-center py-16 border border-white/5 bg-[#050810]/40 rounded-lg">
          <p className="text-[#A0A0A0] font-mono text-sm uppercase tracking-widest">
            No published buyer guides or roundups found.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {initialGuides.map((guide) => {
            const coverImage = guide.media?.coverImage?.src || guide.coverImage;
            const isRoundup = guide.metadata?.contentType === 'product-roundup';

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
                    <div className="flex items-center gap-2 mb-2 text-[9px] font-mono uppercase tracking-widest text-[#00F2FF]">
                      <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded font-black text-white/80">
                        {isRoundup ? 'Roundup' : 'Buyer Guide'}
                      </span>
                      <span>&bull;</span>
                      <span>{guide.category}</span>
                    </div>
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
                    onClick={() => handleGuideClick(guide.slug)}
                  >
                    Open Guide
                    <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
