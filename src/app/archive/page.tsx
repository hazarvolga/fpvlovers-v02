import { Compass, Cpu, Flag, Plane, Radio, Video, Zap } from 'lucide-react';
import {
  SubpageFeatureCard,
  SubpageHero,
  SubpageSectionHeader,
  SubpageShell,
} from '@/components/subpage/SubpageChrome';
import { HUB_COVER_IMAGES } from '@/lib/content-automation/hub-media';

export const metadata = {
  title: 'Drone Archive | FPVLovers',
  description: 'Explore FPV drone categories, build styles, mission profiles, and platform references.',
};

const archiveCategories = [
  {
    title: 'Freestyle',
    description: 'Durable 5-inch frames for acro, flow, bando lines, repairability, and high-thrust control.',
    href: '/archive/freestyle',
    icon: Zap,
    meta: 'Acro',
    accent: 'red' as const,
  },
  {
    title: 'Cinematic',
    description: 'Cinewhoops and camera platforms tuned for smooth proximity, ducts, and stabilized footage.',
    href: '/archive/cinematic',
    icon: Video,
    meta: 'Camera work',
    accent: 'cyan' as const,
  },
  {
    title: 'Racing',
    description: 'Stretched-X, low-latency platforms built for gate agility, lap speed, and consistency.',
    href: '/archive/racing',
    icon: Flag,
    meta: 'Track',
    accent: 'amber' as const,
  },
  {
    title: 'Long Range',
    description: 'Efficient cruisers with GPS rescue, Li-Ion endurance, RF planning, and mountain-safe thinking.',
    href: '/archive/long-range',
    icon: Compass,
    meta: 'Explore',
    accent: 'green' as const,
  },
  {
    title: 'Whoops',
    description: 'Micro indoor aircraft for repetition, crash resilience, and low-risk stick control practice.',
    href: '/archive/whoops',
    icon: Cpu,
    meta: 'Micro',
    accent: 'cyan' as const,
  },
  {
    title: 'Performance',
    description: 'Mission-led platform choices that connect frame geometry, power system, and flight objective.',
    href: '/archive/performance',
    icon: Plane,
    meta: 'Reference',
    accent: 'red' as const,
  },
];

const referenceLinks = [
  { title: 'Performance', description: 'Performance-focused FPV build references and design tradeoffs.', href: '/archive/performance', icon: Radio },
  { title: 'Micro', description: 'Compact builds for parks, indoor practice, and lightweight training.', href: '/archive/micro', icon: Cpu },
  { title: 'Racing Archive', description: 'Race-oriented aircraft references and platform direction.', href: '/archive/racing', icon: Plane },
];

export default function ArchiveIndexPage() {
  return (
    <SubpageShell>
      <SubpageHero
        label="Drone Archive"
        title="Explore drone types,"
        accent="builds and evolution."
        description="A mission-first archive for understanding FPV aircraft categories, platform tradeoffs, and the build decisions behind real flying styles."
        image={HUB_COVER_IMAGES.archive}
        imageAlt="Long range FPV drone archive visual"
        stats={[
          { label: 'Core categories', value: '5 classes' },
          { label: 'Primary lens', value: 'Mission first' },
          { label: 'Buying safety', value: 'Tradeoffs shown' },
          { label: 'Archive claim', value: 'No fake inventory' },
        ]}
        actions={[
          { label: 'Browse categories', href: '/archive/freestyle' },
          { label: 'Open long range', href: '/archive/long-range' },
        ]}
      />

      <section className="mt-10">
        <SubpageSectionHeader label="Browse categories" title="Choose the aircraft mission" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {archiveCategories.map((category) => (
            <SubpageFeatureCard key={category.href} {...category} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <SubpageSectionHeader label="Reference routes" title="Explore deeper archive paths" />
        <div className="grid gap-4 md:grid-cols-3">
          {referenceLinks.map((link) => (
            <SubpageFeatureCard key={link.href} {...link} accent="cyan" />
          ))}
        </div>
      </section>
    </SubpageShell>
  );
}
