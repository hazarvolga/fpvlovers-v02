import React from 'react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { AISummaryBox } from '@/components/ui/AISummaryBox';
import { Radio, Terminal } from 'lucide-react';
import { getFirmwareData } from '@/lib/dify-datasets';

export const metadata = {
  title: 'Firmware & CLI Tuning | ENGINEERING LAB',
  description: 'Betaflight PID tuning logic, ExpressLRS setups, and EdgeTX configurations from the knowledge base.',
};

export default async function FirmwarePage() {
  const data = await getFirmwareData();
  const breadcrumbs = [
    { label: 'Engineering Lab', href: '/engineering' },
    { label: 'Firmware Tuning', isCurrentPage: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-10">

          <div className="relative p-8 hex-panel glass-panel overflow-hidden border-[#FF5C00]/20 shadow-[inset_0_0_80px_rgba(255,92,0,0.05)] text-center sm:text-left">
             <Terminal className="w-12 h-12 text-[#FF5C00] mb-6 opacity-80 inline-block sm:block" />
             <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter mb-4">
               Embedded <span className="text-[#FF5C00]">Firmware</span>
             </h1>
             <p className="text-sm font-mono text-[#A0A0A0] max-w-2xl leading-relaxed uppercase tracking-widest mx-auto sm:mx-0">
{"// Flight controller algorithms and RP2040 flashing protocols. CLI override commands activated."}
</p>
          </div>

          <AISummaryBox
            content={data.summary}
            title="SYS.FIRMWARE_WARNING"
            className="border-[#FF5C00]"
          />

          <div className="space-y-6">
             <div className="flex items-center gap-2 border-b border-[#333333] pb-2 mt-4">
                <Terminal className="w-5 h-5 text-[#00A8B3]" />
                <h3 className="text-lg font-black uppercase text-white tracking-widest">CLI Root Access Commands</h3>
             </div>

             <div className="grid gap-4">
                {data.cliCommands.map((item, i) => (
                   <div key={i} className="bg-[#050505] p-6 border border-[#333333] rounded-sm font-mono text-sm relative group overflow-hidden">
                      <div className={`absolute top-0 left-0 w-1 h-full ${i % 2 === 0 ? 'bg-[#00F2FF]' : 'bg-[#FF5C00]'}`} />
                      <div className={`${i % 2 === 0 ? 'text-[#00F2FF]' : 'text-[#FF5C00]'} mb-2 font-bold select-none`}># {item.title}</div>
                      <code className="text-[#A0A0A0] block p-3 bg-black/50 border border-white/5 whitespace-pre-wrap text-xs leading-relaxed">
                        {item.content}
                      </code>
                      <div className="text-[#555] text-[10px] mt-2 font-mono">
                        {item.tag} &middot; {item.tokens} tokens
                      </div>
                   </div>
                ))}
             </div>
          </div>

        </div>

        <aside className="lg:col-span-4 hidden lg:flex flex-col gap-6">
           <AdStickySidebar />
        </aside>
      </div>
    </div>
  );
}
