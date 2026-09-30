import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, Save, ExternalLink } from 'lucide-react';
import { Job, JobType, WorkArrangement, ExperienceLevel, JobStatus } from '../../types/job';
import { generateJobSlug } from '../../utils/jobUtils';

interface JobEditorModalProps {
  job: Job | null; // null for new job
  isOpen: boolean;
  onClose: () => void;
  onSave: (jobData: Omit<Job, 'id'>, id?: string) => Promise<void>;
}

export const JobEditorModal: React.FC<JobEditorModalProps> = ({
  job,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Omit<Job, 'id'>>({
    title: '',
    slug: '',
    companyName: '',
    location: '',
    jobType: 'full-time',
    workArrangement: 'remote',
    category: 'Engineering',
    experienceLevel: 'mid',
    salaryMin: undefined,
    salaryMax: undefined,
    currency: 'USD',
    description: '',
    responsibilities: '',
    requirements: '',
    benefits: '',
    applicationUrl: '',
    applicationDeadline: '',
    tags: [],
    status: 'draft',
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: undefined,
    createdBy: 'admin',
    seoTitle: '',
    seoDescription: '',
  });

  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (job) {
      setFormData({ ...job });
      setTagInput((job.tags || []).join(', '));
    } else {
      setFormData({
        title: '',
        slug: '',
        companyName: '',
        location: '',
        jobType: 'full-time',
        workArrangement: 'remote',
        category: 'Engineering',
        experienceLevel: 'mid',
        salaryMin: undefined,
        salaryMax: undefined,
        currency: 'USD',
        description: '',
        responsibilities: '',
        requirements: '',
        benefits: '',
        applicationUrl: '',
        applicationDeadline: '',
        tags: [],
        status: 'published',
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        createdBy: 'admin',
        seoTitle: '',
        seoDescription: '',
      });
      setTagInput('');
    }
    setError('');
  }, [job, isOpen]);

  if (!isOpen) return null;

  const handleTitleOrCompanyChange = (newTitle: string, newCompany: string) => {
    const shouldUpdateSlug = !job || !formData.slug;
    setFormData((prev) => ({
      ...prev,
      title: newTitle,
      companyName: newCompany,
      slug: shouldUpdateSlug ? generateJobSlug(newTitle, newCompany) : prev.slug,
      seoTitle: `${newTitle} | ${newCompany} Careers`,
    }));
  };

  const handleTagsChange = (val: string) => {
    setTagInput(val);
    const parsed = val
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    setFormData((prev) => ({ ...prev, tags: parsed }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Job title is required.');
      return;
    }
    if (!formData.companyName.trim()) {
      setError('Company name is required.');
      return;
    }
    if (!formData.location.trim()) {
      setError('Location is required.');
      return;
    }
    if (!formData.description.trim()) {
      setError('Job description is required.');
      return;
    }

    try {
      setLoading(true);
      const submissionData = {
        ...formData,
        slug: formData.slug || generateJobSlug(formData.title, formData.companyName),
        updatedAt: new Date().toISOString(),
        publishedAt: formData.status === 'published' && !formData.publishedAt ? new Date().toISOString() : formData.publishedAt,
      };

      await onSave(submissionData, job?.id);
      onClose();
    } catch (err: any) {
      console.error('Error saving job:', err);
      setError(err?.message || 'Failed to save job record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {job ? 'Edit Job Opening' : 'Create New Job Opening'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Fill in all opening specifications. Published jobs appear on public pages in real time.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Core Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Frontend Engineer"
                value={formData.title}
                onChange={(e) => handleTitleOrCompanyChange(e.target.value, formData.companyName)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company Name (Text only, no logo) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CloudScale Technologies"
                value={formData.companyName}
                onChange={(e) => handleTitleOrCompanyChange(formData.title, e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. San Francisco, CA or Remote (US)"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                URL Slug
              </label>
              <input
                type="text"
                placeholder="auto-generated-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white font-mono text-xs"
              />
            </div>
          </div>

          {/* Formats & Classification */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Work Arrangement *
              </label>
              <select
                value={formData.workArrangement}
                onChange={(e) => setFormData({ ...formData, workArrangement: e.target.value as WorkArrangement })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
              >
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="on-site">On-Site</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Job Type *
              </label>
              <select
                value={formData.jobType}
                onChange={(e) => setFormData({ ...formData, jobType: e.target.value as JobType })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
              >
                <option value="full-time">Full-time</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
                <option value="part-time">Part-time</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category *
              </label>
              <input
                type="text"
                placeholder="e.g. Engineering, Design"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Experience Level *
              </label>
              <select
                value={formData.experienceLevel}
                onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value as ExperienceLevel })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
              >
                <option value="internship">Internship</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
                <option value="lead">Lead / Principal</option>
              </select>
            </div>
          </div>

          {/* Compensation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Min Salary (Annual / Total)
              </label>
              <input
                type="number"
                placeholder="e.g. 120000"
                value={formData.salaryMin || ''}
                onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Max Salary
              </label>
              <input
                type="number"
                placeholder="e.g. 160000"
                value={formData.salaryMax || ''}
                onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Currency
              </label>
              <input
                type="text"
                placeholder="USD, EUR, GBP"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
              />
            </div>
          </div>

          {/* Description & Detailed Sections */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Job Description / Summary *
            </label>
            <textarea
              required
              rows={4}
              placeholder="High-level overview of the role and mission..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Responsibilities (bullet points or paragraphs)
            </label>
            <textarea
              rows={3}
              placeholder="• Architect microservices&#10;• Collaborate with team"
              value={formData.responsibilities}
              onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Requirements & Qualifications
            </label>
            <textarea
              rows={3}
              placeholder="• 4+ years React and TypeScript experience&#10;• Experience with serverless backends"
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Benefits & Perks
            </label>
            <textarea
              rows={2}
              placeholder="• Health, Dental, Vision&#10;• Learning stipend"
              value={formData.benefits}
              onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white font-mono text-xs"
            />
          </div>

          {/* Application URL & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Direct Application URL *
              </label>
              <input
                type="url"
                required
                placeholder="https://company.com/jobs/apply"
                value={formData.applicationUrl}
                onChange={(e) => setFormData({ ...formData, applicationUrl: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Application Deadline (Optional)
              </label>
              <input
                type="date"
                value={formData.applicationDeadline}
                onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Skills / Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="React, TypeScript, Cloud, Next.js"
              value={tagInput}
              onChange={(e) => handleTagsChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
            />
          </div>

          {/* Status & Featured Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Publication Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as JobStatus })}
                  className="rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 px-3 text-xs text-slate-900 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                >
                  <option value="published">Published (Live to candidates)</option>
                  <option value="draft">Draft (Hidden)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-4">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Featured Listing
                </span>
              </label>
            </div>
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? 'Saving...' : job ? 'Update Job' : 'Publish Job'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
