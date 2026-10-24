'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CookieBanner() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already accepted/declined cookies.
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

  // Compact strip: sits just above the mobile utility bar and never covers
  // the primary hero call-to-action.
  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-0 bottom-16 z-40 border-t border-white/10 bg-[#050810]/95 backdrop-blur-md lg:bottom-0"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:gap-4">
        <p className="flex-1 text-[11px] leading-snug text-zinc-400">
          We use necessary and affiliate referral cookies.{' '}
          <Link href="/privacy" className="text-[#ff8a8d] hover:underline">
            Privacy Policy
          </Link>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleDecline}
            className="min-h-9 rounded border border-white/10 px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
          >
            Decline
          </button>
          <Button
            variant="amber"
            size="sm"
            onClick={handleAccept}
            className="min-h-9 px-4 font-mono text-[10px] font-black uppercase"
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
