'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Target, Eye, Shield, RefreshCw, type LucideIcon } from 'lucide-react';

type CardProps = {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  suffix?: ReactNode;
  color?: string;
  sub?: ReactNode;
};

function Card({ icon: Icon, label, value, suffix = '', color = '#00F2FF', sub }: CardProps) {
  return (
    <div className="bg-[#0A0A0B] border border-[#222] p-3 group hover:border-[#333] transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3 h-3" style={{ color }} />
        <span className="text-[10px] text-[#A0A0A0] uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-xl font-mono font-bold text-white">{value}{suffix}</div>
      {sub && <div className="text-[10px] text-[#666] mt-0.5">{sub}</div>}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      const json = await res.json();
      setData(json);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchAnalytics();
    });
  }, [fetchAnalytics]);

  const recalcTrust = async () => {
    try {
      await fetch('/api/admin/analytics?action=recalc-trust');
      void fetchAnalytics();
    } catch {}
  };

  if (loading) return <div className="text-[#A0A0A0] text-sm p-4">Loading analytics...</div>;
  if (!data) return <div className="text-[#A0A0A0] text-sm p-4">No data available</div>;

  const { affiliate, sponsor, trust_config, google_analytics } = data;

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

      {/* Google Analytics Integration */}
      {google_analytics && (
        <div className="bg-[#0A0A0B] border border-[#222] p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-[#222] pb-2">
            <h4 className="text-[10px] font-mono uppercase text-[#666] tracking-widest">Google Analytics Integration</h4>
            <span className={`text-[10px] font-mono px-2 py-0.5 border uppercase ${
              google_analytics.status === 'active' 
                ? 'border-[#00FF66]/30 text-[#00FF66] bg-[#00FF66]/5' 
                : 'border-red-500/30 text-red-500 bg-red-500/5'
            }`}>
              Tracking {google_analytics.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-[#111] border border-[#1A1A1A] text-center font-mono">
              <div className="text-[#A0A0A0] text-[10px] uppercase">Tracking ID</div>
              <div className="text-white text-sm mt-1">{google_analytics.ga_id || 'Not configured'}</div>
            </div>
            <div className="p-3 bg-[#111] border border-[#1A1A1A] text-center font-mono">
              <div className="text-[#A0A0A0] text-[10px] uppercase">Reporting API</div>
              <div className={`text-sm mt-1 font-bold ${google_analytics.api_configured ? 'text-[#00FF66]' : 'text-yellow-500'}`}>
                {google_analytics.api_configured ? 'Connected' : 'Offline / Unconfigured'}
              </div>
            </div>
            <div className="p-3 bg-[#111] border border-[#1A1A1A] text-center font-mono">
              <div className="text-[#A0A0A0] text-[10px] uppercase">Property ID</div>
              <div className="text-white text-sm mt-1">{google_analytics.property_id || 'None'}</div>
            </div>
          </div>

          {google_analytics.api_configured && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-[#222]/50 pt-3">
              <div className="p-3 bg-[#111] border border-[#1A1A1A] text-center font-mono">
                <div className="text-[#A0A0A0] text-[10px] uppercase">Active Users (30d)</div>
                <div className="text-[#00FF66] text-xl font-bold mt-1">
                  {google_analytics.metrics?.active_users?.toLocaleString() || 0}
                </div>
              </div>
              <div className="p-3 bg-[#111] border border-[#1A1A1A] text-center font-mono">
                <div className="text-[#A0A0A0] text-[10px] uppercase">Page Views (30d)</div>
                <div className="text-[#00F2FF] text-xl font-bold mt-1">
                  {google_analytics.metrics?.page_views?.toLocaleString() || 0}
                </div>
              </div>
              <div className="p-3 bg-[#111] border border-[#1A1A1A] text-center font-mono">
                <div className="text-[#A0A0A0] text-[10px] uppercase">Sessions (30d)</div>
                <div className="text-[#A855F7] text-xl font-bold mt-1">
                  {google_analytics.metrics?.sessions?.toLocaleString() || 0}
                </div>
              </div>
            </div>
          )}

          {!google_analytics.api_configured && (
            <div className="border border-dashed border-[#333] p-3 text-[10px] font-mono text-[#A0A0A0] leading-relaxed">
              <span className="text-[#FF5C00] font-bold">INFO:</span> Real-time visitor graphs and reports require Google Analytics reporting service account credentials. 
              To configure, add the following variables to your <code className="text-white">.env.local</code>:
              <div className="mt-2 text-white bg-[#050505] p-2 border border-[#111] space-y-1">
                <div>NEXT_PUBLIC_GA_ID=&quot;your-ga-measurement-id-like-G-XXXXXX&quot;</div>
                <div>GA_PROPERTY_ID=&quot;your-ga4-property-id&quot;</div>
                <div>GA_CLIENT_EMAIL=&quot;your-service-account-email&quot;</div>
                <div>GA_PRIVATE_KEY=&quot;your-service-account-private-key&quot;</div>
              </div>
            </div>
          )}
        </div>
      )}

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
