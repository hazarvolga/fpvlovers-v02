import Link from 'next/link';
import { ArrowRight, BookOpen, ClipboardCheck, ShoppingBag } from 'lucide-react';
import {
  SubpageFeatureCard,
  SubpageHero,
  SubpageSectionHeader,
  SubpageShell,
} from '@/components/subpage/SubpageChrome';
import { LevelBadge } from '@/components/ui/level-badge';
import { HUB_COVER_IMAGES } from '@/lib/content-automation/hub-media';
import { listPublishedContentAsync, type PublishedArtifact } from '@/lib/content-automation/content-reader';
import { generateSeoMetadata } from '@/lib/seo/metadata';

export const revalidate = 300;

export const metadata = generateSeoMetadata({
  title: 'Start Here: Your First FPV Flight in Six Steps | FPVLovers',
  description: 'New to FPV? Follow six steps in order: understand FPV, practice in a simulator, get a radio, choose your first drone, learn the rules, and make your first flight.',
  path: '/academy',
  type: 'website',
});

type StartStep = {
  title: string;
  why: string;
  todo: string[];
  /** Candidate article slugs in priority order; missing slugs are skipped. */
  articleSlugs: string[];
  maxArticles?: number;
  page?: { label: string; href: string };
};

const steps: StartStep[] = [
  {
    title: 'Understand what FPV is',
    why: 'FPV (first-person view) means flying through goggles that show a live feed from the drone’s camera. Most FPV flying is fully manual, which is why practice comes before buying.',
    todo: ['Read one overview guide end to end', 'Bookmark the glossary for unfamiliar terms'],
    articleSlugs: [
      'fpv-beginner-setup-guide-the-easiest-way-to-get-flying',
      'fpv-pilot-roadmap-from-simulator-to-first-flight',
    ],
    page: { label: 'FPV glossary', href: '/academy/glossary' },
  },
  {
    title: 'Practice in a simulator',
    why: 'In a simulator, crashes are free. Building stick control here saves you broken parts and frustration later.',
    todo: ['Pick a simulator', 'Practice hovering and gentle turns until they feel natural'],
    articleSlugs: [
      'fpv-simulator-practice-plan-first-30-days',
      'the-best-fpv-simulators-in-2026-save-cash-and-log-hours-virtually',
    ],
    page: { label: 'Simulator training', href: '/academy/simulators' },
  },
  {
    title: 'Get your radio',
    why: 'Your radio controller works with the simulator now and with your drone later. It’s usually the piece of gear you keep the longest.',
    todo: ['Choose a radio that fits your hands and budget', 'Set it up and use it in the simulator'],
    articleSlugs: [
      'how-to-choose-your-first-fpv-radio-without-buying-twice',
      'elrs-radio-setup-guide-for-beginners',
      'best-fpv-radios-for-elrs-pilots-buying-guide-by-budget',
    ],
    maxArticles: 3,
  },
  {
    title: 'Choose your first drone and goggles',
    why: 'Start with a ready-to-fly kit or a tiny whoop. No soldering or building is needed to get in the air.',
    todo: ['Compare ready-to-fly kits by budget', 'Decide between analog and digital video'],
    articleSlugs: [
      'best-fpv-starter-kits-2026-rtf-bundles-for-beginners',
      'how-to-choose-your-first-tiny-whoop-indoor-fun-safe-training',
      'fpv-goggles-buying-guide-analog-vs-digital-for-beginners',
    ],
    page: { label: 'Starter kits', href: '/academy/starter-kits' },
  },
  {
    title: 'Learn the rules and battery safety',
    why: 'Drone rules depend on your country. Check your local aviation authority before flying outdoors, and learn how to charge and store LiPo batteries safely.',
    todo: ['Check the drone rules where you live', 'Learn safe LiPo charging and storage'],
    articleSlugs: [
      'fpv-regulations-for-beginners-in-the-united-states',
      'fpv-lipo-battery-safety-charging-guide-prevent-fires-and-fly-longer',
    ],
    maxArticles: 2,
    page: { label: 'Rules & safety', href: '/regulations' },
  },
  {
    title: 'Make your first flight',
    why: 'Choose an open, empty area, run a quick pre-flight check, and start with short, gentle hovers.',
    todo: ['Fly a few short, low hovers', 'Know what to check if something doesn’t work'],
    articleSlugs: [
      'first-hover-training',
      'no-video-in-fpv-a-beginner-troubleshooting-checklist',
      'fpv-drone-won-t-arm-betaflight-troubleshooting-checklist',
    ],
    maxArticles: 3,
  },
];

