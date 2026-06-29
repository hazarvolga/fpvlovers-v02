'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Send, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function NewsletterWidget({ className }: { className?: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, source: 'tools_hub_widget' }),
      });

      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className={cn("glass-card p-[1px] rounded-2xl relative overflow-hidden group", className)}>
       {/* Rotating border effect */}
       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00F5FF]/50 to-transparent rotate-0 group-hover:animate-[spin_4s_linear_infinite] transition-all opacity-0 group-hover:opacity-100" />

       <div className="bg-[#050810]/95 backdrop-blur-xl rounded-2xl p-6 md:p-8 relative h-full flex flex-col items-center text-center z-10">
          <div className="w-12 h-12 rounded-full bg-[#00F5FF]/10 flex items-center justify-center border border-[#00F5FF]/30 mb-4 shadow-[0_0_15px_rgba(0,245,255,0.15)]">
             <Mail className="w-6 h-6 text-[#00F5FF]" />
          </div>

          <h3 className="text-2xl font-black uppercase text-white tracking-widest mb-2 line-clamp-1">
             The Weekly <span className="text-[#00F5FF]">Propeller</span>
          </h3>
          <p className="text-white/50 text-sm font-semibold max-w-sm mb-6 leading-relaxed">
             Join the weekly briefing. Get new guides, tools, and FPV build updates every Saturday. No spam, just the useful stuff.
          </p>

          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              {status === 'idle' || status === 'error' ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onSubmit={subscribe}
                  className="relative flex items-center"
                >
                  <input
                     type="email"
                     placeholder="Email address"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className={cn(
                        "w-full bg-black/50 border border-white/20 rounded-lg py-3 pl-4 pr-32 text-sm font-mono text-[#00F5FF] placeholder:text-white/20 focus:outline-none focus:border-[#00F5FF]/60 transition-colors",
                        status === 'error' && "border-red-500/50 text-red-400 focus:border-red-500"
                     )}
                  />
                  <Button
                    type="submit"
                    variant="cyber"
                    className="absolute right-1 top-1 bottom-1 h-auto text-[10px] px-4"
                  >
                     Subscribe <Send className="w-3 h-3 ml-2" />
                  </Button>
                </motion.form>
              ) : status === 'loading' ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center p-4"
                >
                   <Zap className="w-6 h-6 text-[#00F5FF] animate-pulse mb-2" />
                   <span className="font-mono text-[10px] text-[#00F5FF] uppercase tracking-widest">Subscribing...</span>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
                >
                   <CheckCircle2 className="w-6 h-6 text-green-400 mb-2" />
                   <span className="font-mono text-xs text-green-400 font-bold uppercase tracking-widest">Subscription confirmed</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 flex items-center justify-center gap-2 text-red-400 font-mono text-[10px] uppercase"
                >
                   <AlertCircle className="w-3 h-3" /> We could not subscribe this email. Please check it and try again.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
       </div>
    </div>
  );
}
