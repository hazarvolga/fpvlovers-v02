import { BookOpen, GraduationCap, Layers, RadioTower, Target } from 'lucide-react';
import {
  SubpageFeatureCard,
  SubpageHero,
  SubpageSectionHeader,
  SubpageShell,
} from '@/components/subpage/SubpageChrome';
import { HUB_COVER_IMAGES } from '@/lib/content-automation/hub-media';

export const metadata = {
  title: 'FPV Academy | FPVLovers',
  description: 'Beginner-first FPV learning paths, starter kits, simulator guidance, and glossary references.',
};

const levels = [
  {
    title: 'Beginner',
    description: 'Start with simulator practice, safety basics, radio setup, and first-flight confidence.',
    href: '/academy/roadmap',
    icon: GraduationCap,
    meta: 'Start here',
    accent: 'cyan' as const,
  },
  {
    title: 'Starter Kits',
    description: 'Understand what to buy first, what to avoid, and how to build a sane first FPV setup.',
    href: '/academy/starter-kits',
    icon: Target,
    meta: 'Buying path',
    accent: 'red' as const,
  },
  {
    title: 'Glossary',
    description: 'Decode ELRS, LiPo, PID, VTX, RSSI, blackbox and the core terms pilots keep hearing.',
    href: '/academy/glossary',
    icon: BookOpen,
    meta: 'Concept index',
    accent: 'green' as const,
  },
  {
    title: 'Simulators',
    description: 'Practice stick control before risking hardware. Build muscle memory before the first pack.',
    href: '/academy/simulators',
    icon: RadioTower,
    meta: 'Practice loop',
    accent: 'amber' as const,
  },
];

const courses = [
  { title: 'Roadmap', description: 'The primary beginner path from zero to controlled first flights.', href: '/academy/roadmap', icon: Layers },
  { title: 'Assessment', description: 'Check your FPV readiness and find your next learning bottleneck.', href: '/academy/assessment', icon: Target },
  { title: 'Pilot Dossier', description: 'Track progress and skill areas inside the FPVLovers pilot system.', href: '/academy/dossier', icon: GraduationCap },
];

export default function AcademyPage() {
  return (
    <SubpageShell>
      <SubpageHero
        label="Academy"
        title="Learn FPV."
        accent="Master the skies."
        description="Step-by-step learning paths for pilots who want a safer route from simulator practice to confident real-world flights."
        image={HUB_COVER_IMAGES.academy}
        imageAlt="FPV goggles and radio controller academy visual"
        stats={[
          { label: 'Learning paths', value: '4 core tracks' },
          { label: 'Skill boundary', value: 'Beginner first' },
          { label: 'Practice mode', value: 'Simulator safe' },
          { label: 'Editorial line', value: 'No hype' },
        ]}
        actions={[
          { label: 'Browse courses', href: '/academy/roadmap' },
          { label: 'Open glossary', href: '/academy/glossary' },
        ]}
      />

      <section className="mt-10">
        <SubpageSectionHeader label="Pilot levels" title="Choose your learning path" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {levels.map((level) => (
            <SubpageFeatureCard key={level.href} {...level} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <SubpageSectionHeader label="Popular courses" title="Start with the highest-leverage modules" />
        <div className="grid gap-4 md:grid-cols-3">
          {courses.map((course) => (
            <SubpageFeatureCard key={course.href} {...course} accent="cyan" />
          ))}
        </div>
      </section>
    </SubpageShell>
  );
}
