import React from 'react';
import { listPublishedContentAsync } from '@/lib/content-automation/content-reader';
import { ReviewsHubClient } from './ReviewsHubClient';

export const metadata = {
  title: 'Hardware Reviews | FPVLovers',
  description: 'In-depth laboratory bench tests, telemetry logs, pros/cons, and unbiased reviews of FPV drone equipment, goggles, controllers, and cameras.',
};

export default async function ReviewsPage() {
  const allContent = await listPublishedContentAsync();
  const reviews = allContent.filter(
    a => a.metadata?.contentType === 'review' && a.metadata.review
  );

  return <ReviewsHubClient initialReviews={reviews} />;
}
