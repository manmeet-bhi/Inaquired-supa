import React, { useState } from 'react';
import { 
  Code2, 
  Palette, 
  Sparkles, 
  TrendingUp, 
  Database, 
  DollarSign, 
  Settings, 
  Users, 
  Headphones, 
  Layers, 
  ArrowRight, 
  Search,
  FolderSearch,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { JobIcon } from '../components/icons/JobIcon';
import { Job } from '../types/job';

interface DepartmentsPageProps {
  jobs: Job[];
  onNavigate: (path: string) => void;
  onSelectJob: (slug: string) => void;
}

interface DepartmentDef {
  name: string;
  slug: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DEFAULT_DEPARTMENTS: DepartmentDef[] = [
  {
    name: 'Software Engineering',
    slug: 'engineering',
    description: 'Frontend, backend, mobile, full-stack development and cloud infrastructure roles.',
    icon: Code2,
  },
  {
    name: 'Design & Creative',
    slug: 'design',
    description: 'Product design, UI/UX research, brand visual design, and graphic design.',
    icon: Palette,
  },
  {
    name: 'Product Management',
    slug: 'product',
    description: 'Technical product management, product ownership, roadmap execution and strategy.',
    icon: Sparkles,
  },
  {
    name: 'Data & Analytics',
    slug: 'data',
    description: 'Data science, machine learning engineering, business intelligence and analytics.',
    icon: Database,
  },
  {
    name: 'Marketing & Growth',
    slug: 'marketing',
    description: 'Performance marketing, content strategy, brand communications, and SEO.',
    icon: TrendingUp,
  },
  {
    name: 'Sales & Business Dev',
    slug: 'sales',
    description: 'Account executives, sales development representatives, and partnerships.',
    icon: DollarSign,
  },
  {
    name: 'Operations & Strategy',
    slug: 'operations',
    description: 'Business operations, project management, and strategic process scaling.',
    icon: Settings,
  },
  {
    name: 'Customer Success',
    slug: 'customer-support',
    description: 'Technical support specialists, customer onboarding, and client account managers.',
    icon: Headphones,
  },
  {
    name: 'People & HR',
    slug: 'human-resources',
    description: 'Talent acquisition, technical recruiting, people operations, and employee experience.',
    icon: Users,
  },
];

export const DepartmentsPage: React.FC<DepartmentsPageProps> = ({
  jobs,
  onNavigate,
  onSelectJob,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Extract all distinct categories from actual jobs
  const jobCategories = Array.from(new Set(jobs.map((j) => (j.category || '').trim()).filter(Boolean)));

  // Merge default departments with any custom categories present in jobs
  const allDepartments: DepartmentDef[] = [...DEFAULT_DEPARTMENTS];

  jobCategories.forEach((catName) => {
    const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const exists = allDepartments.some((d) => d.slug === slug || d.name.toLowerCase() === catName.toLowerCase());
    if (!exists) {
      allDepartments.push({
        name: catName,
        slug,
        description: `Explore verified opportunities and openings in ${catName}.`,
        icon: JobIcon,
      });
    }
  });

  // Calculate job counts and active jobs per department
  const departmentStats = allDepartments.map((dept) => {
    const matchedJobs = jobs.filter((j) => {
      const cat = (j.category || '').toLowerCase();
      const title = (j.title || '').toLowerCase();
      return (
        cat.includes(dept.slug) ||
        cat.includes(dept.name.toLowerCase()) ||
        title.includes(dept.name.toLowerCase()) ||
        (dept.slug === 'engineering' && (cat.includes('engineer') || cat.includes('tech') || cat.includes('develop'))) ||
        (dept.slug === 'data' && (cat.includes('data') || cat.includes('analytics') || cat.includes('ai') || cat.includes('ml')))
      );
    });

    return {
      ...dept,
      count: matchedJobs.length,
      sampleJobs: matchedJobs.slice(0, 2),
    };
  });

  // Filter based on search query
  const filteredDepartments = departmentStats.filter((dept) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      dept.name.toLowerCase().includes(q) ||
      dept.description.toLowerCase().includes(q) ||
      dept.sampleJobs.some((j) => j.title.toLowerCase().includes(q))
    );
  });

  // Sort: departments with active roles first, then alphabetically
  filteredDepartments.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name);
  });

  // Pagination
  const totalPages = Math.ceil(filteredDepartments.length / ITEMS_PER_PAGE);
  const paginatedDepartments = filteredDepartments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-10 sm:space-y-14 pb-16">
      
      {/* Hero Header */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 bg-radial-[at_50%_0%] from-indigo-50/70 via-slate-50 to-white dark:from-indigo-950/30 dark:via-slate-950 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/80 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-2xs dark:border-indigo-800/80 dark:bg-indigo-950/60 dark:text-indigo-300 mb-4">
            <Layers className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Role Discovery by Department</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-3xl mx-auto">
            Explore Openings by{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-400">
              Department
            </span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Browse verified career opportunities grouped by specialized functional domains. No signup wall, direct employer application links.
          </p>

          {/* Department Search Input */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search departments (e.g. Engineering, Design)..."
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 shadow-xs transition-colors"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Departments Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {filteredDepartments.length} Functional Departments
          </h2>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            {jobs.length} Total Verified Positions
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedDepartments.map((dept) => {
            const Icon = dept.icon;
            return (
              <div
                key={dept.slug}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-indigo-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-indigo-600/70 transition-all duration-200"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        dept.count > 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/40'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700/50'
                      }`}
                    >
                      {dept.count} {dept.count === 1 ? 'role' : 'roles'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {dept.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {dept.description}
                  </p>

                  {/* Sample Role Pills */}
                  {dept.sampleJobs.length > 0 && (
                    <div className="mt-4 space-y-1.5 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Recent Openings
                      </span>
                      {dept.sampleJobs.map((j) => (
                        <button
                          key={j.id}
                          onClick={() => onSelectJob(j.slug || j.id)}
                          className="block w-full text-left truncate text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          • {j.title} <span className="text-[11px] text-slate-400 font-normal">at {j.companyName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => onNavigate(`/category/${dept.slug}`)}
                    className="inline-flex items-center justify-between w-full text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    <span>View all {dept.name} jobs</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Page <strong className="text-slate-800 dark:text-slate-200">{currentPage}</strong> of{' '}
              <strong className="text-slate-800 dark:text-slate-200">{totalPages}</strong>
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
