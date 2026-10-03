import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, DollarSign, ArrowRight, Database } from 'lucide-react';
import { JobIcon } from '../icons/JobIcon';
import { Job } from '../../types/job';
import { searchJobsByKeyword, formatSalary } from '../../utils/jobUtils';
import { searchJobsInDatabase } from '../../services/jobService';

interface NavbarSearchProps {
  jobs: Job[];
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  onSelectJob: (slug: string) => void;
  onSearchSubmit: (keyword: string) => void;
}

export const NavbarSearch: React.FC<NavbarSearchProps> = ({
  jobs,
  keyword,
  onKeywordChange,
  onSelectJob,
  onSearchSubmit,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [dbResults, setDbResults] = useState<Job[]>([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced real-time database query
  useEffect(() => {
    const trimmed = keyword.trim();
    if (trimmed.length < 2) {
      setDbResults([]);
      setIsSearchingDb(false);
      return;
    }

    setIsSearchingDb(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchJobsInDatabase(trimmed, 8);
        setDbResults(results);
      } catch (err) {
        console.warn('Real-time database search error:', err);
      } finally {
        setIsSearchingDb(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [keyword]);

  // Merge in-memory matches with real-time database results (deduplicating by ID)
  const localMatches = searchJobsByKeyword(jobs, keyword);
  const combinedMap = new Map<string, Job>();
  localMatches.forEach((j) => combinedMap.set(j.id, j));
  dbResults.forEach((j) => combinedMap.set(j.id, j));

  const matchingJobs = Array.from(combinedMap.values());
  const visibleMatches = matchingJobs.slice(0, 6);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onKeywordChange(val);
    setIsOpen(true);
    setActiveIndex(-1);
  };

  const handleClear = () => {
    onKeywordChange('');
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleSelect = (job: Job) => {
    setIsOpen(false);
    onSelectJob(job.slug || job.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setActiveIndex((prev) => (prev < visibleMatches.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : visibleMatches.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < visibleMatches.length) {
        handleSelect(visibleMatches[activeIndex]);
      } else {
        setIsOpen(false);
        onSearchSubmit(keyword);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  };

  // Helper to highlight matching text in title or company
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-indigo-100 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-200 rounded-xs px-0.5 font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getWorkArrangementBadge = (arrangement: string) => {
    switch (arrangement) {
      case 'remote':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300';
      case 'hybrid':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300';
      case 'on-site':
        return 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs lg:max-w-sm">
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          value={keyword}
          onChange={handleInputChange}
          onFocus={() => {
            if (keyword.trim().length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Filter by title or company..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50/80 py-1.5 pl-9 pr-8 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-900 transition-all"
          aria-label="Global search for jobs by title or company"
          aria-expanded={isOpen}
          role="combobox"
          aria-autocomplete="list"
        />
        {keyword && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Floating Real-Time Dropdown Popover */}
      {isOpen && keyword.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in-50 zoom-in-95 duration-100">
          
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-3.5 py-2 text-[11px] font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Database className="h-3 w-3 text-indigo-500" />
              <span>{isSearchingDb ? 'Querying database...' : 'Database Matches'}</span>
            </span>
            <span>{matchingJobs.length} {matchingJobs.length === 1 ? 'opening' : 'openings'}</span>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {matchingJobs.length === 0 ? (
              <div className="p-4 text-center">
                <JobIcon className="mx-auto h-6 w-6 text-slate-300 dark:text-slate-600 mb-1.5" />
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  No matching jobs found
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Try searching for different title keywords or company names
                </p>
              </div>
            ) : (
              visibleMatches.map((job, idx) => {
                const isSelected = idx === activeIndex;
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => handleSelect(job)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full text-left p-3 text-xs transition-colors flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/60'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 dark:text-white line-clamp-1">
                        {highlightMatch(job.title, keyword)}
                      </span>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold capitalize ${getWorkArrangementBadge(job.workArrangement)}`}>
                        {job.workArrangement}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                      <span className="font-medium text-slate-600 dark:text-slate-300 line-clamp-1">
                        {highlightMatch(job.companyName, keyword)}
                      </span>
                      <span className="inline-flex items-center gap-1 shrink-0">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span className="truncate max-w-[100px]">{job.location}</span>
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {matchingJobs.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/50 p-2 dark:border-slate-800 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onSearchSubmit(keyword);
                }}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-1.5 px-3 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-2xs"
              >
                <span>View all {matchingJobs.length} matching jobs</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
