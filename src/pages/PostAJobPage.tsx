import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Building,
  DollarSign,
  Link as LinkIcon,
  Tag as TagIcon,
  X
} from 'lucide-react';
import { JobIcon } from '../components/icons/JobIcon';
import { Job, JobType, WorkArrangement, ExperienceLevel } from '../types/job';
import { createJob } from '../services/jobService';

interface PostAJobPageProps {
  onNavigate: (path: string) => void;
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

export const PostAJobPage: React.FC<PostAJobPageProps> = ({ onNavigate }) => {
  // Form state
  const [formData, setFormData] = useState({
    employerName: '',
    employerEmail: '',
    companyName: '',
    companyWebsite: '',
    title: '',
    category: DEFAULT_CATEGORIES[0],
    workArrangement: 'remote' as WorkArrangement,
    jobType: 'full-time' as JobType,
    experienceLevel: 'mid' as ExperienceLevel,
    location: '',
    currency: 'USD',
    salaryMin: '',
    salaryMax: '',
    applicationUrl: '',
    applicationDeadline: '',
    description: '',
    responsibilities: '',
    requirements: '',
    benefits: '',
    honeypot: '',
  });

  const [tags, setTags] = useState<string[]>(['Remote', 'Full-Time']);
  const [currentTagInput, setCurrentTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const encodeFormData = (data: Record<string, string>) => {
    return Object.keys(data)
      .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
      .join('&');
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
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Spam honeypot trap
    if (formData.honeypot) {
      setSubmitted(true);
      return;
    }

    if (!formData.employerName.trim() || !formData.employerEmail.trim() || !formData.companyName.trim()) {
      setError('Please provide your name, work email, and company name.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.employerEmail)) {
      setError('Please provide a valid work email address.');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please provide a job title.');
      return;
    }

    if (!formData.applicationUrl.trim()) {
      setError('Please provide a direct application URL or contact email.');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please provide a job description.');
      return;
    }

    setLoading(true);

    const resolvedLocation = formData.location.trim() || (formData.workArrangement === 'remote' ? 'Remote (Worldwide)' : 'HQ');
    const generatedSlug = `${formData.title}-${formData.companyName}-${Date.now().toString().slice(-4)}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 80);

    // 1. Submit to Netlify Forms
    try {
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encodeFormData({
          'form-name': 'post-a-job',
          'bot-field': formData.honeypot,
          employer_name: formData.employerName.trim(),
          employer_email: formData.employerEmail.trim(),
          company_name: formData.companyName.trim(),
          company_website: formData.companyWebsite.trim(),
          title: formData.title.trim(),
          category: formData.category,
          work_arrangement: formData.workArrangement,
          job_type: formData.jobType,
          experience_level: formData.experienceLevel,
          location: resolvedLocation,
          salary_min: formData.salaryMin,
          salary_max: formData.salaryMax,
          currency: formData.currency,
          application_url: formData.applicationUrl.trim(),
          application_deadline: formData.applicationDeadline,
          tags: tags.join(', '),
          description: formData.description.trim(),
          responsibilities: formData.responsibilities.trim(),
          requirements: formData.requirements.trim(),
          benefits: formData.benefits.trim(),
        }),
      });
    } catch (err) {
      console.warn('Netlify form post notice:', err);
    }

    // 2. Stage into Supabase jobs table as draft for 24-hr review
    try {
      const jobPayload: Omit<Job, 'id'> = {
        title: formData.title.trim(),
        slug: generatedSlug,
        companyName: formData.companyName.trim(),
        location: resolvedLocation,
        jobType: formData.jobType,
        workArrangement: formData.workArrangement,
        category: formData.category,
        experienceLevel: formData.experienceLevel,
        salaryMin: formData.salaryMin ? Number(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax ? Number(formData.salaryMax) : undefined,
        currency: formData.currency,
        description: formData.description.trim(),
        responsibilities: formData.responsibilities.trim() || formData.description.trim(),
        requirements: formData.requirements.trim() || 'See description for details.',
        benefits: formData.benefits.trim() || undefined,
        applicationUrl: formData.applicationUrl.trim(),
        applicationDeadline: formData.applicationDeadline || undefined,
        tags,
        status: 'draft',
        featured: false,
        createdBy: `employer:${formData.employerEmail.trim()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createJob(jobPayload);
    } catch (err: any) {
      console.warn('Supabase job draft staging notice:', err?.message || err);
    }

    setLoading(false);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      
      {/* Top Header */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          For Employers
        </span>
        <h1 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Post a Job Opening
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Reach thousands of qualified candidates across remote, hybrid, and on-site positions. All listings are reviewed and added live within 24 hours.
        </p>

        {/* 24 Hours Added Guarantee Badge */}
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/60 dark:text-indigo-300">
          <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span>Guaranteed: Reviewed & Added Within 24 Hours</span>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {submitted ? (
          <div className="py-12 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Job Submitted for Review!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Thank you for submitting your job listing. Our editorial team reviews every opening and adds it live on inaquired <strong className="text-slate-900 dark:text-white">within 24 hours</strong>.
              </p>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              A review confirmation will be logged for <strong>{formData.employerEmail}</strong>.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => onNavigate('/')}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Back to Home
              </button>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    ...formData,
                    title: '',
                    description: '',
                    responsibilities: '',
                    requirements: '',
                    benefits: '',
                  });
                }}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              >
                Post Another Job
              </button>
            </div>
          </div>
        ) : (
          <form
            name="post-a-job"
            method="POST"
            data-netlify="true"
            data-netlify-honeypot="bot-field"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Hidden Netlify Form Identity */}
            <input type="hidden" name="form-name" value="post-a-job" />

            {/* Anti-bot Honeypot Input */}
            <p className="hidden" style={{ display: 'none' }}>
              <label>
                Don’t fill this out if you're human:
                <input
                  name="bot-field"
                  tabIndex={-1}
                  value={formData.honeypot}
                  onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                />
              </label>
            </p>

            {error && (
              <div className="rounded-lg bg-rose-50 p-3.5 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Employer Information */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Employer & Company Details</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    name="employer_name"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={formData.employerName}
                    onChange={(e) => setFormData({ ...formData, employerName: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    name="employer_email"
                    required
                    placeholder="alex@company.com"
                    value={formData.employerEmail}
                    onChange={(e) => setFormData({ ...formData, employerEmail: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    required
                    placeholder="e.g. Acme Tech"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company Website / Careers Link
                  </label>
                  <input
                    type="url"
                    name="company_website"
                    placeholder="https://company.com"
                    value={formData.companyWebsite}
                    onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* 2. Job Basics */}
            <div className="space-y-4 pt-2">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <JobIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Job Role Basics</span>
                </h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Senior Frontend Engineer"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                  >
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Work Arrangement
                  </label>
                  <select
                    name="work_arrangement"
                    value={formData.workArrangement}
                    onChange={(e) => setFormData({ ...formData, workArrangement: e.target.value as WorkArrangement })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                  >
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="on-site">On-Site</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Job Type
                  </label>
                  <select
                    name="job_type"
                    value={formData.jobType}
                    onChange={(e) => setFormData({ ...formData, jobType: e.target.value as JobType })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                  >
                    <option value="full-time">Full-Time</option>
                    <option value="part-time">Part-Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Experience Level
                  </label>
                  <select
                    name="experience_level"
                    value={formData.experienceLevel}
                    onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value as ExperienceLevel })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                  >
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead / Principal</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Location / Timezone
                  </label>
                  <input
                    type="text"
                    name="location"
                    placeholder="e.g. Remote (Worldwide) or New York, NY"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* 3. Description & Responsibilities */}
            <div className="space-y-4 pt-2">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Role Description & Scope
                </h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Job Description *
                </label>
                <textarea
                  name="description"
                  required
                  rows={5}
                  placeholder="Summarize the role and what the candidate will be doing..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Responsibilities
                </label>
                <textarea
                  name="responsibilities"
                  rows={5}
                  placeholder="• Build and deliver key features&#10;• Collaborate with team"
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:placeholder:text-slate-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Requirements
                </label>
                <textarea
                  name="requirements"
                  rows={5}
                  placeholder="• 3+ years experience with React/TypeScript&#10;• Strong communication skills"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:placeholder:text-slate-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Benefits & Perks (Optional)
                </label>
                <textarea
                  name="benefits"
                  rows={2}
                  placeholder="• Competitive compensation, healthcare, flexible vacation"
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white font-mono text-xs"
                />
              </div>
            </div>

            {/* 4. Compensation & Application */}
            <div className="space-y-4 pt-2">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Compensation & Application</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Currency
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Salary Min (Annual)
                  </label>
                  <input
                    type="number"
                    name="salary_min"
                    placeholder="e.g. 90000"
                    value={formData.salaryMin}
                    onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Salary Max (Annual)
                  </label>
                  <input
                    type="number"
                    name="salary_max"
                    placeholder="e.g. 140000"
                    value={formData.salaryMax}
                    onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Direct Application URL / Email *
                  </label>
                  <div className="relative">
                    <LinkIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      name="application_url"
                      required
                      placeholder="https://jobs.lever.co/... or apply@acme.com"
                      value={formData.applicationUrl}
                      onChange={(e) => setFormData({ ...formData, applicationUrl: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Application Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    name="application_deadline"
                    value={formData.applicationDeadline}
                    onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                  />
                </div>
              </div>

              {/* Tags / Skills */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tags & Skills
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <TagIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Type tag and press Enter (e.g. Next.js, Python)"
                      value={currentTagInput}
                      onChange={(e) => setCurrentTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddTag()}
                    className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    Add
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400">Suggestions:</span>
                  {QUICK_TAG_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleAddTag(sug)}
                      className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-900 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ⚡ Reviewed and added within 24 hours.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs sm:text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
              >
                {loading ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Post Job (Live in &lt;24h)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

    </div>
  );
};
