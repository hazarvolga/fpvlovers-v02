"use client";

import React from 'react';
import Link from 'next/link';
import { trackRelatedArticleClick, trackNextStepClick, trackSearchResultClick } from '@/lib/analytics';

interface DiscoveryLinkProps {
  href: string;
  sourceSlug?: string;
  targetSlug: string;
  linkType: 'related' | 'next_step' | 'search_result';
  searchQuery?: string;
  className?: string;
  children: React.ReactNode;
}

export function DiscoveryLink({ href, sourceSlug, targetSlug, linkType, searchQuery, className, children }: DiscoveryLinkProps) {
  const handleClick = () => {
    if (linkType === 'related' && sourceSlug) {
      trackRelatedArticleClick(sourceSlug, targetSlug);
    } else if (linkType === 'next_step' && sourceSlug) {
      trackNextStepClick(sourceSlug, targetSlug);
    } else if (linkType === 'search_result' && searchQuery !== undefined) {
      trackSearchResultClick(searchQuery, targetSlug);
    }
  };

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
