import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  ArrowRight, 
  Briefcase, 
  Globe2, 
  GraduationCap, 
  Building2, 
  Laptop, 
  CheckCircle2, 
  BellRing 
} from 'lucide-react';
import { Job, JobFiltersState } from '../types/job';
import { JobCard } from '../components/jobs/JobCard';
import { JobFilters } from '../components/jobs/JobFilters';
import { filterJobs } from '../utils/jobUtils';
import { requestJobNotifications, checkNotificationSupport } from '../services/notificationService';

interface HomePageProps {
  jobs: Job[];
  loading: boolean;
  onNavigate: (path: string) => void;
  onSelectJob: (slug: string) => void;
  keyword?: string;
  onKeywordChange?: (keyword: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ 
  jobs, 
  loading, 
  onNavigate, 
  onSelectJob,
  keyword = '',
  onKeywordChange
}) => {
  const [filters, setFilters] = useState<JobFiltersState>({
    keyword: keyword || '',
    location: '',
    category: 'all',
    workArrangement: 'all',
    jobType: 'all',
    experienceLevel: 'all',
    sortBy: 'newest',
  });

  // Sync external search keyword from Navbar in real-time
  React.useEffect(() => {
    setFilters((prev) => (prev.keyword !== keyword ? { ...prev, keyword } : prev));
  }, [keyword]);

  const handleFilterUpdate = (newFilters: JobFiltersState) => {
    setFilters(newFilters);
    if (onKeywordChange && newFilters.keyword !== keyword) {
      onKeywordChange(newFilters.keyword);
    }
  };

  const categories = Array.from(new Set(jobs.map((j) => j.category).filter(Boolean)));
  const filteredJobs = filterJobs(jobs, filters);
  
  // Quick spotlight sections
  const remoteJobs = jobs.filter((j) => j.workArrangement === 'remote').slice(0, 3);
  const internships = jobs.filter((j) => j.jobType === 'internship').slice(0, 3);
  const featuredJobs = jobs.filter((j) => j.featured).slice(0, 3);

  const handleQuickArrangement = (arrangement: string) => {
    setFilters((prev) => ({ ...prev, workArrangement: arrangement }));
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-16 bg-radial-[at_50%_0%] from-indigo-50/60 via-slate-50 to-white dark:from-indigo-950/30 dark:via-slate-950 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/80 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-2xs dark:border-indigo-800/80 dark:bg-indigo-950/60 dark:text-indigo-300 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Zero Sign-Up Required for Candidates</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Find the right job. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-400">
              Remote, On-site, Hybrid & Internships.
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-4 text-sm sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            inaquired delivers verified job listings curated with direct employer links and real-time updates. No login wall, no company logos, clean transparent search.
          </p>

          {/* Quick Category Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium">
            <button
              onClick={() => onNavigate('/remote-jobs')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-slate-700 shadow-2xs hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-600 transition-colors"
            >
              <Laptop className="h-4 w-4 text-emerald-500" />
              <span>Remote ({jobs.filter(j => j.workArrangement === 'remote').length})</span>
            </button>
            <button
              onClick={() => onNavigate('/onsite-jobs')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-slate-700 shadow-2xs hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-600 transition-colors"
            >
              <Building2 className="h-4 w-4 text-sky-500" />
              <span>On-Site ({jobs.filter(j => j.workArrangement === 'on-site').length})</span>
            </button>
            <button
              onClick={() => onNavigate('/hybrid-jobs')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-slate-700 shadow-2xs hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-600 transition-colors"
            >
              <Globe2 className="h-4 w-4 text-indigo-500" />
              <span>Hybrid ({jobs.filter(j => j.workArrangement === 'hybrid').length})</span>
            </button>
            <button
              onClick={() => onNavigate('/internships')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-slate-700 shadow-2xs hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-600 transition-colors"
            >
              <GraduationCap className="h-4 w-4 text-amber-500" />
              <span>Internships ({jobs.filter(j => j.jobType === 'internship').length})</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area: Search & Listings */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Search & Filter Component */}
        <div className="mb-8">
          <JobFilters
            filters={filters}
            onFilterChange={handleFilterUpdate}
            availableCategories={categories}
            totalResults={filteredJobs.length}
          />
        </div>

        {/* Listings Display */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="h-64 rounded-xl border border-slate-200 bg-white p-6 shadow-xs animate-pulse dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
                <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded mb-3"></div>
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
                <div className="h-3 w-5/6 bg-slate-200 dark:bg-slate-800 rounded mb-6"></div>
                <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded mt-auto"></div>
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800 bg-white dark:bg-slate-900/40">
            <Briefcase className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              No matching job listings found
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Try adjusting your search keywords, location query, or reset filters to see all available roles.
            </p>
            <button
              onClick={() => setFilters({
                keyword: '',
                location: '',
                category: 'all',
                workArrangement: 'all',
                jobType: 'all',
                experienceLevel: 'all',
                sortBy: 'newest',
              })}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onClick={onSelectJob}
              />
            ))}
          </div>
        )}
      </section>

      {/* Featured Remote Section */}
      {remoteJobs.length > 0 && (
        <section className="border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Work From Anywhere
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Trending Remote Opportunities
                </h2>
              </div>
              <button
                onClick={() => onNavigate('/remote-jobs')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                <span>View all remote positions</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {remoteJobs.map((job) => (
                <JobCard key={job.id} job={job} onClick={onSelectJob} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Internships Section */}
      {internships.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Launch Your Career
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Paid Internships & Co-ops
              </h2>
            </div>
            <button
              onClick={() => onNavigate('/internships')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              <span>View all internships</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {internships.map((job) => (
              <JobCard key={job.id} job={job} onClick={onSelectJob} />
            ))}
          </div>
        </section>
      )}

      {/* Notification Callout */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50 to-white p-6 sm:p-8 dark:border-indigo-900/60 dark:from-indigo-950/40 dark:to-slate-900 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
              <BellRing className="h-3.5 w-3.5" />
              Real-Time Push Alerts
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Never miss a fresh job posting
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl">
              Enable native browser alerts to be notified instantly when new engineering, design, or internship roles are added to inaquired.
            </p>
          </div>
          <button
            onClick={() => requestJobNotifications()}
            className="shrink-0 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
          >
            Activate Instant Alerts
          </button>
        </div>
      </section>

    </div>
  );
};
