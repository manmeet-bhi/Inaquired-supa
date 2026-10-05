import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw
} from 'lucide-react';
import {
  checkRecoveryHealth,
  requestPasswordReset,
  ForgotPasswordResponse,
  RecoverySystemHealth
} from '../../services/accountRecoveryService';
import { AdminAuthLayout } from '../../components/admin/AdminAuthLayout';

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
  const [recoveryHealth, setRecoveryHealth] = useState<RecoverySystemHealth | null>(null);

  useEffect(() => {
    let mounted = true;
    checkRecoveryHealth().then((health) => {
      if (mounted) setRecoveryHealth(health);
    });
    return () => {
      mounted = false;
    };
  }, []);

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
    <AdminAuthLayout
      heading={successInfo ? 'Check your inbox' : 'Find your account'}
      description={successInfo
        ? 'If an administrator account matches, we sent a recovery code. Use it to reset your password.'
        : 'Enter your Inaquired administrator email address to receive a password recovery code.'}
    >
      <div className="w-full">
        
        {/* Top Bar Link */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => onNavigate('/admin')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Sign In</span>
          </button>

        </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 animate-in fade-in dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {recoveryHealth && (!recoveryHealth.resendConfigured || !recoveryHealth.databaseConfigured) && (
            <div role="status" className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Password recovery is not fully configured. Please contact your system administrator.
              </span>
            </div>
          )}

          {/* Success / Sent State */}
          {successInfo ? (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                      Check Your Inbox
                    </p>
                    <p className="text-emerald-700 dark:text-emerald-300">
                      If an account matches the submitted address, a recovery code was sent. Check your inbox.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/admin/reset-password')}
                  className="ml-auto inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-[0.98]"
                >
                  <span>Enter recovery code</span>
                </button>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || loading}
                    onClick={handleResend}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-700 hover:underline disabled:opacity-50 disabled:no-underline dark:text-indigo-300"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSuccessInfo(null);
                      setErrorMessage(null);
                    }}
                    className="text-sm text-slate-300 hover:text-white"
                  >
                    Try different email
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Email Input Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Email Field */}
              <div>
                <label className="sr-only">
                  Administrator Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    aria-label="Administrator email"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="ml-auto inline-flex min-w-44 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Sending code...</span>
                  </>
                ) : (
                  <>
                    <span>Send recovery code</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/admin')}
                  className="text-sm text-slate-300 hover:text-white font-medium"
                >
                  Remembered your password? Return to login
                </button>
              </div>
            </form>
          )}

      </div>
    </AdminAuthLayout>
  );
};
