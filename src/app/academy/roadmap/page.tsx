"use client";

/**
 * Route shell for the Flight Progression Matrix (FPM).
 * Renders the non-linear operational pilot training phases and modules
 * dynamically linked to the active Pilot Dossier cookie state.
 */

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CyberBreadcrumb } from "@/features/navigation/components/Breadcrumb";
import { AdStickySidebar } from "@/features/monetization/components/NativeAds";
import { AISummaryBox } from "@/components/ui/AISummaryBox";
import { Map as MapIcon, Flag, CheckSquare, Shield, Award, Play, Lock, BookOpen } from "lucide-react";
import { loadDossierFromBrowser, saveDossierToBrowser } from "@/lib/state/dossier-serializer";
import { PilotDossier, PilotClass } from "@/types/pilot-dossier";
import localRoadmap from "../../../../data/roadmap.json";
import { useSession, signOut } from "next-auth/react";

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

const ARTICLE_TITLES: Record<string, string> = {
  "fpv-beginner-setup-guide-the-easiest-way-to-get-flying": "Beginner FQP Setup Guide",
  "the-best-fpv-simulators-in-2026-save-cash-and-log-hours-virtually": "The Best FPV Simulators in 2026",
  "acro-mode-mental-model-for-fpv-beginners": "Acro Mode Mental Model",
  "first-hover-training": "First Hover Training",
  "how-to-choose-your-first-fpv-radio": "Choose Your First FPV Radio",
  "expresslrs-beginner-guide": "ExpressLRS Beginner Guide",
  "fpv-goggles-buyers-guide": "FPV Goggles Buyer's Guide",
  "lipo-battery-safety-guide": "LiPo Battery Safety & Charging",
  "drone-anatomy-complete-guide": "FPV Drone Anatomy",
  "fpv-motors-kv-and-stator-explained": "FPV Motors (KV & Stator)",
  "fpv-soldering-masterclass": "Drone Soldering Masterclass",
  "smoke-stopper-protocol": "Smoke Stopper Protocol",
  "betaflight-pid-basics": "Betaflight PID Basics",
  "no-video-troubleshooting-guide": "Video Troubleshooting Checklist",
  "gps-rescue-setup-guide": "GPS Rescue Setup Guide",
  "cinematic-fpv-orbit-techniques": "Cinematic Orbit Techniques",
  "long-range-fpv-basics-how-to-fly-beyond-the-trees-safely": "Long Range FPV Basics",
  "how-to-choose-your-first-fpv-radio-without-buying-twice": "Choose Your First FPV Radio (Legacy)",
  "expresslrs-binding-and-flashing-guide-step-by-step-for-edgetx-betaflight": "ExpressLRS Flashing Guide (Legacy)",
  "fpv-goggles-buying-guide-analog-vs-digital-for-beginners": "FPV Goggles Buying Guide (Legacy)",
  "fpv-lipo-battery-safety-charging-guide-prevent-fires-and-fly-longer": "LiPo Battery Safety & Charging (Legacy)",
  "how-to-choose-fpv-motors-understanding-kv-stator-size-and-propeller-matching": "How to Choose FPV Motors (Legacy)",
  "soldering-guide-for-fpv-drone-builders-solder-pads-temperature-and-tools": "Drone Soldering Masterclass (Legacy)",
  "betaflight-pid-basics-for-beginners-start-with-the-right-mental-model": "Betaflight PID Basics (Legacy)",
  "no-video-in-fpv-a-beginner-troubleshooting-checklist": "FPV Video Troubleshooting Checklist (Legacy)",
  "gps-rescue-mode-setup-in-betaflight-never-lose-a-drone-to-a-failsafe": "GPS Rescue Setup in Betaflight (Legacy)",
};

