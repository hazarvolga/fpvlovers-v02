import { Activity, Calculator, Cpu, Crosshair, Wrench, Zap } from 'lucide-react';
import {
  SubpageFeatureCard,
  SubpageHero,
  SubpageSectionHeader,
  SubpageShell,
} from '@/components/subpage/SubpageChrome';

export const metadata = {
  title: 'FPV Tools Hub | FPVLovers',
  description: 'Catalog-backed FPV calculators, compatibility checks, and guarded tuning tools for pilots.',
};

const tools = [
  {
    title: 'Hardware Analyzer',
    description: 'Catalog-assisted compatibility and risk checks with optional AI review when the gateway responds.',
    href: '/tools/hardware-analyzer',
    icon: Cpu,
    meta: 'Compatibility',
    accent: 'cyan' as const,
  },
  {
    title: 'Blackbox Tuning',
    description: 'CSV/text-export tuning guardrail for Betaflight noise, oscillation, and filter review.',
    href: '/tools/blackbox-tuning',
    icon: Activity,
    meta: 'Tuning',
    accent: 'red' as const,
  },
  {
    title: 'Component Duel',
    description: 'Side-by-side FPV hardware comparisons against reference data.',
    href: '/tools/component-duel',
    icon: Zap,
    meta: 'Compare',
    accent: 'amber' as const,
  },
  {
    title: 'Build Calculator',
    description: 'Calculate thrust, RPM, flight time, and battery draw for custom builds.',
    href: '/tools/calculator',
    icon: Calculator,
    meta: 'Math',
    accent: 'green' as const,
  },
  {
    title: 'Part Matcher',
    description: 'Catalog-backed compatibility checks for FPV parts, voltage, fit, and build risk.',
    href: '/tools/part-matcher',
    icon: Wrench,
    meta: 'Fit check',
    accent: 'cyan' as const,
  },
  {
    title: 'Flight Critic',
    description: 'Future video-analysis workspace. It is not marketed as live frame-level review yet.',
    href: '/tools/flight-critic',
    icon: Crosshair,
    meta: 'Planned',
    accent: 'red' as const,
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
        image="/images/fallbacks/fpv-tuning-betaflight.webp"
        imageAlt="FPV tuning dashboard and analyzer visual"
        stats={[
          { label: 'Live tools', value: '6 utilities' },
          { label: 'Source mode', value: 'Catalog-backed' },
          { label: 'AI claims', value: 'Guarded' },
          { label: 'Fake certainty', value: 'Avoided' },
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
