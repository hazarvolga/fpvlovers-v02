import { Wind } from 'lucide-react';

export function PropellerLabSection() {
  return (
    <section id="props" className="space-y-4">
      <div className="flex items-center gap-2 border-b border-[#333333] pb-2">
        <Wind className="w-5 h-5 text-[#00F2FF]" />
        <h3 className="text-lg font-black uppercase text-[#f8fafc] tracking-widest">Propeller Lab</h3>
      </div>
      <p className="text-xs text-[#A0A0A0]">
        How prop diameter, pitch, blade count, and material affect thrust, efficiency, motor load, and flight feel.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-[#0A0A0B] border border-[#333] p-5">
          <h4 className="font-bold text-white mb-2">Size and pitch</h4>
          <p className="text-xs text-[#A0A0A0]">How diameter and pitch change thrust, efficiency, and motor load.</p>
        </div>
        <div className="bg-[#0A0A0B] border border-[#333] p-5">
          <h4 className="font-bold text-white mb-2">Blade count</h4>
          <p className="text-xs text-[#A0A0A0]">Bi-blade and tri-blade tradeoffs for grip, noise, and current draw.</p>
        </div>
        <div className="bg-[#0A0A0B] border border-[#333] p-5">
          <h4 className="font-bold text-white mb-2">Vibration and feel</h4>
          <p className="text-xs text-[#A0A0A0]">Prop choices that reduce oscillation and make tuning easier.</p>
        </div>
      </div>
    </section>
  );
}
