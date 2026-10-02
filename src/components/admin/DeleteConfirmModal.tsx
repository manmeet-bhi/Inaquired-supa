import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Job } from '../../types/job';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  job: Job | null;
  onClose: () => void;
  onConfirm: (jobId: string) => Promise<void>;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  job,
  onClose,
  onConfirm,
  isDeleting
}) => {
  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Delete Job Listing?
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-slate-200">"{job.title}"</span> at <span className="font-semibold text-slate-900 dark:text-slate-200">{job.companyName}</span>?
            </p>
            <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
              This action will remove the listing from Supabase and immediately hide it from candidates.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(job.id)}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-600/20 hover:bg-rose-500 disabled:opacity-50 transition-all"
          >
            {isDeleting ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Delete Role</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
