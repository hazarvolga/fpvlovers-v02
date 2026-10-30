"use client";

/**
 * Mil-Spec Pilot Dossier Profile and Command Panel.
 * Visualizes active pilot qualifications, calibration curves, and Active Build DNA.
 * Implements local JSON File Import/Export operations.
 */

import React, { useEffect, useState } from "react";
import { CyberBreadcrumb } from "@/features/navigation/components/Breadcrumb";
import { AdStickySidebar } from "@/features/monetization/components/NativeAds";
import { loadDossierFromBrowser, saveDossierToBrowser } from "@/lib/state/dossier-serializer";
import { PilotDossier } from "@/types/pilot-dossier";
import { User, Award, Cpu, Shield, Download, Upload, Trash2, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function PilotDossierPage() {
  const [dossier, setDossier] = useState<PilotDossier | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Load dossier client-side from secure cookie
    const activeDossier = loadDossierFromBrowser();
    Promise.resolve().then(() => {
      setDossier(activeDossier);
    });
  }, []);

  const breadcrumbs = [
    { label: "Learn", href: "/academy" },
    { label: "Pilot Dossier", isCurrentPage: true }
  ];

  // Handler to export dossier as local JSON file
  const handleExportDossier = () => {
    if (!dossier) return;
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dossier, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `fpv_dossier_${dossier.callsign.toLowerCase()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error("Dossier export fault:", err);
    }
  };

  // Handler to import dossier from local JSON file
  const handleImportDossier = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(false);
    const fileReader = new FileReader();
    const targetFile = e.target.files?.[0];

    if (!targetFile) return;

    fileReader.onload = (event) => {
      try {
        const rawJson = event.target?.result as string;
        const parsedData = JSON.parse(rawJson) as PilotDossier;

        // Perform strict structural validation of the imported dossier schema
        if (
          typeof parsedData.callsign !== "string" ||
          typeof parsedData.assignedClass !== "string" ||
          !parsedData.qualifications ||
          !Array.isArray(parsedData.qualifications.qualifiedModuleIds)
        ) {
          setImportError("INVALID STRUCTURE: The imported file is missing required FPV Dossier fields.");
          return;
        }

        saveDossierToBrowser(parsedData);
        setDossier(parsedData);
        setImportSuccess(true);
        // Refresh page to sync dynamic headers
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (err) {
        setImportError("PARSING ERROR: The selected file is not a valid JSON dossier asset.");
      }
    };
    fileReader.readAsText(targetFile);
  };

  // Handler to decommission (clear) dossier state
  const handleDecommissionDossier = () => {
    if (confirm("WARNING: Are you sure you want to decommission this pilot dossier? All completed qualifications and custom rates will be deleted.")) {
      if (typeof document !== "undefined") {
        document.cookie = "fpv_dossier_v1=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict; Secure";
      }
      setDossier(null);
      window.location.href = "/academy/assessment";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 text-zinc-100 font-sans">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Header Panel */}
          <div className="relative p-8 md:p-12 border border-white/5 bg-zinc-950 rounded-xl shadow-2xl overflow-hidden">
            <User className="w-12 h-12 text-[#00F2FF] mb-6 opacity-80" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-100 mb-4">
              Pilot <span className="text-[#00F2FF]">Dossier</span>
            </h1>
            <p className="text-xs uppercase text-zinc-500 tracking-widest max-w-2xl leading-relaxed font-mono">
              {"// SECURE LOCAL FLIGHT IDENTITY CARD & MODULE LOGS"}
            </p>
          </div>

          {dossier ? (
            <>
              {/* Dossier Credentials Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Operator Card */}
                <div className="p-6 border border-white/5 bg-zinc-900/50 rounded-xl flex flex-col justify-between hover:bg-zinc-900 transition-colors">
                  <div>
                    <h3 className="text-xs uppercase text-[#00F2FF] font-bold border-b border-white/5 pb-2 mb-4 tracking-widest flex items-center gap-2">
                      <Award className="w-4 h-4" /> Flight Identity
                    </h3>
                    <p className="text-sm uppercase text-zinc-500 font-mono">OPERATOR TAG:</p>
                    <p className="text-2xl font-bold text-zinc-100 tracking-wider mb-3 font-mono">
                      {dossier.callsign}
                    </p>
                    
                    <p className="text-sm uppercase text-zinc-500 font-mono">CORE CLASS:</p>
                    <p className="text-lg font-bold text-[#FF5C00] tracking-wide mb-3 font-sans">
                      {dossier.assignedClass}
                    </p>
                    
                    <p className="text-sm uppercase text-zinc-500 font-mono">READINESS CLASS:</p>
                    <p className="text-lg font-bold text-[#00FF66] tracking-wider font-sans">
                      {dossier.qualifications.operationalReadinessLevel}
                    </p>
                  </div>
                  
                  <div className="border-t border-white/5 pt-4 mt-6">
                    <p className="text-[10px] text-zinc-500 uppercase font-mono">
                      Last Synchronized: {new Date(dossier.lastSavedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Calibration & Rates */}
                <div className="p-6 border border-white/5 bg-zinc-900/50 rounded-xl hover:bg-zinc-900 transition-colors">
                  <h3 className="text-xs uppercase text-[#00F2FF] font-bold border-b border-white/5 pb-2 mb-4 tracking-widest flex items-center gap-2">
                    <Cpu className="w-4 h-4" /> Calibration profile
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs uppercase text-zinc-500 font-mono">STICK SENSITIVITY RATES:</p>
                      <p className="text-sm text-zinc-100 font-bold uppercase mt-1 font-sans">
                        {dossier.calibrationProfile.stickRates}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-zinc-500 font-mono">TRANSMITTER LQ LINK SPEED:</p>
                      <p className="text-sm text-zinc-100 font-bold uppercase mt-1 font-sans">
                        {dossier.calibrationProfile.rcLinkFrequencyHz}Hz Packet Rate
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-zinc-500 font-mono">QUALIFIED ENDORSEMENTS:</p>
                      <ul className="mt-1 space-y-1">
                        {dossier.qualifications.classRatings.map((rating, k) => (
                          <li key={k} className="text-xs text-[#00FF66] font-bold uppercase font-sans">
                            ✓ {rating}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Build DNA Module */}
              <div className="p-6 border border-white/5 bg-zinc-900/50 rounded-xl hover:bg-zinc-900 transition-colors">
                <h3 className="text-xs uppercase text-[#00F2FF] font-bold border-b border-white/5 pb-2 mb-4 tracking-widest flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Active Build DNA
                </h3>
                {dossier.activeBuild ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-zinc-500 uppercase block">DRONE CLASS:</span>
                      <span className="text-zinc-100 font-bold uppercase">{dossier.activeBuild.droneClass}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase block">DRY WEIGHT:</span>
                      <span className="text-[#00FF66] font-bold">{dossier.activeBuild.dryWeightGrams}g</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase block">ESC RATINGS:</span>
                      <span className="text-zinc-100 font-bold">{dossier.activeBuild.electronics.escCurrentLimit}A</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase block">VISION SYST:</span>
                      <span className="text-[#FF5C00] font-bold uppercase">{dossier.activeBuild.vision.ecosystem}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-zinc-500 uppercase bg-zinc-950 border border-white/5 rounded-lg font-mono">
                    NO PHYSICAL BUILD REGISTERED TO THIS DOSSIER. VISIT THE{" "}
                    <a href="/archive" className="text-[#00F2FF] font-bold underline">
                      DRONE ARCHIVE
                    </a>{" "}
                    TO INITIALIZE A BLUEPRINT.
                  </div>
                )}
              </div>

              {/* File operations command panel */}
              <div className="p-6 border border-white/5 bg-zinc-950 rounded-xl space-y-6">
                <h3 className="text-xs uppercase text-zinc-500 font-bold border-b border-white/5 pb-2 tracking-widest font-mono">
                  Dossier Operations Panel
                </h3>

                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleExportDossier}
                    className="flex items-center justify-center gap-2 bg-[#00F2FF]/10 hover:bg-[#00F2FF]/20 text-[#00F2FF] border border-[#00F2FF]/20 hover:border-[#00F2FF]/40 font-bold py-3 px-6 rounded-lg text-xs uppercase tracking-wider transition-all duration-200"
                  >
                    <Download className="w-4 h-4" /> Export Credentials (JSON)
                  </button>

                  <button
                    onClick={handleDecommissionDossier}
                    className="flex items-center justify-center gap-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 hover:border-red-500/50 font-bold py-3 px-6 rounded-lg text-xs uppercase tracking-wider transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" /> Decommission Dossier
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Locked profile placeholder when cookie is missing */
            <div className="p-8 md:p-12 border border-red-950/20 bg-zinc-950 rounded-xl text-center shadow-2xl">
              <ShieldAlert className="w-16 h-16 text-[#FF5C00] mx-auto mb-6 animate-pulse" />
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-100 mb-2">
                Dossier Locked / Offline
              </h3>
              <p className="text-xs text-zinc-500 uppercase mb-8 font-mono">
                NO ACTIVE OPERATOR CREDENTIALS DETECTED.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
                <a
                  href="/academy/assessment"
                  className="bg-[#00F2FF]/10 hover:bg-[#00F2FF]/20 text-[#00F2FF] border border-[#00F2FF]/30 font-bold py-3.5 px-6 rounded-lg text-xs uppercase tracking-wider transition-all duration-200 inline-flex justify-center items-center"
                >
                  Start Archetype Quiz
                </a>
                
                <label className="bg-zinc-800 hover:bg-zinc-700 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-zinc-100 font-bold py-3.5 px-6 rounded-lg text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" /> Import Dossier JSON
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportDossier}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Import Status Alerts */}
          {importError && (
            <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-400 rounded text-xs leading-relaxed uppercase flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>{importError}</div>
            </div>
          )}

          {importSuccess && (
            <div className="p-4 bg-[#00FF66]/10 border border-[#00FF66]/20 text-[#00FF66] rounded text-xs leading-relaxed uppercase flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#00FF66] flex-shrink-0" />
              <div>DOSSIER IMPORT PROTOCOL INITIALIZED SUCCESSFULLY. SYNCHRONIZING SECURE COOKIES...</div>
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
