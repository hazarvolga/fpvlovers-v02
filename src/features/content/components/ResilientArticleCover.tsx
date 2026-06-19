"use client";
// Runtime image errors require client state so external covers can fall back locally.

import { useState } from 'react';
import { ResilientCoverImage } from '@/components/ResilientCoverImage';
import type { ContentMediaAsset } from '@/lib/content-automation/content-media';

interface ResilientArticleCoverProps {
  asset: ContentMediaAsset;
  category: string;
  fallbackSrc: string;
  title: string;
}

export function ResilientArticleCover({
  asset,
  category,
  fallbackSrc,
  title,
}: ResilientArticleCoverProps) {
  const [usesFallback, setUsesFallback] = useState(false);

  return (
    <>
      <div className="relative w-full h-[360px] md:h-[420px] border-b border-[#00F2FF]/20 overflow-hidden bg-black/80 flex items-center justify-center">
        <ResilientCoverImage
          src={asset.src}
          fallbackSrc={fallbackSrc}
          alt=""
          fill
          className="object-cover opacity-20 blur-2xl scale-125 pointer-events-none"
          unoptimized
          onFallbackChange={setUsesFallback}
        />
        <ResilientCoverImage
          src={asset.src}
          fallbackSrc={fallbackSrc}
          alt={asset.alt || title}
          fill
          sizes="(min-width: 1024px) 66vw, 100vw"
          unoptimized
          className="object-contain relative z-10 p-4"
          referrerPolicy="no-referrer"
          onFallbackChange={setUsesFallback}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050810] via-[#050810]/20 to-transparent z-20 pointer-events-none" />
        <div className="absolute top-6 left-6 z-30">
          <span className="text-[10px] uppercase font-black tracking-widest px-3 py-1 bg-black/80 backdrop-blur-md border border-[#00F2FF]/50 text-[#00F2FF] rounded">
            {category}
          </span>
        </div>
      </div>
      <div className="px-8 pt-4 text-[10px] text-white/30 font-mono italic flex items-center justify-between">
        <span>{usesFallback ? 'FPVLovers generated fallback' : asset.credit}</span>
        {!usesFallback && asset.sourceUrl && (
          <a
            href={asset.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00F2FF] hover:text-[#00FF66] transition-colors uppercase tracking-widest text-[9px] font-black z-10 relative"
          >
            [ Cover Source ]
          </a>
        )}
      </div>
    </>
  );
}
