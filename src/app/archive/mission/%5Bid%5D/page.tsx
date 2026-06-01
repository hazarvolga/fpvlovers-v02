"use client";

/**
 * Dynamic Route Page for Mission Profiles.
 * Displays target intent envelopes, legal thresholds, required skills,
 * and matches them directly to verified reference Build blueprints.
 */

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CyberBreadcrumb } from "@/features/navigation/components/Breadcrumb";
import { AdStickySidebar } from "@/features/monetization/components/NativeAds";
import { MissionProfile } from "@/types/mission-profile";
import { Compass, ShieldAlert, CheckCircle2, ChevronRight, Wind, ShieldCheck, Gauge, Eye } from "lucide-react";

interface ReferenceMission {
  id: string;
  name: string;
  desc: string;
  assignedRequiredClass: string;
  specs: MissionProfile;
  compatibleBuildIds: {
    name: string;
    id: string;
  }[];
  checklist: string[];
}

const STATIC_REFERENCE_MISSIONS: Record<string, ReferenceMission> = {
  "alpine-surfing": {
    id: "alpine-surfing",
    name: "High-Altitude Alpine Surfing",
    desc: "Long range cruising and surfing alpine peaks. Demands high-penetration transmitter protocols, automated recovery GPS buffers, and specialized thermal battery calculations.",
    assignedRequiredClass: "Long Range Explorer",
    specs: {
      id: "alpine-surfing",
      name: "High-Altitude Alpine Surfing",
      description: "Alpine exploration flight profile.",
      assignedRequiredClass: "Long Range Explorer",
      envelope: {
        maxWindSpeedKph: 45,
        targetFlightDurationSeconds: 600,
        maxOperatingRangeMeters: 5000,
        allowableWeightClass: "OpenClass",
        minimumBecRatingAmps: 2.0
      },
      requiredHardwareKeywords: ["GPS", "ELRS_915M", "6S", "7 Inch"],
      requiredSkillModules: ["gps-rescue", "understanding-rpm-filtering"]
    },
    compatibleBuildIds: [
      { name: "Chimera7 Explorer reference build", id: "longrange-7" }
    ],
    checklist: [
      "Sat-lock verification: Minimum 8 satellites locked before arming validation.",
      "LQ Alarm threshold check: Configure low link alarms to trigger at 80% LQ.",
      "GPS Rescue return angle limit: Adjust Betaflight return pitch angles to 25 degrees."
    ]
  },
  "urban-freestyle": {
    id: "urban-freestyle",
    name: "Urban Proximity Freestyle",
    desc: "Acrobatic close-quarters operations surrounding concrete and steel structures. Demands high arm rigidity, robust motors, and aggressive dynamic vibration filtering.",
    assignedRequiredClass: "Freestyle Tactician",
    specs: {
      id: "urban-freestyle",
      name: "Urban Proximity Freestyle",
      description: "Urban freestyle trick flight profile.",
      assignedRequiredClass: "Freestyle Tactician",
      envelope: {
        maxWindSpeedKph: 30,
        targetFlightDurationSeconds: 240,
        maxOperatingRangeMeters: 500,
        allowableWeightClass: "OpenClass",
        minimumBecRatingAmps: 1.5
      },
      requiredHardwareKeywords: ["5 Inch", "6S", "ELRS_2.4G", "Rigid Frame"],
      requiredSkillModules: ["pid-tuning-basics", "simulator-muscle-memory"]
    },
    compatibleBuildIds: [
      { name: "Nazgul Evoque F5D reference build", id: "freestyle-5" }
    ],
    checklist: [
      "Frame rigidity check: Audit arm bolt torque parameters before high-G sorties.",
      "Betaflight filter optimization: Ensure dual dynamic notch filters are active.",
      "Capacitor inspection: Confirm low-ESR capacitor is securely soldered to ESC pads."
    ]
  }
};

