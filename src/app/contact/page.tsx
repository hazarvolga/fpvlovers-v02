import React from 'react';
import Link from 'next/link';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { ContactForm } from './ContactForm';
import { Mail, Clock, MessageSquare, ShieldCheck } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Niche Support | FPVLovers',
  description: 'Reach out to FPVLovers for general support, sponsorship inquiries, hardware vendor partnerships, and content corrections.',
};

export default function ContactPage() {
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Contact', isCurrentPage: true },
  ];

  const infoItems = [
    {
      icon: Mail,
      label: 'Direct Email',
      value: 'hello@fpvlovers.com.tr',
      desc: 'For long-form proposals, vendor spec sheets, and official letters.',
    },
    {
      icon: Clock,
      label: 'Response SLA',
      value: '24-48 Hours',
      desc: 'Our editorial inbox is reviewed regularly for corrections, business inquiries, and support requests.',
    },
    {
      icon: MessageSquare,
      label: 'Content Corrections',
      value: 'Quick Action',
      desc: 'Spotted a spec error or broken link? Select the Correction tag below.',
    },
  ];

  return (
    <div className="fpv-public-shell mx-auto max-w-4xl px-4 py-12 pt-28 font-sans text-zinc-300 sm:px-6 lg:px-8">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      {/* Header Panel */}
      <div className="fpv-public-panel relative mb-10 overflow-hidden rounded-xl p-8 shadow-2xl md:p-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF5C00]/45 to-transparent" />
        <div className="pointer-events-none absolute inset-0 carbon-grid opacity-10" />

        <div className="relative z-10">
          <Mail className="w-12 h-12 text-[#FF5C00] mb-6 animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-100 mb-4 uppercase">
            Contact <span className="text-[#FF5C00]">Support</span>
          </h1>
          <p className="fpv-kicker">
            Corrections, partnerships, sponsorships, and support
          </p>
          <p className="text-xs text-zinc-500 font-mono mt-2 uppercase tracking-widest">
            Last Updated: June 18, 2026
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Support info column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 border border-white/5 bg-zinc-900/40 rounded-xl space-y-6">
            <h3 className="text-sm font-mono font-black uppercase text-zinc-100 tracking-widest flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#FF5C00]" /> Inquiry Guidelines
            </h3>

            <p className="text-xs leading-relaxed text-zinc-400">
              Please choose the correct inquiry department on the form. This helps us route corrections, vendor notes, and partnership proposals responsibly.
            </p>

            <div className="space-y-4 pt-4 border-t border-white/5">
              {infoItems.map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <item.icon className="w-4.5 h-4.5 text-[#FF5C00] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-mono font-black uppercase text-white tracking-wide">{item.label}</div>
                    <div className="text-xs text-zinc-300 font-bold mb-0.5">{item.value}</div>
                    <div className="text-[10px] text-zinc-500 leading-normal">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form column */}
        <div className="lg:col-span-7">
          <ContactForm />
        </div>
      </div>

      {/* Return Button */}
      <div className="mt-12 text-center p-6 border-t border-white/5 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
        <Link href="/" className="inline-block text-[#FF5C00] hover:underline">
          Return to homepage
        </Link>
      </div>
    </div>
  );
}
