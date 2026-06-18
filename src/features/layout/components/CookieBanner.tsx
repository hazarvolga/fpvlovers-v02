'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Info } from 'lucide-react';

export function CookieBanner() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already accepted/declined cookie protocols
    const consent = localStorage.getItem('fpvlovers_cookie_consent');
    if (!consent) {
      queueMicrotask(() => {
        setIsOpen(true);
      });
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('fpvlovers_cookie_consent', 'accepted');
    setIsOpen(false);
  };

  const handleDecline = () => {
    localStorage.setItem('fpvlovers_cookie_consent', 'declined');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-50 animate-bounce-short">
      <div className="relative hex-panel glass-panel p-5 border border-[#00F2FF]/30 bg-[#050810]/95 backdrop-blur-md rounded-lg shadow-[0_0_30px_rgba(0,242,255,0.15)] overflow-hidden">
        {/* Telemetry Accent Lines */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00F2FF] to-transparent" />
        <div className="absolute inset-0 carbon-grid opacity-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <ShieldCheck className="w-4 h-4 text-[#00F2FF]" />
            <span className="text-[10px] font-mono font-black uppercase text-white tracking-widest">
              Cookie Protocol Active
            </span>
          </div>

          {/* Description */}
          <p className="text-[11px] font-sans text-zinc-400 leading-normal">
            FPVLovers uses necessary system cookies and third-party affiliate cookies to track commission referrals. By clicking accept, you authorize cookie storage. Review our{' '}
            <Link href="/privacy" className="text-[#00F2FF] hover:underline font-mono">
              Privacy Policy
            </Link>.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="amber"
              size="sm"
              onClick={handleAccept}
              className="flex-1 uppercase font-mono font-black text-[9px] py-1.5"
            >
              Accept Protocol
            </Button>
            <button
              onClick={handleDecline}
              className="px-3 py-1.5 border border-white/10 hover:border-white/20 rounded text-[9px] font-mono uppercase text-zinc-400 hover:text-white transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
