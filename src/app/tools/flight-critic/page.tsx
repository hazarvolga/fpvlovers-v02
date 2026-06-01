"use client";

/**
 * Route Page for Flight Critic.
 * Dynamic cockpit interface running electrical and mechanical audits on the pilot's active Build DNA.
 * Connects directly to dynamic Mission Profile selectors.
 */

import React, { useEffect, useState } from "react";
import { CyberBreadcrumb } from "@/features/navigation/components/Breadcrumb";
import { AdStickySidebar } from "@/features/monetization/components/NativeAds";
import { loadDossierFromBrowser } from "@/lib/state/dossier-serializer";
import { auditBuildDNA, CriticWarning } from "@/lib/critic/flight-critic";
import { PilotDossier } from "@/types/pilot-dossier";
import { MissionProfile } from "@/types/mission-profile";
import { ShieldCheck, ShieldAlert, Shield, Compass, Target, Info, Play, RefreshCw } from "lucide-react";

const SYSTEM_MISSIONS: MissionProfile[] = [
  {
    id: "alpine-surfing",
    name: "High-Altitude Alpine Surfing",
    description: "Long range cruising.",
    assignedRequiredClass: "Long Range Explorer",
    envelope: {
      maxWindSpeedKph: 45,
      targetFlightDurationSeconds: 600,
      maxOperatingRangeMeters: 5000,
      allowableWeightClass: "OpenClass",
      minimumBecRatingAmps: 2.0
    },
    requiredHardwareKeywords: ["GPS", "ELRS_915M", "6S"],
    requiredSkillModules: ["gps-rescue"]
  },
  {
    id: "urban-freestyle",
    name: "Urban Proximity Freestyle",
    description: "Freestyle acrobatics.",
    assignedRequiredClass: "Freestyle Tactician",
    envelope: {
      maxWindSpeedKph: 30,
      targetFlightDurationSeconds: 240,
      maxOperatingRangeMeters: 500,
      allowableWeightClass: "OpenClass",
      minimumBecRatingAmps: 1.5
    },
    requiredHardwareKeywords: ["5 Inch", "6S", "Capacitor"],
    requiredSkillModules: ["pid-tuning-basics"]
  }
];

