'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen, Eye, Radio, Battery, Video, HelpCircle,
  Compass, ArrowRight, Gauge, Layers
} from 'lucide-react';
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
    <div id="guides" className="mt-10">
      {/* 7 Core Aggregator Hub Cards */}
      <h2 className="mb-6 flex items-center gap-2 font-mono text-lg font-black uppercase tracking-widest text-white">
        <Gauge className="h-5 w-5 text-[#FF5C00]" /> Shop By Component Class
      </h2>
      <div className="mb-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {BUYERS_GUIDE_CATEGORIES.map((cat) => {
          const IconComponent = CATEGORY_ICONS[cat.iconKey];
          // Calculate matching guides for this category tab
          const matchingCount = initialGuides.filter(
            g => g.metadata && cat.matcher(g.metadata)
          ).length;

          return (
            <div
              key={cat.slug}
              className="fpv-public-card fpv-public-card-hover group flex flex-col justify-between rounded-lg p-6 transition-all duration-300"
            >
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div
                    className="rounded-lg border bg-black/40 p-3"
                    style={{ borderColor: `${cat.color}20`, color: cat.color }}
                  >
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-mono text-white/40 uppercase font-black">
                    {matchingCount} {matchingCount === 1 ? 'Guide' : 'Guides'}
                  </span>
                </div>
                <h3 className="mb-2 text-xl font-black uppercase text-white transition-colors group-hover:text-[#FF5C00]">
                  {cat.title}
                </h3>
                <p className="mb-6 font-sans text-xs leading-relaxed text-white/60">
                  {cat.description}
                </p>
              </div>

              <Link
                href={`/buyers-guides/${cat.slug}`}
                className="inline-flex items-center gap-1.5 font-mono text-xs font-black uppercase text-[#FF5C00] transition-colors hover:text-white"
              >
                Browse Guides
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          );
        })}
      </div>

      {/* List of guides */}
      <h2 className="mb-6 flex items-center gap-2 font-mono text-lg font-black uppercase tracking-widest text-white">
        <BookOpen className="h-5 w-5 text-[#FF5C00]" /> Published Buying Handbooks
      </h2>

      {initialGuides.length === 0 ? (
        <div className="rounded-lg border border-white/5 bg-[#050810]/40 py-16 text-center">
          <p className="text-[#A0A0A0] font-mono text-sm uppercase tracking-widest">
            No published buyer guides or roundups found.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {initialGuides.map((guide) => {
            const coverImage = guide.media?.coverImage?.src || guide.coverImage;
            const isRoundup = guide.metadata?.contentType === 'product-roundup';

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
                    <div className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-[#ff9b71]">
                      <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded font-black text-white/80">
                        {isRoundup ? 'Roundup' : 'Buyer Guide'}
                      </span>
                      <span>&bull;</span>
                      <span>{guide.category}</span>
                      <span>&bull;</span>
                      <span className="text-white/55">Editorial guide</span>
                    </div>
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
                    className="inline-flex min-h-11 items-center gap-1 text-xs font-mono font-black uppercase text-[#FF5C00] hover:text-white transition-colors group/link"
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
