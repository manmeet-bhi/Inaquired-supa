import React, { useState, useEffect } from 'react';
import { Briefcase, ArrowLeft, Filter, Sparkles } from 'lucide-react';
import { Job, JobFiltersState } from '../types/job';
import { JobCard } from '../components/jobs/JobCard';
import { JobFilters } from '../components/jobs/JobFilters';
import { filterJobs } from '../utils/jobUtils';

interface CategoryJobsPageProps {
  pageType: 'remote' | 'onsite' | 'hybrid' | 'internship' | 'all';
  jobs: Job[];
  loading: boolean;
  onNavigate: (path: string) => void;
  onSelectJob: (slug: string) => void;
  keyword?: string;
  onKeywordChange?: (keyword: string) => void;
}

export const CategoryJobsPage: React.FC<CategoryJobsPageProps> = ({
  pageType,
  jobs,
  loading,
  onNavigate,
  onSelectJob,
  keyword = '',
  onKeywordChange
}) => {
  const getInitialFilters = (): JobFiltersState => {
    return {
      keyword: keyword || '',
      location: '',
      category: 'all',
      workArrangement: pageType === 'remote' ? 'remote' : pageType === 'onsite' ? 'on-site' : pageType === 'hybrid' ? 'hybrid' : 'all',
      jobType: pageType === 'internship' ? 'internship' : 'all',
      experienceLevel: 'all',
      sortBy: 'newest',
    };
  };

  const [filters, setFilters] = useState<JobFiltersState>(getInitialFilters());

  useEffect(() => {
    setFilters(getInitialFilters());
  }, [pageType]);

  // Sync keyword when updated externally from Navbar
  useEffect(() => {
    setFilters((prev) => (prev.keyword !== keyword ? { ...prev, keyword } : prev));
  }, [keyword]);

  const handleFilterUpdate = (newFilters: JobFiltersState) => {
    setFilters(newFilters);
    if (onKeywordChange && newFilters.keyword !== keyword) {
      onKeywordChange(newFilters.keyword);
    }
  };

  const getPageMeta = () => {
    switch (pageType) {
      case 'remote':
        return {
          title: 'Remote Job Openings',
          description: 'Explore verified work-from-anywhere roles across Engineering, Product, Design, and Marketing with flexible schedules.',
          badge: '100% Remote Positions',
        };
      case 'onsite':
        return {
          title: 'On-Site Job Opportunities',
          description: 'Browse in-person career opportunities at top tech hubs, innovation labs, and modern headquarters.',
          badge: 'On-Site & In-Office',
        };
      case 'hybrid':
        return {
          title: 'Hybrid Job Openings',
          description: 'Discover balanced roles offering flexible split between in-office collaboration and home productivity.',
          badge: 'Flexible Hybrid Workstyles',
        };
      case 'internship':
        return {
          title: 'Internships & Co-op Openings',
          description: 'Kickstart your career with paid summer and semester internships, mentorship programs, and entry-level pathways.',
          badge: 'Paid Internships & Early Career',
        };
      default:
        return {
          title: 'All Job Opportunities',
          description: 'Browse all open roles indexed across inaquired with real-time updates and direct employer application links.',
          badge: 'Verified Portal Listings',
        };
    }
  };

  const meta = getPageMeta();
  const categories = Array.from(new Set(jobs.map((j) => j.category).filter(Boolean)));
  const filtered = filterJobs(jobs, filters);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Back button & Page Header */}
      <div>
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 mb-4 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <Sparkles className="h-3 w-3" />
              {meta.badge}
            </span>
            <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {meta.title}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              {meta.description}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Component */}
      <JobFilters
        filters={filters}
        onFilterChange={handleFilterUpdate}
        availableCategories={categories}
        totalResults={filtered.length}
      />

      {/* Jobs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-60 rounded-xl border border-slate-200 bg-white p-6 shadow-xs animate-pulse dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800 bg-white dark:bg-slate-900/40">
          <Briefcase className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            No openings found for this category
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Try loosening your filters or explore other work arrangement categories.
          </p>
          <button
            onClick={() => setFilters(getInitialFilters())}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} onClick={onSelectJob} />
          ))}
        </div>
      )}

    </div>
  );
};
