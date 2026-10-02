import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  UserCheck, 
  Mail, 
  User, 
  Lock, 
  Shield, 
  Eye, 
  EyeOff, 
  Sparkles, 
  AlertCircle, 
  Check,
  ShieldAlert
} from 'lucide-react';
import { ManagedUser, UserRole, UserStatus, ROLE_DEFINITIONS } from '../../types/user';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    fullName: string;
    email: string;
    role: UserRole;
    password?: string;
    status?: UserStatus;
  }, userId?: string) => Promise<void>;
  initialUser?: ManagedUser | null;
  currentAdminEmail?: string;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialUser,
  currentAdminEmail
}) => {
  const isEditing = Boolean(initialUser);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [status, setStatus] = useState<UserStatus>('active');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialUser) {
      setFullName(initialUser.fullName || '');
      setEmail(initialUser.email || '');
      setRole(initialUser.role || 'admin');
      setStatus(initialUser.status || 'active');
      setPassword('');
    } else {
      setFullName('');
      setEmail('');
      setRole('admin');
      setStatus('active');
      setPassword('');
    }
    setShowPassword(false);
    setErrorMessage(null);
  }, [initialUser, isOpen]);

  // Generate strong random password helper
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let res = '';
    for (let i = 0; i < 14; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!isEditing && (!password || password.length < 6)) {
      setErrorMessage('A temporary password of at least 6 characters is required for new users.');
      return;
    }

    if (isEditing && password && password.length < 6) {
      setErrorMessage('Password must be at least 6 characters if you wish to reset it.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(
        {
          fullName: cleanName,
          email: cleanEmail,
          role,
          status: isEditing ? status : 'active',
          password: password.trim() ? password.trim() : undefined
        },
        initialUser?.id
      );
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save user. Please verify details.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isSelf = isEditing && initialUser?.email.toLowerCase() === currentAdminEmail?.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              {isEditing ? <UserCheck className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isEditing ? 'Edit User & Permissions' : 'Add New Administrator'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing 
                  ? 'Update roles, status, or reset credentials' 
                  : 'Grant dashboard access with email & password'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Self warning */}
        {isSelf && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-300">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>You are editing your own active account session.</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                disabled={isEditing}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className={`w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:text-slate-100 ${
                  isEditing ? 'bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed opacity-80' : 'bg-white dark:bg-slate-950'
                }`}
              />
            </div>
            {isEditing && (
              <p className="mt-1 text-[11px] text-slate-400">
                Primary email address cannot be modified once provisioned in Supabase Auth.
              </p>
            )}
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Assigned Role & Privileges *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(ROLE_DEFINITIONS) as UserRole[]).map((r) => {
                const def = ROLE_DEFINITIONS[r];
                const isSelected = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 dark:border-indigo-500 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-indigo-500" />
                        {def.label}
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {def.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isEditing ? 'Reset Password (Leave blank to keep unchanged)' : 'Initial Password *'}
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                <Sparkles className="h-3 w-3" />
                <span>Auto-generate</span>
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditing ? '••••••••••••' : 'Enter temporary password (min 6 chars)'}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password && (
              <p className="mt-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
                {showPassword ? `Password preview: ${password}` : 'Password entered.'}
              </p>
            )}
          </div>

          {/* Status Selection (only when editing) */}
          {isEditing && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Account Status
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={status === 'active'}
                    onChange={() => setStatus('active')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Active (Allowed to sign in)
                  </span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="suspended"
                    checked={status === 'suspended'}
                    onChange={() => setStatus('suspended')}
                    disabled={isSelf}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Suspended (Revoke access)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 disabled:opacity-50 transition-all"
            >
              {submitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>{isEditing ? 'Save Changes' : 'Create User'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
