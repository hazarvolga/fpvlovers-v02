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
      <div className="relative flex h-[360px] w-full items-center justify-center overflow-hidden border-b border-white/10 bg-black/80 md:h-[420px]">
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
          <span className="rounded border border-[#FF5C00]/40 bg-black/80 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5C00] backdrop-blur-md">
            {category}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between px-8 pt-4 font-mono text-[10px] italic text-white/60">
        <span>{usesFallback ? 'FPVLovers fallback after media load failure' : asset.credit}</span>
        {!usesFallback && asset.sourceUrl && (
          <a
            href={asset.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 text-[9px] font-black uppercase tracking-widest text-[#FF5C00] transition-colors hover:text-[#FF7A33]"
          >
            [ Cover Source ]
          </a>
        )}
      </div>
    </>
  );
}
