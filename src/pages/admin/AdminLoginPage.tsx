import React, { useState } from 'react';
import { 
  Shield, 
  KeyRound, 
  Mail, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Smartphone,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLoginPageProps {
  onSuccess: () => void;
  onNavigateHome: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSuccess, onNavigateHome }) => {
  const { 
    currentUser, 
    isAdmin, 
    isMfaVerified, 
    mfaRequired, 
    loginWithGoogle, 
    loginWithEmail, 
    sendPasswordReset, 
    verifyMfa, 
    verifyBackupCode,
    logout 
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackupMode, setUseBackupMode] = useState(false);
  
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle standard email/pass login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      // Auth listener handles admin check & MFA state
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Invalid administrator credentials. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Login popup
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err?.message || 'Google authentication was cancelled or could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle 2FA verification step
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (useBackupMode) {
        const success = await verifyBackupCode(backupCode);
        if (success) {
          onSuccess();
        } else {
          setError('Invalid emergency backup code. Please check and try again.');
        }
      } else {
        const success = await verifyMfa(totpToken);
        if (success) {
          onSuccess();
        } else {
          setError('Invalid 6-digit TOTP verification code. Ensure your device clock is synchronized.');
        }
      }
    } catch (err: any) {
      console.error('2FA error:', err);
      setError('An error occurred during second-factor verification.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Reset
  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPasswordReset(resetEmail);
      setResetSent(true);
    } catch (err: any) {
      console.error('Reset error:', err);
      setError(err?.message || 'Could not send recovery email. Verify the email address.');
    } finally {
      setLoading(false);
    }
  };

  // If already logged in and verified
  if (currentUser && isAdmin && isMfaVerified) {
    onSuccess();
    return null;
  }

  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md dark:bg-indigo-500 mb-4">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Staff CMS Portal
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Secure administrative control panel for inaquired
          </p>
        </div>

        {/* Notice for Public Visitors */}
        <div className="mt-4 rounded-lg bg-indigo-50/70 p-3 text-center text-xs text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
          <span>Candidate portal does not require login. </span>
          <button 
            onClick={onNavigateHome}
            className="underline font-semibold hover:text-indigo-900 dark:hover:text-indigo-200"
          >
            Browse public jobs here
          </button>
        </div>

        {/* Card Container */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STATE 1: Authenticated but requires 2FA TOTP */}
          {currentUser && isAdmin && mfaRequired && !isMfaVerified ? (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-300">
                  <Smartphone className="h-5 w-5" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Two-Factor Authentication
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {useBackupMode 
                    ? 'Enter one of your 8-character backup recovery codes' 
                    : 'Enter the 6-digit code from your Authenticator app'}
                </p>
              </div>

              <form onSubmit={handleVerify2FA} className="space-y-4">
                {useBackupMode ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Backup Recovery Code
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ABCD-1234"
                      value={backupCode}
                      onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                      className="w-full text-center font-mono tracking-widest uppercase rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      6-Digit Security Token
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      placeholder="000 000"
                      value={totpToken}
                      onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center font-mono text-xl tracking-widest rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
                >
                  <KeyRound className="h-4 w-4" />
                  <span>{loading ? 'Verifying...' : 'Verify & Access CMS'}</span>
                </button>
              </form>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setUseBackupMode(!useBackupMode);
                    setError('');
                  }}
                  className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
                >
                  {useBackupMode ? 'Use Authenticator App' : 'Use a Backup Code'}
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="text-slate-500 hover:text-rose-600 dark:text-slate-400"
                >
                  Log Out
                </button>
              </div>
            </div>
          ) : currentUser && !isAdmin ? (
            /* STATE 2: Logged in with unauthorized user email */
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/40">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Access Restricted
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                The account <strong className="text-slate-800 dark:text-slate-200">{currentUser.email}</strong> is not configured as an administrator.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={logout}
                  className="rounded-lg bg-slate-100 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                >
                  Switch Account
                </button>
                <button
                  onClick={onNavigateHome}
                  className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Return to Public Job Portal
                </button>
              </div>
            </div>
          ) : (
            /* STATE 3: Standard Login Prompt */
            <div className="space-y-5">
              
              {/* Google Fast Auth */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80 transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                <span className="bg-white px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:bg-slate-900">
                  Or admin email
                </span>
              </div>

              {/* Email & Password Form */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Admin Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="admin@inaquired.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
                >
                  <Shield className="h-4 w-4" />
                  <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
                </button>
              </form>

              {/* Bootstrap Info Box */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 dark:border-indigo-950 dark:bg-indigo-950/30 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <span className="font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                  Designated Administrator
                </span>
                <p>
                  System administrator email: <code className="font-mono text-indigo-700 dark:text-indigo-300">manmeet.msh@gmail.com</code>. Signing in with this Google account automatically grants superadmin privileges.
                </p>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Reset Administrator Password
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your registered administrator email address to receive a secure Firebase recovery link.
            </p>

            {resetSent ? (
              <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 space-y-2">
                <p className="font-semibold">Recovery link dispatched!</p>
                <p>Check your inbox for password reset instructions.</p>
                <button
                  onClick={() => {
                    setShowForgotModal(false);
                    setResetSent(false);
                  }}
                  className="w-full mt-2 rounded bg-indigo-600 py-1.5 text-xs text-white"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendReset} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="admin@inaquired.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-xs sm:text-sm text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="rounded-lg px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Recovery Email'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
