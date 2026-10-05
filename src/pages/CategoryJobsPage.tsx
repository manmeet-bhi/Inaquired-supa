import React, { useState, useEffect } from 'react';
import { FolderSearch, ArrowLeft, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Job, JobFiltersState } from '../types/job';
import { JobCard } from '../components/jobs/JobCard';
import { JobFilters } from '../components/jobs/JobFilters';
import { filterJobs } from '../utils/jobUtils';
import { Category } from '../services/categoryService';

interface CategoryJobsPageProps {
  pageType: 'remote' | 'onsite' | 'hybrid' | 'internship' | 'all' | 'category' | 'company';
  categorySlug?: string;
  companyName?: string;
  jobs: Job[];
  categories: Category[];
  loading: boolean;
  onNavigate: (path: string) => void;
  onSelectJob: (slug: string) => void;
  keyword?: string;
  onKeywordChange?: (keyword: string) => void;
}

export const CategoryJobsPage: React.FC<CategoryJobsPageProps> = ({
  pageType,
  categorySlug = '',
  companyName = '',
  jobs,
  categories,
  loading,
  onNavigate,
  onSelectJob,
  keyword = '',
  onKeywordChange
}) => {
  const matchingCategory = categorySlug
    ? categories.find((category) => category.slug === categorySlug)?.name ||
      jobs.find((j) => (j.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') === categorySlug)?.category ||
      categorySlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'all';

  const getInitialFilters = (): JobFiltersState => {
    return {
      keyword: keyword || '',
      location: '',
      category: pageType === 'category' ? matchingCategory : 'all',
      workArrangement: pageType === 'remote' ? 'remote' : pageType === 'onsite' ? 'on-site' : pageType === 'hybrid' ? 'hybrid' : 'all',
      jobType: pageType === 'internship' ? 'internship' : 'all',
      experienceLevel: 'all',
      sortBy: 'newest',
    };
  };

  const [filters, setFilters] = useState<JobFiltersState>(getInitialFilters());
  const [currentPage, setCurrentPage] = useState(1);
  const JOBS_PER_PAGE = 12;

  useEffect(() => {
    setFilters(getInitialFilters());
    setCurrentPage(1);
  }, [pageType, categorySlug, companyName]);

  // Sync keyword when updated externally from Navbar
  useEffect(() => {
    setFilters((prev) => (prev.keyword !== keyword ? { ...prev, keyword } : prev));
    setCurrentPage(1);
  }, [keyword]);

  const handleFilterUpdate = (newFilters: JobFiltersState) => {
    setFilters(newFilters);
    setCurrentPage(1);
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
          description: 'Kickstart your career with paid summer and semester internships, mentorship programs, and early career opportunities.',
          badge: 'Paid Internships & Early Career',
        };
      case 'category':
        return {
          title: `${matchingCategory} Positions`,
          description: `Explore all verified career opportunities in ${matchingCategory}. Direct employer applications with full salary transparency.`,
          badge: `Department: ${matchingCategory}`,
        };
      case 'company':
        return {
          title: `Careers at ${companyName || 'Verified Employer'}`,
          description: `Explore all verified career opportunities and direct application links at ${companyName || 'this company'}. Zero login wall.`,
          badge: `Employer: ${companyName || 'Company'}`,
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
  const availableCategories = Array.from(new Set([
    ...categories.map((category) => category.name),
    ...jobs.map((job) => job.category).filter(Boolean),
  ]));
  const scopedJobs = pageType === 'company' && companyName 
    ? jobs.filter((j) => (j.companyName || '').toLowerCase() === companyName.toLowerCase())
    : jobs;
  const filtered = filterJobs(scopedJobs, filters);

  // Pagination
  const totalPages = Math.ceil(filtered.length / JOBS_PER_PAGE);
  const paginatedJobs = filtered.slice((currentPage - 1) * JOBS_PER_PAGE, currentPage * JOBS_PER_PAGE);

  useEffect(() => {
    if (currentPage > Math.max(totalPages, 1)) {
      setCurrentPage(Math.max(totalPages, 1));
    }
  }, [currentPage, totalPages]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Page Header */}
      <div>
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
        availableCategories={availableCategories}
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
          <FolderSearch className="mx-auto h-12 w-12 text-slate-400 mb-3" />
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedJobs.map((job) => (
              <JobCard key={job.id} job={job} onClick={onSelectJob} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Page <strong className="text-slate-800 dark:text-slate-200">{currentPage}</strong> of{' '}
                <strong className="text-slate-800 dark:text-slate-200">{totalPages}</strong>{' '}·{' '}
                <strong className="text-slate-800 dark:text-slate-200">{filtered.length}</strong> results
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                  return (
                    <button
                      key={page}
                      onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                        currentPage === page
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};
