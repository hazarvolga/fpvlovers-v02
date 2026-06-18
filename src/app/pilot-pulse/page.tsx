'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radio, AlertTriangle, Box, Cpu, HardDrive, 
  Wind, ShieldCheck, Thermometer, Wifi, Gauge, Info
} from 'lucide-react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';

interface TelemetryLog {
  id: string;
  timestamp: string;
  droneName: string;
  pilotClass: string;
  signalStrength: string;
  packetRate: string;
  status: 'SAFE' | 'WARN' | 'CRIT';
  message: string;
}

interface Hotspot {
  id: string;
  location: string;
  windSpeed: number;
  temp: number;
  gpsRescueReady: boolean;
  status: 'CLEAR' | 'CAUTION' | 'RESTRICTED';
}

interface ComponentReliability {
  id: string;
  brand: string;
  name: string;
  category: string;
  mtbfHours: number; // Mean Time Between Failures
  failureIndex: number; // 0 to 10
  rating: 'EXCELLENT' | 'STABLE' | 'RISKY';
  notes: string;
}

const initialTelemetryLogs: TelemetryLog[] = [
  {
    id: 'log-1',
    timestamp: '12:51:02',
    droneName: 'Chimera7 LR',
    pilotClass: 'Long Range Explorer',
    signalStrength: '-68dBm',
    packetRate: '150Hz ELRS',
    status: 'SAFE',
    message: 'GPS Rescue lock validated (14 satellites). Ground speed 58km/h.'
  },
  {
    id: 'log-2',
    timestamp: '12:51:15',
    droneName: 'Nazgul Evoque F5',
    pilotClass: 'Freestyle Tactician',
    signalStrength: '-42dBm',
    packetRate: '500Hz ELRS',
    status: 'SAFE',
    message: 'Acro flip sequence detected. Gyro BMI270 trace noise: exceptionally low.'
  },
  {
    id: 'log-3',
    timestamp: '12:51:24',
    droneName: 'CineLog35 V2',
    pilotClass: 'Cinematic Operator',
    signalStrength: '-72dBm',
    packetRate: '250Hz ELRS',
    status: 'WARN',
    message: 'Voltage sag detected on 6S battery (3.3V/cell). Reducing camera angle.'
  },
  {
    id: 'log-4',
    timestamp: '12:51:36',
    droneName: 'Apex 5 Custom',
    pilotClass: 'System Builder',
    signalStrength: '-98dBm',
    packetRate: '1000Hz ELRS',
    status: 'CRIT',
    message: 'High frequency resonance spike detected (220Hz) on ICM42688P gyro. D-term temperature critical.'
  }
];

const mockHotspots: Hotspot[] = [
  { id: '1', location: 'Alpine Peak Explorer Ridge', windSpeed: 42, temp: 4, gpsRescueReady: true, status: 'CAUTION' },
  { id: '2', location: 'Urban Bando Proximity Park', windSpeed: 12, temp: 22, gpsRescueReady: false, status: 'CLEAR' },
  { id: '3', location: 'Gorge Surfing Ridge', windSpeed: 58, temp: 11, gpsRescueReady: true, status: 'RESTRICTED' },
  { id: '4', location: 'Whoop Hangar Indoor Gates', windSpeed: 0, temp: 24, gpsRescueReady: false, status: 'CLEAR' },
  { id: '5', location: 'Coastal Range Cliffs', windSpeed: 31, temp: 16, gpsRescueReady: true, status: 'CLEAR' }
];

const mockReliabilityMatrix: ComponentReliability[] = [
  {
    id: 'c1',
    brand: 'RadioMaster',
    name: 'Boxer ELRS Transmitter',
    category: 'Transmitter',
    mtbfHours: 1200,
    failureIndex: 0.4,
    rating: 'EXCELLENT',
    notes: 'Flawless RF link stability. Low gimbals mechanical drift over 100+ hours.'
  },
  {
    id: 'c2',
    brand: 'Happymodel',
    name: 'EP1 Nano Receiver',
    category: 'Receiver',
    mtbfHours: 950,
    failureIndex: 0.8,
    rating: 'EXCELLENT',
    notes: 'Outstanding receiver sensitivity. Solder pads are small, handle thermal stress carefully.'
  },
  {
    id: 'c3',
    brand: 'DJI',
    name: 'O3 Air Unit',
    category: 'VTX System',
    mtbfHours: 600,
    failureIndex: 2.5,
    rating: 'STABLE',
    notes: 'Demands high-amp BEC power supply. Weak FC 5V rails will black out this VTX.'
  },
  {
    id: 'c4',
    brand: 'Generic',
    name: 'F405 Stack 50A ESC',
    category: 'Electronics Stack',
    mtbfHours: 180,
    failureIndex: 7.2,
    rating: 'RISKY',
    notes: 'Contains weak 5V onboard regulator. Running high voltage 6S builds risks ESC MOSFET thermal blowout.'
  }
];

