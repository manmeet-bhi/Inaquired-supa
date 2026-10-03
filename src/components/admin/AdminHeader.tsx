import React from 'react';
import { Menu, ArrowLeft } from 'lucide-react';

export interface AdminHeaderProps {
  title: string;
  description?: string;
  onOpenMobileMenu?: () => void;
  backButton?: {
    label: string;
    onClick: () => void;
  };
  badge?: {
    label: string;
    variant?: 'default' | 'success' | 'warning' | 'info';
  };
  actions?: React.ReactNode;
  className?: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  description,
  onOpenMobileMenu,
  backButton,
  badge,
  actions,
  className = '',
}) => {
  const getBadgeStyle = (variant?: 'default' | 'success' | 'warning' | 'info') => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      case 'info':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <header className={`sticky top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white/90 px-4 sm:px-6 lg:px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 transition-all duration-300 shrink-0 ${className}`}>
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Mobile Toggle / Back Button & Title / Subtitle */}
        <div className="flex items-center gap-3 min-w-0">
          {backButton ? (
            <button
              type="button"
              onClick={backButton.onClick}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors cursor-pointer shrink-0"
              aria-label={backButton.label}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{backButton.label}</span>
            </button>
          ) : onOpenMobileMenu ? (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          ) : null}

          {backButton && (
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2.5 truncate">
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white truncate">
                {title}
              </h1>
              {badge && (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${getBadgeStyle(badge.variant)}`}>
                  {badge.label}
                </span>
              )}
            </div>
            {description && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block truncate">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Right: Actions / Quick CTAs */}
        {actions && (
          <div className="flex items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
};
