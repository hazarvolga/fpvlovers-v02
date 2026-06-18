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
    { label: "Tools", href: "/tools" },
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 text-zinc-100">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Header Panel */}
          <div className="relative p-8 md:p-12 border border-white/5 bg-zinc-950 rounded-xl shadow-2xl overflow-hidden">
            <Shield className="w-12 h-12 text-[#FF5C00] mb-6 opacity-80" />
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-100 mb-4">
              Flight <span className="text-[#FF5C00]">Critic</span>
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed font-sans">
              Physical and electrical compatibility auditor for your active Build DNA.
            </p>
          </div>

          {dossier && build && auditResult ? (
            <>
              {/* Main Diagnostic Board */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-6">
                
                {/* Score Dial Card */}
                <div className={`p-6 border rounded-xl flex flex-col justify-between items-center text-center ${verdictBorder}`}>
                  <div className="w-full border-b border-white/5 pb-3 mb-4">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                      READINESS STATUS
                    </span>
                    <span className="text-lg font-bold text-white uppercase block mt-1">
                      {auditResult.verdict}
                    </span>
                  </div>

                  <div className="my-6">
                    <span className={`text-6xl font-black tracking-tighter ${scoreColor}`}>
                      {auditResult.score}%
                    </span>
                    <span className="block text-[10px] text-zinc-500 font-bold uppercase mt-2 tracking-widest">
                      COMPATIBILITY INDEX
                    </span>
                  </div>

                  <div className="text-[10px] text-zinc-400 uppercase leading-relaxed max-w-xs font-mono">
                    ACTIVE CALLSIGN: <span className="text-white font-bold">{dossier.callsign}</span>
                    <br />
                    BUILD CLASS: <span className="text-[#FF5C00] font-bold">{build.droneClass}</span>
                  </div>
                </div>

                {/* Mission selection panel */}
                <div className="p-6 border border-white/5 bg-zinc-950 rounded-xl flex flex-col justify-between shadow-lg">
                  <div>
                    <h3 className="text-xs uppercase text-[#00F2FF] font-bold border-b border-white/5 pb-2 mb-4 tracking-widest flex items-center gap-2">
                      <Compass className="w-4 h-4" /> Operational Mission Audit
                    </h3>
                    <p className="text-xs leading-relaxed text-zinc-400 mb-6 font-sans">
                      By default, Flight Critic audits core physical and electrical compatibility. To test if this layout matches specific flight mission bounds, select a target envelope:
                    </p>

                    <select
                      value={selectedMissionId}
                      onChange={handleMissionChange}
                      className="w-full bg-zinc-900 border border-white/10 p-3.5 rounded-lg text-white focus:outline-none focus:border-[#00F2FF] font-mono text-xs uppercase"
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
                    <div className="mt-6 border border-white/5 bg-zinc-900/50 p-4 rounded-lg text-xs font-mono">
                      <span className="text-[10px] text-[#FF5C00] font-bold uppercase tracking-widest block mb-1">
                        TARGET ENVELOPE REQUIREMENTS
                      </span>
                      <span className="text-white block font-bold uppercase">{selectedMission.name}</span>
                      <span className="text-zinc-400 block mt-1">
                        Max Wind: {selectedMission.envelope.maxWindSpeedKph} KPH | Weight: {selectedMission.envelope.allowableWeightClass}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Audited Warnings Card List */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold uppercase text-zinc-100 border-b border-white/10 pb-2 tracking-widest">
                  Diagnostic Alert Logs
                </h3>

                {auditResult.warnings.length > 0 ? (
                  <div className="space-y-4">
                    {auditResult.warnings.map((w, idx) => {
                      const isCrit = w.level === "critical";
                      const isCaut = w.level === "caution";
                      
                      const alertBorder = isCrit
                        ? "border-red-900/30 bg-red-950/20 border-l-4 border-l-red-500"
                        : isCaut
                          ? "border-yellow-900/20 bg-yellow-950/20 border-l-4 border-l-yellow-500"
                          : "border-blue-900/20 bg-blue-950/20 border-l-4 border-l-blue-500";

                      const alertBadge = isCrit
                        ? "text-red-400 bg-red-500/10 border border-red-500/20"
                        : isCaut
                          ? "text-yellow-400 bg-yellow-500/10 border border-yellow-500/20"
                          : "text-blue-400 bg-blue-500/10 border border-blue-500/20";

                      return (
                        <div key={idx} className={`p-5 rounded-lg border ${alertBorder} relative`}>
                          <div className="flex justify-between items-start gap-4 mb-2">
                            <h4 className="text-sm font-bold uppercase text-zinc-100 tracking-wide font-mono">
                              {w.title}
                            </h4>
                            <span className={`text-[10px] font-bold uppercase py-0.5 px-2 rounded font-mono ${alertBadge}`}>
                              {w.level}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                            {w.details}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 border border-[#00FF66]/20 bg-[#00FF66]/5 rounded-xl text-center text-xs">
                    <ShieldCheck className="w-12 h-12 text-[#00FF66] mx-auto mb-3 opacity-80" />
                    <span className="text-[#00FF66] font-bold uppercase block mb-1 tracking-widest">
                      BLUEPRINT SYSTEM CLEAR
                    </span>
                    <span className="text-zinc-400 font-sans">
                      No structural or electrical warning flags found. Active Build matches standard safe envelopes.
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Locked profile placeholder when cookie/build is missing */
            <div className="p-12 border border-white/5 bg-zinc-950 rounded-xl text-center shadow-2xl">
              <ShieldAlert className="w-16 h-16 text-[#FF5C00] mx-auto mb-6 animate-pulse" />
              <h3 className="text-xl font-bold tracking-tight text-zinc-100 mb-2">
                Dossier Blueprint Locked
              </h3>
              <p className="text-sm text-zinc-400 mb-8 font-sans">
                No active Build DNA loaded to Critic memory. Complete an assessment or load an archive.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
                <a
                  href="/academy/assessment"
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-white/10 font-bold py-3.5 px-6 rounded-lg text-xs uppercase tracking-wider transition-all duration-200"
                >
                  Start Archetype Quiz
                </a>
                
                <a
                  href="/archive"
                  className="bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-black border-none font-bold py-3.5 px-6 rounded-lg text-xs uppercase tracking-wider transition-all duration-200"
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
