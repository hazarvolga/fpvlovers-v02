"use client"; // Interactive search filters, systems navigation, and progressive disclosure Dossier panel.

import React, { useState, useEffect, useRef } from 'react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { DroneAnatomyMap } from '@/features/academy/components/DroneAnatomyMap';
import { 
  Search, BookOpen, Shield, ShieldCheck, 
  Layers, Compass, Wrench, FileText, 
  HelpCircle, Sparkles, X, Radio, Battery, 
  Settings, Award, RefreshCw, Cpu, Video, CheckCircle
} from 'lucide-react';
import { GlossaryTerm } from '@/lib/server/glossary';

export default function GlossaryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeDifficulty, setActiveDifficulty] = useState('all');
  
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

  // System structural categories for System-Based Learning (Section 3)
  const systemCategories = [
    {
      title: 'Radio Control System',
      description: 'The wireless link connecting your sticks to the aircraft.',
      terms: ['elrs', 'rssi', 'receiver', 'failsafe', 'bind-phrase'],
      icon: Radio,
      color: '#00FF66'
    },
    {
      title: 'Power System',
      description: 'Voltage distribution, battery chemistry, and sag management.',
      terms: ['lipo', 'voltage', 'cell-count', 'desync'],
      icon: Battery,
      color: '#FF5C00'
    },
    {
      title: 'Flight Control System',
      description: 'Firmware operating systems, loop times, and stabilization algorithms.',
      terms: ['flight-controller', 'gyro', 'pid', 'blackbox', 'betaflight'],
      icon: Cpu,
      color: '#00F2FF'
    },
    {
      title: 'Video System',
      description: 'Digital HD and uncompressed analog RF transmission channels.',
      terms: ['vtx', 'analog', 'latency'],
      icon: Video,
      color: '#00F2FF'
    },
    {
      title: 'Navigation System',
      description: 'Autopilot emergency routines and global coordinate networks.',
      terms: ['gps-rescue'],
      icon: Compass,
      color: '#00FF66'
    },
    {
      title: 'Troubleshooting Index',
      description: 'Isolate terminology through active flight failures.',
      terms: ['desync', 'failsafe'],
      icon: Wrench,
      color: '#FF5C00'
    }
  ];

  // Start Here Onboarding Core terms (Section 2)
  const startHereSlugs = [
    'fpv', 'acro-mode', 'elrs', 'lipo', 'flight-controller', 
    'esc', 'motor-kv', 'vtx', 'rssi', 'pid', 
    'blackbox', 'betaflight', 'gps-rescue', 'propwash', 'analog'
  ];

  // Build DNA Knowledge profiles (Section 6)
  const buildDnaProfiles = [
    {
      id: 'sub250',
      title: 'Sub-250g Micro',
      description: 'Micro class drones designed to bypass complex regulatory licensing requirements.',
      useCase: 'Casual backyard flying, park cruising, and lightweight indoor flight.',
      advantages: 'No registration required, highly crash-resilient, whisper-quiet operations.',
      disadvantages: 'Highly susceptible to wind drift, cannot carry full-sized GoPro cameras.',
      module: 'battery-safety',
      archiveLink: '/archive/whoops'
    },
    {
      id: 'cinewhoop',
      title: 'Cinewhoop (3.0" - 3.5")',
      description: 'Ducted propeller platforms engineered to capture ultra-smooth cinematic footage close to people.',
      useCase: 'Indoor real estate touring, close proximity active tracking, and commercial advertising.',
      advantages: 'Propeller guards protect people and walls; extremely stable indoor hover.',
      disadvantages: 'High weight-to-power ratio, severely reduced flight times (3-4 mins), heavy propwash.',
      module: 'goggles-buying',
      archiveLink: '/archive/freestyle'
    },
    {
      id: 'freestyle',
      title: 'Standard 5-Inch',
      description: 'The golden standard of FPV miniquads. Designed for absolute acrobatic capability and durability.',
      useCase: 'Acrobatic flying, bando exploration, power loops, and professional cinematic capturing.',
      advantages: 'Perfect power-to-weight balance, infinite replacement parts, highly customizable.',
      disadvantages: 'Louder noise profile, requires advanced assembly skills and custom tuning.',
      module: 'radio-selection',
      archiveLink: '/archive/freestyle'
    },
    {
      id: 'long-range',
      title: '7-Inch Explorer',
      description: 'Heavy long-range platforms designed to surf mountains and maintain extreme flight envelopes.',
      useCase: 'Alpine peak surfing, long-distance wilderness exploration, and deep RF penetration flights.',
      advantages: 'High efficiency cruisers, handles heavy high-capacity batteries, excellent wind penetration.',
      disadvantages: 'Extreme kinetic hazard in crashes, sluggish rates, requires reliable GPS failsafes.',
      module: 'radio-selection',
      archiveLink: '/archive/long-range'
    }
  ];

  // Troubleshooting Symptoms Database (Section 7)
  const troubleshootingIndex = [
    {
      symptom: 'My motors are hot to the touch',
      cause: 'Severe mechanical vibration or electrical noise overloading the D-term filter stages.',
      linkedSlug: 'pid',
      tag: 'PID / Hot Motors'
    },
    {
      symptom: 'My video feed keeps breaking up',
      cause: 'Antenna polarization mismatch, loose coaxial connectors, or flying behind dense concrete structures.',
      linkedSlug: 'vtx',
      tag: 'VTX / Video Breakup'
    },
    {
      symptom: 'My quad randomly spins out and falls',
      cause: 'ESC losing sync with motor coils under sudden throttle spikes or high noise levels.',
      linkedSlug: 'desync',
      tag: 'ESC / Motor Desync'
    },
    {
      symptom: 'My transmitter displays Link Warnings',
      cause: 'Extreme distance, antenna orientation errors, or low transmitter refresh rates.',
      linkedSlug: 'rssi',
      tag: 'RSSI & LQ Failsafe'
    }
  ];

  // Dedicated FPV Acronym Center (Section 8)
  const acronyms = [
    { name: 'ELRS', full: 'ExpressLRS', exp: 'Leading open-source radio control link using ultra-fast LoRa packet rates.' },
    { name: 'ESC', full: 'Electronic Speed Controller', exp: 'Translates raw battery voltage into timed 3-phase current to spin brushless motors.' },
    { name: 'FC', full: 'Flight Controller', exp: 'The central multi-processor board acting as the stabilizing brain of the aircraft.' },
    { name: 'GPS', full: 'Global Positioning System', exp: 'Satellite tracking receiver allowing coordinates to trigger emergency RTH rescue.' },
    { name: 'LQ', full: 'Link Quality', exp: 'Percentage of control data packets successfully received. The ultimate telemetry metric.' },
    { name: 'PID', full: 'Proportional Integral Derivative', exp: 'The math control loop that stabilizes your quad, comparing stick positions to actual gyro tilt.' },
    { name: 'RPM', full: 'Revolutions Per Minute', exp: 'Rotational speed of motor stators, critical for configuring Betaflight dynamic filters.' },
    { name: 'RSSI', full: 'Received Signal Strength Indicator', exp: 'The logarithmic measure of incoming radio signal strength.' },
    { name: 'UART', full: 'Universal Asynchronous Receiver-Transmitter', exp: 'Physical serial communication ports on the FC to connect external GPS, RX, or VTX peripherals.' },
    { name: 'VTX', full: 'Video Transmitter', exp: 'Onboard module broadcasting the camera feed over 5.8GHz channels to pilot goggles.' }
  ];

  // Load terms and apply filters using Client-side API fetching
  useEffect(() => {
    let active = true;
    
    const loadTimer = setTimeout(() => {
      if (active) setLoading(true);
    }, 0);

    const fetchFilteredTerms = async () => {
      try {
        const queryParams = new URLSearchParams({
          q: searchTerm,
          category: activeCategory,
          difficulty: activeDifficulty
        });

        const res = await fetch(`/api/academy/glossary?${queryParams.toString()}`);
        if (!res.ok) throw new Error('API down');
        const data = await res.json();
        
        if (active) {
          setTerms(data.terms || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch glossary terms from RAG API:', err);
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchFilteredTerms();

    return () => {
      active = false;
      clearTimeout(loadTimer);
    };
  }, [searchTerm, activeCategory, activeDifficulty]);

  // Handler for hotspot clicks on the Drone Anatomy Map
  const handleSelectCategory = (category: string, searchVal?: string) => {
    setActiveCategory(category);
    if (searchVal) {
      setSearchTerm(searchVal);
      if (searchInputRef.current) {
        searchInputRef.current.value = searchVal;
      }
    } else {
      setSearchTerm('');
      if (searchInputRef.current) {
        searchInputRef.current.value = '';
      }
    }
  };

  // Handler to fetch dynamic RAG insights for a selected term
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
      console.error('Failed to fetch dynamic RAG telemetry:', err);
    } finally {
      setRagLoading(false);
    }
  };

  // Open Dossier Drawer
  const handleOpenDossier = (term: GlossaryTerm) => {
    setSelectedTerm(term);
    setRagData(null);
    setTelemetryConnected(false);
  };

  // Find dynamic start here terms
  const startHereTerms = terms.filter(t => startHereSlugs.includes(t.slug));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      {/* SECTION 1: HERO (Clarity First) */}
      <div className="relative p-10 hex-panel glass-panel overflow-hidden mb-10 border border-[#1A1A1A] bg-black/45">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-[0.03] mix-blend-overlay" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_center,#00F2FF,transparent_70%)] opacity-10 pointer-events-none" />
        
        <BookOpen className="w-12 h-12 text-[#FF5C00] mb-6 opacity-80" />
        
        <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter mb-4">
          FPV <span className="text-[#00F2FF]">Knowledge Index</span>
        </h1>
        <p className="text-sm md:text-md text-[#A0A0A0] max-w-2xl leading-relaxed uppercase tracking-wider mb-8">
          Learn the language of FPV. Explore radios, batteries, flight controllers, video links, tuning algorithms, troubleshooting topics, and build configurations.
        </p>

        {/* Global Search Bar (Immediately Centered and Visible) */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-4.5 w-4 h-4 text-[#555] group-focus-within:text-[#00F2FF]" />
          <input
            ref={searchInputRef}
            type="text"
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type any FPV term to search instantly... (e.g. ELRS, Acro, desync)"
            className="w-full pl-11 pr-4 py-4 bg-black/85 border border-[#222] rounded-lg text-white font-mono text-xs uppercase tracking-wider focus:outline-none focus:border-[#00F2FF] focus:ring-1 focus:ring-[#00F2FF] transition-all placeholder-[#444] shadow-2xl"
          />
        </div>
      </div>

      {/* SECTION 2: START HERE (Beginner Onboarding Core) */}
      <div className="mb-14">
        <div className="flex items-center gap-2 border-b border-[#1A1A1A] pb-3 mb-6">
          <Award className="w-5 h-5 text-[#00FF66]" />
          <h2 className="text-lg font-black uppercase text-white tracking-widest font-mono">
            Start Here <span className="text-[#00FF66] text-xs font-normal lowercase tracking-normal">{"// 15 core concepts every pilot must master"}</span>
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {startHereTerms.slice(0, 15).map((item) => (
            <div
              key={item.slug}
              onClick={() => handleOpenDossier(item)}
              className="bg-[#050907]/50 p-5 border border-[#0F1C14] hover:border-[#00FF66]/40 rounded-lg group transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-widest text-[#555]">
                  <span className="text-[#00FF66]">Core Module</span>
                  <span className="px-1.5 py-0.5 rounded border border-[#00FF66]/20 bg-[#00FF66]/5 text-[#00FF66]">
                    Phase {item.relatedAcademyModules[0] ? item.relatedAcademyModules[0].slice(-1) : '1'}
                  </span>
                </div>
                <h4 className="text-md font-black uppercase text-white group-hover:text-[#00FF66] transition-colors font-mono">
                  {item.term}
                </h4>
                <p className="text-xs text-[#888] leading-relaxed line-clamp-3 font-mono">
                  {item.plainLanguageExplanation}
                </p>
              </div>
              <div className="text-[8px] font-mono uppercase text-[#00FF66] text-right border-t border-[#0F1C14] pt-2.5 mt-3 group-hover:underline">
                {"[STUDY DOSSIER]"}
              </div>
            </div>
          ))}
          {loading && (
            <div className="col-span-full py-10 text-center font-mono text-xs text-[#555] animate-pulse">
              SYNCING ONBOARDING NODES...
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: LEARN BY SYSTEM (System-Based Cards) */}
      <div className="mb-14">
        <div className="flex items-center gap-2 border-b border-[#1A1A1A] pb-3 mb-6">
          <Layers className="w-5 h-5 text-[#00F2FF]" />
          <h2 className="text-lg font-black uppercase text-white tracking-widest font-mono">
            Learn By System <span className="text-[#00F2FF] text-xs font-normal lowercase tracking-normal">{"// structure vocabulary by hardware layers"}</span>
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {systemCategories.map((sys, idx) => {
            const Icon = sys.icon;
            return (
              <div key={idx} className="bg-black/45 border border-[#1A1A1E] rounded-lg p-6 flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/[0.02] border border-white/5 rounded text-white" style={{ color: sys.color }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-black uppercase text-white tracking-tight font-mono">{sys.title}</h3>
                  </div>
                  <p className="text-xs text-[#666] leading-relaxed font-mono">{sys.description}</p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/[0.03]">
                  {sys.terms.map((tSlug) => (
                    <button
                      key={tSlug}
                      onClick={() => {
                        const term = terms.find(t => t.slug === tSlug);
                        if (term) handleOpenDossier(term);
                      }}
                      className="text-[10px] bg-[#0A0A0C] hover:bg-white/[0.04] text-[#A0A0A0] hover:text-white border border-[#222] px-2.5 py-1 rounded transition-colors font-mono uppercase"
                    >
                      {tSlug.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 5: DRONE ANATOMY EXPLORER */}
      <div className="mb-14">
        <div className="flex items-center gap-2 border-b border-[#1A1A1A] pb-3 mb-6">
          <Settings className="w-5 h-5 text-[#FF5C00]" />
          <h2 className="text-lg font-black uppercase text-white tracking-widest font-mono">
            Drone Anatomy Explorer <span className="text-[#FF5C00] text-xs font-normal lowercase tracking-normal">{"// click hotspots to learn basic hardware function"}</span>
          </h2>
        </div>
        <DroneAnatomyMap activeCategory={activeCategory} onSelectCategory={handleSelectCategory} />
      </div>

      {/* SECTION 6: BUILD DNA KNOWLEDGE */}
      <div className="mb-14">
        <div className="flex items-center gap-2 border-b border-[#1A1A1A] pb-3 mb-6">
          <Wrench className="w-5 h-5 text-[#00F2FF]" />
          <h2 className="text-lg font-black uppercase text-white tracking-widest font-mono">
            Build DNA Specifications <span className="text-[#00F2FF] text-xs font-normal lowercase tracking-normal">{"// browse performance characteristics by size class"}</span>
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {buildDnaProfiles.map((profile) => (
            <div
              key={profile.id}
              onClick={() => setSelectedBuildDna(selectedBuildDna === profile.id ? null : profile.id)}
              className={`p-5 rounded-lg border transition-all duration-300 cursor-pointer flex flex-col gap-3 font-mono ${
                selectedBuildDna === profile.id
                  ? 'bg-[#060A10]/70 border-[#00F2FF]/60 shadow-[inset_0_0_20px_rgba(0,242,255,0.05)]'
                  : 'bg-black/45 border-[#1A1A1E] hover:border-white/10'
              }`}
            >
              <div className="flex justify-between items-center">
                <h4 className="text-md font-black uppercase text-white tracking-tight">{profile.title}</h4>
                <span className="text-[10px] text-[#00F2FF] uppercase">
                  {selectedBuildDna === profile.id ? '[COLLAPSE]' : '[EXPAND]'}
                </span>
              </div>
              <p className="text-xs text-[#888] leading-relaxed">{profile.description}</p>
              
              {selectedBuildDna === profile.id && (
                <div className="flex flex-col gap-3 pt-3 border-t border-white/[0.04] text-[11px] text-[#A0A0A0] leading-relaxed">
                  <div>
                    <span className="text-[#00F2FF] uppercase font-bold text-[9px] block">Primary Use Case:</span>
                    {profile.useCase}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[#00FF66] uppercase font-bold text-[9px] block">Advantages:</span>
                      {profile.advantages}
                    </div>
                    <div>
                      <span className="text-[#FF5C00] uppercase font-bold text-[9px] block">Disadvantages:</span>
                      {profile.disadvantages}
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-2 text-[9px]">
                    <a href={`/academy/roadmap#${profile.module}`} className="text-[#00F2FF] hover:underline uppercase">{"[Academy Syllabus]"}</a>
                    <a href={profile.archiveLink} className="text-white hover:underline uppercase">{"[Archive Specs]"}</a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 7: TROUBLESHOOTING INDEX */}
      <div className="mb-14">
        <div className="flex items-center gap-2 border-b border-[#1A1A1A] pb-3 mb-6">
          <HelpCircle className="w-5 h-5 text-[#FF5C00]" />
          <h2 className="text-lg font-black uppercase text-white tracking-widest font-mono">
            Troubleshooting Symptom Directory <span className="text-[#FF5C00] text-xs font-normal lowercase tracking-normal">{"// discover technical terms through active problems"}</span>
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {troubleshootingIndex.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                const term = terms.find(t => t.slug === item.linkedSlug);
                if (term) handleOpenDossier(term);
              }}
              className="p-5 border border-[#1A1A1E] bg-[#0A0503]/20 hover:bg-black/60 hover:border-[#FF5C00]/30 rounded-lg group transition-all duration-300 cursor-pointer flex flex-col gap-2 font-mono"
            >
              <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-[#FF5C00]">
                <span>Flight Symptom</span>
                <span>{item.tag}</span>
              </div>
              <h4 className="text-sm font-black uppercase text-white tracking-tight group-hover:text-[#FF5C00] transition-colors">
                &quot;{item.symptom}&quot;
              </h4>
              <p className="text-[11px] text-[#777] leading-relaxed">
                <span className="text-[#FF5C00] uppercase font-bold text-[9px] inline-block mr-1">Likely Cause:</span>
                {item.cause}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 8: FPV ACRONYM CENTER */}
      <div className="mb-14">
        <div className="flex items-center gap-2 border-b border-[#1A1A1A] pb-3 mb-6">
          <Compass className="w-5 h-5 text-white" />
          <h2 className="text-lg font-black uppercase text-white tracking-widest font-mono">
            FPV Acronym Database <span className="text-[#A0A0A0] text-xs font-normal lowercase tracking-normal">{"// search abbreviations easily"}</span>
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {acronyms.map((ac) => (
            <div
              key={ac.name}
              onClick={() => setExpandedAcronym(expandedAcronym === ac.name ? null : ac.name)}
              className={`p-4 border rounded-md cursor-pointer transition-all duration-200 font-mono text-xs ${
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
                <span className="text-[8px] text-[#444] uppercase">
                  {expandedAcronym === ac.name ? '[CLOSE]' : '[DETAILS]'}
                </span>
              </div>
              {expandedAcronym === ac.name && (
                <p className="text-[11px] text-[#A0A0A0] mt-3 pt-3 border-t border-white/[0.04] leading-relaxed">
                  {ac.exp}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 9: KNOWLEDGE GRAPH (Advanced Relationship Explorer at bottom) */}
      <div className="border-t border-[#111] pt-12">
        <div className="flex items-center gap-2 border-b border-[#1A1A1A] pb-3 mb-6">
          <Radio className="w-5 h-5 text-[#FF5C00]" />
          <h2 className="text-lg font-black uppercase text-white tracking-widest font-mono">
            Advanced Relationship Explorer <span className="text-[#A0A0A0] text-xs font-normal lowercase tracking-normal">{"// map complex terminology cross-link grids"}</span>
          </h2>
        </div>

        <div className="p-8 hex-panel border border-[#FF5C00]/10 bg-[#FF5C00]/[0.01] rounded-lg text-center font-mono text-xs flex flex-col items-center gap-4 justify-center relative overflow-hidden">
          <div className="absolute inset-0 carbon-grid opacity-10 pointer-events-none" />
          <p className="max-w-xl text-[#777] leading-relaxed uppercase">
            The multi-dataset RAG crawler maps implicit logical node links between modules, blueprints, and flight logs. Ready for advanced conceptual telemetry mapping.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchTerm('');
                if (searchInputRef.current) searchInputRef.current.value = '';
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2 border border-[#FF5C00]/40 text-[#FF5C00] hover:bg-[#FF5C00]/5 text-[10px] font-black uppercase tracking-wider rounded transition-colors cursor-pointer"
            >
              {"[RESET FILTERS & GO TO TOP]"}
            </button>
          </div>
        </div>
      </div>

      {/* Dossier Side-Overlay Drawer / Modal Panel */}
      {selectedTerm && (
        <div className="fixed inset-0 z-50 overflow-hidden font-mono" role="dialog" aria-modal="true">
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
                className="absolute right-4 top-4 text-[#888] hover:text-[#FF5C00] transition-colors p-2 rounded-lg border border-[#1A1A1E]"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Dossier Body */}
              <div className="flex-1 overflow-y-auto p-8 pt-12 flex flex-col gap-6">
                
                {/* Categorization & Level */}
                <div className="flex items-center gap-4 text-xs font-mono">
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

                {/* SECTION 4.1: Plain English Explanation */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-black uppercase text-[#00F2FF] tracking-widest font-mono">
                    Plain English Explanation
                  </h3>
                  <p className="text-sm text-[#DFDFDF] leading-relaxed bg-[#050507] border border-[#141416] p-5 rounded-lg">
                    {selectedTerm.plainLanguageExplanation}
                  </p>
                </div>

                {/* SECTION 4.2: Why It Matters */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-black uppercase text-[#00FF66] tracking-widest font-mono">
                    Why It Matters
                  </h3>
                  <div className="bg-[#050A08] border border-[#0D2419] p-5 rounded-lg text-xs text-[#00FF66] leading-relaxed uppercase">
                    {selectedTerm.whyItMatters}
                  </div>
                </div>

                {/* SECTION 4.3: Technical Definition */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-black uppercase text-[#555] tracking-widest font-mono">
                    Technical Definition
                  </h3>
                  <div className="bg-[#0A0A0C] border border-[#1F1F24] p-4 rounded-lg text-xs text-[#A0A0A0] leading-relaxed">
                    {selectedTerm.definition}
                  </div>
                </div>

                {/* Dynamic Dify RAG Telemetry Link */}
                <div className="border border-[#1A1A1F] bg-black/60 p-6 rounded-lg flex flex-col gap-4">
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
                      className="w-full bg-[#050A0D] border border-[#00F2FF]/40 text-[#00F2FF] hover:bg-[#00F2FF]/5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
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
                    <div className="flex flex-col gap-3 font-mono text-[11px]">
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
                            <div key={idx} className="bg-black/80 border border-[#222] p-3 rounded text-[11px] leading-relaxed text-[#A0A0A0]">
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

                {/* Section 5: Relational Ecosystem Map */}
                <div className="flex flex-col gap-4 border-t border-[#1E1E22] pt-6 text-xs">
                  <h3 className="text-xs font-black uppercase text-[#555] tracking-widest font-mono mb-2">
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
