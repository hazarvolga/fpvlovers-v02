import React from 'react';
import { isIndexablePublishedArtifact, listPublishedContentAsync } from '@/lib/content-automation/content-reader';
import { ComparisonsHubClient } from './ComparisonsHubClient';
import { SubpageHero, SubpageShell } from '@/components/subpage/SubpageChrome';

export const metadata = {
  title: 'Product Comparisons | FPVLovers',
  description: 'Evidence-aware side-by-side FPV product comparisons covering specifications, compatibility, use cases, and practical tradeoffs.',
};

export default async function ComparisonsPage() {
  const allContent = await listPublishedContentAsync();
  const comparisons = allContent.filter(
    a => a.metadata?.contentType === 'comparison' && a.metadata.comparison && isIndexablePublishedArtifact(a)
  );

  const categoryCount = new Set(
    comparisons
      .map((comparison) => comparison.metadata?.comparison?.comparisonCategory)
      .filter(Boolean)
  ).size;

  return (
    <SubpageShell>
      <SubpageHero
        label="Comparisons"
        title="Side-by-side FPV"
        accent="tradeoff analysis."
        description="Source-aware FPV product comparisons that explain specifications, compatibility, use cases, and practical tradeoffs without pretending every winner is universal."
        image="/images/fallbacks/fpv-video-goggles-vtx.webp"
        imageAlt="FPV comparison bench with video and radio systems"
        stats={[
          { label: 'Published comparisons', value: `${comparisons.length}` },
          { label: 'Comparison classes', value: `${categoryCount}` },
          { label: 'Verdict style', value: 'Contextual' },
          { label: 'Spec claims', value: 'Source-aware' },
        ]}
        actions={[
          { label: 'Browse matchups', href: '#comparisons' },
          { label: 'Buyer guides', href: '/buyers-guides' },
        ]}
      />
      <ComparisonsHubClient initialComparisons={comparisons} />
    </SubpageShell>
  );
}
