import React, { useState } from 'react';
import { 
  Mail, 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  KeyRound, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { requestPasswordReset, ForgotPasswordResponse } from '../../services/accountRecoveryService';

interface AdminForgotPasswordPageProps {
  onNavigate: (path: string) => void;
}

export const AdminForgotPasswordPage: React.FC<AdminForgotPasswordPageProps> = ({ 
  onNavigate 
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<ForgotPasswordResponse | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid administrator email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await requestPasswordReset(cleanEmail);
      setSuccessInfo(res);
      startCooldown();
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to process recovery request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setErrorMessage(null);
    try {
      setLoading(true);
      const res = await requestPasswordReset(email);
      setSuccessInfo(res);
      startCooldown();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend recovery email.');
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
            onClick={() => onNavigate('/admin')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Sign In</span>
          </button>

          <div className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200/50 dark:border-indigo-800/50">
            <Sparkles className="h-3 w-3" />
            <span>Resend Email System</span>
          </div>
        </div>

        {/* Card Container */}
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center space-y-2.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 shadow-inner">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Account Recovery
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                {successInfo 
                  ? 'If an administrator account matches that address, recovery instructions are on the way.'
                  : 'Enter your administrator email to receive a password reset link and verification code.'}
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-400 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success / Sent State */}
          {successInfo ? (
            <div className="mt-6 space-y-5 animate-in fade-in slide-in-from-bottom-2">
              <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/40">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                      Check Your Inbox
                    </p>
                    <p className="text-emerald-700 dark:text-emerald-300">
                      If an administrator account matches this address, recovery instructions will be sent to:
                    </p>
                    <p className="font-mono font-medium text-emerald-800 dark:text-emerald-200 bg-white/70 dark:bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/50 inline-block">
                      {email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate(`/admin/reset-password?email=${encodeURIComponent(email)}`)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all hover:scale-[1.01]"
                >
                  <KeyRound className="h-4 w-4" />
                  <span>Enter 6-Digit Code / Reset Password</span>
                </button>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || loading}
                    onClick={handleResend}
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50 disabled:no-underline font-medium"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>
                      {resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : 'Resend recovery email'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSuccessInfo(null);
                      setErrorMessage(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    Try different email
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Email Input Form */
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              
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
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
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
                    <span>Sending Recovery Email via Resend...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Send Password Recovery Email</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/admin')}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
                >
                  Remembered your password? Return to login
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Security Footer Note */}
        <p className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
          <span>Encrypted cryptographic tokens via Resend & Supabase Auth</span>
        </p>

      </div>
    </div>
  );
};
