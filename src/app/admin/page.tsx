'use client';

import React, { useState, useEffect } from 'react';
import {
  Database, Users, Activity, BarChart2, Download, RefreshCw,
  Settings, Server, Cpu, Command, AlertTriangle, Workflow, ChevronRight, Zap,
  Plus, Globe, Send, Loader2, CheckCircle2, XCircle, Search, Clock, FileText,
  Pen, Sparkles, ShoppingCart, DollarSign, Trash2, HeartPulse, BadgeDollarSign, LayoutDashboard
} from 'lucide-react';
import SponsorDashboard from '@/features/monetization/components/SponsorDashboard';
import AnalyticsDashboard from '@/features/admin/components/AnalyticsDashboard';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';



// --- MOCK DATA (non-RAG data) ---
const subscribersData = [
  { id: '1', email: 'alex@example.com', joined: '2026-05-01', source: 'Tool: Calculator' },
  { id: '2', email: 'fpvracerX@gmail.com', joined: '2026-05-01', source: 'Newsletter Widget' },
  { id: '3', email: 'sarah.j.fpv@outlook.com', joined: '2026-04-30', source: 'Article: Cinewhoops' },
  { id: '4', email: 'mike_fpv@yahoo.com', joined: '2026-04-29', source: 'Tool: Component Duel' },
  { id: '5', email: 'dronemaster99@protonmail.com', joined: '2026-04-28', source: 'Newsletter Widget' },
];

const usageVsGrowthData = [
  { name: 'Mon', 'Oracle Usage': 840, 'New Users': 120 },
  { name: 'Tue', 'Oracle Usage': 660, 'New Users': 132 },
  { name: 'Wed', 'Oracle Usage': 1409, 'New Users': 145 },
  { name: 'Thu', 'Oracle Usage': 868, 'New Users': 160 },
  { name: 'Fri', 'Oracle Usage': 887, 'New Users': 184 },
  { name: 'Sat', 'Oracle Usage': 869, 'New Users': 210 },
  { name: 'Sun', 'Oracle Usage': 989, 'New Users': 250 },
];

const affiliateData = [
  { tool: 'Part Matcher', clicks: 1240, ctr: '14.2%', revenue: '$340.50' },
  { tool: 'Blackbox Tuning', clicks: 890, ctr: '8.4%', revenue: '$120.00' },
  { tool: 'Thrust Calc', clicks: 450, ctr: '5.1%', revenue: '$45.20' },
  { tool: 'Flight Critic', clicks: 1100, ctr: '11.8%', revenue: '$210.80' },
];

type DatasetInfo = {
  id: string;
  name: string;
  description: string;
  docCount: number;
  completed: number;
  errors: number;
  tokens: number;
  embeddingModel: string;
  scoreThreshold: string;
};

type CrawlerInfo = {
  name: string;
  status: 'online' | 'offline' | 'error';
  version: string;
};

type TabId = 'hub' | 'ingest' | 'content' | 'logs' | 'retrieval' | 'raw-browser' | 'affiliates' | 'sponsors' | 'orchestrator' | 'health' | 'registry' | 'telemetry';

