import React from 'react';
import Link from 'next/link';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { Cpu, Activity, Zap, Calculator, Crosshair, Wrench } from 'lucide-react';

export const metadata = {
  title: 'Oracle Tools Hub | FPVLovers',
  description: 'Catalog-backed FPV calculators, compatibility checks, and guarded tuning tools for pilots.',
};

const TOOLS = [
  {
    name: 'Hardware Analyzer',
    description: 'Catalog-assisted compatibility and risk check with optional AI review when the gateway responds.',
    href: '/tools/hardware-analyzer',
    icon: Cpu,
    color: 'text-[#00A8B3]',
    borderColor: 'border-[#00A8B3]/20',
    shadowColor: 'shadow-[inset_0_0_40px_rgba(0,168,179,0.05)]',
    hoverColor: 'hover:border-[#00A8B3]/50',
  },
  {
    name: 'Blackbox Tuning',
    description: 'CSV/text-export tuning guardrail for Betaflight noise, oscillation, and filter review.',
    href: '/tools/blackbox-tuning',
    icon: Activity,
    color: 'text-[#FF5C00]',
    borderColor: 'border-[#FF5C00]/20',
    shadowColor: 'shadow-[inset_0_0_40px_rgba(255,92,0,0.05)]',
    hoverColor: 'hover:border-[#FF5C00]/50',
  },
  {
    name: 'Component Duel',
    description: 'Side-by-side FPV hardware comparisons against reference data.',
    href: '/tools/component-duel',
    icon: Zap,
    color: 'text-[#FFD700]',
    borderColor: 'border-[#FFD700]/20',
    shadowColor: 'shadow-[inset_0_0_40px_rgba(255,215,0,0.05)]',
    hoverColor: 'hover:border-[#FFD700]/50',
  },
  {
    name: 'Build Calculator',
    description: 'Calculate thrust, RPM, flight time and battery draw for your custom build.',
    href: '/tools/calculator',
    icon: Calculator,
    color: 'text-[#00FF66]',
    borderColor: 'border-[#00FF66]/20',
    shadowColor: 'shadow-[inset_0_0_40px_rgba(0,255,102,0.05)]',
    hoverColor: 'hover:border-[#00FF66]/50',
  },
  {
    name: 'Part Matcher',
    description: 'Catalog-backed compatibility checks for FPV parts, voltage, fit, and build risk.',
    href: '/tools/part-matcher',
    icon: Wrench,
    color: 'text-[#FF00FF]',
    borderColor: 'border-[#FF00FF]/20',
    shadowColor: 'shadow-[inset_0_0_40px_rgba(255,0,255,0.05)]',
    hoverColor: 'hover:border-[#FF00FF]/50',
  },
  {
    name: 'Flight Critic',
    description: 'Future video-analysis workspace. Not marketed as live frame-level review yet.',
    href: '/tools/flight-critic',
    icon: Crosshair,
    color: 'text-[#0088FF]',
    borderColor: 'border-[#0088FF]/20',
    shadowColor: 'shadow-[inset_0_0_40px_rgba(0,136,255,0.05)]',
    hoverColor: 'hover:border-[#0088FF]/50',
  }
];

export default function ToolsHubPage() {
  const breadcrumbs = [
    { label: 'Oracle Tools', isCurrentPage: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="relative p-8 md:p-12 border border-white/5 bg-zinc-950 rounded-xl shadow-2xl overflow-hidden text-center mb-12">
         <Wrench className="w-12 h-12 text-[#FF5C00] mb-6 opacity-80 inline-block" />
         <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-100 mb-4">
           Oracle <span className="text-[#FF5C00]">Tools Hub</span>
         </h1>
         <p className="text-sm font-sans text-zinc-400 max-w-2xl leading-relaxed mx-auto">
           Catalog-backed calculators, compatibility checks, and guarded AI-assisted workflows. Tools show their source mode instead of pretending every answer is fully RAG-grounded.
         </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TOOLS.map((tool) => (
          <Link key={tool.name} href={tool.href} className="group block">
            <div className={`h-full relative p-6 bg-zinc-950 rounded-xl border border-white/5 ${tool.hoverColor} hover:shadow-2xl transition-all duration-300`}>
              <div className="flex flex-col h-full">
                <tool.icon className={`w-10 h-10 ${tool.color} mb-4 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform`} />
                <h2 className="text-xl font-bold tracking-tight text-zinc-100 mb-3">
                  {tool.name}
                </h2>
                <p className="text-sm font-sans text-zinc-400 leading-relaxed flex-grow">
                  {tool.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
