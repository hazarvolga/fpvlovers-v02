"use client";

/**
 * Dynamic Route Page for Build DNA Blueprints.
 * Displays structural blueprints, physical parts card scorecard,
 * qualifying PQP article anchors, and triggers Pilot Dossier deployment.
 */

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CyberBreadcrumb } from "@/features/navigation/components/Breadcrumb";
import { AdStickySidebar } from "@/features/monetization/components/NativeAds";
import { loadDossierFromBrowser, saveDossierToBrowser } from "@/lib/state/dossier-serializer";
import { BuildDNA } from "@/types/build-dna";
import { Cpu, Award, HardDrive, ShieldCheck, ExternalLink, Play, CheckCircle2 } from "lucide-react";

interface ReferenceBuild {
  id: string;
  name: string;
  droneClass: string;
  desc: string;
  dryWeight: number;
  specs: BuildDNA;
  partsList: {
    category: string;
    brand: string;
    model: string;
    affiliateUrl: string;
  }[];
  qualifyingArticles: {
    title: string;
    slug: string;
    moduleName: string;
  }[];
}

const STATIC_REFERENCE_BUILDS: Record<string, ReferenceBuild> = {
  "freestyle-5": {
    id: "freestyle-5",
    name: "Nazgul Evoque F5D reference build",
    droneClass: "Freestyle Tactician",
    desc: "The standard 5-inch deadcat reference blueprint. Optimized for extreme acrobatics, arm rigidity, and carrying a heavy high-definition visual payload.",
    dryWeight: 395,
    specs: {
      id: "freestyle-5",
      droneClass: "Freestyle Tactician",
      frame: { style: "Deadcat", sizeInches: 5, weightGrams: 140 },
      propulsion: { motorStatorSize: "2207", motorKv: 1750, propellerDetails: "Nazgul 5140 Tri-Blade", propellerWeightGrams: 4.2, motorWeightGrams: 31.6 },
      electronics: { fcProcessor: "F405", gyroModel: "ICM42688P", escCurrentLimit: 50, receiverProtocol: "ELRS_2.4G" },
      vision: { ecosystem: "DJI", vtxPowerMw: 1000, cameraWeightGrams: 8.3, vtxWeightGrams: 28.1 },
      power: { targetBatteryCells: "6S", customBecWeightGrams: 0, hasCapacitorAttached: true },
      addedComponents: [],
      dryWeightGrams: 395
    },
    partsList: [
      { category: "Frame", brand: "iFlight", model: "Evoque F5D Carbon Frame", affiliateUrl: "https://shop.iflight-rc.com/nazgul-evoque-f5-deadcat-frame-kit" },
      { category: "Motors", brand: "iFlight", model: "XING2 2207 1750KV", affiliateUrl: "https://shop.iflight-rc.com/xing2-2207-brushless-motor-pro1598" },
      { category: "ESC & FC", brand: "SpeedyBee", model: "F405 V4 50A Stack", affiliateUrl: "https://www.speedybee.com/speedybee-f405-v4-stack" },
      { category: "Vision System", brand: "DJI", model: "O3 Air Unit Digital VTX", affiliateUrl: "https://betafpv.com/collections/dji-air-unit" },
      { category: "Receiver", brand: "Happymodel", model: "EP1 ELRS Nano RX", affiliateUrl: "https://www.happymodel.cn" }
    ],
    qualifyingArticles: [
      { title: "Betaflight PID Basics for Beginners", slug: "betaflight-pid-basics-for-beginners", moduleName: "FPM Module 6.1: PID Tuning Basics" },
      { title: "How to Choose Your First FPV Radio", slug: "how-to-choose-your-first-fpv-radio", moduleName: "FPM Module 2.1: Radio Selection" }
    ]
  },
  "longrange-7": {
    id: "longrange-7",
    name: "Chimera7 Explorer reference build",
    droneClass: "Long Range Explorer",
    desc: "A high-efficiency 7-inch exploration deadcat layout designed to tackle mountain surfing signals, cold battery chemistry drag, and GPS rescue safety rules.",
    dryWeight: 620,
    specs: {
      id: "longrange-7",
      droneClass: "Long Range Explorer",
      frame: { style: "Deadcat", sizeInches: 7, weightGrams: 230 },
      propulsion: { motorStatorSize: "2806.5", motorKv: 1300, propellerDetails: "Gemfan 7040 Tri-Blade", propellerWeightGrams: 7.9, motorWeightGrams: 49.5 },
      electronics: { fcProcessor: "F722", gyroModel: "ICM42688P", escCurrentLimit: 55, receiverProtocol: "ELRS_915M" },
      vision: { ecosystem: "DJI", vtxPowerMw: 1000, cameraWeightGrams: 8.3, vtxWeightGrams: 28.1 },
      power: { targetBatteryCells: "6S", customBecWeightGrams: 2.5, hasCapacitorAttached: true },
      addedComponents: [],
      dryWeightGrams: 620
    },
    partsList: [
      { category: "Frame", brand: "iFlight", model: "Chimera7 Pro Carbon Frame", affiliateUrl: "https://shop.iflight-rc.com" },
      { category: "Motors", brand: "BrotherHobby", model: "Avenger 2806.5 1300KV", affiliateUrl: "https://shop.iflight-rc.com" },
      { category: "ESC & FC", brand: "Diatone", model: "Mamba F722 55A Stack", affiliateUrl: "https://www.speedybee.com" },
      { category: "Vision System", brand: "DJI", model: "O3 Air Unit Digital VTX", affiliateUrl: "https://betafpv.com/collections/dji-air-unit" },
      { category: "GPS Module", brand: "Flywoo", model: "Goku GM10 Nano GPS", affiliateUrl: "https://chinahobbyline.com" }
    ],
    qualifyingArticles: [
      { title: "GPS Rescue Setup in Betaflight", slug: "gps-rescue-mode-setup-in-betaflight-never-lose-a-drone-to-a-failsafe", moduleName: "FPM Module 7.2: GPS Rescue Setup" },
      { title: "ExpressLRS Binding & Flashing Guide", slug: "expresslrs-binding-and-flashing-guide-step-by-step-for-edgetx-betaflight", moduleName: "FPM Module 2.1: Radio Selection" }
    ]
  }
};

