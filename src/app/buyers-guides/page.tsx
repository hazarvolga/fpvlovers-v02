import React from 'react';
import { isIndexablePublishedArtifact, listPublishedContentAsync } from '@/lib/content-automation/content-reader';
import { BuyersGuidesHubClient } from './BuyersGuidesHubClient';
import { SubpageHero, SubpageShell } from '@/components/subpage/SubpageChrome';
import { HUB_COVER_IMAGES } from '@/lib/content-automation/hub-media';
import { generateSeoMetadata } from '@/lib/seo/metadata';

export const metadata = generateSeoMetadata({
  title: 'FPV Buyer Guides & Product Roundups | FPVLovers',
  description: 'Evidence-aware hardware selection guides, component roundups, and buying handbooks for FPV goggles, controllers, batteries, and frame styles.',
  path: '/buyers-guides',
  type: 'website',
});

export default async function BuyersGuidesPage() {
  const allContent = await listPublishedContentAsync();
  const guides = allContent.filter(
    a =>
      (a.metadata?.contentType === 'buyer-guide' ||
      a.metadata?.contentType === 'product-roundup')
      && isIndexablePublishedArtifact(a)
  );

  return (
    <SubpageShell>
      <SubpageHero
        label="Buyer Guides"
        title="Choose better FPV gear"
        accent="without the hype."
        description="Evidence-aware buying handbooks for FPV goggles, radios, batteries, frames, video systems, and starter kits. Commercial intent is useful, but editorial trust comes first."
        image={HUB_COVER_IMAGES.buyersGuides}
        imageAlt="FPV product buying guide workspace"
        stats={[
          { label: 'Published guides', value: `${guides.length}` },
          { label: 'Component classes', value: '7 hubs' },
          { label: 'Disclosure', value: 'Visible' },
          { label: 'Fake rankings', value: 'Avoided' },
        ]}
        actions={[
          { label: 'Browse guides', href: '#guides' },
          { label: 'Read disclosure', href: '/disclosure' },
        ]}
      />
      <BuyersGuidesHubClient initialGuides={guides} />
    </SubpageShell>
  );
}
