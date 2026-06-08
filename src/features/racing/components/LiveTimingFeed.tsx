"use client";

import { useEffect, useState } from 'react';
import { Radio, Activity, ShieldAlert, Zap } from 'lucide-react';

interface PilotTelemetry {
  name: string;
  team: string;
  country: string;
  lastLap: number; // saniye cinsinden
  speed: number;   // km/h
  gap: number;     // saniye cinsinden leader'a göre
}

const INITIAL_PILOTS: PilotTelemetry[] = [
  { name: 'MinChan Kim', team: 'MCK FPV', country: 'KR', lastLap: 41.25, speed: 142.4, gap: 0.00 },
  { name: 'SilasFPV', team: 'XBlades', country: 'DE', lastLap: 41.68, speed: 139.8, gap: 0.43 },
  { name: 'Dunkan Bossion', team: 'T-Motor', country: 'FR', lastLap: 42.12, speed: 137.5, gap: 0.87 },
  { name: 'HeadupFPV', team: 'FPVLovers', country: 'TR', lastLap: 42.34, speed: 136.2, gap: 1.09 },
  { name: 'LukeFPV', team: 'Betaflight', country: 'US', lastLap: 42.89, speed: 134.1, gap: 1.64 },
];

export default function LiveTimingFeed() {
  const [pilots, setPilots] = useState<PilotTelemetry[]>(INITIAL_PILOTS);
  const [systemHealth, setSystemHealth] = useState<'nominal' | 'degraded'>('nominal');
  const [signalStrength, setSignalStrength] = useState<number>(98);

  useEffect(() => {
    const interval = setInterval(() => {
      setPilots((prevPilots) => {
        // Her pilotun değerlerini rastgele ufak oynamalarla güncelle
        const updated = prevPilots.map((pilot, idx) => {
          const lapDelta = (Math.random() - 0.5) * 0.4; // max +-0.2s
          const speedDelta = (Math.random() - 0.5) * 5;  // max +-2.5 km/h
          
          let newLap = Number((pilot.lastLap + lapDelta).toFixed(2));
          // Minimum makul tur süresi 39s
          if (newLap < 39) newLap = 39.12;
          // Maksimum makul tur süresi 46s
          if (newLap > 46) newLap = 45.89;

          let newSpeed = Number((pilot.speed + speedDelta).toFixed(1));
          if (newSpeed < 125) newSpeed = 125.5;
          if (newSpeed > 155) newSpeed = 154.8;

          return {
            ...pilot,
            lastLap: newLap,
            speed: newSpeed,
          };
        });

        // Tur süresine göre sırala (en düşük tur süresi en üstte)
        const sorted = [...updated].sort((a, b) => a.lastLap - b.lastLap);

        // Gap sürelerini güncelle (lider ile aradaki fark)
        const leaderLap = sorted[0].lastLap;
        return sorted.map((pilot, index) => ({
          ...pilot,
          gap: index === 0 ? 0.00 : Number((pilot.lastLap - leaderLap).toFixed(2)),
        }));
      });

      // Sinyal gücünü dalgalandır
      setSignalStrength((prev) => {
        const delta = Math.floor((Math.random() - 0.5) * 4);
        const next = prev + delta;
        return next > 100 ? 100 : next < 85 ? 85 : next;
      });

      // Arada bir sistem sağlığını ufak tehlikeye sok
      if (Math.random() > 0.95) {
        setSystemHealth('degraded');
        setTimeout(() => setSystemHealth('nominal'), 3000);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full overflow-hidden rounded-md border border-white/10 bg-[#08090d]/82 font-mono text-[10px] uppercase tracking-[0.12em]">
      {/* Telemetry Header */}
      <div className="grid gap-0 border-b border-white/10 lg:grid-cols-[200px_1fr_240px]">
        <div className="flex items-center gap-2 border-r border-white/10 px-4 py-3 text-[#00ff66]">
          <Radio className="h-4 w-4 animate-pulse" />
          <span>Live Telemetry feed</span>
        </div>
        <div className="flex items-center gap-4 px-4 py-3 text-white/55">
          <span>Signal: <span className="text-[#00f2ff]">{signalStrength}%</span></span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">Satellites: <span className="text-white">18/24</span></span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">Refresh: <span className="text-white">1.5s</span></span>
        </div>
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-white/10 lg:border-t-0">
          <span className="text-white/42">Receiver state:</span>
          {systemHealth === 'nominal' ? (
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-[#00ff66]/20 bg-[#00ff66]/8 px-2 py-0.5 text-[#00ff66] text-[9px]">
              <Zap className="h-3 w-3" /> NOMINAL
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-red-500/20 bg-red-500/8 px-2 py-0.5 text-red-500 text-[9px] animate-pulse">
              <ShieldAlert className="h-3 w-3" /> DEGRADED
            </span>
          )}
        </div>
      </div>

      {/* Timing Flow Table */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Table Header */}
          <div className="grid grid-cols-[50px_1.5fr_1fr_1fr_1fr_1fr] border-b border-white/5 bg-white/[0.02] px-4 py-2 text-white/35 font-bold">
            <span>Pos</span>
            <span>Pilot Name</span>
            <span>Country</span>
            <span className="text-right">Last Lap</span>
            <span className="text-right">Live Speed</span>
            <span className="text-right">Gap</span>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/5">
            {pilots.map((pilot, idx) => {
              const isFirst = idx === 0;
              const isLovers = pilot.team === 'FPVLovers';
              return (
                <div 
                  key={pilot.name} 
                  className={`grid grid-cols-[50px_1.5fr_1fr_1fr_1fr_1fr] items-center px-4 py-2.5 transition-colors ${
                    isLovers ? 'bg-[#ff5a1f]/8 border-l border-[#ff5a1f]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <span className={`text-xs font-black ${isFirst ? 'text-[#ff5a1f]' : 'text-white/50'}`}>
                    P{idx + 1}
                  </span>
                  <div>
                    <span className="block font-bold text-white text-[11px]">{pilot.name}</span>
                    <span className="block text-[8px] text-white/40">{pilot.team}</span>
                  </div>
                  <span className="text-white/60">{pilot.country}</span>
                  <span className="text-right font-bold text-[#00f2ff]">{pilot.lastLap.toFixed(2)}s</span>
                  <span className="text-right text-[#00ff66]">{pilot.speed.toFixed(1)} km/h</span>
                  <span className={`text-right ${isFirst ? 'text-[#ff5a1f] font-black' : 'text-white/50'}`}>
                    {isFirst ? 'LEADER' : `+${pilot.gap.toFixed(2)}s`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
