import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeft, 
  Building, 
  MapPin, 
  DollarSign, 
  Link as LinkIcon, 
  Calendar, 
  Tag as TagIcon, 
  Star, 
  Check, 
  AlertCircle,
  FileText,
  Sparkles,
  Plus,
  X
} from 'lucide-react';
import { JobIcon } from '../icons/JobIcon';
import { AdminHeader } from './AdminHeader';
import { Job, JobType, WorkArrangement, ExperienceLevel, JobStatus } from '../../types/job';

interface JobEditorPageProps {
  initialJob?: Job | null;
  categoriesList?: string[];
  onClose: () => void;
  onSubmit: (jobData: Omit<Job, 'id'>, jobId?: string) => Promise<void>;
}

const DEFAULT_CATEGORIES = [
  'Engineering',
  'Design & Creative',
  'Product Management',
  'Marketing & Growth',
  'Sales & Business Dev',
  'Operations & Strategy',
  'Finance & Accounting',
  'Customer Success & Support',
  'Data & AI',
  'Human Resources',
  'Other'
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'SGD'];

const QUICK_TAG_SUGGESTIONS = [
  'React', 'TypeScript', 'Node.js', 'Python', 'Next.js', 
  'Supabase', 'PostgreSQL', 'Tailwind', 'AI / ML', 'Full-Stack'
];

interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
}

const AutoResizeTextarea: React.FC<AutoResizeTextareaProps> = ({ 
  value, 
  onChange, 
  onInput,
  minRows = 3, 
  className = '', 
  style,
  ...props 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const computedMinHeight = minRows * 24 + 20;
    const newHeight = Math.max(el.scrollHeight, computedMinHeight);
    el.style.height = `${newHeight}px`;
  }, [minRows]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [adjustHeight]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        onChange?.(e);
        adjustHeight();
      }}
      onInput={(e) => {
        adjustHeight();
        onInput?.(e);
      }}
      className={`${className} overflow-hidden resize-none transition-[height] duration-75`}
      style={{ 
        fieldSizing: 'content' as any,
        minHeight: `${minRows * 24 + 20}px`,
        ...style 
      }}
      {...props}
    />
  );
};

