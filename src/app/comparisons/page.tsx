import React from 'react';
import { listPublishedContentAsync } from '@/lib/content-automation/content-reader';
import { ComparisonsHubClient } from './ComparisonsHubClient';

export const metadata = {
  title: 'Product Comparisons | FPVLovers',
  description: 'Unbiased side-by-side product comparisons, spec match-ups, and head-to-head bench testing of FPV frames, goggles, flight controllers, and transmitters.',
};

export default async function ComparisonsPage() {
  const allContent = await listPublishedContentAsync();
  const comparisons = allContent.filter(
    a => a.metadata?.contentType === 'comparison' && a.metadata.comparison
  );

  return <ComparisonsHubClient initialComparisons={comparisons} />;
}
