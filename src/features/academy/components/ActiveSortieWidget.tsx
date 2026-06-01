"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, X } from "lucide-react";
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

export function ActiveSortieWidget({ slug }: { slug: string }) {
  const [dossier, setDossier] = useState<PilotDossier | null>(null);
  const [activeModuleName, setActiveModuleName] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Load dossier client-side from secure cookie
    const activeDossier = loadDossierFromBrowser();
    if (!activeDossier) return;

    Promise.resolve().then(() => {
      setDossier(activeDossier);
    });

    const qualifiedIds = activeDossier.qualifications.qualifiedModuleIds || [];
    const phasesData = localRoadmap.phases as PhaseNode[];

    // Find the first uncompleted module that matches the pilot's assigned class
    let activeModule: ModuleGate | null = null;
    for (const phase of phasesData) {
      for (const mod of phase.modules) {
        if (mod.targetClass && mod.targetClass !== activeDossier.assignedClass) continue;
        
        const isCompleted = qualifiedIds.includes(mod.id);
        if (!isCompleted) {
          activeModule = mod;
          break;
        }
      }
      if (activeModule) break;
    }

    // Check if the current article's slug matches one of the required articles of the active module
    if (activeModule && activeModule.requiredArticles.includes(slug)) {
      const targetName = activeModule.name;
      Promise.resolve().then(() => {
        setActiveModuleName(targetName);
      });
    }
  }, [slug]);

  if (!dossier || !activeModuleName || !isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-[280px] sm:max-w-xs border border-[#FF5C00]/30 bg-[#050810]/95 backdrop-blur shadow-[0_0_30px_rgba(255,92,0,0.15)] rounded-lg p-5 font-mono text-[#f8fafc] overflow-hidden hex-panel animate-fadeIn">
      <div className="absolute inset-0 carbon-grid opacity-10 pointer-events-none" />
      
      {/* Top Banner */}
      <div className="flex justify-between items-center border-b border-[#FF5C00]/20 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF5C00] animate-pulse" />
          <span className="text-[10px] uppercase text-[#FF5C00] font-black tracking-widest">Active Sortie Study</span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-[#A0A0A0] hover:text-white transition-colors"
          title="Dismiss Widget"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="space-y-3">
        <div className="flex gap-2 items-start text-xs text-[#A0A0A0] leading-relaxed">
          <BookOpen className="w-4 h-4 text-[#00F2FF] mt-0.5 flex-shrink-0" />
          <p>
            You are reviewing a required study guide for your active flight target:
          </p>
        </div>
        <p className="text-sm font-black uppercase text-white tracking-tight pl-6 leading-snug">
          {activeModuleName}
        </p>
      </div>

      {/* Action CTA */}
      <div className="mt-4 pt-3 border-t border-[#1A1A1A] flex justify-end">
        <Link
          href="/academy/roadmap"
          className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-[#00F2FF] hover:text-white transition-colors tracking-widest"
        >
          Return to Matrix →
        </Link>
      </div>
    </div>
  );
}
