import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  ArrowRight, 
  Search, 
  Globe2, 
  Laptop, 
  Building,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Job } from '../types/job';

interface CompaniesPageProps {
  jobs: Job[];
  onNavigate: (path: string) => void;
  onSelectJob: (slug: string) => void;
}

export const CompaniesPage: React.FC<CompaniesPageProps> = ({
  jobs,
  onNavigate,
  onSelectJob,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Group jobs by company name
  const companyMap = new Map<string, Job[]>();

  jobs.forEach((job) => {
    const rawName = (job.companyName || '').trim();
    if (!rawName) return;
    const existing = companyMap.get(rawName) || [];
    existing.push(job);
    companyMap.set(rawName, existing);
  });

  const companyList = Array.from(companyMap.entries()).map(([name, companyJobs]) => {
    // Collect unique locations
    const locations = Array.from(new Set(companyJobs.map((j) => j.location).filter(Boolean)));
    // Collect unique arrangements
    const arrangements = Array.from(new Set(companyJobs.map((j) => j.workArrangement).filter(Boolean)));
    // Collect unique categories
    const categories = Array.from(new Set(companyJobs.map((j) => j.category).filter(Boolean)));

    return {
      name,
      jobs: companyJobs,
      count: companyJobs.length,
      locations,
      arrangements,
      categories,
    };
  });

  // Filter based on search query
  const filteredCompanies = companyList.filter((comp) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      comp.name.toLowerCase().includes(q) ||
      comp.locations.some((loc) => loc.toLowerCase().includes(q)) ||
      comp.categories.some((cat) => cat.toLowerCase().includes(q)) ||
      comp.jobs.some((j) => j.title.toLowerCase().includes(q))
    );
  });

  // Sort by number of open roles descending, then alphabetically
  filteredCompanies.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name);
  });

  // Pagination
  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);
  const paginatedCompanies = filteredCompanies.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-10 sm:space-y-14 pb-16">
      
      {/* Hero Header */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 bg-radial-[at_50%_0%] from-indigo-50/70 via-slate-50 to-white dark:from-indigo-950/30 dark:via-slate-950 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/80 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-2xs dark:border-indigo-800/80 dark:bg-indigo-950/60 dark:text-indigo-300 mb-4">
            <Building className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Verified Employer Directory</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-3xl mx-auto">
            Browse Hiring{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-400">
              Companies
            </span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Discover verified companies actively seeking talent across remote, hybrid, and onsite formats. No recruiter paywalls or candidate registration.
          </p>

          {/* Company Search Input */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search companies by name, location, or tech role..."
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 shadow-xs transition-colors"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Companies Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {filteredCompanies.length} Active Organizations
          </h2>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            {jobs.length} Total Verified Roles
          </span>
        </div>

        {filteredCompanies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800 bg-white dark:bg-slate-900/40">
            <Building2 className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              No matching companies found
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Try adjusting your search query or reset filters to see all hiring organizations.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer"
            >
              Reset Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedCompanies.map((company) => {
              return (
                <div
                  key={company.name}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-indigo-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-indigo-600/70 transition-all duration-200"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {company.name}
                        </h3>
                        {company.locations.length > 0 && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[200px]">
                              {company.locations.slice(0, 2).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/40 shrink-0">
                        {company.count} {company.count === 1 ? 'role' : 'roles'}
                      </span>
                    </div>

                    {/* Work Arrangement Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      {company.arrangements.map((arr) => (
                        <span
                          key={arr}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider"
                        >
                          {arr === 'remote' ? (
                            <Laptop className="h-3 w-3 text-emerald-500" />
                          ) : arr === 'hybrid' ? (
                            <Globe2 className="h-3 w-3 text-indigo-500" />
                          ) : (
                            <Building2 className="h-3 w-3 text-sky-500" />
                          )}
                          {arr}
                        </span>
                      ))}
                    </div>

                    {/* Department Tags */}
                    {company.categories.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {company.categories.slice(0, 3).map((cat) => (
                          <span
                            key={cat}
                            className="rounded-md bg-slate-50 border border-slate-200/60 dark:bg-slate-950 dark:border-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Active Openings Preview */}
                    <div className="mt-4 space-y-1.5 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Active Roles
                      </span>
                      {company.jobs.slice(0, 2).map((j) => (
                        <button
                          key={j.id}
                          onClick={() => onSelectJob(j.slug || j.id)}
                          className="block w-full text-left truncate text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                        >
                          • {j.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => onNavigate(`/company/${encodeURIComponent(company.name)}`)}
                      className="inline-flex items-center justify-between w-full text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      <span>Explore all {company.name} jobs ({company.count})</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Page <strong className="text-slate-800 dark:text-slate-200">{currentPage}</strong> of{' '}
              <strong className="text-slate-800 dark:text-slate-200">{totalPages}</strong>{' '}·{' '}
              <strong className="text-slate-800 dark:text-slate-200">{filteredCompanies.length}</strong> companies
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
      </section>

    </div>
  );
};
