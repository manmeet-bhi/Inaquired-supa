import React, { useEffect, useState } from 'react';
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
  Wallet,
  ClipboardList,
  Landmark,
  Factory,
  Clapperboard,
  ShoppingBag,
  Truck,
  Layers, 
  ArrowRight, 
  Search,
  FolderSearch,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Job } from '../types/job';
import { sortJobsByNewest } from '../utils/jobUtils';
import { Category } from '../services/categoryService';

interface DepartmentsPageProps {
  jobs: Job[];
  categories: Category[];
  onNavigate: (path: string) => void;
  onSelectJob: (slug: string) => void;
}

interface DepartmentDef {
  name: string;
  slug: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const getDepartmentIcon = (name: string, slug: string): DepartmentDef['icon'] => {
  const department = `${name} ${slug}`.toLowerCase();

  if (/engineer|develop|software|technology|\bit\b/.test(department)) return Code2;
  if (/design|creative|art/.test(department)) return Palette;
  if (/product/.test(department)) return Sparkles;
  if (/data|analytic|ai|research/.test(department)) return Database;
  if (/media|entertain/.test(department)) return Clapperboard;
  if (/market|growth/.test(department)) return TrendingUp;
  if (/sales|business develop|partnership/.test(department)) return DollarSign;
  if (/operation|strategy|administrat|office support/.test(department)) return Settings;
  if (/people|human resource|hr|recruit|talent/.test(department)) return Users;
  if (/customer|support|service/.test(department)) return Headphones;
  if (/finance|account|bank/.test(department)) return Wallet;
  if (/government|public sector/.test(department)) return Landmark;
  if (/manufactur|production/.test(department)) return Factory;
  if (/retail|e-commerce|ecommerce/.test(department)) return ShoppingBag;
  if (/supply chain|logistic/.test(department)) return Truck;
  if (/security|compliance|legal/.test(department)) return ClipboardList;

  return Layers;
};

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
    name: 'People & HR',
    slug: 'human-resources',
    description: 'Talent acquisition, technical recruiting, people operations, and employee experience.',
    icon: Users,
  },
];

export const DepartmentsPage: React.FC<DepartmentsPageProps> = ({
  jobs,
  categories,
  onNavigate,
  onSelectJob,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const newestFirstJobs = sortJobsByNewest(jobs);

  // Extract all distinct categories from actual jobs
  const jobCategories = Array.from(new Set(jobs.map((j) => (j.category || '').trim()).filter(Boolean)));

  // Merge default departments with any custom categories present in jobs
  const allDepartments: DepartmentDef[] = [];

  categories.forEach((category) => {
    if (category.slug === 'customer-success-support' || category.slug === 'customer-support') return;
    allDepartments.push({
      name: category.name,
      slug: category.slug,
      description: category.description || `Explore verified opportunities and openings in ${category.name}.`,
      icon: getDepartmentIcon(category.name, category.slug),
    });
  });

  DEFAULT_DEPARTMENTS.forEach((department) => {
    const exists = allDepartments.some((existing) =>
      existing.slug === department.slug ||
      existing.name.toLowerCase() === department.name.toLowerCase()
    );
    if (!exists) {
      allDepartments.push(department);
    }
  });

  jobCategories.forEach((catName) => {
    const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (slug === 'customer-success-support' || slug === 'customer-support') return;
    const exists = allDepartments.some((d) => d.slug === slug || d.name.toLowerCase() === catName.toLowerCase());
    if (!exists) {
      allDepartments.push({
        name: catName,
        slug,
        description: `Explore verified opportunities and openings in ${catName}.`,
        icon: getDepartmentIcon(catName, slug),
      });
    }
  });

  // Calculate job counts and active jobs per department
  const departmentStats = allDepartments.map((dept) => {
    const matchedJobs = newestFirstJobs.filter((j) => {
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
      matchingJobs: matchedJobs,
      recentJob: matchedJobs[0],
    };
  });

  // Filter based on search query
  const filteredDepartments = departmentStats.filter((dept) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      dept.name.toLowerCase().includes(q) ||
      dept.description.toLowerCase().includes(q) ||
      dept.matchingJobs.some((j) => j.title.toLowerCase().includes(q))
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

  useEffect(() => {
    if (currentPage > Math.max(totalPages, 1)) {
      setCurrentPage(Math.max(totalPages, 1));
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-10 sm:space-y-14 pb-16">
      
      {/* Hero Header */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 bg-radial-[at_50%_0%] from-indigo-50/70 via-slate-50 to-white dark:from-indigo-950/30 dark:via-slate-950 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          

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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
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
            const recentJob = dept.recentJob;
            return (
              <article
                key={dept.slug}
                role="link"
                tabIndex={0}
                aria-label={`Explore ${dept.name} jobs`}
                onClick={() => onNavigate(`/category/${dept.slug}`)}
                onKeyDown={(event) => {
                  if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    onNavigate(`/category/${dept.slug}`);
                  }
                }}
                className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-indigo-600/70 dark:focus-visible:ring-offset-slate-950"
              >
                <Icon
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-3 -top-4 h-32 w-32 text-indigo-500/[0.07] transition-transform duration-300 group-hover:scale-110 dark:text-indigo-300/[0.08]"
                />
                <div className="relative z-10">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {dept.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {dept.description}
                  </p>

                  {recentJob && (
                    <div className="mt-4 space-y-1.5 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Recent Opening
                      </span>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectJob(recentJob.slug || recentJob.id);
                        }}
                        className="block w-full text-left truncate text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        {recentJob.title}{' '}
                        <span className="text-[11px] text-slate-400 font-normal">at {recentJob.companyName}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative z-10 mt-6 flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-indigo-600 transition-all group-hover:translate-x-0.5 group-hover:border-indigo-200 group-hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-400 dark:group-hover:border-indigo-600/50 dark:group-hover:bg-indigo-950/40">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </article>
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
