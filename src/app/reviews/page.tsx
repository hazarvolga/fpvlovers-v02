import React from 'react';
import { isIndexablePublishedArtifact, listPublishedContentAsync } from '@/lib/content-automation/content-reader';
import { ReviewsHubClient } from './ReviewsHubClient';

export const metadata = {
  title: 'Hardware Reviews and Assessments | FPVLovers',
  description: 'FPV hardware assessments with explicit testing status, sourced specifications, tradeoffs, and human approval for hands-on product reviews.',
};

export default async function ReviewsPage() {
  const allContent = await listPublishedContentAsync();
  const reviews = allContent.filter(
    a => a.metadata?.contentType === 'review' && a.metadata.review && isIndexablePublishedArtifact(a)
  );

  return <ReviewsHubClient initialReviews={reviews} />;
}
