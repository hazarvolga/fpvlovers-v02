import { Activity, Calculator, Crosshair, Wrench, Zap } from 'lucide-react';
import {
  SubpageFeatureCard,
  SubpageHero,
  SubpageSectionHeader,
  SubpageShell,
} from '@/components/subpage/SubpageChrome';
import { HUB_COVER_IMAGES } from '@/lib/content-automation/hub-media';
import { generateSeoMetadata } from '@/lib/seo/metadata';

export const metadata = generateSeoMetadata({
  title: 'FPV Tools Hub | FPVLovers',
  description: 'Catalog-backed FPV calculators, compatibility checks, and guarded tuning tools for pilots.',
  path: '/tools',
  type: 'website',
});

const tools = [
  {
    title: 'Blackbox Tuning',
    description: 'Upload a CSV export or paste log notes. Get filter and PID recommendations for your gyro sensor.',
    href: '/tools/blackbox-tuning',
    icon: Activity,
    meta: 'Tuning',
    accent: 'red' as const,
    difficulty: 'Advanced' as const,
  },
  {
    title: 'Component Duel',
    description: 'Pick two FPV parts from the catalog and compare specs, price, and trust score side by side.',
    href: '/tools/component-duel',
    icon: Zap,
    meta: 'Compare',
    accent: 'amber' as const,
    difficulty: 'Beginner' as const,
  },
  {
    title: 'Build Calculator',
    description: 'Enter your component weights and motor specs. See thrust ratio, hover throttle, and flight time instantly.',
    href: '/tools/calculator',
    icon: Calculator,
    meta: 'Math',
    accent: 'green' as const,
    difficulty: 'Beginner' as const,
  },
  {
    title: 'Part Matcher',
    description: 'Select parts from the catalog to check voltage compatibility, motor-ESC fit, and build risk score.',
    href: '/tools/part-matcher',
    icon: Wrench,
    meta: 'Fit check',
    accent: 'cyan' as const,
    difficulty: 'Intermediate' as const,
  },
  {
    title: 'Flight Critic',
    description: 'Beta: Upload a flight video and receive a conservative coaching rubric. Not frame-level AI analysis yet.',
    href: '/tools/flight-critic',
    icon: Crosshair,
    meta: 'Beta',
    accent: 'red' as const,
    difficulty: 'Beginner' as const,
  },
];

export default function ToolsHubPage() {
  return (
    <SubpageShell>
      <SubpageHero
        label="Tools"
        title="Powerful calculators,"
        accent="analyzers and utilities."
        description="Practical FPV tools for build planning, tuning checks, component comparison, and safer setup decisions."
        image={HUB_COVER_IMAGES.tools}
        imageAlt="FPV tuning dashboard and analyzer visual"
        stats={[
          { label: 'Live tools', value: `${tools.length} utilities` },
          { label: 'Data source', value: 'Catalog-backed' },
          { label: 'AI accuracy', value: 'Source-verified' },
          { label: 'Honest limits', value: 'Always shown' },
        ]}
        actions={[
          { label: 'Open tools', href: '/tools/calculator' },
          { label: 'Analyze blackbox', href: '/tools/blackbox-tuning' },
        ]}
      />

      <section className="mt-10">
        <SubpageSectionHeader label="Featured tools" title="Pick a workflow" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <SubpageFeatureCard key={tool.href} {...tool} />
          ))}
        </div>
      </section>
    </SubpageShell>
  );
}
