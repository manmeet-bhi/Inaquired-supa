import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface AdminAuthLayoutProps {
  children: React.ReactNode;
  heading: string;
  description: string;
}

export const AdminAuthLayout: React.FC<AdminAuthLayoutProps> = ({
  children,
  heading,
  description,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
  <main className={`relative flex min-h-screen flex-col justify-center px-4 py-8 transition-colors sm:px-6 sm:py-12 lg:py-16 ${
    isDark ? 'bg-[#1f1f1f] text-slate-100' : 'bg-slate-100 text-slate-900'
  }`}>
    <button
      type="button"
      onClick={toggleTheme}
      className={`absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
        isDark
          ? 'border-[#3c4043] bg-[#202124] text-amber-300 hover:bg-[#303134] focus:ring-offset-[#1f1f1f]'
          : 'border-slate-300 bg-white text-indigo-700 shadow-sm hover:bg-slate-50 focus:ring-offset-slate-100'
      }`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>

    <section className={`mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl border shadow-2xl transition-colors sm:rounded-[28px] md:min-h-[460px] md:grid-cols-2 ${
      isDark ? 'border-[#2d2d2d] bg-[#0d0d0d]' : 'border-slate-200 bg-white'
    }`}>
      <div className="flex flex-col justify-center px-5 py-6 sm:px-10 sm:py-8 md:px-12 md:py-12">
        <img
          src="/logo/logo.svg"
          alt="inaquired"
          className="site-logo mb-7 h-9 w-fit object-contain sm:mb-10"
        />
        <h1 className={`text-2xl font-normal tracking-tight sm:text-4xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {heading}
        </h1>
        <p className={`mt-3 max-w-md text-sm leading-6 sm:mt-5 sm:text-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          {description}
        </p>
      </div>

      <div className={`flex items-center border-t px-5 py-6 sm:px-10 sm:py-8 md:border-l md:border-t-0 md:px-12 md:py-12 ${
        isDark ? 'border-[#2d2d2d]' : 'border-slate-200'
      }`}>
        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>
    </section>

    <footer className={`mx-auto mt-4 flex w-full max-w-5xl flex-wrap items-center justify-between gap-y-3 px-1 text-xs sm:mt-5 sm:px-2 ${
      isDark ? 'text-slate-400' : 'text-slate-500'
    }`}>
      <span>Inaquired admin</span>
      <nav aria-label="Footer" className="flex items-center gap-3 sm:gap-5">
        <a href="/contact" className={isDark ? 'hover:text-white' : 'hover:text-slate-900'}>Help</a>
        <a href="/privacy" className={isDark ? 'hover:text-white' : 'hover:text-slate-900'}>Privacy</a>
        <a href="/terms" className={isDark ? 'hover:text-white' : 'hover:text-slate-900'}>Terms</a>
      </nav>
    </footer>
  </main>
  );
};
