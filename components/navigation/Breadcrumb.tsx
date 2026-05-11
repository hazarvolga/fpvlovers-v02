import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

export function CyberBreadcrumb({ items, className }: { items: BreadcrumbItem[], className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center space-x-2", className)}>
      <ol className="flex items-center space-x-2 font-mono text-[10px] uppercase tracking-widest text-white/40">
        <li>
          <div className="flex items-center">
            <Link href="/" className="hover:text-[#00F5FF] transition-colors flex items-center gap-1 group">
              <Home className="w-3 h-3 group-hover:text-[#00F5FF] transition-colors" />
              <span className="sr-only">Home</span>
            </Link>
          </div>
        </li>
        {items.map((item, index) => (
          <li key={item.label}>
            <div className="flex items-center">
              <ChevronRight className="w-3 h-3 mx-1 text-[#00F5FF]/50" />
              {item.href && !item.isCurrentPage ? (
                <Link 
                  href={item.href} 
                  className="hover:text-[#00F5FF] transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={cn("font-bold", item.isCurrentPage ? "text-[#00F5FF] drop-shadow-[0_0_8px_rgba(0,245,255,0.5)]" : "text-white/60")}>
                  {item.label}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div className="hidden sm:block flex-1 h-[1px] bg-gradient-to-r from-[#00F5FF]/20 to-transparent ml-4" />
    </nav>
  );
}
