import React from 'react';
import { listPublishedContentAsync } from '@/lib/content-automation/content-reader';
import { BuyersGuidesHubClient } from './BuyersGuidesHubClient';

export const metadata = {
  title: 'FPV Buyer Guides & Product Roundups | FPVLovers',
  description: 'Empirical hardware selection guides, component roundups, and buying handbooks for FPV drone goggles, controllers, batteries, and frame styles.',
};

export default async function BuyersGuidesPage() {
  const allContent = await listPublishedContentAsync();
  const guides = allContent.filter(
    a => 
      a.metadata?.contentType === 'buyer-guide' || 
      a.metadata?.contentType === 'product-roundup'
  );

  return <BuyersGuidesHubClient initialGuides={guides} />;
}