function resolveArticles(step: StartStep, bySlug: Map<string, PublishedArtifact>): PublishedArtifact[] {
  const seenTitles = new Set<string>();
  const resolved: PublishedArtifact[] = [];
  for (const slug of step.articleSlugs) {
    const article = bySlug.get(slug);
    // Skip unpublished slugs and same-title duplicates.
    if (!article || seenTitles.has(article.title.toLowerCase())) continue;
    seenTitles.add(article.title.toLowerCase());
    resolved.push(article);
  }
  return resolved.slice(0, step.maxArticles ?? 3);
}

export default async function StartHerePage() {
  const content = await listPublishedContentAsync();
  const bySlug = new Map(content.map((article) => [article.slug, article]));

  return (
    <SubpageShell>
      <SubpageHero
        label="Start Here"
        title="Your first FPV flight,"
        accent="in six steps."
        description="Follow these steps in order. Each one explains why it matters and links to the guides you need. No account required."
        image={HUB_COVER_IMAGES.academy}
        imageAlt="FPV goggles and radio controller beginner visual"
        stats={[
          { label: 'Steps', value: '6, in order' },
          { label: 'Account', value: 'Not required' },
          { label: 'Soldering', value: 'Not needed' },
          { label: 'Start with', value: 'A simulator' },
        ]}
        actions={[
          { label: 'Go to step 1', href: '#step-1' },
          { label: 'Beginner guides', href: '/guides?level=beginner' },
        ]}
      />

      <section className="mt-12">
        <SubpageSectionHeader label="Zero to first flight" title="Six steps" />
        <ol className="space-y-4">
          {steps.map((step, index) => {
            const articles = resolveArticles(step, bySlug);
            return (
              <li
                key={step.title}
                id={`step-${index + 1}`}
                className="fpv-public-card scroll-mt-28 rounded-xl p-6 md:p-8"
              >
                <div className="grid gap-6 md:grid-cols-[4rem_minmax(0,1fr)_minmax(0,1.1fr)]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#ff3131]/40 bg-[#ff3131]/[0.08] text-xl font-black text-white">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-[-0.02em] text-white md:text-2xl">{step.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-zinc-300">{step.why}</p>
                    <ul className="mt-4 space-y-2">
                      {step.todo.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-zinc-400">
                          <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" strokeWidth={1.6} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">Read</p>
                    {articles.map((article) => (
                      <Link
                        key={article.slug}
                        href={`/article/${article.slug}`}
                        className="group flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 transition-colors hover:border-[#ff3131]/40"
                      >
                        <span>
                          <span className="block text-sm font-bold leading-snug text-white group-hover:text-[#ff3131]">{article.title}</span>
                          <LevelBadge difficulty={article.metadata?.difficulty} className="mt-2" />
                        </span>
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-[#ff3131]" />
                      </Link>
                    ))}
                    {step.page && (
                      <Link
                        href={step.page.href}
                        className="inline-flex items-center gap-2 pt-1 text-xs font-black uppercase tracking-[0.12em] text-[#ff3131] hover:text-white"
                      >
                        {step.page.label} <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-12">
        <SubpageSectionHeader label="After your first flight" title="Keep going" />
        <div className="grid gap-4 md:grid-cols-3">
          <SubpageFeatureCard
            title="Beginner guides"
            description="Setup, practice drills, and fixes for your first months of flying."
            href="/guides?level=beginner"
            icon={BookOpen}
            meta="Next reading"
            accent="green"
          />
          <SubpageFeatureCard
            title="Track your progress"
            description="Optional: save which skills you've practiced and see what to learn next."
            href="/academy/roadmap"
            icon={ClipboardCheck}
            meta="Optional"
            accent="cyan"
          />
          <SubpageFeatureCard
            title="Upgrade your gear"
            description="Buyer guides, reviews, and comparisons when you're ready for more."
            href="/buyers-guides"
            icon={ShoppingBag}
            meta="Gear"
            accent="amber"
          />
        </div>
      </section>
    </SubpageShell>
  );
}
