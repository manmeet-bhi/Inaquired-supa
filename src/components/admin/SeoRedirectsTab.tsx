import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Plus, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  AlertTriangle, 
  Search, 
  ExternalLink, 
  Copy, 
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  CornerDownRight
} from 'lucide-react';
import { 
  getAllRedirects, 
  createRedirect, 
  updateRedirect, 
  deleteRedirect, 
  detectRedirectLoop, 
  SeoRedirect 
} from '../../services/redirectService.ts';

interface SeoRedirectsTabProps {
  onShowToast: (message: string) => void;
}

export const SeoRedirectsTab: React.FC<SeoRedirectsTabProps> = ({ onShowToast }) => {
  const [redirects, setRedirects] = useState<SeoRedirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New redirect form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [sourcePath, setSourcePath] = useState('');
  const [destPath, setDestPath] = useState('');
  const [statusCode, setStatusCode] = useState<301 | 308>(301);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchRedirects = async () => {
    try {
      setLoading(true);
      const data = await getAllRedirects();
      setRedirects(data);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load redirects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRedirects();
  }, []);

  // Validate loop in real time as user types
  useEffect(() => {
    if (sourcePath.trim() && destPath.trim()) {
      const loopCheck = detectRedirectLoop(sourcePath, destPath, redirects);
      if (loopCheck.hasLoop) {
        setFormError(loopCheck.message || 'Circular redirect loop detected');
      } else {
        setFormError(null);
      }
    } else {
      setFormError(null);
    }
  }, [sourcePath, destPath, redirects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourcePath.trim() || !destPath.trim()) {
      setFormError('Source and destination paths are required.');
      return;
    }

    if (formError) return;

    try {
      setCreating(true);
      const cleanSource = sourcePath.trim().startsWith('/') ? sourcePath.trim() : `/${sourcePath.trim()}`;
      const cleanDest = destPath.trim();

      await createRedirect({
        source_path: cleanSource,
        destination_path: cleanDest,
        status_code: statusCode,
        is_active: true,
        notes: notes.trim()
      });

      onShowToast(`Redirect created: ${cleanSource} → ${cleanDest}`);
      setSourcePath('');
      setDestPath('');
      setNotes('');
      setShowAddForm(false);
      await fetchRedirects();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create redirect');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (redir: SeoRedirect) => {
    try {
      await updateRedirect(redir.id, { is_active: !redir.is_active });
      setRedirects(prev => prev.map(r => r.id === redir.id ? { ...r, is_active: !r.is_active } : r));
      onShowToast(`Redirect ${!redir.is_active ? 'activated' : 'deactivated'}`);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to toggle redirect');
    }
  };

  const handleDelete = async (id: string, source: string) => {
    if (!window.confirm(`Are you sure you want to delete redirect for "${source}"?`)) return;
    try {
      await deleteRedirect(id);
      setRedirects(prev => prev.filter(r => r.id !== id));
      onShowToast(`Redirect removed`);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to delete redirect');
    }
  };

  const filteredRedirects = redirects.filter(r => 
    r.source_path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.destination_path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              URL Redirects &amp; 301 Migration Engine
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/50">
              {redirects.filter(r => r.is_active).length} Active
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Manage permanent (301) and temporary redirects to protect Google PageRank, prevent 404 errors, and map legacy URLs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchRedirects}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 text-slate-600 dark:text-slate-400 transition-colors"
            title="Refresh redirects"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{showAddForm ? 'Close Form' : 'New 301 Redirect'}</span>
          </button>
        </div>
      </div>

      {/* Add New Redirect Drawer/Card */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="p-6 rounded-2xl border border-indigo-100 bg-indigo-50/30 dark:border-indigo-900/50 dark:bg-indigo-950/20 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CornerDownRight className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Create Permanent Redirect Rule</span>
            </h4>
            <span className="text-[11px] font-medium text-slate-500">
              Server-side 301 / 308 execution
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Source Path (From) *
              </label>
              <input
                type="text"
                required
                value={sourcePath}
                onChange={(e) => setSourcePath(e.target.value)}
                placeholder="/old-jobs-page or /career/listing"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-mono text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Relative path starting with /</span>
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Destination Path (To) *
              </label>
              <input
                type="text"
                required
                value={destPath}
                onChange={(e) => setDestPath(e.target.value)}
                placeholder="/jobs or https://external.com/roles"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-mono text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Internal route or full URL</span>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status Code
              </label>
              <select
                value={statusCode}
                onChange={(e) => setStatusCode(Number(e.target.value) as 301 | 308)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-2.5 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value={301}>301 Permanent</option>
                <option value={308}>308 Permanent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Internal Notes / Reason
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Migrated legacy category page to new departments path"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          {formError && (
            <div className="flex items-start gap-2 p-3 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || Boolean(formError)}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-xs disabled:opacity-50"
            >
              {creating ? 'Saving...' : 'Create Redirect'}
            </button>
          </div>
        </form>
      )}

      {/* Redirects List & Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs overflow-hidden">
        {/* Search header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search redirects by path or note..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <span className="text-xs text-slate-400">
            Showing {filteredRedirects.length} of {redirects.length} rules
          </span>
        </div>

        {/* Table or Empty State */}
        {filteredRedirects.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <CornerDownRight className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {searchQuery ? 'No matching redirects found' : 'No redirects created yet'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Add 301 redirects whenever URLs are renamed or consolidated to prevent 404 errors and retain established search engine rankings.
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add First Redirect</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredRedirects.map((redir) => (
              <div
                key={redir.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-950/40 transition-colors"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {redir.source_path}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md truncate max-w-xs sm:max-w-md">
                      {redir.destination_path}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/50">
                      HTTP {redir.status_code || 301}
                    </span>
                  </div>

                  {redir.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                      Note: {redir.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {/* Status Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(redir)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                      redir.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    }`}
                  >
                    {redir.is_active ? (
                      <>
                        <ToggleRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-4 w-4 text-slate-400" />
                        <span>Paused</span>
                      </>
                    )}
                  </button>

                  {/* Test Link */}
                  <a
                    href={redir.source_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 transition-colors"
                    title="Test redirect in browser"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(redir.id, redir.source_path)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:hover:border-rose-900 dark:hover:bg-rose-950 dark:hover:text-rose-300 text-slate-400 transition-colors cursor-pointer"
                    title="Delete redirect rule"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
