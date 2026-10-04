import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Layers, 
  Link as LinkIcon, 
  AlignLeft, 
  AlertCircle,
  FolderTree,
  ExternalLink
} from 'lucide-react';
import { AdminHeader } from './AdminHeader';
import { Category } from '../../services/categoryService';

interface CategoryEditorPageProps {
  initialCategory?: Category | null;
  onClose: () => void;
  onSubmit: (data: { name: string; slug: string; description?: string }, id?: string) => Promise<void>;
}

export const CategoryEditorPage: React.FC<CategoryEditorPageProps> = ({
  initialCategory,
  onClose,
  onSubmit
}) => {
  const isEditing = Boolean(initialCategory);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialCategory) {
      setName(initialCategory.name || '');
      setSlug(initialCategory.slug || '');
      setDescription(initialCategory.description || '');
    } else {
      setName('');
      setSlug('');
      setDescription('');
    }
    setErrorMessage(null);
  }, [initialCategory]);

  // Auto-generate URL slug when name changes (only when creating)
  useEffect(() => {
    if (!isEditing && name) {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 60);
      setSlug(generated);
    }
  }, [name, isEditing]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please provide a department name.');
      return;
    }

    const cleanSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    try {
      setSubmitting(true);
      await onSubmit(
        {
          name: name.trim(),
          slug: cleanSlug,
          description: description.trim() || undefined,
        },
        initialCategory?.id
      );
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save department. Please check slug uniqueness.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-16">
      
      {/* Dedicated Sticky Header */}
      <AdminHeader
        title={isEditing ? `Edit: ${initialCategory?.name || 'Department'}` : 'Add New Department'}
        description={isEditing ? 'Update department name, description, and candidate URL slug.' : 'Create a new job classification for candidate browsing.'}
        backButton={{
          label: 'Back to Departments',
          onClick: onClose,
        }}
        badge={{
          label: 'Department',
          variant: 'info',
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
              onClick={() => handleSubmit()}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 sm:px-5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-[0.98] cursor-pointer"
            >
              {submitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? 'Save Changes' : 'Create Department'}</span>
              )}
            </button>
          </div>
        }
      />

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        
        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200/80 px-4 py-3 text-xs sm:text-sm text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* Main Form Fields */}
          <div className="md:col-span-2 space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  DEPARTMENT DETAILS
                </h2>
                <span className="text-[11px] text-slate-400 font-medium">* Required fields</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Department Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Layers className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  URL Slug <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900 transition-all"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  Target candidate filtering URL: <span className="font-mono text-indigo-600 dark:text-indigo-400">/category/{slug || 'department-slug'}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900 leading-relaxed transition-all"
                />
              </div>
            </section>
          </div>

          {/* Right Information & Preview Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Live URL Preview
              </h3>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-950/40 text-xs space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Candidate Filter Path</span>
                <div className="font-mono text-xs text-indigo-600 dark:text-indigo-400 break-all bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                  /category/{slug || '...'}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">Organization Tip</span>
                <p>
                  Departments group related job postings on candidate browse pages and feed SEO category landing pages automatically.
                </p>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};
