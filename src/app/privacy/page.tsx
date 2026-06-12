import React from 'react';
import Link from 'next/link';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { Shield, Eye, Lock, FileText } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | FPVLovers',
  description: 'Learn how FPVLovers manages, secures, and handles pilot telemetry, cookies, and analytics data.',
};

export default function PrivacyPage() {
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Privacy Policy', isCurrentPage: true },
  ];

  const sections = [
    {
      icon: Eye,
      title: '1. Information We Collect',
      content: `FPVLovers operates as a trust-first platform. We collect minimal personal data. This includes:
      
      - **Pilot Dossier Data:** If you take our Pilot Assessment, we store your results, class rating, and module completion stats in browser cookies (local storage) and, if authenticated, securely in our PostgreSQL database.
      - **Telemetry & Analytics:** We use Google Analytics (GA4) to collect aggregated data like page views, device types, and browser types to optimize rendering. No personal identifying information (PII) is linked.
      - **Newsletter Subscription:** If you explicitly opt-in, we collect your email address via our secure newsletter form.`,
    },
    {
      icon: Lock,
      title: '2. How We Use and Protect Data',
      content: `Your data is strictly used to improve your site experience and pilot calibration profiles:
      
      - **No Sale of Data:** We never sell, trade, or rent your personal data to third parties.
      - **Parameter Storage:** Pilot specs, build calculations, and tuning parameters are processed locally where possible. Database writes use parameterized queries to prevent injection attacks.
      - **Encryption:** Telemetry and session data are stored using industry-standard TLS encryption.`,
    },
    {
      icon: Shield,
      title: '3. Cookies and Third-Party Links',
      content: `We use cookies to maintain your session states and remember your local FPV build progress:
      
      - **Necessary Cookies:** Used to hold your active pilot dossier profile and offline calibrations.
      - **Third-Party Services:** Our site contains affiliate modules linking to retail partners (Amazon, GetFPV, Banggood, RaceDayQuads). These third parties use cookies to track commissions. We recommend reviewing their respective privacy policies.`,
    },
    {
      icon: FileText,
      title: '4. Contact and Rights',
      content: `Under GDPR/KVKK guidelines, you have full authority over your data:
      
      - You can inspect, modify, or completely delete your pilot dossier and credentials at any time.
      - To request data deletion, contact us directly at hello@fpvlovers.com.tr.`,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 text-zinc-300 font-sans">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      {/* Header Panel */}
      <div className="relative p-8 md:p-12 border border-white/5 bg-zinc-950 rounded-xl shadow-2xl overflow-hidden mb-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00F2FF]/40 to-transparent" />
        <div className="pointer-events-none absolute inset-0 carbon-grid opacity-10" />

        <div className="relative z-10">
          <Shield className="w-12 h-12 text-[#00F2FF] mb-6" />
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-100 mb-4 uppercase">
            Privacy <span className="text-[#00F2FF]">Policy</span>
          </h1>
          <p className="text-[10px] uppercase text-[#A0A0A0] tracking-widest leading-relaxed font-mono">
            {"// PROTOCOL ID: SYS.PRIVACY_DATA_HYGIENE_v1.0"}
          </p>
          <p className="text-xs text-zinc-500 font-mono mt-2 uppercase tracking-widest">
            Last Updated: June 12, 2026
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((section, idx) => (
          <div key={idx} className="p-6 md:p-8 border border-white/5 bg-zinc-900/40 rounded-xl">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
              <section.icon className="w-5 h-5 text-[#00F2FF]" />
              <h2 className="text-lg font-bold uppercase text-zinc-100 tracking-wider">
                {section.title}
              </h2>
            </div>
            <div className="text-sm leading-relaxed text-zinc-400 font-sans whitespace-pre-line">
              {section.content}
            </div>
          </div>
        ))}
      </div>

      {/* Legal Footer Note */}
      <div className="mt-12 text-center p-6 border-t border-white/5 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
        <p>FPVLovers operates in full compliance with global privacy standards. Fly responsibly.</p>
        <Link href="/" className="mt-4 inline-block text-[#00F2FF] hover:underline">
          Return to Mission Control
        </Link>
      </div>
    </div>
  );
}
