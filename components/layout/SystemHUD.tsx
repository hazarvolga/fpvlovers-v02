import React from 'react';
import { Target, Activity, Battery, Wifi } from 'lucide-react';

export function SystemHUD() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden text-[#00F2FF] font-mono text-[10px] uppercase font-bold tracking-widest leading-none select-none">
      
      {/* Top Left: Telemetry */}
      <div className="absolute top-24 left-6 hidden xl:flex flex-col gap-2 opacity-50">
         <div className="flex items-center gap-2">
            <Activity className="w-3 h-3" />
            <span>SYS.OP_STABLE</span>
         </div>
         <div className="text-[#A0A0A0]">CONTENT / CONNECTED</div>
         <div>LATENCY: 12ms</div>
      </div>

      {/* Top Right: Power & Comm */}
      <div className="absolute top-24 right-6 hidden xl:flex flex-col gap-2 opacity-50 text-right items-end">
         <div className="flex items-center gap-2 text-[#FF5C00]">
            <span>6S VOLTAGE: 25.2V</span>
            <Battery className="w-4 h-4" />
         </div>
         <div className="flex items-center gap-2">
            <span>UPLINK: 1.2Gbps</span>
            <Wifi className="w-3 h-3" />
         </div>
      </div>

      {/* Bottom Left: Coordinates */}
      <div className="absolute bottom-6 left-6 hidden lg:flex flex-col gap-1 opacity-40 mix-blend-screen text-[9px] tracking-[0.3em]">
         <div>LAT: 47.3769° N</div>
         <div>LON: 8.5417° E</div>
         <div className="mt-2 text-[#FF5C00]">ALT: 1,420M (MSL)</div>
      </div>

      {/* Crosshairs & Borders */}
      {/* Corner Brackets */}
      <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-[#00F2FF]/30" />
      <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-[#00F2FF]/30" />
      <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-[#00F2FF]/30" />
      <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-[#00F2FF]/30" />
      
      {/* Center Reticle (faint) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-[#00F2FF]/10 rounded-full flex items-center justify-center opacity-30 mix-blend-screen">
         <Target className="w-8 h-8 text-[#00F2FF]/20" />
         <div className="absolute w-[200%] h-[1px] bg-[#00F2FF]/5" />
         <div className="absolute h-[200%] w-[1px] bg-[#00F2FF]/5" />
      </div>

      {/* Right side data stream */}
      <div className="absolute bottom-32 right-6 hidden xl:flex flex-col gap-1 opacity-20 text-[8px] text-[#A0A0A0] text-right">
         <div>0x00F8A1: SYSTEM BOOT SECURE</div>
         <div>0x00F8A2: VTX INITIALIZED</div>
         <div>0x00F8A3: GYRO CALIBRATION OK</div>
         <div>0x00F8A4: WAITING FOR ARM...</div>
      </div>
    </div>
  );
}
