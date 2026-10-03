import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  getCookieConsent,
  setCookieConsent,
  COOKIE_BANNER_EVENT
} from '../../utils/cookieConsent';

interface CookieBannerProps {
  onNavigate?: (path: string) => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);

  useEffect(() => {
    // Check if visitor has already closed/consented
    const consent = getCookieConsent();
    if (!consent) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      setIsClosing(false);
      setIsOpen(true);
    };

    window.addEventListener(COOKIE_BANNER_EVENT, handleOpen);
    return () => window.removeEventListener(COOKIE_BANNER_EVENT, handleOpen);
  }, []);

  const handleDismiss = () => {
    setIsClosing(true);
    setCookieConsent('accepted');
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      role="region"
      aria-label="Cookie Policy Notice"
      className={`fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 transition-all duration-300 ease-out transform ${
        isClosing
          ? 'opacity-0 translate-y-4 scale-95 pointer-events-none'
          : 'opacity-100 translate-y-0 scale-100'
      }`}
    >
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 shadow-lg shadow-slate-900/5 dark:shadow-black/50">
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
          By using this website, you agree to our{' '}
          <button
            type="button"
            onClick={() => onNavigate?.('/cookies')}
            className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline underline-offset-2 transition-colors cursor-pointer"
          >
            cookie policy
          </button>
          .
        </p>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss cookie notice"
          className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
};
