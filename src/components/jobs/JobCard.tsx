import React from 'react';
import { MapPin, Clock, DollarSign, ArrowUpRight, Sparkles } from 'lucide-react';
import { JobIcon } from '../icons/JobIcon';
import { Job } from '../../types/job';
import { formatSalary, formatRelativeDate } from '../../utils/jobUtils';

interface JobCardProps {
  job: Job;
  onClick: (slug: string) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onClick }) => {
  // Distinction styles for work arrangements
  const getWorkArrangementBadge = (arrangement: string) => {
    switch (arrangement) {
      case 'remote':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60';
      case 'hybrid':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/60';
      case 'on-site':
        return 'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getJobTypeLabel = (type: string) => {
    switch (type) {
      case 'full-time': return 'Full-time';
      case 'part-time': return 'Part-time';
      case 'contract': return 'Contract';
      case 'internship': return 'Internship';
      default: return type;
    }
  };

  return (
    <article 
      onClick={() => onClick(job.slug || job.id)}
      className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs transition-all hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-indigo-700 cursor-pointer"
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(job.slug || job.id);
        }
      }}
      aria-label={`View job opening for ${job.title} at ${job.companyName}`}
    >
      <div>
        {/* Top Header: Company, Arrangement badge, Featured indicator (NO company logos!) */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-wide text-slate-600 dark:text-slate-400">
              {job.companyName}
            </span>
            {job.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50">
                <Sparkles className="h-3 w-3" />
                Featured
              </span>
            )}
          </div>
          <span 
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${getWorkArrangementBadge(job.workArrangement)}`}
          >
            {job.workArrangement}
          </span>
        </div>

        {/* Job Title */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
          {job.title}
        </h3>

        {/* Short excerpt */}
        <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {job.description}
        </p>

        {/* Tag pills */}
        {job.tags && job.tags.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {job.tags.slice(0, 4).map((tag, idx) => (
              <span 
                key={idx}
                className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {tag}
              </span>
            ))}
            {job.tags.length > 4 && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                +{job.tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Info: Location, Salary, Posted Date, Link indicator */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-y-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="truncate max-w-[140px] sm:max-w-[180px]">{job.location}</span>
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
            <DollarSign className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <span>{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px]">
            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{formatRelativeDate(job.publishedAt || job.createdAt)}</span>
          </span>
        </div>

        <div className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
          <span>Details</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </article>
  );
};
