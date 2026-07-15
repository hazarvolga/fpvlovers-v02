import Image from 'next/image';
import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

export type SubpageIcon = ComponentType<{ className?: string; strokeWidth?: number }>;

export type SubpageStat = {
  label: string;
  value: string;
};

export type SubpageAction = {
  label: string;
  href: string;
};

export function SubpageShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`fpv-public-shell mx-auto max-w-[112rem] px-5 pb-24 pt-28 sm:px-8 lg:px-16 ${className}`}>
      {children}
    </div>
  );
}

export function SubpageHero({
  label,
  title,
  accent,
  description,
  image,
  imageAlt,
  stats = [],
  actions = [],
}: {
  label: string;
  title: string;
  accent?: string;
  description: string;
  image: string;
  imageAlt: string;
  stats?: SubpageStat[];
  actions?: SubpageAction[];
}) {
  return (
    <section className="fpv-public-panel relative overflow-hidden rounded-[0.9rem] bg-[#050607] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <Image
        src={image}
        alt={imageAlt}
        fill
        priority
        sizes="(min-width: 1024px) 100vw, 100vw"
        className="object-cover object-center opacity-[0.74]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#050607_0%,rgba(5,6,7,0.94)_34%,rgba(5,6,7,0.48)_68%,rgba(5,6,7,0.78)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_16%,rgba(255,92,0,0.18),transparent_24rem),radial-gradient(circle_at_84%_8%,rgba(225,34,39,0.12),transparent_28rem)]" />
      <div className="relative z-10 min-h-[24rem] p-7 sm:p-10 lg:p-14">
        <div className="max-w-3xl">
          <p className="fpv-kicker">{label}</p>
          <h1 className="mt-5 text-4xl font-black uppercase leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl">
            {title}
            {accent ? <span className="text-[#e12227]"> {accent}</span> : null}
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">{description}</p>
          {actions.length > 0 ? (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {actions.map((action, index) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`group inline-flex items-center justify-between gap-4 rounded-[0.45rem] border px-5 py-3 text-xs font-black uppercase tracking-[0.12em] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    index === 0
                      ? 'border-[#ff3131]/60 bg-[#e12227] text-white shadow-[0_0_28px_rgba(225,34,39,0.18)] hover:bg-[#ff3131]'
                      : 'border-white/[0.14] bg-black/20 text-white hover:border-white/[0.32] hover:bg-white/[0.06]'
                  }`}
                >
                  {action.label}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-700 group-hover:translate-x-1" strokeWidth={1.5} />
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {stats.length > 0 ? (
          <div className="mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-[0.55rem] border border-white/10 bg-black/[0.34] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">{stat.label}</div>
                <div className="mt-2 text-lg font-black uppercase tracking-[0.05em] text-white">{stat.value}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function SubpageSectionHeader({
  label,
  title,
  action,
}: {
  label?: string;
  title: string;
  action?: SubpageAction;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {label ? <p className="fpv-kicker text-zinc-500">{label}</p> : null}
        <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white md:text-3xl">{title}</h2>
      </div>
      {action ? (
        <Link href={action.href} className="inline-flex shrink-0 items-center gap-1.5 rounded border border-[#ff3131]/30 px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-[#ff3131] transition-colors hover:border-[#ff3131]/60 hover:text-white sm:gap-2 sm:border-0 sm:px-0 sm:py-0 sm:text-xs sm:tracking-[0.12em]">
          {action.label}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
        </Link>
      ) : null}
    </div>
  );
}

export function SubpageFeatureCard({
  title,
  description,
  href,
  icon: Icon,
  meta,
  accent = 'red',
}: {
  title: string;
  description: string;
  href: string;
  icon: SubpageIcon;
  meta?: string;
  accent?: 'red' | 'cyan' | 'green' | 'amber';
}) {
  const accentClass = {
    red: 'text-[#ff3131] bg-[#ff3131]/[0.08] border-[#ff3131]/25 group-hover:border-[#ff3131]/45',
    cyan: 'text-[#7dd3fc] bg-[#00f2ff]/[0.07] border-[#00f2ff]/20 group-hover:border-[#ff5c00]/35',
    green: 'text-[#00ff66] bg-[#00ff66]/[0.08] border-[#00ff66]/25 group-hover:border-[#00ff66]/45',
    amber: 'text-[#ff9b71] bg-[#ff9b71]/[0.08] border-[#ff9b71]/25 group-hover:border-[#ff9b71]/45',
  }[accent];

  return (
    <Link href={href} className="fpv-public-card fpv-public-card-hover group block h-full rounded-[0.7rem] p-6 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
      <div className={`flex h-12 w-12 items-center justify-center rounded-[0.55rem] border ${accentClass}`}>
        <Icon className="h-5 w-5" strokeWidth={1.4} />
      </div>
      {meta ? <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">{meta}</div> : null}
      <h3 className="mt-3 text-lg font-black uppercase tracking-[-0.02em] text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{description}</p>
      <div className="mt-7 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#ff3131]">
        Explore
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-700 group-hover:translate-x-1" strokeWidth={1.5} />
      </div>
    </Link>
  );
}
