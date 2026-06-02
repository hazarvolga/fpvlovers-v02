"use client";

import React, { useState, useRef } from 'react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { 
  Zap, PackagePlus, AlertTriangle, ShieldCheck, ChevronRight,
  Radio, Cpu, Video, Compass, Battery, HelpCircle, Sparkles, RefreshCw
} from 'lucide-react';

// FPV Pilot Archetypes / Mission Profiles
interface MissionProfile {
  id: string;
  emoji: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Intermediate / Advanced' | 'All Levels';
  description: string;
  goals: string[];
  overview: string;
  successCriteria: string;
  learningCurve: string;
  pitfalls: string;
  loadout: {
    radio: string;
    goggles: string;
    drone: string;
    battery: string;
    charger: string;
    simulator: string;
  };
  academyPath: string[];
  buildDna: {
    class: string;
    weight: string;
    pros: string;
    cons: string;
  };
}

const missionProfiles: MissionProfile[] = [
  {
    id: 'cinematic',
    emoji: '🎬',
    title: 'Cinematic Operator',
    difficulty: 'Beginner',
    description: 'Capture smooth, immersive high-definition FPV footage for travel, nature, real estate, and cinematic storytelling.',
    goals: ['Buttery Smooth video', 'High Definition capture', 'Stable aerodynamic lines', 'Commercial production values'],
    overview: 'This path focuses on getting high-quality cameras into the air safely. Instead of rapid flips and bando-bashing, cinematic pilots focus on throttle control, slow proximity gaps, and steady tracking orbits.',
    successCriteria: 'Flying a slow, perfectly constant height orbit around an object for 2 minutes with no altitude wobbles.',
    learningCurve: 'Moderate. Real-estate cinewhoops can be armed in self-leveling modes to start, but true cinematic smoothness requires mastering low-rate acro mode.',
    pitfalls: 'Carrying a heavy GoPro camera on a micro drone that is too small, resulting in severe motor heat and short 90-second flight times.',
    loadout: {
      radio: 'Radiomaster Boxer (ELRS 2.4GHz) - Ergonomic full-sized gimbals for fine micro-steering.',
      goggles: 'DJI Goggles 3 or Walksnail Avatar X - High-definition video transmission is mandatory to see proximity gaps.',
      drone: 'BetaFPV Pavo25 V2 or QAV-Pro 3" Cinewhoop - Fully enclosed ducted prop guards for indoor safety.',
      battery: '4S 850mAh to 1300mAh LiPo - Balanced power-to-weight envelope for smooth flight.',
      charger: 'SkyRC T200 Dual Charger - Charge two packs safely simultaneously.',
      simulator: 'Liftoff or Uncrashed - Practice close-proximity obstacle clearance before flying real rooms.'
    },
    academyPath: [
      'Phase 1: Simulator Calibration (Target: 10 hours orbit hovering)',
      'Phase 2: Ducted Aerodynamics & Propwash management',
      'Phase 3: HD Video Transmission Systems & Channel Settings',
      'Phase 4: Proximity Flight Safety & Indoor Risk Assessment',
      'Phase 5: Cinematic Composition and Action Camera Tuning'
    ],
    buildDna: {
      class: '3-Inch Cinewhoop / Ducted Platform',
      weight: 'Sub-250g to 450g loaded',
      pros: 'Propeller guards protect people and indoor assets; extreme hover stability.',
      cons: 'Highly susceptible to outdoor wind drift, loud screaming motor pitch, heavy throttle propwash.'
    }
  },
  {
    id: 'freestyle',
    emoji: '🚀',
    title: 'Freestyle Pilot',
    difficulty: 'Intermediate',
    description: 'Master acrobatic flight, tricks, flow, proximity speed runs, and creative aerial movement in abandoned structures.',
    goals: ['Acrobatic tricks', 'Flow & momentum control', 'Proximity diving', 'Bando bashing'],
    overview: 'The freestyle pilot treats the sky like a canvas. Using high-thrust miniquads, this path is about combining raw power with acrobatic reflexes to execute moves like power loops, yaw spins, and bando dives.',
    successCriteria: 'Executing a clean split-S dive from a 50-foot building and recovering into a steady hover close to the ground.',
    learningCurve: 'High. Demands absolute muscle memory calibration. You must understand how to utilize momentum when the quad is completely upside down.',
    pitfalls: 'Attempting complex acrobatic maneuvers over concrete on day one instead of starting over tall grass or in a flight simulator.',
    loadout: {
      radio: 'Radiomaster Pocket or TX12 MKII (ELRS) - Compact, portable, and durable for bando exploration.',
      goggles: 'Walksnail Avatar X or FatShark Scout (Analog) - Analog is low-cost and ultra-low latency; HD is beautiful.',
      drone: 'EMAX Hawk Apex 5" or Custom Carbon 5" - Carbon fiber must be at least 5mm thick to withstand brick crashes.',
      battery: '6S 1300mAh to 1400mAh LiPo - The modern standard for punchy, sag-free power.',
      charger: 'HOTA D6 Pro Dual Charger - Heavy duty charger with integrated AC power source.',
      simulator: 'VelociDrone or Liftoff - High-gravity physics to calibrate split-S and powerloop reflexes.'
    },
    academyPath: [
      'Phase 1: Simulator Acro Mastery (Target: 20 hours acrobatic tricks)',
      'Phase 2: Electronic Speed Controller (ESC) & high current settings',
      'Phase 3: Frame Assembly & Soldering under mechanical stress',
      'Phase 4: PID Loop Calibration & Filter optimization',
      'Phase 5: Advanced Acrobatic Flight and Bando Recovery'
    ],
    buildDna: {
      class: '5-Inch Standard X-Frame',
      weight: '550g to 750g with battery',
      pros: 'Maximum structural durability, massive thrust-to-weight envelope, endless custom parts.',
      cons: 'High kinetic hazard in crashes, loud acoustic profile, requires extensive space to fly.'
    }
  },
  {
    id: 'long-range',
    emoji: '🌍',
    title: 'Long Range Explorer',
    difficulty: 'Intermediate / Advanced',
    description: 'Explore mountain peaks, vast valleys, coastlines, and remote areas using efficient, endurance-tuned aircraft.',
    goals: ['Extreme distance capabilities', 'Alpine peak surfing', 'Autopilot GPS rescue', 'Endurance battery management'],
    overview: 'Long range flying is about peace, exploration, and respecting radio link limits. It demands careful telemetry monitoring, high-efficiency motor setups, and reliable failsafe configurations to ensure the drone returns home.',
    successCriteria: 'Flying 2 miles out into a mountain valley, surfing a ridge, and executing a safe automated GPS Rescue back to your home point.',
    learningCurve: 'High. Requires advanced knowledge of RF antenna polarization, battery discharge limits, and GPS fail-safes.',
    pitfalls: 'Flying behind massive mountains (LOS block) or flying into headwind on empty batteries, resulting in catastrophic loss.',
    loadout: {
      radio: 'Radiomaster Boxer (ELRS 2.4GHz at 1000mW output) - High output power is mandatory to penetrate long range valleys.',
      goggles: 'DJI Goggles 3 or Analog with high-gain directional patch antennas.',
      drone: 'GepRC Crocodile 7 or Custom 7" Deadcat - Large props optimize battery efficiency for heavy cruising.',
      battery: '6S 3000mAh to 4000mAh Li-Ion - Lithium-Ion cells provide much higher energy capacity than standard LiPos.',
      charger: 'ISDT Q6 Nano - Highly compact, reliable field-charging operations.',
      simulator: 'Liftoff (Long Range maps) - Master compass navigation and throttle cruise efficiency.'
    },
    academyPath: [
      'Phase 1: Simulator Navigation (Target: Compass training, high wind landing)',
      'Phase 2: RF Link Engineering (Antenna placement, polarization, refresh rates)',
      'Phase 3: GPS Rescue Setup & Fail-safe recovery algorithms in Betaflight',
      'Phase 4: Lithium-Ion Battery Chemistry & Voltage Curve management',
      'Phase 5: Long-Distance Flight Planning and Wilderness Operations'
    ],
    buildDna: {
      class: '7-Inch Deadcat Endurance Frame',
      weight: '800g to 1200g loaded',
      pros: 'Surf mountain peaks with high wind penetration; cruise times up to 15-20 minutes.',
      cons: 'Extremely high kinetic hazard, sluggish rates, expensive components.'
    }
  },
  {
    id: 'whoop',
    emoji: '🏠',
    title: 'Tiny Whoop Pilot',
    difficulty: 'Beginner',
    description: 'Learn FPV indoors, navigate tight household gaps, and fly safely around people and pets in any weather.',
    goals: ['Indoor exploration', 'Rapid reflex progression', 'Zero crash damage', 'High-frequency practice'],
    overview: 'Tiny Whoops are the ultimate learning tool. Weighing less than 30 grams, these micro ducted quads can crash into walls, TVs, and pets at full speed without causing damage, allowing pilots to push limits safely.',
    successCriteria: 'Flying three consecutive clean laps through a household dining chair slalom under 45 seconds.',
    learningCurve: 'Very Gentle. The safest and most stress-free entry point into real FPV flying.',
    pitfalls: 'Flying indoors with heavy, high-voltage batteries that ruin the ultra-light weight characteristics of the tiny whoop.',
    loadout: {
      radio: 'Radiomaster Pocket (ELRS 2.4GHz) - Compact, portable, and budget-friendly for small whoop bags.',
      goggles: 'FatShark Echo or Scout (Analog) - Ultra-lightweight analog goggles with zero lag.',
      drone: 'BetaFPV Meteor65 Air or HappyModel Mobula6 - The gold standard 65mm brushless indoor micro whoops.',
      battery: '1S 300mAh BT2.0 LiHV - Tiny 1S batteries are safe, cheap, and charge in 15 minutes.',
      charger: 'WhoopStor V3 1S Charger - The only charger that can charge and storage-discharge 1S packs.',
      simulator: 'Tiny Whoop GO or VelociDrone (Micro maps) - Master indoor gate racing and high-rate throttle control.'
    },
    academyPath: [
      'Phase 1: Simulator Indoor Slaloms (Target: 5 hours micro gate control)',
      'Phase 2: 1S Battery Care, HV charging levels, and BT2.0 connector maintenance',
      'Phase 3: Micro Motor KV Selection and dynamic motor filtering',
      'Phase 4: Weight Optimization protocols (Saving grams for indoor thrust)',
      'Phase 5: Indoor Slalom Racing and Micro Gaps Navigation'
    ],
    buildDna: {
      class: '65mm / 75mm Micro Brushed/Brushless Whoop',
      weight: '18g to 28g dry weight',
      pros: 'Virtually indestructible, safe to fly around humans, incredibly cheap replacement parts.',
      cons: 'Cannot fly in outdoor winds exceeding 5mph, standard analog resolution (low dynamic range).'
    }
  },
  {
    id: 'engineer',
    emoji: '🔧',
    title: 'FPV Engineer',
    difficulty: 'All Levels',
    description: 'Dive deep into structural building, circuit board soldering, firmware tuning, and multi-protocol electronics.',
    goals: ['Clean wiring and soldering', 'Component diagnostics', 'Betaflight firmware tuning', 'Custom frame optimization'],
    overview: 'For the FPV Engineer, the workbench is the playground. This path focuses on understanding how the ESC translates electrical pulses, how the gyroscope talks to the FC, and how to build custom quads from bare carbon.',
    successCriteria: 'Completing a clean, custom 5-inch drone build from loose components and performing a successful, smoke-free maiden flight.',
    learningCurve: 'High. Requires patience, high-quality soldering tools, and understanding basic electronics and serial protocols.',
    pitfalls: 'Soldering high-current battery wires with a cheap, low-temperature iron, resulting in weak cold-joint welds.',
    loadout: {
      radio: 'Radiomaster Boxer (ELRS) - Robust build, easy module expansion, and open-source EdgeTX companion tools.',
      goggles: 'Walksnail Avatar X - High compatibility, customizable menus, and HDMI-in/out for bench testing.',
      drone: 'TBS Source One V5 Frame - Highly robust carbon frame designed for infinite repair testing.',
      battery: '4S or 6S practice packs - Used for bench diagnostics and calibration testing.',
      charger: 'ToolkitRC M7 - Built-in signal generator and cell diagnostics tester.',
      simulator: 'Liftoff (Work Bench Mode) - Visualizing mechanical weight distributions.'
    },
    academyPath: [
      'Phase 1: Soldering Masterclass (Target: 50 perfect dummy PCB joints)',
      'Phase 2: Serial Communications & UART protocols (GPS, Receiver, SmartAudio mapping)',
      'Phase 3: Betaflight Configurator protocols & FC firmware updating',
      'Phase 4: ESC Protocols, Motor poles, and bidirectional DShot configurations',
      'Phase 5: Custom Build Assembly, Smoke checking, and PID tuning diagnostics'
    ],
    buildDna: {
      class: 'Custom Builder Bench Pack',
      weight: 'Variable by blueprint',
      pros: 'Infinite customization, absolute control over specs, easy repair skills.',
      cons: 'Demands patience, high upfront tool costs, steep initial bench learning curve.'
    }
  }
];

