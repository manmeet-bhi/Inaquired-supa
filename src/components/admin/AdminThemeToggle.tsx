import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface AdminThemeToggleProps {
  isCollapsed?: boolean;
  variant?: 'sidebar' | 'header';
}

export const AdminThemeToggle: React.FC<AdminThemeToggleProps> = ({ 
  isCollapsed = false,
  variant = 'sidebar'
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'header') {
    return (
      <button
        onClick={toggleTheme}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 transition-all cursor-pointer group overflow-hidden"
        title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        aria-label="Toggle theme mode"
      >
        <span 
          className={`transform transition-all duration-500 ease-out flex items-center justify-center ${
            isDark ? 'rotate-180 scale-100' : 'rotate-0 scale-100'
          }`}
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon className="h-4 w-4 text-indigo-600 group-hover:-rotate-12 transition-transform duration-300" />
          )}
        </span>
        {/* Subtle ambient ripple indicator */}
        <span className="absolute inset-0 rounded-xl ring-2 ring-indigo-500/0 group-active:ring-indigo-500/30 transition-all duration-200 pointer-events-none" />
      </button>
    );
  }

  // Sidebar toggle button (compact or expanded)
  if (isCollapsed) {
    return (
      <button
        onClick={toggleTheme}
        className="relative flex h-10 w-10 mx-auto items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/80 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-all cursor-pointer group overflow-hidden"
        title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        aria-label="Toggle theme mode"
      >
        <div 
          className={`transform transition-transform duration-500 ease-out ${
            isDark ? 'rotate-180' : 'rotate-0'
          }`}
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform duration-200" />
          ) : (
            <Moon className="h-4 w-4 text-indigo-600 group-hover:scale-110 transition-transform duration-200" />
          )}
        </div>
      </button>
    );
  }

  // Full Expanded Sidebar Switcher with smooth sliding track
  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="w-full flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/90 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800/90 transition-all cursor-pointer group"
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle theme mode"
    >
      <div className="flex items-center gap-2.5">
        <div 
          className={`flex h-6 w-6 items-center justify-center rounded-lg transition-transform duration-500 ease-out ${
            isDark 
              ? 'bg-amber-400/10 text-amber-400 rotate-180' 
              : 'bg-indigo-50 text-indigo-600 rotate-0 dark:bg-indigo-950/60 dark:text-indigo-400'
          }`}
        >
          {isDark ? (
            <Sun className="h-3.5 w-3.5 group-hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon className="h-3.5 w-3.5 group-hover:-rotate-12 transition-transform duration-300" />
          )}
        </div>
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      </div>

      {/* Animated Sliding Pill Track */}
      <div className="relative flex h-5 w-9 items-center rounded-full bg-slate-200/80 p-0.5 dark:bg-slate-700/80 transition-colors">
        <div 
          className={`h-4 w-4 rounded-full bg-white shadow-xs dark:bg-indigo-500 transform transition-transform duration-300 ease-spring flex items-center justify-center ${
            isDark ? 'translate-x-4' : 'translate-x-0'
          }`}
        >
          <span 
            className={`block h-1.5 w-1.5 rounded-full transition-colors ${
              isDark ? 'bg-white' : 'bg-amber-400'
            }`}
          />
        </div>
      </div>
    </button>
  );
};
