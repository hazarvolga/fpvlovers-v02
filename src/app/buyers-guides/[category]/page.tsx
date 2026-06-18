import React from 'react';
import { notFound } from 'next/navigation';
import { listPublishedContentAsync } from '@/lib/content-automation/content-reader';
import { CategoryGuideHubClient } from './CategoryGuideHubClient';
import { BUYERS_GUIDE_CATEGORIES } from '../BuyersGuidesHubClient';

interface PageProps {
  params: Promise<{ category: string }>;
}

function findCategoryConfig(slug: string) {
  return BUYERS_GUIDE_CATEGORIES.find(c => c.slug === slug);
}

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const config = findCategoryConfig(resolvedParams.category);

  if (!config) {
    return {
      title: 'Not Found | FPVLovers',
    };
  }

  return {
    title: `${config.title} Buyer Guides | FPVLovers`,
    description: config.description,
  };
}

export default async function CategoryGuidePage({ params }: PageProps) {
  const resolvedParams = await params;
  const config = findCategoryConfig(resolvedParams.category);

  if (!config) {
    notFound();
  }

  const allContent = await listPublishedContentAsync();

  // Filter content matching this category
  const matchingContent = allContent.filter(
    a => a.metadata && config.matcher(a.metadata)
  );

  // Split into content types
  const guides = matchingContent.filter(
    a =>
      a.metadata?.contentType === 'buyer-guide' ||
      a.metadata?.contentType === 'product-roundup'
  );

  const reviews = matchingContent.filter(
    a => a.metadata?.contentType === 'review' && a.metadata.review
  );

  const comparisons = matchingContent.filter(
    a => a.metadata?.contentType === 'comparison' && a.metadata.comparison
  );

  return (
    <CategoryGuideHubClient
      categoryTitle={config.title}
      categoryDescription={config.description}
      categorySlug={config.slug}
      categoryColor={config.color}
      guides={guides}
      reviews={reviews}
      comparisons={comparisons}
    />
  );
}
