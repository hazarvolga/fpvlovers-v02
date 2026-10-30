import React from 'react';
import Link from 'next/link';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { Shield, Eye, Lock, FileText } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | FPVLovers',
  description: 'Learn how FPVLovers manages, secures, and handles cookies, analytics, and account data.',
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
      - **Analytics:** We use Google Analytics (GA4) to collect aggregated data like page views, device types, and browser types to optimize rendering. No personal identifying information (PII) is linked.
      - **Newsletter Subscription:** If you explicitly opt-in, we collect your email address via our secure newsletter form.`,
    },
    {
      icon: Lock,
      title: '2. How We Use and Protect Data',
      content: `Your data is strictly used to improve your site experience and pilot calibration profiles:
      
      - **No Sale of Data:** We never sell, trade, or rent your personal data to third parties.
      - **Parameter Storage:** Pilot specs, build calculations, and tuning parameters are processed locally where possible. Database writes use parameterized queries to prevent injection attacks.
      - **Encryption:** Session and account data are protected using industry-standard TLS encryption.`,
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
    <div className="fpv-public-shell mx-auto max-w-4xl px-4 py-12 pt-28 font-sans text-zinc-300 sm:px-6 lg:px-8">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      {/* Header Panel */}
      <div className="fpv-public-panel relative mb-10 overflow-hidden rounded-xl p-8 shadow-2xl md:p-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF5C00]/45 to-transparent" />
        <div className="pointer-events-none absolute inset-0 carbon-grid opacity-10" />

        <div className="relative z-10">
          <Shield className="mb-6 h-12 w-12 text-[#FF5C00]" />
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-100 mb-4 uppercase">
            Privacy <span className="text-[#FF5C00]">Policy</span>
          </h1>
          <p className="fpv-kicker">
            Data handling and privacy rights
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
              <section.icon className="h-5 w-5 text-[#FF5C00]" />
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
        <Link href="/" className="mt-4 inline-block text-[#FF5C00] hover:underline">
          Return to homepage
        </Link>
      </div>
    </div>
  );
}
