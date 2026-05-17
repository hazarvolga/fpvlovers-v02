'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Target, Eye, Shield, RefreshCw } from 'lucide-react';

export default function AnalyticsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      const json = await res.json();
      setData(json);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAnalytics(); }, []);

  const recalcTrust = async () => {
    try {
      await fetch('/api/admin/analytics?action=recalc-trust');
      fetchAnalytics();
    } catch {}
  };

  const Card = ({ icon: Icon, label, value, suffix = '', color = '#00F2FF', sub }: any) => (
    <div className="bg-[#0A0A0B] border border-[#222] p-3 group hover:border-[#333] transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3 h-3" style={{ color }} />
        <span className="text-[10px] text-[#A0A0A0] uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-xl font-mono font-bold text-white">{value}{suffix}</div>
      {sub && <div className="text-[10px] text-[#666] mt-0.5">{sub}</div>}
    </div>
  );

  if (loading) return <div className="text-[#A0A0A0] text-sm p-4">Loading analytics...</div>;
  if (!data) return <div className="text-[#A0A0A0] text-sm p-4">No data available</div>;

  const { affiliate, sponsor, trust_config } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-mono text-sm uppercase tracking-widest flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#FFD700]" /> Monetization Analytics
        </h3>
        <div className="flex gap-2">
          <button onClick={recalcTrust} className="text-[10px] text-[#A0A0A0] hover:text-white font-mono px-2 py-1 border border-[#333] rounded-sm transition-colors flex items-center gap-1">
            <Shield className="w-3 h-3" /> Recalc Trust
          </button>
          <button onClick={fetchAnalytics} className="text-[10px] text-[#A0A0A0] hover:text-white font-mono px-2 py-1 border border-[#333] rounded-sm transition-colors flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {/* Affiliate KPIs */}
      <div>
        <h4 className="text-[10px] font-mono uppercase text-[#666] tracking-widest mb-2">Affiliate Performance</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Card icon={ShoppingCart} label="Products" value={affiliate.totalProducts} color="#FF5C00" />
          <Card icon={Target} label="Total Clicks" value={affiliate.totalClicks} color="#00F2FF" />
          <Card icon={DollarSign} label="Revenue" value={`$${affiliate.totalRevenue}`} color="#00FF66" />
          <Card icon={TrendingUp} label="Avg CTR" value={`${affiliate.avgCtr}`} suffix="%" color="#A855F7" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          <Card icon={Target} label="Conversions" value={affiliate.totalConversions} color="#38BDF8" />
          <Card icon={Shield} label="Avg Trust" value={affiliate.avgTrust} suffix="/100" color="#FFD700" />
          <Card icon={TrendingUp} label="Conv Rate" value={`${affiliate.totalClicks > 0 ? Math.round(affiliate.totalConversions / affiliate.totalClicks * 10000) / 100 : 0}`} suffix="%" color="#F472B6" />
        </div>

        {/* Network Breakdown */}
        {affiliate.byNetwork && Object.keys(affiliate.byNetwork).length > 0 && (
          <div className="mt-2 bg-[#0A0A0B] border border-[#222] p-3">
            <h5 className="text-[10px] font-mono uppercase text-[#666] tracking-widest mb-2">By Network</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
              {Object.entries(affiliate.byNetwork).map(([net, d]: [string, any]) => (
                <div key={net} className="p-2 bg-[#111] border border-[#1A1A1A] text-center">
                  <div className="text-white uppercase">{net}</div>
                  <div className="text-[#666]">{d.count} products · {d.clicks} clicks</div>
                  <div className="text-[#00FF66]">${Math.round(d.revenue * 100) / 100}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sponsor KPIs */}
      <div>
        <h4 className="text-[10px] font-mono uppercase text-[#666] tracking-widest mb-2">Sponsor Performance</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Card icon={ShoppingCart} label="Sponsors" value={sponsor.totalSponsors} color="#FF5C00" />
          <Card icon={Eye} label="Impressions" value={sponsor.totalImpressions} color="#00F2FF" />
          <Card icon={Target} label="Clicks" value={sponsor.totalClicks} color="#00FF66" />
          <Card icon={Shield} label="Avg Trust" value={sponsor.avgTrust} suffix="/100" color="#FFD700" />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Card icon={Target} label="Avg Visibility" value={sponsor.avgVisibility} suffix="/100" color="#38BDF8" />
          <Card icon={TrendingUp} label="Overall CTR" value={`${sponsor.totalImpressions > 0 ? Math.round(sponsor.totalClicks / sponsor.totalImpressions * 10000) / 100 : 0}`} suffix="%" color="#F472B6" />
        </div>
      </div>

      {/* Trust Config */}
      {trust_config && (
        <div className="bg-[#0A0A0B] border border-[#222] p-4">
          <h4 className="text-[10px] font-mono uppercase text-[#666] tracking-widest mb-3">Trust Configuration</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs font-mono">
            <div className="p-2 bg-[#111] text-center border border-[#1A1A1A]">
              <div className="text-[#A0A0A0]">Min Affiliate Trust</div>
              <div className="text-white">{trust_config.minTrustScoreAffiliate}</div>
            </div>
            <div className="p-2 bg-[#111] text-center border border-[#1A1A1A]">
              <div className="text-[#A0A0A0]">Min Sponsor Trust</div>
              <div className="text-white">{trust_config.minTrustScoreSponsor}</div>
            </div>
            <div className="p-2 bg-[#111] text-center border border-[#1A1A1A]">
              <div className="text-[#A0A0A0]">Max Placements</div>
              <div className="text-white">{trust_config.maxPlacementsPerPage}</div>
            </div>
            <div className="p-2 bg-[#111] text-center border border-[#1A1A1A]">
              <div className="text-[#A0A0A0]">Trust Weight</div>
              <div className="text-white">{trust_config.trustWeightInRanking}</div>
            </div>
            <div className="p-2 bg-[#111] text-center border border-[#1A1A1A]">
              <div className="text-[#A0A0A0]">Relevance Weight</div>
              <div className="text-white">{trust_config.semanticRelevanceWeight}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