type Tab = { id: TabId; label: string; icon: React.ElementType };

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('hub');
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [crawlers, setCrawlers] = useState<CrawlerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalDocs, setTotalDocs] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [errorDocs, setErrorDocs] = useState(0);
  const [ingestUrl, setIngestUrl] = useState('');
  const [ingestDataset, setIngestDataset] = useState('');
  const [ingestResults, setIngestResults] = useState<any[]>([]);
  const [ingesting, setIngesting] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [retrievalQuery, setRetrievalQuery] = useState('');
  const [retrievalResult, setRetrievalResult] = useState<any>(null);
  const [retrievalLoading, setRetrievalLoading] = useState(false);
  const [contentPage, setContentPage] = useState('roadmap');
  const [contentPrompt, setContentPrompt] = useState('');
  const [contentResult, setContentResult] = useState<any>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [budget, setBudget] = useState<any>(null);

  const fetchBudget = async () => {
    try { const r = await fetch('/api/admin/budget'); setBudget(await r.json()); } catch {}
  };
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [affProduct, setAffProduct] = useState('');
  const [affLink, setAffLink] = useState('');
  const [affPrice, setAffPrice] = useState('');
  const [affCategory, setAffCategory] = useState('Drone Parts');
  const [affNetwork, setAffNetwork] = useState('Amazon');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [ctas, setCtas] = useState<any[]>([]);
  const [campaignName, setCampaignName] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaPlacement, setCtaPlacement] = useState('bottom-right');
  const [ctaColor, setCtaColor] = useState('#FF5C00');
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [spName, setSpName] = useState('');
  const [spUrl, setSpUrl] = useState('');
  const [spBudget, setSpBudget] = useState('');
  const [spCategory, setSpCategory] = useState('Drone Parts');
  const [spType, setSpType] = useState('manufacturer');
  const [spRegion, setSpRegion] = useState('global');
  const [spPriority, setSpPriority] = useState(0);
  const [spProductName, setSpProductName] = useState('');
  const [spProductUrl, setSpProductUrl] = useState('');
  const [selectedSponsor, setSelectedSponsor] = useState<string | null>(null);
  const [sponsorView, setSponsorView] = useState<'manage' | 'dashboard'>('manage');
  const [rawContent, setRawContent] = useState<any[]>([]);
  const [rawFilter, setRawFilter] = useState('');
  const [health, setHealth] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dsRes, crRes] = await Promise.all([
        fetch('/api/admin/datasets'),
        fetch('/api/admin/crawlers'),
      ]);
      const dsData = await dsRes.json();
      const crData = await crRes.json();

      if (dsData.datasets) {
        setDatasets(dsData.datasets);
        setTotalDocs(dsData.datasets.reduce((s: number, d: DatasetInfo) => s + d.docCount, 0));
        setTotalTokens(dsData.datasets.reduce((s: number, d: DatasetInfo) => s + d.tokens, 0));
        setErrorDocs(dsData.datasets.reduce((s: number, d: DatasetInfo) => s + d.errors, 0));
      }
      if (crData.crawlers) setCrawlers(crData.crawlers);
    } catch (err) {
      console.error('Admin fetch error:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); fetchLogs(); fetchBudget(); }, []);

  const tabGroups: { label: string; color: string; tabs: Tab[] }[] = [
    {
      label: 'Intelligence',
      color: '#00F2FF',
      tabs: [
        { id: 'hub', label: 'RAG Hub', icon: Database },
        { id: 'ingest', label: 'URL Ingestion', icon: Globe },
        { id: 'content', label: 'Content Gen', icon: Pen },
        { id: 'logs', label: 'Crawl Logs', icon: Clock },
        { id: 'retrieval', label: 'Retrieval Test', icon: Search },
        { id: 'raw-browser', label: 'Raw Browser', icon: FileText },
      ],
    },
    {
      label: 'Monetization',
      color: '#FF5C00',
      tabs: [
        { id: 'affiliates', label: 'Affiliates', icon: ShoppingCart },
        { id: 'sponsors', label: 'Sponsors', icon: BadgeDollarSign },
        { id: 'orchestrator', label: 'Orchestrator', icon: Workflow },
      ],
    },
    {
      label: 'System',
      color: '#00FF66',
      tabs: [
        { id: 'health', label: 'System Health', icon: HeartPulse },
        { id: 'registry', label: 'Pilot Registry', icon: Users },
        { id: 'telemetry', label: 'Tool Telemetry', icon: Activity },
      ],
    },
  ];
  const tabs = tabGroups.flatMap(g => g.tabs);

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const resp = await fetch('/api/admin/logs');
      const data = await resp.json();
      setLogs(data.logs || []);
    } catch {}
    setLogsLoading(false);
  };

  const handleRetrievalTest = async () => {
    if (!retrievalQuery.trim()) return;
    setRetrievalLoading(true);
    try {
      const resp = await fetch('/api/admin/retrieval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: retrievalQuery }),
      });
      setRetrievalResult(await resp.json());
    } catch {}
    setRetrievalLoading(false);
  };

  const handleIngest = async () => {
    if (!ingestUrl.trim()) return;
    setIngesting(true);
    const urls = ingestUrl.split('\n').map(u => u.trim()).filter(Boolean);
    try {
      const resp = await fetch('/api/admin/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, dataset: ingestDataset }),
      });
      const data = await resp.json();
      setIngestResults(data.results || []);
    } catch (err) {
      setIngestResults([{ url: 'error', status: 'error', error: 'Request failed' }]);
    }
    setIngesting(false);
  };

  const handleContentGen = async () => {
    setContentLoading(true);
    try {
      const resp = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: contentPage, customPrompt: contentPrompt || undefined }),
      });
      setContentResult(await resp.json());
    } catch {}
    setContentLoading(false);
  };

  const fetchAffiliates = async () => {
    try { const resp = await fetch('/api/admin/affiliates?type=all'); const data = await resp.json(); setAffiliates(data.affiliates || []); setCampaigns(data.campaigns || []); setCtas(data.ctas || []); } catch {}
  };

  const addAffiliate = async () => {
    if (!affProduct || !affLink) return;
    await fetch('/api/admin/affiliates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product: affProduct, link: affLink, price: affPrice, category: affCategory, network: affNetwork }) });
    setAffProduct(''); setAffLink(''); setAffPrice(''); fetchAffiliates();
  };

  const addCampaign = async () => {
    if (!campaignName) return;
    await fetch('/api/admin/affiliates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add-campaign', name: campaignName }) });
    setCampaignName(''); fetchAffiliates();
  };

  const addCta = async () => {
    if (!ctaText) return;
    await fetch('/api/admin/affiliates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add-cta', text: ctaText, placement: ctaPlacement, color: ctaColor }) });
    setCtaText(''); fetchAffiliates();
  };

  const fetchSponsors = async () => {
    try { const r = await fetch('/api/admin/sponsors'); setSponsors((await r.json()).sponsors || []); } catch {}
  };

  const addSponsor = async () => {
    if (!spName || !spUrl) return;
    await fetch('/api/admin/sponsors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: spName, url: spUrl, budget: spBudget, category: spCategory, type: spType, region: spRegion, priority: spPriority }) });
    setSpName(''); setSpUrl(''); setSpBudget(''); setSpPriority(0); fetchSponsors();
  };

  const addSponsorProduct = async (sponsorId: string) => {
    if (!spProductName || !spProductUrl) return;
    await fetch('/api/admin/sponsors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add-product', sponsorId, productName: spProductName, productUrl: spProductUrl }) });
    setSpProductName(''); setSpProductUrl(''); fetchSponsors();
  };

  const removeSponsorProduct = async (sponsorId: string, index: number) => {
    await fetch('/api/admin/sponsors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'remove-product', sponsorId, productIndex: index }) });
    fetchSponsors();
  };

  const deleteSponsor = async (id: string) => {
    await fetch('/api/admin/sponsors', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); fetchSponsors();
  };

  const deleteAffiliate = async (id: string) => {
    await fetch('/api/admin/affiliates', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); fetchAffiliates();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12 font-sans selection:bg-[#00F2FF]/30 transition-colors duration-500">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-6 gap-8">

        {/* SIDEBAR NAVIGATION */}
        <aside className="lg:col-span-1 space-y-8">
           <div className="flex items-center gap-3 mb-8">
               <Command className="w-8 h-8 text-[#FF5C00]" />
               <div>
                  <h1 className="text-xl font-black uppercase tracking-tight">Command<br/><span className="text-[#FF5C00]">Center</span></h1>
               </div>
           </div>

           <nav className="space-y-0">
             {tabGroups.map(group => (
               <div key={group.label} className="mb-3">
                 <div
                   className="text-[9px] font-mono uppercase tracking-[0.18em] px-4 py-1.5 mb-0.5"
                   style={{ color: group.color + 'AA' }}
                 >
                   {group.label}
                 </div>
                 {group.tabs.map(tab => (
                   <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id)}
                     className={`w-full flex items-center gap-3 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-left transition-all duration-150 border-l-2 ${
                       activeTab === tab.id
                         ? 'border-transparent'
                         : 'border-transparent text-[#606060] hover:text-white hover:bg-white/[0.03]'
                     }`}
                     style={activeTab === tab.id ? {
                       backgroundColor: group.color + '12',
                       color: group.color,
                       borderLeftColor: group.color,
                     } : {}}
                   >
                     <tab.icon className="w-3.5 h-3.5 shrink-0" />
                     {tab.label}
                   </button>
                 ))}
               </div>
             ))}
           </nav>

           <div className="pt-8 border-t border-[#333333]">
              <div className="text-[10px] font-mono text-[#A0A0A0] uppercase tracking-widest mb-4">System Status</div>
              <div className="space-y-3 font-mono text-xs">
                 <div className="flex justify-between items-center group cursor-default">
                    <span className="text-[#A0A0A0] flex items-center gap-2 group-hover:text-white transition-colors"><Server className="w-3 h-3"/> API</span>
                    <span className="text-[#00FF66] flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#00FF66] rounded-full animate-pulse"/> Online</span>
                 </div>
                 <div className="flex justify-between items-center group cursor-default">
                    <span className="text-[#A0A0A0] flex items-center gap-2 group-hover:text-white transition-colors"><Database className="w-3 h-3"/> DB</span>
                    <span className="text-[#00FF66] flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#00FF66] rounded-full animate-pulse"/> Online</span>
                 </div>
               <div className="flex justify-between items-center group cursor-default">
                     <span className="text-[#A0A0A0] flex items-center gap-2 group-hover:text-white transition-colors"><Workflow className="w-3 h-3"/> Crawlers</span>
                     <span className="text-[#00FF66] flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#00FF66] rounded-full animate-pulse"/> {crawlers.filter(c => c.status === 'online').length}/{crawlers.length} Active</span>
                  </div>
              </div>
           </div>
        </aside>

        {/* MAIN DASHBOARD AREA */}
        <main className="lg:col-span-5 flex flex-col gap-8">

          {/* CONTEXT BAR */}
          {(() => {
            const group = tabGroups.find(g => g.tabs.some(t => t.id === activeTab));
            const tab = tabs.find(t => t.id === activeTab);
            const ctaMap: Record<string, { label: string; icon: React.ElementType; action: () => void }> = {
              hub:          { label: 'Sync Datasets',  icon: RefreshCw,  action: fetchData },
              ingest:       { label: 'Ingest Now',     icon: Send,        action: handleIngest },
              content:      { label: 'Generate',       icon: Sparkles,    action: handleContentGen },
              logs:         { label: 'Refresh Logs',   icon: RefreshCw,  action: fetchLogs },
              affiliates:   { label: 'Add Affiliate',  icon: Plus,        action: fetchAffiliates },
              sponsors:     { label: 'Add Sponsor',    icon: Plus,        action: fetchSponsors },
              health:       { label: 'Check Health',   icon: RefreshCw,  action: fetchData },
            };
            const cta = ctaMap[activeTab];
            if (!group || !tab) return null;
            const ActiveIcon = tab.icon;
            return (
              <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-4">
                <div className="flex items-center gap-2 font-mono">
                  <span
                    className="text-[9px] uppercase tracking-[0.2em] font-bold"
                    style={{ color: group.color + 'BB' }}
                  >
                    {group.label}
                  </span>
                  <ChevronRight className="w-3 h-3 text-[#333]" />
                  <ActiveIcon className="w-3.5 h-3.5" style={{ color: group.color }} />
                  <span className="text-sm uppercase tracking-wider text-white">{tab.label}</span>
                </div>
                {cta && (
                  <button
                    onClick={cta.action}
                    className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs uppercase tracking-wider border transition-all duration-150 hover:opacity-80"
                    style={{ borderColor: group.color + '60', color: group.color, backgroundColor: group.color + '10' }}
                  >
                    <cta.icon className="w-3.5 h-3.5" />
                    {cta.label}
                  </button>
                )}
              </div>
            );
          })()}

          {/* HEADER METRICS */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* KPI: Total Documents */}
              <div className="bg-[#0A0A0B] border border-[#333333] p-6 glass-panel relative overflow-hidden group cursor-pointer hover:bg-[#111] transition-colors" onClick={() => setActiveTab('hub')}>
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00F2FF] to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                 <div className="text-[#A0A0A0] font-mono text-[10px] uppercase tracking-widest mb-2 flex items-center justify-between">
                    Total Documents <Database className="w-3 h-3 text-[#00F2FF]" />
                 </div>
                 <div className="flex items-end justify-between">
                   <div className="text-4xl font-black tracking-tighter">{loading ? '...' : totalDocs}</div>
                   <span className="text-[10px] font-mono text-[#00F2FF] bg-[#00F2FF]/10 px-1.5 py-0.5 mb-1">+12% ↑</span>
                 </div>
                 <svg viewBox="0 0 80 20" className="w-full h-5 mt-3" preserveAspectRatio="none">
                   <polyline
                     points={usageVsGrowthData.map((d, i) => `${(i / 6) * 80},${20 - (d['New Users'] / 260) * 18}`).join(' ')}
                     fill="none" stroke="#00F2FF" strokeWidth="1.5"
                     strokeLinecap="round" strokeLinejoin="round" opacity="0.6"
                   />
                 </svg>
                 <div className="text-[#A0A0A0] font-mono text-[10px] mt-1">{datasets.length} active datasets · 7-day trend</div>
              </div>

              {/* KPI: Total Tokens */}
              <div className="bg-[#0A0A0B] border border-[#333333] p-6 glass-panel relative overflow-hidden group cursor-pointer hover:bg-[#111] transition-colors">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FF5C00] to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                 <div className="text-[#A0A0A0] font-mono text-[10px] uppercase tracking-widest mb-2 flex items-center justify-between">
                    Total Tokens <Cpu className="w-3 h-3 text-[#FF5C00]" />
                 </div>
                 <div className="flex items-end justify-between">
                   <div className="text-4xl font-black tracking-tighter">{loading ? '...' : (totalTokens / 1000).toFixed(1) + 'K'}</div>
                   <span className="text-[10px] font-mono text-[#FF5C00] bg-[#FF5C00]/10 px-1.5 py-0.5 mb-1">+8% ↑</span>
                 </div>
                 <svg viewBox="0 0 80 20" className="w-full h-5 mt-3" preserveAspectRatio="none">
                   <polyline
                     points={usageVsGrowthData.map((d, i) => `${(i / 6) * 80},${20 - (d['Oracle Usage'] / 1500) * 18}`).join(' ')}
                     fill="none" stroke="#FF5C00" strokeWidth="1.5"
                     strokeLinecap="round" strokeLinejoin="round" opacity="0.6"
                   />
                 </svg>
                 <div className="font-mono text-[10px] mt-1">
                   {errorDocs > 0 ? (
                     <button
                       onClick={(e) => { e.stopPropagation(); setActiveTab('hub'); }}
                       className="flex items-center gap-1.5 text-red-400 hover:text-red-300 transition-colors underline underline-offset-2"
                     >
                       <AlertTriangle className="w-3 h-3" />
                       {errorDocs} embedding errors → fix
                     </button>
                   ) : (
                     <span className="text-[#00FF66]">✓ All clean</span>
                   )}
                 </div>
              </div>

              {/* KPI: Crawlers */}
              <div className="bg-[#0A0A0B] border border-[#333333] p-6 glass-panel relative overflow-hidden group hover:bg-[#111] transition-colors">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00FF66] to-transparent opacity-20 group-hover:opacity-50 transition-opacity" />
                 <div className="text-[#A0A0A0] font-mono text-[10px] uppercase tracking-widest mb-2 flex items-center justify-between">
                    Crawlers <Server className="w-3 h-3 text-[#00FF66]" />
                 </div>
                 <div className="flex items-end justify-between">
                   <div className="text-4xl font-black tracking-tighter">
                     {loading ? '...' : `${crawlers.filter(c => c.status === 'online').length}/${crawlers.length}`}
                   </div>
                   {!loading && crawlers.length > 0 && (
                     <span className={`text-[10px] font-mono px-1.5 py-0.5 mb-1 ${
                       crawlers.every(c => c.status === 'online')
                         ? 'text-[#00FF66] bg-[#00FF66]/10'
                         : 'text-red-400 bg-red-400/10'
                     }`}>
                       {crawlers.every(c => c.status === 'online') ? 'FULL ↑' : 'DEGRADED'}
                     </span>
                   )}
                 </div>
                 {/* Per-crawler status bars */}
                 <div className="mt-4 space-y-1.5">
                   {loading ? (
                     <div className="h-3 bg-[#1A1A1A] animate-pulse rounded-sm" />
                   ) : crawlers.length === 0 ? (
                     <div className="text-[#606060] font-mono text-[10px]">No crawlers detected</div>
                   ) : crawlers.map((c, i) => (
                     <div key={i} className="flex items-center gap-2">
                       <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.status === 'online' ? 'bg-[#00FF66] animate-pulse' : 'bg-red-500'}`} />
                       <span className="font-mono text-[10px] text-[#606060] flex-1 truncate">{c.name}</span>
                       <span className={`font-mono text-[10px] ${c.status === 'online' ? 'text-[#00FF66]' : 'text-red-400'}`}>{c.status.toUpperCase()}</span>
                     </div>
                   ))}
                 </div>
              </div>
           </div>

          {/* TAB CONTENT */}
           <div className="flex-1 bg-[#050505] border border-[#333333] p-6 md:p-8 relative hex-panel overflow-hidden transition-all duration-300">

             {/* RAG COMMAND HUB */}
             {activeTab === 'hub' && (
               <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                     <div>
                        <h2 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                          <Database className="text-[#00F2FF]" /> RAG Knowledge Bases
                        </h2>
                        <p className="text-[#A0A0A0] font-mono text-xs mt-1">{datasets.length} datasets via Dify API &middot; {totalDocs} docs &middot; {totalTokens.toLocaleString()} tokens</p>
                     </div>
                     <Button variant="cyber" size="sm" className="border-[#00F2FF] text-[#00F2FF] hover:bg-[#00F2FF] hover:text-white" onClick={fetchData}>
                       <RefreshCw className="w-4 h-4 mr-2" /> Sync
                     </Button>
                  </div>

                  {errorDocs > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/50 p-4 font-mono text-sm flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
                      <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-yellow-500 font-bold mb-1 uppercase tracking-wider">{errorDocs} embedding errors detected</div>
                        <div className="text-[#A0A0A0] text-xs">Google Gemini embedding API rate limit may be exhausted. Open Dify UI to retry failed documents.</div>
                  </div>
                    </div>
                  )}
               </div>
               )}

              {/* URL INGESTION */}
              {activeTab === 'ingest' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div>
                    <h2 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                      <Globe className="text-[#00F2FF]" /> URL Ingestion
                      {budget?.health?.dryRun && <span className="text-[10px] bg-[#FFA500]/20 text-[#FFA500] px-2 py-0.5 rounded-sm font-normal">DRY-RUN</span>}
                    </h2>
                    <p className="text-[#A0A0A0] font-mono text-xs mt-1">Paste URLs (one per line). Ingest → crawl & index immediately. Enqueue → add to batch queue for later.</p>
                  </div>
                  <div className="space-y-3 bg-[#0A0A0B] border border-[#333] p-4">
                    <textarea value={ingestUrl} onChange={(e) => setIngestUrl(e.target.value)} placeholder="https://betaflight.com/wiki/tuning&#10;https://oscarliang.com/best-motors&#10;https://fpv.wtf/tuning" rows={5} className="w-full bg-black border border-[#333] text-white font-mono text-sm p-3 focus:border-[#00F2FF] focus:outline-none resize-y" />
                    <div className="flex gap-3 items-center">
                      <input value={ingestDataset} onChange={(e) => setIngestDataset(e.target.value)} placeholder="Dataset (auto-detect if empty)" className="flex-1 bg-black border border-[#333] text-white font-mono text-sm p-3 focus:border-[#00F2FF] focus:outline-none" />
                      <Button variant="cyber" size="sm" className="border-[#00F2FF] text-[#00F2FF] hover:bg-[#00F2FF] hover:text-white" onClick={handleIngest} disabled={ingesting}>
                        {ingesting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Crawling...</> : <><Send className="w-4 h-4 mr-2" /> Ingest Now</>}
                      </Button>
                      <Button variant="outline" size="sm" className="border-[#333] text-[#A0A0A0] text-xs" onClick={() => {
                        const urls = ingestUrl.split('\n').map((u: string) => u.trim()).filter(Boolean);
                        fetch('/api/admin/crawl-queue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'enqueue', urls, dataset: ingestDataset }) })
                          .then(r => r.json()).then(d => { setIngestResults([{ url: `${d.enqueued} URLs`, status: 'enqueued', dataset: 'queue', size: d.enqueued }]); });
                      }}>
                        Enqueue
                      </Button>
                    </div>
                  </div>
                  {ingestResults.length > 0 && (
                    <div className="space-y-2">
                      {ingestResults.map((r: any, i: number) => (
                        <div key={i} className={`p-3 border font-mono text-xs flex items-center gap-3 ${r.status === 'success' ? 'border-[#00FF66]/30 bg-[#00FF66]/5' : 'border-[#FF4444]/30 bg-[#FF4444]/5'}`}>
                          {r.status === 'success' ? <CheckCircle2 className="w-4 h-4 text-[#00FF66] shrink-0" /> : <XCircle className="w-4 h-4 text-[#FF4444] shrink-0" />}
                          <span className="text-white truncate flex-1">{r.url}</span>
                          <span className="text-[#A0A0A0]">{r.dataset || '—'}</span>
                          <span className={r.status === 'success' ? 'text-[#00FF66]' : 'text-[#FF4444]'}>{r.status}</span>
                          {r.size && <span className="text-[#666]">{r.size.toLocaleString()} chars</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {ingestResults.length === 0 && (
                    <div className="text-[#A0A0A0] font-mono text-sm py-8 text-center">Enter URLs above and click Ingest to crawl and index content into Dify.</div>
                  )}
                </div>
              )}

              {/* CONTENT GEN */}
              {activeTab === 'content' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div>
                    <h2 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                      <Pen className="text-[#FF5C00]" /> AI Content Generator
                    </h2>
                    <p className="text-[#A0A0A0] font-mono text-xs mt-1">Generate page content using FPV Expert AI via Dify API.</p>
                  </div>
                  <div className="space-y-3 bg-[#0A0A0B] border border-[#333] p-4">
                    <div className="flex gap-3 flex-wrap">
                      <select value={contentPage} onChange={(e) => setContentPage(e.target.value)} className="bg-black border border-[#333] text-white font-mono text-sm px-4 py-3 focus:border-[#FF5C00] focus:outline-none">
                        <option value="">Select content type...</option>
                        <option value="roadmap">Pilot Roadmap</option><option value="glossary">FPV Glossary</option>
                        <option value="workshop">Workshop Masterclass</option><option value="tech-article">Technical Article</option>
                        <option value="product-review">Product Review</option><option value="build-guide">Build Guide</option>
                        <option value="comparison">Comparison Page</option><option value="troubleshooting">Troubleshooting</option>
                        <option value="regulation-guide">Regulation Guide</option><option value="community-roundup">Community Roundup</option>
                      </select>
                      <input value={contentPrompt} onChange={(e) => setContentPrompt(e.target.value)} placeholder="Custom prompt (optional)" className="flex-1 bg-black border border-[#333] text-white font-mono text-sm p-3 focus:border-[#FF5C00] focus:outline-none" />
                      <Button variant="cyber" size="sm" className="border-[#FF5C00] text-[#FF5C00] hover:bg-[#FF5C00] hover:text-white" onClick={handleContentGen} disabled={contentLoading || !contentPage}>
                        {contentLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate</>}
                      </Button>
                    </div>
                  </div>
                  {contentResult && (
                    <div className="space-y-4 bg-[#0A0A0B] border border-[#333] p-6">
                      {contentResult.error ? (
                        <div className="text-[#FF4444] font-mono text-sm">
                          <div className="font-bold mb-1">Error</div>
                          <div>{contentResult.error}</div>
                          {contentResult.detail && <div className="text-[#A0A0A0] text-xs mt-1">{contentResult.detail.slice(0, 200)}</div>}
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#00FF66]" />
                            <span className="text-white font-mono">{contentResult.page}</span>
                            {contentResult.saved && <span className="text-[#00FF66] text-xs font-mono">Saved: {contentResult.saved}</span>}
                          </div>
                          {contentResult.sources?.length > 0 && (
                            <div>
                              <h4 className="text-[10px] font-mono uppercase text-[#A0A0A0] tracking-widest mb-2">Sources ({contentResult.sources.length})</h4>
                              {contentResult.sources.map((s: any, i: number) => (
                                <div key={i} className="text-xs text-[#A0A0A0] font-mono p-2 bg-[#111] border border-[#1A1A1A] mb-1">
                                  <span className="text-[#00F2FF]">{s.dataset}</span>: {s.content.slice(0, 150)}...
                                  <span className="text-[#00FF66] ml-2">score: {s.score?.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {contentResult.rawAnswer && (
                            <div>
                              <h4 className="text-[10px] font-mono uppercase text-[#A0A0A0] tracking-widest mb-2">Generated Content Preview</h4>
                              <pre className="text-xs text-[#A0A0A0] font-mono bg-[#111] p-3 border border-[#1A1A1A] max-h-64 overflow-y-auto whitespace-pre-wrap">{contentResult.rawAnswer}</pre>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  {!contentResult && (
                    <div className="text-[#A0A0A0] font-mono text-sm py-8 text-center">Select a content type and click Generate to create AI-powered FPV content.</div>
                  )}
                </div>
              )}

              {/* CRAWL LOGS */}
              {activeTab === 'logs' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                        <Clock className="text-[#FFD700]" /> Crawl Logs
                      </h2>
                      <p className="text-[#A0A0A0] font-mono text-xs mt-1">Recent document ingestion activity across all datasets.</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-[#333] text-[#A0A0A0]" onClick={fetchLogs} disabled={logsLoading}>
                      <RefreshCw className={`w-4 h-4 mr-2 ${logsLoading ? 'animate-spin' : ''}`} /> Refresh
                    </Button>
                  </div>
                  {logsLoading ? (
                    <div className="text-[#A0A0A0] font-mono text-sm py-8 text-center"><Loader2 className="w-4 h-4 inline animate-spin mr-2" />Loading logs...</div>
                  ) : logs.length === 0 ? (
                    <div className="text-[#A0A0A0] font-mono text-sm py-8 text-center">No crawl logs found. Index content via URL Ingestion or Dify UI.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs">
                        <thead>
                          <tr className="border-b border-[#333] text-[#A0A0A0] text-[10px] uppercase tracking-widest bg-[#111]">
                            <th className="p-3 font-normal">Dataset</th>
                            <th className="p-3 font-normal">Document</th>
                            <th className="p-3 font-normal">Status</th>
                            <th className="p-3 font-normal">Tokens</th>
                            <th className="p-3 font-normal">Date</th>
                            <th className="p-3 font-normal">Error</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1A1A1A]">
                          {logs.map((l: any) => (
                            <tr key={l.id} className="hover:bg-[#111]">
                              <td className="p-3 text-[#00F2FF]">{l.dataset}</td>
                              <td className="p-3 text-white truncate max-w-[120px]" title={l.name}>{l.name}</td>
                              <td className={`p-3 ${l.status === 'completed' ? 'text-[#00FF66]' : 'text-[#FF4444]'}`}>{l.status}</td>
                              <td className="p-3 text-[#A0A0A0]">{l.tokens?.toLocaleString() || '—'}</td>
                              <td className="p-3 text-[#666] text-[10px]">{l.createdAt?.slice(0, 16)?.replace('T', ' ') || '—'}</td>
                              <td className="p-3 text-[#FF4444] text-[10px] max-w-[200px] truncate">{l.error?.slice(0, 40) || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {!logsLoading && logs.length > 0 && (
                    <div className="text-[#666] text-[10px] font-mono">Showing {logs.length} logs</div>
                  )}
                </div>
              )}

              {/* RETRIEVAL TEST */}
              {activeTab === 'retrieval' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div>
                    <h2 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                      <Search className="text-[#A855F7]" /> Retrieval Test
                    </h2>
                    <p className="text-[#A0A0A0] font-mono text-xs mt-1">Test the RAG knowledge base by querying the FPV Expert AI with retrieval.</p>
                  </div>
                  <div className="flex gap-3 bg-[#0A0A0B] border border-[#333] p-4">
                    <input value={retrievalQuery} onChange={(e) => setRetrievalQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRetrievalTest()} placeholder="e.g. How do I tune PIDs on a 5 inch?" className="flex-1 bg-black border border-[#333] text-white font-mono text-sm p-3 focus:border-[#A855F7] focus:outline-none" />
                    <Button variant="cyber" size="sm" className="border-[#A855F7] text-[#A855F7] hover:bg-[#A855F7] hover:text-white" onClick={handleRetrievalTest} disabled={retrievalLoading}>
                      {retrievalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>
                  {retrievalResult && (
                    <div className="space-y-4">
                      {retrievalResult.error ? (
                        <div className="bg-[#FF4444]/10 border border-[#FF4444]/50 p-4 font-mono text-sm">
                          <div className="text-[#FF4444] font-bold mb-1">Error: {retrievalResult.error}</div>
                          {retrievalResult.detail && <div className="text-[#A0A0A0] text-xs">{retrievalResult.detail.slice(0, 200)}</div>}
                          {retrievalResult.hint && <div className="text-yellow-500 text-xs mt-1">{retrievalResult.hint}</div>}
                        </div>
                      ) : (
                        <>
                          <div className="bg-[#0A0A0B] border border-[#333] p-4">
                            <h4 className="text-[10px] font-mono uppercase text-[#A0A0A0] tracking-widest mb-2">AI Answer</h4>
                            <p className="text-sm text-white font-mono leading-relaxed">{retrievalResult.answer}</p>
                          </div>
                          {retrievalResult.retrieverResources?.length > 0 && (
                            <div>
                              <h4 className="text-[10px] font-mono uppercase text-[#A0A0A0] tracking-widest mb-2">Retrieved Chunks ({retrievalResult.retrieverResources.length})</h4>
                              {retrievalResult.retrieverResources.map((r: any, i: number) => (
                                <div key={i} className="p-3 bg-[#0A0A0B] border border-[#222] mb-2 font-mono text-xs">
                                  <div className="flex justify-between mb-1">
                                    <span className="text-[#00F2FF]">{r.datasetName}</span>
                                    <span className="text-[#00FF66]">score: {r.score?.toFixed(3)}</span>
                                  </div>
                                  <div className="text-[#A0A0A0] leading-relaxed">{r.content}</div>
                                  <div className="text-[#666] text-[10px] mt-1">{r.documentName}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  {!retrievalResult && (
                    <div className="text-[#A0A0A0] font-mono text-sm py-8 text-center">Enter a query to test the RAG knowledge base retrieval quality.</div>
                  )}
                </div>
              )}


             {/* SPONSORS TAB */}
              {activeTab === 'sponsors' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="flex justify-between items-center">
                     <div>
                       <h2 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                         <BadgeDollarSign className="text-[#FF5C00]" /> Sponsor Management
                       </h2>
                       <p className="text-[#A0A0A0] font-mono text-xs mt-1">Phase 1: Human-controlled. Profiles, products, budgets, priority.</p>
                     </div>
                     <div className="flex gap-2">
                       <button
                         onClick={() => setSponsorView('manage')}
                         className={`text-xs font-mono px-3 py-2 border rounded-sm transition-colors ${sponsorView === 'manage' ? 'bg-[#FF5C00]/20 border-[#FF5C00] text-[#FF5C00]' : 'border-[#333] text-[#A0A0A0] hover:border-[#555]'}`}
                       >
                         Manage
                       </button>
                       <button
                         onClick={() => setSponsorView('dashboard')}
                         className={`text-xs font-mono px-3 py-2 border rounded-sm transition-colors flex items-center gap-1 ${sponsorView === 'dashboard' ? 'bg-[#00F2FF]/20 border-[#00F2FF] text-[#00F2FF]' : 'border-[#333] text-[#A0A0A0] hover:border-[#555]'}`}
                       >
                         <LayoutDashboard className="w-3 h-3" /> Dashboard
                       </button>
                       <Button variant="outline" size="sm" className="border-[#333333] text-[#A0A0A0]" onClick={fetchSponsors}><RefreshCw className="w-4 h-4 mr-2" /> Refresh</Button>
                     </div>
                   </div>

                   {sponsorView === 'dashboard' ? (
                     <SponsorDashboard />
                   ) : (
                     <>

                  {/* Add Sponsor Form */}
                  <div className="space-y-3 bg-[#0A0A0B] border border-[#333333] p-4">
                    <h3 className="text-xs font-mono uppercase text-[#A0A0A0] tracking-widest">New Sponsor</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input value={spName} onChange={(e) => setSpName(e.target.value)} placeholder="Sponsor Name *" className="bg-black border border-[#333333] text-white font-mono text-sm p-3 focus:border-[#FF5C00] focus:outline-none" />
                      <input value={spUrl} onChange={(e) => setSpUrl(e.target.value)} placeholder="Website URL *" className="bg-black border border-[#333333] text-white font-mono text-sm p-3 focus:border-[#FF5C00] focus:outline-none" />
                      <input value={spBudget} onChange={(e) => setSpBudget(e.target.value)} placeholder="Budget" className="bg-black border border-[#333333] text-white font-mono text-sm p-3 focus:border-[#FF5C00] focus:outline-none" />
                      <input type="number" value={spPriority} onChange={(e) => setSpPriority(Number(e.target.value))} placeholder="Priority (0-10)" className="bg-black border border-[#333333] text-white font-mono text-sm p-3 focus:border-[#FF5C00] focus:outline-none" />
                    </div>
                    <div className="flex gap-4 flex-wrap">
                      <select value={spCategory} onChange={(e) => setSpCategory(e.target.value)} className="bg-black border border-[#333333] text-white font-mono text-sm px-4 py-2">
                        <option>Drone Parts</option><option>FPV Goggles</option><option>Radio & RX</option><option>Batteries</option><option>Tools</option><option>Software</option>
                      </select>
                      <select value={spType} onChange={(e) => setSpType(e.target.value)} className="bg-black border border-[#333333] text-white font-mono text-sm px-4 py-2">
                        <option value="manufacturer">Manufacturer</option><option value="retailer">Retailer</option><option value="software">Software</option><option value="service">Service</option>
                      </select>
                      <select value={spRegion} onChange={(e) => setSpRegion(e.target.value)} className="bg-black border border-[#333333] text-white font-mono text-sm px-4 py-2">
                        <option value="global">Global</option><option value="tr">TR</option><option value="eu">EU</option><option value="us">US</option>
                      </select>
                      <Button variant="cyber" size="sm" className="border-[#FF5C00] text-[#FF5C00] hover:bg-[#FF5C00] hover:text-white" onClick={addSponsor}><Plus className="w-4 h-4 mr-2" /> Add Sponsor</Button>
                    </div>
                  </div>

                  {/* Sponsor List */}
                  {sponsors.length === 0 ? (
                    <div className="text-[#A0A0A0] font-mono text-sm py-8 text-center">No sponsors yet.</div>
                  ) : (
                    <div className="space-y-4">
                      {sponsors.map((s: any) => (
                        <div key={s.id} className="bg-[#0A0A0B] border border-[#333333] hover:border-[#FF5C00]/30 transition-colors">
                          <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${s.active ? 'bg-[#00FF66] shadow-[0_0_8px_#00FF66]' : 'bg-red-500'}`} />
                                <span className="text-white font-bold uppercase text-sm">{s.name}</span>
                                <span className="text-[#A0A0A0] text-[10px]">{s.type}</span>
                                <span className="text-[#FF5C00] text-[10px]">P:{s.priority}</span>
                              </div>
                              <div className="text-[#A0A0A0] text-xs mt-1 ml-5 flex gap-4 flex-wrap">
                                <span>{s.url}</span>
                                <span className="text-[#00FF66]">{s.budget}</span>
                                <span>{s.category} &middot; {s.region}</span>
                                <span className="text-[#00F2FF]">{s.products?.length || 0} products</span>
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button onClick={() => setSelectedSponsor(selectedSponsor === s.id ? null : s.id)} className="text-[#00F2FF] hover:text-white text-xs font-mono px-3 py-1 border border-[#00F2FF]/30 rounded-sm">
                                {selectedSponsor === s.id ? 'Close' : 'Products'}
                              </button>
                              <button onClick={() => fetch('/api/admin/sponsors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle', id: s.id }) }).then(() => fetchSponsors())} className={`text-xs font-mono px-3 py-1 border rounded-sm ${s.active ? 'text-[#00FF66] border-[#00FF66]/30' : 'text-red-500 border-red-500/30'}`}>
                                {s.active ? 'ON' : 'OFF'}
                              </button>
                              <button onClick={() => deleteSponsor(s.id)} className="text-red-500 hover:text-white px-2"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </div>

                          {/* Sponsored Products */}
                          {selectedSponsor === s.id && (
                            <div className="border-t border-[#333333] p-4 space-y-3 bg-black/50">
                              <h4 className="text-[10px] font-mono uppercase text-[#A0A0A0] tracking-widest">Sponsored Products</h4>
                              {s.products?.map((p: any, i: number) => (
                                <div key={i} className="flex justify-between items-center text-xs bg-[#0A0A0B] p-2 border border-[#222]">
                                  <div>
                                    <span className="text-white">{p.name}</span>
                                    <span className="text-[#A0A0A0] ml-2">{p.url}</span>
                                  </div>
                                  <button onClick={() => removeSponsorProduct(s.id, i)} className="text-red-500 hover:text-white"><Trash2 className="w-3 h-3" /></button>
                                </div>
                              ))}
                              <div className="flex gap-2">
                                <input value={spProductName} onChange={(e) => setSpProductName(e.target.value)} placeholder="Product name" className="flex-1 bg-black border border-[#333333] text-white font-mono text-xs p-2 focus:border-[#FF5C00] focus:outline-none" />
                                <input value={spProductUrl} onChange={(e) => setSpProductUrl(e.target.value)} placeholder="URL" className="flex-1 bg-black border border-[#333333] text-white font-mono text-xs p-2 focus:border-[#FF5C00] focus:outline-none" />
                                <Button variant="cyber" size="sm" className="border-[#00F2FF] text-[#00F2FF] hover:bg-[#00F2FF] hover:text-white text-xs" onClick={() => addSponsorProduct(s.id)}><Plus className="w-3 h-3" /></Button>
                              </div>
                            </div>
                  )}

                  {/* Budget Status */}
                  {budget && (
                    <div className={`p-4 border font-mono text-sm flex items-start gap-4 animate-in fade-in ${budget.budget?.usage_pct > 80 ? 'bg-red-500/10 border-red-500/50' : budget.budget?.usage_pct > 50 ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-[#0A0A0B] border-[#333]'}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs uppercase tracking-widest ${budget.budget?.usage_pct > 80 ? 'text-red-500' : budget.budget?.usage_pct > 50 ? 'text-yellow-500' : 'text-[#00FF66]'}`}>
                            API Rate-Limit Budget
                          </span>
                          {budget.health?.dryRun && <span className="text-[10px] bg-[#FFA500]/20 text-[#FFA500] px-2 py-0.5 rounded-sm">DRY-RUN MODE</span>}
                        </div>
                        <div className="w-full bg-[#111] h-2 mb-1 overflow-hidden">
                          <div className={`h-full transition-all ${budget.budget?.usage_pct > 80 ? 'bg-red-500' : budget.budget?.usage_pct > 50 ? 'bg-yellow-500' : 'bg-[#00FF66]'}`}
                               style={{ width: `${budget.budget?.usage_pct || 0}%` }} />
                        </div>
                        <div className="flex gap-4 text-xs text-[#A0A0A0]">
                          <span>{budget.budget?.used_today}/{budget.budget?.daily_limit} tokens used</span>
                          <span>{budget.budget?.calls_today} calls today</span>
                          <span>{budget.budget?.errors_today} errors</span>
                          <span className="text-[#666]">Reset: {budget.budget?.reset_at?.slice(0, 10)}</span>
                        </div>
                        <div className="flex gap-4 text-xs mt-1">
                          <span className="text-[#A855F7]">Groq: {budget.budget?.groq_calls_today || 0} calls</span>
                          {budget.budget?.model_breakdown && (
                            <>
                              <span className="text-[#00F2FF]">Gemini: {budget.budget.model_breakdown.gemini}</span>
                              <span className="text-[#A855F7]">Groq: {budget.budget.model_breakdown.groq}</span>
                              <span className="text-[#00FF66]">Cache: {budget.budget.model_breakdown.cached} hits</span>
                              {budget.budget.savings_estimate > 0 && <span className="text-[#FFD700]">Saved: ${budget.budget.savings_estimate}</span>}
                            </>
                          )}
                          {budget.cache && <span className="text-[#666]">Hit rate: {Math.round(budget.cache.hit_rate * 100)}%</span>}
                        </div>
                      </div>
                      <button onClick={() => fetch('/api/admin/budget', { method: 'POST' }).then(() => fetchBudget())} className="text-[10px] text-[#A0A0A0] hover:text-white font-mono px-2 py-1 border border-[#333] rounded-sm shrink-0">
                        Reset Budget
                      </button>
                    </div>
                  )}
                </div>
                      ))}
                    </div>
                  )}
                  </>
                )}
               </div>
              )}

              {/* AFFILIATES */}
             {activeTab === 'affiliates' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div>
                    <h2 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                      <ShoppingCart className="text-[#FF5C00]" /> Monetization Hub
                    </h2>
                    <p className="text-[#A0A0A0] font-mono text-xs mt-1">Phase 1: Human-controlled. Products, campaigns, CTAs.</p>
                  </div>

                  {/* Products */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-mono uppercase text-[#A0A0A0] tracking-widest border-b border-[#333333] pb-2">Affiliate Products</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input value={affProduct} onChange={(e) => setAffProduct(e.target.value)} placeholder="Product name" className="bg-[#0A0A0B] border border-[#333333] text-white font-mono text-sm p-3 focus:border-[#FF5C00] focus:outline-none" />
                      <input value={affLink} onChange={(e) => setAffLink(e.target.value)} placeholder="Affiliate URL" className="bg-[#0A0A0B] border border-[#333333] text-white font-mono text-sm p-3 focus:border-[#FF5C00] focus:outline-none" />
                      <input value={affPrice} onChange={(e) => setAffPrice(e.target.value)} placeholder="Price" className="bg-[#0A0A0B] border border-[#333333] text-white font-mono text-sm p-3 focus:border-[#FF5C00] focus:outline-none" />
                      <Button variant="cyber" size="sm" className="border-[#FF5C00] text-[#FF5C00] hover:bg-[#FF5C00] hover:text-white" onClick={addAffiliate}><Plus className="w-4 h-4 mr-2" /> Add Product</Button>
                    </div>
                    <div className="flex gap-4 flex-wrap">
                      <select value={affCategory} onChange={(e) => setAffCategory(e.target.value)} className="bg-[#0A0A0B] border border-[#333333] text-white font-mono text-sm px-4 py-2">
                        <option>Drone Parts</option><option>FPV Goggles</option><option>Radio & RX</option><option>Batteries</option><option>Tools</option>
                      </select>
                      <select value={affNetwork} onChange={(e) => setAffNetwork(e.target.value)} className="bg-[#0A0A0B] border border-[#333333] text-white font-mono text-sm px-4 py-2">
                        <option>Amazon</option><option>Banggood</option><option>GetFPV</option><option>RaceDayQuads</option>
                      </select>
                      <Button variant="outline" size="sm" className="border-[#333333] text-[#A0A0A0]" onClick={fetchAffiliates}><RefreshCw className="w-4 h-4 mr-2" /> Refresh</Button>
                    </div>
                    {affiliates.length > 0 && (
                      <div className="overflow-x-auto border border-[#333333] bg-[#0A0A0B] max-h-60 overflow-y-auto">
                        <table className="w-full text-left font-mono text-xs"><thead><tr className="border-b border-[#333333] text-[#A0A0A0] text-[10px] uppercase tracking-widest bg-[#111]"><th className="p-3 font-normal">Product</th><th className="p-3 font-normal">Category</th><th className="p-3 font-normal">Price</th><th className="p-3 font-normal">Network</th><th className="p-3 font-normal w-16"></th></tr></thead>
                          <tbody className="divide-y divide-[#1A1A1A]">{affiliates.map((a: any) => (<tr key={a.id} className="hover:bg-[#111]"><td className="p-3 text-white">{a.product}</td><td className="p-3 text-[#A0A0A0]">{a.category}</td><td className="p-3 text-[#00FF66]">{a.price}</td><td className="p-3 text-[#00F2FF]">{a.network}</td><td className="p-3"><button onClick={() => deleteAffiliate(a.id)} className="text-red-500 hover:text-white"><Trash2 className="w-3 h-3" /></button></td></tr>))}</tbody></table>
                      </div>
                    )}

            </div>

                  {/* Campaigns */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-mono uppercase text-[#A0A0A0] tracking-widest border-b border-[#333333] pb-2">Campaigns</h3>
                    <div className="flex gap-3">
                      <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Campaign name" className="flex-1 bg-[#0A0A0B] border border-[#333333] text-white font-mono text-sm p-3 focus:border-[#FF5C00] focus:outline-none" />
                      <Button variant="cyber" size="sm" className="border-[#FF5C00] text-[#FF5C00] hover:bg-[#FF5C00] hover:text-white" onClick={addCampaign}><Plus className="w-4 h-4" /></Button>
                    </div>
                    {campaigns.map((c: any) => (
                      <div key={c.id} className="bg-[#0A0A0B] border border-[#333333] p-3 flex justify-between items-center">
                        <div><span className="text-white text-sm">{c.name}</span><span className="text-[#A0A0A0] text-[10px] ml-2">{c.products?.length || 0} products</span></div>
                        <span className={`text-[10px] font-mono ${c.active ? 'text-[#00FF66]' : 'text-red-500'}`}>{c.active ? 'ACTIVE' : 'PAUSED'}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Management */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-mono uppercase text-[#A0A0A0] tracking-widest border-b border-[#333333] pb-2">CTA Management</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="CTA text" className="bg-[#0A0A0B] border border-[#333333] text-white font-mono text-sm p-3 focus:border-[#FF5C00] focus:outline-none" />
                      <select value={ctaPlacement} onChange={(e) => setCtaPlacement(e.target.value)} className="bg-[#0A0A0B] border border-[#333333] text-white font-mono text-sm px-4 py-3">
                        <option value="bottom-right">Bottom Right (terminal)</option>
                        <option value="top-right">Top Right (first scan)</option>
                        <option value="inline">Inline (diagonal)</option>
                        <option value="sticky">Sticky</option>
                      </select>
                      <input type="color" value={ctaColor} onChange={(e) => setCtaColor(e.target.value)} className="bg-[#0A0A0B] border border-[#333333] h-12 w-full cursor-pointer" />
                      <Button variant="cyber" size="sm" className="border-[#FF5C00] text-[#FF5C00] hover:bg-[#FF5C00] hover:text-white" onClick={addCta}><Plus className="w-4 h-4 mr-2" /> Add CTA</Button>
                    </div>
                    {ctas.map((c: any) => (
                      <div key={c.id} className="bg-[#0A0A0B] border border-[#333333] p-3 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                          <span className="text-white text-sm">{c.text}</span>
                          <span className="text-[#A0A0A0] text-[10px]">{c.placement}</span>
                        </div>
                        <span className={`text-[10px] font-mono ${c.active ? 'text-[#00FF66]' : 'text-red-500'}`}>{c.active ? 'ON' : 'OFF'}</span>
                      </div>
                    ))}
                  </div>
               </div>
             )}

             {/* RAW CONTENT BROWSER */}
             {activeTab === 'raw-browser' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                        <Database className="text-[#00F2FF]" /> Raw Content Archive
                      </h2>
                      <p className="text-[#A0A0A0] font-mono text-xs mt-1">Full markdown stored on PostgreSQL. Never chunked, never deleted.</p>
                    </div>
                    <Button variant="cyber" size="sm" className="border-[#00F2FF] text-[#00F2FF] hover:bg-[#00F2FF] hover:text-white" onClick={async () => {
                      const r = await fetch('/api/admin/raw-content');
                      setRawContent((await r.json()).raw_content || []);
                    }}><RefreshCw className="w-4 h-4 mr-2" /> Load</Button>
                  </div>

                  <div className="flex gap-3">
                    <input value={rawFilter} onChange={(e) => setRawFilter(e.target.value)} placeholder="Filter by domain or dataset..." className="flex-1 bg-[#0A0A0B] border border-[#333333] text-white font-mono text-sm p-3 focus:border-[#00F2FF] focus:outline-none" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#0A0A0B] border border-[#333333] p-4 text-center">
                      <div className="text-3xl font-black text-[#00F2FF]">{rawContent.length || 0}</div>
                      <div className="text-[#A0A0A0] font-mono text-[10px] mt-1">Raw Documents</div>
                    </div>
                    <div className="bg-[#0A0A0B] border border-[#333333] p-4 text-center">
                      <div className="text-3xl font-black text-[#FF5C00]">{datasets.length}</div>
                      <div className="text-[#A0A0A0] font-mono text-[10px] mt-1">Target Datasets</div>
                    </div>
                    <div className="bg-[#0A0A0B] border border-[#333333] p-4 text-center">
                      <div className="text-3xl font-black text-[#00FF66]">{rawContent.filter((c: any) => c.rag_doc_id).length}</div>
                      <div className="text-[#A0A0A0] font-mono text-[10px] mt-1">Indexed to RAG</div>
                    </div>
                  </div>

                  {rawContent.length === 0 && (
                    <div className="text-[#A0A0A0] font-mono text-sm py-8 text-center">
                      Raw storage active. Content populates during next crawl via URL Ingestion.
                    </div>
                  )}
               </div>
             )}

             {activeTab === 'orchestrator' && <OrchestratorTab />}

             {/* SYSTEM HEALTH */}
             {activeTab === 'health' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                        <HeartPulse className="text-[#00FF66]" /> System Health
                      </h2>
                      <p className="text-[#A0A0A0] font-mono text-xs mt-1">Real-time service status across all servers.</p>
                    </div>
                    <Button variant="cyber" size="sm" className="border-[#00FF66] text-[#00FF66] hover:bg-[#00FF66] hover:text-white" onClick={async () => { setHealthLoading(true); const r = await fetch('/api/admin/health'); setHealth(await r.json()); setHealthLoading(false); }}>
                      <RefreshCw className="w-4 h-4 mr-2" /> Scan
                    </Button>
                  </div>

                  {health && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className={`bg-[#0A0A0B] border p-4 text-center ${health.status === 'healthy' ? 'border-[#00FF66]/50' : health.status === 'degraded' ? 'border-yellow-500/50' : 'border-red-500/50'}`}>
                          <div className={`text-2xl font-black ${health.status === 'healthy' ? 'text-[#00FF66]' : health.status === 'degraded' ? 'text-yellow-500' : 'text-red-500'}`}>{health.status.toUpperCase()}</div>
                          <div className="text-[#A0A0A0] font-mono text-[10px] mt-1">{health.services?.filter((s: any) => s.status === 'up').length}/{health.services?.length} up</div>
                        </div>
                        <div className="bg-[#0A0A0B] border border-[#333333] p-4 text-center">
                          <div className="text-2xl font-black text-[#00F2FF]">{health.collectionMs || 0}ms</div>
                          <div className="text-[#A0A0A0] font-mono text-[10px] mt-1">Scan Latency</div>
                        </div>
                        <div className="bg-[#0A0A0B] border border-[#333333] p-4 text-center">
                          <div className="text-2xl font-black text-[#A0A0A0]">{health.collectedAt?.slice(11, 19) || '-'}</div>
                          <div className="text-[#A0A0A0] font-mono text-[10px] mt-1">Last Scan</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {health.services?.map((s: any, i: number) => (
                          <div key={i} className={`bg-[#0A0A0B] border p-4 flex justify-between items-center ${s.status === 'up' ? 'border-[#00FF66]/30' : 'border-red-500/30'}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${s.status === 'up' ? 'bg-[#00FF66] shadow-[0_0_8px_#00FF66]' : 'bg-red-500 shadow-[0_0_8px_red]'}`} />
                              <div>
                                <div className="text-white font-mono text-sm">{s.name}</div>
                                {s.version && <div className="text-[#A0A0A0] text-[10px]">v{s.version}</div>}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-mono text-sm ${s.status === 'up' ? 'text-[#00FF66]' : 'text-red-500'}`}>{s.status}</div>
                              <div className="text-[#A0A0A0] text-[10px]">{s.latency}ms</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!health && !healthLoading && (
                    <div className="text-[#A0A0A0] font-mono text-sm py-8 text-center">Click Scan to check all services.</div>
                  )}
                  {healthLoading && (
                    <div className="text-[#A0A0A0] font-mono text-sm py-8 text-center"><Loader2 className="w-4 h-4 inline animate-spin mr-2" />Scanning servers...</div>
                  )}
                </div>
              )}

              {/* ANALYTICS (nested in health) */}
              {activeTab === 'health' && health && (
                <div className="mt-6 animate-in fade-in duration-300">
                  <AnalyticsDashboard />
                </div>
              )}

              {/* PILOT REGISTRY */}
            {activeTab === 'registry' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                       <h2 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                         <Users className="text-white" /> Pilot Registry
                       </h2>
                       <p className="text-[#A0A0A0] font-mono text-xs mt-1">CRM for community tracking and newsletter management.</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-[#333333] text-white hover:bg-[#FF5C00] hover:text-white hover:border-[#FF5C00] transition-colors rounded-none">
                      <Download className="w-4 h-4 mr-2" /> Export CSV (Beehiiv/ConvertKit)
                    </Button>
                 </div>

                 <div className="overflow-x-auto border border-[#333333] bg-[#0A0A0B]">
                    <table className="w-full text-left font-mono text-sm">
                       <thead>
                          <tr className="border-b border-[#333333] text-[#A0A0A0] text-[10px] uppercase tracking-widest bg-[#111]">
                             <th className="p-4 font-normal">ID</th>
                             <th className="p-4 font-normal">Email Address</th>
                             <th className="p-4 font-normal">Join Date</th>
                             <th className="p-4 font-normal">Acquisition Source</th>
                             <th className="p-4 font-normal text-right">Action</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-[#1A1A1A]">
                          {subscribersData.map((sub) => (
                             <tr key={sub.id} className="hover:bg-[#111] transition-colors group">
                                <td className="p-4 text-[#A0A0A0]">#{sub.id.padStart(4, '0')}</td>
                                <td className="p-4 text-white group-hover:text-[#00F2FF] transition-colors">{sub.email}</td>
                                <td className="p-4 text-[#A0A0A0]">{sub.joined}</td>
                                <td className="p-4 text-[#00F2FF] text-xs">{sub.source}</td>
                                <td className="p-4 text-right">
                                  <button className="text-[#A0A0A0] hover:text-white transition-colors"><ChevronRight className="w-4 h-4 inline" /></button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>

                  {/* Sponsors */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-mono uppercase text-[#A0A0A0] tracking-widest border-b border-[#333333] pb-2 flex justify-between">
                      Sponsors
                      <button onClick={fetchSponsors} className="text-[#00F2FF] hover:text-white"><RefreshCw className="w-3 h-3" /></button>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input value={spName} onChange={(e) => setSpName(e.target.value)} placeholder="Sponsor name" className="bg-[#0A0A0B] border border-[#333333] text-white font-mono text-sm p-3 focus:border-[#FF5C00] focus:outline-none" />
                      <input value={spUrl} onChange={(e) => setSpUrl(e.target.value)} placeholder="URL" className="bg-[#0A0A0B] border border-[#333333] text-white font-mono text-sm p-3 focus:border-[#FF5C00] focus:outline-none" />
                      <input value={spBudget} onChange={(e) => setSpBudget(e.target.value)} placeholder="Budget" className="bg-[#0A0A0B] border border-[#333333] text-white font-mono text-sm p-3 focus:border-[#FF5C00] focus:outline-none" />
                      <Button variant="cyber" size="sm" className="border-[#FF5C00] text-[#FF5C00] hover:bg-[#FF5C00] hover:text-white" onClick={addSponsor}><Plus className="w-4 h-4 mr-2" /> Add Sponsor</Button>
                    </div>
                    {sponsors.map((s: any) => (
                      <div key={s.id} className="bg-[#0A0A0B] border border-[#333333] p-3 flex justify-between items-center">
                        <div>
                          <span className="text-white text-sm">{s.name}</span>
                          <span className="text-[#A0A0A0] text-[10px] ml-2">{s.category} &middot; {s.budget}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-mono ${s.active ? 'text-[#00FF66]' : 'text-red-500'}`}>{s.active ? 'LIVE' : 'OFF'}</span>
                          <button onClick={() => deleteSponsor(s.id)} className="text-red-500 hover:text-white"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
             )}

             {/* TOOL TELEMETRY */}
             {activeTab === 'telemetry' && (
               <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div>
                     <h2 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                       <Activity className="text-[#00F2FF]" /> Analytics & Telemetry
                     </h2>
                     <p className="text-[#A0A0A0] font-mono text-xs mt-1">System metrics from Dify + Crawl4AI + Vercel Analytics.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="bg-[#0A0A0B] border border-[#333333] p-6 text-center">
                        <div className="text-4xl font-black text-[#00F2FF]">{datasets.length}</div>
                        <div className="text-[#A0A0A0] font-mono text-[10px] mt-1 uppercase">Active Datasets</div>
                     </div>
                     <div className="bg-[#0A0A0B] border border-[#333333] p-6 text-center">
                        <div className="text-4xl font-black text-[#FF5C00]">{totalDocs.toLocaleString()}</div>
                        <div className="text-[#A0A0A0] font-mono text-[10px] mt-1 uppercase">Total Documents</div>
                     </div>
                     <div className="bg-[#0A0A0B] border border-[#333333] p-6 text-center">
                        <div className="text-4xl font-black text-[#00FF66]">{totalTokens.toLocaleString()}</div>
                        <div className="text-[#A0A0A0] font-mono text-[10px] mt-1 uppercase">Total Tokens</div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <h3 className="text-xs font-mono uppercase text-[#A0A0A0] tracking-widest border-b border-[#333333] pb-2">Dataset Distribution</h3>
                     <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={datasets.filter((d: any) => d.docCount > 0)}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                           <XAxis dataKey="name" tick={{ fill: '#A0A0A0', fontSize: 8 }} angle={-45} textAnchor="end" height={60} />
                           <YAxis tick={{ fill: '#A0A0A0', fontSize: 8 }} />
                           <Tooltip contentStyle={{ background: '#0A0A0B', border: '1px solid #333' }} />
                           <Bar dataKey="completed" fill="#00FF66" name="Completed" />
                           <Bar dataKey="errors" fill="#FF5C00" name="Errors" />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <h3 className="text-xs font-mono uppercase text-[#A0A0A0] tracking-widest">Crawler Performance</h3>
                        {crawlers.map((c: any, i: number) => (
                          <div key={i} className="bg-[#0A0A0B] border border-[#333333] p-3 flex justify-between">
                            <span className="text-white text-sm">{c.name}</span>
                            <span className={`text-xs font-mono ${c.status === 'online' ? 'text-[#00FF66]' : 'text-red-500'}`}>{c.status}</span>
                          </div>
                        ))}
                     </div>
                     <div className="space-y-2">
                        <h3 className="text-xs font-mono uppercase text-[#A0A0A0] tracking-widest">Affiliate Products</h3>
                        <div className="bg-[#0A0A0B] border border-[#333333] p-4">
                          <div className="text-3xl font-black text-[#FF5C00] text-center">{affiliates.length || 0}</div>
                          <div className="text-[#A0A0A0] font-mono text-[10px] text-center mt-1">Products Tracked</div>
                        </div>
                     </div>
                  </div>
               </div>
             )}

          </div>
        </main>

      </div>
    </div>
  );
}

function OrchestratorTab() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/master?action=health');
      setHealth(await r.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHealth(); }, []);

  if (loading || !health) return <div className="p-4 text-gray-400">Yükleniyor…</div>;

  const statusColor = (s: string) =>
    s === 'ok' ? 'text-green-400' : s === 'degraded' ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
            <Workflow className="text-[#FFD700]" /> Master Orchestrator
          </h2>
          <p className="text-[#A0A0A0] font-mono text-xs mt-1">System-wide health, layers, budget, content gaps.</p>
        </div>
        <span className={`text-sm font-mono font-bold ${statusColor(health.overall)}`}>
          {health.overall.toUpperCase()} — Score: {health.ecosystem_health_score}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {health.stats && (
          <>
            <div className="bg-[#0A0A0B] border border-[#222] p-3 text-center">
              <div className="text-xs text-[#A0A0A0] uppercase tracking-widest">Intents</div>
              <div className="text-xl font-mono text-white">{health.stats.total_intents}</div>
            </div>
            <div className="bg-[#0A0A0B] border border-[#222] p-3 text-center">
              <div className="text-xs text-[#A0A0A0] uppercase tracking-widest">Datasets</div>
              <div className="text-xl font-mono text-white">{health.stats.total_datasets}</div>
            </div>
            <div className="bg-[#0A0A0B] border border-[#222] p-3 text-center">
              <div className="text-xs text-[#A0A0A0] uppercase tracking-widest">Documents</div>
              <div className="text-xl font-mono text-white">{health.stats.total_documents}</div>
            </div>
            <div className="bg-[#0A0A0B] border border-[#222] p-3 text-center">
              <div className="text-xs text-[#A0A0A0] uppercase tracking-widest">Empty</div>
              <div className={`text-xl font-mono ${health.stats.empty_datasets > 0 ? 'text-[#FF4444]' : 'text-[#00FF66]'}`}>{health.stats.empty_datasets}</div>
            </div>
          </>
        )}
      </div>

      <div className="grid gap-2">
        {health.layers?.map((l: any) => (
          <div key={l.name} className="flex items-center justify-between rounded bg-[#0A0A0B] border border-[#222] px-4 py-3">
            <span className="text-sm text-gray-300 font-mono">{l.name}</span>
            <div className="text-right">
              <span className={`text-xs font-mono font-bold ${statusColor(l.status)}`}>{l.status}</span>
              {l.detail && <p className="text-xs text-[#666]">{l.detail}</p>}
            </div>
          </div>
        ))}
      </div>

      {health.content_gaps?.length > 0 && (
        <div className="rounded bg-yellow-500/10 border border-yellow-500/30 p-4">
          <p className="text-xs text-yellow-400 font-mono mb-2 uppercase tracking-widest">Content Gaps ({health.content_gaps.length})</p>
          {health.content_gaps.map((g: string) => (
            <p key={g} className="text-xs text-[#A0A0A0] font-mono">• {g}</p>
          ))}
        </div>
      )}

      <div className="bg-[#0A0A0B] border border-[#222] p-4">
        <p className="text-xs text-[#666] font-mono mb-2 uppercase tracking-widest">Action Endpoints</p>
        <div className="flex flex-wrap gap-1">
          {health.action_endpoints?.map((ep: string) => (
            <span key={ep} className="text-xs font-mono bg-[#111] text-[#A0A0A0] px-2 py-0.5 rounded border border-[#1A1A1A]">
              ?action={ep}
            </span>
          ))}
        </div>
      </div>

      <button onClick={fetchHealth} className="text-xs text-[#A0A0A0] hover:text-white font-mono underline">
        Refresh
      </button>
    </div>
  );
}
