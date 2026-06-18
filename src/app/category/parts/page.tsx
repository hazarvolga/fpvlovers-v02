import React from 'react';
import { getDuelComparison } from '@/lib/duelEngine';
import { AffexDuelEngine } from '@/features/tools/components/AffexDuelEngine';
import { Badge } from '@/components/ui/badge';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';

export const metadata = {
  title: 'Marketplace Duel | FPVLovers',
  description: 'FPV component comparisons evaluating thermodynamics, structural integrity, and telemetry performance.',
}

export default async function PartsDuelPage() {
  // In a real app, IDs would be dynamic based on route/params
  const { productA, productB, result } = await getDuelComparison("motor-tmotor-f60", "motor-xnova-2207");

  const breadcrumbs = [
    { label: 'Tools', href: '/tools' },
    { label: 'Component Duel', isCurrentPage: true }
  ];

  return (
    <div className="min-h-screen pt-12 pb-24 relative overflow-hidden carbon-grid">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-16">
           <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

           <AffexDuelEngine productA={productA} productB={productB} result={result} />
        </div>
    </div>
  )
}
