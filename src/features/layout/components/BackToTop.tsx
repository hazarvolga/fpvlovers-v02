'use client';
// Scroll interaction requires browser API — must be client component.
import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Sayfanın başına dön"
      className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-sm border border-[#ff3131]/40 bg-[#09090b]/90 text-[#ff3131] backdrop-blur-sm transition-all hover:border-[#ff3131] hover:bg-[#ff3131]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3131]"
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}
