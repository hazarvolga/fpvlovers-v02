import { Wind } from 'lucide-react';
import Image from 'next/image';

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

      {/* ── PROPELLER MEDIA BLOCK ── */}
      <div className="border border-[#5b4137] bg-[#0e0e0e] p-1 relative overflow-hidden group">
        <div className="relative aspect-[21/9] w-full overflow-hidden">
          <Image
            src="https://picsum.photos/seed/propeller-lab/1200/520"
            alt="Propeller cross-section and thrust vector illustration"
            fill
            className="object-cover opacity-60 grayscale contrast-125 mix-blend-screen group-hover:opacity-70 group-hover:grayscale-0 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e0e] via-transparent to-[#0e0e0e]" />
          <div className="absolute inset-0 border-[0.5px] border-[#ffb599]/10 pointer-events-none" />

          {/* HUD overlay */}
          <div className="absolute top-3 left-3 z-10">
            <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-[#ffb599]/40">PROPELLER_TELEMETRY</span>
          </div>
          <div className="absolute bottom-3 right-3 z-10 text-right">
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#00e639]">THRUST_VECTOR: ACTIVE</p>
            <p className="font-mono text-[8px] text-[#e4bfb1]/40">EFFICIENCY_RATING: 92.4%</p>
          </div>

          {/* Center reticle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-[#ffb599]/15 rounded-full pointer-events-none">
            <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-[#ffb599]/10" />
            <div className="absolute top-0 left-1/2 w-[0.5px] h-full bg-[#ffb599]/10" />
          </div>
        </div>

        {/* Thrust data strip */}
        <div className="grid grid-cols-4 gap-px bg-[#1c1b1b] mt-px">
          {[
            { label: 'DIAMETER', value: '5.1"', accent: '#ffb599' },
            { label: 'PITCH', value: '4.3', accent: '#00eefc' },
            { label: 'BLADES', value: '3', accent: '#00e639' },
            { label: 'RPM_MAX', value: '32.4K', accent: '#ffb599' },
          ].map((item) => (
            <div key={item.label} className="bg-[#0e0e0e] p-2 text-center">
              <p className="font-mono text-[8px] uppercase tracking-widest text-[#e4bfb1]/40">{item.label}</p>
              <p className="font-mono text-sm font-bold tracking-tighter mt-0.5" style={{ color: item.accent }}>{item.value}</p>
            </div>
          ))}
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
