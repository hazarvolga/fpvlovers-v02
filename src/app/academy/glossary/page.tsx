"use client";

import React, { useState, useEffect, useRef } from 'react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { DroneAnatomyMap } from '@/features/academy/components/DroneAnatomyMap';
import { 
  Search, BookOpen, Layers, Compass, Wrench, FileText, 
  HelpCircle, Sparkles, X, Radio, Battery, 
  Settings, Award, RefreshCw, Cpu, Video, CheckCircle2, ChevronRight
} from 'lucide-react';
import { GlossaryTerm } from '@/lib/server/glossary';

export default function GlossaryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeDifficulty, setActiveDifficulty] = useState('all');
  const [activeLetter, setActiveLetter] = useState('all');
  
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);
  
  // RAG Details state
  const [ragData, setRagData] = useState<any>(null);
  const [ragLoading, setRagLoading] = useState(false);
  const [telemetryConnected, setTelemetryConnected] = useState(false);

  // Accordion state for Acronym Center and Build DNA
  const [expandedAcronym, setExpandedAcronym] = useState<string | null>(null);
  const [selectedBuildDna, setSelectedBuildDna] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const breadcrumbs = [
    { label: 'Pilot Academy', href: '/academy' },
    { label: 'FPV Glossary', isCurrentPage: true }
  ];

  // Search shortcuts
  const popularKeywords = ['ELRS', 'LiPo', 'PID', 'RSSI', 'LQ', 'GPS Rescue', 'Propwash'];

  // Start Here Onboarding Core terms (15 P0 Terms)
  const startHereSlugs = [
    'fpv', 'acro-mode', 'elrs', 'lipo', 'flight-controller', 
    'esc', 'motor-kv', 'vtx', 'rssi', 'lq', 
    'pid', 'blackbox', 'betaflight', 'gps-rescue', 'propwash'
  ];

  // Subsystem concept clusters
  const systemCategories = [
    {
      title: 'Radio Control System',
      description: 'The wireless telemetry link connecting pilot stick inputs to the aircraft.',
      terms: ['elrs', 'rssi', 'failsafe', 'lq'],
      icon: Radio,
      color: '#00FF66',
      bgClass: 'bg-[#00FF66]/5 border-[#00FF66]/10 hover:border-[#00FF66]/30'
    },
    {
      title: 'Power System',
      description: 'Voltage storage, battery cell chemistry, and power sag management.',
      terms: ['lipo', 'motor-kv', 'esc'],
      icon: Battery,
      color: '#FF5C00',
      bgClass: 'bg-[#FF5C00]/5 border-[#FF5C00]/10 hover:border-[#FF5C00]/30'
    },
    {
      title: 'Flight Control System',
      description: 'The computational brain, gyro sensors, and stabilization loops.',
      terms: ['flight-controller', 'gyro', 'pid', 'blackbox', 'betaflight'],
      icon: Cpu,
      color: '#00F2FF',
      bgClass: 'bg-[#00F2FF]/5 border-[#00F2FF]/10 hover:border-[#00F2FF]/30'
    },
    {
      title: 'Video System',
      description: 'Live HD and analog video transmission links and latency envelopes.',
      terms: ['vtx', 'analog'],
      icon: Video,
      color: '#00F2FF',
      bgClass: 'bg-[#00F2FF]/5 border-[#00F2FF]/10 hover:border-[#00F2FF]/30'
    },
    {
      title: 'Navigation System',
      description: 'Global coordinate receivers and failsafe return-to-home algorithms.',
      terms: ['gps-rescue'],
      icon: Compass,
      color: '#00FF66',
      bgClass: 'bg-[#00FF66]/5 border-[#00FF66]/10 hover:border-[#00FF66]/30'
    },
    {
      title: 'Troubleshooting Index',
      description: 'Active flight failure diagnosis and recovery concepts.',
      terms: ['desync', 'failsafe'],
      icon: Wrench,
      color: '#FF5C00',
      bgClass: 'bg-[#FF5C00]/5 border-[#FF5C00]/10 hover:border-[#FF5C00]/30'
    }
  ];

  // Build DNA profiles (Section 6)
  const buildDnaProfiles = [
    {
      id: 'sub250',
      title: 'Sub-250g Micro (Toothpick / Whoops)',
      description: 'Micro class multirotors optimized to operate below international regulatory registry weight limits.',
      useCase: 'Low-risk park flying, indoor racing, and high-frequency residential practicing.',
      advantages: 'Zero regulatory registration required, extremely quiet, high crash resilience due to low mass.',
      disadvantages: 'Highly susceptible to high wind drift, struggles carrying standalone HD action cameras.',
      linkText: 'Learn Whoop Builds',
      linkHref: '/archive/whoops'
    },
    {
      id: 'cinewhoop',
      title: 'Cinewhoop (3.0" - 3.5")',
      description: 'Safeguarded ducted frames designed for smooth, high-fidelity proximity capturing.',
      useCase: 'Real estate walk-throughs, indoor cinematic fly-throughs, and active target tracking.',
      advantages: 'Enclosed prop ducts protect people and walls; highly stable hover aerodynamics.',
      disadvantages: 'High weight-to-thrust ratio, reduced flight times (3-4 minutes), sluggish rates.',
      linkText: 'Explore Cine Guides',
      linkHref: '/archive/freestyle'
    },
    {
      id: 'freestyle',
      title: 'Acromania 5-Inch',
      description: 'The golden balance of durability, thrust-to-weight, and acrobatic versatility.',
      useCase: 'Acrobatic freestyle, deep bando exploration, power-looping, and professional filming.',
      advantages: 'Extreme power envelope, endless component compatibility, highly repairable frame layout.',
      disadvantages: 'Loud acoustic profile, dangerous kinetic mass in crashes, advanced soldering required.',
      linkText: 'Analyze 5" Specs',
      linkHref: '/archive/freestyle'
    },
    {
      id: 'long-range',
      title: '7-Inch / Deadcat Explorer',
      description: 'Wide wheelbase platforms geared for long-distance cruise efficiency and high altitude flight.',
      useCase: 'Mountain peak surfing, alpine exploration, and deep valley cinematic penetration.',
      advantages: 'Highly efficient cruising motors, carries high-capacity Li-Ion packs, stable wind cutting.',
      disadvantages: 'Extremely high kinetic hazard, slower roll rates, demands absolute failsafe reliability.',
      linkText: 'Review Cruisers',
      linkHref: '/archive/long-range'
    }
  ];

  // Troubleshooting Directory (Section 7)
  const troubleshootingIndex = [
    {
      symptom: 'My motors are extremely hot after short flights',
      cause: 'Heavy frame vibrations, loose arm screws, or over-tuned D-term gains in the PID control loops.',
      solution: 'Check frame tightness, tighten motor screws, lower your D-term multiplier, or turn on Betaflight RPM filtering.',
      linkedSlug: 'pid',
      tag: 'PID / Mechanical Noise'
    },
    {
      symptom: 'My video feed keeps getting lines and static',
      cause: 'Antenna polarization mismatch, loose coaxial U.FL connection, or flying behind thick concrete walls.',
      solution: 'Verify VTX antenna match (LHCP/RHCP), check U.FL lock, increase VTX power setting (mW), or switch channels.',
      linkedSlug: 'vtx',
      tag: 'VTX / RF Penetration'
    },
    {
      symptom: 'My quad randomly rolls upside down and falls (Desync)',
      cause: 'ESC losing sensorless tracking alignment with motor stators during sudden throttle spikes.',
      solution: 'Raise ESC startup power to 0.50, raise motor timing to 22-25 degrees, or verify motor windings for copper burns.',
      linkedSlug: 'desync',
      tag: 'ESC / Motor Desync'
    },
    {
      symptom: 'My transmitter outputs "Telemetry Critical" warning alerts',
      cause: 'Low transmitter power, bad receiver antenna placement, or excessive physical blocking between sticks and drone.',
      solution: 'Upgrade to ExpressLRS 500Hz, check receiver antenna placement, or increase transmit packet power (mW).',
      linkedSlug: 'rssi',
      tag: 'LQ & RSSI Loss'
    },
    {
      symptom: 'My GPS Rescue cannot arm / does not lock satellites',
      cause: 'GPS module mounted too close to high-noise digital video transmitters or action camera hardware.',
      solution: 'Isolate the GPS module far back on the tail plate, shield wiring with copper tape, and wait for 8+ satellites.',
      linkedSlug: 'gps-rescue',
      tag: 'GPS / EMI Interference'
    },
    {
      symptom: 'My battery sag drops voltage rapidly on punchouts',
      cause: 'High internal cell resistance due to aging batteries, cold conditions, or excessive current draw.',
      solution: 'Pre-warm batteries in cold weather, retirement of high-resistance packs, or fly high-C rated packs.',
      linkedSlug: 'lipo',
      tag: 'LiPo / Internal Resistance'
    }
  ];

  // Acronym decoders (Section 8)
  const acronyms = [
    { name: 'ELRS', full: 'ExpressLRS', dec: 'Open-source, ultra-fast radio link with LoRa packet speeds.' },
    { name: 'ESC', full: 'Electronic Speed Controller', dec: 'Converts battery voltage to timed phase currents to drive brushless motors.' },
    { name: 'FC', full: 'Flight Controller', dec: 'The central computational stabilizer brain running flight firmware like Betaflight.' },
    { name: 'GPS', full: 'Global Positioning System', dec: 'Satellite telemetry receiver that coordinates autonomous rescue return-to-home.' },
    { name: 'LQ', full: 'Link Quality', dec: 'Percentage of control packets safely received. The ultimate safety indicator.' },
    { name: 'OSD', full: 'On-Screen Display', dec: 'Overlays real-time battery voltage, flight mode, and link status onto pilot goggles.' },
    { name: 'PID', full: 'Proportional Integral Derivative', dec: 'Algorithm balancing stick inputs and real gyro forces to stabilize flight.' },
    { name: 'RPM', full: 'Revolutions Per Minute', dec: 'Motor rotational speed used for configuring active dynamic filter stages.' },
    { name: 'RSSI', full: 'Received Signal Strength Indicator', dec: 'Logarithmic measurement of incoming radio wave loudness.' },
    { name: 'UART', full: 'Universal Asynchronous Receiver-Transmitter', dec: 'Serial ports on the FC to route external GPS, receivers, or video units.' },
    { name: 'VTX', full: 'Video Transmitter', dec: 'Onboard transmitter broadcasting camera frames over 5.8GHz channels.' },
    { name: 'LiPo', full: 'Lithium Polymer Battery', dec: 'High-density, rapid-discharge energy packs fueling performance flight.' }
  ];

  // Load and search FPV terms client-side
  useEffect(() => {
    let isActive = true;
    const fetchTimer = setTimeout(() => {
      if (isActive) setLoading(true);
    }, 0);

    const fetchTerms = async () => {
      try {
        const params = new URLSearchParams({
          q: searchTerm,
          category: activeCategory,
          difficulty: activeDifficulty
        });

        const res = await fetch(`/api/academy/glossary?${params.toString()}`);
        if (!res.ok) throw new Error('API down');
        const data = await res.json();
        
        if (isActive) {
          setTerms(data.terms || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching glossary data:', err);
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchTerms();

    return () => {
      isActive = false;
      clearTimeout(fetchTimer);
    };
  }, [searchTerm, activeCategory, activeDifficulty]);

  // Handle keyword shortcuts
  const handleKeywordShortcut = (kw: string) => {
    setSearchTerm(kw);
    if (searchInputRef.current) {
      searchInputRef.current.value = kw;
    }
  };

  // Target specific category from Anatomy map
  const handleCategoryIsolation = (category: string, searchVal?: string) => {
    setActiveCategory(category);
    setActiveLetter('all');
    if (searchVal) {
      setSearchTerm(searchVal);
      if (searchInputRef.current) searchInputRef.current.value = searchVal;
    } else {
      setSearchTerm('');
      if (searchInputRef.current) searchInputRef.current.value = '';
    }
  };

  // Open specific term detail drawer
  const handleOpenDossier = (term: GlossaryTerm) => {
    setSelectedTerm(term);
    setRagData(null);
    setTelemetryConnected(false);
  };

  // Connect live RAG Telemetry Link
  const handleFetchRAGTelemetry = async (term: GlossaryTerm) => {
    setRagLoading(true);
    setTelemetryConnected(false);
    try {
      const res = await fetch(`/api/academy/glossary?enrich=${term.slug}`);
      if (!res.ok) throw new Error('RAG API failed');
      const data = await res.json();
      setRagData(data.ragTelemetry || null);
      setTelemetryConnected(true);
    } catch (err) {
      console.error('Telemetry linking failure:', err);
    } finally {
      setRagLoading(false);
    }
  };

  // Generate A-Z index array
  const alphabetLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Filter A-Z terms
  const startHereTerms = terms.filter(t => startHereSlugs.includes(t.slug));
  const filteredAlphabetTerms = terms.filter((item) => {
    if (activeLetter === 'all') return true;
    return item.term.toUpperCase().startsWith(activeLetter);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 font-mono text-[#EBE7DF]">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      {/* SECTION 1: SEARCH FIRST (Primary Entry Point) */}
      <div className="relative p-8 md:p-12 border border-white/5 rounded-lg bg-gradient-to-b from-[#0B0B0C] to-black shadow-2xl mb-12 overflow-hidden">
        {/* Sleek tactical cockpit accent */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#FF5C00]/10 via-[#00F2FF] to-[#00FF66]/10" />
        <div className="absolute top-4 right-4 text-[9px] text-[#666] tracking-widest uppercase">{"[SYS_CONSOLE_VER_4.5]"}</div>
        
        <BookOpen className="w-10 h-10 text-[#FF5C00] mb-6 opacity-90" />
        
        <h1 className="text-3xl md:text-5xl font-black uppercase text-white tracking-tighter mb-3">
          FPV <span className="text-[#00F2FF]">Terminology Operating System</span>
        </h1>
        <p className="text-xs uppercase text-[#8D8981] tracking-widest max-w-2xl leading-relaxed mb-8">
          {"// DECODE ACRONYMS, HARDWARE SYSTEMS, AND FLIGHT PROBLEMS INSTANTLY"}
        </p>

        {/* Tactical Search Box */}
        <div className="relative max-w-3xl">
          <Search className="absolute left-4 top-4.5 w-4 h-4 text-[#555]" />
          <input
            ref={searchInputRef}
            type="text"
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search FPV terminology... (e.g. ELRS, LiPo, PID, desync)"
            className="w-full pl-11 pr-4 py-4 bg-black border border-[#222] rounded-md text-white font-mono text-xs uppercase tracking-wider focus:outline-none focus:border-[#00F2FF] focus:ring-1 focus:ring-[#00F2FF] transition-all placeholder-[#444] shadow-2xl"
          />
        </div>

        {/* Suggestion Shortcuts */}
        <div className="flex flex-wrap gap-2 items-center mt-4 text-[10px]">
          <span className="text-[#555] uppercase">Quick Search:</span>
          {popularKeywords.map((kw) => (
            <button
              key={kw}
              onClick={() => handleKeywordShortcut(kw)}
              className="px-2.5 py-1 bg-white/[0.03] border border-[#222] text-[#A0A0A0] hover:text-[#00F2FF] hover:border-[#00F2FF]/30 rounded transition-all cursor-pointer uppercase"
            >
              {kw}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 2: START HERE SECTION (Beginner Onboarding Core) */}
      <div className="mb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1A1A1E] pb-3 mb-6">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#00FF66]" />
            <h2 className="text-lg font-black uppercase text-white tracking-widest">
              Start Here
            </h2>
          </div>
          <span className="text-xs text-[#8D8981] uppercase tracking-wide">
            The 15 most important FPV concepts every pilot should understand
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {startHereTerms.slice(0, 15).map((item) => (
            <div
              key={item.slug}
              onClick={() => handleOpenDossier(item)}
              className="bg-[#050907]/30 p-5 border border-[#0F1C14] hover:border-[#00FF66]/40 rounded group transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-widest text-[#555]">
                  <span className="text-[#00FF66] font-bold">CORE CONCEPT</span>
                  <span className="px-1.5 py-0.5 rounded border border-[#00FF66]/20 bg-[#00FF66]/5 text-[#00FF66]">
                    Phase {item.relatedAcademyModules[0] ? item.relatedAcademyModules[0].slice(-1) : '1'}
                  </span>
                </div>
                <h4 className="text-sm font-black uppercase text-white group-hover:text-[#00FF66] transition-colors">
                  {item.term}
                </h4>
                <p className="text-xs text-[#8D8981] leading-relaxed line-clamp-2">
                  {item.plainLanguageExplanation}
                </p>
              </div>
              <div className="flex justify-between items-center text-[9px] font-mono uppercase text-[#00FF66] border-t border-[#0F1C14] pt-2.5 mt-3 group-hover:underline">
                <span>{item.difficulty}</span>
                <span>{"[STUDY DOSSIER]"}</span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="col-span-full py-10 text-center text-xs text-[#555] animate-pulse">
              SYNCING ONBOARDING NODES...
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: LEARN BY SYSTEM */}
      <div className="mb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1A1A1E] pb-3 mb-6">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#00F2FF]" />
            <h2 className="text-lg font-black uppercase text-white tracking-widest">
              Learn By System
            </h2>
          </div>
          <span className="text-xs text-[#8D8981] uppercase tracking-wide">
            Structure your vocabulary by physical hardware layers
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {systemCategories.map((sys, idx) => {
            const Icon = sys.icon;
            return (
              <div key={idx} className={`border rounded p-6 flex flex-col justify-between gap-5 transition-all duration-300 ${sys.bgClass}`}>
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/[0.02] border border-white/5 rounded text-white" style={{ color: sys.color }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-black uppercase text-white tracking-tight">{sys.title}</h3>
                  </div>
                  <p className="text-xs text-[#8D8981] leading-relaxed">{sys.description}</p>
                </div>

                <div className="flex flex-col gap-1.5 pt-3 border-t border-white/[0.03]">
                  <span className="text-[9px] text-[#555] uppercase tracking-wider mb-1">Concept Index:</span>
                  <div className="flex flex-wrap gap-1">
                    {sys.terms.map((tSlug) => (
                      <button
                        key={tSlug}
                        onClick={() => {
                          const matched = terms.find(t => t.slug === tSlug);
                          if (matched) handleOpenDossier(matched);
                        }}
                        className="text-[10px] bg-[#0A0A0C] hover:bg-white/[0.06] text-[#A0A0A0] hover:text-white border border-[#222] px-2 py-0.5 rounded transition-all font-mono uppercase cursor-pointer"
                      >
                        {tSlug.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: TERM EXPLORER (Alphabetical A-Z Catalog Index) */}
      <div className="mb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1A1A1E] pb-3 mb-6">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-white" />
            <h2 className="text-lg font-black uppercase text-white tracking-widest">
              Term Explorer
            </h2>
          </div>
          <span className="text-xs text-[#8D8981] uppercase tracking-wide">
            Complete high-fidelity pilot glossary alphabet index
          </span>
        </div>

        {/* A-Z Filtering buttons */}
        <div className="flex flex-wrap gap-1 mb-6 border-b border-[#1A1A1E] pb-4">
          <button
            onClick={() => setActiveLetter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded uppercase tracking-wider transition-all cursor-pointer ${
              activeLetter === 'all'
                ? 'bg-[#FF5C00] text-white'
                : 'bg-white/[0.02] border border-[#222] text-[#8D8981] hover:text-white'
            }`}
          >
            All
          </button>
          {alphabetLetters.map((l) => {
            const hasTerms = terms.some(t => t.term.toUpperCase().startsWith(l));
            return (
              <button
                key={l}
                disabled={!hasTerms}
                onClick={() => setActiveLetter(l)}
                className={`w-8 py-1.5 text-xs font-bold rounded transition-all ${
                  activeLetter === l
                    ? 'bg-[#00F2FF] text-black font-black'
                    : hasTerms
                      ? 'bg-white/[0.02] border border-[#222] text-[#EBE7DF] hover:text-white cursor-pointer'
                      : 'bg-transparent text-[#333] border border-transparent cursor-not-allowed'
                }`}
              >
                {l}
              </button>
            );
          })}
        </div>

        {/* Matching Explorer List */}
        <div className="grid gap-3">
          {filteredAlphabetTerms.length > 0 ? (
            filteredAlphabetTerms.map((term) => (
              <div
                key={term.slug}
                onClick={() => handleOpenDossier(term)}
                className="group flex flex-col md:flex-row md:items-center justify-between p-4 border border-[#1A1A1E] bg-[#0A0B0C]/45 hover:bg-black/60 hover:border-white/10 rounded transition-all duration-200 cursor-pointer gap-2"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 flex-1">
                  <div className="w-6 h-6 shrink-0 flex items-center justify-center bg-white/[0.02] border border-white/5 text-[10px] text-[#A0A0A0] font-bold uppercase rounded">
                    {term.term.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-white uppercase group-hover:text-[#00F2FF] transition-colors">
                      {term.term}
                    </h4>
                    <p className="text-xs text-[#8D8981] line-clamp-1 mt-0.5 leading-relaxed">
                      {term.plainLanguageExplanation}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                  <span className="text-[9px] px-2 py-0.5 rounded border border-[#222] text-[#666] uppercase">
                    {term.category}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#444] group-hover:text-white transition-all transform group-hover:translate-x-0.5" />
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 border border-dashed border-[#222] text-center text-xs text-[#555] uppercase rounded">
              No matching terminology index files found.
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5: DRONE ANATOMY EXPLORER */}
      <div className="mb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1A1A1E] pb-3 mb-6">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#FF5C00]" />
            <h2 className="text-lg font-black uppercase text-white tracking-widest">
              Drone Anatomy Explorer
            </h2>
          </div>
          <span className="text-xs text-[#8D8981] uppercase tracking-wide">
            Interactive textbook layout: click hotspots to isolate hardware terms
          </span>
        </div>
        <DroneAnatomyMap activeCategory={activeCategory} onSelectCategory={handleCategoryIsolation} />
      </div>

      {/* SECTION 6: BUILD DNA KNOWLEDGE LAYER */}
      <div className="mb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1A1A1E] pb-3 mb-6">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#00F2FF]" />
            <h2 className="text-lg font-black uppercase text-white tracking-widest">
              Build DNA Specifications
            </h2>
          </div>
          <span className="text-xs text-[#8D8981] uppercase tracking-wide">
            Browse drone configuration profiles and performance characteristics
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {buildDnaProfiles.map((profile) => (
            <div
              key={profile.id}
              onClick={() => setSelectedBuildDna(selectedBuildDna === profile.id ? null : profile.id)}
              className={`p-5 rounded border transition-all duration-300 cursor-pointer flex flex-col gap-3 ${
                selectedBuildDna === profile.id
                  ? 'bg-[#060A10]/75 border-[#00F2FF]/50 shadow-[inset_0_0_20px_rgba(0,242,255,0.05)]'
                  : 'bg-black/45 border-[#1D1D22] hover:border-white/10'
              }`}
            >
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-black uppercase text-white tracking-tight">{profile.title}</h4>
                <span className="text-[10px] text-[#00F2FF] uppercase font-bold">
                  {selectedBuildDna === profile.id ? '[COLLAPSE]' : '[DETAILS]'}
                </span>
              </div>
              <p className="text-xs text-[#8D8981] leading-relaxed">{profile.description}</p>
              
              {selectedBuildDna === profile.id && (
                <div className="flex flex-col gap-3 pt-3 border-t border-white/[0.04] text-[11px] text-[#A0A0A0] leading-relaxed">
                  <div>
                    <span className="text-[#00F2FF] uppercase font-bold text-[9px] block">Operational Use Cases:</span>
                    {profile.useCase}
                  </div>
                  <div>
                    <span className="text-[#00FF66] uppercase font-bold text-[9px] block">Advantages:</span>
                    {profile.advantages}
                  </div>
                  <div>
                    <span className="text-[#FF5C00] uppercase font-bold text-[9px] block">Disadvantages:</span>
                    {profile.disadvantages}
                  </div>
                  <div className="flex justify-end pt-2 text-[9px] border-t border-white/5 mt-1">
                    <a href={profile.linkHref} className="flex items-center gap-1 text-[#00F2FF] hover:underline uppercase">
                      {"-> "}{profile.linkText}
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 7: TROUBLESHOOTING INDEX (Problem-First Catalog) */}
      <div className="mb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1A1A1E] pb-3 mb-6">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#FF5C00]" />
            <h2 className="text-lg font-black uppercase text-white tracking-widest">
              Troubleshooting Symptom Index
            </h2>
          </div>
          <span className="text-xs text-[#8D8981] uppercase tracking-wide">
            Problem-first directory: connect active flight problems to technical terms
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {troubleshootingIndex.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                const matched = terms.find(t => t.slug === item.linkedSlug);
                if (matched) handleOpenDossier(matched);
              }}
              className="p-5 border border-[#1A1A1E] bg-[#0A0503]/20 hover:bg-black/60 hover:border-[#FF5C00]/30 rounded group transition-all duration-300 cursor-pointer flex flex-col gap-3"
            >
              <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-[#FF5C00]">
                <span className="font-bold">Flight Fault Report</span>
                <span>{item.tag}</span>
              </div>
              <h4 className="text-sm font-black uppercase text-white tracking-tight group-hover:text-[#FF5C00] transition-colors leading-snug">
                &quot;{item.symptom}&quot;
              </h4>
              <div className="flex flex-col gap-2 pt-2.5 border-t border-white/[0.03] text-[11px] text-[#8D8981] leading-relaxed">
                <div>
                  <span className="text-[#FF5C00] uppercase font-bold text-[9px] block">Likely Cause:</span>
                  {item.cause}
                </div>
                <div>
                  <span className="text-[#00FF66] uppercase font-bold text-[9px] block">Corrective Action:</span>
                  {item.solution}
                </div>
              </div>
              <div className="text-[8px] uppercase text-[#FF5C00] font-bold text-right pt-1 group-hover:underline">
                {"[ISOLATE FAULT TERMINOLOGY]"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 8: FPV ACRONYM CENTER */}
      <div className="mb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1A1A1E] pb-3 mb-6">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-white" />
            <h2 className="text-lg font-black uppercase text-white tracking-widest">
              FPV Acronym Database
            </h2>
          </div>
          <span className="text-xs text-[#8D8981] uppercase tracking-wide">
            Abbreviation matrix for fast decoding and lookups
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {acronyms.map((ac) => (
            <div
              key={ac.name}
              onClick={() => setExpandedAcronym(expandedAcronym === ac.name ? null : ac.name)}
              className={`p-4 border rounded cursor-pointer transition-all duration-200 text-xs ${
                expandedAcronym === ac.name
                  ? 'bg-white/[0.03] border-white/20'
                  : 'bg-black/45 border-[#1A1A1E] hover:border-white/10'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-black uppercase text-[#00F2FF] text-sm block tracking-wide">{ac.name}</span>
                  <span className="text-[10px] text-[#666] uppercase block mt-0.5">{ac.full}</span>
                </div>
                <span className="text-[8px] text-[#444] font-bold">
                  {expandedAcronym === ac.name ? '[CLOSE]' : '[DECODE]'}
                </span>
              </div>
              {expandedAcronym === ac.name && (
                <p className="text-[11px] text-[#8D8981] mt-3 pt-3 border-t border-white/[0.04] leading-relaxed">
                  {ac.dec}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 9: ADVANCED RELATIONSHIP EXPLORER */}
      <div className="border-t border-[#1A1A1E] pt-12">
        <div className="flex items-center gap-2 border-b border-[#1A1A1E] pb-3 mb-6">
          <Radio className="w-5 h-5 text-[#FF5C00]" />
          <h2 className="text-lg font-black uppercase text-white tracking-widest">
            Advanced Relationship Explorer
          </h2>
        </div>

        <div className="p-8 border border-[#FF5C00]/15 bg-[#FF5C00]/[0.01] rounded text-center text-xs flex flex-col items-center gap-4 justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c0c0e_1px,transparent_1px),linear-gradient(to_bottom,#0c0c0e_1px,transparent_1px)] bg-[size:30px_30px] opacity-10 pointer-events-none" />
          <p className="max-w-xl text-[#777] leading-relaxed uppercase">
            The multi-dataset RAG crawler maps implicit logical node links between modules, blueprints, and flight logs. Ready for advanced conceptual telemetry mapping.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setActiveCategory('all');
                setActiveLetter('all');
                setSearchTerm('');
                if (searchInputRef.current) searchInputRef.current.value = '';
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2 border border-[#FF5C00]/40 text-[#FF5C00] hover:bg-[#FF5C00]/10 text-[10px] font-black uppercase tracking-wider rounded transition-all cursor-pointer"
            >
              {"[RESET ALL FILTERS]"}
            </button>
          </div>
        </div>
      </div>

      {/* DETAILED DOSSIER SIDE-DRAWER */}
      {selectedTerm && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          {/* Overlay backdrop */}
          <div 
            onClick={() => setSelectedTerm(null)}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm transition-opacity duration-300"
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-black border-l border-[#1A1A1D] flex flex-col justify-between shadow-2xl relative">
              
              {/* Close Button */}
              <button 
                onClick={() => setSelectedTerm(null)}
                className="absolute right-4 top-4 text-[#888] hover:text-[#FF5C00] transition-colors p-2 rounded border border-[#1A1A1E] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Dossier Body */}
              <div className="flex-1 overflow-y-auto p-8 pt-12 flex flex-col gap-6 font-mono">
                
                {/* Categorization & Level */}
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-[#555] uppercase">System:</span>
                  <span className="text-[#00F2FF] font-bold uppercase">{selectedTerm.category}</span>
                  <span className="text-[#333]">|</span>
                  <span className="text-[#555] uppercase">Level:</span>
                  <span className={`px-2 py-0.5 rounded border ${
                    selectedTerm.difficulty === 'Beginner' ? 'text-[#00FF66] border-[#00FF66]/20 bg-[#00FF66]/5' :
                    selectedTerm.difficulty === 'Intermediate' ? 'text-[#00F2FF] border-[#00F2FF]/20 bg-[#00F2FF]/5' :
                    'text-[#FF5C00] border-[#FF5C00]/20 bg-[#FF5C00]/5'
                  }`}>
                    {selectedTerm.difficulty}
                  </span>
                </div>

                {/* Title */}
                <div>
                  <h2 className="text-3xl font-black uppercase text-white tracking-tighter mb-2">
                    {selectedTerm.term}
                  </h2>
                  <div className="w-16 h-1 bg-[#00F2FF]" />
                </div>

                {/* Plain English Explanation */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-black uppercase text-[#00F2FF] tracking-widest">
                    Plain English Explanation
                  </h3>
                  <p className="text-xs text-[#DFDFDF] leading-relaxed bg-[#050507] border border-[#141416] p-5 rounded">
                    {selectedTerm.plainLanguageExplanation}
                  </p>
                </div>

                {/* Why It Matters */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-black uppercase text-[#00FF66] tracking-widest">
                    Why It Matters
                  </h3>
                  <div className="bg-[#050A08] border border-[#0D2419] p-5 rounded text-xs text-[#00FF66] leading-relaxed uppercase">
                    {selectedTerm.whyItMatters}
                  </div>
                </div>

                {/* Technical Definition */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-black uppercase text-[#555] tracking-widest">
                    Technical Definition
                  </h3>
                  <div className="bg-[#0A0A0C] border border-[#1F1F24] p-4 rounded text-[11px] text-[#8D8981] leading-relaxed">
                    {selectedTerm.definition}
                  </div>
                </div>

                {/* Dynamic Dify RAG Telemetry Link */}
                <div className="border border-[#1A1A1F] bg-black/60 p-6 rounded flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#00F2FF]" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-white">Live Dify RAG Telemetry Feed</h4>
                    </div>
                    {telemetryConnected && (
                      <span className="text-[9px] text-[#00FF66] font-bold">CONNECTED</span>
                    )}
                  </div>

                  {!telemetryConnected && !ragLoading && (
                    <button
                      onClick={() => handleFetchRAGTelemetry(selectedTerm)}
                      className="w-full bg-[#050A0D] border border-[#00F2FF]/40 text-[#00F2FF] hover:bg-[#00F2FF]/5 py-2.5 rounded text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      CONNECT LIVE TELEMETRY LINK
                    </button>
                  )}

                  {ragLoading && (
                    <div className="py-4 text-center text-xs text-[#555] flex flex-col items-center gap-2 justify-center">
                      <RefreshCw className="w-5 h-5 animate-spin text-[#00F2FF]" />
                      SECURELY SQUASHING TELEMETRY PACKETS FROM DIFY ARCHIVE...
                    </div>
                  )}

                  {telemetryConnected && ragData && (
                    <div className="flex flex-col gap-3 text-[11px]">
                      <div className="flex justify-between items-center border-b border-[#222] pb-2 text-[10px]">
                        <span className="text-[#555] uppercase">Telemetry Link Quality</span>
                        <span className={`px-2 py-0.5 rounded border uppercase text-[9px] ${
                          ragData.grade === 'high' ? 'text-[#00FF66] border-[#00FF66]/20 bg-[#00FF66]/5' :
                          ragData.grade === 'medium' ? 'text-[#00F2FF] border-[#00F2FF]/20 bg-[#00F2FF]/5' :
                          'text-[#FF5C00] border-[#FF5C00]/20 bg-[#FF5C00]/5'
                        }`}>
                          {ragData.grade} ({Math.round(ragData.confidence * 100)}%)
                        </span>
                      </div>
                      
                      {ragData.insights && ragData.insights.length > 0 ? (
                        <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-1">
                          {ragData.insights.map((ins: any, idx: number) => (
                            <div key={idx} className="bg-black/80 border border-[#222] p-3 rounded text-[11px] leading-relaxed text-[#8D8981]">
                              <div className="text-[9px] text-[#444] uppercase mb-1">
                                SOURCE: {ins.source} | RAG_SCORE: {ins.score.toFixed(3)}
                              </div>
                              {ins.content.slice(0, 300)}...
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[#555] italic">
                          No supplemental flight logs located in database collection.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Relational Ecosystem Map */}
                <div className="flex flex-col gap-4 border-t border-[#1E1E22] pt-6 text-xs">
                  <h3 className="text-xs font-black uppercase text-[#555] tracking-widest mb-2">
                    Ecosystem Connection Node Map
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Academy Modules */}
                    {selectedTerm.relatedAcademyModules && selectedTerm.relatedAcademyModules.length > 0 && (
                      <div className="border border-[#1A1A1E] p-3 rounded bg-black/40 flex flex-col gap-1.5">
                        <span className="text-[9px] text-[#555] uppercase flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-[#00F2FF]" />
                          Linked Academy Modules
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {selectedTerm.relatedAcademyModules.map((mod) => (
                            <span key={mod} className="text-[10px] bg-black text-[#A0A0A0] border border-[#222] px-2 py-0.5 rounded uppercase">
                              {mod.replace('-', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mission Profiles */}
                    {selectedTerm.relatedMissionProfiles && selectedTerm.relatedMissionProfiles.length > 0 && (
                      <div className="border border-[#1A1A1E] p-3 rounded bg-black/40 flex flex-col gap-1.5">
                        <span className="text-[9px] text-[#555] uppercase flex items-center gap-1">
                          <Compass className="w-3.5 h-3.5 text-[#00FF66]" />
                          Mission Profiles
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {selectedTerm.relatedMissionProfiles.map((mis) => (
                            <span key={mis} className="text-[10px] bg-black text-[#A0A0A0] border border-[#222] px-2 py-0.5 rounded uppercase">
                              {mis}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Build DNA Components */}
                    {selectedTerm.relatedBuildDNA && selectedTerm.relatedBuildDNA.length > 0 && (
                      <div className="border border-[#1A1A1E] p-3 rounded bg-black/40 flex flex-col gap-1.5">
                        <span className="text-[9px] text-[#555] uppercase flex items-center gap-1">
                          <Wrench className="w-3.5 h-3.5 text-[#FF5C00]" />
                          Build DNA Components
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {selectedTerm.relatedBuildDNA.map((b) => (
                            <span key={b} className="text-[10px] bg-black text-[#A0A0A0] border border-[#222] px-2 py-0.5 rounded uppercase">
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Troubleshooting sheets */}
                    {selectedTerm.relatedTroubleshooting && selectedTerm.relatedTroubleshooting.length > 0 && (
                      <div className="border border-[#1A1A1E] p-3 rounded bg-black/40 flex flex-col gap-1.5">
                        <span className="text-[9px] text-[#555] uppercase flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-[#FF5C00]" />
                          Troubleshooting Sheets
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {selectedTerm.relatedTroubleshooting.map((tr) => (
                            <span key={tr} className="text-[10px] bg-black text-[#FF5C00] border border-[#FF5C00]/20 px-2 py-0.5 rounded uppercase">
                              {tr.replace('-', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Related Articles */}
                  {selectedTerm.relatedArticles && selectedTerm.relatedArticles.length > 0 && (
                    <div className="border border-[#1A1A1E] p-3 rounded bg-black/40 flex flex-col gap-2">
                      <span className="text-[9px] text-[#555] uppercase flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-[#00F2FF]" />
                        Related Guides & Publications
                      </span>
                      <div className="flex flex-col gap-1">
                        {selectedTerm.relatedArticles.map((art) => (
                          <a 
                            key={art} 
                            href={`/article/${art}`}
                            className="text-[11px] text-[#00F2FF] hover:underline uppercase block leading-relaxed"
                          >
                            {"-> " + art.replace(/-/g, ' ')}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Dossier Footer Info */}
              <div className="bg-[#050507] border-t border-[#111] p-6 text-center text-[10px] text-[#555] uppercase">
                SECURITY REGISTRATION PROTOCOL ACTIVE // ENCRYPTED ACCESS ONLY
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