export default function MissionDetailsPage() {
  const params = useParams();
  const missionId = params.id as string;
  const [mission, setMission] = useState<ReferenceMission | null>(null);

  useEffect(() => {
    if (missionId && STATIC_REFERENCE_MISSIONS[missionId]) {
      Promise.resolve().then(() => {
        setMission(STATIC_REFERENCE_MISSIONS[missionId]);
      });
    }
  }, [missionId]);

  if (!mission) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-32 text-center text-[#f8fafc] font-mono">
        <h2 className="text-2xl font-black uppercase text-[#FF5C00] mb-4">Mission Node Offline</h2>
        <p className="text-xs text-[#A0A0A0]">THE REQUESTED MISSION PROFILE IS DEPRECATED OR DOES NOT EXIST.</p>
        <a href="/archive" className="mt-8 inline-block text-[#00F2FF] underline text-xs">Back to Archive catalog</a>
      </div>
    );
  }

  const breadcrumbs = [
    { label: "Drone Archive", href: "/archive" },
    { label: mission.name, isCurrentPage: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 text-[#f8fafc] font-mono">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Mission Intent */}
          <div className="relative p-8 hex-panel glass-panel overflow-hidden border-[#FF5C00]/20 shadow-[inset_0_0_80px_rgba(255,92,0,0.03)] bg-[#050810]/70 rounded-lg">
            <div className="absolute inset-0 carbon-grid opacity-20 pointer-events-none" />
            <Compass className="w-12 h-12 text-[#FF5C00] mb-6 opacity-80" />
            <span className="text-[10px] text-[#FF5C00] font-black uppercase tracking-widest block mb-1">
              MISSION TARGET PROFILE
            </span>
            <h1 className="text-3xl md:text-4xl font-black uppercase text-white tracking-tighter mb-4 animate-pulse">
              {mission.name}
            </h1>
            <p className="text-xs uppercase text-[#A0A0A0] tracking-widest leading-relaxed max-w-xl">
              {mission.desc}
            </p>
          </div>

          {/* Operational Envelope */}
          <div className="space-y-4">
            <h3 className="text-lg font-black uppercase text-[#f8fafc] border-b border-[#333333] pb-2 tracking-widest flex items-center gap-2">
              <Gauge className="w-5 h-5 text-[#FF5C00]" /> Operational Envelope Dials
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-[#0A0D14]/80 border border-[#1A1A1A] p-4 rounded">
                <Wind className="w-5 h-5 text-[#00F2FF] mx-auto mb-2" />
                <span className="text-[10px] text-[#A0A0A0] uppercase block">MAX WIND LOAD:</span>
                <span className="text-sm text-white font-black">{mission.specs.envelope.maxWindSpeedKph} KPH</span>
              </div>
              <div className="bg-[#0A0D14]/80 border border-[#1A1A1A] p-4 rounded">
                <span className="text-[10px] text-[#A0A0A0] uppercase block mb-3 mt-1">FLIGHT TIME Target:</span>
                <span className="text-sm text-[#00FF66] font-black">{mission.specs.envelope.targetFlightDurationSeconds}s</span>
              </div>
              <div className="bg-[#0A0D14]/80 border border-[#1A1A1A] p-4 rounded">
                <span className="text-[10px] text-[#A0A0A0] uppercase block mb-3 mt-1">MAX RANGE LIMIT:</span>
                <span className="text-sm text-white font-black">{mission.specs.envelope.maxOperatingRangeMeters}m</span>
              </div>
              <div className="bg-[#0A0D14]/80 border border-[#1A1A1A] p-4 rounded">
                <span className="text-[10px] text-[#A0A0A0] uppercase block mb-3 mt-1">WEIGHT LIMIT:</span>
                <span className="text-sm text-[#FF5C00] font-black uppercase">{mission.specs.envelope.allowableWeightClass}</span>
              </div>
            </div>
          </div>

          {/* Compatible Blueprints Loop */}
          <div className="space-y-4">
            <h3 className="text-lg font-black uppercase text-[#f8fafc] border-b border-[#333333] pb-2 tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#00FF66]" /> Mapped compatible designs
            </h3>

            <div className="grid gap-4">
              {mission.compatibleBuildIds.map((b) => (
                <div
                  key={b.id}
                  className="p-6 border border-[#00FF66]/20 bg-[#00FF66]/5 rounded-lg flex flex-wrap justify-between items-center gap-4"
                >
                  <div>
                    <span className="text-[10px] uppercase text-[#00FF66] font-black tracking-widest block mb-1">
                      RECOMMENDED HARDWARE SPEC
                    </span>
                    <h4 className="text-lg font-black uppercase text-white tracking-tight">
                      {b.name}
                    </h4>
                  </div>
                  <a
                    href={`/archive/build/${b.id}`}
                    className="inline-flex items-center gap-2 bg-[#00FF66] hover:bg-[#00FF66]/80 text-black font-black py-3 px-6 rounded text-xs uppercase tracking-wider transition-colors duration-200 border-b-2 border-[#00A341]"
                  >
                    <Eye className="w-4 h-4" /> Load build blueprint <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Preflight Briefing Checklist */}
          <div className="p-6 border border-[#1A1A1A] bg-[#050810]/80 rounded-lg">
            <h3 className="text-xs uppercase text-[#A0A0A0] font-black border-b border-[#1A1A1A] pb-2 mb-4 tracking-widest flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#FF5C00]" /> Pre-Flight Operational Briefing
            </h3>

            <ul className="space-y-3">
              {mission.checklist.map((item, idx) => (
                <li key={idx} className="text-xs text-[#A0A0A0] leading-relaxed flex items-start gap-3">
                  <span className="text-[#FF5C00] font-black flex-shrink-0 mt-0.5">[0{idx + 1}]</span>
                  {item}
                </li>
              ))}
            </ul>
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
