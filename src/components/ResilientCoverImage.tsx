"use client";
// Image load failures are browser-only, so fallback transitions require client state.

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';
import { FALLBACK_COVER_PATHS } from '@/lib/content-automation/fallback-cover';

type ResilientCoverImageProps = Omit<ImageProps, 'src' | 'onError'> & {
  src?: string;
  fallbackSrc?: string;
};

export function ResilientCoverImage({
  src,
  fallbackSrc = FALLBACK_COVER_PATHS.generic,
  alt,
  ...imageProps
}: ResilientCoverImageProps) {
  const candidates = [...new Set(
    [src, fallbackSrc, FALLBACK_COVER_PATHS.generic]
      .filter((value): value is string => Boolean(value)),
  )];
  const [candidateIndex, setCandidateIndex] = useState(0);

  const currentSrc = candidates[candidateIndex];
  if (!currentSrc) return null;

  return (
    <Image
      {...imageProps}
      src={currentSrc}
      alt={alt}
      onError={() => setCandidateIndex((index) => index + 1)}
    />
  );
}
