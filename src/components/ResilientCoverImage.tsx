"use client";
// Image load failures are browser-only, so fallback transitions require client state.
/* eslint-disable @next/next/no-img-element */

import Image, { type ImageProps } from 'next/image';
import { useEffect, useState } from 'react';
import { FALLBACK_COVER_PATHS } from '@/lib/content-automation/fallback-cover';

type ResilientCoverImageProps = Omit<ImageProps, 'src' | 'onError'> & {
  src?: string;
  fallbackSrc?: string;
  onFallbackChange?: (usesFallback: boolean) => void;
};

export function ResilientCoverImage({
  src,
  fallbackSrc = FALLBACK_COVER_PATHS.generic,
  onFallbackChange,
  alt,
  ...imageProps
}: ResilientCoverImageProps) {
  const candidates = [...new Set(
    [src, fallbackSrc, FALLBACK_COVER_PATHS.generic]
      .filter((value): value is string => Boolean(value)),
  )];
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  const currentSrc = candidates[candidateIndex];
  const isExternalSrc = /^https?:\/\//i.test(currentSrc || '');
  const loadingMode = imageProps.loading || (imageProps.priority ? 'eager' : 'lazy');

  const handleError = () => setCandidateIndex((index) => {
    onFallbackChange?.(true);
    return index + 1;
  });

  useEffect(() => {
    if (!currentSrc || !isExternalSrc || loadingMode === 'lazy') return undefined;

    const timer = window.setTimeout(() => {
      setCandidateIndex((index) => {
        if (index !== candidateIndex || loadedSrc === currentSrc) return index;
        onFallbackChange?.(true);
        return index + 1;
      });
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [candidateIndex, currentSrc, isExternalSrc, loadedSrc, loadingMode, onFallbackChange]);

  if (!currentSrc) return null;

  if (isExternalSrc) {
    const {
      className,
      style,
      fill,
      width,
      height,
      decoding,
      priority,
      referrerPolicy,
    } = imageProps;

    return (
      <img
        src={currentSrc}
        alt={alt}
        className={className}
        style={fill ? {
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          ...style,
        } : style}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        loading={loadingMode}
        decoding={decoding || 'async'}
        referrerPolicy={referrerPolicy || 'no-referrer'}
        onLoad={() => setLoadedSrc(currentSrc)}
        onError={handleError}
      />
    );
  }

  return (
    <Image
      {...imageProps}
      src={currentSrc}
      alt={alt}
      onLoad={() => setLoadedSrc(currentSrc)}
      onError={handleError}
    />
  );
}
