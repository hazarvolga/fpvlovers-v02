import React from 'react';
import { CyberBreadcrumb } from '@/components/navigation/Breadcrumb';
import { AdStickySidebar } from '@/components/monetization/NativeAds';
import { AISummaryBox } from '@/components/ui/AISummaryBox';
import { Map, AlertTriangle, ExternalLink } from 'lucide-react';
import { getPageData } from '@/lib/dify-datasets';

export const metadata = {
  title: 'Airspace & Remote ID | REGULATIONS',
  description: 'Global airspace maps, compliance standards, and Remote ID modules from the knowledge base.',
};

export default async function AirspacePage() {
  const data = await getPageData('airspace');
  const breadcrumbs = [
    { label: 'Regulations', href: '/regulations' },
    { label: 'Airspace & Remote ID', isCurrentPage: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-10">
          
          <div className="relative p-8 hex-panel glass-panel overflow-hidden border-[#FF5C00]/20 text-center sm:text-left">
             <Map className="w-12 h-12 text-[#FF5C00] mb-6 opacity-80 inline-block sm:block" />
             <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter mb-4">
               Airspace <span className="text-[#FF5C00]">Compliance</span>
             </h1>
             <p className="text-sm font-mono text-[#A0A0A0] max-w-2xl leading-relaxed uppercase tracking-widest mx-auto sm:mx-0">
{"// FAA and EASA regulation mandates. Always check NOTAMs (Notices to Air Missions) before arming."}
</p>
          </div>

           <AISummaryBox 
             content={data.summary || "Sub-250g drones exempt from Remote ID. 5-inch+ requires registered module."} 
             title="SYS.LEGAL_FRAMEWORK" 
          />

          {data.items.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase text-[#A0A0A0] tracking-widest border-b border-[#333333] pb-2">Knowledge Base Sources</h3>
              {data.items.map((item, i) => (
                <a key={i} href={item.url} target="_blank" rel="noopener" className="block bg-[#0A0A0B] border border-[#333333] p-4 hover:border-[#FF5C00]/50 transition-colors group">
                  <div className="flex items-center gap-2 mb-1">
                    <ExternalLink className="w-3 h-3 text-[#FF5C00]" />
                    <span className="text-white font-mono text-sm group-hover:text-[#FF5C00]">{item.title}</span>
                  </div>
                  <div className="text-[#A0A0A0] text-xs font-mono">{item.description}</div>
                </a>
              ))}
            </div>
          )}

          <div className="p-4 bg-[#FF5C00]/10 border border-[#FF5C00]/30 hex-panel flex items-start gap-4 text-[#A0A0A0] font-mono text-xs">
             <AlertTriangle className="w-6 h-6 text-[#FF5C00] flex-shrink-0" />
             <p className="leading-relaxed">
               <strong className="text-[#FF5C00] uppercase block mb-1">Restricted Airspace Proximity</strong>
               Do not fly near airports, stadiums during events, or national parks. Violations trigger severe federal penalties.
             </p>
          </div>

        </div>

        <aside className="lg:col-span-4 hidden lg:flex flex-col gap-6">
           <AdStickySidebar />
        </aside>
      </div>
    </div>
  );
}
