import React, { useState } from 'react';
import { ShieldAlert, Info, Cpu } from 'lucide-react';

interface DroneAnatomyMapProps {
  activeCategory: string;
  onSelectCategory: (category: string, searchVal?: string) => void;
}

interface Hotspot {
  id: string;
  name: string;
  category: string;
  searchVal?: string;
  x: number; // percentage
  y: number; // percentage
  telemetry: string;
  status: 'ONLINE' | 'ACTIVE' | 'SAFE' | 'NOMINAL';
  color: string;
}

export function DroneAnatomyMap({ activeCategory, onSelectCategory }: DroneAnatomyMapProps) {
  const [hoveredHotspot, setHoveredHotspot] = useState<Hotspot | null>(null);

  const hotspots: Hotspot[] = [
    {
      id: 'camera',
      name: 'FPV Goggles & Camera',
      category: 'Video System',
      searchVal: 'vtx',
      x: 50,
      y: 22,
      telemetry: 'FPV camera captures uncompressed low-latency live video, sending it directly to the goggles.',
      status: 'ACTIVE',
      color: '#00F2FF'
    },
    {
      id: 'fc',
      name: 'Flight Controller (FC)',
      category: 'Flight Control System',
      searchVal: 'flight-controller',
      x: 50,
      y: 44,
      telemetry: 'The brain of the drone. Evaluates gyro sensors and pilot stick commands to stabilize the quad.',
      status: 'ONLINE',
      color: '#00FF66'
    },
    {
      id: 'esc',
      name: 'ESC Stack',
      category: 'Power System',
      searchVal: 'esc',
      x: 50,
      y: 56,
      telemetry: 'Electronic Speed Controller. Converts battery current to feed brushless motors at precise RPMs.',
      status: 'NOMINAL',
      color: '#FF5C00'
    },
    {
      id: 'motor',
      name: 'Brushless Motors',
      category: 'Start Here',
      searchVal: 'motor-kv',
      x: 22,
      y: 24,
      telemetry: 'Brushless motors translate electric pulses into thrust, spinning props to control flight pitch.',
      status: 'ACTIVE',
      color: '#FF5C00'
    },
    {
      id: 'vtx',
      name: 'Video Transmitter (VTX)',
      category: 'Video System',
      searchVal: 'vtx',
      x: 50,
      y: 72,
      telemetry: 'Broadcasts the FPV camera video stream wirelessly over radio frequencies to your pilot goggles.',
      status: 'ACTIVE',
      color: '#00F2FF'
    },
    {
      id: 'rx',
      name: 'Radio Receiver (RX)',
      category: 'Radio Control System',
      searchVal: 'elrs',
      x: 35,
      y: 68,
      telemetry: 'Captures remote control signals (e.g. ELRS) from the transmitter and routes commands to the FC.',
      status: 'NOMINAL',
      color: '#00FF66'
    },
    {
      id: 'battery',
      name: 'LiPo Battery Pack',
      category: 'Power System',
      searchVal: 'lipo',
      x: 50,
      y: 84,
      telemetry: 'Lithium Polymer power source. Delivers high current for aggressive flight. Requires safety storage.',
      status: 'SAFE',
      color: '#FF5C00'
    },
    {
      id: 'gps',
      name: 'GPS Rescue Module',
      category: 'Navigation System',
      searchVal: 'gps-rescue',
      x: 50,
      y: 93,
      telemetry: 'Satellite receiver enabling Return-To-Home safety failsafes if radio connection is ever lost.',
      status: 'ONLINE',
      color: '#00F2FF'
    }
  ];

  return (
    <div className="relative glass-panel hex-panel p-6 overflow-hidden bg-black/60 border border-[#1A1A1A] flex flex-col md:flex-row gap-6 items-center">
      {/* Absolute siber background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c0c0e_1px,transparent_1px),linear-gradient(to_bottom,#0c0c0e_1px,transparent_1px)] bg-[size:20px_20px] opacity-40 pointer-events-none" />
      
      {/* SVG Interactive Map */}
      <div className="relative w-full max-w-[340px] aspect-[4/5] bg-black/40 border border-[#222] rounded-lg p-2 overflow-hidden flex items-center justify-center">
        {/* Radar concentric sweep circles */}
        <div className="absolute w-64 h-64 border border-[#00F2FF]/5 rounded-full pointer-events-none animate-pulse" />
        <div className="absolute w-40 h-40 border border-[#00FF66]/5 rounded-full pointer-events-none" />
        <div className="absolute w-12 h-12 border border-white/5 rounded-full pointer-events-none" />
        
        {/* Tactical Crosshair Indicators */}
        <div className="absolute left-4 top-4 font-mono text-[9px] text-[#A0A0A0] opacity-50 uppercase">{"[SYS.ANATOMY_ACTIVE]"}</div>
        <div className="absolute right-4 bottom-4 font-mono text-[9px] text-[#A0A0A0] opacity-50 uppercase">{"[LOC.QAV_S2_QUAD]"}</div>

        {/* FPV Drone Vector Illustration (Sleek minimalist representation) */}
        <svg viewBox="0 0 100 120" className="w-full h-full opacity-80 pointer-events-none max-h-[290px]">
          {/* Glowing carbon arm structures */}
          <line x1="22" y1="24" x2="50" y2="50" stroke="#1A1A1E" strokeWidth="3" />
          <line x1="78" y1="24" x2="50" y2="50" stroke="#1A1A1E" strokeWidth="3" />
          <line x1="22" y1="88" x2="50" y2="50" stroke="#1A1A1E" strokeWidth="3" />
          <line x1="78" y1="88" x2="50" y2="50" stroke="#1A1A1E" strokeWidth="3" />
          
          <line x1="22" y1="24" x2="50" y2="50" stroke="#00F2FF" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.3" />
          <line x1="78" y1="24" x2="50" y2="50" stroke="#00F2FF" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.3" />
          
          {/* Main frame plate */}
          <rect x="42" y="24" width="16" height="66" rx="2" fill="#0D0D10" stroke="#333336" strokeWidth="1" />
          <rect x="44" y="32" width="12" height="42" rx="1" fill="#050507" stroke="#1E1E22" strokeWidth="0.8" />

          {/* Motor guards / Stators */}
          <circle cx="22" cy="24" r="5" fill="none" stroke="#2a2a30" strokeWidth="1" />
          <circle cx="78" cy="24" r="5" fill="none" stroke="#2a2a30" strokeWidth="1" />
          <circle cx="22" cy="88" r="5" fill="none" stroke="#2a2a30" strokeWidth="1" />
          <circle cx="78" cy="88" r="5" fill="none" stroke="#2a2a30" strokeWidth="1" />

          <circle cx="22" cy="24" r="2.5" fill="#131316" stroke="#555" strokeWidth="0.8" />
          <circle cx="78" cy="24" r="2.5" fill="#131316" stroke="#555" strokeWidth="0.8" />
          <circle cx="22" cy="88" r="2.5" fill="#131316" stroke="#555" strokeWidth="0.8" />
          <circle cx="78" cy="88" r="2.5" fill="#131316" stroke="#555" strokeWidth="0.8" />

          {/* Propeller sweep outlines */}
          <path d="M 12 24 C 12 12, 32 12, 32 24" fill="none" stroke="#00F2FF" strokeWidth="0.5" opacity="0.15" />
          <path d="M 32 24 C 32 36, 12 36, 12 24" fill="none" stroke="#00F2FF" strokeWidth="0.5" opacity="0.15" />

          <path d="M 68 24 C 68 12, 88 12, 88 24" fill="none" stroke="#00F2FF" strokeWidth="0.5" opacity="0.15" />
          <path d="M 88 24 C 88 36, 68 36, 68 24" fill="none" stroke="#00F2FF" strokeWidth="0.5" opacity="0.15" />

          {/* Camera housing on front */}
          <rect x="46" y="16" width="8" height="8" rx="1" fill="#0D0D10" stroke="#00F2FF" strokeWidth="0.8" opacity="0.7" />
          <circle cx="50" cy="20" r="1.8" fill="#000" stroke="#00F2FF" strokeWidth="0.5" />
          
          {/* GPS tail mount */}
          <rect x="47" y="90" width="6" height="5" fill="#15151A" stroke="#00F2FF" strokeWidth="0.5" opacity="0.8" />
        </svg>

        {/* Dynamic Glowing Hotspots Overlay */}
        {hotspots.map((spot) => {
          const isSelected = activeCategory.toLowerCase() === spot.category.toLowerCase();
          return (
            <button
              key={spot.id}
              onClick={() => onSelectCategory(spot.category, spot.searchVal)}
              onMouseEnter={() => setHoveredHotspot(spot)}
              onMouseLeave={() => setHoveredHotspot(null)}
              className="absolute group z-20 transition-all duration-300"
              style={{
                left: `${spot.x}%`,
                top: `${spot.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Outer pulsing ping */}
              <span 
                className={`absolute inline-flex h-4 w-4 rounded-full opacity-60 animate-ping transition-all`}
                style={{ 
                  backgroundColor: spot.color,
                  animationDuration: isSelected ? '1.5s' : '3s'
                }}
              />
              {/* Inner glowing dot */}
              <span 
                className={`relative flex rounded-full h-2.5 w-2.5 shadow-lg border border-black/80 transition-all duration-300 ${
                  isSelected ? 'scale-125' : 'group-hover:scale-110'
                }`}
                style={{ 
                  backgroundColor: isSelected ? '#FFFFFF' : spot.color,
                  boxShadow: `0 0 10px ${spot.color}`
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Detail & Telemetry Console */}
      <div className="flex-1 w-full flex flex-col gap-4 font-mono">
        <div className="border border-[#1A1A1A] bg-black/80 p-4 rounded-lg flex flex-col gap-3 relative">
          <div className="absolute right-3 top-3 opacity-20">
            <Cpu className="w-5 h-5 text-[#00F2FF]" />
          </div>
          
          <span className="text-[10px] tracking-widest text-[#FF5C00] font-black uppercase">
            {"// DRONE_ANATOMY_TELEMETRY"}
          </span>

          {hoveredHotspot ? (
            <div className="flex flex-col gap-2">
              <h4 className="text-white text-md font-bold uppercase tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hoveredHotspot.color }} />
                {hoveredHotspot.name}
              </h4>
              <div className="text-[11px] text-[#A0A0A0] leading-relaxed uppercase">
                {hoveredHotspot.telemetry}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[9px] bg-black border border-[#222] px-2 py-0.5 rounded text-[#00FF66]">
                  STATUS: {hoveredHotspot.status}
                </span>
                <span className="text-[9px] text-[#00F2FF] uppercase">
                  {"-> CLICK TO ISOLATE"}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <h4 className="text-white text-md font-bold uppercase tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A0A0A0]" />
                Sensor Diagnostic Mode
              </h4>
              <p className="text-[11px] text-[#707070] leading-relaxed uppercase">
                Hover over glowing drone component nodes to capture dynamic telemetry feeds and isolate interconnected system terminology.
              </p>
              <div className="flex items-center gap-2 mt-1 text-[9px] text-[#555]">
                <Info className="w-3.5 h-3.5 text-[#FF5C00]/60" />
                SYSTEM READY. WAITING FOR PILOT CAPTURE.
              </div>
            </div>
          )}
        </div>

        {/* Selected Component Quick Summary */}
        <div className="border border-[#1A1A1A] bg-black/40 p-4 rounded-lg text-xs flex flex-col gap-1.5">
          <span className="text-[9px] text-[#555] uppercase">Active Target Isolation</span>
          <div className="flex justify-between items-center">
            <span className="text-white uppercase font-bold tracking-tight">
              {activeCategory === 'all' ? 'FULL SYSTEMS VIEW' : `${activeCategory}`}
            </span>
            {activeCategory !== 'all' && (
              <button 
                onClick={() => onSelectCategory('all')}
                className="text-[9px] text-[#FF5C00] hover:underline uppercase"
              >
                {"[Reset Filter]"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