export const JobEditorPage: React.FC<JobEditorPageProps> = ({
  initialJob,
  categoriesList,
  onClose,
  onSubmit
}) => {
  const isEditing = Boolean(initialJob);
  const categoriesToUse = categoriesList && categoriesList.length > 0 ? categoriesList : DEFAULT_CATEGORIES;

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState<JobType>('full-time');
  const [workArrangement, setWorkArrangement] = useState<WorkArrangement>('remote');
  const [category, setCategory] = useState(categoriesToUse[0] || 'Engineering');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('mid');
  const [salaryMin, setSalaryMin] = useState<string>('');
  const [salaryMax, setSalaryMax] = useState<string>('');
  const [isSalaryNotDisclosed, setIsSalaryNotDisclosed] = useState<boolean>(false);
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [requirements, setRequirements] = useState('');
  const [benefits, setBenefits] = useState('');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [applicationDeadline, setApplicationDeadline] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTagInput, setCurrentTagInput] = useState('');
  const [status, setStatus] = useState<JobStatus>('published');
  const [featured, setFeatured] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize form state
  useEffect(() => {
    if (initialJob) {
      setTitle(initialJob.title || '');
      setSlug(initialJob.slug || '');
      setCompanyName(initialJob.companyName || '');
      setLocation(initialJob.location || '');
      setJobType(initialJob.jobType || 'full-time');
      setWorkArrangement(initialJob.workArrangement || 'remote');
      setCategory(initialJob.category || categoriesToUse[0] || 'Engineering');
      if (initialJob.salaryMin != null && Number(initialJob.salaryMin) > 0) {
        setSalaryMin(String(initialJob.salaryMin));
        setIsSalaryNotDisclosed(false);
      } else {
        setSalaryMin('');
        setIsSalaryNotDisclosed(initialJob.salaryMin == null && initialJob.salaryMax == null);
      }
      setSalaryMax(initialJob.salaryMax != null ? String(initialJob.salaryMax) : '');
      setCurrency(initialJob.currency || 'USD');
      setDescription(initialJob.description || '');
      setResponsibilities(initialJob.responsibilities || '');
      setRequirements(initialJob.requirements || '');
      setBenefits(initialJob.benefits || '');
      setApplicationUrl(initialJob.applicationUrl || '');
      setApplicationDeadline(initialJob.applicationDeadline || '');
      setTags(initialJob.tags || []);
      setStatus(initialJob.status || 'published');
      setFeatured(Boolean(initialJob.featured));
    } else {
      resetForm();
    }
    setErrorMessage(null);
  }, [initialJob]);

  // Auto-generate slug when title or company changes (only when creating)
  useEffect(() => {
    if (!isEditing && title) {
      const generated = `${title}-${companyName || 'job'}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 60);
      setSlug(generated);
    }
  }, [title, companyName, isEditing]);

  const resetForm = () => {
    setTitle('');
    setSlug('');
    setCompanyName('');
    setLocation('');
    setJobType('full-time');
    setWorkArrangement('remote');
    setCategory(categoriesToUse[0] || 'Engineering');
    setExperienceLevel('mid');
    setSalaryMin('');
    setSalaryMax('');
    setIsSalaryNotDisclosed(false);
    setCurrency('USD');
    setDescription('');
    setResponsibilities('');
    setRequirements('');
    setBenefits('');
    setApplicationUrl('');
    setApplicationDeadline('');
    setTags([]);
    setCurrentTagInput('');
    setStatus('published');
    setFeatured(false);
  };

  const handleAddTag = (tagToAdd?: string) => {
    const raw = tagToAdd || currentTagInput;
    const trimmed = raw.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      if (!tagToAdd) setCurrentTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async (customStatus?: JobStatus) => {
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Please provide a job title.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!companyName.trim()) {
      setErrorMessage('Please provide a company name.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!applicationUrl.trim()) {
      setErrorMessage('Please provide an application URL or email.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const minSalary = salaryMin.trim() ? Number(salaryMin) : undefined;
    const maxSalary = salaryMax.trim() ? Number(salaryMax) : undefined;
    if (!isSalaryNotDisclosed && (
      (minSalary !== undefined && (!Number.isFinite(minSalary) || minSalary < 0)) ||
      (maxSalary !== undefined && (!Number.isFinite(maxSalary) || maxSalary < 0))
    )) {
      setErrorMessage('Salary values must be non-negative numbers.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!isSalaryNotDisclosed && minSalary !== undefined && maxSalary !== undefined && maxSalary < minSalary) {
      setErrorMessage('Maximum salary must be greater than or equal to minimum salary.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const finalStatus = customStatus || status;
    const finalSlug = slug.trim() || `${title}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const jobPayload: Omit<Job, 'id'> = {
      title: title.trim(),
      slug: finalSlug,
      companyName: companyName.trim(),
      location: location.trim() || (workArrangement === 'remote' ? 'Remote (Worldwide)' : 'HQ'),
      jobType,
      workArrangement,
      category,
      experienceLevel,
      salaryMin: !isSalaryNotDisclosed ? minSalary : undefined,
      salaryMax: !isSalaryNotDisclosed ? maxSalary : undefined,
      currency,
      description: description.trim(),
      responsibilities: responsibilities.trim(),
      requirements: requirements.trim(),
      benefits: benefits.trim() || undefined,
      applicationUrl: applicationUrl.trim(),
      applicationDeadline: applicationDeadline || undefined,
      tags,
      status: finalStatus,
      featured,
      createdAt: initialJob?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: finalStatus === 'published' ? (initialJob?.publishedAt || new Date().toISOString()) : undefined,
      createdBy: 'admin'
    };

    try {
      setIsSubmitting(true);
      await onSubmit(jobPayload, initialJob?.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save job listing. Please check your connection.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-16">
      
      {/* Dedicated Sticky Header */}
      <AdminHeader
        title={isEditing ? `Edit: ${initialJob?.title || 'Job'}` : 'Post New Job'}
        description={isEditing ? 'Update listing specifications, compensation, and requirements.' : 'Create and publish a new job opening to candidates.'}
        backButton={{
          label: 'Back to Jobs',
          onClick: onClose,
        }}
        badge={{
          label: status,
          variant: status === 'published' ? 'success' : status === 'draft' ? 'warning' : 'default',
        }}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSave('draft')}
              disabled={isSubmitting}
              className="hidden sm:inline-flex rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Save Draft
            </button>

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 sm:px-5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-[0.98] cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>{isEditing ? 'Save Changes' : 'Publish Job'}</span>
                </>
              )}
            </button>
          </div>
        }
      />

      {/* Main Form Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        
        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200/80 px-4 py-3 text-xs sm:text-sm text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 2-Column Responsive Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          
          {/* LEFT 2/3 COLUMN: Main Role Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Card 1: Role & Organization */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  ROLE & COMPANY
                </h2>
                <span className="text-[11px] text-slate-400 font-medium">* Required fields</span>
              </div>

              {/* Title & Company Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Job Title <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <JobIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Company Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Work Arrangement Pills */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Work Arrangement
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['remote', 'hybrid', 'on-site'] as WorkArrangement[]).map((wa) => (
                    <button
                      key={wa}
                      type="button"
                      onClick={() => setWorkArrangement(wa)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap capitalize border transition-all cursor-pointer ${
                        workArrangement === wa
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-500 ring-1 ring-indigo-500/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900'
                      }`}
                    >
                      {wa === 'remote' ? 'Remote' : wa === 'hybrid' ? 'Hybrid' : 'On-Site'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Job Type Pills */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Job Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['full-time', 'part-time', 'contract', 'internship'] as JobType[]).map((jt) => (
                    <button
                      key={jt}
                      type="button"
                      onClick={() => setJobType(jt)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap capitalize border transition-all cursor-pointer ${
                        jobType === jt
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-500 ring-1 ring-indigo-500/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900'
                      }`}
                    >
                      {jt === 'full-time' ? 'Full-Time' : jt === 'part-time' ? 'Part-Time' : jt === 'contract' ? 'Contract' : 'Intern'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Department & Experience Level (2 generous cols) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category / Department
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900"
                  >
                    {categoriesToUse.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Experience Level
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900"
                  >
                    <option value="entry">Entry-Level (0-2 yrs)</option>
                    <option value="mid">Mid-Level (2-5 yrs)</option>
                    <option value="senior">Senior (5+ yrs)</option>
                    <option value="lead">Lead / Staff / Director</option>
                    <option value="internship">Internship / Student</option>
                  </select>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Location / Region
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900 transition-all"
                  />
                </div>
              </div>

              {/* Job Overview & Summary */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Job Overview &amp; Summary (Optional)
                </label>
                <AutoResizeTextarea
                  minRows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900 leading-relaxed transition-all"
                />
              </div>
            </section>

            {/* Card: Application Method */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  APPLICATION METHOD
                </h2>
                <span className="text-[11px] text-slate-400 font-medium">* Required fields</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Application link <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={applicationUrl}
                      onChange={(e) => setApplicationUrl(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    date optional
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="date"
                      value={applicationDeadline}
                      onChange={(e) => setApplicationDeadline(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900 transition-all"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Card: Responsibilities, Requirements & Perks */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  RESPONSIBILITIES, REQUIREMENTS &amp; PERKS
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Textareas automatically expand as you type or paste bullet points.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Key Responsibilities
                  </label>
                  <AutoResizeTextarea
                    minRows={5}
                    value={responsibilities}
                    onChange={(e) => setResponsibilities(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900 leading-relaxed transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Requirements &amp; Qualifications
                  </label>
                  <AutoResizeTextarea
                    minRows={5}
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900 leading-relaxed transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Benefits &amp; Perks (Optional)
                  </label>
                  <AutoResizeTextarea
                    minRows={3}
                    value={benefits}
                    onChange={(e) => setBenefits(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900 leading-relaxed transition-all"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT 1/3 COLUMN: Sticky Publishing, Apply & Settings */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Card 4: Publishing Status */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Publishing Status
              </h2>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Visibility
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['published', 'draft', 'archived'] as JobStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`flex-1 min-w-[75px] py-2 px-2 text-xs font-semibold capitalize rounded-xl border transition-all cursor-pointer ${
                        status === st
                          ? st === 'published'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 ring-1 ring-emerald-500/20'
                            : st === 'draft'
                            ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 ring-1 ring-amber-500/20'
                            : 'border-slate-500 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 cursor-pointer hover:bg-white dark:border-slate-800 dark:bg-slate-950/60 dark:hover:bg-slate-950 transition-colors">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 dark:bg-slate-900"
                  />
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <Star className={`h-4 w-4 ${featured ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                    <span>Pin to Spotlight (Featured)</span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-600 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:focus:bg-slate-900"
                />
                <p className="mt-1 text-[10px] text-slate-400 truncate">
                  Preview: <span className="font-mono">/jobs/{slug || '...'}</span>
                </p>
              </div>
            </section>

            {/* Card: Compensation (Annual) */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Compensation (Annual)
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={isSalaryNotDisclosed}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900 disabled:opacity-50"
                >
                  {CURRENCIES.map((curr) => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Min Salary
                  </label>
                  {isSalaryNotDisclosed && (
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Not disclosed
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  value={salaryMin}
                  disabled={isSalaryNotDisclosed}
                  onChange={(e) => {
                    setSalaryMin(e.target.value);
                    if (e.target.value) setIsSalaryNotDisclosed(false);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900/50 transition-all"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 cursor-pointer hover:bg-white dark:border-slate-800 dark:bg-slate-950/60 dark:hover:bg-slate-950 transition-colors">
                  <input
                    type="checkbox"
                    checked={isSalaryNotDisclosed}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsSalaryNotDisclosed(checked);
                      if (checked) {
                        setSalaryMin('');
                      }
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-900"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Not disclosed
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Hide salary amount from the public listing
                    </span>
                  </div>
                </label>
              </div>
            </section>

            {/* Card 7: Skills & Tags */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                TAGS &amp; SKILLS
              </h2>

              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <TagIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={currentTagInput}
                    onChange={(e) => setCurrentTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-8 pr-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900 transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAddTag()}
                  className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1.5 items-center pt-1">
                <span className="text-[10px] text-slate-400 mr-1">Suggested:</span>
                {QUICK_TAG_SUGGESTIONS.filter(t => !tags.includes(t)).slice(0, 5).map((sugg) => (
                  <button
                    key={sugg}
                    type="button"
                    onClick={() => handleAddTag(sugg)}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    + {sugg}
                  </button>
                ))}
              </div>

              {/* Tag Chips */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {tags.map((t) => (
                    <span 
                      key={t}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60"
                    >
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </section>

          </div>

        </div>

      </main>
    </div>
  );
};
