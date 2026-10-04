import React from 'react';
import { 
  FileText, 
  Archive, 
  FolderTree, 
  Sparkles, 
  ArrowUpRight,
  Database,
  Edit3
} from 'lucide-react';
import { JobIcon } from '../icons/JobIcon';
import { Job } from '../../types/job';
import { Category } from '../../services/categoryService';
import { ManagedUser } from '../../types/user';
import { formatSalary } from '../../utils/jobUtils';

interface AdminHomeDashboardProps {
  adminEmail?: string;
  adminName?: string;
  jobs: Job[];
  categories: Category[];
  users: ManagedUser[];
  supabaseConnected: boolean;
  onNavigate: (route: string) => void;
  onEditJob: (job: Job) => void;
}

export const AdminHomeDashboard: React.FC<AdminHomeDashboardProps> = ({
  jobs,
  categories,
  users,
  onNavigate,
  onEditJob
}) => {
  const publishedJobs = jobs.filter(j => j.status === 'published');
  const draftJobs = jobs.filter(j => j.status === 'draft');
  const archivedJobs = jobs.filter(j => j.status === 'archived');

  // Department counts
  const categoryCounts = categories.map(cat => ({
    name: cat.name,
    count: jobs.filter(j => j.category === cat.name).length
  })).sort((a, b) => b.count - a.count).slice(0, 5);

  const recentJobs = [...jobs].slice(0, 6);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* 4 Primary Executive Overview Cards: All Listings, Drafts, Archived, Departments */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Card 1: All Listings */}
        <div 
          onClick={() => onNavigate('/admin/jobs?status=all')}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-600/70 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">All Listings</span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <JobIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {jobs.length}
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
              {publishedJobs.length} Live
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
            <span>{draftJobs.length} draft • {archivedJobs.length} archived</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center">
              View all <ArrowUpRight className="h-3 w-3 inline ml-0.5" />
            </span>
          </div>
        </div>

        {/* Card 2: Drafts (Clicking navigates to drafts filter) */}
        <div 
          onClick={() => onNavigate('/admin/jobs?status=draft')}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 hover:border-amber-400 dark:hover:border-amber-600/70 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Drafts</span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {draftJobs.length}
            </span>
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50">
              Unpublished
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
            <span>{draftJobs.length === 0 ? 'No pending drafts' : 'Pending review & publish'}</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center">
              View drafts <ArrowUpRight className="h-3 w-3 inline ml-0.5" />
            </span>
          </div>
        </div>

        {/* Card 3: Archived (Clicking navigates to archived filter) */}
        <div 
          onClick={() => onNavigate('/admin/jobs?status=archived')}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Archived</span>
            <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 dark:bg-slate-800 dark:text-slate-300 group-hover:scale-110 transition-transform">
              <Archive className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {archivedJobs.length}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Closed Roles
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
            <span>{archivedJobs.length === 0 ? 'No archived listings' : 'Expired or de-listed'}</span>
            <span className="text-slate-600 dark:text-slate-300 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center">
              View archived <ArrowUpRight className="h-3 w-3 inline ml-0.5" />
            </span>
          </div>
        </div>

        {/* Card 4: Departments (Clicking navigates to departments) */}
        <div 
          onClick={() => onNavigate('/admin/departments')}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 hover:border-violet-400 dark:hover:border-violet-600/70 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Departments</span>
            <div className="h-9 w-9 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 dark:bg-violet-950/60 dark:text-violet-400 group-hover:scale-110 transition-transform">
              <FolderTree className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {categories.length}
            </span>
            <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200/50 dark:border-violet-800/50">
              Categories
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
            <span>Classifications &amp; URL slugs</span>
            <span className="text-violet-600 dark:text-violet-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center">
              Manage <ArrowUpRight className="h-3 w-3 inline ml-0.5" />
            </span>
          </div>
        </div>

      </div>

      {/* Main Grid: Recent Jobs + Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Recent Job Postings (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Job Postings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latest verified opportunities synced to the candidate directory
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/admin/jobs')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 cursor-pointer"
            >
              View all jobs
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
            {recentJobs.map((job) => (
              <div 
                key={job.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {job.title}
                    </h3>
                    {job.featured && (
                      <span className="shrink-0 inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 bg-amber-50 text-[10px] font-bold text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300">
                        <Sparkles className="h-2.5 w-2.5" />
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{job.companyName}</span>
                    <span>•</span>
                    <span className="capitalize">{job.workArrangement}</span>
                    <span>•</span>
                    <span>{job.category}</span>
                    <span>•</span>
                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    job.status === 'published'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                  }`}>
                    {job.status}
                  </span>

                  <button
                    type="button"
                    onClick={() => onEditJob(job)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Edit Job"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Department Distribution & System Status (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Top Departments */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Top Departments
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('/admin/departments')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 cursor-pointer"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3">
              {categoryCounts.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{cat.name}</span>
                    <span className="font-mono text-slate-500">{cat.count} roles</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(12, (cat.count / (jobs.length || 1)) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick System & Security Info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3 text-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-indigo-500" />
              <span>Platform Sync</span>
            </h2>
            <div className="space-y-2 text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-between">
                <span>Architecture</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">Supabase / Serverless</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Realtime Sync</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Live (PostgreSQL)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Users</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{users.length} Admins</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
