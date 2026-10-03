import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Mail, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  KeyRound,
  Smartphone,
  RefreshCw,
  CheckCircle2,
  ChevronLeft,
  FileText
} from 'lucide-react';
import { signInAdmin, AdminSessionUser } from '../../services/adminAuthService';
import { 
  get2FaStatus, 
  sendEmail2FaCode, 
  verifyLogin2Fa, 
  TwoFactorStatus 
} from '../../services/twoFactorService';

interface AdminLoginPageProps {
  onLoginSuccess: (user: AdminSessionUser) => void;
  onNavigate: (path: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ 
  onLoginSuccess, 
  onNavigate 
}) => {
  // Step: 'credentials' | '2fa'
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');

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

  // Step 1: Submit email & password
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMessage('Please enter both your administrator email and password.');
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
      setStep('credentials');
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
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Background Accent Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl dark:bg-indigo-500/15" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl dark:bg-emerald-500/10" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card Container */}
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 transition-all duration-300">
          
          {/* =============================================================== */}
          {/* STEP 1: EMAIL & PASSWORD CREDENTIALS */}
          {/* =============================================================== */}
          {step === 'credentials' && (
            <div className="animate-in fade-in duration-200">
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
                    Sign in with your administrator credentials
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
              <form onSubmit={handleCredentialsSubmit} className="mt-6 space-y-4">

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
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
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
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
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
                  className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 disabled:opacity-50 transition-all hover:scale-[1.01] cursor-pointer"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>
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
                  setStep('credentials');
                  setErrorMessage(null);
                  setTwoFaCode('');
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer mb-4"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back to password</span>
              </button>

              {/* Header */}
              <div className="flex flex-col items-center text-center space-y-2 mb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400 shadow-xs ring-4 ring-indigo-50 dark:ring-indigo-950/50">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Two-Factor Authentication
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Verify your identity to complete administrator login
                  </p>
                </div>

                {/* User chip */}
                <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200 mt-1">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white font-bold">
                    {(pendingUser.fullName || pendingUser.email || 'A').charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate max-w-[200px]">{pendingUser.email}</span>
                </div>
              </div>

              {/* Alert Message */}
              {errorMessage && (
                <div className="mb-4 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-400 animate-in fade-in">
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
                  <div>
                    <label 
                      htmlFor="totp_login_code"
                      className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1"
                    >
                      Enter 6-Digit Authenticator Code
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                      Open Google Authenticator or your TOTP app to view the code.
                    </p>
                    <input
                      ref={codeInputRef}
                      id="totp_login_code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      value={twoFaCode}
                      onChange={handleCodeChange}
                      placeholder="000 000"
                      className="w-full rounded-xl border border-indigo-300 bg-indigo-50/40 py-3 text-center text-2xl font-mono font-black tracking-[8px] text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-white"
                    />
                  </div>
                )}

                {/* Method 2: Email Code (Resend) */}
                {verificationMethod === 'email' && (
                  <div>
                    <label 
                      htmlFor="email_login_code"
                      className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1"
                    >
                      Enter 6-Digit Email Code
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                      Sent to <strong className="text-slate-700 dark:text-slate-300">{pendingUser.email}</strong> via Resend.
                    </p>
                    <input
                      ref={codeInputRef}
                      id="email_login_code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      value={twoFaCode}
                      onChange={handleCodeChange}
                      placeholder="000 000"
                      className="w-full rounded-xl border border-blue-300 bg-blue-50/40 py-3 text-center text-2xl font-mono font-black tracking-[8px] text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-blue-800 dark:bg-blue-950/30 dark:text-white"
                    />

                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400">Didn't receive email?</span>
                      <button
                        type="button"
                        onClick={() => handleDispatchEmailCode()}
                        disabled={emailSending || emailCooldown > 0}
                        className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {emailSending
                          ? 'Sending...'
                          : emailCooldown > 0
                          ? `Resend in ${emailCooldown}s`
                          : 'Resend Code'}
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
                  className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 disabled:opacity-50 transition-all hover:scale-[1.01] cursor-pointer"
                >
                  {verifying2Fa ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
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

        </div>

        {/* Security Footer Note */}
        <p className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
          <span>Secured with Encrypted Session &amp; Multi-Factor Access Control</span>
        </p>
      </div>
    </div>
  );
};
