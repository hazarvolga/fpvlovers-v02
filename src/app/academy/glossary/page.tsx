"use client"; // Interactive search filters, category isolation hotspots, and RAG diagnostic overlays.

import React, { useState, useEffect, useRef } from 'react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { DroneAnatomyMap } from '@/features/academy/components/DroneAnatomyMap';
import { 
  Search, BookOpen, Shield, ShieldCheck, 
  Layers, Compass, Wrench, FileText, 
  HelpCircle, Sparkles, X, Radio, Battery, 
  Settings, Award, RefreshCw 
} from 'lucide-react';
import { GlossaryTerm } from '@/lib/server/glossary';

export default function GlossaryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeDifficulty, setActiveDifficulty] = useState('all');
  
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);
  
  // Dossier RAG Details state
  const [ragData, setRagData] = useState<any>(null);
  const [ragLoading, setRagLoading] = useState(false);
  const [telemetryConnected, setTelemetryConnected] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const breadcrumbs = [
    { label: 'Pilot Academy', href: '/academy' },
    { label: 'FPV Glossary', isCurrentPage: true }
  ];

  const categories = [
    { id: 'all', label: 'All Systems' },
    { id: 'Start Here', label: 'Crucial Concepts' },
    { id: 'Radio Control System', label: 'Radio Link' },
    { id: 'Power System', label: 'Power System' },
    { id: 'Flight Control System', label: 'Flight Control' },
    { id: 'Video System', label: 'Video link' },
    { id: 'Navigation System', label: 'Navigation' },
    { id: 'Flight Physics', label: 'Physics' },
    { id: 'Troubleshooting', label: 'Troubleshooting' }
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

  // Count telemetry stats
  const totalConceptsCount = terms.length;
  const beginnerCount = terms.filter(t => t.difficulty === 'Beginner').length;
  const advancedCount = terms.filter(t => t.difficulty === 'Advanced').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      {/* Main Header / Tactical HUD Panel */}
      <div className="relative p-8 hex-panel glass-panel overflow-hidden mb-8 border border-[#1A1A1A]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-[0.03] mix-blend-overlay" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_center,#00F2FF,transparent_70%)] opacity-10 pointer-events-none" />
        
        <BookOpen className="w-12 h-12 text-[#FF5C00] mb-6 opacity-80" />
        
        <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter mb-4">
          FPV <span className="text-[#00F2FF]">Knowledge System</span>
        </h1>
        <p className="text-sm font-mono text-[#A0A0A0] max-w-2xl leading-relaxed uppercase tracking-widest">
          {"// INTERCONNECTED FLIGHT DATA MANUAL AND TACTICAL ACRONYM INDEX"}
        </p>

        {/* Global Telemetry Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 border-t border-[#1F1F24] pt-6 text-xs font-mono">
          <div className="flex flex-col gap-1">
            <span className="text-[#555] uppercase">Telemetry Link</span>
            <span className="text-[#00FF66] font-bold uppercase">CONNECTED [DIFY_RAG]</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#555] uppercase">Total Index Nodes</span>
            <span className="text-white font-bold">{totalConceptsCount} Concepts</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#555] uppercase">Initiation Nodes</span>
            <span className="text-[#00F2FF] font-bold">{beginnerCount} Modules</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#555] uppercase">Advanced Specialization</span>
            <span className="text-[#FF5C00] font-bold">{advancedCount} Profiles</span>
          </div>
        </div>
      </div>

      {/* Drone Anatomy Map Section */}
      <div className="mb-10">
        <div className="flex items-center gap-2 border-b border-[#1A1A1A] pb-2 mb-4">
          <Settings className="w-4 h-4 text-[#FF5C00]" />
          <h3 className="text-xs font-black uppercase text-[#FF5C00] tracking-widest font-mono">Interactive Component Isolation Map</h3>
        </div>
        <DroneAnatomyMap activeCategory={activeCategory} onSelectCategory={handleSelectCategory} />
      </div>

      {/* Control Grid & Search Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Content Area */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Filtering Control HUD */}
          <div className="glass-panel hex-panel p-6 bg-black/40 border border-[#1A1A1A] flex flex-col gap-4 font-mono">
            {/* Search Input Box */}
            <div className="relative">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-[#555]" />
              <input
                ref={searchInputRef}
                type="text"
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="DECRYPT TELEMETRY OR SEARCH KEYWORDS... (e.g. ELRS, desync, propwash)"
                className="w-full pl-10 pr-4 py-3 bg-black/60 border border-[#222] rounded-lg text-white font-mono text-xs uppercase tracking-wider focus:outline-none focus:border-[#00F2FF] focus:ring-1 focus:ring-[#00F2FF] transition-all placeholder-[#444]"
              />
            </div>

            {/* Systems Category Horizontal Scroll Tabs */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-[#555] uppercase">Isolate Knowledge System</span>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded border tracking-wider whitespace-nowrap transition-all ${
                      activeCategory === cat.id
                        ? 'bg-[#00F2FF]/10 text-[#00F2FF] border-[#00F2FF]'
                        : 'bg-black/60 text-[#888] border-[#1E1E22] hover:text-white hover:border-[#333]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Level Checkboxes */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 border-t border-[#1E1E22] pt-4">
              <div className="flex flex-col gap-1.5 flex-1">
                <span className="text-[10px] text-[#555] uppercase">Specialization Level Filter</span>
                <div className="flex gap-3 text-[10px] font-bold">
                  {['all', 'Beginner', 'Intermediate', 'Advanced'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setActiveDifficulty(level)}
                      className={`px-3 py-1 rounded border uppercase transition-all ${
                        activeDifficulty === level
                          ? 'bg-[#FF5C00]/10 text-[#FF5C00] border-[#FF5C00]'
                          : 'bg-black/40 text-[#888] border-[#1E1E22] hover:text-white'
                      }`}
                    >
                      {level === 'all' ? 'All Skills' : level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Concepts Grid Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E1E22] pb-2">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#00F2FF]" />
                <h3 className="text-sm font-black uppercase text-[#f8fafc] tracking-widest font-mono">
                  Concept Matrix Nodes ({terms.length})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#555] uppercase">SYSTEMS ONLINE</span>
            </div>

            {loading ? (
              <div className="py-20 text-center font-mono text-[#555] flex flex-col items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-[#00F2FF]" />
                DECRYPTING ENCRYPTED AEROSPACE TERMINOLOGY...
              </div>
            ) : terms.length === 0 ? (
              <div className="py-20 text-center font-mono text-[#777] border border-dashed border-[#222] rounded-lg">
                NO TELEMETRY NODES DECRYPTED FOR DETECTED SEARCH SIGNALS.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {terms.map((item) => (
                  <div
                    key={item.slug}
                    onClick={() => handleOpenDossier(item)}
                    className="bg-black/50 p-6 border border-[#1E1E22] border-l-2 border-l-[#00F2FF] hex-panel group hover:bg-[#060608] hover:border-[#00F2FF]/40 transition-all duration-300 relative cursor-pointer flex flex-col justify-between"
                  >
                    <div className="absolute right-4 top-4 opacity-10 group-hover:opacity-100 transition-opacity">
                      <Shield className="w-5 h-5 text-[#00F2FF]" />
                    </div>

                    <div className="flex flex-col gap-2">
                      {/* Top Badges */}
                      <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-widest text-[#707070] mb-1">
                        <span>{item.category}</span>
                        <span className={`px-1.5 py-0.5 rounded border text-[8px] ${
                          item.difficulty === 'Beginner' ? 'text-[#00FF66] border-[#00FF66]/20 bg-[#00FF66]/5' :
                          item.difficulty === 'Intermediate' ? 'text-[#00F2FF] border-[#00F2FF]/20 bg-[#00F2FF]/5' :
                          'text-[#FF5C00] border-[#FF5C00]/20 bg-[#FF5C00]/5'
                        }`}>
                          {item.difficulty}
                        </span>
                      </div>

                      {/* Term Title */}
                      <h4 className="text-lg font-black uppercase tracking-tight text-white group-hover:text-[#00F2FF] transition-colors">
                        {item.term}
                      </h4>
                      
                      {/* Short Definition preview */}
                      <p className="font-mono text-xs text-[#808080] leading-relaxed line-clamp-3">
                        {item.definition}
                      </p>
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between text-[8px] font-mono uppercase text-[#444] border-t border-[#111] pt-3 mt-4">
                      <span>Priority: {item.priority}</span>
                      <span className="text-[#FF5C00] group-hover:underline">{"[OPEN DOSSIER]"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Sidebar Native Ads Panel */}
        <aside className="lg:col-span-4 hidden lg:flex flex-col gap-6">
          <AdStickySidebar />
        </aside>
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
              
              {/* Decorative tactical markings */}
              <div className="absolute left-2 top-2 text-[8px] text-[#444] tracking-widest uppercase">
                {"CLASSIFIED // ACC_REF_" + selectedTerm.slug.toUpperCase()}
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setSelectedTerm(null)}
                className="absolute right-4 top-4 text-[#888] hover:text-[#FF5C00] transition-colors p-2 rounded-lg border border-[#1A1A1E]"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Dossier Body */}
              <div className="flex-1 overflow-y-auto p-8 pt-12 flex flex-col gap-6">
                
                {/* Categorization & System Telemetry Header */}
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

                {/* Primary Dossier Title */}
                <div>
                  <h2 className="text-3xl font-black uppercase text-white tracking-tighter mb-2">
                    {selectedTerm.term}
                  </h2>
                  <div className="w-16 h-1 bg-[#00F2FF]" />
                </div>

                {/* Section 1: Standard Definition */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-black uppercase text-[#FF5C00] tracking-widest font-mono">
                    Aerospace Definition
                  </h3>
                  <div className="bg-[#0A0A0C] border border-[#1F1F24] p-4 rounded-lg text-sm text-[#DFDFDF] leading-relaxed">
                    {selectedTerm.definition}
                  </div>
                </div>

                {/* Section 2: Layperson Explanation */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-black uppercase text-[#00F2FF] tracking-widest font-mono">
                    Layperson Explanation
                  </h3>
                  <p className="text-xs text-[#A0A0A0] leading-relaxed bg-[#050507] border border-[#141416] p-4 rounded-lg">
                    {selectedTerm.plainLanguageExplanation}
                  </p>
                </div>

                {/* Section 3: Why It Matters */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-black uppercase text-[#00FF66] tracking-widest font-mono">
                    Why It Matters
                  </h3>
                  <div className="bg-[#050A08] border border-[#0D2419] p-4 rounded-lg text-xs text-[#00FF66] leading-relaxed uppercase">
                    {selectedTerm.whyItMatters}
                  </div>
                </div>

                {/* Section 4: Live Dify RAG Telemetry Link */}
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
                      {/* RAG Confidence Score Indicator */}
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

                      <p className="text-[9px] text-[#FF5C00] uppercase mt-1">
                        RECOMMENDATION: {ragData.recommendation}
                      </p>
                    </div>
                  )}
                </div>

                {/* Section 5: Relational Ecosystem Map */}
                <div className="flex flex-col gap-4 border-t border-[#1E1E22] pt-6 text-xs">
                  <h3 className="text-xs font-black uppercase text-[#555] tracking-widest font-mono mb-2">
                    Ecosystem Connection Node Map
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Academy Module links */}
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

                    {/* Build DNA Component links */}
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
