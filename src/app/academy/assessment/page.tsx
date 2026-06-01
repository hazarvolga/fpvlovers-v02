"use client";

/**
 * Scenario-Based Pilot Archetype Assessment (PAA) Widget.
 * Presents the user with 5 high-fidelity operational scenarios to determine their 
 * flight class archetype, initializing their serialized Pilot Dossier cookie state.
 */

import React, { useState } from "react";
import { saveDossierToBrowser } from "@/lib/state/dossier-serializer";
import { PilotDossier, PilotClass } from "@/types/pilot-dossier";
import { Shield, Target, Compass, Video, Cpu, ChevronRight, Award, UserCheck } from "lucide-react";

interface ScenarioQuestion {
  id: number;
  question: string;
  options: {
    text: string;
    archetype: PilotClass;
    details: string;
  }[];
}

const PAA_SCENARIOS: ScenarioQuestion[] = [
  {
    id: 1,
    question: "You are planning an operational sortie. Select your ideal flight environment:",
    options: [
      {
        text: "Abandoned Bando: An abandoned brick factory with tight concrete gaps and steel support pillars.",
        archetype: "Freestyle Tactician",
        details: "Prioritizes close-proximity proximity maneuvers and momentum-based flips."
      },
      {
        text: "High Alpine Ridge: A remote, high-altitude alpine ridge facing strong, unpredictable winds.",
        archetype: "Long Range Explorer",
        details: "Focuses on RF signal penetration, high-efficiency cruise, and navigation."
      },
      {
        text: "Luxury Real Estate: A luxury estate requiring butter-smooth indoor-to-outdoor video transitions.",
        archetype: "Cinematic Operator",
        details: "Optimizes slow, fluid orbits, ducted safety, and dynamic camera angles."
      },
      {
        text: "Racing Track: A professional race track mapped with high-visibility vertical gates and split-s curves.",
        archetype: "Competitive Racer",
        details: "Demands maximum speed, low-latency analog feeds, and cornering precision."
      },
      {
        text: "Engineering Bench: Your clean workbench, loaded with wiring schematics, spare stators, and solder fluxes.",
        archetype: "System Builder / Engineer",
        details: "Finds fulfillment in telemetry analysis, AM32 tuning, and custom assembly."
      }
    ]
  },
  {
    id: 2,
    question: "Select your primary hardware blueprint engineering philosophy:",
    options: [
      {
        text: "Acrobatic Rigidity: Stiff carbon frame arms and resonance dampening to counter high-G propwash loops.",
        archetype: "Freestyle Tactician",
        details: "Focuses on mechanical rigidity to allow aggressive D-term filter adjustments."
      },
      {
        text: "Max Range & Flight Time: High-capacity batteries, robust GPS satellite locks, and 915MHz long-range radio system.",
        archetype: "Long Range Explorer",
        details: "Demands Li-Ion power packs and reliable automated recovery protocols."
      },
      {
        text: "Propeller Duct Guards: Duct safety shielding, smooth throttle curves, and dynamic camera mounts.",
        archetype: "Cinematic Operator",
        details: "Optimizes indoor flight margins, quiet sound signatures, and zero camera shake."
      },
      {
        text: "Weight Shaving & Speed: Lowest possible dry weight and high KV motors to maximize thrust-to-weight ratios.",
        archetype: "Competitive Racer",
        details: "Sacrifices durability and video resolution to shave fractions of a gram."
      },
      {
        text: "Clean Electronics Build: Perfect solder connections, clean BEC voltage filtration, and direct UART configs.",
        archetype: "System Builder / Engineer",
        details: "Eliminates all dynamic electrical noise at the source using physical filters."
      }
    ]
  },
  {
    id: 3,
    question: "Your receiver triggers a 'CRITICAL RSSI / LINK QUALITY (LQ)' alarm far out. You:",
    options: [
      {
        text: "Manual Signal Recovery: Execute an aggressive snap-roll back to re-establish line-of-sight signal coverage.",
        archetype: "Freestyle Tactician",
        details: "Relies on rapid manual control vectors to steer clear of immediate RF shadows."
      },
      {
        text: "Automated GPS Return: Verify satellite locks, monitor voltage sag, and activate the GPS Rescue return protocol.",
        archetype: "Long Range Explorer",
        details: "Trusts automated safety procedures to safely pilot the drone back home."
      },
      {
        text: "Smooth Antenna Re-orientation: Slowly orbit the spot, smooth your throttle spikes, and orient your directional goggles.",
        archetype: "Cinematic Operator",
        details: "Maintains smooth video capture while visually analyzing signal shadows."
      },
      {
        text: "Line-of-Sight Alignment: Adjust your flight line to keep a direct line-of-sight view with the antenna grid.",
        archetype: "Competitive Racer",
        details: "Prioritizes immediate physical RF visual clearance over automated fallbacks."
      },
      {
        text: "Telemetry Data Diagnostics: Analyze the RF noise parameters on your telemetry log to optimize link rates later.",
        archetype: "System Builder / Engineer",
        details: "Uses anomalies as diagnostic data to recalibrate transmitter output margins."
      }
    ]
  },
  {
    id: 4,
    question: "If you had to invest budget in upgrading a single component, it would be:",
    options: [
      {
        text: "Resonance Dampened Frame: Stiffer carbon fiber arms to eliminate mid-throttle resonance vibration noise.",
        archetype: "Freestyle Tactician",
        details: "Allows higher PID feedback gains without introducing gyro heating."
      },
      {
        text: "Long-Range Receiver System: A high-penetration 915MHz transmitter system with dual diversity patches.",
        archetype: "Long Range Explorer",
        details: "Insures long-range signal security against mountain multipathing blockage."
      },
      {
        text: "Premium HD Camera VTX: A premium high-definition digital VTX with dynamic camera stabilization.",
        archetype: "Cinematic Operator",
        details: "Delivers crystal-clear 4K footage directly for cinematic client production."
      },
      {
        text: "Low-Inertia Propellers: Stiff, carbon-reinforced propellers with minimal moment of inertia.",
        archetype: "Competitive Racer",
        details: "Provides instant throttle response for immediate course corrections."
      },
      {
        text: "Advanced Commutation ESC: A high-performance 4-in-1 ESC running custom optimized AM32 firmware.",
        archetype: "System Builder / Engineer",
        details: "Guarantees rapid commutation sync and maximum current handling limits."
      }
    ]
  },
  {
    id: 5,
    question: "What is your primary definition of a perfect, successful flight?",
    options: [
      {
        text: "Acrobatic Gaps: Threading a tiny concrete gap at high speed and completing a clean split-s roll.",
        archetype: "Freestyle Tactician",
        details: "Demonstrating absolute spatial awareness and aggressive muscle coordination."
      },
      {
        text: "Alpine Peak Surfing: Surfing a remote, silent mountain peak 3 miles away and returning with battery to spare.",
        archetype: "Long Range Explorer",
        details: "Achieving complex geographical exploration goals through careful flight planning."
      },
      {
        text: "Continuous Real Estate Flythrough: Capturing a continuous, single-take flythrough of an architectural space.",
        archetype: "Cinematic Operator",
        details: "Delivering premium visual layouts that invoke emotional and aesthetic reactions."
      },
      {
        text: "Lap Time Domination: Shaving 0.2 seconds off your previous lap time and taking the checker flag.",
        archetype: "Competitive Racer",
        details: "Dominating racing tracks through rigid execution and lightning fast reflexes."
      },
      {
        text: "Perfect Commutation Tuning: Flashing new firmware, resolving a desync, and watching motor lines align on graphs.",
        archetype: "System Builder / Engineer",
        details: "Transforming raw physical components into a calibrated flight instrument."
      }
    ]
  }
];

