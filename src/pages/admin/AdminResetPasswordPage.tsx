import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { verifyRecoveryToken, resetAdminPassword } from '../../services/accountRecoveryService';

interface AdminResetPasswordPageProps {
  onNavigate: (path: string) => void;
}

export const AdminResetPasswordPage: React.FC<AdminResetPasswordPageProps> = ({ 
  onNavigate 
}) => {
  // Query parameters
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || '';
    }
    return '';
  });

  const [email, setEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('email') || '';
    }
    return '';
  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [verifyingToken, setVerifyingToken] = useState(false);
  const [tokenVerified, setTokenVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Verify token automatically if pre-filled in URL
  useEffect(() => {
    if (token && token.trim().length >= 6) {
      handleVerify(token.trim(), email.trim());
    }
  }, []);

  const handleVerify = async (codeToVerify: string, emailToVerify: string) => {
    try {
      setVerifyingToken(true);
      setErrorMessage(null);
      const res = await verifyRecoveryToken(codeToVerify, emailToVerify || undefined);
      if (res.valid) {
        setTokenVerified(true);
        if (res.email && !email) {
          setEmail(res.email);
        }
      } else {
        setTokenVerified(false);
        setErrorMessage(res.error || 'The recovery link or code is invalid or has expired.');
      }
    } catch (err: any) {
      setTokenVerified(false);
      setErrorMessage(err.message || 'Verification failed. Please check the code.');
    } finally {
      setVerifyingToken(false);
    }
  };

  // Password strength calculations
  const passwordCriteria = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    symbol: /[^A-Za-z0-9]/.test(newPassword)
  };

  const strengthScore = Object.values(passwordCriteria).filter(Boolean).length;

  const strengthLabel = 
    strengthScore <= 1 ? 'Very Weak' :
    strengthScore === 2 ? 'Weak' :
    strengthScore === 3 ? 'Medium' :
    strengthScore === 4 ? 'Strong' : 'Very Strong';

  const strengthColor =
    strengthScore <= 1 ? 'bg-rose-500' :
    strengthScore === 2 ? 'bg-amber-500' :
    strengthScore === 3 ? 'bg-yellow-500' :
    strengthScore === 4 ? 'bg-emerald-500' : 'bg-emerald-600';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanToken = token.trim();
    if (!cleanToken) {
      setErrorMessage('Please enter your 6-digit recovery code or link token.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters in length.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }

    try {
      setLoading(true);
      await resetAdminPassword(cleanToken, newPassword, email.trim() || undefined);
      setResetSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password. Your recovery link may have expired.');
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
        
        {/* Top Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => onNavigate('/admin')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Login</span>
          </button>

          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
            <Sparkles className="h-3 w-3" />
            <span>Secure Password Reset</span>
          </div>
        </div>

        {/* Card Container */}
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-2.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 shadow-inner">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Set New Password
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {email ? `Account: ${email}` : 'Enter your recovery code and choose a secure password'}
              </p>
            </div>
          </div>

          {/* Success State */}
          {resetSuccess ? (
            <div className="mt-6 space-y-5 animate-in fade-in zoom-in-95">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-center dark:border-emerald-900/50 dark:bg-emerald-950/50">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  Password Updated!
                </h3>
                <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                  Your administrator password has been updated securely. You can now access your console.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('/admin')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all hover:scale-[1.01]"
              >
                <span>Sign In to Admin Console</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            /* Reset Form */
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              
              {/* Alert Error */}
              {errorMessage && (
                <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-400 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span>{errorMessage}</span>
                    <div>
                      <button
                        type="button"
                        onClick={() => onNavigate('/admin/forgot-password')}
                        className="font-semibold underline hover:text-rose-900 dark:hover:text-rose-200"
                      >
                        Request a new recovery link
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Recovery Code / Token Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    6-Digit Code or Reset Token
                  </label>
                  {tokenVerified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => {
                      setToken(e.target.value);
                      setTokenVerified(false);
                      setErrorMessage(null);
                    }}
                    onBlur={() => {
                      if (token.trim().length >= 6 && !tokenVerified) {
                        handleVerify(token.trim(), email.trim());
                      }
                    }}
                    placeholder="e.g. 849201 or token string"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-20 text-sm font-mono text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                  {verifyingToken ? (
                    <span className="absolute right-3 top-3 text-[11px] text-slate-400">
                      Verifying...
                    </span>
                  ) : !tokenVerified && token.trim().length >= 6 ? (
                    <button
                      type="button"
                      onClick={() => handleVerify(token.trim(), email.trim())}
                      className="absolute right-2 top-2 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    >
                      Verify
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Optional Email Confirmation if not present */}
              {!email && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Account Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@inaquired.app"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              )}

              {/* New Password Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
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

                {/* Password Strength Meter */}
                {newPassword.length > 0 && (
                  <div className="mt-2 space-y-1.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400">Password Strength:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{strengthLabel}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            level <= strengthScore ? strengthColor : 'bg-slate-200 dark:bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Reset Password & Update Credentials</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/admin/forgot-password')}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
                >
                  Need a new code? Resend email
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Security Note */}
        <p className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 text-indigo-500" />
          <span>Single-use token automatically invalidated upon successful reset</span>
        </p>

      </div>
    </div>
  );
};
