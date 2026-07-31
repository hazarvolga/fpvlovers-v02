import React from 'react';
import { getDuelComparison } from '@/lib/duelEngine';
import { AffexDuelEngine } from '@/features/tools/components/AffexDuelEngine';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';

export const metadata = {
  title: 'Component Comparison Lab | FPVLovers',
  description: 'Evidence-pending FPV component comparison workspace. Live prices, stock, and affiliate CTAs stay disabled until source verification is complete.',
  robots: {
    index: false,
    follow: true,
  },
}

export default async function PartsDuelPage() {
  const { productA, productB, result } = await getDuelComparison("motor-tmotor-f60", "motor-xnova-2207");

  const breadcrumbs = [
    { label: 'Tools', href: '/tools' },
    { label: 'Component Duel', isCurrentPage: true }
  ];

  return (
    <div className="min-h-screen pt-12 pb-24 relative overflow-hidden carbon-grid">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-16">
           <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

           <div className="mb-8 rounded-lg border border-yellow-300/20 bg-yellow-300/5 p-4 text-sm text-yellow-100">
             This lab view uses benchmark-style sample data. Live retailer prices, stock status, urgency labels, and affiliate CTAs are disabled until source verification is complete.
           </div>

           <AffexDuelEngine productA={productA} productB={productB} result={result} />
        </div>
    </div>
  )
}
