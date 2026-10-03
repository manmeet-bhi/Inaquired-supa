import React from 'react';
import { 
  ArrowLeft, 
  Target, 
  Users, 
  Building2, 
  HelpCircle, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Send
} from 'lucide-react';
import { JobIcon } from '../components/icons/JobIcon';

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Top Header */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          About Inaquired
        </span>
        <h1 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          About - Inaquired
        </h1>
      </div>

      {/* Our Mission */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400">
            <Target className="h-5 w-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Our Mission
          </h2>
        </div>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
          At Inaquired, our goal is to make job discovery simple, transparent, and accessible for everyone. We collect and share job opportunities from various trusted sources so that job seekers can easily explore openings in one place. Our mission is to help bridge the gap between job seekers and opportunities by providing a clean, easy-to-use platform where users can find the latest job listings quickly and efficiently.
        </p>
      </section>

      {/* What We Offer */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          What We Offer
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              For Job Seekers
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Browse thousands of opportunities from remote work to on-site positions. Save your favorite jobs, get personalized recommendations, and apply with confidence.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/70 dark:text-purple-400">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              For Employers
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Connect with top talent across various industries. Post jobs, manage applications, and find the perfect candidates for your team.
            </p>
          </div>
        </div>
      </section>

      {/* How Our Platform Works */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          How Our Platform Works
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          Inaquired is a third-party job listing platform. We gather job information from publicly available sources, company career pages, and other job portals, and share them on our website to help users stay updated with new opportunities.
        </p>

        <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <li className="flex items-start gap-2.5">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
            <span>We do not have any direct partnership, contract, or affiliation with the companies listed on our website unless explicitly stated.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
            <span>We do not act as a recruitment agency.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
            <span>All applications are processed through the official company websites or original job sources.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
            <span>Our goal is only to simplify the process of finding job opportunities by bringing them together in one place.</span>
          </li>
        </ul>
      </section>

      {/* Why Choose Us */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Why Choose Us
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            We are committed to providing the best experience for both job seekers and employers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Transparency
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Clear job descriptions, honest company reviews, and transparent hiring processes so you know exactly what to expect.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Daily Updates
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Stay ahead of the competition with timely job and internship postings updated daily by our dedicated team.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Trust
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Our team carefully researches and verifies every job opening to ensure accuracy and legitimacy.
            </p>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400">
            <HelpCircle className="h-5 w-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Frequently Asked Questions (FAQs)
          </h2>
        </div>

        <div className="space-y-4 pt-2 divide-y divide-slate-100 dark:divide-slate-800">
          <div className="pt-4 first:pt-0 space-y-1.5">
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
              <span>From where are jobs collected?</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 pl-6 leading-relaxed">
              We aggregate job listings directly from verified company career pages, official recruitment portals, and trusted partner networks to ensure you have access to the most current and legitimate opportunities.
            </p>
          </div>

          <div className="pt-4 space-y-1.5">
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Is it authentic?</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 pl-6 leading-relaxed">
              Yes, absolutely. We employ a rigorous 2-step manual verification process involving expert human review to validate every job posting before it goes live on our platform.
            </p>
          </div>

          <div className="pt-4 space-y-1.5">
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
              <span>Who are we?</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 pl-6 leading-relaxed">
              Inaquired is a dedicated platform committed to bridging the gap between talented professionals and global opportunities. We are a team of passionate individuals working to make job searching simple, transparent, and accessible for everyone.
            </p>
          </div>
        </div>
      </section>

      {/* Ready to Get Started? */}
      <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 to-blue-50/70 p-6 sm:p-10 dark:border-indigo-900/60 dark:from-indigo-950/40 dark:to-slate-900/60 text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Ready to Get Started?
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
          Join thousands of professionals who have found their dream jobs through Inaquired. Your next opportunity awaits.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-indigo-700 shadow-sm transition-all duration-150 active:scale-[0.98] cursor-pointer"
          >
            <JobIcon className="h-4 w-4" />
            <span>Browse Jobs</span>
          </button>

          <button
            onClick={() => onNavigate('/companies')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-all duration-150 active:scale-[0.98] cursor-pointer"
          >
            <Building2 className="h-4 w-4" />
            <span>View Companies</span>
          </button>

          <a
            href="https://t.me/inaquired"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition-all duration-150 active:scale-[0.98] cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>Join Telegram</span>
          </a>
        </div>
      </section>
    </div>
  );
};
