import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AerospaceBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function AerospaceBreadcrumb({ items, className }: AerospaceBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-2", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <React.Fragment key={item.label}>
            <div className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link 
                  href={item.href}
                  className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-[#00F2FF] transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={cn(
                  "text-[10px] font-mono uppercase tracking-widest",
                  isLast ? "text-zinc-100 font-bold" : "text-zinc-500"
                )}>
                  {item.label}
                </span>
              )}
            </div>
            
            {!isLast && (
              <ChevronRight className="h-3 w-3 text-zinc-700 opacity-50" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
