import Image from 'next/image';
import Link from 'next/link';
import { resolveHomepageContent } from '@/lib/homepage/homepage-content';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Cpu, Wind, Zap, BookOpen, Wrench, Calculator, Sparkles } from 'lucide-react';
import { AdBanner, AdInFeed } from '@/features/monetization/components/NativeAds';
import { NewsletterWidget } from '@/features/tools/components/NewsletterWidget';
import { PilotPulseWidget } from '@/features/tools/components/PilotPulseWidget';

export default async function HomePage() {
  const content = resolveHomepageContent();

  return (
    <div className="flex flex-col gap-16 pb-16">

      {/* ── HERO ── */}
      <section className="relative min-h-[90vh] flex text-left items-center justify-start overflow-hidden pt-20 px-4 sm:px-6 lg:px-16 mb-8 group">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#050505]/80 mix-blend-multiply z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B] via-[#050505]/95 to-transparent z-10" />
          <Image
            src="https://picsum.photos/seed/hero/2670/1200"
            alt="FPV Drone Motor Macro"
            fill
            className="object-cover opacity-30 mix-blend-screen scale-105 group-hover:scale-100 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-10" />
        </div>

        <div className="w-full max-w-7xl mx-auto z-20 grid lg:grid-cols-12 gap-12 items-center">
          <div className="flex flex-col gap-6 lg:col-span-7">
            <Badge variant="outline" className="w-fit mb-2 font-mono text-[#00F2FF] border-[#00F2FF]/30 tracking-[0.3em] font-bold">
              FPV EDITORIAL HUB
            </Badge>
            <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-black tracking-tighter uppercase leading-[0.9] text-white">
              <span className="opacity-90">FPV</span><br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F2FF] to-[#00A8B3] text-glow">
                LOVERS
              </span>
            </h1>
            <p className="text-[#A0A0A0] max-w-xl text-sm leading-relaxed font-mono uppercase">
              English-first FPV guides, engineering references, and practical AI tools for building, tuning, and learning faster.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-6">
              <Button size="lg" className="h-14 px-8 text-lg font-black tracking-widest" variant="default" asChild>
                <Link href="/academy/roadmap">
                  <span className="relative z-10 flex items-center">START LEARNING <Zap className="ml-3 w-5 h-5 fill-current opacity-70" /></span>
                </Link>
              </Button>
              <Button size="lg" className="h-14 px-8 font-black tracking-widest text-sm text-[#A0A0A0]" variant="cyber" asChild>
                <Link href="#guides">EXPLORE GUIDES</Link>
              </Button>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-6 text-xs font-mono text-[#666666] uppercase tracking-widest border-t border-[#333333] pt-6 w-max">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#00F2FF] rounded-full animate-pulse shadow-[0_0_8px_#00F2FF]" />
                ACADEMY: OPEN
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#FF5C00] rounded-full animate-pulse shadow-[0_0_8px_#FF5C00]" />
                ENGINEERING LAB: ONLINE
              </div>
            </div>
          </div>

          <div className="hidden lg:flex lg:col-span-5 justify-end relative h-[500px]">
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute w-[400px] h-[400px] border border-[#00F2FF]/10 clip-path-hex animate-[spin_30s_linear_infinite]" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
              <div className="absolute w-[350px] h-[350px] border-2 border-dashed border-[#FF5C00]/20 rounded-full animate-[spin_20s_linear_infinite_reverse]" />
              <div className="relative w-64 h-64 glass hex-panel flex items-center justify-center group-hover:border-[#00F2FF]/50 transition-colors duration-500 overflow-hidden">
                <div className="absolute inset-0 carbon-grid opacity-30" />
                <div className="absolute w-[200%] h-8 bg-gradient-to-b from-transparent via-[#00F2FF]/30 to-transparent -translate-x-1/2 -rotate-45 animate-[scanline_3s_linear_infinite]" />
                <Cpu className="w-24 h-24 text-[#00F2FF] opacity-80" />
                <div className="absolute bottom-4 text-[10px] font-mono text-[#00F2FF] font-black tracking-widest neon-text">
                  FC MODULE .// ONLINE
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PILOT PULSE TICKER ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 relative mt-[-2rem] mb-4">
        <PilotPulseWidget />
      </section>

      {/* ── SPONSOR STRIP ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 relative">
        <AdBanner title={content.sponsorSlot.title} className="min-h-[100px] bg-gradient-to-r from-[#050810] to-[#00F5FF]/5" />
      </section>

      {/* ── FEATURED GUIDES ── */}
      <section id="guides" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
            <span className="w-8 h-1 bg-[#00FF66] block" /> Featured Guides
          </h2>
          <Link href="/category/build-guides" className="text-xs font-mono text-[#A0A0A0] hover:text-white transition-colors flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {content.featuredGuides.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {content.featuredGuides.map((card) => (
              <Card key={card.slug} className="group border-[#00FF66]/10 hover:border-[#00FF66]/30 transition-colors">
                <CardHeader>
                  <Badge className="w-fit mb-3 bg-[#0A1A0A] border-[#00FF66]/30 text-[#00FF66]">{card.category}</Badge>
                  <Link href={card.href}>
                    <CardTitle className="group-hover:text-[#00FF66] transition-colors line-clamp-2 uppercase tracking-tight text-base">{card.title}</CardTitle>
                  </Link>
                  <CardDescription className="line-clamp-3 text-white/40">{card.excerpt}</CardDescription>
                </CardHeader>
                <CardFooter className="pt-0 text-xs text-[#A0A0A0] font-mono flex justify-between">
                  <span>{card.publishedAt}</span>
                  <span>{card.readingTime}</span>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-[#333] rounded-xl">
            <p className="text-[#A0A0A0] font-mono text-sm">Featured guides will appear here as content is published.</p>
          </div>
        )}
      </section>

      {/* ── PILOT ACADEMY ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-[#00F2FF]" /> Pilot Academy
          </h2>
          <Link href="/academy" className="text-xs font-mono text-[#A0A0A0] hover:text-white transition-colors flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {content.academyCards.map((card) => (
            <Link key={card.href} href={card.href} className="group bg-[#0A0A0B] border border-[#333] hover:border-[#00F2FF]/30 p-5 transition-colors">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#00F2FF] mb-2">{card.label}</div>
              <h3 className="text-sm font-bold text-white mb-1.5 group-hover:text-[#00F2FF] transition-colors">{card.title}</h3>
              <p className="text-xs text-[#A0A0A0] leading-relaxed">{card.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── ENGINEERING LAB ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
            <Wrench className="w-6 h-6 text-[#FF5C00]" /> Engineering Lab
          </h2>
          <Link href="/engineering" className="text-xs font-mono text-[#A0A0A0] hover:text-white transition-colors flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {content.engineeringCards.map((card) => (
            <Link key={card.href} href={card.href} className="group bg-[#0A0A0B] border border-[#333] hover:border-[#FF5C00]/30 p-5 transition-colors">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#FF5C00] mb-2">{card.label}</div>
              <h3 className="text-sm font-bold text-white mb-1.5 group-hover:text-[#FF5C00] transition-colors">{card.title}</h3>
              <p className="text-xs text-[#A0A0A0] leading-relaxed">{card.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── AI TOOLS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-[#FFD700]" /> AI Tools
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {content.toolCards.map((card, i) => (
            <Link key={card.href} href={card.href} className="group bg-[#0A0A0B] border border-[#333] hover:border-[#FFD700]/30 p-6 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                {i === 0 ? <Calculator className="w-5 h-5 text-[#FFD700]" /> : i === 1 ? <Cpu className="w-5 h-5 text-[#FFD700]" /> : <Wind className="w-5 h-5 text-[#FFD700]" />}
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#FFD700]">{card.label}</div>
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5 group-hover:text-[#FFD700] transition-colors">{card.title}</h3>
              <p className="text-xs text-[#A0A0A0] leading-relaxed">{card.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── IN-FEED AD ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <AdInFeed className="w-full min-h-[120px]" />
      </section>

      {/* ── RECENT POSTS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
            <span className="w-8 h-1 bg-[#A0A0A0] block" /> Recent Posts
          </h2>
        </div>

        {content.recentPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.recentPosts.map((card) => (
              <Card key={card.slug} className="group border-white/5 hover:border-white/10 transition-colors">
                <CardHeader>
                  <Badge className="w-fit mb-3 bg-[#111] border-[#333] text-[#A0A0A0]">{card.category}</Badge>
                  <Link href={card.href}>
                    <CardTitle className="group-hover:text-white transition-colors line-clamp-2 uppercase tracking-tight text-base">{card.title}</CardTitle>
                  </Link>
                  <CardDescription className="line-clamp-2 text-white/40">{card.excerpt}</CardDescription>
                </CardHeader>
                <CardFooter className="pt-0 text-xs text-[#A0A0A0] font-mono">
                  <span>{card.readingTime}</span>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-[#333] rounded-xl">
            <p className="text-[#A0A0A0] font-mono text-sm">Articles will appear here as they are published.</p>
          </div>
        )}
      </section>

      {/* ── EDITOR'S PICKS ── */}
      {content.editorsPicks.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
              <span className="w-8 h-1 bg-[#FFD700] block" /> Editor&apos;s Picks
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {content.editorsPicks.map((card) => (
              <Card key={card.slug} className="group border-[#FFD700]/10 hover:border-[#FFD700]/30 transition-colors">
                <CardHeader>
                  <Badge className="w-fit mb-3 bg-[#1A1A0A] border-[#FFD700]/30 text-[#FFD700]">{card.category}</Badge>
                  <Link href={card.href}>
                    <CardTitle className="group-hover:text-[#FFD700] transition-colors line-clamp-2 uppercase tracking-tight text-base">{card.title}</CardTitle>
                  </Link>
                  <CardDescription className="line-clamp-3 text-white/40">{card.excerpt}</CardDescription>
                </CardHeader>
                <CardFooter className="pt-0 text-xs text-[#A0A0A0] font-mono flex justify-between">
                  <span>{card.publishedAt}</span>
                  <span>{card.readingTime}</span>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── CATEGORY RAILS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Build Guides', href: '/category/build-guides', color: '#00FF66' },
            { label: 'Troubleshooting', href: '/category/troubleshooting', color: '#FF5C00' },
            { label: 'Flight Guides', href: '/category/flight-guides', color: '#00F2FF' },
            { label: 'News & Reviews', href: '/category/news-reviews', color: '#FFD700' },
          ].map((rail) => (
            <Link
              key={rail.href}
              href={rail.href}
              className="group bg-[#0A0A0B] border border-[#333] hover:border-current p-4 text-center transition-colors"
              style={{ ['--hover-color' as string]: rail.color } as React.CSSProperties}
            >
              <span className="text-xs font-mono font-bold text-white group-hover:text-[color:var(--hover-color)] transition-colors uppercase tracking-wide">{rail.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── NEWSLETTER / LOWER SPONSOR ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-4">
        <AdBanner title="SUPPORTED BY OUR PARTNERS" className="min-h-[80px] bg-gradient-to-r from-[#050810] to-[#FF5C00]/5 mb-8" />
        <NewsletterWidget />
      </section>

    </div>
  );
}
