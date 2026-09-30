import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Clock, 
  Share2, 
  ExternalLink, 
  CheckCircle, 
  ShieldCheck, 
  Building,
  Sparkles 
} from 'lucide-react';
import { Job } from '../types/job';
import { formatSalary, formatRelativeDate } from '../utils/jobUtils';

interface JobDetailPageProps {
  slug: string;
  jobs: Job[];
  onNavigate: (path: string) => void;
}

export const JobDetailPage: React.FC<JobDetailPageProps> = ({ slug, jobs, onNavigate }) => {
  const [copied, setCopied] = useState(false);
  
  // Find job from loaded list or by slug/id
  const job = jobs.find((j) => j.slug === slug || j.id === slug);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (job) {
      document.title = `${job.title} at ${job.companyName} | inaquired`;
      
      // Inject JobPosting JSON-LD for rich Google Search indexing
      const scriptId = 'jobposting-schema-jsonld';
      let existingScript = document.getElementById(scriptId);
      if (existingScript) existingScript.remove();

      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: job.title,
        description: job.description,
        identifier: {
          '@type': 'PropertyValue',
          name: job.companyName,
          value: job.id,
        },
        datePosted: job.publishedAt || job.createdAt,
        validThrough: job.applicationDeadline || '2026-12-31',
        employmentType: job.jobType === 'full-time' ? 'FULL_TIME' : job.jobType === 'part-time' ? 'PART_TIME' : job.jobType === 'internship' ? 'INTERN' : 'CONTRACTOR',
        hiringOrganization: {
          '@type': 'Organization',
          name: job.companyName,
        },
        jobLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: job.location,
          },
        },
        baseSalary: job.salaryMin ? {
          '@type': 'MonetaryAmount',
          currency: job.currency || 'USD',
          value: {
            '@type': 'QuantitativeValue',
            minValue: job.salaryMin,
            maxValue: job.salaryMax || job.salaryMin,
            unitText: 'YEAR',
          },
        } : undefined,
      });
      document.head.appendChild(script);

      return () => {
        const s = document.getElementById(scriptId);
        if (s) s.remove();
        document.title = 'inaquired – Find Remote, On-Site & Hybrid Jobs & Internships';
      };
    }
  }, [job]);

  if (!job) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Opening Not Found</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          The requested job listing may have expired, been archived, or removed by the hiring team.
        </p>
        <button
          onClick={() => onNavigate('/')}
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Browse All Jobs</span>
        </button>
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleApply = () => {
    if (job.applicationUrl) {
      window.open(job.applicationUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert(`To apply for this role, submit your resume mentioning "${job.title}" directly to ${job.companyName}.`);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Navigation Breadcrumb */}
      <div>
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to All Openings</span>
        </button>
      </div>

      {/* Main Header Card (NO company logos!) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold text-slate-700 dark:text-slate-300">
                {job.companyName}
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                Verified Opportunity
              </span>
              {job.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50">
                  <Sparkles className="h-3 w-3" />
                  Featured
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {job.title}
            </h1>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 pt-1">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{job.location}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-900 dark:text-white">
                <DollarSign className="h-4 w-4 text-slate-400" />
                <span>{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</span>
              </span>
              <span className="capitalize inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {job.workArrangement}
              </span>
              <span className="capitalize inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {job.jobType}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                <span>Posted {formatRelativeDate(job.publishedAt || job.createdAt)}</span>
              </span>
            </div>
          </div>

          {/* Action CTAs: Apply Now & Share */}
          <div className="flex sm:flex-col items-center sm:items-stretch gap-3 shrink-0">
            <button
              onClick={handleApply}
              className="w-full sm:w-48 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
            >
              <span>Apply Now</span>
              <ExternalLink className="h-4 w-4" />
            </button>

            <button
              onClick={handleShare}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{copied ? 'Link Copied!' : 'Share Listing'}</span>
            </button>
          </div>
        </div>

        {/* Tags */}
        {job.tags && job.tags.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
            {job.tags.map((tag, i) => (
              <span
                key={i}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Detail Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Body */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* About Role / Description */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              About the Role
            </h2>
            <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line space-y-3">
              {job.description}
            </div>
          </section>

          {/* Responsibilities */}
          {job.responsibilities && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Key Responsibilities
              </h2>
              <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line space-y-2">
                {job.responsibilities}
              </div>
            </section>
          )}

          {/* Requirements */}
          {job.requirements && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Qualifications & Experience
              </h2>
              <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line space-y-2">
                {job.requirements}
              </div>
            </section>
          )}

          {/* Benefits */}
          {job.benefits && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Benefits & Perks
              </h2>
              <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line space-y-2">
                {job.benefits}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Info Summary */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Role Overview
            </h3>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-xs">Department / Category</span>
                <span className="font-semibold text-slate-900 dark:text-white">{job.category}</span>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-xs">Experience Level</span>
                <span className="font-semibold text-slate-900 dark:text-white capitalize">{job.experienceLevel}</span>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-xs">Work Arrangement</span>
                <span className="font-semibold text-slate-900 dark:text-white capitalize">{job.workArrangement}</span>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-xs">Application Deadline</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {job.applicationDeadline || 'Open until filled'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-xs">Listing ID</span>
                <span className="font-mono text-xs text-slate-500">{job.id}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleApply}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
              >
                <span>Direct Application Link</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/40 text-xs text-slate-500 dark:text-slate-400 space-y-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block">Candidate Safety Notice</span>
            <p>
              inaquired verifies openings directly with employers. Legitimate employers will never ask for payment or sensitive financial information during the interview process.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