const droneNames = ['Apex Freestyle', 'Nazgul F5D', 'Chimera7 Peak', 'CineLog30', 'Meteor65 Pro', 'Flywoo Explorer'];
const pilotClasses = ['Freestyle Tactician', 'Cinematic Operator', 'Long Range Explorer', 'System Builder / Engineer', 'Competitive Racer'];
const errorMessages = [
  'LQ dropped to 72% behind mountain ridge. Recovered immediately.',
  'Dynamic notch filter shifted to 145Hz to suppress physical arm play.',
  'Betaflight dynamic idle active. Motor commutation frequency matched.',
  'GPS home coordinates set. Altitude lock validated at 12m.',
  'Minor D-term oscillation on Roll axis. Adjusting slider to 1.1x.',
  'Telemetry feed lost momentarily. Re-established link handshake.'
];

export default function PilotPulsePage() {
  const [logs, setLogs] = useState<TelemetryLog[]>(initialTelemetryLogs);
  const [hotspots, setHotspots] = useState<Hotspot[]>(mockHotspots);
  const [stats, setStats] = useState({
    activeFleets: 184,
    globalLqAverage: 98.4,
    faultAlerts: 2,
    windTrend: 24
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll logs container
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Telemetry real-time generator
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Add new telemetry log
      const date = new Date();
      const timestamp = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
      const randomStatus = Math.random() > 0.85 ? 'WARN' : Math.random() > 0.95 ? 'CRIT' : 'SAFE';
      
      const newLog: TelemetryLog = {
        id: `log-${Date.now()}`,
        timestamp,
        droneName: droneNames[Math.floor(Math.random() * droneNames.length)],
        pilotClass: pilotClasses[Math.floor(Math.random() * pilotClasses.length)],
        signalStrength: `${-30 - Math.floor(Math.random() * 65)}dBm`,
        packetRate: Math.random() > 0.5 ? '500Hz ELRS' : '250Hz ELRS',
        status: randomStatus,
        message: errorMessages[Math.floor(Math.random() * errorMessages.length)]
      };

      setLogs(prev => [...prev.slice(-30), newLog]);

      // 2. Randomly jitter active telemetry stats
      setStats(prev => ({
        activeFleets: Math.max(120, prev.activeFleets + (Math.random() > 0.5 ? 1 : -1)),
        globalLqAverage: parseFloat((95 + Math.random() * 4.9).toFixed(1)),
        faultAlerts: randomStatus !== 'SAFE' ? prev.faultAlerts + 1 : Math.max(0, prev.faultAlerts - (Math.random() > 0.7 ? 1 : 0)),
        windTrend: Math.max(5, Math.min(65, prev.windTrend + Math.floor(Math.random() * 5 - 2)))
      }));

      // 3. Jitter hotspot winds slightly
      setHotspots(prev => prev.map(h => {
        if (h.windSpeed === 0) return h;
        const delta = Math.floor(Math.random() * 5 - 2);
        const nextWind = Math.max(5, h.windSpeed + delta);
        let nextStatus = h.status;
        if (nextWind > 50) nextStatus = 'RESTRICTED';
        else if (nextWind > 30) nextStatus = 'CAUTION';
        else nextStatus = 'CLEAR';
        return { ...h, windSpeed: nextWind, status: nextStatus };
      }));

    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 pt-28">
      <CyberBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'News', isCurrentPage: true }]} className="mb-8" />

      {/* Cockpit HUD Radar Header */}
      <div className="relative mb-8 flex flex-col items-center justify-center p-8 bg-[#050810] border border-[#00F2FF]/20 hex-panel overflow-hidden shadow-[inset_0_0_80px_rgba(0,242,255,0.05)]">
         {/* Grid background effect */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] opacity-60 pointer-events-none" />
         
         {/* Sweep Radar Circle Animation */}
         <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none hidden md:block">
            <motion.div
               animate={{ rotate: 360 }}
               transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
               className="w-48 h-48 rounded-full border border-[#00F2FF]/30 relative flex items-center justify-center"
            >
               <div className="absolute top-0 right-1/2 w-1/2 h-1/2 bg-gradient-to-br from-[#00F2FF]/30 to-transparent origin-bottom-right" />
               <div className="w-2 h-2 rounded-full bg-[#00F2FF] shadow-[0_0_10px_#00F2FF]" />
            </motion.div>
         </div>

         <Radio className="w-16 h-16 text-[#00F2FF] mb-4 relative z-10 animate-pulse" />
         <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter mb-2 relative z-10">
           Pilot <span className="text-[#00F2FF]">Pulse</span> HUD
         </h1>
         <p className="text-xs font-mono text-[#00F2FF] max-w-2xl leading-relaxed uppercase tracking-widest text-center relative z-10">
           {"// GLOBAL FPV TELEMETRY ACTIVE. STREAMING EMPIRICAL FIELD DATA AND RELIABILITY MATRIX."}
         </p>
      </div>

      {/* HUD Telemetry Stats Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#050810]/40 border border-[#333333] hover:border-[#00F2FF]/50 p-4 relative overflow-hidden group transition-all duration-300">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#00F2FF] shadow-[0_0_8px_rgba(0,242,255,0.8)]" />
          <div className="text-[10px] font-mono text-[#888888] uppercase tracking-widest">Active Fleet Transmissions</div>
          <div className="mt-2 text-3xl font-black text-white font-mono">{stats.activeFleets} <span className="text-xs text-[#00F2FF]">UNITS</span></div>
          <div className="mt-1 flex items-center gap-1 font-mono text-[9px] text-[#00F2FF]">
             <Wifi className="w-3 h-3 animate-ping" /> GLOBAL LINK READY
          </div>
        </div>

        <div className="bg-[#050810]/40 border border-[#333333] hover:border-[#00FF66]/50 p-4 relative overflow-hidden group transition-all duration-300">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.8)]" />
          <div className="text-[10px] font-mono text-[#888888] uppercase tracking-widest">Global Link Quality (LQ)</div>
          <div className="mt-2 text-3xl font-black text-white font-mono">{stats.globalLqAverage}%</div>
          <div className="mt-2 w-full bg-[#111] h-1.5 rounded-full overflow-hidden">
             <div className="bg-[#00FF66] h-full transition-all duration-300" style={{ width: `${stats.globalLqAverage}%` }} />
          </div>
        </div>

        <div className="bg-[#050810]/40 border border-[#333333] hover:border-[#FF5C00]/50 p-4 relative overflow-hidden group transition-all duration-300">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#FF5C00] shadow-[0_0_8px_rgba(255,92,0,0.8)]" />
          <div className="text-[10px] font-mono text-[#888888] uppercase tracking-widest">Active Fault Alerts</div>
          <div className="mt-2 text-3xl font-black text-white font-mono">{stats.faultAlerts} <span className="text-xs text-[#FF5C00]">WARNS</span></div>
          <div className="mt-1 flex items-center gap-1 font-mono text-[9px] text-[#FF5C00]">
             <AlertTriangle className="w-3 h-3" /> FLIGHT ENVELOPE DANGERS
          </div>
        </div>

        <div className="bg-[#050810]/40 border border-[#333333] hover:border-[#00F2FF]/50 p-4 relative overflow-hidden group transition-all duration-300">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#00F2FF] shadow-[0_0_8px_rgba(0,242,255,0.8)]" />
          <div className="text-[10px] font-mono text-[#888888] uppercase tracking-widest">Mean Hotspot Winds</div>
          <div className="mt-2 text-3xl font-black text-white font-mono">{stats.windTrend} <span className="text-xs text-white">KM/H</span></div>
          <div className="mt-1 flex items-center gap-1 font-mono text-[9px] text-[#A0A0A0]">
             <Wind className="w-3 h-3" /> ADVISORY STABLE LIMIT
          </div>
        </div>
      </div>

      {/* Main Terminal and Hotspots Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 items-start">
        {/* Scrollable Telemetry Terminal */}
        <div className="lg:col-span-8 bg-[#050505] border border-[#333333] p-6 relative shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] hex-panel flex flex-col h-[500px]">
           <div className="flex items-center justify-between border-b border-[#333333] pb-4 mb-4">
              <div className="flex items-center gap-2">
                 <Gauge className="w-5 h-5 text-[#00F2FF]" />
                 <h2 className="text-sm font-black uppercase text-white tracking-widest">Empirical Telemetry Signal Terminal</h2>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#00F2FF]">
                 <span className="w-2 h-2 rounded-full bg-[#00F2FF] animate-ping" /> LIVE FEEDS ACTIVE
              </div>
           </div>

           {/* Terminal Window content */}
           <div 
             ref={scrollRef}
             className="flex-1 overflow-y-auto space-y-3 font-mono text-xs text-[#A0A0A0] pr-2 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-black"
           >
              <AnimatePresence>
                 {logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`p-3 border bg-[#0A0A0B] flex flex-col gap-2 relative ${
                        log.status === 'CRIT' 
                          ? 'border-[#FF5C00]/40 shadow-[inset_0_0_15px_rgba(255,92,0,0.03)]' 
                          : log.status === 'WARN' 
                            ? 'border-yellow-500/20 shadow-[inset_0_0_15px_rgba(234,179,8,0.03)]' 
                            : 'border-[#333333]/50'
                      }`}
                    >
                       <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#333]/30 pb-1 text-[10px]">
                          <div className="flex items-center gap-2">
                             <span className="text-[#FF5C00] font-black">[{log.timestamp}]</span>
                             <span className="text-white font-black">{log.droneName}</span>
                             <span className="text-[#666]">{"//"}</span>
                             <span className="text-[#00F2FF]">{log.pilotClass}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="text-[#888]">{log.signalStrength}</span>
                             <span className="text-[#666]">|</span>
                             <span className="text-[#888]">{log.packetRate}</span>
                             <span className={`px-1.5 py-0.5 rounded font-black text-[8px] ${
                               log.status === 'CRIT' 
                                 ? 'bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/40' 
                                 : log.status === 'WARN' 
                                   ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/40' 
                                   : 'bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/40'
                             }`}>
                                {log.status}
                             </span>
                          </div>
                       </div>
                       <p className="text-[#E0E0E0] leading-relaxed select-text">
                          {log.message}
                       </p>
                    </motion.div>
                 ))}
              </AnimatePresence>
           </div>
        </div>

        {/* Airspace hotspots wind radar */}
        <div className="lg:col-span-4 bg-[#050505] border border-[#333333] p-6 relative shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] hex-panel h-[500px] flex flex-col">
           <div className="border-b border-[#333333] pb-4 mb-4">
              <div className="flex items-center gap-2">
                 <Wind className="w-5 h-5 text-[#00F2FF]" />
                 <h2 className="text-sm font-black uppercase text-white tracking-widest">FPV Airspace Hotspots</h2>
              </div>
           </div>

           <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {hotspots.map((h) => (
                 <div key={h.id} className="border border-[#333333] bg-[#0A0A0B] p-4 flex flex-col gap-3 relative hover:border-[#00F2FF]/30 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-1.5 h-full rounded-r" style={{
                       backgroundColor: h.status === 'RESTRICTED' ? '#FF5C00' : h.status === 'CAUTION' ? '#EAB308' : '#00FF66'
                    }} />

                    <div className="flex items-center justify-between border-b border-[#333]/30 pb-1">
                       <span className="font-mono text-xs font-black text-white truncate max-w-[180px]">{h.location}</span>
                       <span className={`font-mono text-[9px] font-black px-1.5 py-0.5 rounded border ${
                          h.status === 'RESTRICTED' 
                            ? 'bg-[#FF5C00]/10 border-[#FF5C00]/30 text-[#FF5C00]' 
                            : h.status === 'CAUTION' 
                              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' 
                              : 'bg-[#00FF66]/10 border-[#00FF66]/30 text-[#00FF66]'
                       }`}>
                          {h.status}
                       </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[10px] font-mono uppercase">
                       <div className="flex items-center gap-1.5 text-[#B0B0B0]">
                          <Wind className="w-3.5 h-3.5 text-[#00F2FF] shrink-0" />
                          <div>
                             <div className="text-[8px] text-[#666]">Winds</div>
                             <div className="font-black text-white">{h.windSpeed} km/h</div>
                          </div>
                       </div>
                       <div className="flex items-center gap-1.5 text-[#B0B0B0]">
                          <Thermometer className="w-3.5 h-3.5 text-[#FF5C00] shrink-0" />
                          <div>
                             <div className="text-[8px] text-[#666]">Ambient</div>
                             <div className="font-black text-white">{h.temp}°C</div>
                          </div>
                       </div>
                       <div className="col-span-2 flex items-center gap-1.5 text-[#B0B0B0] border-t border-[#333]/20 pt-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#00FF66] shrink-0" />
                          <div>
                             <div className="text-[8px] text-[#666]">Safety Override</div>
                             <div className="font-black text-white">
                                {h.gpsRescueReady ? 'GPS RESCUE OK (10+ SATS)' : 'MANUAL ACRO ONLY'}
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>

      {/* Component Reliability Matrix Section */}
      <div className="bg-[#050505] border border-[#333333] p-6 relative shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] hex-panel w-full">
         <div className="flex items-center gap-2 border-b border-[#333333] pb-4 mb-6">
            <Cpu className="w-5 h-5 text-[#FF5C00]" />
            <h2 className="text-sm font-black uppercase text-white tracking-widest">Empirical Component Reliability Matrix</h2>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockReliabilityMatrix.map((item) => (
               <div key={item.id} className="border border-[#333333] bg-[#0A0A0B] p-4 flex flex-col gap-3 relative hover:border-[#FF5C00]/30 transition-all duration-300 group">
                  <div className="absolute top-0 left-0 w-1 h-full" style={{
                     backgroundColor: item.rating === 'EXCELLENT' ? '#00FF66' : item.rating === 'STABLE' ? '#00F2FF' : '#FF5C00'
                  }} />

                  <div className="flex items-center justify-between border-b border-[#333]/30 pb-2">
                     <div>
                        <div className="text-[9px] font-mono text-[#666] uppercase tracking-wider">{item.category}</div>
                        <h3 className="text-sm font-mono font-black text-white group-hover:text-[#00F2FF] transition-colors">
                           {item.brand} <span className="text-[#E0E0E0]">{item.name}</span>
                        </h3>
                     </div>
                     <span className={`font-mono text-[9px] font-black px-2 py-0.5 rounded border ${
                        item.rating === 'EXCELLENT' 
                          ? 'bg-[#00FF66]/10 border-[#00FF66]/30 text-[#00FF66]' 
                          : item.rating === 'STABLE' 
                            ? 'bg-[#00F2FF]/10 border-[#00F2FF]/30 text-[#00F2FF]' 
                            : 'bg-[#FF5C00]/10 border-[#FF5C00]/30 text-[#FF5C00]'
                     }`}>
                        {item.rating}
                     </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 font-mono text-[10px] uppercase">
                     <div>
                        <div className="text-[8px] text-[#666]">Failure Index</div>
                        <div className="font-black text-white">{item.failureIndex}/10</div>
                     </div>
                     <div>
                        <div className="text-[8px] text-[#666]">MTBF Hours</div>
                        <div className="font-black text-white">{item.mtbfHours} hrs</div>
                     </div>
                     <div>
                        <div className="text-[8px] text-[#666]">Suitability</div>
                        <div className="font-black text-white">
                           {item.rating === 'RISKY' ? 'CAUTION GATED' : 'CERTIFIED'}
                        </div>
                     </div>
                  </div>

                  <div className="mt-1 flex items-start gap-1.5 p-2 bg-[#050505] border border-[#333]/30 font-mono text-[10px] text-[#A0A0A0]">
                     <Info className="w-3.5 h-3.5 text-[#00F2FF] shrink-0 mt-0.5" />
                     <p className="leading-normal">{item.notes}</p>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
