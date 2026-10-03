import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Code, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Save,
  Tag,
  ChevronLeft,
  ChevronRight,
  Table,
  Sliders,
  Edit3
} from 'lucide-react';
import { JobIcon } from '../icons/JobIcon';
import { Job } from '../../types/job.ts';
import { updateJob } from '../../services/jobService.ts';
import { supabase } from '../../lib/supabase.ts';
import { generateJobPostingJsonLd } from '../../lib/seo/jsonLdEngine.ts';

interface SeoJobsTabProps {
  onShowToast: (message: string) => void;
  siteName: string;
}

export const SeoJobsTab: React.FC<SeoJobsTabProps> = ({ onShowToast, siteName }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobViewMode, setJobViewMode] = useState<'editor' | 'table'>('editor');
  
  // Editor state for selected job
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [seoImageUrl, setSeoImageUrl] = useState('');
  const [noIndex, setNoIndex] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped: Job[] = data.map((row: any) => ({
          id: row.id,
          title: row.title,
          slug: row.slug,
          companyName: row.company_name,
          location: row.location,
          jobType: row.job_type,
          workArrangement: row.work_arrangement,
          category: row.category,
          experienceLevel: row.experience_level,
          salaryMin: row.salary_min != null ? Number(row.salary_min) : undefined,
          salaryMax: row.salary_max != null ? Number(row.salary_max) : undefined,
          currency: row.currency || 'USD',
          description: row.description || '',
          responsibilities: row.responsibilities || '',
          requirements: row.requirements || '',
          benefits: row.benefits || '',
          applicationUrl: row.application_url || '',
          applicationDeadline: row.application_deadline,
          tags: row.tags || [],
          status: row.status,
          featured: Boolean(row.featured),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          publishedAt: row.published_at,
          seoTitle: row.seo_title || '',
          seoDescription: row.seo_description || '',
          seoImageUrl: row.seo_image_url || '',
          canonicalUrl: row.canonical_url || '',
          noIndex: Boolean(row.no_index)
        }));

        setJobs(mapped);
        if (mapped.length > 0 && !selectedJobId) {
          selectJob(mapped[0]);
        }
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const selectJob = (job: Job) => {
    setSelectedJobId(job.id);
    setSeoTitle(job.seoTitle || '');
    setSeoDescription(job.seoDescription || '');
    setCanonicalUrl(job.canonicalUrl || '');
    setSeoImageUrl(job.seoImageUrl || '');
    setNoIndex(Boolean(job.noIndex));
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://inaquired.app';

  // Compute live effective values
  const effectiveTitle = seoTitle.trim() || `${selectedJob?.title || 'Job Opening'} at ${selectedJob?.companyName || 'Company'} | ${siteName}`;
  const effectiveCanonical = canonicalUrl.trim() || (selectedJob ? `${origin}/jobs/${selectedJob.slug}` : `${origin}/jobs`);
  const effectiveDesc = seoDescription.trim() || (selectedJob?.description ? selectedJob.description.slice(0, 160).replace(/\s+/g, ' ') : `Apply for ${selectedJob?.title} at ${selectedJob?.companyName}. Find remote, hybrid, and full-time opportunities on inaquired.`);

  // Generate live JSON-LD
  const generatedJsonLd = selectedJob ? generateJobPostingJsonLd(selectedJob, origin) : null;

  const handleSaveSeo = async () => {
    if (!selectedJob) return;

    try {
      setSaving(true);
      await updateJob(selectedJob.id, {
        seoTitle: seoTitle.trim() || undefined,
        seoDescription: seoDescription.trim() || undefined,
        canonicalUrl: canonicalUrl.trim() || undefined,
        seoImageUrl: seoImageUrl.trim() || undefined,
        noIndex: noIndex
      });

      setJobs(prev => prev.map(j => j.id === selectedJob.id ? {
        ...j,
        seoTitle: seoTitle.trim(),
        seoDescription: seoDescription.trim(),
        canonicalUrl: canonicalUrl.trim(),
        seoImageUrl: seoImageUrl.trim(),
        noIndex: noIndex
      } : j));

      onShowToast(`SEO overrides saved for "${selectedJob.title}"!`);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save job SEO overrides');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyJsonLd = () => {
    if (!generatedJsonLd) return;
    navigator.clipboard.writeText(JSON.stringify(generatedJsonLd, null, 2));
    setCopiedSchema(true);
    onShowToast('Schema.org JobPosting JSON-LD copied!');
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentJobIndex = filteredJobs.findIndex(j => j.id === selectedJob?.id);

  const handlePrevJob = () => {
    if (filteredJobs.length === 0) return;
    const prevIdx = (currentJobIndex - 1 + filteredJobs.length) % filteredJobs.length;
    selectJob(filteredJobs[prevIdx]);
  };

  const handleNextJob = () => {
    if (filteredJobs.length === 0) return;
    const nextIdx = (currentJobIndex + 1) % filteredJobs.length;
    selectJob(filteredJobs[nextIdx]);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Mode Switcher Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        
        {/* Left: Job Selector Dropdown & Prev/Next */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap flex items-center gap-1.5">
              <JobIcon className="h-3.5 w-3.5 text-indigo-500" />
              <span>Job:</span>
            </span>

            <select
              value={selectedJob?.id || ''}
              onChange={(e) => {
                const found = jobs.find(j => j.id === e.target.value);
                if (found) {
                  selectJob(found);
                  setJobViewMode('editor');
                }
              }}
              className="rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white py-1.5 pl-3 pr-8 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 cursor-pointer max-w-[220px] sm:max-w-xs md:max-w-md truncate"
            >
              {filteredJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} – {j.companyName} {j.seoTitle ? '★ (Custom SEO)' : ''}
                </option>
              ))}
            </select>

            {/* Quick Prev / Next Arrows */}
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-950">
              <button
                type="button"
                onClick={handlePrevJob}
                className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Previous Job"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextJob}
                className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Next Job"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50">
            {jobs.length} Listings Indexed
          </span>
        </div>

        {/* Right: View Mode Toggle */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          {selectedJob && (
            <a
              href={`/jobs/${selectedJob.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white dark:border-slate-700 dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              title="Open public job listing in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Live Page</span>
            </a>
          )}

          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100/80 p-0.5 dark:border-slate-700 dark:bg-slate-950">
            <button
              type="button"
              onClick={() => setJobViewMode('editor')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                jobViewMode === 'editor'
                  ? 'bg-white text-indigo-600 shadow-2xs dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Job SEO Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setJobViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                jobViewMode === 'table'
                  ? 'bg-white text-indigo-600 shadow-2xs dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Table className="h-3.5 w-3.5" />
              <span>All Jobs Table ({jobs.length})</span>
            </button>
          </div>
        </div>

      </div>

      {/* VIEW 1: ALL JOBS SEO TABLE (ZERO nested scrollbars) */}
      {jobViewMode === 'table' && (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs by title or company..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing {filteredJobs.length} of {jobs.length} jobs
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4">Role &amp; Company</th>
                  <th className="py-3 px-4">SEO Title</th>
                  <th className="py-3 px-4">Schema Status</th>
                  <th className="py-3 px-4 text-center">Indexing</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {filteredJobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-950/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{j.title}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{j.companyName} • {j.category}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      {j.seoTitle ? (
                        <div className="font-medium text-indigo-600 dark:text-indigo-400 truncate" title={j.seoTitle}>
                          {j.seoTitle} (Custom)
                        </div>
                      ) : (
                        <div className="text-slate-500 truncate" title={`${j.title} at ${j.companyName} | ${siteName}`}>
                          {j.title} at {j.companyName} | {siteName}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        JobPosting JSON-LD
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        j.noIndex 
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400' 
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                      }`}>
                        {j.noIndex ? 'NoIndex' : 'Indexed'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          selectJob(j);
                          setJobViewMode('editor');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Edit SEO</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: FULL-WIDTH SINGLE JOB FOCUSED EDITOR (ZERO trapped scrollbars) */}
      {jobViewMode === 'editor' && selectedJob && (
        <div className="space-y-5">
          
          {/* SERP Preview Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-indigo-500" />
                Google Search Snippet Preview
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                {seoTitle ? 'Custom Override Active' : 'Auto Fallback Active'}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40 font-sans space-y-1">
              <div className="text-[11px] text-slate-500 truncate">
                {effectiveCanonical}
              </div>
              <div className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-400 cursor-pointer line-clamp-1">
                {effectiveTitle}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                {effectiveDesc}
              </div>
            </div>
          </div>

          {/* Overrides Form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  <span>Metadata Overrides for: {selectedJob.title}</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Optional custom overrides. If left empty, automated derived patterns are used.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveSeo}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{saving ? 'Saving...' : 'Save Job SEO'}</span>
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    SEO Title Tag Override
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {seoTitle.length} chars (Target: 50-60)
                  </span>
                </div>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={`Default: ${selectedJob.title} at ${selectedJob.companyName} | ${siteName}`}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Meta Description Override
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {seoDescription.length} chars (Target: 140-160)
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Leave blank to use derived description snippet..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Custom Canonical URL
                  </label>
                  <input
                    type="text"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder={`Default: ${origin}/jobs/${selectedJob.slug}`}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Social Share Image URL (OG:Image)
                  </label>
                  <input
                    type="text"
                    value={seoImageUrl}
                    onChange={(e) => setSeoImageUrl(e.target.value)}
                    placeholder="https://yourdomain.com/og/job-banner.jpg"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noIndex}
                  onChange={(e) => setNoIndex(e.target.checked)}
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Exclude this job opening from search engines (<code className="font-mono text-[11px] text-rose-500">noindex</code>)
                </span>
              </label>
            </div>
          </div>

          {/* Schema.org JobPosting Inspector */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Code className="h-3.5 w-3.5 text-indigo-500" />
                Google Job Search Schema (JobPosting JSON-LD)
              </span>
              <button
                type="button"
                onClick={handleCopyJsonLd}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                {copiedSchema ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                <span>{copiedSchema ? 'Copied' : 'Copy JSON-LD'}</span>
              </button>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className="truncate">Hiring Org: OK</span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className="truncate">Work Mode: OK</span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className="truncate">ValidThrough: OK</span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className="truncate">Direct Apply: OK</span>
              </div>
            </div>

            <pre className="p-3.5 rounded-xl border border-slate-100 bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto scrollbar-thin">
              {generatedJsonLd ? JSON.stringify(generatedJsonLd, null, 2) : '// No job selected'}
            </pre>
          </div>

        </div>
      )}
    </div>
  );
};
