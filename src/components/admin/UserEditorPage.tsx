import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Eye, 
  EyeOff, 
  Sparkles, 
  AlertCircle, 
  Check, 
  ShieldAlert,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { AdminHeader } from './AdminHeader';
import { ManagedUser, UserRole, UserStatus, ROLE_DEFINITIONS } from '../../types/user';

interface UserEditorPageProps {
  initialUser?: ManagedUser | null;
  currentAdminEmail?: string;
  onClose: () => void;
  onSubmit: (data: {
    fullName: string;
    email: string;
    role: UserRole;
    password?: string;
    status?: UserStatus;
  }, userId?: string) => Promise<void>;
}

export const UserEditorPage: React.FC<UserEditorPageProps> = ({
  initialUser,
  currentAdminEmail,
  onClose,
  onSubmit
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
  }, [initialUser]);

  // Generate strong random password helper
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    const randomBuffer = new Uint32Array(14);
    window.crypto.getRandomValues(randomBuffer);
    let res = '';
    for (let i = 0; i < 14; i++) {
      res += chars.charAt(randomBuffer[i] % chars.length);
    }
    setPassword(res);
    setShowPassword(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const isSelf = isEditing && initialUser?.email.toLowerCase() === currentAdminEmail?.toLowerCase();

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-16">
      
      {/* Dedicated Sticky Header */}
      <AdminHeader
        title={isEditing ? `Edit User: ${initialUser?.fullName || initialUser?.email}` : 'Add New Administrator'}
        description={isEditing ? 'Update user credentials, role permissions, and platform access.' : 'Provision an administrative user account with role permissions.'}
        backButton={{
          label: 'Back to Users & Access',
          onClick: onClose,
        }}
        badge={{
          label: ROLE_DEFINITIONS[role]?.label || role,
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
                <span>{isEditing ? 'Save Changes' : 'Create User'}</span>
              )}
            </button>
          </div>
        }
      />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        
        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200/80 px-4 py-3 text-xs sm:text-sm text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Self warning */}
        {isSelf && (
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-300">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>You are editing your own active account session.</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          
          {/* LEFT 2/3: User Information & Credentials */}
          <div className="lg:col-span-2 space-y-6">
            
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  USER PROFILE &amp; CREDENTIALS
                </h2>
                <span className="text-[11px] text-slate-400 font-medium">* Required fields</span>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900 transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900 transition-all"
                  />
                </div>
                {isEditing && (
                  <p className="mt-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                    Updating the email changes the administrative credentials and login address across the platform.
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isEditing ? 'Reset Password (Optional)' : 'Initial Password *'}
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Auto-generate strong password</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm text-slate-900 font-mono focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && (
                  <p className="mt-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
                    {showPassword ? `Password preview: ${password}` : 'Password entered securely.'}
                  </p>
                )}
              </div>

              {/* Status Selection (only when editing) */}
              {isEditing && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Account Status
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 px-3.5 py-2">
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
                        Active (Can sign in)
                      </span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 px-3.5 py-2">
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
                        Suspended (Access revoked)
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </section>

          </div>

          {/* RIGHT 1/3: Role Assignment & Permissions */}
          <div className="lg:col-span-1 space-y-6">
            
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Assigned Role &amp; Access
              </h3>

              <div className="space-y-2">
                {(Object.keys(ROLE_DEFINITIONS) as UserRole[]).map((r) => {
                  const def = ROLE_DEFINITIONS[r];
                  const isSelected = role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      disabled={isSelf}
                      className={`w-full flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 dark:border-indigo-500 dark:bg-indigo-950/40 ring-1 ring-indigo-500/30'
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
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {def.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                Users inherit dashboard permissions immediately upon account creation.
              </div>
            </section>

          </div>

        </div>

      </main>
    </div>
  );
};
