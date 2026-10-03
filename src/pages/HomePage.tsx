import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  ArrowRight, 
  Globe2, 
  GraduationCap, 
  Building2, 
  Laptop, 
  CheckCircle2,
  Code2,
  Palette,
  TrendingUp,
  Database,
  DollarSign,
  Settings,
  Users,
  Headphones
} from 'lucide-react';
import { JobIcon } from '../components/icons/JobIcon';
import { Job, JobFiltersState } from '../types/job';
import { JobCard } from '../components/jobs/JobCard';
import { JobFilters } from '../components/jobs/JobFilters';
import { filterJobs } from '../utils/jobUtils';
import { searchJobsInDatabase } from '../services/jobService';

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

  const [dbSearchResults, setDbSearchResults] = useState<Job[]>([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);

  // Sync external search keyword from Navbar in real-time
  React.useEffect(() => {
    setFilters((prev) => (prev.keyword !== keyword ? { ...prev, keyword } : prev));
  }, [keyword]);

  // Debounced live database query when searching
  React.useEffect(() => {
    const q = filters.keyword.trim();
    if (q.length >= 2) {
      setIsSearchingDb(true);
      const timer = setTimeout(async () => {
        try {
          const results = await searchJobsInDatabase(q, 30);
          setDbSearchResults(results);
        } catch (err) {
          console.warn('Real-time database search error:', err);
        } finally {
          setIsSearchingDb(false);
        }
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setDbSearchResults([]);
      setIsSearchingDb(false);
    }
  }, [filters.keyword]);

  const handleFilterUpdate = (newFilters: JobFiltersState) => {
    setFilters(newFilters);
    if (onKeywordChange && newFilters.keyword !== keyword) {
      onKeywordChange(newFilters.keyword);
    }
  };

  // Combine real-time database results with cached/subscribed jobs
  const mergedJobs = React.useMemo(() => {
    if (!filters.keyword.trim() || dbSearchResults.length === 0) {
      return jobs;
    }
    const map = new Map<string, Job>();
    jobs.forEach((j) => map.set(j.id, j));
    dbSearchResults.forEach((j) => map.set(j.id, j));
    return Array.from(map.values());
  }, [jobs, dbSearchResults, filters.keyword]);

  const categories = Array.from(new Set(mergedJobs.map((j) => j.category).filter(Boolean)));
  const filteredJobs = filterJobs(mergedJobs, filters);
  
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
      <section id="browse-jobs-section" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
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
            <JobIcon className="mx-auto h-12 w-12 text-slate-400 mb-3" />
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

      {/* Browse by Department Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Explore by Role
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Browse by Department
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/departments')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            <span>View all departments</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { name: 'Engineering', slug: 'engineering', icon: Code2, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/40' },
            { name: 'Design & Creative', slug: 'design', icon: Palette, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/40' },
            { name: 'Marketing & Growth', slug: 'marketing', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
            { name: 'Data & Analytics', slug: 'data', icon: Database, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/40' },
            { name: 'Sales & Business Dev', slug: 'sales', icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40' },
            { name: 'Operations', slug: 'operations', icon: Settings, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800/60' },
            { name: 'Customer Success', slug: 'customer-support', icon: Headphones, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-950/40' },
          ].map((dept) => {
            const Icon = dept.icon;
            const deptJobCount = jobs.filter(j => 
              (j.category || '').toLowerCase().includes(dept.slug) ||
              (j.title || '').toLowerCase().includes(dept.name.toLowerCase().split(' ')[0])
            ).length;
            return (
              <button
                key={dept.slug}
                onClick={() => onNavigate(`/category/${dept.slug}`)}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-indigo-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-indigo-600/70 transition-all duration-200"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${dept.bg} group-hover:scale-105 transition-transform`}>
                  <Icon className={`h-5 w-5 ${dept.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug truncate">
                    {dept.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {deptJobCount} {deptJobCount === 1 ? 'role' : 'roles'}
                  </p>
                </div>
              </button>
            );
          })}
          <button
            onClick={() => onNavigate('/departments')}
            className="group flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-xs font-semibold text-slate-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:border-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
          >
            <span>More</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

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

      {/* Simple Employer Hero Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              For Employers & Hiring Teams
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Hiring talent? Post your open roles and reach qualified candidates.
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All submissions are reviewed and added within 24 hours with direct application links.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/post-a-job')}
            className="shrink-0 rounded-xl bg-indigo-600 px-6 py-3 text-xs sm:text-sm font-bold tracking-wider text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
          >
            POST A JOB
          </button>
        </div>
      </section>

    </div>
  );
};
