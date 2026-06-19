import React from 'react';
import { isIndexablePublishedArtifact, listPublishedContentAsync } from '@/lib/content-automation/content-reader';
import { ComparisonsHubClient } from './ComparisonsHubClient';

export const metadata = {
  title: 'Product Comparisons | FPVLovers',
  description: 'Evidence-aware side-by-side FPV product comparisons covering specifications, compatibility, use cases, and practical tradeoffs.',
};

export default async function ComparisonsPage() {
  const allContent = await listPublishedContentAsync();
  const comparisons = allContent.filter(
    a => a.metadata?.contentType === 'comparison' && a.metadata.comparison && isIndexablePublishedArtifact(a)
  );

  return <ComparisonsHubClient initialComparisons={comparisons} />;
}
