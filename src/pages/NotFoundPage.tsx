import React from 'react';
import { ArrowLeft, BriefcaseBusiness, SearchX } from 'lucide-react';

interface NotFoundPageProps {
  onNavigate: (path: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => (
  <section className="relative isolate flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-16 sm:px-6">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-300/20 blur-3xl dark:bg-indigo-700/10"
    />

    <div className="mx-auto w-full max-w-2xl text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-100 bg-white text-indigo-600 shadow-lg shadow-indigo-950/5 dark:border-indigo-900/70 dark:bg-slate-900 dark:text-indigo-300">
        <SearchX aria-hidden="true" className="h-8 w-8" />
      </div>

      <p className="mt-8 bg-gradient-to-r from-indigo-600 via-violet-500 to-pink-500 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl lg:text-6xl dark:from-indigo-300 dark:via-violet-400 dark:to-pink-400">
        Error 404
      </p>
      <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-400">
        The link may be outdated, or the page may have moved. Let’s get you back to opportunities that are right where they belong.
      </p>
    </div>
  </section>
);
