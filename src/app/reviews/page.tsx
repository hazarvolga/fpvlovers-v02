import React from 'react';
import { isIndexablePublishedArtifact, listPublishedContentAsync } from '@/lib/content-automation/content-reader';
import { ReviewsHubClient } from './ReviewsHubClient';
import { SubpageHero, SubpageShell } from '@/components/subpage/SubpageChrome';
import { isApprovedHandsOnReview } from '@/lib/content-automation/editorial-governance';

export const metadata = {
  title: 'Hardware Reviews and Assessments | FPVLovers',
  description: 'FPV hardware assessments with explicit testing status, sourced specifications, tradeoffs, and human approval for hands-on product reviews.',
};

export default async function ReviewsPage() {
  const allContent = await listPublishedContentAsync();
  const reviews = allContent.filter(
    a => a.metadata?.contentType === 'review' && a.metadata.review && isIndexablePublishedArtifact(a)
  );

  const approvedHandsOn = reviews.filter((review) => isApprovedHandsOnReview(review.editorial)).length;

  return (
    <SubpageShell>
      <SubpageHero
        label="Reviews"
        title="Hardware reviews"
        accent="with evidence boundaries."
        description="FPV hardware assessments that separate sourced specifications from hands-on testing. Scores and hands-on labels are reserved for editor-approved evidence."
        image="/images/fallbacks/fpv-commercial.webp"
        imageAlt="FPV hardware review bench"
        stats={[
          { label: 'Published reviews', value: `${reviews.length}` },
          { label: 'Hands-on approved', value: `${approvedHandsOn}` },
          { label: 'Score policy', value: 'Guarded' },
          { label: 'Disclosure', value: 'Required' },
        ]}
        actions={[
          { label: 'Browse reviews', href: '#reviews' },
          { label: 'Editorial policy', href: '/editorial-policy' },
        ]}
      />
      <ReviewsHubClient initialReviews={reviews} />
    </SubpageShell>
  );
}