export default function PilotAssessmentPage() {
  const [callsign, setCallsign] = useState("");
  const [isIntroMode, setIsIntroMode] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<PilotClass[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [calculatedClass, setCalculatedClass] = useState<PilotClass | null>(null);

  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (callsign.trim().length >= 2) {
      setIsIntroMode(false);
    }
  };

  const handleAnswerSelect = (archetype: PilotClass) => {
    const updatedAnswers = [...selectedAnswers, archetype];
    setSelectedAnswers(updatedAnswers);

    if (currentQuestionIndex < PAA_SCENARIOS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate archetype dominance
      const counts: Record<string, number> = {};
      let maxCount = 0;
      let dominantArchetype: PilotClass = "Freestyle Tactician";

      updatedAnswers.forEach((ans) => {
        counts[ans] = (counts[ans] || 0) + 1;
        if (counts[ans] > maxCount) {
          maxCount = counts[ans];
          dominantArchetype = ans;
        }
      });

      setCalculatedClass(dominantArchetype);
      setIsFinished(true);
    }
  };

  const handleDeployDossier = () => {
    if (!calculatedClass || !callsign) return;

    // Construct the serialized Mil-Spec Dossier
    const initialDossier: PilotDossier = {
      callsign: callsign.trim().toUpperCase(),
      assignedClass: calculatedClass,
      qualifications: {
        qualifiedModuleIds: ["intro-fpv"], // pre-qualify the initiation step
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
    window.location.href = "/academy/roadmap";
  };

  const getIcon = (archetype: PilotClass) => {
    switch (archetype) {
      case "Freestyle Tactician": return Target;
      case "Long Range Explorer": return Compass;
      case "Cinematic Operator": return Video;
      case "Competitive Racer": return Shield;
      case "System Builder / Engineer": return Cpu;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-32 text-[#f8fafc] font-mono">
      {isIntroMode ? (
        /* Intro screen */
        <div className="p-8 border border-[#00F2FF]/10 bg-[#050810]/80 rounded-lg shadow-[0_0_50px_rgba(0,242,255,0.05)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,242,255,0.03),transparent)] pointer-events-none" />
          
          <div className="mb-8 border-b border-[#00F2FF]/20 pb-4">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-widest text-white">
              Pilot <span className="text-[#00F2FF]">Archetype Assessment</span>
            </h1>
            <p className="text-xs uppercase text-[#A0A0A0] mt-1 tracking-widest">
              {"// PROFILING FLIGHT TRAJECTORY CODES"}
            </p>
          </div>

          <p className="text-sm leading-relaxed text-[#A0A0A0] mb-8">
            Welcome, operator. The FPV flight envelope is diverse. To qualify your flight path in the **Flight Progression Matrix (FPM)**, you must complete the Pilot Archetype Assessment. 
            This assessment poses 5 critical flight scenarios to decode your default operational instincts and assign your core Pilot Class.
          </p>

          <form onSubmit={handleStartQuiz} className="space-y-6 max-w-xl">
            <div>
              <label className="block text-sm uppercase text-[#A0A0A0] mb-2 tracking-widest">
                Declare Callsign (Operator Tag):
              </label>
              <input
                type="text"
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                placeholder="e.g. MAVERICK"
                className="w-full bg-[#0A0D14] border border-[#00F2FF]/20 p-3 rounded text-white focus:outline-none focus:border-[#00F2FF] font-mono text-lg uppercase tracking-wider"
                maxLength={12}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center gap-2 bg-[#00F2FF]/10 hover:bg-[#00F2FF]/20 text-[#00F2FF] font-black py-4 px-8 rounded uppercase tracking-wider transition-colors duration-200 border border-[#00F2FF]/30"
            >
              Initialize Assessment <ChevronRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      ) : !isFinished ? (
        /* Scenario question screens */
        <div className="p-8 border border-[#00F2FF]/10 bg-[#050810]/80 rounded-lg shadow-[0_0_50px_rgba(0,242,255,0.05)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,242,255,0.03),transparent)] pointer-events-none" />
          
          <div className="mb-6 flex justify-between items-center text-xs text-[#A0A0A0]">
            <span className="uppercase tracking-widest text-[#00F2FF] font-black">
              SCENARIO PROTOCOL: 0{PAA_SCENARIOS[currentQuestionIndex].id} / 05
            </span>
            <span className="font-mono">PILOT: {callsign.toUpperCase()}</span>
          </div>

          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mb-8 leading-tight">
            {PAA_SCENARIOS[currentQuestionIndex].question}
          </h2>

          <div className="space-y-4">
            {PAA_SCENARIOS[currentQuestionIndex].options.map((opt, index) => {
              const IconComponent = getIcon(opt.archetype);
              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(opt.archetype)}
                  className="w-full text-left p-5 bg-[#0A0D14]/80 border border-[#1A1A1A] hover:border-[#00F2FF]/40 rounded hover:bg-[#00F2FF]/5 transition-all duration-200 group flex items-start gap-4"
                >
                  <div className="bg-[#1A1A1A] group-hover:bg-[#00F2FF]/10 p-2.5 rounded text-[#A0A0A0] group-hover:text-[#00F2FF] border border-[#333333] group-hover:border-[#00F2FF]/20 flex-shrink-0 mt-0.5">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-wide group-hover:text-[#00F2FF] leading-snug">
                      {opt.text}
                    </p>
                    <p className="text-xs text-[#A0A0A0] mt-1 font-mono leading-relaxed opacity-80">
                      {opt.details}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Quiz result deployment screen */
        <div className="p-8 border border-[#00FF66]/10 bg-[#050810]/80 rounded-lg shadow-[0_0_50px_rgba(0,255,102,0.05)] relative overflow-hidden text-center max-w-2xl mx-auto">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,255,102,0.03),transparent)] pointer-events-none" />
          
          <Award className="w-16 h-16 text-[#00FF66] mx-auto mb-6 animate-pulse" />
          
          <h2 className="text-3xl font-black uppercase text-white tracking-widest mb-2">
            Assessment <span className="text-[#00FF66]">Cleared</span>
          </h2>
          <p className="text-xs uppercase text-[#A0A0A0] tracking-widest mb-8">
            {"// DOSSIER SPECIFICATION RESOLVED"}
          </p>

          <div className="bg-[#0A0D14] border border-[#00FF66]/20 p-6 rounded-lg mb-8 max-w-md mx-auto text-left">
            <h3 className="text-xs uppercase text-[#00FF66] font-black border-b border-[#00FF66]/10 pb-2 mb-4 tracking-widest flex items-center gap-2">
              <UserCheck className="w-4 h-4" /> Operator Credentials
            </h3>
            <p className="text-sm text-white uppercase tracking-wider">
              PILOT TAG: <span className="text-[#00F2FF] font-black">{callsign.toUpperCase()}</span>
            </p>
            <p className="text-sm text-white uppercase tracking-wider mt-2">
              CORE CLASS: <span className="text-[#FF5C00] font-black">{calculatedClass}</span>
            </p>
            <p className="text-sm text-white uppercase tracking-wider mt-2">
              INITIAL ORL: <span className="text-[#00FF66] font-black">ORL-0 (Initiation)</span>
            </p>
          </div>

          <button
            onClick={handleDeployDossier}
            className="w-full bg-[#00FF66] hover:bg-[#00FF66]/90 text-black font-black py-4 px-8 rounded uppercase tracking-wider transition-colors duration-200 border-b-4 border-[#00A341] text-sm"
          >
            Deploy Credentials & Enter Roadmap
          </button>
        </div>
      )}
    </div>
  );
}
