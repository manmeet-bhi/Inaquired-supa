import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface TermsPageProps {
  onNavigate: (path: string) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <div>
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 mb-4 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </button>

        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          User Agreement
        </span>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Terms & Conditions
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Last updated: September 2026
        </p>
      </div>

      <div className="max-w-none text-sm leading-relaxed text-slate-700 dark:text-slate-300 space-y-6">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Platform Services</h2>
          <p>
            inaquired provides an open job discovery directory for job seekers to find remote, hybrid, on-site roles, and internships. Access to public job listings is free of charge.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Accuracy of Job Content</h2>
          <p>
            While our administrative editors verify listings before publication, employer hiring statuses, salary ranges, and job requirements may change at the employer's discretion. inaquired does not guarantee employment outcomes or act as an employer of record.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Acceptable Use</h2>
          <p>
            Users agree not to scrape, disrupt, or execute automated attacks against inaquired servers or Firestore instances. Automated bot crawling that degrades service for candidate visitors is prohibited.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Governing Law</h2>
          <p>
            These terms are governed by standard internet services regulations. If you identify an inaccurate or fraudulent job listing, report it immediately through our contact form.
          </p>
        </section>
      </div>
    </div>
  );
};
