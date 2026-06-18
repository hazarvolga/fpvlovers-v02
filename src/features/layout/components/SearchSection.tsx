"use client"; // Interactive global search input and navigation controller

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Radio } from 'lucide-react';

export function SearchSection() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <section className="relative z-40 w-full border-b border-[#1A1A1D] bg-[#070708]/60 backdrop-blur-md font-mono">
      {/* Decorative top red accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#FF5C00]/40 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left Telemetry Status */}
        <div className="flex items-center gap-2.5 text-[10px] tracking-wider text-[#A0A0A0] uppercase">
          <Radio className="w-3.5 h-3.5 text-[#00FF66] animate-pulse" />
          <span className="text-[#00FF66] font-bold">LINK ACTIVE</span>
          <span className="text-[#333]">|</span>
          <span>SYS.SCANNER: STANDBY</span>
        </div>

        {/* Center/Right Dynamic Search Box */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-xs md:max-w-sm">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#666] group-focus-within:text-[#00F2FF]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search FPV guides... (Press Enter)"
            className="w-full pl-9 pr-4 py-1.5 bg-black/60 border border-[#222] rounded-md text-white font-mono text-[11px] uppercase tracking-wider focus:outline-none focus:border-[#00F2FF] focus:ring-1 focus:ring-[#00F2FF] transition-all placeholder-[#555]"
          />
        </form>
      </div>
    </section>
  );
}
