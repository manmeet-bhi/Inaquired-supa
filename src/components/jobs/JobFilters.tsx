import React from 'react';
import { Search, MapPin, SlidersHorizontal, RotateCcw, X } from 'lucide-react';
import { JobFiltersState, WorkArrangement, JobType, ExperienceLevel } from '../../types/job';

interface JobFiltersProps {
  filters: JobFiltersState;
  onFilterChange: (filters: JobFiltersState) => void;
  availableCategories: string[];
  totalResults: number;
}

export const JobFilters: React.FC<JobFiltersProps> = ({
  filters,
  onFilterChange,
  availableCategories,
  totalResults,
}) => {
  const updateField = (key: keyof JobFiltersState, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  const handleReset = () => {
    onFilterChange({
      keyword: '',
      location: '',
      category: 'all',
      workArrangement: 'all',
      jobType: 'all',
      experienceLevel: 'all',
      sortBy: 'newest',
    });
  };

  const workArrangements: { id: string; label: string }[] = [
    { id: 'all', label: 'All Workstyles' },
    { id: 'remote', label: 'Remote' },
    { id: 'hybrid', label: 'Hybrid' },
    { id: 'on-site', label: 'On-Site' },
  ];

  const jobTypes: { id: string; label: string }[] = [
    { id: 'all', label: 'All Types' },
    { id: 'full-time', label: 'Full-time' },
    { id: 'internship', label: 'Internship' },
    { id: 'contract', label: 'Contract' },
    { id: 'part-time', label: 'Part-time' },
  ];

  const hasActiveFilters =
    filters.keyword ||
    filters.location ||
    filters.category !== 'all' ||
    filters.workArrangement !== 'all' ||
    filters.jobType !== 'all' ||
    filters.experienceLevel !== 'all';

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
      
      {/* Primary Search Inputs: Keyword & Location */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
        <div className="relative sm:col-span-1 lg:col-span-5">
          <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by job title, skill, or keyword..."
            value={filters.keyword}
            onChange={(e) => updateField('keyword', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:placeholder:text-slate-500"
          />
          {filters.keyword && (
            <button
              type="button"
              onClick={() => updateField('keyword', '')}
              className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear keyword filter"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="relative sm:col-span-1 lg:col-span-4">
          <MapPin className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="City, state, or 'Remote'..."
            value={filters.location}
            onChange={(e) => updateField('location', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:placeholder:text-slate-500"
          />
          {filters.location && (
            <button
              type="button"
              onClick={() => updateField('location', '')}
              className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear location filter"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="lg:col-span-3 flex items-center gap-2">
          <select
            value={filters.category}
            onChange={(e) => updateField('category', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Secondary Controls: Work Arrangement Pills & Secondary Dropdowns */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
        
        {/* Work Arrangement Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {workArrangements.map((arrangement) => {
            const isSelected = filters.workArrangement === arrangement.id;
            return (
              <button
                key={arrangement.id}
                onClick={() => updateField('workArrangement', arrangement.id)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {arrangement.label}
              </button>
            );
          })}
        </div>

        {/* Secondary Filters: Job Type, Experience, Sort & Reset */}
        <div className="flex flex-wrap items-center gap-2">
          
          <select
            value={filters.jobType}
            onChange={(e) => updateField('jobType', e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 px-2.5 text-xs text-slate-700 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
            aria-label="Filter by job type"
          >
            {jobTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>

          <select
            value={filters.experienceLevel}
            onChange={(e) => updateField('experienceLevel', e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 px-2.5 text-xs text-slate-700 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
            aria-label="Filter by experience level"
          >
            <option value="all">All Experience Levels</option>
            <option value="internship">Internship</option>
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior Level</option>
            <option value="lead">Lead / Principal</option>
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => updateField('sortBy', e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 px-2.5 text-xs text-slate-700 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
            aria-label="Sort listings"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="salary">Sort: Highest Salary</option>
            <option value="title">Sort: Job Title (A-Z)</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/70 transition-colors"
              title="Reset all search criteria"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Results Counter Bar */}
      <div className="flex items-center justify-between pt-1 text-xs text-slate-500 dark:text-slate-400">
        <span>
          Showing <strong className="text-slate-800 dark:text-slate-200">{totalResults}</strong> job opportunities
        </span>
      </div>
    </div>
  );
};