export default function BuildDetailsPage() {
  const params = useParams();
  const buildId = params.id as string;
  const [build, setBuild] = useState<ReferenceBuild | null>(null);
  const [dossierDeployed, setDossierDeployed] = useState(false);

  useEffect(() => {
    if (buildId && STATIC_REFERENCE_BUILDS[buildId]) {
      Promise.resolve().then(() => {
        setBuild(STATIC_REFERENCE_BUILDS[buildId]);
      });
    }
  }, [buildId]);

  const handleDeployToDossier = () => {
    if (!build) return;
    const activeDossier = loadDossierFromBrowser();
    
    if (!activeDossier) {
      alert("DOSSIER RECORD LOCK: Please complete the Pilot Archetype Assessment first to initialize credentials!");
      window.location.href = "/academy/assessment";
      return;
    }

    // Deploy this Build DNA directly to their active pilot dossier blueprint
    const updatedDossier = {
      ...activeDossier,
      activeBuild: build.specs,
      lastSavedAt: new Date().toISOString()
    };

    saveDossierToBrowser(updatedDossier);
    setDossierDeployed(true);
    setTimeout(() => {
      window.location.href = "/academy/dossier";
    }, 1500);
  };

  if (!build) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-32 text-center text-[#f8fafc] font-mono">
        <h2 className="text-2xl font-black uppercase text-[#FF5C00] mb-4">Blueprint Offline</h2>
        <p className="text-xs text-[#A0A0A0]">THE REQUESTED BUILD REFERENCE blueprint DOES NOT EXIST OR IS DEPRECATED.</p>
        <a href="/archive" className="mt-8 inline-block text-[#00F2FF] underline text-xs">Back to Archive catalog</a>
      </div>
    );
  }

  const breadcrumbs = [
    { label: "Drone Archive", href: "/archive" },
    { label: build.name, isCurrentPage: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 text-[#f8fafc] font-mono">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Blueprint Title */}
          <div className="relative p-8 hex-panel glass-panel overflow-hidden border-[#FF5C00]/20 shadow-[inset_0_0_80px_rgba(255,92,0,0.03)] bg-[#050810]/70 rounded-lg">
            <div className="absolute inset-0 carbon-grid opacity-20 pointer-events-none" />
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <Cpu className="w-12 h-12 text-[#FF5C00] mb-6 opacity-80" />
                <h1 className="text-3xl md:text-4xl font-black uppercase text-white tracking-tighter mb-2">
                  {build.name}
                </h1>
                <p className="text-xs uppercase text-[#A0A0A0] tracking-widest leading-relaxed max-w-xl">
                  {build.desc}
                </p>
              </div>
              <button
                id={`btn-archive-build-deploy-${build.id}`}
                onClick={handleDeployToDossier}
                className="bg-[#FF5C00] hover:bg-[#FF5C00]/95 text-white font-black py-3 px-6 rounded text-xs uppercase tracking-wider transition-all duration-200 border-b-2 border-[#9E3900] flex items-center gap-2"
              >
                <Play className="w-4 h-4" /> Deploy to active Dossier
              </button>
            </div>
          </div>

          {dossierDeployed && (
            <div className="p-4 bg-[#00FF66]/10 border border-[#00FF66]/20 text-[#00FF66] rounded text-xs leading-relaxed uppercase flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#00FF66] flex-shrink-0" />
              <div>BUILD DNA LOADED TO OPERATOR Blue-print. REDIRECTING TO COMMAND PANEL...</div>
            </div>
          )}

          {/* Parts Scorecard */}
          <div className="space-y-4">
            <h3 className="text-lg font-black uppercase text-[#f8fafc] border-b border-[#333333] pb-2 tracking-widest">
              Mechanical & Electrical Specifications
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0A0D14]/80 border border-[#1A1A1A] p-4 rounded text-center">
                <span className="text-[10px] text-[#A0A0A0] uppercase block">DRY WEIGHT:</span>
                <span className="text-lg text-[#00FF66] font-black">{build.dryWeight}g</span>
              </div>
              <div className="bg-[#0A0D14]/80 border border-[#1A1A1A] p-4 rounded text-center">
                <span className="text-[10px] text-[#A0A0A0] uppercase block">ESC BUFFER:</span>
                <span className="text-lg text-white font-black">{build.specs.electronics.escCurrentLimit}A</span>
              </div>
              <div className="bg-[#0A0D14]/80 border border-[#1A1A1A] p-4 rounded text-center">
                <span className="text-[10px] text-[#A0A0A0] uppercase block">FC CHIP:</span>
                <span className="text-lg text-white font-black">{build.specs.electronics.fcProcessor}</span>
              </div>
              <div className="bg-[#0A0D14]/80 border border-[#1A1A1A] p-4 rounded text-center">
                <span className="text-[10px] text-[#A0A0A0] uppercase block">BATTERY:</span>
                <span className="text-lg text-[#FF5C00] font-black">{build.specs.power.targetBatteryCells}</span>
              </div>
            </div>
          </div>

          {/* Component Check List */}
          <div className="space-y-4">
            <h3 className="text-lg font-black uppercase text-[#f8fafc] border-b border-[#333333] pb-2 tracking-widest">
              Hardware Component Checklist
            </h3>

            <div className="space-y-3">
              {build.partsList.map((part, index) => (
                <div
                  key={index}
                  className="p-4 border border-[#1A1A1A] bg-[#050810]/50 rounded flex justify-between items-center text-xs"
                >
                  <div>
                    <span className="text-[#FF5C00] font-black uppercase tracking-wider mr-4">
                      [{part.category}]
                    </span>
                    <span className="text-white font-black uppercase">
                      {part.brand} {part.model}
                    </span>
                  </div>
                  <a
                    href={part.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00F2FF] hover:underline flex items-center gap-1 font-black"
                  >
                    View Part <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Qualifying Guides */}
          <div className="p-6 border border-[#00F2FF]/10 bg-[#050810]/80 rounded-lg">
            <h3 className="text-xs uppercase text-[#00F2FF] font-black border-b border-[#00F2FF]/20 pb-2 mb-4 tracking-widest flex items-center gap-2">
              <Award className="w-4 h-4" /> Related PQP Qualifying Lessons
            </h3>
            
            <div className="space-y-4">
              {build.qualifyingArticles.map((art, idx) => (
                <div key={idx} className="flex justify-between items-start gap-4 border-b border-[#1A1A1A] pb-3 last:border-b-0 last:pb-0">
                  <div>
                    <a
                      href={`/article/${art.slug}`}
                      className="text-sm font-black text-white hover:text-[#00F2FF] uppercase hover:underline leading-tight block"
                    >
                      {art.title}
                    </a>
                    <span className="text-[10px] text-[#A0A0A0] uppercase mt-1 block">
                      Qualifying Scope: {art.moduleName}
                    </span>
                  </div>
                  <span className="text-[10px] bg-[#00F2FF]/10 text-[#00F2FF] border border-[#00F2FF]/20 py-1 px-2.5 rounded font-black uppercase flex-shrink-0">
                    Syllabus Anchor
                  </span>
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
