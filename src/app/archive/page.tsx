"use client";

/**
 * Route shell for the Drone Archive Catalog Index (V2 FPV Species Database).
 * Catalogues aircraft archetypes, evolutionary milestones, and mission-driven design decisions.
 */

import React from "react";
import { CyberBreadcrumb } from "@/features/navigation/components/Breadcrumb";
import { AdStickySidebar } from "@/features/monetization/components/NativeAds";
import { Database, Cpu, Video, Compass, Info, Zap, Flag, Target } from "lucide-react";

export default function ArchiveIndexPage() {
  const breadcrumbs = [
    { label: "Fly", href: "/archive", isCurrentPage: true }
  ];

  const archiveCategories = [
    {
      id: "whoops",
      name: "Category 1 — Whoops",
      subtitle: "Indoor Micro Flight & Proximity",
      desc: "65mm-75mm sub-50g ducted propeller aircraft built for repetition, indoor muscle memory, and close-quarters training.",
      icon: Cpu,
      link: "/archive/whoops",
      testId: "category-link-whoops",
      telemetry: {
        weight: "17g - 35g",
        motors: "0702 / 0802 Brushless",
        props: "31mm - 40mm",
        envelope: "Indoor / Tight Proximity"
      }
    },
    {
      id: "freestyle",
      name: "Category 2 — Freestyle",
      subtitle: "Acromovements & Momentum",
      desc: "5.0-inch highly durable frames designed for mechanical symmetry, balanced roll/pitch axis physics, and high-G maneuvers.",
      icon: Zap,
      link: "/archive/freestyle",
      testId: "category-link-freestyle",
      telemetry: {
        weight: "550g - 750g (AUW)",
        motors: "2207 / 2208 / 2306",
        props: "5.0\" - 5.1\" True-X",
        envelope: "Acrobatic / Flow / Bando"
      }
    },
    {
      id: "cinematic",
      name: "Category 3 — Cinematic",
      subtitle: "Dynamic Imagery & Ducted Camera Ships",
      desc: "2.5-inch to 3.5-inch ducted CineWhoop platforms designed for smooth, stabilized, high-resolution close-proximity filming around humans.",
      icon: Video,
      link: "/archive/cinematic",
      testId: "category-link-cinematic",
      telemetry: {
        weight: "250g - 480g",
        motors: "2004 / 2105.5",
        props: "2.5\" - 3.5\" Ducted",
        envelope: "Stabilized 4K / Interior walkthroughs"
      }
    },
    {
      id: "racing",
      name: "Category 4 — Racing",
      subtitle: "Zero-Latency Track Competition",
      desc: "Stretched-X lightweight frames optimized for minimal aerodynamic drag, zero-latency video links, and high-pitch, short-burst speed.",
      icon: Flag,
      link: "/archive/racing",
      testId: "category-link-racing",
      telemetry: {
        weight: "260g - 320g (Dry)",
        motors: "2207 / 2208 2100KV+",
        props: "5.1\" Steep Tri-Blade",
        envelope: "Track Speed / Gate Agility"
      }
    },
    {
      id: "long-range",
      name: "Category 5 — Long-Range",
      subtitle: "Alpine Surfing & Cruise Endurance",
      desc: "7.0-inch to 10.0-inch Deadcat geometries running high-density Li-Ion cell packs, GPS rescue, and low-frequency RF link optimization.",
      icon: Compass,
      link: "/archive/long-range",
      testId: "category-link-long-range",
      telemetry: {
        weight: "480g - 650g (Dry)",
        motors: "2807 / 2808 / 2507",
        props: "7.0\" - 8.0\" Bi-Blade",
        envelope: "Mountain Surfing / 30m Cruise"
      }
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 text-[#f8fafc] font-mono">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Header Panel */}
          <div className="relative p-8 border border-white/5 bg-[#18181b] rounded-sm">
            <Database className="w-8 h-8 text-[#00F2FF] mb-6 opacity-80" />
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-1.5 w-1.5 rounded-full bg-[#00F2FF] animate-pulse" />
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#00F2FF]">Archive Initialization</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold uppercase text-zinc-100 tracking-tight mb-2">
              Fly <span className="text-[#FF5C00]">V2</span>
            </h1>
            <p className="text-[11px] uppercase text-zinc-500 font-mono tracking-widest max-w-2xl leading-relaxed">
              {"// THE FPV SPECIES EVOLUTION DATABASE — FROM MISSION TO AIRCRAFT DESIGN"}
            </p>
          </div>

          <div className="p-6 border border-white/10 bg-white/5 rounded-sm text-[11px] leading-relaxed flex items-start gap-3">
            <Info className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
            <div className="text-zinc-400 font-mono">
              <span className="text-zinc-200 font-bold uppercase text-[11px]">EVOLUTIONARY TAXONOMY MATRIX:</span> Welcome to the digital registry of FPV flight dynamics. In this archive, categories are not treated as shopping collections. Instead, they represent distinct physical **Species**, engineered specifically to solve distinct **Missions**. Explore the designs, Build DNA, and evolution milestones below.
            </div>
          </div>

          {/* Categories Grid */}
          <div className="space-y-4">
            <h3 className="text-lg font-black uppercase text-[#f8fafc] border-b border-[#333333] pb-2 tracking-widest flex items-center gap-2">
              <Target className="w-5 h-5 text-[#FF5C00]" /> Operational Species Registry
            </h3>

            <div className="grid gap-4">
              {archiveCategories.map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <div
                    key={cat.id}
                    className="p-6 border border-white/5 bg-[#18181b]/50 hover:bg-[#18181b] transition-colors duration-200 rounded-sm relative group border-l-2 border-l-transparent hover:border-l-[#FF5C00]"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-white/5 p-3 rounded-sm border border-white/10 text-zinc-400 group-hover:text-[#FF5C00] transition-colors">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">{cat.name}</span>
                          <h4 className="text-base font-bold uppercase text-zinc-100 tracking-wide mt-1 group-hover:text-[#FF5C00] transition-colors">
                            {cat.subtitle}
                          </h4>
                          <p className="text-[11px] font-mono text-zinc-400 mt-2 leading-relaxed max-w-xl">
                            {cat.desc}
                          </p>

                          {/* Telemetry quick overview */}
                          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/5 text-[9px] font-mono uppercase tracking-widest">
                            <div>
                              <span className="text-zinc-600 block mb-1">WEIGHT</span>
                              <span className="text-zinc-300 font-bold">{cat.telemetry.weight}</span>
                            </div>
                            <div>
                              <span className="text-zinc-600 block mb-1">MOTORS</span>
                              <span className="text-zinc-300 font-bold">{cat.telemetry.motors}</span>
                            </div>
                            <div>
                              <span className="text-zinc-600 block mb-1">PROP SIZE</span>
                              <span className="text-zinc-300 font-bold">{cat.telemetry.props}</span>
                            </div>
                            <div>
                              <span className="text-zinc-600 block mb-1">ENVELOPE</span>
                              <span className="text-zinc-300 font-bold truncate block max-w-[120px]">{cat.telemetry.envelope}</span>
                            </div>
                          </div>

                        </div>
                      </div>
                      <a
                        id={cat.testId}
                        href={cat.link}
                        className="bg-white/5 hover:bg-[#FF5C00]/10 border border-white/10 hover:border-[#FF5C00]/40 text-[10px] text-zinc-400 hover:text-[#FF5C00] font-bold py-3 px-5 rounded-sm uppercase tracking-widest transition-all duration-200 flex-shrink-0 self-end md:self-center"
                      >
                        Inspect Species →
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Missions Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-black uppercase text-[#f8fafc] border-b border-[#333333] pb-2 tracking-widest">
              Physical Flight Profiles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/archive/long-range"
                className="p-5 border border-white/5 bg-[#18181b]/50 hover:bg-[#18181b] transition-colors rounded-sm flex justify-between items-center group border-l-2 border-l-transparent hover:border-l-[#00F2FF]"
              >
                <div>
                  <h4 className="text-sm font-bold uppercase text-zinc-200 group-hover:text-[#00F2FF] transition-colors">
                    Alpine Peak Surfing
                  </h4>
                  <span className="text-[9px] text-zinc-500 font-mono uppercase block mt-1 tracking-widest">
                    Ideal Species: Long-Range Explorer
                  </span>
                </div>
                <span className="text-[#00F2FF] text-[10px] font-bold uppercase tracking-widest">Study Spec →</span>
              </a>

              <a
                href="/archive/freestyle"
                className="p-5 border border-white/5 bg-[#18181b]/50 hover:bg-[#18181b] transition-colors rounded-sm flex justify-between items-center group border-l-2 border-l-transparent hover:border-l-[#00FF66]"
              >
                <div>
                  <h4 className="text-sm font-bold uppercase text-zinc-200 group-hover:text-[#00FF66] transition-colors">
                    Bando Proximity Acro
                  </h4>
                  <span className="text-[9px] text-zinc-500 font-mono uppercase block mt-1 tracking-widest">
                    Ideal Species: Freestyle Tactician
                  </span>
                </div>
                <span className="text-[#00FF66] text-[10px] font-bold uppercase tracking-widest">Study Spec →</span>
              </a>
            </div>
          </div>

        </div>

        {/* Sidebar Native Ads */}
        <aside className="lg:col-span-4 hidden lg:flex flex-col gap-6">
          <AdStickySidebar />
        </aside>
      </div>
    </div>
  );
}