export default function StarterKitsPage() {
  const [selectedMission, setSelectedMission] = useState<string>('cinematic');
  const [budget, setBudget] = useState<number>(500);
  const [experience, setExperience] = useState<string>('beginner');
  const [targetMission, setTargetMission] = useState<string>('whoop');
  const [showResult, setShowResult] = useState<boolean>(false);

  const detailSectionRef = useRef<HTMLDivElement>(null);
  const generatorSectionRef = useRef<HTMLDivElement>(null);

  const handleSelectMission = (id: string) => {
    setSelectedMission(id);
    // Smooth scroll to mission detail dashboard
    setTimeout(() => {
      detailSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleGenerateLoadout = (e: React.FormEvent) => {
    e.preventDefault();
    setShowResult(true);
    // Smooth scroll to generator results
    setTimeout(() => {
      generatorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  // Find active selected mission profile
  const activeProfile = missionProfiles.find(p => p.id === selectedMission) || missionProfiles[0];

  // Dynamic Generator Logic based on inputs
  const calculateRecommendation = () => {
    let loadout = {
      drone: '',
      radio: '',
      goggles: '',
      simulator: '',
      nextStep: '',
      warning: ''
    };

    if (budget <= 300) {
      loadout.drone = 'BetaFPV Meteor65 Air (Analog 1S) - Incredibly light, crash-proof micro whoop.';
      loadout.radio = 'Radiomaster Pocket (ELRS 2.4GHz) - Most budget-friendly premium hall-sensor controller.';
      loadout.goggles = 'FatShark Echo (Analog) - Affordable, compact entry-level analog goggle.';
      loadout.simulator = 'Tiny Whoop GO (Free) - Excellent physics tuned for micro 1S whoops.';
      loadout.nextStep = 'Buy the radio and simulator first. Fly 5 hours in the simulator before unboxing the drone to prevent outdoor flyaways.';
      loadout.warning = 'Low Budget Gate: $300 demands Analog. Do not attempt digital video links (DJI/Walksnail) at this tier as goggles alone exceed $400.';
    } else if (budget <= 600) {
      if (targetMission === 'whoop' || targetMission === 'cinematic') {
        loadout.drone = 'HappyModel Mobula6 or BetaFPV Pavo Pico - Outstanding micro platforms.';
        loadout.radio = 'Radiomaster TX12 MKII (ELRS) - Full EdgeTX support with excellent compact ergonomics.';
        loadout.goggles = 'FatShark Scout (Analog) - Outstanding receiver quality with full DVR recording.';
        loadout.simulator = 'Liftoff (Micro Drones) - Perfect calibration for sub-100g indoor flights.';
        loadout.nextStep = 'Set up a custom bind phrase in ExpressLRS configurator to lock the link.';
      } else {
        loadout.drone = 'EMAX Hawk Apex 5" Freestyle (Analog) - Carbon fiber tank ready for concrete bando exploration.';
        loadout.radio = 'Radiomaster Boxer (ELRS 2.4GHz) - Standard-setting full-sized gimbals for maximum acro steering.';
        loadout.goggles = 'FatShark Scout (Analog) - Lag-free analog, perfect for fast acrobatic proximity reactions.';
        loadout.simulator = 'Liftoff or VelociDrone - Highly reactive physics for Split-S and powerloop training.';
        loadout.nextStep = 'Train split-S dives in the simulator until muscle memory is calibrated.';
      }
      loadout.warning = 'Mid-Tier Balance: You are running high-performance Analog. Highly reliable, extremely responsive, and budget-safe replacement parts.';
    } else {
      // High budget $1000+
      loadout.radio = 'Radiomaster Boxer (ELRS 2.4GHz at 1000mW output) - Top-tier stick control and signal insurance.';
      loadout.simulator = 'Liftoff, Uncrashed, or VelociDrone.';
      
      if (targetMission === 'cinematic') {
        loadout.drone = 'GepRC Cinelog35 V2 (Walksnail or DJI O3) - HD digital cinewhoop built for commercial filming.';
        loadout.goggles = 'DJI Goggles 3 or Walksnail Avatar X - Breathtaking 1080p digital live feeds.';
        loadout.nextStep = 'Learn DJI O3 camera settings, ND filter options, and Gyroflow video stabilization workflows.';
      } else if (targetMission === 'long-range') {
        loadout.drone = 'GepRC Crocodile 7 Explorer (Digital HD) - Large cruising platform with GPS autopilot.';
        loadout.goggles = 'DJI Goggles 3 - Pristine long-range HD video feed.';
        loadout.nextStep = 'Configure and test GPS Rescue Return-To-Home safety failsafes over soft grass first.';
      } else if (targetMission === 'whoop') {
        loadout.drone = 'Mobula6 HD Zero - High-definition digital micro racing whoop.';
        loadout.goggles = 'HDZero Goggles - High frame-rate digital video for maximum agility.';
        loadout.nextStep = 'Tune Betaflight motor filter stages to handle micro digital weight.';
      } else {
        loadout.drone = 'Custom 5" Freestyle (Walksnail Avatar HD) - Acrobatic frame with cinematic HD live feeds.';
        loadout.goggles = 'Walksnail Avatar X - State-of-the-art digital goggle with HDMI ports.';
        loadout.nextStep = 'Assemble custom carbon frame, build clean soldering joints, and configure Betaflight PID loops.';
      }
      loadout.warning = 'Digital HD Authorized: You are flying premium High-Definition digital video links. Unmatched clarity, but goggles and camera replacement costs are high.';
    }

    return loadout;
  };

  const rec = calculateRecommendation();

  const breadcrumbs = [
    { label: 'Pilot Academy', href: '/academy' },
    { label: 'Starter Kits', isCurrentPage: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 font-mono text-[#EBE7DF]">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      {/* HERO SECTION */}
      <div className="relative p-10 border border-white/5 rounded-lg bg-gradient-to-b from-[#0B0B0C] to-black shadow-2xl mb-12 overflow-hidden text-center max-w-5xl mx-auto">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#FF5C00]/10 via-[#00F2FF] to-[#00FF66]/10" />
        
        <PackagePlus className="w-12 h-12 text-[#FF5C00] mx-auto mb-6 opacity-90" />
        
        <h1 className="text-3xl md:text-5xl font-black uppercase text-white tracking-tighter mb-4 leading-tight">
          Don&apos;t Choose a Drone.<br/>
          <span className="text-[#00F2FF]">Choose the Pilot You Want to Become.</span>
        </h1>
        <p className="text-xs md:text-sm text-[#8D8981] max-w-3xl mx-auto leading-relaxed uppercase tracking-wider mb-8">
          Every FPV journey starts with a mission. Select your mission profile and FPV Lovers will guide you through the equipment, training path, Academy roadmap, and future upgrade journey.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={() => {
              document.getElementById('mission-selector')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="px-6 py-3 bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white text-xs font-black uppercase tracking-wider rounded border-b-2 border-[#9E3900] transition-all cursor-pointer w-full sm:w-auto"
          >
            Choose Your Mission
          </button>
          <button 
            onClick={() => {
              document.getElementById('kit-generator')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="px-6 py-3 bg-white/[0.03] hover:bg-white/[0.08] text-white border border-[#222] hover:border-[#00F2FF]/30 text-xs font-black uppercase tracking-wider rounded transition-all cursor-pointer w-full sm:w-auto"
          >
            Launch Loadout Generator
          </button>
        </div>
      </div>

      {/* SECTION 1 — CHOOSE YOUR MISSION */}
      <div id="mission-selector" className="mb-16 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1A1A1E] pb-3 mb-6">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#00F2FF]" />
            <h2 className="text-lg font-black uppercase text-white tracking-widest">
              Choose Your Mission Profile
            </h2>
          </div>
          <span className="text-xs text-[#8D8981] uppercase tracking-wide">
            Select your FPV pilot path to load customized equipment lists
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {missionProfiles.map((p) => {
            const isSelected = selectedMission === p.id;
            return (
              <div
                key={p.id}
                onClick={() => handleSelectMission(p.id)}
                className={`p-5 rounded border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-[#060A10]/75 border-[#00F2FF]/60 shadow-[inset_0_0_20px_rgba(0,242,255,0.05)] scale-[1.02]' 
                    : 'bg-black/45 border-[#1D1D22] hover:border-[#00F2FF]/30 hover:bg-black/80'
                }`}
              >
                <div className="flex flex-col gap-3">
                  <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">{p.emoji}</span>
                  <div>
                    <h3 className="text-xs font-black uppercase text-white tracking-tight leading-tight">{p.title}</h3>
                    <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase mt-1.5 ${
                      p.difficulty === 'Beginner' ? 'text-[#00FF66] border-[#00FF66]/20 bg-[#00FF66]/5' :
                      p.difficulty === 'Intermediate' ? 'text-[#00F2FF] border-[#00F2FF]/20 bg-[#00F2FF]/5' :
                      'text-[#FF5C00] border-[#FF5C00]/20 bg-[#FF5C00]/5'
                    }`}>
                      {p.difficulty}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8D8981] leading-relaxed line-clamp-4">
                    {p.description}
                  </p>
                </div>

                <div className="text-[9px] uppercase text-[#00F2FF] font-bold mt-4 pt-2.5 border-t border-white/5 flex items-center justify-between">
                  <span>Target specs</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2 — MISSION DETAIL VIEW */}
      <div ref={detailSectionRef} className="mb-16 scroll-mt-24">
        <div className="border border-white/5 rounded-lg bg-[#0B0B0C]/45 p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-[9px] text-[#555] tracking-widest uppercase">{"[PILOT_DOSSIER_LOADED]"}</div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c0c0e_1px,transparent_1px),linear-gradient(to_bottom,#0c0c0e_1px,transparent_1px)] bg-[size:30px_30px] opacity-[0.15] pointer-events-none" />
          
          <div className="flex items-center gap-4 border-b border-white/5 pb-4 mb-6">
            <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{activeProfile.emoji}</span>
            <div>
              <span className="text-[9px] text-[#00F2FF] uppercase font-bold tracking-widest block">Active Dashboard</span>
              <h2 className="text-xl md:text-2xl font-black uppercase text-white tracking-tight">{activeProfile.title} Loadout</h2>
            </div>
          </div>

          <div className="grid col-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Mission Overview */}
              <div>
                <h4 className="text-xs uppercase text-[#00F2FF] tracking-wider mb-2 font-bold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#00F2FF] rounded-full animate-pulse" />
                  Mission Overview
                </h4>
                <p className="text-xs leading-relaxed text-[#DFDFDF] bg-black/60 border border-[#1A1A1E] p-4 rounded uppercase">
                  {activeProfile.overview}
                </p>
              </div>

              {/* Goals */}
              <div>
                <h4 className="text-xs uppercase text-[#A0A0A0] tracking-wider mb-2 font-bold">Target Flight Objectives</h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[#8D8981]">
                  {activeProfile.goals.map((g, i) => (
                    <li key={i} className="flex items-center gap-2 uppercase">
                      <span className="text-[#00FF66] font-bold">✓</span> {g}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Curve and Pitfalls */}
              <div className="grid col-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-white/5 bg-black/40 rounded">
                  <span className="text-[10px] text-[#00FF66] uppercase font-bold block mb-1">Expected Learning Curve:</span>
                  <p className="text-xs text-[#8D8981] leading-relaxed uppercase">{activeProfile.learningCurve}</p>
                </div>
                <div className="p-4 border border-[#FF5C00]/20 bg-[#FF5C00]/[0.02] rounded">
                  <span className="text-[10px] text-[#FF5C00] uppercase font-bold block mb-1">Typical Beginner Mistake:</span>
                  <p className="text-xs text-[#8D8981] leading-relaxed uppercase">{activeProfile.pitfalls}</p>
                </div>
              </div>

              {/* Loadout Hardware decision */}
              <div className="border border-white/5 rounded bg-black/60 p-5 mt-4">
                <h3 className="text-xs uppercase text-[#00F2FF] tracking-widest font-black border-b border-white/5 pb-2.5 mb-4">
                  🚀 Recommended Pilot Loadout Details
                </h3>
                
                <div className="space-y-4">
                  {Object.entries(activeProfile.loadout).map(([key, value]) => (
                    <div key={key} className="text-xs">
                      <span className="text-[#FF5C00] uppercase font-bold text-[10px] block mb-0.5">{key}:</span>
                      <span className="text-[#EBE7DF] uppercase">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Academy Path integration */}
              <div className="p-5 border border-[#00FF66]/20 bg-[#00FF66]/[0.01] rounded">
                <h4 className="text-xs uppercase text-[#00FF66] tracking-wider mb-4 font-black border-b border-[#00FF66]/10 pb-2">
                  🗺️ Academy Roadmap Path
                </h4>
                <div className="space-y-4 text-[11px] text-[#8D8981]">
                  {activeProfile.academyPath.map((step, idx) => (
                    <div key={idx} className="flex gap-3">
                      <span className="text-[#00FF66] font-bold shrink-0">{idx + 1}.</span>
                      <span className="uppercase">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Build DNA specs */}
              <div className="p-5 border border-[#00F2FF]/20 bg-[#00F2FF]/[0.01] rounded font-mono text-xs">
                <h4 className="text-xs uppercase text-[#00F2FF] tracking-wider mb-4 font-black border-b border-[#00F2FF]/10 pb-2">
                  🧬 Active Build DNA
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-[#555] uppercase block text-[9px]">Airframe Class:</span>
                    <span className="text-white uppercase font-bold">{activeProfile.buildDna.class}</span>
                  </div>
                  <div>
                    <span className="text-[#555] uppercase block text-[9px]">Operational Weight:</span>
                    <span className="text-[#00FF66] font-bold">{activeProfile.buildDna.weight}</span>
                  </div>
                  <div>
                    <span className="text-[#00FF66] uppercase block text-[9px] font-bold">Advantages:</span>
                    <p className="text-[10px] text-[#8D8981] leading-relaxed uppercase">{activeProfile.buildDna.pros}</p>
                  </div>
                  <div>
                    <span className="text-[#FF5C00] uppercase block text-[9px] font-bold">Limitations:</span>
                    <p className="text-[10px] text-[#8D8981] leading-relaxed uppercase">{activeProfile.buildDna.cons}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* SECTION 7 — INTERACTIVE STARTER KIT GENERATOR */}
      <div id="kit-generator" className="mb-16 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1A1A1E] pb-3 mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#00FF66]" />
            <h2 className="text-lg font-black uppercase text-white tracking-widest">
              Interactive Starter Loadout Generator
            </h2>
          </div>
          <span className="text-xs text-[#8D8981] uppercase tracking-wide">
            Dynamic hardware and Academy roadmap calculator
          </span>
        </div>

        <div className="grid col-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 p-6 border border-white/5 rounded-lg bg-[#0B0B0C]/35">
            <h3 className="text-sm font-black uppercase text-white mb-4 border-b border-white/5 pb-2">
              🛠️ Calculate Loadout Blueprint
            </h3>

            <form onSubmit={handleGenerateLoadout} className="space-y-5 text-xs">
              
              {/* Question 1: Budget */}
              <div className="flex flex-col gap-2">
                <label className="text-[#A0A0A0] uppercase font-bold text-[10px]">What is your initial budget cap?</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { value: 300, label: '$300 (Strict)' },
                    { value: 500, label: '$500 (Moderate)' },
                    { value: 1000, label: '$1000 (HD Digital)' },
                    { value: 1500, label: '$1500+ (Premium)' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBudget(opt.value)}
                      className={`py-2 text-center rounded border transition-all cursor-pointer uppercase ${
                        budget === opt.value
                          ? 'bg-[#FF5C00] border-[#FF5C00] text-white font-bold'
                          : 'bg-black border-[#222] text-[#8D8981] hover:border-white/25 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2: Experience */}
              <div className="flex flex-col gap-2">
                <label className="text-[#A0A0A0] uppercase font-bold text-[10px]">What is your current FPV experience?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { value: 'beginner', label: 'Complete Beginner' },
                    { value: 'simulator', label: 'Some Simulator Hours' },
                    { value: 'returning', label: 'Returning Pilot' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setExperience(opt.value)}
                      className={`py-2 text-center rounded border transition-all cursor-pointer uppercase ${
                        experience === opt.value
                          ? 'bg-[#00F2FF] border-[#00F2FF] text-black font-black'
                          : 'bg-black border-[#222] text-[#8D8981] hover:border-white/25 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 3: Target Mission */}
              <div className="flex flex-col gap-2">
                <label className="text-[#A0A0A0] uppercase font-bold text-[10px]">What is your primary flight mission?</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'whoop', label: '🏠 Indoor Whoop' },
                    { value: 'cinematic', label: '🎬 Cinematic' },
                    { value: 'freestyle', label: '🚀 Freestyle Acro' },
                    { value: 'long-range', label: '🌍 Long Range Explorer' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={budget <= 300 && opt.value !== 'whoop'}
                      onClick={() => setTargetMission(opt.value)}
                      className={`py-2 text-center rounded border transition-all uppercase ${
                        budget <= 300 && opt.value !== 'whoop'
                          ? 'bg-transparent border-[#111] text-[#333] cursor-not-allowed'
                          : targetMission === opt.value
                            ? 'bg-[#00FF66] border-[#00FF66] text-black font-black'
                            : 'bg-black border-[#222] text-[#8D8981] hover:border-white/25 hover:text-white cursor-pointer'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {budget <= 300 && (
                  <span className="text-[9px] text-[#FF5C00] uppercase italic">
                    * At $300 budget, only Indoor Whoop is viable due to digital/carbon costs.
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white font-black uppercase tracking-wider rounded border-b-2 border-[#9E3900] transition-all cursor-pointer mt-2"
              >
                Launch Loadout Matrix
              </button>

            </form>
          </div>

          <div ref={generatorSectionRef} className="lg:col-span-7">
            {showResult ? (
              <div className="p-6 border border-[#00FF66]/20 bg-[#00FF66]/[0.01] rounded-lg flex flex-col gap-5 relative overflow-hidden">
                <div className="absolute top-4 right-4 text-[9px] text-[#00FF66] font-bold tracking-widest uppercase animate-pulse">{"[CALCULATION_SUCCESSFUL]"}</div>
                
                <h3 className="text-sm font-black uppercase text-white border-b border-[#00FF66]/10 pb-2">
                  🛰️ Calculated Pilot Loadout
                </h3>

                {rec.warning && (
                  <div className="p-4 bg-[#FF5C00]/10 border border-[#FF5C00]/20 rounded text-[11px] text-[#DFDFDF] font-mono leading-relaxed uppercase">
                    <strong className="text-[#FF5C00] block mb-1">🚨 System Alert Note:</strong>
                    {rec.warning}
                  </div>
                )}

                <div className="space-y-3.5 text-xs">
                  <div>
                    <span className="text-[#00FF66] uppercase font-bold text-[9px] block">Calculated Airframe:</span>
                    <span className="text-white font-black uppercase">{rec.drone}</span>
                  </div>
                  <div>
                    <span className="text-[#00FF66] uppercase font-bold text-[9px] block">Transmitter Radio:</span>
                    <span className="text-white font-black uppercase">{rec.radio}</span>
                  </div>
                  <div>
                    <span className="text-[#00FF66] uppercase font-bold text-[9px] block">FPV Goggles:</span>
                    <span className="text-white font-black uppercase">{rec.goggles}</span>
                  </div>
                  <div>
                    <span className="text-[#00FF66] uppercase font-bold text-[9px] block">Flight Simulator:</span>
                    <span className="text-white font-black uppercase">{rec.simulator}</span>
                  </div>
                  <div className="pt-3 border-t border-white/5">
                    <span className="text-[#00F2FF] uppercase font-bold text-[9px] block mb-1">Recommended First Step:</span>
                    <p className="text-[11px] text-[#8D8981] leading-relaxed uppercase">{rec.nextStep}</p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2 text-[9px] border-t border-white/5">
                  <a href="/academy/roadmap" className="text-[#00FF66] hover:underline uppercase">{"[GO TO ACADEMY ROADMAP]"}</a>
                  <a href="/academy/glossary" className="text-[#00F2FF] hover:underline uppercase">{"[STUDY TERMINOLOGY]"}</a>
                </div>

              </div>
            ) : (
              <div className="h-full border border-dashed border-[#222] rounded-lg p-12 text-center flex flex-col justify-center items-center gap-4 text-[#555] uppercase text-xs">
                <SparkCwIcon className="w-8 h-8 text-[#555] opacity-50" />
                <span>Waiting for loadout variables...<br/>Select your budget, experience, and target mission.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 8 — DIFFERENTIATION PANEL */}
      <div className="mb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1A1A1E] pb-3 mb-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-white" />
            <h2 className="text-lg font-black uppercase text-white tracking-widest">
              FPV Lovers Outcome Paradigm
            </h2>
          </div>
          <span className="text-xs text-[#8D8981] uppercase tracking-wide">
            How we eliminate purchase confusion and building frustration
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2 font-mono text-xs">
          <div className="p-6 border border-[#FF5C00]/15 bg-[#FF5C00]/[0.01] rounded">
            <h4 className="text-sm font-black uppercase text-[#FF5C00] mb-4 border-b border-[#FF5C00]/10 pb-2">
              Typical Product-First Sites
            </h4>
            <div className="space-y-4 text-[#8D8981] leading-relaxed uppercase">
              <p className="flex gap-2">
                <span className="text-[#FF5C00] font-black font-mono">1.</span> Browse confusing list of 50 different micro/mini action drones.
              </p>
              <p className="flex gap-2">
                <span className="text-[#FF5C00] font-black font-mono">2.</span> Guess which receiver battery/charger/radio system is compatible.
              </p>
              <p className="flex gap-2">
                <span className="text-[#FF5C00] font-black font-mono">3.</span> Buy random box, plug in, crash immediately on day one, and burn ESCs.
              </p>
              <p className="flex gap-2">
                <span className="text-[#FF5C00] font-black font-mono">4.</span> End up with a pile of broken carbon and lost motivation.
              </p>
            </div>
          </div>

          <div className="p-6 border border-[#00FF66]/15 bg-[#00FF66]/[0.01] rounded">
            <h4 className="text-sm font-black uppercase text-[#00FF66] mb-4 border-b border-[#00FF66]/10 pb-2">
              The FPV Lovers Pilot Path
            </h4>
            <div className="space-y-4 text-[#8D8981] leading-relaxed uppercase">
              <p className="flex gap-2">
                <span className="text-[#00FF66] font-black font-mono">1.</span> Select your target FPV flight mission profile and pilot identity.
              </p>
              <p className="flex gap-2">
                <span className="text-[#00FF66] font-black font-mono">2.</span> Acquire a robust EdgeTX/ELRS radio and configure a free flight simulator.
              </p>
              <p className="flex gap-2">
                <span className="text-[#00FF66] font-black font-mono">3.</span> Build muscle reflexes and log 10 safe pilot hovering hours.
              </p>
              <p className="flex gap-2">
                <span className="text-[#00FF66] font-black font-mono">4.</span> Qualify through standard Academy lessons and unlock customized gear sets.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// Small helper custom icon for empty states
function SparkCwIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 3v1" />
      <path d="M12 20v1" />
      <path d="M3 12h1" />
      <path d="M20 12h1" />
      <path d="m18.364 5.636-.707.707" />
      <path d="m6.343 17.657-.707.707" />
      <path d="m5.636 5.636.707.707" />
      <path d="m17.657 17.657.707.707" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}
