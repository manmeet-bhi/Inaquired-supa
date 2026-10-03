import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItemProps {
  label: string;
  path?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItemProps[];
  onNavigate?: (path: string) => void;
  className?: string;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ items, onNavigate, className = '' }) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs text-slate-500 dark:text-slate-400 ${className}`}>
      <ol className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <li>
          <button
            onClick={() => onNavigate ? onNavigate('/') : (window.location.href = '/')}
            className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            title="Home"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only">Home</span>
          </button>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5 sm:gap-2">
              <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" aria-hidden="true" />
              {isLast || !item.path ? (
                <span
                  className="font-medium text-slate-900 dark:text-white max-w-[200px] sm:max-w-xs truncate"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <button
                  onClick={() => onNavigate ? onNavigate(item.path!) : (window.location.href = item.path!)}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate max-w-[150px] sm:max-w-[200px]"
                >
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
