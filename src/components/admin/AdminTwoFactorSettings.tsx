import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Mail,
  KeyRound,
  QrCode,
  Download,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Send,
  Lock,
  ArrowRight,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Clock,
  Sparkle
} from 'lucide-react';
import {
  get2FaStatus,
  generateTotpSetup,
  verifyAndEnableTotp,
  sendEmail2FaCode,
  verifyAndEnableEmail2Fa,
  getBackupCodes,
  regenerateBackupCodes,
  disable2Fa,
  TwoFactorStatus,
  BackupCodeItem
} from '../../services/twoFactorService';
import { AdminSessionUser } from '../../services/adminAuthService';
import { TwoFactorOtpInput } from './TwoFactorOtpInput';

interface AdminTwoFactorSettingsProps {
  adminUser: AdminSessionUser;
  onShowToast: (message: string) => void;
}

export const AdminTwoFactorSettings: React.FC<AdminTwoFactorSettingsProps> = ({
  adminUser,
  onShowToast,
}) => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<TwoFactorStatus>({
    success: true,
    twoFactorEnabled: false,
    totpEnabled: false,
    email2faEnabled: false,
    hasTotpSecret: false,
    remainingBackupCodes: 0,
  });

  // Modals state
  const [isTotpModalOpen, setIsTotpModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // TOTP Setup state
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [totpFormattedSecret, setTotpFormattedSecret] = useState('');
  const [totpQrCode, setTotpQrCode] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpVerifying, setTotpVerifying] = useState(false);
  const [totpError, setTotpError] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [totpSetupTab, setTotpSetupTab] = useState<'qr' | 'manual'>('qr');

  // Email 2FA state
  const [emailSending, setEmailSending] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailCooldown, setEmailCooldown] = useState(0);

  // Backup codes state
  const [backupCodes, setBackupCodes] = useState<BackupCodeItem[]>([]);
  const [loadingBackupCodes, setLoadingBackupCodes] = useState(false);
  const [regeneratingBackup, setRegeneratingBackup] = useState(false);
  const [copiedAllCodes, setCopiedAllCodes] = useState(false);
  const [copiedSingleCodeIndex, setCopiedSingleCodeIndex] = useState<number | null>(null);

  // Disabling state
  const [disablingTotp, setDisablingTotp] = useState(false);
  const [disablingEmail, setDisablingEmail] = useState(false);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isTotpModalOpen) setIsTotpModalOpen(false);
        if (isEmailModalOpen) setIsEmailModalOpen(false);
        if (isBackupModalOpen) setIsBackupModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTotpModalOpen, isEmailModalOpen, isBackupModalOpen]);

  // Load 2FA status
  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await get2FaStatus(adminUser.email);
      setStatus(res);
    } catch (err) {
      console.error('Failed to load 2FA status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [adminUser.email]);

  // Handle countdown for email resend
  useEffect(() => {
    if (emailCooldown <= 0) return;
    const timer = setInterval(() => {
      setEmailCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [emailCooldown]);

  // Open TOTP Setup Wizard
  const handleStartTotpSetup = async () => {
    setTotpError(null);
    setTotpCode('');
    setIsTotpModalOpen(true);
    try {
      setTotpLoading(true);
      const res = await generateTotpSetup(adminUser.email);
      if (res.success) {
        setTotpSecret(res.secret);
        setTotpFormattedSecret(res.formattedSecret);
        setTotpQrCode(res.qrCodeUrl);
      } else {
        setTotpError(res.error || 'Failed to initialize Google Authenticator setup.');
      }
    } catch (err: any) {
      setTotpError(err.message || 'Error initializing Authenticator setup.');
    } finally {
      setTotpLoading(false);
    }
  };

  // Verify & Enable TOTP
  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setTotpError(null);

    const clean = totpCode.replace(/\D/g, '').trim();
    if (clean.length !== 6) {
      setTotpError('Please enter the full 6-digit code shown in your Authenticator app.');
      return;
    }

    try {
      setTotpVerifying(true);
      const res = await verifyAndEnableTotp(adminUser.email, totpSecret, clean);
      if (res.success) {
        setIsTotpModalOpen(false);
        onShowToast('Google Authenticator 2FA activated successfully!');
        await loadStatus();

        if (res.backupCodes && res.backupCodes.length > 0) {
          setBackupCodes(res.backupCodes);
          setIsBackupModalOpen(true);
        }
      } else {
        setTotpError(res.error || 'Invalid 6-digit code. Check your app and try again.');
      }
    } catch (err: any) {
      setTotpError(err.message || 'Verification failed. Please try again.');
    } finally {
      setTotpVerifying(false);
    }
  };

  // Copy secret code
  const handleCopySecret = () => {
    navigator.clipboard.writeText(totpSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  // Disable TOTP
  const handleDisableTotp = async () => {
    if (!confirm('Are you sure you want to disable Google Authenticator 2FA?')) return;
    try {
      setDisablingTotp(true);
      await disable2Fa(adminUser.email, 'totp');
      onShowToast('Google Authenticator 2FA disabled.');
      await loadStatus();
    } catch (err: any) {
      alert(err.message || 'Failed to disable TOTP 2FA.');
    } finally {
      setDisablingTotp(false);
    }
  };

  // Open Email 2FA Setup
  const handleStartEmailSetup = async () => {
    setEmailError(null);
    setEmailCode('');
    setIsEmailModalOpen(true);
    await handleSendEmailCode();
  };

  // Send Email 2FA Code
  const handleSendEmailCode = async () => {
    if (emailCooldown > 0) return;
    setEmailError(null);
    try {
      setEmailSending(true);
      const res = await sendEmail2FaCode(adminUser.email);
      if (res.success) {
        setEmailCooldown(60);
        onShowToast(`Verification code sent to ${adminUser.email}`);
      } else {
        setEmailError(res.error || 'Failed to dispatch email verification code.');
      }
    } catch (err: any) {
      setEmailError(err.message || 'Error dispatching email verification code.');
    } finally {
      setEmailSending(false);
    }
  };

  // Verify & Enable Email 2FA
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    const clean = emailCode.replace(/\D/g, '').trim();
    if (clean.length !== 6) {
      setEmailError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    try {
      setEmailVerifying(true);
      const res = await verifyAndEnableEmail2Fa(adminUser.email, clean);
      if (res.success) {
        setIsEmailModalOpen(false);
        onShowToast('Email Two-Factor Authentication activated!');
        await loadStatus();

        if (res.backupCodes && res.backupCodes.length > 0) {
          setBackupCodes(res.backupCodes);
          setIsBackupModalOpen(true);
        }
      } else {
        setEmailError(res.error || 'Invalid or expired code. Please try again.');
      }
    } catch (err: any) {
      setEmailError(err.message || 'Verification failed. Please try again.');
    } finally {
      setEmailVerifying(false);
    }
  };

  // Disable Email 2FA
  const handleDisableEmail = async () => {
    if (!confirm('Are you sure you want to disable Email 2FA?')) return;
    try {
      setDisablingEmail(true);
      await disable2Fa(adminUser.email, 'email');
      onShowToast('Email Two-Factor Authentication disabled.');
      await loadStatus();
    } catch (err: any) {
      alert(err.message || 'Failed to disable Email 2FA.');
    } finally {
      setDisablingEmail(false);
    }
  };

  // Open Backup Codes Modal
  const handleOpenBackupModal = async () => {
    setIsBackupModalOpen(true);
    try {
      setLoadingBackupCodes(true);
      const codes = await getBackupCodes(adminUser.email);
      setBackupCodes(codes);
    } catch (err) {
      console.error('Failed to load backup codes:', err);
    } finally {
      setLoadingBackupCodes(false);
    }
  };

  // Regenerate Backup Codes
  const handleRegenerateBackup = async () => {
    if (!confirm('Regenerating backup codes will invalidate all existing unused backup codes. Continue?')) {
      return;
    }
    try {
      setRegeneratingBackup(true);
      const res = await regenerateBackupCodes(adminUser.email);
      if (res.success && res.backupCodes) {
        setBackupCodes(res.backupCodes);
        onShowToast('New backup recovery codes generated.');
        await loadStatus();
      } else {
        alert(res.error || 'Failed to regenerate backup codes.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to regenerate backup codes.');
    } finally {
      setRegeneratingBackup(false);
    }
  };

  // Copy all backup codes
  const handleCopyAllBackupCodes = () => {
    const text = backupCodes.map((b) => b.code).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAllCodes(true);
    setTimeout(() => setCopiedAllCodes(false), 2000);
    onShowToast('All backup codes copied to clipboard');
  };

  // Copy single backup code
  const handleCopySingleCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedSingleCodeIndex(index);
    setTimeout(() => setCopiedSingleCodeIndex(null), 2000);
    onShowToast(`Backup code ${code} copied`);
  };

  // Download backup codes as TXT
  const handleDownloadBackupCodes = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const content = [
      '====================================================',
      '  inaquired Admin Portal – Backup Recovery Codes',
      '====================================================',
      `Account: ${adminUser.email}`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'Instructions:',
      '• Each code can only be used once to verify sign-in.',
      '• Keep these codes in a secure password manager or safe.',
      '• Never share backup codes with unauthorized parties.',
      '',
      'Your Backup Codes:',
      ...backupCodes.map((b, i) => `  ${i + 1}. ${b.code} ${b.used ? '[USED]' : '[UNUSED]'}`),
      '',
      '====================================================',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inaquired-backup-codes-${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast('Downloaded backup codes file');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
          Account security
        </span>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Two-factor authentication
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Choose how to verify your identity when signing in, and keep recovery codes available in case you lose access.
        </p>
      </div>
      
      {/* Master 2FA Status Banner */}
      <div className={`relative overflow-hidden rounded-3xl border p-5 shadow-sm transition-all sm:p-6 ${
        status.twoFactorEnabled
          ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-white dark:border-emerald-900/60 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900'
          : 'border-slate-200 bg-gradient-to-r from-slate-50 via-white to-white dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
              status.twoFactorEnabled
                ? 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                : 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300'
            }`}>
              {status.twoFactorEnabled ? (
                <ShieldCheck className="h-6 w-6" />
              ) : (
                <ShieldAlert className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Sign-in protection
                </h3>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                  status.twoFactorEnabled
                    ? 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                    : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300'
                }`}>
                  {status.twoFactorEnabled ? 'PROTECTED' : 'NOT ENABLED'}
                </span>
              </div>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {status.twoFactorEnabled
                  ? 'Your administrator account is protected with multi-factor authentication. Sign-in requires your password plus an authenticator code, email code, or emergency recovery key.'
                  : 'Add an extra layer of security. In addition to your password, you will be required to verify your identity using Google Authenticator or Email OTP.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={loadStatus}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
              title="Refresh 2FA status"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of 2FA Methods */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        
        {/* METHOD 1: Google Authenticator (TOTP) */}
        <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-800 sm:p-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Google Authenticator
                  </h4>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    TOTP Authenticator Apps
                  </span>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                status.totpEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50'
                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
              }`}>
                {status.totpEnabled ? (
                  <>
                    <Check className="h-3 w-3" />
                    <span>Active</span>
                  </>
                ) : (
                  <span>Not Configured</span>
                )}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Generate time-sensitive 6-digit codes with Google Authenticator, Microsoft Authenticator, 1Password, or Authy on your mobile phone or browser.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            {status.totpEnabled ? (
              <>
                <button
                  type="button"
                  onClick={handleStartTotpSetup}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Reconfigure App
                </button>
                <button
                  type="button"
                  onClick={handleDisableTotp}
                  disabled={disablingTotp}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {disablingTotp ? 'Disabling...' : 'Disable'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleStartTotpSetup}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer"
              >
                <span>Set Up Google Authenticator</span>
              </button>
            )}
          </div>
        </div>

        {/* METHOD 2: Email Code (Resend) */}
        <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900 sm:p-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Email Security Code
                  </h4>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Sent by email
                  </span>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                status.email2faEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50'
                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
              }`}>
                {status.email2faEnabled ? (
                  <>
                    <Check className="h-3 w-3" />
                    <span>Active</span>
                  </>
                ) : (
                  <span>Disabled</span>
                )}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Receive a single-use 6-digit security code sent straight to your verified administrator mailbox (<strong className="font-semibold text-slate-900 dark:text-white">{adminUser.email}</strong>).
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            {status.email2faEnabled ? (
              <>
                <button
                  type="button"
                  onClick={handleStartEmailSetup}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Test Verification
                </button>
                <button
                  type="button"
                  onClick={handleDisableEmail}
                  disabled={disablingEmail}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {disablingEmail ? 'Disabling...' : 'Disable'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleStartEmailSetup}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all cursor-pointer"
              >
                <span>Enable Email 2FA</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* METHOD 3: Emergency Backup Recovery Codes Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Backup Recovery Codes
                </h4>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                  status.remainingBackupCodes > 2
                    ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/50'
                    : status.remainingBackupCodes > 0
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50'
                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                }`}>
                  {status.remainingBackupCodes} Unused Codes Remaining
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
                Backup recovery codes provide emergency account access if you lose access to your phone or cannot receive emails. Each code can be used exactly once.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={handleOpenBackupModal}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <KeyRound className="h-4 w-4 text-purple-500" />
              <span>View &amp; Manage Codes</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: GOOGLE AUTHENTICATOR SETUP WIZARD */}
      {/* ========================================================================= */}
      {isTotpModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTotpModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200/90 bg-white/95 p-5 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto sm:p-6">

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsTotpModalOpen(false)}
              className="absolute top-5 right-5 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition-all hover:scale-105 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 ring-4 ring-indigo-50 dark:ring-indigo-950/40">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Set Up Google Authenticator
                  </h3>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                    TOTP
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pair your mobile authenticator app for instant two-step verification
                </p>
              </div>
            </div>

            {totpError && (
              <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <span className="leading-relaxed font-medium">{totpError}</span>
              </div>
            )}

            {totpLoading ? (
              <div className="py-14 flex flex-col items-center justify-center text-center">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-3 border-indigo-600/20 border-t-indigo-600 animate-spin dark:border-indigo-400/20 dark:border-t-indigo-400" />
                  <Smartphone className="h-5 w-5 text-indigo-600 dark:text-indigo-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <p className="mt-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Generating secure cryptographic pairing key...
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Using RFC 6238 compliant HMAC-SHA1 engine
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                <div className="space-y-3">
                
                {/* Method Switcher Tabs: QR Scanner vs Manual Key */}
                <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/70">
                  <button
                    type="button"
                    onClick={() => setTotpSetupTab('qr')}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
                      totpSetupTab === 'qr'
                        ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    <span>Scan QR Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTotpSetupTab('manual')}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
                      totpSetupTab === 'manual'
                        ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>Enter Key Manually</span>
                  </button>
                </div>

                {/* Tab 1: QR Code Scanner Viewfinder */}
                {totpSetupTab === 'qr' && (
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-center dark:border-slate-800 dark:bg-slate-950/60 animate-in fade-in duration-150">
                    <p className="mb-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Open your authenticator app and scan this QR code:
                    </p>

                    {totpQrCode && (
                      <div className="relative inline-block p-4 bg-white rounded-2xl border-2 border-indigo-500/20 shadow-lg dark:border-indigo-400/20 transition-all hover:scale-[1.01]">
                        {/* Viewfinder corner decorative marks */}
                        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-indigo-600 rounded-tl-sm pointer-events-none" />
                        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-indigo-600 rounded-tr-sm pointer-events-none" />
                        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-indigo-600 rounded-bl-sm pointer-events-none" />
                        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-indigo-600 rounded-br-sm pointer-events-none" />

                        <img
                          src={totpQrCode}
                          alt="Google Authenticator TOTP QR Code"
                          className="mx-auto h-36 w-36 rounded-lg object-contain sm:h-40 sm:w-40"
                        />
                      </div>
                    )}

                    {/* Supported apps pill list */}
                    <div className="mt-3 border-t border-slate-200/60 pt-3 text-[11px] text-slate-500 dark:border-slate-800/60 dark:text-slate-400">
                      Works with Google Authenticator, Microsoft Authenticator, 1Password, and Apple Passwords.
                    </div>
                  </div>
                )}

                {/* Tab 2: Manual Key Entry View */}
                {totpSetupTab === 'manual' && (
                  <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/60 animate-in fade-in duration-150">
                    <div className="space-y-1.5">
                      <span className="block text-[11px] font-bold tracking-wide text-slate-700 dark:text-slate-300">
                        Manual setup key
                      </span>
                      <p className="max-w-sm text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                        If your camera cannot scan the QR code, manually add an account in your app and paste this key.
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        <div className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white p-3 text-center font-mono text-xs font-bold leading-relaxed tracking-[0.16em] text-indigo-950 dark:border-slate-700 dark:bg-slate-900 dark:text-indigo-200 select-all break-all sm:text-sm">
                          {totpFormattedSecret || totpSecret}
                        </div>
                        <button
                          type="button"
                          onClick={handleCopySecret}
                          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2.5 text-[11px] font-bold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 sm:px-3.5 sm:text-xs"
                          title="Copy key to clipboard"
                        >
                          {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                  </div>
                )}
                </div>

                {/* Step 2: Enter 6-digit Code */}
                <form onSubmit={handleVerifyTotp} className="flex flex-col justify-center space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/50 sm:p-5">
                  <div className="space-y-2 text-center">
                    <label 
                      htmlFor="totp_verify_code"
                      className="block text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      Enter the 6-Digit Code Shown in Your App
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3 text-indigo-500" />
                      <span>Codes automatically refresh every 30 seconds</span>
                    </p>

                    <div className="pt-2">
                      <TwoFactorOtpInput
                        value={totpCode}
                        onChange={setTotpCode}
                        onComplete={() => {
                          // Auto trigger submission if completed
                        }}
                        accentColor="indigo"
                        disabled={totpVerifying}
                        error={Boolean(totpError)}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsTotpModalOpen(false)}
                      className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={totpVerifying || totpCode.trim().length !== 6}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 transition-all hover:scale-[1.01] cursor-pointer"
                    >
                      {totpVerifying ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Verifying Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify &amp; Activate 2FA</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EMAIL 2FA SETUP & VERIFICATION */}
      {/* ========================================================================= */}
      {isEmailModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEmailModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200/90 bg-white/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 animate-in zoom-in-95 duration-200">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsEmailModalOpen(false)}
              className="absolute top-5 right-5 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition-all hover:scale-105 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3.5 mb-5 pr-8">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 ring-4 ring-blue-50 dark:ring-blue-950/40">
                <Mail className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Email Security Verification
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Single-use code dispatched to your verified administrator inbox
                </p>
              </div>
            </div>

            {emailError && (
              <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <span className="leading-relaxed font-medium">{emailError}</span>
              </div>
            )}

            {/* Mailbox Status Card */}
            <div className="rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-slate-50/80 p-4 dark:border-blue-900/40 dark:from-blue-950/50 dark:via-indigo-950/30 dark:to-slate-950/50 mb-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300">
                    Dispatched to mailbox:
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                    <span className="truncate max-w-[240px]">{adminUser.email}</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live OTP
                </span>
              </div>

            </div>

            {/* Verification Form */}
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div className="space-y-2 text-center">
                <label 
                  htmlFor="email_verify_code"
                  className="block text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  Enter the 6-Digit Email Code
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Type or paste the code received in your inbox
                </p>

                <div className="pt-2">
                  <TwoFactorOtpInput
                    value={emailCode}
                    onChange={setEmailCode}
                    onComplete={() => {
                      // Ready to submit
                    }}
                    accentColor="blue"
                    disabled={emailVerifying}
                    error={Boolean(emailError)}
                  />
                </div>
              </div>

              {/* Resend Action Row */}
              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Didn't receive email?
                </span>
                <button
                  type="button"
                  onClick={handleSendEmailCode}
                  disabled={emailSending || emailCooldown > 0}
                  className="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 transition-colors cursor-pointer text-[11px] flex items-center gap-1"
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

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={emailVerifying || emailCode.trim().length !== 6}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/25 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all hover:scale-[1.01] cursor-pointer"
                >
                  {emailVerifying ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify &amp; Activate</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: VIEW & MANAGE BACKUP RECOVERY CODES */}
      {/* ========================================================================= */}
      {isBackupModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsBackupModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200/90 bg-white/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsBackupModalOpen(false)}
              className="absolute top-5 right-5 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition-all hover:scale-105 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-lg shadow-purple-500/25 ring-4 ring-purple-50 dark:ring-purple-950/40">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Emergency Backup Recovery Codes
                  </h3>
                  <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                    Vault Keys
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Single-use fallback keys to access your administrator account
                </p>
              </div>
            </div>

            {/* Warning Notice */}
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-3.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200 mb-5 leading-relaxed flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <strong className="font-bold">Important Notice:</strong> Keep these codes in a secure password vault (e.g. 1Password, Bitwarden) or print them out. Each code can be used exactly once if you ever lose access to your primary 2FA method.
              </div>
            </div>

            {loadingBackupCodes ? (
              <div className="py-14 flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 animate-spin rounded-full border-3 border-purple-600 border-t-transparent dark:border-purple-400" />
                <p className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-300">Retrieving backup recovery codes...</p>
              </div>
            ) : backupCodes.length === 0 ? (
              <div className="py-8 text-center space-y-3.5 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  No backup codes found for this account. Generate your emergency recovery codes below:
                </p>
                <button
                  type="button"
                  onClick={handleRegenerateBackup}
                  disabled={regeneratingBackup}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-600/20 hover:bg-purple-700 transition-all cursor-pointer"
                >
                  <KeyRound className="h-4 w-4" />
                  <span>Generate 10 Backup Codes</span>
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* 2-column grid of codes */}
                <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl border border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/60 font-mono text-xs">
                  {backupCodes.map((item, idx) => {
                    const isCopied = copiedSingleCodeIndex === idx;
                    return (
                      <div
                        key={idx}
                        className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          item.used
                            ? 'border-slate-200 bg-slate-100 text-slate-400 line-through dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-600'
                            : 'border-slate-200 bg-white font-bold text-slate-900 hover:border-purple-300 hover:shadow-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-purple-600'
                        }`}
                      >
                        <span className="tracking-wider text-xs sm:text-sm">{item.code}</span>
                        {item.used ? (
                          <span className="text-[9px] font-sans font-bold uppercase text-slate-400 no-underline px-1.5 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-800">
                            Used
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCopySingleCode(item.code, idx)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/60 dark:hover:text-purple-400 transition-colors cursor-pointer"
                            title="Copy this code"
                          >
                            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Bulk Actions: Copy All, Download TXT, Regenerate */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyAllBackupCodes}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-all hover:scale-[1.01] cursor-pointer"
                    >
                      {copiedAllCodes ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedAllCodes ? 'All Copied' : 'Copy All'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadBackupCodes}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-all hover:scale-[1.01] cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download .TXT</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleRegenerateBackup}
                    disabled={regeneratingBackup}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${regeneratingBackup ? 'animate-spin' : ''}`} />
                    <span>Regenerate Codes</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Done Bar */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Safe storage confirmed
              </span>
              <button
                type="button"
                onClick={() => setIsBackupModalOpen(false)}
                className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-all hover:scale-[1.02] cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
