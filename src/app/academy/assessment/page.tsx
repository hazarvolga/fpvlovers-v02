"use client";

/**
 * Route shell for the Pilot Archetype Assessment (PAA).
 * Responsible for presenting the introductory dossier assessment and saving the serialized
 * result state to the client dossier cookie.
 */

import React, { useState } from "react";
import { saveDossierToBrowser } from "@/lib/state/dossier-serializer";
import { PilotDossier, PilotClass } from "@/types/pilot-dossier";

export default function PilotAssessmentPage() {
  const [callsign, setCallsign] = useState("");
  const [selectedClass, setSelectedClass] = useState<PilotClass | "">("");

  const handleInitializeDossier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callsign || !selectedClass) return;

    // Build the default initial dossier state using frozen type contracts
    const initialDossier: PilotDossier = {
      callsign: callsign.trim().toUpperCase(),
      assignedClass: selectedClass as PilotClass,
      qualifications: {
        qualifiedModuleIds: ["intro-fpv"], // Pre-qualify initiation
        classRatings: ["Sub-250g Class Rating"],
        operationalReadinessLevel: "ORL-0"
      },
      activeBuild: null,
      calibrationProfile: {
        stickRates: "Defaults",
        rcLinkFrequencyHz: 250
      },
      lastSavedAt: new Date().toISOString()
    };

    saveDossierToBrowser(initialDossier);
    alert(`Dossier Initialized for Pilot ${initialDossier.callsign}! Redirecting to Roadmap...`);
    window.location.href = "/academy/roadmap";
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-32 text-[#f8fafc] font-mono">
      <div className="p-8 border border-[#00F2FF]/10 bg-[#050810]/80 rounded-lg shadow-[0_0_50px_rgba(0,242,255,0.05)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,242,255,0.03),transparent)] pointer-events-none" />
        
        <div className="mb-8 border-b border-[#00F2FF]/20 pb-4">
          <h1 className="text-3xl font-black uppercase tracking-widest text-white">
            Pilot <span className="text-[#00F2FF]">PAA Assessment</span>
          </h1>
          <p className="text-xs uppercase text-[#A0A0A0] mt-1 tracking-widest">
            {"// INITIALIZE FLIGHT DOSSIER PROTOCOL"}
          </p>
        </div>

        <form onSubmit={handleInitializeDossier} className="space-y-6">
          <div>
            <label className="block text-sm uppercase text-[#A0A0A0] mb-2 tracking-widest">
              Enter Callsign:
            </label>
            <input
              type="text"
              value={callsign}
              onChange={(e) => setCallsign(e.target.value)}
              placeholder="e.g. SKYWALKER"
              className="w-full bg-[#0A0D14] border border-[#00F2FF]/20 p-3 rounded text-white focus:outline-none focus:border-[#00F2FF] font-mono text-lg uppercase tracking-wider"
              maxLength={12}
              required
            />
          </div>

          <div>
            <label className="block text-sm uppercase text-[#A0A0A0] mb-2 tracking-widest">
              Select Flight Archetype:
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value as PilotClass)}
              className="w-full bg-[#0A0D14] border border-[#00F2FF]/20 p-3 rounded text-white focus:outline-none focus:border-[#00F2FF] font-mono text-base uppercase"
              required
            >
              <option value="">-- Choose Specialization --</option>
              <option value="Cinematic Operator">Cinematic Operator</option>
              <option value="Freestyle Tactician">Freestyle Tactician</option>
              <option value="Competitive Racer">Competitive Racer</option>
              <option value="Long Range Explorer">Long Range Explorer</option>
              <option value="System Builder / Engineer">System Builder / Engineer</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white font-black py-4 px-6 rounded uppercase tracking-wider transition-colors duration-200 border-b-4 border-[#9E3900]"
          >
            Deploy Dossier Credentials
          </button>
        </form>
      </div>
    </div>
  );
}
