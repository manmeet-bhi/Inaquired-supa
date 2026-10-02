import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  Database,
  KeyRound
} from 'lucide-react';
import { signInAdmin, AdminSessionUser } from '../../services/adminAuthService';

interface AdminLoginPageProps {
  onLoginSuccess: (user: AdminSessionUser) => void;
  onNavigate: (path: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ 
  onLoginSuccess, 
  onNavigate 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your administrator email and password.');
      return;
    }

    try {
      setLoading(true);
      const user = await signInAdmin(email, password);
      onLoginSuccess(user);
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Please verify credentials.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Background Accent Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl dark:bg-indigo-500/15" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl dark:bg-emerald-500/10" />
      </div>

      <div className="relative w-full max-w-md">
        
        {/* Top Bar Link */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Candidate Portal</span>
          </button>

          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
            <Database className="h-3 w-3" />
            <span>Supabase Auth</span>
          </div>
        </div>

        {/* Card Container */}
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center space-y-2.5">
            <img 
              src="/logo/logo.svg" 
              alt="inaquired" 
              className="site-logo h-8 w-auto object-contain" 
            />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Admin Console
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Sign in with your Supabase administrator credentials
              </p>
            </div>
          </div>

          {/* Alert Message */}
          {errorMessage && (
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-400 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            
            {/* Default credentials helper card */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 dark:border-indigo-900/40 dark:bg-indigo-950/40 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <p className="font-semibold text-indigo-900 dark:text-indigo-200">Default Credentials</p>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-mono">admin@inaquired.app</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@inaquired.app');
                  setPassword('AdminPassword123!');
                  setErrorMessage(null);
                }}
                className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-500 shadow-sm transition-colors"
              >
                Auto-fill
              </button>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@inaquired.app"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('/admin/forgot-password')}
                  className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 disabled:opacity-50 transition-all hover:scale-[1.01]"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Authenticating with Supabase...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Sign In to Admin Console</span>
                </>
              )}
            </button>

            {/* Account Recovery Helper Link */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => onNavigate('/admin/forgot-password')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors font-medium"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Forgot password? Recover account via Resend</span>
              </button>
            </div>
          </form>
        </div>

        {/* Security Footer Note */}
        <p className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
          <span>Secured with Supabase PostgreSQL Row Level Security</span>
        </p>
      </div>
    </div>
  );
};
