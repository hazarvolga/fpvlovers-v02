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
    { label: "Drone Archive", href: "/archive", isCurrentPage: true }
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
          <div className="relative p-8 hex-panel glass-panel overflow-hidden border-[#FF5C00]/20 shadow-[inset_0_0_80px_rgba(255,92,0,0.03)] bg-[#050810]/70 rounded-lg">
            <div className="absolute inset-0 carbon-grid opacity-20 pointer-events-none" />
            <Database className="w-12 h-12 text-[#FF5C00] mb-6 opacity-80" />
            <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter mb-4">
              Drone <span className="text-[#FF5C00]">Archive V2</span>
            </h1>
            <p className="text-xs uppercase text-[#A0A0A0] tracking-widest max-w-2xl leading-relaxed">
              {"// THE FPV SPECIES EVOLUTION DATABASE — FROM MISSION TO AIRCRAFT DESIGN"}
            </p>
          </div>

          <div className="p-6 border border-[#FF5C00]/20 bg-[#FF5C00]/5 rounded text-xs leading-relaxed flex items-start gap-3">
            <Info className="w-5 h-5 text-[#FF5C00] flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-white font-black uppercase text-xs">EVOLUTIONARY TAXONOMY MATRIX:</span> Welcome to the digital registry of FPV flight dynamics. In this archive, categories are not treated as shopping collections. Instead, they represent distinct physical **Species**, engineered specifically to solve distinct **Missions**. Explore the designs, Build DNA, and evolution milestones below.
            </div>
          </div>

          {/* Categories Grid */}
          <div className="space-y-4">
            <h3 className="text-lg font-black uppercase text-[#f8fafc] border-b border-[#333333] pb-2 tracking-widest flex items-center gap-2">
              <Target className="w-5 h-5 text-[#FF5C00]" /> Operational Species Registry
            </h3>

            <div className="grid gap-6">
              {archiveCategories.map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <div
                    key={cat.id}
                    className="p-6 border border-[#1A1A1A] bg-[#050810]/50 hover:bg-[#0A0D14] transition-colors duration-200 rounded-lg relative overflow-hidden group border-l-2 border-l-[#FF5C00]/40 hover:border-l-[#FF5C00]"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-[#FF5C00]/10 p-3 rounded border border-[#FF5C00]/20 text-[#FF5C00] group-hover:bg-[#FF5C00]/20 transition-colors">
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-[10px] text-[#A0A0A0] uppercase font-black tracking-widest">{cat.name}</span>
                          <h4 className="text-lg font-black uppercase text-white tracking-tight mt-0.5">
                            {cat.subtitle}
                          </h4>
                          <p className="text-xs text-[#b0bfd6] mt-2 leading-relaxed max-w-xl">
                            {cat.desc}
                          </p>

                          {/* Telemetry quick overview */}
                          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-white/[0.04] text-[10px] font-mono">
                            <div>
                              <span className="text-[#8d8981] block">WEIGHT:</span>
                              <span className="text-white font-bold">{cat.telemetry.weight}</span>
                            </div>
                            <div>
                              <span className="text-[#8d8981] block">MOTORS:</span>
                              <span className="text-white font-bold">{cat.telemetry.motors}</span>
                            </div>
                            <div>
                              <span className="text-[#8d8981] block">PROP SIZE:</span>
                              <span className="text-white font-bold">{cat.telemetry.props}</span>
                            </div>
                            <div>
                              <span className="text-[#8d8981] block">ENVELOPE:</span>
                              <span className="text-white font-bold truncate block max-w-[120px]">{cat.telemetry.envelope}</span>
                            </div>
                          </div>

                        </div>
                      </div>
                      <a
                        id={cat.testId}
                        href={cat.link}
                        className="bg-black/50 hover:bg-[#FF5C00] border border-[#333333] hover:border-[#FF5C00] text-xs text-[#A0A0A0] hover:text-white font-black py-2.5 px-4 rounded uppercase tracking-wider transition-all duration-200 flex-shrink-0 self-end md:self-center"
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
                className="p-5 border border-[#1A1A1A] bg-[#050810]/50 hover:bg-[#0A0D14] transition-colors rounded-lg flex justify-between items-center group border-l-2 border-l-[#FF5C00]/30 hover:border-l-[#FF5C00]"
              >
                <div>
                  <h4 className="text-sm font-black uppercase text-white group-hover:text-[#FF5C00] transition-colors">
                    Alpine Peak Surfing
                  </h4>
                  <span className="text-[10px] text-[#A0A0A0] uppercase block mt-1">
                    Ideal Species: Long-Range Explorer
                  </span>
                </div>
                <span className="text-[#FF5C00] text-xs font-black uppercase">Study Spec →</span>
              </a>

              <a
                href="/archive/freestyle"
                className="p-5 border border-[#1A1A1A] bg-[#050810]/50 hover:bg-[#0A0D14] transition-colors rounded-lg flex justify-between items-center group border-l-2 border-l-[#FF5C00]/30 hover:border-l-[#FF5C00]"
              >
                <div>
                  <h4 className="text-sm font-black uppercase text-white group-hover:text-[#FF5C00] transition-colors">
                    Bando Proximity Acro
                  </h4>
                  <span className="text-[10px] text-[#A0A0A0] uppercase block mt-1">
                    Ideal Species: Freestyle Tactician
                  </span>
                </div>
                <span className="text-[#FF5C00] text-xs font-black uppercase">Study Spec →</span>
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
