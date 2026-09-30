import React from 'react';
import { Briefcase, ShieldCheck, Zap, Heart, CheckCircle2, Globe, ArrowLeft } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      
      <div>
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 mb-4 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </button>

        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Our Mission & Values
        </span>
        <h1 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          About inaquired
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
          inaquired was founded on a simple premise: finding meaningful work shouldn't require creating dozens of disposable accounts, getting tracked by ad brokers, or sifting through expired job postings.
        </p>
      </div>

      {/* Core Principles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Zero Candidate Logins</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            All job listings, filters, and direct application links are 100% public and accessible without forcing you to create an account or provide private data.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
            <Zap className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Real-Time Serverless Architecture</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Powered by Google Cloud Firestore, published opportunities appear instantaneously across candidate screens without requiring manual page reloads.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300">
            <Globe className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Inclusive Workstyles</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Dedicated sections for Remote, Hybrid, and On-Site positions, as well as paid early-career internships to support learners and professionals alike.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
            <Heart className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No-Logo Minimalist Design</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Clean, typography-first aesthetics ensure you evaluate jobs on technical substance, salary transparency, and culture rather than corporate branding.
          </p>
        </div>
      </div>

      {/* Call to action */}
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-6 sm:p-8 dark:border-indigo-900/60 dark:bg-indigo-950/40 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ready to explore opportunities?</h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
          Start browsing verified remote roles, on-site headquarters, hybrid arrangements, and internships.
        </p>
        <button
          onClick={() => onNavigate('/')}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm"
        >
          Explore All Job Openings
        </button>
      </div>

    </div>
  );
};
