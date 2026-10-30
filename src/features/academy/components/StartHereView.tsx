import Link from 'next/link';
import { ArrowRight, BookOpen, ClipboardCheck, ShoppingBag } from 'lucide-react';
import {
  SubpageFeatureCard,
  SubpageHero,
  SubpageSectionHeader,
  SubpageShell,
  type SubpageIcon,
} from '@/components/subpage/SubpageChrome';
import { LevelBadge } from '@/components/ui/level-badge';
import { HUB_COVER_IMAGES } from '@/lib/content-automation/hub-media';
import { listPublishedContentAsync, type PublishedArtifact } from '@/lib/content-automation/content-reader';
import { localizePath, type Locale } from '@/lib/i18n/locale';
import { START_STEPS, type StartStep } from '@/lib/i18n/start-steps';

type AcademyAfterCard = {
  title: string;
  description: string;
  href: string;
  icon: SubpageIcon;
  meta: string;
  accent: 'red' | 'cyan' | 'green' | 'amber';
};

type AcademyCopy = {
  hero: {
    label: string;
    title: string;
    accent: string;
    description: string;
    imageAlt: string;
    stats: { label: string; value: string }[];
    actions: { label: string; href: string }[];
  };
  sectionLabel: string;
  sectionTitle: string;
  readLabel: string;
  emptyArticles: string;
  afterLabel: string;
  afterTitle: string;
  afterCards: AcademyAfterCard[];
};

const COPY: Record<Locale, AcademyCopy> = {
  en: {
    hero: {
      label: 'Start Here',
      title: 'Your first FPV flight,',
      accent: 'in six steps.',
      description:
        'Follow these steps in order. Each one explains why it matters and links to the guides you need. No account required.',
      imageAlt: 'FPV goggles and radio controller beginner visual',
      stats: [
        { label: 'Steps', value: '6, in order' },
        { label: 'Account', value: 'Not required' },
        { label: 'Soldering', value: 'Not needed' },
        { label: 'Start with', value: 'A simulator' },
      ],
      actions: [
        { label: 'Go to step 1', href: '#step-1' },
        { label: 'Beginner guides', href: '/guides?level=beginner' },
      ],
    },
    sectionLabel: 'Zero to first flight',
    sectionTitle: 'Six steps',
    readLabel: 'Read',
    emptyArticles: 'Guides for this step are being prepared.',
    afterLabel: 'After your first flight',
    afterTitle: 'Keep going',
    afterCards: [
      {
        title: 'Beginner guides',
        description: 'Setup, practice drills, and fixes for your first months of flying.',
        href: '/guides?level=beginner',
        icon: BookOpen,
        meta: 'Next reading',
        accent: 'green',
      },
      {
        title: 'Track your progress',
        description: "Optional: save which skills you've practiced and see what to learn next.",
        href: '/academy/roadmap',
        icon: ClipboardCheck,
        meta: 'Optional',
        accent: 'cyan',
      },
      {
        title: 'Upgrade your gear',
        description: "Buyer guides, reviews, and comparisons when you're ready for more.",
        href: '/buyers-guides',
        icon: ShoppingBag,
        meta: 'Gear',
        accent: 'amber',
      },
    ],
  },
  tr: {
    hero: {
      label: 'Buradan Başla',
      title: 'İlk FPV uçuşun,',
      accent: 'altı adımda.',
      description:
        'Adımları sırayla takip et. Her adım neden önemli olduğunu ve hangi rehberi okuman gerektiğini anlatır. Hesap gerekmez.',
      imageAlt: 'FPV gözlüğü ve kumanda ile yeni başlayan pilot',
      stats: [
        { label: 'Adım', value: '6, sırayla' },
        { label: 'Hesap', value: 'Gerekmez' },
        { label: 'Lehim', value: 'Gerekmez' },
        { label: 'Başlangıç', value: 'Simülatör' },
      ],
      actions: [
        { label: '1. adıma git', href: '#step-1' },
        { label: 'Başlangıç rehberleri', href: '/guides?level=beginner' },
      ],
    },
    sectionLabel: 'Sıfırdan ilk uçuşa',
    sectionTitle: 'Altı adım',
    readLabel: 'Oku',
    emptyArticles: 'Bu adımın Türkçe rehberleri hazırlanıyor.',
    afterLabel: 'İlk uçuştan sonra',
    afterTitle: 'Devam et',
    afterCards: [
      {
        title: 'Başlangıç rehberleri',
        description: 'Kurulum, pratik alıştırmalar ve ilk aylarda karşılaşılan sorunlar.',
        href: '/guides?level=beginner',
        icon: BookOpen,
        meta: 'Sıradaki okuma',
        accent: 'green',
      },
      {
        title: 'İlerlemeni takip et',
        description: 'İsteğe bağlı: çalıştığın becerileri kaydet ve sırada ne olduğunu gör.',
        href: '/academy/roadmap',
        icon: ClipboardCheck,
        meta: 'İsteğe bağlı',
        accent: 'cyan',
      },
      {
        title: 'Ekipmanını yükselt',
        description: 'Hazır olduğunda satın alma rehberleri, incelemeler ve karşılaştırmalar.',
        href: '/buyers-guides',
        icon: ShoppingBag,
        meta: 'Ekipman',
        accent: 'amber',
      },
    ],
  },
};

/** Localizes absolute paths; in-page anchors such as `#step-1` pass through. */
function toHref(href: string, locale: Locale): string {
  return href.startsWith('/') ? localizePath(href, locale) : href;
}

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

export async function StartHereView({ locale }: { locale: Locale }) {
  const steps = START_STEPS[locale];
  const copy = COPY[locale];
  const content = await listPublishedContentAsync(locale);
  const bySlug = new Map(content.map((article) => [article.slug, article]));

  return (
    <SubpageShell>
      <SubpageHero
        label={copy.hero.label}
        title={copy.hero.title}
        accent={copy.hero.accent}
        description={copy.hero.description}
        image={HUB_COVER_IMAGES.academy}
        imageAlt={copy.hero.imageAlt}
        stats={copy.hero.stats}
        actions={copy.hero.actions.map((action) => ({ ...action, href: toHref(action.href, locale) }))}
      />

      <section className="mt-12">
        <SubpageSectionHeader label={copy.sectionLabel} title={copy.sectionTitle} />
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
                    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">{copy.readLabel}</p>
                    {articles.map((article) => (
                      <Link
                        key={article.slug}
                        href={localizePath(`/article/${article.slug}`, locale)}
                        className="group flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 transition-colors hover:border-[#ff3131]/40"
                      >
                        <span>
                          <span className="block text-sm font-bold leading-snug text-white group-hover:text-[#ff3131]">{article.title}</span>
                          <LevelBadge difficulty={article.metadata?.difficulty} locale={locale} className="mt-2" />
                        </span>
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-[#ff3131]" />
                      </Link>
                    ))}
                    {articles.length === 0 && (
                      <p className="rounded-lg border border-dashed border-white/10 px-4 py-3 text-xs text-zinc-500">
                        {copy.emptyArticles}
                      </p>
                    )}
                    {step.page && (
                      <Link
                        href={localizePath(step.page.href, locale)}
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
        <SubpageSectionHeader label={copy.afterLabel} title={copy.afterTitle} />
        <div className="grid gap-4 md:grid-cols-3">
          {copy.afterCards.map((card) => (
            <SubpageFeatureCard
              key={card.title}
              title={card.title}
              description={card.description}
              href={toHref(card.href, locale)}
              icon={card.icon}
              meta={card.meta}
              accent={card.accent}
            />
          ))}
        </div>
      </section>
    </SubpageShell>
  );
}
