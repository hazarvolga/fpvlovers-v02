import React from 'react';
import Link from 'next/link';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import {
  Info, Target, GraduationCap, Wrench,
  Compass, Radio, Users, Cpu, FileText
} from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Mission Control | FPVLovers',
  description: 'Learn about FPVLovers—an FPV Knowledge Operating System designed to help pilots make better decisions through empirical data, calculators, and reviews.',
};

export default function AboutPage() {
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'About', isCurrentPage: true },
  ];

  const focusAreas = [
    {
      icon: GraduationCap,
      title: 'Learning (Pilot Academy)',
      description: 'Step-by-step roadmaps, telemetry breakdowns, and mental models designed to take beginner pilots to fully autonomous acro flight.',
      color: '#00F2FF',
    },
    {
      icon: Wrench,
      title: 'Building (Engineering Lab)',
      description: 'Evidence-aware component comparisons, ESC protocols, soldering tutorials, and wiring references with testing status stated explicitly.',
      color: '#FF5C00',
    },
    {
      icon: Radio,
      title: 'Flying (Airspace Logs)',
      description: 'Flight planning, wind shadows, signal security, GPS rescue setup, and failsafe mitigation guides for long-range and freestyle pilots.',
      color: '#00FF66',
    },
    {
      icon: Target,
      title: 'Racing (RaceSync)',
      description: 'Championship standings, team profiles, MultiGP qualifiers, and esport simulation schedules for competitive pilots.',
      color: '#A855F7',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 text-zinc-300 font-sans">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      {/* Header Panel */}
      <div className="relative p-8 md:p-12 border border-white/5 bg-zinc-950 rounded-xl shadow-2xl overflow-hidden mb-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00F2FF]/40 to-transparent" />
        <div className="pointer-events-none absolute inset-0 carbon-grid opacity-10" />

        <div className="relative z-10">
          <Info className="w-12 h-12 text-[#00F2FF] mb-6 animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-100 mb-4 uppercase">
            Mission <span className="text-[#00F2FF]">Control</span>
          </h1>
          <p className="text-[10px] uppercase text-[#00F2FF] tracking-widest leading-relaxed font-mono">
            {"// DOCUMENT ID: FPV.MISSION_OBJECTIVES_v1.0"}
          </p>
          <p className="text-xs text-zinc-500 font-mono mt-2 uppercase tracking-widest">
            Last Updated: June 19, 2026
          </p>
        </div>
      </div>

      {/* Core Narrative */}
      <div className="space-y-12">
        {/* Intro */}
        <div className="prose prose-invert max-w-none text-zinc-400 leading-relaxed font-sans">
          <p className="text-lg text-zinc-100 font-bold mb-4">
            FPVLovers is NOT an e-commerce platform. We do not sell hardware, maintain stock catalogs, or operate price comparison engines.
          </p>
          <p>
            FPVLovers is an <strong>FPV Knowledge Operating System</strong>. We provide pilots, builders, and racers with the empirical tools, calculations, and structured reference material needed to make clean engineering decisions before they plug in a battery or power up a transmitter.
          </p>
        </div>

        {/* Why it exists */}
        <div className="p-6 md:p-8 border border-white/5 bg-zinc-900/40 rounded-xl">
          <h2 className="text-xl font-bold uppercase text-zinc-100 tracking-wider mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#FF5C00]" /> Why We Exist
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400 mb-4">
            The FPV drone ecosystem moves at breakneck speeds. Firmware releases, hardware protocol changes (analog vs. digital, ELRS packet rates, gyro filters), and battery safety guidelines are scattered across dozens of forums, chat rooms, and YouTube channels.
          </p>
          <p className="text-sm leading-relaxed text-zinc-400">
            For beginners, this leads to information overload and costly component blowouts. For veterans, it makes comparative analysis tedious. We exist to centralize, structure, and validate FPV knowledge using modern software engineering practices.
          </p>
        </div>

        {/* Focus Areas Grid */}
        <div>
          <h2 className="text-xl font-bold uppercase text-zinc-100 tracking-wider mb-6 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#00F2FF]" /> Niche Focus Areas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {focusAreas.map((area, idx) => (
              <div key={idx} className="p-6 border border-white/5 bg-zinc-950/40 rounded-lg group hover:border-[#00F2FF]/40 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-2 border rounded-md bg-black/40"
                    style={{ borderColor: `${area.color}20`, color: area.color }}
                  >
                    <area.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-zinc-100 uppercase tracking-wide">
                    {area.title}
                  </h3>
                </div>
                <p className="text-xs leading-relaxed text-zinc-400">
                  {area.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Founder & Platform Story */}
        <div className="p-6 md:p-8 border border-white/5 bg-zinc-900/40 rounded-xl">
          <h2 className="text-xl font-bold uppercase text-zinc-100 tracking-wider mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00FF66]" /> Founder & Platform Story
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400 mb-4">
            FPVLovers was created to reduce costly FPV purchasing and setup mistakes caused by fragmented documentation, changing firmware, and unclear compatibility guidance.
          </p>
          <p className="text-sm leading-relaxed text-zinc-400">
            Our goal is to build an independent, openly explained knowledge system. Affiliate links and sponsorships may support operations in the future, but commercial relationships will be disclosed and will not purchase a favorable verdict.
          </p>
        </div>

        {/* Tech Stack Disclosure */}
        <div className="p-6 md:p-8 border border-[#00F2FF]/20 bg-[#00F2FF]/5 rounded-xl">
          <h2 className="text-xl font-bold uppercase text-zinc-100 tracking-wider mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#00F2FF]" /> Technical Infrastructure & Human Review
          </h2>
          <p className="text-sm leading-relaxed text-zinc-300 mb-4">
            FPVLovers leverages an advanced autonomous content infrastructure to monitor the FPV ecosystem:
          </p>
          <ul className="space-y-2.5 text-xs text-zinc-400 font-mono mb-6">
            <li className="flex items-start gap-2">
              <span className="text-[#00F2FF] font-bold">&gt;</span>
              <span><strong>Crawl4AI Pipelines:</strong> We run automated agents to monitor and parse technical specification updates from verified global FPV vendors.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#00F2FF] font-bold">&gt;</span>
              <span><strong>Qdrant & Dify workflows:</strong> Harvester data is chunked and stored in vector indexes to power our FPV Assistant RAG datasets.</span>
            </li>
          </ul>
          <div className="p-4 bg-black/60 border border-white/10 rounded-lg text-xs leading-relaxed text-zinc-300">
            <strong className="text-white block uppercase mb-1">⚠️ Critical Editorial Guard:</strong>
            Non-review content can be researched and published autonomously after quality safeguards. Product reviews cannot: they require evidence, a stated testing method, product-relationship disclosure, and approval by Product Review Editor Hazar Volga Ekiz. Automation never substitutes for first-hand testing.
          </div>
        </div>
      </div>

      {/* Return Button */}
      <div className="mt-12 text-center p-6 border-t border-white/5 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
        <Link href="/" className="inline-block text-[#00F2FF] hover:underline">
          Return to Mission Control
        </Link>
      </div>
    </div>
  );
}
