"use client";

/**
 * Route shell for the Flight Progression Matrix (FPM).
 * Renders the non-linear operational pilot training phases and modules
 * dynamically linked to the active Pilot Dossier cookie state.
 */

import React, { useEffect, useState } from "react";
import { CyberBreadcrumb } from "@/features/navigation/components/Breadcrumb";
import { AdStickySidebar } from "@/features/monetization/components/NativeAds";
import { AISummaryBox } from "@/components/ui/AISummaryBox";
import { Map as MapIcon, Flag, CheckSquare, Shield, Award, Play } from "lucide-react";
import { loadDossierFromBrowser } from "@/lib/state/dossier-serializer";
import { PilotDossier } from "@/types/pilot-dossier";
import localRoadmap from "../../../../data/roadmap.json";

interface ModuleGate {
  id: string;
  name: string;
  objectives: string[];
  requiredArticles: string[];
  qualificationGate: {
    type: string;
    assignedTestId?: string;
    checkpointName?: string;
  };
  targetClass?: string;
}

interface PhaseNode {
  id: string;
  name: string;
  modules: ModuleGate[];
}

export default function RoadmapPage() {
  const [dossier, setDossier] = useState<PilotDossier | null>(null);

  useEffect(() => {
    // Load dossier client-side from secure cookie
    const activeDossier = loadDossierFromBrowser();
    Promise.resolve().then(() => {
      setDossier(activeDossier);
    });
  }, []);

  const breadcrumbs = [
    { label: "Pilot Academy", href: "/academy" },
    { label: "Pilot Roadmap", isCurrentPage: true }
  ];

  const phasesData = localRoadmap.phases as PhaseNode[];
  const qualifiedIds = dossier?.qualifications.qualifiedModuleIds || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 text-[#f8fafc] font-mono">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Header Panel */}
          <div className="relative p-8 hex-panel glass-panel overflow-hidden border-[#00F2FF]/20 shadow-[inset_0_0_80px_rgba(0,242,255,0.05)] bg-[#050810]/70 rounded-lg">
            <div className="absolute inset-0 carbon-grid opacity-20 pointer-events-none" />
            <div className="flex justify-between items-start">
              <div>
                <MapIcon className="w-12 h-12 text-[#00F2FF] mb-6 opacity-80" />
                <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter mb-4">
                  Pilot <span className="text-[#00F2FF]">Roadmap</span>
                </h1>
                <p className="text-xs uppercase text-[#A0A0A0] tracking-widest max-w-2xl leading-relaxed">
                  {"// INTERACTIVE MULTI-DISCIPLINE FLIGHT PROGRESSION MATRIX (FPM)"}
                </p>
              </div>
              {dossier ? (
                <a
                  href="/academy/dossier"
                  className="text-right bg-[#00F2FF]/5 hover:bg-[#00F2FF]/10 border border-[#00F2FF]/20 hover:border-[#00F2FF] p-4 rounded text-xs block transition-all duration-200"
                >
                  <p className="text-[#00F2FF] font-black uppercase">CALLSIGN: {dossier.callsign}</p>
                  <p className="text-[#A0A0A0] mt-1 font-black">CLASS: {dossier.assignedClass}</p>
                  <p className="text-[#00FF66] mt-1 font-mono uppercase tracking-widest">
                    ORL LEVEL: {dossier.qualifications.operationalReadinessLevel}
                  </p>
                  <p className="text-[10px] text-[#A0A0A0] mt-2 underline">Manage Dossier Card →</p>
                </a>
              ) : (
                <div className="text-right">
                  <a
                    href="/academy/assessment"
                    className="inline-flex items-center gap-2 bg-[#FF5C00] hover:bg-[#FF5C00]/80 text-white font-black py-2.5 px-4 rounded text-xs uppercase tracking-wider transition-colors duration-200 border-b-2 border-[#9E3900]"
                  >
                    <Play className="w-3.5 h-3.5" /> Initialize Dossier
                  </a>
                </div>
              )}
            </div>
          </div>

          <AISummaryBox
            content={
              dossier
                ? `Active pilot dossier detected: ${dossier.callsign}. You have unlocked ${qualifiedIds.length} operational qualification nodes. Follow the visual matrix below to qualify for active missions.`
                : "Operational checklist loaded. You are currently browsing in read-only guest mode. Initialize your pilot dossier credentials above to track and save your progression matrix."
            }
            title="SYS.DOSSIER_TELEMETRY"
          />

          {/* Matrix Phase List */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-[#333333] pb-2 mt-4">
              <Flag className="w-5 h-5 text-[#00F2FF]" />
              <h3 className="text-lg font-black uppercase text-[#f8fafc] tracking-widest">
                Qualification Nodes
              </h3>
            </div>

            <div className="flex flex-col gap-8">
              {phasesData.map((phase, i) => (
                <div key={phase.id} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[#00F2FF] font-black text-sm uppercase bg-[#00F2FF]/10 px-2 py-0.5 rounded border border-[#00F2FF]/20">
                      PHASE 0{i}
                    </span>
                    <h4 className="text-xl font-black uppercase text-white tracking-tight">{phase.name}</h4>
                  </div>

                  <div className="grid gap-6 pl-4 border-l border-[#00F2FF]/10">
                    {phase.modules
                      .filter((mod) => !mod.targetClass || !dossier || mod.targetClass === dossier.assignedClass)
                      .map((mod) => {
                        const isCompleted = qualifiedIds.includes(mod.id);
                        return (
                          <div
                            key={mod.id}
                            className={`p-6 border hex-panel transition-colors relative rounded-lg ${
                              isCompleted
                                ? "bg-[#00FF66]/5 border-[#00FF66]/20 hover:bg-[#00FF66]/10"
                                : "bg-[#050810]/50 border-[#1A1A1A] hover:bg-[#0A0D14]"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h5 className="text-lg font-black uppercase text-white tracking-tight">
                                  {mod.name}
                                </h5>
                                <p className="text-[10px] uppercase text-[#A0A0A0] font-mono mt-0.5 tracking-widest">
                                  MODULE ID: {mod.id}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {mod.targetClass && !dossier && (
                                  <span className="inline-flex items-center gap-1 text-[10px] uppercase text-[#FF5C00] bg-[#FF5C00]/10 px-2 py-1 rounded border border-[#FF5C00]/20 font-black">
                                    {mod.targetClass}
                                  </span>
                                )}
                                {isCompleted ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] uppercase text-[#00FF66] bg-[#00FF66]/10 px-2 py-1 rounded border border-[#00FF66]/20 font-black">
                                    <Award className="w-3.5 h-3.5" /> CLEARED
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] uppercase text-[#A0A0A0] bg-black/40 px-2 py-1 rounded border border-[#333333]">
                                    <Shield className="w-3.5 h-3.5" /> QUALIFYING
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <h6 className="text-xs uppercase text-[#00F2FF] font-black mb-2 tracking-widest">
                                {"// Target Objectives"}
                              </h6>
                              <ul className="space-y-2">
                                {mod.objectives.map((obj, j) => (
                                  <li key={j} className="flex items-start gap-2 text-xs text-[#A0A0A0]">
                                    <CheckSquare className="w-3.5 h-3.5 text-[#00F2FF] mt-0.5 flex-shrink-0" />
                                    {obj}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="border-t border-[#1A1A1A] pt-4 flex flex-wrap justify-between items-center gap-4">
                              <div className="text-[10px] uppercase text-[#A0A0A0]">
                                REQ GUIDES:{" "}
                                <span className="text-[#00F2FF] font-black">
                                  {mod.requiredArticles.length} Evergreen Nodes
                                </span>
                              </div>
                              <div className="text-[10px] uppercase text-[#A0A0A0]">
                                GATE TYPE:{" "}
                                <span className="text-[#FF5C00] font-black uppercase">
                                  {mod.qualificationGate.type}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
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
