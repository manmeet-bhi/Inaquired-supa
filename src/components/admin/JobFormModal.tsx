import React, { useState, useEffect } from 'react';
import { 
  Briefcase,
  X, 
  Plus, 
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
  Send,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { JobIcon } from '../icons/JobIcon';
import { Job, JobType, WorkArrangement, ExperienceLevel, JobStatus } from '../../types/job';

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jobData: Omit<Job, 'id'>, jobId?: string) => Promise<void>;
  initialJob?: Job | null;
  categoriesList?: string[];
  availableTags?: string[];
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

type ModalTab = 'basics' | 'details' | 'apply';

export const JobFormModal: React.FC<JobFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialJob,
  categoriesList,
  availableTags = []
}) => {
  const isEditing = Boolean(initialJob);
  const categoriesToUse = categoriesList && categoriesList.length > 0 ? categoriesList : DEFAULT_CATEGORIES;

  const [activeTab, setActiveTab] = useState<ModalTab>('basics');

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

  // Initialize or reset form state
  useEffect(() => {
    if (initialJob) {
      setTitle(initialJob.title || '');
      setSlug(initialJob.slug || '');
      setCompanyName(initialJob.companyName || '');
      setLocation(initialJob.location || '');
      setJobType(initialJob.jobType || 'full-time');
      setWorkArrangement(initialJob.workArrangement || 'remote');
      setCategory(initialJob.category || categoriesToUse[0] || 'Engineering');
      setExperienceLevel(initialJob.experienceLevel || 'mid');
      setSalaryMin(initialJob.salaryMin != null ? String(initialJob.salaryMin) : '');
      setSalaryMax(initialJob.salaryMax != null ? String(initialJob.salaryMax) : '');
      setCurrency(initialJob.currency || 'USD');
      setDescription(initialJob.description || '');
      setResponsibilities(initialJob.responsibilities || '');
      setRequirements(initialJob.requirements || '');
      setBenefits(initialJob.benefits || '');
      setApplicationUrl(initialJob.applicationUrl || '');
      setApplicationDeadline(initialJob.applicationDeadline || '');
      setTags(initialJob.tags || []);
      setCurrentTagInput('');
      setStatus(initialJob.status || 'published');
      setFeatured(Boolean(initialJob.featured));
    } else {
      resetForm();
    }
    setActiveTab('basics');
    setErrorMessage(null);
  }, [initialJob?.id, isOpen]);

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

  const addTags = (tagsToAdd: string[]) => {
    setTags((currentTags) => {
      const knownTags = new Set(currentTags.map((tag) => tag.toLocaleLowerCase()));
      const newTags = tagsToAdd
        .map((tag) => tag.trim())
        .filter((tag) => {
          const normalizedTag = tag.toLocaleLowerCase();
          if (!normalizedTag || knownTags.has(normalizedTag)) return false;
          knownTags.add(normalizedTag);
          return true;
        });
      return [...currentTags, ...newTags];
    });
  };

  const handleAddTag = (tagToAdd?: string) => {
    const raw = tagToAdd ?? currentTagInput;
    addTags(raw.split(','));
    if (tagToAdd === undefined) setCurrentTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const getTagsToSave = () => {
    const tagsToSave = [...tags];
    const knownTags = new Set(tagsToSave.map((tag) => tag.toLocaleLowerCase()));
    currentTagInput.split(',').forEach((tag) => {
      const trimmedTag = tag.trim();
      const normalizedTag = trimmedTag.toLocaleLowerCase();
      if (normalizedTag && !knownTags.has(normalizedTag)) {
        tagsToSave.push(trimmedTag);
        knownTags.add(normalizedTag);
      }
    });
    return tagsToSave;
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const tagSearchQuery = currentTagInput.split(',').pop()?.trim() || '';
  const knownTags = Array.from(new Set([...availableTags, ...QUICK_TAG_SUGGESTIONS]));
  const matchingTagSuggestions = knownTags
    .filter((suggestion) =>
      (!tagSearchQuery || suggestion.toLocaleLowerCase().includes(tagSearchQuery.toLocaleLowerCase())) &&
      !tags.some((tag) => tag.toLocaleLowerCase() === suggestion.toLocaleLowerCase())
    )
    .slice(0, 8);
  const hasTagSearchQuery = Boolean(tagSearchQuery);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Please provide a job title.');
      setActiveTab('basics');
      return;
    }
    if (!companyName.trim()) {
      setErrorMessage('Please provide a company name.');
      setActiveTab('basics');
      return;
    }
    if (!applicationUrl.trim()) {
      setErrorMessage('Please provide an application URL or email.');
      setActiveTab('apply');
      return;
    }

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
      salaryMin: salaryMin ? Number(salaryMin) : undefined,
      salaryMax: salaryMax ? Number(salaryMax) : undefined,
      currency,
      description: description.trim(),
      responsibilities: responsibilities.trim(),
      requirements: requirements.trim(),
      benefits: benefits.trim() || undefined,
      applicationUrl: applicationUrl.trim(),
      applicationDeadline: applicationDeadline || undefined,
      tags: getTagsToSave(),
      status,
      featured,
      createdAt: initialJob?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: status === 'published' ? (initialJob?.publishedAt || new Date().toISOString()) : undefined,
      createdBy: 'admin'
    };

    try {
      setIsSubmitting(true);
      await onSubmit(jobPayload, initialJob?.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save job listing. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isBasicsComplete = Boolean(title.trim() && companyName.trim());
  const isDetailsComplete = Boolean(description.trim() || responsibilities.trim());
  const isApplyComplete = Boolean(applicationUrl.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Clean Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <JobIcon className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {isEditing ? 'Edit Job' : 'Post New Job'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {isEditing ? 'Modify job specifications' : 'Create and publish an opportunity'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Minimal Segmented Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/20 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('basics')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'basics'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] font-bold bg-slate-200/80 dark:bg-slate-800">
              {isBasicsComplete ? <Check className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" /> : '1'}
            </span>
            <span>Role Basics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] font-bold bg-slate-200/80 dark:bg-slate-800">
              {isDetailsComplete ? <Check className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" /> : '2'}
            </span>
            <span>Job Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apply')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'apply'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] font-bold bg-slate-200/80 dark:bg-slate-800">
              {isApplyComplete ? <Check className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" /> : '3'}
            </span>
            <span>Apply & Settings</span>
          </button>
        </div>

        {/* Modal Body / Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {errorMessage && (
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200/80 px-4 py-2.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: ROLE BASICS */}
          {activeTab === 'basics' && (
            <div className="space-y-5 animate-in fade-in-50 duration-150">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Job Title <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase aria-hidden="true" className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Senior Frontend Engineer"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-950 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Company Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Labs"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-950 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Work Arrangement Segmented Pills */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Work Arrangement
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['remote', 'hybrid', 'on-site'] as WorkArrangement[]).map((wa) => (
                    <button
                      key={wa}
                      type="button"
                      onClick={() => setWorkArrangement(wa)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
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

              {/* Job Type Segmented Pills */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Job Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['full-time', 'part-time', 'contract', 'internship'] as JobType[]).map((jt) => (
                    <button
                      key={jt}
                      type="button"
                      onClick={() => setJobType(jt)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                        jobType === jt
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-500 ring-1 ring-indigo-500/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900'
                      }`}
                    >
                      {jt.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                  >
                    {categoriesToUse.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={workArrangement === 'remote' ? 'Worldwide / Anywhere' : 'City, Country'}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Experience Level
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                  >
                    <option value="entry">Entry-Level (0-2 yrs)</option>
                    <option value="mid">Mid-Level (2-5 yrs)</option>
                    <option value="senior">Senior (5+ yrs)</option>
                    <option value="lead">Lead / Staff / Director</option>
                    <option value="internship">Internship / Student</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: JOB DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Job Summary
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Concise overview of the company, mission, and what makes this position exciting..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Responsibilities
                  </label>
                  <textarea
                    rows={4}
                    value={responsibilities}
                    onChange={(e) => setResponsibilities(e.target.value)}
                    placeholder="• Design and implement scalable services&#10;• Collaborate with cross-functional teams&#10;• Review code and mentor peers"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Requirements
                  </label>
                  <textarea
                    rows={4}
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    placeholder="• 3+ years experience in React/TypeScript&#10;• Familiarity with modern cloud backends&#10;• Strong problem-solving skills"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Benefits & Perks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  placeholder="• Competitive compensation & equity&#10;• Flexible hours & remote setup stipend&#10;• Health & wellness allowances"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {/* TAB 3: APPLY & SETTINGS */}
          {activeTab === 'apply' && (
            <div className="space-y-5 animate-in fade-in-50 duration-150">
              {/* Application Link & Deadline */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Application URL / Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={applicationUrl}
                      onChange={(e) => setApplicationUrl(e.target.value)}
                      placeholder="https://company.com/jobs/apply or mailto:hr@co.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Application Deadline (Optional)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="date"
                      value={applicationDeadline}
                      onChange={(e) => setApplicationDeadline(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Compensation in single clean row */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Compensation Range (Annual)
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-24 shrink-0 rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                  >
                    {CURRENCIES.map((curr) => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-xs text-slate-400">Min</span>
                    <input
                      type="number"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
                      placeholder="e.g. 80000"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                    />
                  </div>
                  <span className="text-slate-300 dark:text-slate-700 font-bold">—</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-xs text-slate-400">Max</span>
                    <input
                      type="number"
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value)}
                      placeholder="e.g. 120000"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Tags with quick suggestions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tags & Skills
                </label>
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <TagIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={currentTagInput}
                      onChange={(e) => setCurrentTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      aria-label="Search or add skills and tags"
                      placeholder="Search saved tags or enter comma-separated tags"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-8 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddTag()}
                    className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <span>Add</span>
                  </button>
                </div>

                {hasTagSearchQuery ? (
                  <div className="flex flex-wrap gap-1.5 items-center pb-2" aria-live="polite">
                    {matchingTagSuggestions.length > 0 ? (
                      matchingTagSuggestions.map((suggested) => (
                        <button
                          key={suggested}
                          type="button"
                          onClick={() => handleAddTag(suggested)}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                        >
                          + {suggested}
                        </button>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400">No matches. Press Add or Enter to save this skill.</span>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 items-center pb-2">
                    <span className="text-[11px] text-slate-400 mr-1">Saved tags:</span>
                    {matchingTagSuggestions.slice(0, 6).map((suggested) => (
                      <button
                        key={suggested}
                        type="button"
                        onClick={() => handleAddTag(suggested)}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                      >
                        + {suggested}
                      </button>
                    ))}
                  </div>
                )}

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
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
              </div>

              {/* Status & Featured Spotlight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Publication Status
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['published', 'draft', 'archived'] as JobStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatus(st)}
                        className={`rounded-xl py-2 px-2 text-xs font-semibold capitalize border transition-all cursor-pointer ${
                          status === st
                            ? st === 'published'
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-1 ring-emerald-500/20'
                              : st === 'draft'
                              ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 ring-1 ring-amber-500/20'
                              : 'border-slate-500 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Spotlight
                  </label>
                  <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 cursor-pointer hover:bg-white dark:border-slate-800 dark:bg-slate-950/60 dark:hover:bg-slate-950 transition-colors">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 dark:bg-slate-900"
                    />
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      <Star className={`h-4 w-4 ${featured ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                      <span>Featured (Pin to top)</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Collapsible/clean URL Slug */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Custom Slug (Auto-generated from title)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="auto-generated-slug"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-mono text-slate-600 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Minimal Modal Footer with Step / Submit Navigation */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {activeTab !== 'basics' && (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'apply') setActiveTab('details');
                  else if (activeTab === 'details') setActiveTab('basics');
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <span>Back</span>
              </button>
            )}

            {activeTab !== 'apply' ? (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'basics') {
                    if (!title.trim() || !companyName.trim()) {
                      setErrorMessage('Please fill in Job Title and Company Name to continue.');
                      return;
                    }
                    setErrorMessage(null);
                    setActiveTab('details');
                  } else if (activeTab === 'details') {
                    setActiveTab('apply');
                  }
                }}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-all cursor-pointer"
              >
                <span>Next</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-[0.98] cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? 'Save Changes' : 'Post Job'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