function calculateOrlLevel(completedIds: string[]): "ORL-0" | "ORL-1" | "ORL-2" | "ORL-3" | "ORL-Elite" {
  if (completedIds.includes("gps-rescue-setup")) return "ORL-3";
  if (completedIds.includes("soldering-masterclass")) return "ORL-2";
  if (completedIds.includes("simulator-muscle-memory")) return "ORL-1";
  return "ORL-0";
}

export default function RoadmapPage() {
  const { data: session, status } = useSession();
  const [dossier, setDossier] = useState<PilotDossier | null>(null);
  const [verifyingModule, setVerifyingModule] = useState<ModuleGate | null>(null);
  const [checkedObjectives, setCheckedObjectives] = useState<Record<number, boolean>>({});
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(typeof window !== "undefined" ? !window.navigator.onLine : false);
  const [isManualOpen, setIsManualOpen] = useState(false);

  const triggerSync = useCallback(async () => {
    if (typeof window === "undefined" || !window.navigator.onLine || status !== "authenticated") return;
    setSyncing(true);
    try {
      // 1. Fetch current database progress
      const res = await fetch("/api/pilot/progress");
      if (!res.ok) throw new Error("Failed to fetch progress");
      const dbData = await res.json();
      
      const dbSteps = dbData.completed_steps || [];
      const dbSpecialization = dbData.current_specialization || null;

      // 2. Load local dossier
      const activeDossier = loadDossierFromBrowser();
      const localSteps = activeDossier?.qualifications?.qualifiedModuleIds || [];
      const localClass = activeDossier?.assignedClass || null;

      // 3. Check if we need to sync (merge) local progress into DB
      const hasNewLocalSteps = localSteps.some((step: string) => !dbSteps.includes(step));
      const hasNewLocalSpecialization = localClass && localClass !== dbSpecialization;
      
      let finalSteps = dbSteps;
      let finalSpecialization = dbSpecialization;

      if (hasNewLocalSteps || hasNewLocalSpecialization) {
        const combinedSteps = Array.from(new Set([...localSteps, ...dbSteps]));
        const mergedSpecialization = localClass || dbSpecialization || "Beginner";
        
        // Push merged state to database
        const syncRes = await fetch("/api/pilot/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            completed_steps: combinedSteps,
            current_specialization: mergedSpecialization,
          }),
        });

        if (syncRes.ok) {
          const syncData = await syncRes.json();
          finalSteps = syncData.data.completed_steps;
          finalSpecialization = syncData.data.current_specialization;
          setSyncMessage("📡 Telemetry Synced: Cloud flight dossier synchronized.");
          setTimeout(() => setSyncMessage(null), 4000);
        }
      } else {
        // If local dossier is missing or out of sync with DB, pull down DB progress
        const isCookieOutOfSync = localSteps.length !== dbSteps.length || localClass !== dbSpecialization;
        if (!activeDossier || isCookieOutOfSync) {
          finalSteps = dbSteps;
          finalSpecialization = dbSpecialization;
        }
      }

      // Reconstruct local cookie dossier to match synchronized state
      const synchronizedDossier: PilotDossier = {
        callsign: session?.user?.name || activeDossier?.callsign || "Pilot",
        assignedClass: (finalSpecialization as PilotClass) || activeDossier?.assignedClass || null,
        qualifications: {
          qualifiedModuleIds: finalSteps,
          classRatings: activeDossier?.qualifications?.classRatings || [],
          operationalReadinessLevel: calculateOrlLevel(finalSteps),
        },
        activeBuild: activeDossier?.activeBuild || null,
        calibrationProfile: activeDossier?.calibrationProfile || {
          stickRates: "Defaults",
          rcLinkFrequencyHz: 500,
        },
        lastSavedAt: new Date().toISOString(),
      };

      saveDossierToBrowser(synchronizedDossier);
      setDossier(synchronizedDossier);
    } catch (err) {
      console.error("Telemetry sync failed:", err);
    } finally {
      setSyncing(false);
    }
  }, [status, session]);

  useEffect(() => {
    if (status === "authenticated") {
      const syncTimeout = setTimeout(() => {
        triggerSync();
      }, 0);
      return () => clearTimeout(syncTimeout);
    } else if (status === "unauthenticated") {
      // For guests, just load their local cookie dossier
      const activeDossier = loadDossierFromBrowser();
      const dossierTimeout = setTimeout(() => {
        setDossier(activeDossier);
      }, 0);
      return () => clearTimeout(dossierTimeout);
    }
  }, [status, triggerSync]);

  useEffect(() => {
    const goOnline = () => {
      setIsOffline(false);
      if (status === "authenticated") {
        triggerSync();
      }
    };
    const goOffline = () => setIsOffline(true);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [status, triggerSync]);

  const breadcrumbs = [
    { label: "Pilot Academy", href: "/academy" },
    { label: "Pilot Roadmap", isCurrentPage: true }
  ];

  const phasesData = localRoadmap.phases as PhaseNode[];
  const qualifiedIds = dossier?.qualifications.qualifiedModuleIds || [];

  const isPhaseLocked = (phaseIndex: number): boolean => {
    if (phaseIndex === 0) return false;
    for (let p = 0; p < phaseIndex; p++) {
      const priorPhase = phasesData[p];
      const hasIncomplete = priorPhase.modules
        .filter((mod) => !mod.targetClass || !dossier || mod.targetClass === dossier.assignedClass)
        .some((mod) => !qualifiedIds.includes(mod.id));
      if (hasIncomplete) return true;
    }
    return false;
  };

  const handleVerifyModule = async (moduleId: string) => {
    if (!dossier) return;
    const updatedQualifiedIds = [...qualifiedIds];
    if (!updatedQualifiedIds.includes(moduleId)) {
      updatedQualifiedIds.push(moduleId);
    }
    let newOrl = dossier.qualifications.operationalReadinessLevel;
    if (moduleId === "simulator-muscle-memory") {
      newOrl = "ORL-1";
    } else if (moduleId === "soldering-masterclass") {
      newOrl = "ORL-2";
    } else if (moduleId === "gps-rescue-setup") {
      newOrl = "ORL-3";
    }
    const updatedDossier: PilotDossier = {
      ...dossier,
      qualifications: {
        ...dossier.qualifications,
        qualifiedModuleIds: updatedQualifiedIds,
        operationalReadinessLevel: newOrl,
      },
      lastSavedAt: new Date().toISOString(),
    };
    
    saveDossierToBrowser(updatedDossier);
    setDossier(updatedDossier);

    if (status === "authenticated" && typeof window !== "undefined" && window.navigator.onLine) {
      setSyncing(true);
      try {
        const res = await fetch("/api/pilot/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            completed_steps: updatedQualifiedIds,
            current_specialization: updatedDossier.assignedClass || "Beginner",
          }),
        });
        if (res.ok) {
          setSyncMessage("📡 Rating Certified: Synced to secure cloud dossier.");
          setTimeout(() => setSyncMessage(null), 4000);
        }
      } catch (err) {
        console.error("Failed to sync certified module to cloud:", err);
      } finally {
        setSyncing(false);
      }
    }
  };

  const getActiveObjective = () => {
    if (!dossier) return null;
    for (const phase of phasesData) {
      for (const mod of phase.modules) {
        if (mod.targetClass && mod.targetClass !== dossier.assignedClass) continue;
        const isCompleted = qualifiedIds.includes(mod.id);
        if (!isCompleted) {
          return {
            phaseName: phase.name,
            module: mod,
          };
        }
      }
    }
    return null;
  };

  const activeObj = getActiveObjective();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 text-zinc-300 font-sans">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      {/* Offline Bar & Sync Notification HUD */}
      {isOffline && (
        <div className="mb-6 bg-[#FF5C00]/10 border border-[#FF5C00]/30 py-3 px-4 flex items-center justify-between text-xs text-[#FF5C00] font-mono animate-pulse rounded">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF5C00]" />
            📡 UÇUŞ ALANI ÇEVRİMDIŞI MODU AKTİF // OFFLINE TELEMETRY LOCAL CACHE
          </span>
          <span className="hidden sm:inline uppercase text-[9px] tracking-widest text-[#FF5C00]/70 font-black">
            RESOLVING WITH LOCAL COOKIE PACKS
          </span>
        </div>
      )}

      {syncMessage && (
        <div className="mb-6 bg-[#00FF66]/10 border border-[#00FF66]/30 py-3 px-4 flex items-center justify-between text-xs text-[#00FF66] font-mono rounded animate-fadeIn">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping" />
            {syncMessage}
          </span>
          {syncing && <span className="animate-spin text-[#00FF66]">⚡</span>}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-10">
          
          {/* Header Panel */}
          <div className="relative p-8 md:p-12 border border-white/5 bg-zinc-950 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-8 relative z-10">
              <div>
                <MapIcon className="w-12 h-12 text-[#FF5C00] mb-6" />
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-100 mb-4">
                  Pilot <span className="text-[#FF5C00]">Roadmap</span>
                </h1>
                <p className="text-xs uppercase text-[#A0A0A0] tracking-widest max-w-2xl leading-relaxed mb-4">
                  {"// INTERACTIVE MULTI-DISCIPLINE FLIGHT PROGRESSION MATRIX (FPM)"}
                </p>
                <button
                  onClick={() => setIsManualOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-[#FF5C00]/10 hover:bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30 hover:border-[#FF5C00]/60 font-black py-1.5 px-3 rounded text-[10px] uppercase tracking-wider transition-all duration-200 pointer-events-auto cursor-pointer"
                >
                  📡 [?] SYSTEM_MANUAL
                </button>
              </div>
              {dossier ? (
                <div className="flex flex-col gap-3 items-end w-full sm:w-auto">
                  <a
                    href="/academy/dossier"
                    className="text-right bg-zinc-900 border border-white/10 hover:border-white/30 p-5 rounded-lg text-xs block transition-all duration-200 w-full sm:w-auto"
                  >
                    <div className="flex items-center justify-end gap-2 mb-2">
                      {syncing && <span className="animate-spin text-[#00F2FF]">⚙️</span>}
                      <p className="text-zinc-100 font-mono font-bold uppercase tracking-widest" title="Your official telemetry pilot identifier.">CALLSIGN: {dossier.callsign}</p>
                    </div>
                    <p className="text-[#A0A0A0] mt-1 font-black" title="Your specialized flight class calibrated during assessment.">CLASS: {dossier.assignedClass} ℹ️</p>
                    <p className="text-[#00FF66] mt-1 font-mono uppercase tracking-widest" title="Operational Readiness Level: your active pilot qualification tier.">
                      ORL LEVEL: {dossier.qualifications.operationalReadinessLevel} ℹ️
                    </p>
                    <p className="text-[10px] text-[#A0A0A0] mt-2 underline">Manage Dossier Card →</p>
                  </a>
                  {status === "authenticated" && (
                    <button
                      onClick={() => signOut()}
                      className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase tracking-wider transition-colors bg-transparent border-none cursor-pointer self-end"
                    >
                      [x] De-authorize Session
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-right flex flex-col gap-3 items-stretch w-full sm:w-auto">
                  <a
                    href="/academy/assessment"
                    className="inline-flex items-center justify-center gap-2 bg-transparent hover:bg-white/5 border border-white/20 hover:border-white/40 text-white font-black py-2.5 px-4 rounded text-xs uppercase tracking-wider transition-all duration-200"
                  >
                    <Play className="w-3.5 h-3.5" /> Assessment
                  </a>
                  <a
                    href="/auth/signin"
                    className="inline-flex items-center justify-center gap-2 bg-[#FF5C00] hover:bg-[#FF5C00]/80 text-white font-black py-2.5 px-4 rounded text-xs uppercase tracking-wider transition-colors duration-200 border-b-2 border-[#9E3900]"
                  >
                    Authorize Session
                  </a>
                </div>
              )}
            </div>
          </div>

          <AISummaryBox
            content={
              dossier
                ? `Active pilot dossier detected: ${dossier.callsign}. You have unlocked ${qualifiedIds.length} operational qualification nodes. Follow the visual matrix below to qualify for active missions.`
                : "Operational checklist loaded. You are currently browsing in read-only guest mode. Authorize your session or complete pilot archetype assessment to start tracking your flight ratings."
            }
            title="SYS.DOSSIER_TELEMETRY"
          />

          {/* Active Flight Objective HUD / Guest Mode Activation CTA */}
          {dossier ? (
            activeObj && (
              <div className="relative p-8 border border-white/5 bg-zinc-900 rounded-xl shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#FF5C00] text-black text-[10px] uppercase font-bold px-4 py-1 tracking-widest">
                  Active Flight Objective
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mt-2">
                  <div className="space-y-2">
                    <p className="text-xs uppercase text-[#FF5C00] font-black tracking-widest">
                      {activeObj.phaseName} — Active Sortie Target
                    </p>
                    <h4 className="text-xl font-black uppercase text-white tracking-tight">
                      {activeObj.module.name}
                    </h4>
                    <p className="text-xs text-[#A0A0A0] leading-relaxed max-w-xl">
                      Next Step: Read the study guides and complete: <span className="text-white font-bold">&quot;{activeObj.module.qualificationGate.checkpointName || activeObj.module.name}&quot;</span> to certify readiness.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 items-stretch md:items-center w-full md:w-auto flex-shrink-0">
                    {activeObj.module.requiredArticles.length > 0 && (
                      <Link
                        href={`/article/${activeObj.module.requiredArticles[0]}`}
                        className="text-center bg-[#FF5C00] hover:bg-[#FF5C00]/95 text-white font-black py-3 px-6 rounded text-xs uppercase tracking-wider transition-colors duration-200 border-b-4 border-[#9E3900]"
                      >
                        Start Training
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setVerifyingModule(activeObj.module);
                        setCheckedObjectives({});
                      }}
                      className="text-center bg-zinc-800 hover:bg-[#00FF66]/10 text-zinc-100 hover:text-[#00FF66] border border-white/10 hover:border-[#00FF66]/40 font-bold py-3 px-6 rounded-lg text-xs uppercase tracking-wider transition-all duration-200"
                    >
                      Checkoff Complete
                    </button>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="relative p-8 border border-white/10 bg-zinc-950 rounded-xl shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 bg-zinc-800 text-zinc-300 text-[10px] uppercase font-bold px-4 py-1 tracking-widest">
                Dossier Offline
              </div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mt-2">
                <div className="space-y-2">
                  <p className="text-xs uppercase text-[#FF5C00] font-bold tracking-widest">
                    Telemetry Inactive // Guest Onboarding
                  </p>
                  <h4 className="text-xl font-bold uppercase text-zinc-100 tracking-tight">
                    Initialize Flight Credentials
                  </h4>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-xl font-sans">
                    Welcome, Guest Operator. To unlock non-linear flight paths, access dynamic compatibility critics, and track your operational readiness, you must establish your Pilot Dossier profile.
                  </p>
                </div>
                
                <div className="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0">
                  <Link
                    href="/academy/assessment"
                    className="block text-center bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white font-black py-3.5 px-8 rounded text-xs uppercase tracking-wider transition-colors duration-200 border-b-4 border-[#9E3900]"
                  >
                    Start Pilot Assessment
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Cloud Telemetry Integration Sync CTA for Guests */}
          {!session && dossier && (
            <div className="relative p-8 border border-[#00F2FF]/20 bg-zinc-950 rounded-xl shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#00F2FF] text-black text-[10px] uppercase font-bold px-4 py-1 tracking-widest">
                Cloud Backup Pending
              </div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mt-2">
                <div className="space-y-2">
                  <p className="text-xs uppercase text-[#00F2FF] font-bold tracking-widest">
                    CLOUD SYNC DISCONNECTED // OPERATING IN LOCAL STORAGE
                  </p>
                  <h4 className="text-xl font-bold uppercase text-zinc-100 tracking-tight">
                    Protect & Backup Flight Progress
                  </h4>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-xl font-sans">
                    Your flight dossier progress is currently saved in local browser cookie cache. Sign up or log in to sync all ratings to your cloud pilot account.
                  </p>
                </div>
                
                <div className="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0">
                  <Link
                    href="/auth/signin"
                    className="block text-center bg-[#00F2FF]/10 hover:bg-[#00F2FF]/20 text-[#00F2FF] border border-[#00F2FF]/30 font-black py-3.5 px-8 rounded text-xs uppercase tracking-wider transition-colors duration-200"
                  >
                    Sign In & Sync
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Matrix Phase List */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-white/10 pb-2 mt-4">
              <Flag className="w-5 h-5 text-[#00F2FF]" />
              <h3 className="text-lg font-bold uppercase text-zinc-100 tracking-widest">
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
                    <h4 className="text-xl font-black uppercase text-zinc-100 tracking-tight">{phase.name}</h4>
                  </div>

                  <div className="grid gap-6 pl-4 border-l border-[#00F2FF]/10">
                    {phase.modules
                      .filter((mod) => !mod.targetClass || !dossier || mod.targetClass === dossier.assignedClass)
                      .map((mod) => {
                        const isCompleted = qualifiedIds.includes(mod.id);
                        const isLocked = isPhaseLocked(i);
                        return (
                          <div
                            key={mod.id}
                            className={`p-8 border rounded-xl relative transition-all duration-300 ${
                              isCompleted
                                ? "bg-zinc-900 border-white/5 hover:border-white/10"
                                : isLocked
                                ? "bg-zinc-950 border-white/5 opacity-80"
                                : "bg-zinc-900 border-[#FF5C00]/30 hover:border-[#FF5C00]/60 shadow-[0_0_30px_rgba(255,92,0,0.05)]"
                            }`}
                          >

                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h5 className="text-lg font-black uppercase text-zinc-100 tracking-tight">
                                  {mod.name}
                                </h5>
                                <p className="text-[10px] uppercase text-zinc-400 font-mono mt-0.5 tracking-widest">
                                  MODULE ID: {mod.id}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap z-20">
                                {mod.targetClass && !dossier && (
                                  <span className="inline-flex items-center gap-1 text-[10px] uppercase text-[#FF5C00] bg-[#FF5C00]/10 px-2 py-1 rounded border border-[#FF5C00]/20 font-black">
                                    {mod.targetClass}
                                  </span>
                                )}
                                {isCompleted ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] uppercase text-[#00FF66] bg-[#00FF66]/10 px-2 py-1 rounded border border-[#00FF66]/20 font-black">
                                    <Award className="w-3.5 h-3.5" /> CLEARED
                                  </span>
                                ) : isLocked ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] uppercase text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-white/5 font-black">
                                    <Lock className="w-3.5 h-3.5" /> LOCKED
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] uppercase text-zinc-400 bg-zinc-800 px-2 py-1 rounded border border-white/10">
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
                                    <li key={j} className="flex items-start gap-2 text-xs text-zinc-400">
                                      <CheckSquare className="w-3.5 h-3.5 text-[#00F2FF] mt-0.5 flex-shrink-0" />
                                      {obj}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Clickable required study guides */}
                              {mod.requiredArticles.length > 0 && (
                                <div className="border-t border-white/5 pt-4 mt-4 space-y-2 z-20 relative">
                                  <p className="text-[10px] uppercase text-zinc-400 tracking-widest flex items-center gap-1">
                                    <BookOpen className="w-3 h-3 text-[#00F2FF]" /> Required Study Material:
                                  </p>
                                  <div className="flex flex-col gap-1.5 pl-4">
                                    {mod.requiredArticles.map((slug) => {
                                      const title = ARTICLE_TITLES[slug] || "Academy Guide Node";
                                      return (
                                        <Link
                                          key={slug}
                                          href={`/article/${slug}`}
                                          className="text-xs text-[#00F2FF] hover:underline flex items-center gap-1.5 group font-bold pointer-events-auto"
                                        >
                                          <span className="text-[#00F2FF]/50 group-hover:text-[#00F2FF]">📖</span>
                                          {title}
                                        </Link>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              <div className="border-t border-white/5 pt-4 flex flex-wrap justify-between items-center gap-4 z-20 relative">
                                <div className="text-[10px] uppercase text-zinc-400">
                                  GATE TYPE:{" "}
                                  <span className="text-[#FF5C00] font-black uppercase">
                                    {mod.qualificationGate.type}
                                  </span>
                                </div>
                                {mod.qualificationGate.checkpointName && (
                                  <div className="text-[10px] uppercase text-zinc-400">
                                    GOAL: <span className="text-zinc-100 font-mono">{mod.qualificationGate.checkpointName}</span>
                                  </div>
                                )}
                              </div>

                              {/* Self-Certification Verify Action Button */}
                              {!isCompleted && !isLocked && dossier && (
                                <div className="z-20 relative">
                                  <button
                                    onClick={() => {
                                      setVerifyingModule(mod);
                                      setCheckedObjectives({});
                                    }}
                                    className="mt-4 w-full bg-[#00FF66]/10 hover:bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/30 font-black py-2.5 px-4 rounded text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 pointer-events-auto"
                                  >
                                    <CheckSquare className="w-4 h-4" /> Certify Completion
                                  </button>
                                </div>
                              )}
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

      {/* Sortie Verification Checklist Modal */}
      {verifyingModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg border border-white/10 bg-zinc-950 rounded-xl shadow-2xl font-sans text-zinc-300 overflow-hidden">
            
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase text-[#FF5C00] font-black tracking-widest">Sortie Verification Protocol</span>
                <h3 className="text-xl font-black uppercase text-zinc-100 tracking-tight mt-1">
                  {verifyingModule.name}
                </h3>
              </div>
              <button
                onClick={() => setVerifyingModule(null)}
                className="text-zinc-500 hover:text-zinc-100 transition-colors text-lg"
              >
                ✕
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-6">
              <p className="text-xs text-zinc-400 uppercase tracking-wider leading-relaxed border-b border-white/5 pb-2">
                Operator: <span className="text-zinc-100 font-bold">{dossier?.callsign}</span> — Class: <span className="text-[#FF5C00] font-bold">{dossier?.assignedClass}</span>
              </p>
              
              <div className="space-y-4">
                <p className="text-xs uppercase text-[#00F2FF] font-black tracking-widest">
                  {"// Certify Target Objectives"}
                </p>
                
                <div className="space-y-3">
                  {verifyingModule.objectives.map((obj, index) => (
                    <label
                      key={index}
                      className="flex items-start gap-3 p-3 bg-zinc-900 border border-white/5 hover:border-[#00F2FF]/20 rounded-lg cursor-pointer transition-all duration-150 group"
                    >
                      <input
                        type="checkbox"
                        checked={!!checkedObjectives[index]}
                        onChange={(e) => {
                          setCheckedObjectives({
                            ...checkedObjectives,
                            [index]: e.target.checked,
                          });
                        }}
                        className="mt-0.5 w-4 h-4 rounded bg-zinc-800 border-white/10 text-[#00FF66] focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="text-xs text-zinc-400 group-hover:text-zinc-100 leading-relaxed">
                        {obj}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              <p className="text-[10px] text-yellow-500/80 leading-relaxed bg-yellow-500/5 p-3 border border-yellow-500/20 rounded-lg">
                ▲ ATTENTION: By deploying this qualification rating, you pledge that you have successfully completed the physical/simulated target objectives and are flight-ready for this rating phase.
              </p>
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-white/5 flex gap-4 justify-end bg-zinc-900/50">
              <button
                onClick={() => setVerifyingModule(null)}
                className="bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-400 hover:text-white font-bold py-2.5 px-5 rounded-lg text-xs uppercase tracking-wider transition-all duration-200"
              >
                Cancel
              </button>
              
              <button
                onClick={() => {
                  handleVerifyModule(verifyingModule.id);
                  setVerifyingModule(null);
                }}
                disabled={verifyingModule.objectives.some((_, index) => !checkedObjectives[index])}
                className="bg-[#00FF66] hover:bg-[#00FF66]/90 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:border-transparent text-black border-none font-bold py-2.5 px-6 rounded-lg text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5"
              >
                Deploy Qualification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cockpit Manual System Modal */}
      {isManualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-2xl border border-white/10 bg-zinc-950 rounded-xl shadow-2xl font-sans text-zinc-100 overflow-hidden">
            
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase text-[#00F2FF] font-bold tracking-widest">Ecosystem intelligence</span>
                <h3 className="text-xl font-bold uppercase tracking-tight mt-1">
                  System Manual // Matrix Schematic
                </h3>
              </div>
              <button
                onClick={() => setIsManualOpen(false)}
                className="text-zinc-500 hover:text-zinc-100 transition-colors text-lg"
              >
                ✕
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid gap-6">
                <div className="p-4 border border-white/5 bg-zinc-900 rounded-lg">
                  <h4 className="text-xs uppercase text-[#FF5C00] font-bold tracking-widest mb-2">
                    1. Initialize Dossier (SYS.INITIALIZE)
                  </h4>
                  <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                    Completing your scenario-based pilot assessment determines your flight class archetype and sets your default calibration variables.
                  </p>
                </div>
                
                <div className="p-4 border border-white/5 bg-zinc-900 rounded-lg">
                  <h4 className="text-xs uppercase text-[#00F2FF] font-bold tracking-widest mb-2">
                    2. Milestone Progression (SYS.FPM)
                  </h4>
                  <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                    Follow the locked branches. Unlocking active sorties requires you to read study modules, complete objective criteria, and digitally self-certify physical/simulated skill readiness.
                  </p>
                </div>
                
                <div className="p-4 border border-white/5 bg-zinc-900 rounded-lg">
                  <h4 className="text-xs uppercase text-[#00FF66] font-bold tracking-widest mb-2">
                    3. Cloud Sync Telemetry (SYS.CLOUD_SYNC)
                  </h4>
                  <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                    Your progression cache is stored safely in your browser cookies when operating as a guest. Authenticating your session automatically merges and uploads your milestones to your database profile.
                  </p>
                </div>
                
                <div className="p-4 border border-white/5 bg-zinc-900 rounded-lg">
                  <h4 className="text-xs uppercase text-yellow-500 font-bold tracking-widest mb-2">
                    4. Off-Grid Mode (SYS.OFFLINE_RECOVERY)
                  </h4>
                  <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                    When telemetry connections drop, you can certify modules offline. Ratings are saved in browser cache and deployed instantly when the link is recovered.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-white/5 flex justify-end bg-zinc-900/50">
              <button
                onClick={() => setIsManualOpen(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-white/10 font-bold py-2.5 px-6 rounded-lg text-xs uppercase tracking-wider transition-all duration-200"
              >
                [x] TERMINATE SIGNAL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
