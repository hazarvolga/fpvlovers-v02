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
    { label: "Pilot Academy", href: "/academy" },
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 text-[#f8fafc] font-mono">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Header Panel */}
          <div className="relative p-8 hex-panel glass-panel overflow-hidden border-[#00F2FF]/20 shadow-[inset_0_0_80px_rgba(0,F2,FF,0.05)] bg-[#050810]/70 rounded-lg">
            <div className="absolute inset-0 carbon-grid opacity-20 pointer-events-none" />
            <User className="w-12 h-12 text-[#00F2FF] mb-6 opacity-80" />
            <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter mb-4">
              Pilot <span className="text-[#00F2FF]">Dossier</span>
            </h1>
            <p className="text-xs uppercase text-[#A0A0A0] tracking-widest max-w-2xl leading-relaxed">
              {"// SECURE LOCAL FLIGHT IDENTITY CARD & MODULE LOGS"}
            </p>
          </div>

          {dossier ? (
            <>
              {/* Dossier Credentials Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Operator Card */}
                <div className="p-6 border border-[#00F2FF]/10 bg-[#050810]/80 rounded-lg flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs uppercase text-[#00F2FF] font-black border-b border-[#00F2FF]/10 pb-2 mb-4 tracking-widest flex items-center gap-2">
                      <Award className="w-4 h-4" /> Flight Identity
                    </h3>
                    <p className="text-sm uppercase text-[#A0A0A0]">OPERATOR TAG:</p>
                    <p className="text-2xl font-black text-white tracking-wider mb-3">
                      {dossier.callsign}
                    </p>
                    
                    <p className="text-sm uppercase text-[#A0A0A0]">CORE CLASS:</p>
                    <p className="text-lg font-black text-[#FF5C00] uppercase tracking-wide mb-3">
                      {dossier.assignedClass}
                    </p>
                    
                    <p className="text-sm uppercase text-[#A0A0A0]">READINESS CLASS:</p>
                    <p className="text-lg font-black text-[#00FF66] uppercase tracking-wider">
                      {dossier.qualifications.operationalReadinessLevel}
                    </p>
                  </div>
                  
                  <div className="border-t border-[#1A1A1A] pt-4 mt-6">
                    <p className="text-[10px] text-[#A0A0A0] uppercase">
                      Last Synchronized: {new Date(dossier.lastSavedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Calibration & Rates */}
                <div className="p-6 border border-[#00F2FF]/10 bg-[#050810]/80 rounded-lg">
                  <h3 className="text-xs uppercase text-[#00F2FF] font-black border-b border-[#00F2FF]/10 pb-2 mb-4 tracking-widest flex items-center gap-2">
                    <Cpu className="w-4 h-4" /> Calibration profile
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs uppercase text-[#A0A0A0]">STICK SENSITIVITY RATES:</p>
                      <p className="text-sm text-white font-black uppercase mt-1">
                        {dossier.calibrationProfile.stickRates}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-[#A0A0A0]">TRANSMITTER LQ LINK SPEED:</p>
                      <p className="text-sm text-white font-black uppercase mt-1">
                        {dossier.calibrationProfile.rcLinkFrequencyHz}Hz Packet Rate
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-[#A0A0A0]">QUALIFIED ENDORSEMENTS:</p>
                      <ul className="mt-1 space-y-1">
                        {dossier.qualifications.classRatings.map((rating, k) => (
                          <li key={k} className="text-xs text-[#00FF66] font-black uppercase">
                            ✓ {rating}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Build DNA Module */}
              <div className="p-6 border border-[#00F2FF]/10 bg-[#050810]/50 rounded-lg">
                <h3 className="text-xs uppercase text-[#00F2FF] font-black border-b border-[#00F2FF]/10 pb-2 mb-4 tracking-widest flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Active Build DNA
                </h3>
                {dossier.activeBuild ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-[#A0A0A0] uppercase block">DRONE CLASS:</span>
                      <span className="text-white font-black uppercase">{dossier.activeBuild.droneClass}</span>
                    </div>
                    <div>
                      <span className="text-[#A0A0A0] uppercase block">DRY WEIGHT:</span>
                      <span className="text-[#00FF66] font-black">{dossier.activeBuild.dryWeightGrams}g</span>
                    </div>
                    <div>
                      <span className="text-[#A0A0A0] uppercase block">ESC RATINGS:</span>
                      <span className="text-white font-black">{dossier.activeBuild.electronics.escCurrentLimit}A</span>
                    </div>
                    <div>
                      <span className="text-[#A0A0A0] uppercase block">VISION SYST:</span>
                      <span className="text-[#FF5C00] font-black uppercase">{dossier.activeBuild.vision.ecosystem}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-[#A0A0A0] uppercase bg-black/40 border border-[#1A1A1A] rounded">
                    NO PHYSICAL BUILD REGISTERED TO THIS DOSSIER. VISIT THE{" "}
                    <a href="/archive" className="text-[#00F2FF] font-black underline">
                      DRONE ARCHIVE
                    </a>{" "}
                    TO INITIALIZE A BLUEPRINT.
                  </div>
                )}
              </div>

              {/* File operations command panel */}
              <div className="p-6 border border-[#1A1A1A] bg-[#050810]/80 rounded-lg space-y-6">
                <h3 className="text-xs uppercase text-[#A0A0A0] font-black border-b border-[#1A1A1A] pb-2 tracking-widest">
                  Dossier Operations Panel
                </h3>

                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleExportDossier}
                    className="flex items-center gap-2 bg-[#00F2FF]/10 hover:bg-[#00F2FF]/20 text-[#00F2FF] border border-[#00F2FF]/20 hover:border-[#00F2FF] font-black py-3 px-6 rounded text-xs uppercase tracking-wider transition-all duration-200"
                  >
                    <Download className="w-4 h-4" /> Export Credentials (JSON)
                  </button>

                  <button
                    onClick={handleDecommissionDossier}
                    className="flex items-center gap-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 hover:border-red-500/50 font-black py-3 px-6 rounded text-xs uppercase tracking-wider transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" /> Decommission Dossier
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Locked profile placeholder when cookie is missing */
            <div className="p-8 border border-red-950/20 bg-[#050810]/80 rounded-lg text-center">
              <ShieldAlert className="w-16 h-16 text-[#FF5C00] mx-auto mb-6 animate-pulse" />
              <h3 className="text-xl font-black uppercase text-white tracking-widest mb-2">
                Dossier Locked / Offline
              </h3>
              <p className="text-xs text-[#A0A0A0] uppercase mb-8">
                NO ACTIVE OPERATOR CREDENTIALS DETECTED.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
                <a
                  href="/academy/assessment"
                  className="bg-[#00F2FF]/10 hover:bg-[#00F2FF]/20 text-[#00F2FF] border border-[#00F2FF]/30 font-black py-3.5 px-6 rounded text-xs uppercase tracking-wider transition-all duration-200"
                >
                  Start Archetype Quiz
                </a>
                
                <label className="bg-black/50 hover:bg-black border border-[#333333] hover:border-[#00F2FF] text-[#A0A0A0] hover:text-white font-black py-3.5 px-6 rounded text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-2">
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
