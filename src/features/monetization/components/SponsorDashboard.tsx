'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { Eye, Target, TrendingUp, Shield, Zap, Layers, RefreshCw, type LucideIcon } from 'lucide-react';

interface SponsorMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  contextualEngagement: number;
  retrievalAppearances: number;
  recommendationConfidence: number;
  semanticMatchQuality: number;
}

interface Sponsor {
  id: string;
  name: string;
  category: string;
  priority: number;
  active: boolean;
  trustScore: number;
  visibilityScore: number;
  semanticRelevance: number;
  retrievalPresence: number;
  recommendationExposure: number;
  campaignMetrics: SponsorMetrics;
  products: { name: string; url: string; compatibleWith?: string[] }[];
}

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  suffix?: ReactNode;
  color?: string;
};

function MetricCard({ icon: Icon, label, value, suffix = '', color = '#00F2FF' }: MetricCardProps) {
  return (
    <div className="bg-[#0A0A0B] border border-[#222] p-4 group hover:border-[#333] transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xs text-[#A0A0A0] uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-2xl font-mono font-bold text-white">
        {value}{suffix}
      </div>
    </div>
  );
}

function TrustBar({ score, label }: { score: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#A0A0A0] w-36">{label}</span>
      <div className="flex-1 bg-[#111] h-2 overflow-hidden">
        <div
          className="h-full transition-all"
          style={{
            width: `${score}%`,
            background: score >= 80 ? '#00FF66' : score >= 50 ? '#FFA500' : '#FF4444',
          }}
        />
      </div>
      <span className="text-xs font-mono text-white w-10 text-right">{score}</span>
    </div>
  );
}

function EcosystemNode({ name, connections, color = '#00F2FF' }: { name: string; connections: number; color?: string }) {
  return (
    <div className="relative">
      <div className="px-3 py-2 border text-xs font-mono text-center" style={{ borderColor: color, color, background: `${color}10` }}>
        {name}
      </div>
      {connections > 0 && (
        <div className="text-[10px] text-[#666] text-center mt-1">{connections} connections</div>
      )}
    </div>
  );
}

