import { Wind } from 'lucide-react';

export function PropellerLabSection() {
  return (
    <section id="props" className="space-y-4">
      <div className="flex items-center gap-3 border-b border-[#5b4137] pb-3">
        <div className="w-6 h-6 flex items-center justify-center bg-[#ff5f00]/10 border border-[#ff5f00]/30">
          <Wind className="w-3.5 h-3.5 text-[#ffb599]" />
        </div>
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#e4bfb1]">MOD_884_PROP</span>
          <h3 className="text-lg font-bold uppercase text-[#e5e2e1] tracking-wide">Propeller Lab</h3>
        </div>
      </div>
      <p className="text-xs text-[#e4bfb1]/70 leading-relaxed">
        How prop diameter, pitch, blade count, and material affect thrust, efficiency, motor load, and flight feel.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-[#0e0e0e] border border-[#5b4137] p-5 hover:border-[#ffb599]/40 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-[9px] text-[#e4bfb1]/50 uppercase tracking-widest">DIM_01</span>
            <div className="flex-1 h-px bg-[#353534]" />
          </div>
          <h4 className="font-bold text-[#e5e2e1] mb-2 text-sm">Size and Pitch</h4>
          <p className="text-xs text-[#e4bfb1]/60 leading-relaxed">How diameter and pitch change thrust, efficiency, and motor load.</p>
        </div>
        <div className="bg-[#0e0e0e] border border-[#5b4137] p-5 hover:border-[#00eefc]/40 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-[9px] text-[#e4bfb1]/50 uppercase tracking-widest">DIM_02</span>
            <div className="flex-1 h-px bg-[#353534]" />
          </div>
          <h4 className="font-bold text-[#e5e2e1] mb-2 text-sm">Blade Count</h4>
          <p className="text-xs text-[#e4bfb1]/60 leading-relaxed">Bi-blade and tri-blade tradeoffs for grip, noise, and current draw.</p>
        </div>
        <div className="bg-[#0e0e0e] border border-[#5b4137] p-5 hover:border-[#00e639]/40 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-[9px] text-[#e4bfb1]/50 uppercase tracking-widest">DIM_03</span>
            <div className="flex-1 h-px bg-[#353534]" />
          </div>
          <h4 className="font-bold text-[#e5e2e1] mb-2 text-sm">Vibration and Feel</h4>
          <p className="text-xs text-[#e4bfb1]/60 leading-relaxed">Prop choices that reduce oscillation and make tuning easier.</p>
        </div>
      </div>
    </section>
  );
}