export default function FlightCriticPage() {
  const [dossier, setDossier] = useState<PilotDossier | null>(null);
  const [selectedMissionId, setSelectedMissionId] = useState<string>("");
  const [selectedMission, setSelectedMission] = useState<MissionProfile | null>(null);

  useEffect(() => {
    // Load dossier client-side from secure cookie
    Promise.resolve().then(() => {
      const activeDossier = loadDossierFromBrowser();
      setDossier(activeDossier);
    });
  }, []);

  const handleMissionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedMissionId(val);
    const found = SYSTEM_MISSIONS.find(m => m.id === val);
    setSelectedMission(found || null);
  };

  const breadcrumbs = [
    { label: "Pilot Tools", href: "/tools" },
    { label: "Flight Critic", isCurrentPage: true }
  ];

  const build = dossier?.activeBuild;
  const auditResult = build ? auditBuildDNA(build, selectedMission) : null;

  const scoreColor = auditResult
    ? auditResult.score >= 90
      ? "text-[#00FF66]"
      : auditResult.score >= 70
        ? "text-[#FF5C00]"
        : "text-red-500"
    : "";

  const verdictBorder = auditResult
    ? auditResult.verdict === "CLEAR"
      ? "border-[#00FF66]/20 bg-[#00FF66]/5"
      : auditResult.verdict === "CAUTION"
        ? "border-[#FF5C00]/20 bg-[#FF5C00]/5"
        : "border-red-900/30 bg-red-950/20"
    : "";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 text-[#f8fafc] font-mono">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Header Panel */}
          <div className="relative p-8 hex-panel glass-panel overflow-hidden border-[#FF5C00]/20 shadow-[inset_0_0_80px_rgba(255,92,0,0.03)] bg-[#050810]/70 rounded-lg">
            <div className="absolute inset-0 carbon-grid opacity-20 pointer-events-none" />
            <Shield className="w-12 h-12 text-[#FF5C00] mb-6 opacity-80" />
            <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter mb-4">
              Flight <span className="text-[#FF5C00]">Critic</span>
            </h1>
            <p className="text-xs uppercase text-[#A0A0A0] tracking-widest max-w-2xl leading-relaxed">
              {"// PHYSICAL & ELECTRICAL COMPATIBILITY AUDITOR"}
            </p>
          </div>

          {dossier && build && auditResult ? (
            <>
              {/* Main Diagnostic Board */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-6">
                
                {/* Score Dial Card */}
                <div className={`p-6 border rounded-lg flex flex-col justify-between items-center text-center ${verdictBorder}`}>
                  <div className="w-full border-b border-white/5 pb-3 mb-4">
                    <span className="text-[10px] text-[#A0A0A0] uppercase block tracking-widest">
                      READINESS STATUS
                    </span>
                    <span className="text-lg font-black text-white uppercase block mt-1">
                      {auditResult.verdict}
                    </span>
                  </div>

                  <div className="my-6">
                    <span className={`text-6xl font-black ${scoreColor}`}>
                      {auditResult.score}%
                    </span>
                    <span className="block text-[10px] text-[#A0A0A0] uppercase mt-2 tracking-widest">
                      COMPATIBILITY INDEX
                    </span>
                  </div>

                  <div className="text-[10px] text-[#A0A0A0] uppercase leading-relaxed max-w-xs">
                    ACTIVE CALLSIGN: <span className="text-white font-black">{dossier.callsign}</span>
                    <br />
                    BUILD CLASS: <span className="text-[#FF5C00] font-black">{build.droneClass}</span>
                  </div>
                </div>

                {/* Mission selection panel */}
                <div className="p-6 border border-[#1A1A1A] bg-[#050810]/80 rounded-lg flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs uppercase text-[#00F2FF] font-black border-b border-white/5 pb-2 mb-4 tracking-widest flex items-center gap-2">
                      <Compass className="w-4 h-4" /> Operational Mission Audit
                    </h3>
                    <p className="text-xs leading-relaxed text-[#A0A0A0] mb-6">
                      By default, Flight Critic audits core physical and electrical compatibility. To test if this layout matches specific flight mission bounds, select a target envelope:
                    </p>

                    <select
                      value={selectedMissionId}
                      onChange={handleMissionChange}
                      className="w-full bg-[#0A0D14] border border-[#00F2FF]/20 p-3.5 rounded text-white focus:outline-none focus:border-[#00F2FF] font-mono text-xs uppercase"
                    >
                      <option value="">-- Core Physical Audit Only --</option>
                      {SYSTEM_MISSIONS.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedMission && (
                    <div className="mt-6 border border-white/5 bg-black/40 p-4 rounded text-xs">
                      <span className="text-[10px] text-[#FF5C00] font-black uppercase tracking-widest block mb-1">
                        TARGET ENVELOPE REQUIREMENTS
                      </span>
                      <span className="text-white block font-black uppercase">{selectedMission.name}</span>
                      <span className="text-[#A0A0A0] block mt-1">
                        Max Wind: {selectedMission.envelope.maxWindSpeedKph} KPH | Weight: {selectedMission.envelope.allowableWeightClass}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Audited Warnings Card List */}
              <div className="space-y-4">
                <h3 className="text-lg font-black uppercase text-[#f8fafc] border-b border-[#333333] pb-2 tracking-widest">
                  Diagnostic Alert Logs
                </h3>

                {auditResult.warnings.length > 0 ? (
                  <div className="space-y-4">
                    {auditResult.warnings.map((w, idx) => {
                      const isCrit = w.level === "critical";
                      const isCaut = w.level === "caution";
                      
                      const alertBorder = isCrit
                        ? "border-red-900/30 bg-red-950/10 border-l-4 border-l-red-500"
                        : isCaut
                          ? "border-yellow-900/20 bg-yellow-950/10 border-l-4 border-l-yellow-500"
                          : "border-blue-900/20 bg-blue-950/10 border-l-4 border-l-blue-500";

                      const alertBadge = isCrit
                        ? "text-red-500 bg-red-500/10 border border-red-500/20"
                        : isCaut
                          ? "text-yellow-500 bg-yellow-500/10 border border-yellow-500/20"
                          : "text-blue-500 bg-blue-500/10 border border-blue-500/20";

                      return (
                        <div key={idx} className={`p-5 rounded border ${alertBorder} relative`}>
                          <div className="flex justify-between items-start gap-4 mb-2">
                            <h4 className="text-sm font-black uppercase text-white tracking-wide">
                              {w.title}
                            </h4>
                            <span className={`text-[10px] font-black uppercase py-0.5 px-2 rounded ${alertBadge}`}>
                              {w.level}
                            </span>
                          </div>
                          <p className="text-xs text-[#A0A0A0] leading-relaxed font-mono">
                            {w.details}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 border border-[#00FF66]/20 bg-[#00FF66]/5 rounded text-center text-xs">
                    <ShieldCheck className="w-12 h-12 text-[#00FF66] mx-auto mb-3 opacity-80" />
                    <span className="text-[#00FF66] font-black uppercase block mb-1">
                      BLUEPRINT SYSTEM CLEAR
                    </span>
                    <span className="text-[#A0A0A0] uppercase font-mono">
                      No structural or electrical warning flags found. Active Build matches standard safe envelopes.
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Locked profile placeholder when cookie/build is missing */
            <div className="p-8 border border-red-950/20 bg-[#050810]/80 rounded-lg text-center">
              <ShieldAlert className="w-16 h-16 text-[#FF5C00] mx-auto mb-6 animate-pulse" />
              <h3 className="text-xl font-black uppercase text-white tracking-widest mb-2">
                Dossier Blueprint Locked
              </h3>
              <p className="text-xs text-[#A0A0A0] uppercase mb-8">
                NO ACTIVE BUILD DNA LOADED TO CRITIC MEMORY.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
                <a
                  href="/academy/assessment"
                  className="bg-[#00F2FF]/10 hover:bg-[#00F2FF]/20 text-[#00F2FF] border border-[#00F2FF]/30 font-black py-3.5 px-6 rounded text-xs uppercase tracking-wider transition-all duration-200"
                >
                  Start Archetype Quiz
                </a>
                
                <a
                  href="/archive"
                  className="bg-[#FF5C00]/10 hover:bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30 font-black py-3.5 px-6 rounded text-xs uppercase tracking-wider transition-all duration-200"
                >
                  Browse reference Blueprints
                </a>
              </div>
            </div>
          )}

        </div>

        {/* Sidebar Native Ads */}
        <aside className="lg:col-span-4 hidden lg:flex flex-col gap-6">
          <AdStickySidebar />
        </aside>
      </div>
    </div>
  );
}