export default function SponsorDashboard() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSponsor, setSelectedSponsor] = useState<string | null>(null);
  const [insights, setInsights] = useState<any>(null);

  const generateInsights = useCallback((sponsors: Sponsor[]) => {
    const active = sponsors.filter(s => s.active);
    if (active.length === 0) return;

    const totalImpressions = active.reduce((s, sp) => s + sp.campaignMetrics.impressions, 0);
    const totalClicks = active.reduce((s, sp) => s + sp.campaignMetrics.clicks, 0);
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
    const avgTrust = Math.round(active.reduce((s, sp) => s + sp.trustScore, 0) / active.length);
    const avgRelevance = Math.round(active.reduce((s, sp) => s + sp.semanticRelevance, 0) / active.length);
    const topSponsor = [...active].sort((a, b) => b.visibilityScore - a.visibilityScore)[0];
    const growthOpportunity = active.filter(s => s.visibilityScore < 50 && s.trustScore > 70);

    setInsights({
      totalImpressions, totalClicks, avgCtr, avgTrust, avgRelevance,
      activeCount: active.length,
      topSponsor: topSponsor?.name || 'N/A',
      topSponsorScore: topSponsor?.visibilityScore || 0,
      growthOpportunities: growthOpportunity.length,
      recommendationQuality: Math.round(active.reduce((s, sp) => s + sp.campaignMetrics.recommendationConfidence, 0) / active.length),
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sponsors?type=all');
      const data = await res.json();
      setSponsors(data.sponsors || []);
      generateInsights(data.sponsors || []);
    } catch {}
    setLoading(false);
  }, [generateInsights]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchData();
    });
  }, [fetchData]);

  const selected = sponsors.find(s => s.id === selectedSponsor);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[#FF5C00]" />
          <h2 className="text-white font-mono text-lg">Sponsor Dashboard</h2>
        </div>
        <button onClick={fetchData} className="text-xs text-[#A0A0A0] hover:text-white flex items-center gap-1 transition-colors">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-[#A0A0A0] text-sm">Loading sponsor data...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard icon={Eye} label="Total Impressions" value={insights?.totalImpressions || 0} color="#00F2FF" />
            <MetricCard icon={TrendingUp} label="Total Clicks" value={insights?.totalClicks || 0} color="#00FF66" />
            <MetricCard icon={Target} label="Avg CTR" value={insights?.avgCtr?.toFixed(2) || '0'} suffix="%" color="#FF5C00" />
            <MetricCard icon={Shield} label="Avg Trust" value={insights?.avgTrust || 0} suffix="/100" color="#FFD700" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <MetricCard icon={Zap} label="Active Sponsors" value={insights?.activeCount || 0} color="#A855F7" />
            <MetricCard icon={Layers} label="Avg Relevance" value={insights?.avgRelevance || 0} suffix="/100" color="#38BDF8" />
            <MetricCard icon={Target} label="Rec. Quality" value={insights?.recommendationQuality || 0} suffix="/100" color="#F472B6" />
          </div>

          {/* Sponsor Insights */}
          {insights && (
            <div className="bg-[#0A0A0B] border border-[#222] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-[#FFD700]" />
                <h3 className="text-white font-mono text-sm uppercase tracking-widest">Sponsor Insights</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-[#111] border border-[#222]">
                  <div className="text-[#A0A0A0] text-xs mb-1">Top Sponsor</div>
                  <div className="text-white font-mono">{insights.topSponsor}</div>
                  <div className="text-[#00FF66] text-xs mt-1">Score: {insights.topSponsorScore}/100</div>
                </div>
                <div className="p-3 bg-[#111] border border-[#222]">
                  <div className="text-[#A0A0A0] text-xs mb-1">Growth Opportunities</div>
                  <div className="text-white font-mono">{insights.growthOpportunities} sponsors</div>
                  <div className="text-[#FFA500] text-xs mt-1">High trust, low visibility</div>
                </div>
                <div className="p-3 bg-[#111] border border-[#222]">
                  <div className="text-[#A0A0A0] text-xs mb-1">Campaign Health</div>
                  <div className="text-white font-mono">{insights.avgCtr > 1 ? 'Strong' : insights.avgCtr > 0.5 ? 'Average' : 'Needs Work'}</div>
                  <div className="text-[#00F2FF] text-xs mt-1">CTR: {insights.avgCtr?.toFixed(2)}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Sponsor List + Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-[#0A0A0B] border border-[#222] p-4">
              <h3 className="text-white font-mono text-sm mb-3 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#00F2FF]" /> Sponsors
              </h3>
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {sponsors.filter(s => s.active).map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSponsor(s.id)}
                    className={`w-full text-left p-3 text-xs font-mono transition-colors flex items-center justify-between ${
                      selectedSponsor === s.id ? 'bg-[#1A1A1A] border-l-2 border-[#00F2FF]' : 'hover:bg-[#111] border-l-2 border-transparent'
                    }`}
                  >
                    <div>
                      <div className="text-white">{s.name}</div>
                      <div className="text-[#666]">{s.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#00FF66]">{s.visibilityScore}/100</div>
                      <div className="text-[#444] text-[10px]">{s.campaignMetrics.impressions} imp</div>
                    </div>
                  </button>
                ))}
                {sponsors.filter(s => s.active).length === 0 && (
                  <div className="text-[#666] text-xs p-3">No active sponsors</div>
                )}
              </div>
            </div>

            {/* Sponsor Detail */}
            {selected ? (
              <div className="lg:col-span-2 bg-[#0A0A0B] border border-[#222] p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-mono text-lg">{selected.name}</h3>
                    <div className="text-[#A0A0A0] text-xs">{selected.category} · Priority {selected.priority}</div>
                  </div>
                  <div className={`px-3 py-1 text-xs font-mono border ${selected.active ? 'text-[#00FF66] border-[#00FF66]/30 bg-[#00FF66]/10' : 'text-[#FF4444] border-[#FF4444]/30 bg-[#FF4444]/10'}`}>
                    {selected.active ? 'ACTIVE' : 'INACTIVE'}
                  </div>
                </div>

                {/* Trust & Visibility Bars */}
                <div className="space-y-2">
                  <TrustBar score={selected.trustScore} label="Trust Score" />
                  <TrustBar score={selected.visibilityScore} label="Visibility" />
                  <TrustBar score={selected.semanticRelevance} label="Semantic Relevance" />
                  <TrustBar score={selected.retrievalPresence} label="Retrieval Presence" />
                  <TrustBar score={selected.recommendationExposure} label="Rec. Exposure" />
                </div>

                {/* Campaign Metrics */}
                <div>
                  <h4 className="text-white font-mono text-xs uppercase tracking-widest mb-3">Campaign Performance</h4>
                  <div className="grid grid-cols-4 gap-3">
                    <MetricCard icon={Eye} label="Impressions" value={selected.campaignMetrics.impressions} color="#00F2FF" />
                    <MetricCard icon={TrendingUp} label="Clicks" value={selected.campaignMetrics.clicks} color="#00FF66" />
                    <MetricCard icon={Target} label="CTR" value={(selected.campaignMetrics.ctr * 100)?.toFixed(2) || '0'} suffix="%" color="#FF5C00" />
                    <MetricCard icon={Zap} label="Engagement" value={selected.campaignMetrics.contextualEngagement} color="#A855F7" />
                  </div>
                </div>

                {/* Semantic Metrics */}
                <div>
                  <h4 className="text-white font-mono text-xs uppercase tracking-widest mb-3">Semantic Analytics</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <MetricCard icon={Layers} label="Retrieval Apps" value={selected.campaignMetrics.retrievalAppearances} color="#38BDF8" />
                    <MetricCard icon={Target} label="Rec. Confidence" value={selected.campaignMetrics.recommendationConfidence} suffix="/100" color="#F472B6" />
                    <MetricCard icon={Zap} label="Match Quality" value={selected.campaignMetrics.semanticMatchQuality} suffix="/100" color="#FFD700" />
                  </div>
                </div>

                {/* Products */}
                {selected.products?.length > 0 && (
                  <div>
                    <h4 className="text-white font-mono text-xs uppercase tracking-widest mb-3">Sponsored Products ({selected.products.length})</h4>
                    <div className="space-y-1">
                      {selected.products.map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2 bg-[#111] border border-[#1A1A1A]">
                          <span className="text-white font-mono">{p.name}</span>
                          {p.compatibleWith?.length ? <span className="text-[#666]">Compatible: {p.compatibleWith.join(', ')}</span> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ecosystem Mini-Map */}
                <div>
                  <h4 className="text-white font-mono text-xs uppercase tracking-widest mb-3">Ecosystem Position</h4>
                  <div className="flex flex-wrap gap-4 items-center justify-center p-4 bg-[#111] border border-[#1A1A1A]">
                    <EcosystemNode name="FPV Content" connections={sponsors.length} color="#00F2FF" />
                    <div className="text-[#444] text-xs">→</div>
                    <EcosystemNode name={selected.category} connections={selected.products.length} color="#FF5C00" />
                    <div className="text-[#444] text-xs">→</div>
                    <EcosystemNode name={selected.name} connections={3} color="#00FF66" />
                    <div className="text-[#444] text-xs">→</div>
                    <EcosystemNode name="Pilots" connections={selected.campaignMetrics.clicks} color="#A855F7" />
                  </div>
                  <div className="text-[#555] text-[10px] text-center mt-2">Simplified ecosystem flow — full map coming soon</div>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-2 bg-[#0A0A0B] border border-[#222] p-6 flex items-center justify-center">
                <div className="text-center text-[#666]">
                  <Layers className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <div className="text-sm">Select a sponsor to view detailed analytics</div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
