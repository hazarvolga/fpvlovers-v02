"use client";

/**
 * Route shell for the Drone Archive Catalog Index.
 * Lists operational category blueprints, with custom semantic testing IDs,
 * routing users contextually down to individual Build DNA specifications.
 */

import React from "react";
import { CyberBreadcrumb } from "@/features/navigation/components/Breadcrumb";
import { AdStickySidebar } from "@/features/monetization/components/NativeAds";
import { Database, ShieldAlert, Cpu, Video, Compass, CompassIcon, Info } from "lucide-react";

export default function ArchiveIndexPage() {
  const breadcrumbs = [
    { label: "Drone Archive", href: "/archive", isCurrentPage: true }
  ];

  const archiveCategories = [
    {
      id: "freestyle",
      name: "Freestyle & Cinematic",
      desc: "5-inch high-G acrobatics and cinelifter rigs built to carry heavy visual payloads.",
      icon: Video,
      link: "/archive/freestyle",
      testId: "category-link-freestyle-cinematic"
    },
    {
      id: "long-range",
      name: "Long Range Explorer",
      desc: "7-inch deadcat configurations optimized for alpine surfing and low-frequency RF penetration.",
      icon: Compass,
      link: "/archive/long-range",
      testId: "category-link-long-range"
    },
    {
      id: "whoops",
      name: "Whoops & Micro Indoor",
      desc: "65mm-85mm sub-250g indoor aircraft with integrated propeller duct protection.",
      icon: Cpu,
      link: "/archive/whoops",
      testId: "category-link-whoops"
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
              Drone <span className="text-[#FF5C00]">Archive</span>
            </h1>
            <p className="text-xs uppercase text-[#A0A0A0] tracking-widest max-w-2xl leading-relaxed">
              {"// PHYSICAL COMPONENT DATASETS & BLUEPRINT SPECIFICATIONS"}
            </p>
          </div>

          <div className="p-6 border border-[#FF5C00]/20 bg-[#FF5C00]/5 rounded text-xs leading-relaxed flex items-start gap-3">
            <Info className="w-5 h-5 text-[#FF5C00] flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-white font-black uppercase">BLUEPRINT DIRECTORY DETECTED:</span> Each entry represents a verified, flight-tested Build DNA blueprint designed to satisfy specific Mission Profile constraints. Select a category below to browse specs, guides, and related troubleshooting articles.
            </div>
          </div>

          {/* Categories Grid */}
          <div className="space-y-4">
            <h3 className="text-lg font-black uppercase text-[#f8fafc] border-b border-[#333333] pb-2 tracking-widest">
              Physical Categories
            </h3>

            <div className="grid gap-6">
              {archiveCategories.map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <div
                    key={cat.id}
                    className="p-6 border border-[#1A1A1A] bg-[#050810]/50 hover:bg-[#0A0D14] transition-colors duration-200 rounded-lg relative overflow-hidden group border-l-2 border-l-[#FF5C00]/40 hover:border-l-[#FF5C00]"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-[#FF5C00]/10 p-3 rounded border border-[#FF5C00]/20 text-[#FF5C00]">
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black uppercase text-white tracking-tight">
                            {cat.name}
                          </h4>
                          <p className="text-xs text-[#A0A0A0] mt-1 leading-relaxed max-w-xl">
                            {cat.desc}
                          </p>
                        </div>
                      </div>
                      <a
                        id={cat.testId}
                        href={cat.link}
                        className="bg-black/50 hover:bg-[#FF5C00] border border-[#333333] hover:border-[#FF5C00] text-xs text-[#A0A0A0] hover:text-white font-black py-2.5 px-4 rounded uppercase tracking-wider transition-all duration-200"
                      >
                        Launch Specifications
                      </a>
                    </div>
                  </div>
                );
              })}
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
