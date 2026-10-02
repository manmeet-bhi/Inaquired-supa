import React from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';
import { ManagedUser, ROLE_DEFINITIONS } from '../../types/user';

interface DeleteUserModalProps {
  isOpen: boolean;
  user: ManagedUser | null;
  onClose: () => void;
  onConfirm: (userId: string) => Promise<void>;
  isDeleting: boolean;
  currentAdminEmail?: string;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onConfirm,
  isDeleting,
  currentAdminEmail
}) => {
  if (!isOpen || !user) return null;

  const isSelf = user.email.toLowerCase() === currentAdminEmail?.toLowerCase();
  const roleInfo = ROLE_DEFINITIONS[user.role] || { label: user.role };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Delete User Account
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            This action will permanently delete this administrator from Supabase Auth and revoke all dashboard access.
          </p>
        </div>

        {/* User preview card */}
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user.fullName || 'Unnamed Administrator'}
              </p>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                {user.email}
              </p>
            </div>
            <span className="shrink-0 rounded-lg bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              {roleInfo.label}
            </span>
          </div>
        </div>

        {isSelf && (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 dark:bg-rose-950/50 dark:border-rose-900/60 dark:text-rose-300">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              <strong>Cannot delete active account:</strong> You are currently signed in as this user. To remove this account, sign in from another administrator account first.
            </span>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
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
            disabled={isDeleting || isSelf}
            onClick={() => onConfirm(user.id)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-600/25 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isDeleting ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Delete Account</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
