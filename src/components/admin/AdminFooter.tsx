import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface AdminFooterProps {
  onNavigate?: (path: string) => void;
  supabaseConnected?: boolean | null;
}

export const AdminFooter: React.FC<AdminFooterProps> = () => {
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentDateTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = currentDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white/70 py-4 px-4 sm:px-8 backdrop-blur-xs dark:border-slate-800/80 dark:bg-slate-900/60 transition-colors">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
        
        {/* Left Column: Spacer to preserve center branding alignment */}
        <div className="hidden sm:block" />

        {/* Center Column: Minimal Branding */}
        <div className="flex items-center justify-center gap-2">
          <img
            src="/logo/logo.svg"
            alt="inaquired"
            className="site-logo h-4.5 w-auto object-contain transition-transform hover:scale-105"
          />
          <div className="h-3 w-px bg-slate-300 dark:bg-slate-700" />
          <span className="text-xs font-semibold tracking-tight text-slate-500 dark:text-slate-400">
            Admin Console
          </span>
        </div>

        {/* Right Corner: Live Date & Time */}
        <div className="flex items-center justify-center sm:justify-end gap-1.5 text-slate-500 dark:text-slate-400">
          <Clock className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
          <span className="text-[11px] font-mono tracking-tight font-medium">
            {formattedDate} • {formattedTime}
          </span>
        </div>

      </div>
    </footer>
  );
};
