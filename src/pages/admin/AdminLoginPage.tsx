import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, 
  Lock,
  ArrowLeft, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  KeyRound,
  Smartphone,
  RefreshCw,
  CheckCircle2,
  ChevronLeft,
  FileText,
  Clock,
} from 'lucide-react';
import { signInAdmin, AdminSessionUser } from '../../services/adminAuthService';
import { 
  get2FaStatus, 
  sendEmail2FaCode, 
  verifyLogin2Fa, 
  TwoFactorStatus 
} from '../../services/twoFactorService';
import { TwoFactorOtpInput } from '../../components/admin/TwoFactorOtpInput';
import { AdminAuthLayout } from '../../components/admin/AdminAuthLayout';

interface AdminLoginPageProps {
  onLoginSuccess: (user: AdminSessionUser) => void;
  onNavigate: (path: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ 
  onLoginSuccess, 
  onNavigate 
}) => {
  // Sign-in proceeds from account identification to password, then optional 2FA.
  const [step, setStep] = useState<'email' | 'password' | '2fa'>('email');

  // Credentials form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 2FA Verification state
  const [pendingUser, setPendingUser] = useState<AdminSessionUser | null>(null);
  const [twoFaStatus, setTwoFaStatus] = useState<TwoFactorStatus | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<'totp' | 'email' | 'backup'>('totp');
  const [twoFaCode, setTwoFaCode] = useState('');
  const [verifying2Fa, setVerifying2Fa] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);

  const codeInputRef = useRef<HTMLInputElement>(null);

  // Focus code input whenever entering 2FA step or changing method
  useEffect(() => {
    if (step === '2fa') {
      setTimeout(() => {
        codeInputRef.current?.focus();
      }, 100);
    }
  }, [step, verificationMethod]);

  // Handle email cooldown timer
  useEffect(() => {
    if (emailCooldown <= 0) return;
    const interval = setInterval(() => {
      setEmailCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [emailCooldown]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Enter a valid email address to continue.');
      return;
    }
    setEmail(cleanEmail);
    setStep('password');
  };

  // Authenticate with the email entered in the previous step.
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMessage('Enter your password to continue.');
      return;
    }

    try {
      setLoading(true);
      const user = await signInAdmin(cleanEmail, password);

      // Check if user has 2FA enabled
      const status = await get2FaStatus(cleanEmail);

      if (status && status.twoFactorEnabled) {
        sessionStorage.setItem('2fa_pending_email', cleanEmail);
        sessionStorage.removeItem('2fa_verified_email');
        setPendingUser(user);
        setTwoFaStatus(status);
        setStep('2fa');
        setTwoFaCode('');
        setErrorMessage(null);

        // Pick initial 2FA verification method
        if (status.totpEnabled) {
          setVerificationMethod('totp');
        } else if (status.email2faEnabled) {
          setVerificationMethod('email');
          // Dispatch email code automatically
          handleDispatchEmailCode(cleanEmail);
        } else {
          setVerificationMethod('backup');
        }
        return;
      }

      // No 2FA required: complete login immediately
      sessionStorage.setItem('2fa_verified_email', cleanEmail);
      sessionStorage.removeItem('2fa_pending_email');
      onLoginSuccess(user);
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Please verify credentials.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Dispatch Email Code
  const handleDispatchEmailCode = async (targetEmail?: string) => {
    const to = targetEmail || pendingUser?.email || email;
    if (!to || emailCooldown > 0) return;

    try {
      setEmailSending(true);
      setErrorMessage(null);
      const res = await sendEmail2FaCode(to);
      if (res.success) {
        setEmailCooldown(60);
      } else {
        setErrorMessage(res.error || 'Failed to dispatch email verification code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error requesting email verification code.');
    } finally {
      setEmailSending(false);
    }
  };

  // Step 2: Submit 2FA Code
  const handle2FaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = twoFaCode.trim();
    if (!cleanCode) {
      setErrorMessage('Please enter your verification code.');
      return;
    }

    if (!pendingUser) {
      setErrorMessage('Session expired. Please sign in again.');
      setStep('email');
      return;
    }

    try {
      setVerifying2Fa(true);
      const res = await verifyLogin2Fa(pendingUser.email, verificationMethod, cleanCode);

      if (res.success) {
        // Successful 2FA verification! Complete login and record verified session
        sessionStorage.setItem('2fa_verified_email', pendingUser.email.toLowerCase());
        sessionStorage.removeItem('2fa_pending_email');
        onLoginSuccess(pendingUser);
      } else {
        setErrorMessage(res.error || 'Invalid verification code. Please check and try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error verifying 2FA code. Please try again.');
    } finally {
      setVerifying2Fa(false);
    }
  };

  // Auto-submit 6 digits for TOTP or Email
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (verificationMethod === 'backup') {
      // Auto-format backup code (e.g. XXXX-XXXX)
      const clean = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
      if (clean.length > 4) {
        setTwoFaCode(`${clean.slice(0, 4)}-${clean.slice(4)}`);
      } else {
        setTwoFaCode(clean);
      }
    } else {
      // Digits only for TOTP and Email
      const digits = val.replace(/\D/g, '').slice(0, 6);
      setTwoFaCode(digits);
    }
  };

  return (
    <AdminAuthLayout
      heading={step === '2fa' ? 'Verify it’s you' : step === 'password' ? 'Welcome back' : 'Sign in'}
      description={
        step === '2fa'
          ? 'Complete the next security step to access your Inaquired admin workspace.'
          : step === 'password'
            ? 'Enter your password to continue to your Inaquired admin workspace.'
            : 'Use your Inaquired administrator account to manage your hiring workspace.'
      }
    >
          {/* =============================================================== */}
          {/* STEP 1: EMAIL & PASSWORD CREDENTIALS */}
          {/* =============================================================== */}
          {(step === 'email' || step === 'password') && (
            <div className="animate-in fade-in duration-200">
              {step === 'password' && (
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setPassword('');
                    setErrorMessage(null);
                  }}
                  className="mb-5 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  aria-label="Change email address"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="max-w-[260px] truncate">{email}</span>
                </button>
              )}

              {/* Alert Message */}
              {errorMessage && (
                <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 animate-in fade-in dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Form */}
              {step === 'email' ? (
                <form onSubmit={handleEmailSubmit} className="space-y-6">
                  <div>
                  <label htmlFor="admin-login-email" className="sr-only">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                      <input
                        id="admin-login-email"
                        type="email"
                        autoComplete="username"
                        required
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="ml-auto inline-flex min-w-24 items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-[0.98]"
                  >
                    Next
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="admin-login-password" className="sr-only">
                      Password
                    </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <input
                      id="admin-login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      autoFocus
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-12 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => onNavigate('/admin/forgot-password')}
                        className="text-sm font-medium text-indigo-700 hover:underline transition-colors dark:text-indigo-300 dark:hover:text-indigo-200"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    aria-busy={loading}
                    className="ml-auto inline-flex min-w-28 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : 'Sign in'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* STEP 2: TWO-FACTOR AUTHENTICATION CHALLENGE */}
          {/* =============================================================== */}
          {step === '2fa' && pendingUser && (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              
              {/* Back to password login button */}
              <button
                type="button"
                onClick={() => {
                  setStep('password');
                  setErrorMessage(null);
                  setTwoFaCode('');
                }}
                className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-300 transition-colors hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
                        <span>Back to sign in</span>
              </button>

              {/* Header */}
              <div className="mb-5">
                {/* User identity */}
                <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#3c4043] bg-[#202124] px-3 py-1 text-xs font-semibold text-slate-200">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white font-bold">
                    {(pendingUser.fullName || pendingUser.email || 'A').charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate max-w-[200px]">{pendingUser.email}</span>
                </div>
              </div>

              {/* Alert Message */}
              {errorMessage && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 animate-in fade-in dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Method Selector Tabs */}
              {twoFaStatus && (twoFaStatus.totpEnabled || twoFaStatus.email2faEnabled) && (
                <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80 mb-5">
                  {twoFaStatus.totpEnabled && (
                    <button
                      type="button"
                      onClick={() => {
                        setVerificationMethod('totp');
                        setTwoFaCode('');
                        setErrorMessage(null);
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
                        verificationMethod === 'totp'
                          ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                      <span>Authenticator</span>
                    </button>
                  )}

                  {twoFaStatus.email2faEnabled && (
                    <button
                      type="button"
                      onClick={() => {
                        setVerificationMethod('email');
                        setTwoFaCode('');
                        setErrorMessage(null);
                        handleDispatchEmailCode();
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
                        verificationMethod === 'email'
                          ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>Email Code</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setVerificationMethod('backup');
                      setTwoFaCode('');
                      setErrorMessage(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
                      verificationMethod === 'backup'
                        ? 'bg-white text-purple-600 shadow-xs dark:bg-slate-900 dark:text-purple-400'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>Backup Key</span>
                  </button>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handle2FaSubmit} className="space-y-4">
                
                {/* Method 1: TOTP (Authenticator App) */}
                {verificationMethod === 'totp' && (
                  <div className="space-y-2 text-center">
                    <label 
                      className="block text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      Enter 6-Digit Authenticator Code
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3 text-indigo-500" />
                      <span>Open Google Authenticator or your TOTP app</span>
                    </p>
                    <div className="pt-2">
                      <TwoFactorOtpInput
                        value={twoFaCode}
                        onChange={setTwoFaCode}
                        onComplete={() => {}}
                        accentColor="indigo"
                        disabled={verifying2Fa}
                        error={Boolean(errorMessage)}
                      />
                    </div>
                  </div>
                )}

                {/* Method 2: Email Code (Resend) */}
                {verificationMethod === 'email' && (
                  <div className="space-y-2 text-center">
                    <label 
                      className="block text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      Enter 6-Digit Email Code
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      A sign-in verification code was sent to your email.
                    </p>

                    <div className="pt-2">
                      <TwoFactorOtpInput
                        value={twoFaCode}
                        onChange={setTwoFaCode}
                        onComplete={() => {}}
                        accentColor="blue"
                        disabled={verifying2Fa}
                        error={Boolean(errorMessage)}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] pt-1 px-1">
                      <span className="text-slate-500 dark:text-slate-400">Didn't receive email?</span>
                      <button
                        type="button"
                        onClick={() => handleDispatchEmailCode()}
                        disabled={emailSending || emailCooldown > 0}
                        className="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        {emailSending ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : emailCooldown > 0 ? (
                          <span>Resend in {emailCooldown}s</span>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3" />
                            <span>Resend Code</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Method 3: Backup Code */}
                {verificationMethod === 'backup' && (
                  <div>
                    <label 
                      htmlFor="backup_login_code"
                      className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1"
                    >
                      Emergency Backup Code
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                      Enter one of your 8-character recovery codes (e.g. XXXX-XXXX).
                    </p>
                    <input
                      ref={codeInputRef}
                      id="backup_login_code"
                      type="text"
                      maxLength={9}
                      required
                      value={twoFaCode}
                      onChange={handleCodeChange}
                      placeholder="XXXX-XXXX"
                      className="w-full rounded-xl border border-purple-300 bg-purple-50/40 py-3 text-center text-xl font-mono font-black tracking-widest text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 dark:border-purple-800 dark:bg-purple-950/30 dark:text-white"
                    />
                  </div>
                )}

                {/* Submit 2FA Button */}
                <button
                  type="submit"
                  disabled={verifying2Fa || !twoFaCode.trim()}
                    className="ml-auto inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {verifying2Fa ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify &amp; Enter Console</span>
                    </>
                  )}
                </button>

                {/* Fallback Switcher */}
                <div className="pt-2 text-center text-xs">
                  {verificationMethod !== 'backup' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setVerificationMethod('backup');
                        setTwoFaCode('');
                        setErrorMessage(null);
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors font-medium cursor-pointer"
                    >
                      <KeyRound className="h-3 w-3" />
                      <span>Lost device? Use emergency backup recovery code</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setVerificationMethod(twoFaStatus?.totpEnabled ? 'totp' : 'email');
                        setTwoFaCode('');
                        setErrorMessage(null);
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors font-medium cursor-pointer"
                    >
                      <Smartphone className="h-3 w-3" />
                      <span>Use standard authenticator app instead</span>
                    </button>
                  )}
                </div>

              </form>
            </div>
          )}

    </AdminAuthLayout>
  );
};
