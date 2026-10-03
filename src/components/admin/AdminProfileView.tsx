import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  KeyRound, 
  Copy, 
  Check, 
  RefreshCw,
  Sparkles,
  BadgeCheck,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';
import { AdminSessionUser, updateAdminProfile } from '../../services/adminAuthService';
import { AdminTwoFactorSettings } from './AdminTwoFactorSettings';

export type ProfileViewSection = 'profile' | 'security' | 'two_factor';

/**
 * Generates a strictly alphanumeric ID formatted as:
 * - 4 starting alphabetical letters of the admin's name (uppercase)
 * - Followed by 4 digits/alphanumeric characters extracted from adminUser.id
 * Example: "Alex Morgan" with UUID "92f98f68..." -> "ALEX9298"
 */
export function formatAdminAlphanumericId(name?: string, rawId?: string): string {
  const letters = (name || '').replace(/[^a-zA-Z]/g, '').toUpperCase();
  const namePrefix = (letters + 'ADMN').slice(0, 4);

  const cleanRaw = (rawId || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const digitsOnly = cleanRaw.replace(/[^0-9]/g, '');

  let suffix = digitsOnly.slice(0, 4);
  if (suffix.length < 4) {
    suffix = (digitsOnly + '2026').slice(0, 4);
  }

  return `${namePrefix}${suffix}`;
}

interface AdminProfileViewProps {
  adminUser: AdminSessionUser;
  onUpdateAdminUser: (updatedUser: AdminSessionUser) => void;
  onShowToast: (message: string) => void;
  initialSection?: ProfileViewSection;
}

export const AdminProfileView: React.FC<AdminProfileViewProps> = ({
  adminUser,
  onUpdateAdminUser,
  onShowToast,
  initialSection = 'profile',
}) => {
  const [fullName, setFullName] = useState(adminUser.fullName || '');
  const [email, setEmail] = useState(adminUser.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeSection, setActiveSection] = useState<ProfileViewSection>(initialSection);
  
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Sync activeSection if initialSection prop changes
  React.useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  // Compute user name first letter for avatar
  const userInitial = React.useMemo(() => {
    const raw = (fullName || adminUser.fullName || adminUser.email || 'A').trim();
    return raw.charAt(0).toUpperCase();
  }, [fullName, adminUser.fullName, adminUser.email]);

  // Compute strictly alphanumeric ID starting with 4 letters of name
  const alphanumericId = React.useMemo(() => {
    return formatAdminAlphanumericId(fullName || adminUser.fullName, adminUser.id);
  }, [fullName, adminUser.fullName, adminUser.id]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(alphanumericId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (password && password.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (password && password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your new password.');
      return;
    }

    try {
      setSaving(true);
      const updated = await updateAdminProfile({
        fullName: cleanName,
        email: cleanEmail,
        password: password || undefined,
      });

      onUpdateAdminUser(updated);
      setPassword('');
      setConfirmPassword('');
      setSuccessMessage('Profile settings updated successfully!');
      onShowToast('Profile saved successfully');
    } catch (err: any) {
      const msg = err.message || 'Failed to update profile. Please try again.';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFullName(adminUser.fullName || '');
    setEmail(adminUser.email || '');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-[#6d28d9] backdrop-blur-md border border-white/25 text-white font-black text-2xl sm:text-3xl shadow-lg ring-4 ring-white/10 select-none">
              {userInitial}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {fullName || 'Administrator'}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                  <BadgeCheck className="h-3 w-3" />
                  {adminUser.role.toUpperCase()}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-200 mt-0.5">
                {adminUser.email}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold tracking-wider text-indigo-100 bg-indigo-950/70 px-2 py-0.5 rounded-md border border-indigo-500/30">
                  ID: {alphanumericId}
                </span>
                <button
                  onClick={handleCopyId}
                  type="button"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-200 hover:text-white transition-colors cursor-pointer"
                  title="Copy alphanumeric ID"
                >
                  {copiedId ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span>{copiedId ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 p-3 sm:text-right backdrop-blur-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block">
              Access Scope
            </span>
            <span className="text-xs font-semibold text-white">
              Full Administrative Privileges
            </span>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Section Navigation Tabs: Profile, Security, and 2FA */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveSection('profile')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'profile'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Profile Information</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('security')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'security'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>Password &amp; Credentials</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('two_factor')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'two_factor'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Two-Factor Authentication (2FA)</span>
        </button>
      </div>

      {activeSection === 'two_factor' ? (
        <AdminTwoFactorSettings
          adminUser={adminUser}
          onShowToast={onShowToast}
        />
      ) : (
        /* Profile / Security Form Card */
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          
          <div className="border-b border-slate-100 pb-5 mb-6 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {activeSection === 'profile' ? 'Personal Information & Identity' : 'Security & Access Credentials'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {activeSection === 'profile' 
                ? 'Update your administrative account display name, email address, and view your system ID.' 
                : 'Change your administrative sign-in password and manage account credentials.'}
            </p>
          </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <div className="flex-1 font-medium">{successMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* PROFILE SECTION: Full Name, Email Address, and Alphanumeric ID */}
          {activeSection === 'profile' && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 animate-in fade-in duration-200">
              
              {/* Full Name */}
              <div>
                <label 
                  htmlFor="admin_fullname"
                  className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2"
                >
                  Full Name / Display Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 dark:text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="admin_fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:bg-slate-950 transition-colors shadow-xs"
                  />
                </div>
                <p className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  This name will be displayed in audit logs and management pages.
                </p>
              </div>

              {/* Email Address */}
              <div>
                <label 
                  htmlFor="admin_email"
                  className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2"
                >
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 dark:text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="admin_email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@inaquired.app"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:bg-slate-950 transition-colors shadow-xs"
                  />
                </div>
                <p className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Used to authenticate and receive platform administration notifications.
                </p>
              </div>

              {/* Admin Alphanumeric ID */}
              <div className="sm:col-span-2">
                <label 
                  htmlFor="admin_alphanumeric_id"
                  className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2"
                >
                  Admin Alphanumeric ID
                </label>
                <div className="relative flex items-center">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="h-4 w-4 text-indigo-500" />
                  </div>
                  <input
                    id="admin_alphanumeric_id"
                    type="text"
                    readOnly
                    value={alphanumericId}
                    className="w-full rounded-xl border border-slate-300 bg-slate-100/90 py-2.5 pl-10 pr-24 text-xs font-mono font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 cursor-not-allowed select-all shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="absolute inset-y-0 right-0 flex items-center gap-1 pr-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    {copiedId ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy ID</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Strictly alphanumeric identifier starting with the first 4 letters of your name followed by 4 digits.
                </p>
              </div>
            </div>
          )}

          {/* SECURITY SECTION: Password Reset & Credentials */}
          {activeSection === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="flex items-center gap-2 mb-2">
                  <KeyRound className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Update Administrative Password
                  </h3>
                </div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-4">
                  Enter a new password (minimum 6 characters) to update your administrative credentials.
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label 
                      htmlFor="admin_new_pass"
                      className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 dark:text-slate-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        id="admin_new_pass"
                        type={showNewPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-10 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 transition-colors shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label 
                      htmlFor="admin_confirm_pass"
                      className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
                    >
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 dark:text-slate-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        id="admin_confirm_pass"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-10 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 transition-colors shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick link to 2FA inside Security section */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Two-Factor Authentication (2FA) Security
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Configure Google Authenticator, Email Code, and Backup Recovery Keys.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection('two_factor')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
                >
                  <span>Configure 2FA</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Reset Changes
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60 transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{activeSection === 'profile' ? 'Save Profile' : 'Update Password'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
      )}

      {/* Account Security Information Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Supabase Authentication Security
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Role-Based Access Control (RBAC) enforced with JWT tokens and PostgreSQL Row Level Security.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
