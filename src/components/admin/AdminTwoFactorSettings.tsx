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
  ExternalLink
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

  // Email 2FA state
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailDevOtp, setEmailDevOtp] = useState<string | null>(null);
  const [emailCooldown, setEmailCooldown] = useState(0);

  // Backup codes state
  const [backupCodes, setBackupCodes] = useState<BackupCodeItem[]>([]);
  const [loadingBackupCodes, setLoadingBackupCodes] = useState(false);
  const [regeneratingBackup, setRegeneratingBackup] = useState(false);
  const [copiedAllCodes, setCopiedAllCodes] = useState(false);

  // Disabling state
  const [disablingTotp, setDisablingTotp] = useState(false);
  const [disablingEmail, setDisablingEmail] = useState(false);

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
    setEmailSent(false);
    setEmailDevOtp(null);
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
        setEmailSent(true);
        setEmailCooldown(60);
        if (res.devOtp) {
          setEmailDevOtp(res.devOtp);
        }
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
    <div className="space-y-6">
      
      {/* Master 2FA Status Banner */}
      <div className={`relative overflow-hidden rounded-2xl p-6 border transition-all ${
        status.twoFactorEnabled
          ? 'bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-slate-900 border-emerald-500/30 text-emerald-100 shadow-lg shadow-emerald-950/20'
          : 'bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-slate-800 text-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
              status.twoFactorEnabled
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              {status.twoFactorEnabled ? (
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
              ) : (
                <ShieldAlert className="h-6 w-6 text-amber-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-white">
                  Two-Factor Authentication (2FA)
                </h3>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                  status.twoFactorEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {status.twoFactorEnabled ? 'ENFORCED & ACTIVE' : 'DISABLED'}
                </span>
              </div>
              <p className="text-xs text-slate-300 dark:text-slate-400 mt-1 max-w-xl">
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-all cursor-pointer"
              title="Refresh 2FA status"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of 2FA Methods */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        
        {/* METHOD 1: Google Authenticator (TOTP) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs flex flex-col justify-between">
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
                <QrCode className="h-4 w-4" />
                <span>Set Up Google Authenticator</span>
              </button>
            )}
          </div>
        </div>

        {/* METHOD 2: Email Code (Resend) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs flex flex-col justify-between">
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
                    Dispatched via Resend
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
                <Mail className="h-4 w-4" />
                <span>Enable Email 2FA</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* METHOD 3: Emergency Backup Recovery Codes Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <button
              type="button"
              onClick={() => setIsTotpModalOpen(false)}
              className="absolute top-5 right-5 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Set Up Google Authenticator
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Scan the QR code with your authenticator mobile app
                </p>
              </div>
            </div>

            {totpError && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{totpError}</span>
              </div>
            )}

            {totpLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <span className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent dark:border-indigo-400" />
                <p className="mt-3 text-xs text-slate-500">Generating secure cryptographic key...</p>
              </div>
            ) : (
              <div className="space-y-5">
                
                {/* Step 1: Scan QR Code */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/60 text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-2">
                    Step 1: Scan with Authenticator App
                  </span>
                  
                  {totpQrCode && (
                    <div className="inline-block p-3 bg-white rounded-2xl border border-slate-200 shadow-sm dark:border-slate-700">
                      <img
                        src={totpQrCode}
                        alt="TOTP QR Code"
                        className="h-44 w-44 rounded-lg object-contain mx-auto"
                      />
                    </div>
                  )}

                  <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
                    Works with Google Authenticator, Microsoft Authenticator, 1Password, Authy &amp; Apple Passwords.
                  </p>
                </div>

                {/* Step 2: Manual Entry Option */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Step 2: Or enter this secret key manually
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      readOnly
                      value={totpFormattedSecret}
                      className="w-full rounded-xl border border-slate-300 bg-slate-100/80 py-2 pl-3.5 pr-20 text-xs font-mono font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="absolute right-1.5 flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:text-indigo-300 transition-colors cursor-pointer"
                    >
                      {copiedSecret ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Step 3: Verify 6-digit Code */}
                <form onSubmit={handleVerifyTotp} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label 
                      htmlFor="totp_verify_code"
                      className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5"
                    >
                      Step 3: Enter the 6-digit code shown in your app
                    </label>
                    <div className="relative">
                      <input
                        id="totp_verify_code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]*"
                        maxLength={6}
                        required
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000 000"
                        className="w-full rounded-xl border border-indigo-300 bg-indigo-50/40 py-3 text-center text-xl font-mono font-black tracking-[8px] text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsTotpModalOpen(false)}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={totpVerifying || totpCode.trim().length !== 6}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {totpVerifying ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          <span>Verify &amp; Activate</span>
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
      {/* MODAL 2: EMAIL 2FA SETUP / TEST */}
      {/* ========================================================================= */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-200">
            
            <button
              type="button"
              onClick={() => setIsEmailModalOpen(false)}
              className="absolute top-5 right-5 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Email Two-Factor Authentication
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verify receipt of security code via Resend
                </p>
              </div>
            </div>

            {emailError && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{emailError}</span>
              </div>
            )}

            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-950/40 mb-5">
              <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                A 6-digit verification code has been dispatched to:
              </p>
              <p className="text-xs font-bold text-blue-950 dark:text-white mt-1">
                {adminUser.email}
              </p>
              {import.meta.env.DEV && emailDevOtp && (
                <div className="mt-2.5 pt-2 border-t border-blue-200/60 dark:border-blue-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-blue-700 dark:text-blue-300 font-semibold">Dev Fallback Code:</span>
                  <span className="font-mono font-bold text-blue-900 dark:text-white tracking-widest">{emailDevOtp}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div>
                <label 
                  htmlFor="email_verify_code"
                  className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5"
                >
                  Enter the 6-Digit Email Code
                </label>
                <input
                  id="email_verify_code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000 000"
                  className="w-full rounded-xl border border-blue-300 bg-blue-50/40 py-3 text-center text-xl font-mono font-black tracking-[8px] text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-blue-800 dark:bg-blue-950/30 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Didn't receive email?
                </span>
                <button
                  type="button"
                  onClick={handleSendEmailCode}
                  disabled={emailSending || emailCooldown > 0}
                  className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 transition-colors cursor-pointer text-[11px]"
                >
                  {emailSending
                    ? 'Sending...'
                    : emailCooldown > 0
                    ? `Resend in ${emailCooldown}s`
                    : 'Resend Code'}
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={emailVerifying || emailCode.trim().length !== 6}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {emailVerifying ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <button
              type="button"
              onClick={() => setIsBackupModalOpen(false)}
              className="absolute top-5 right-5 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Backup Recovery Codes
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Save these single-use recovery codes in a secure location
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300 mb-5 leading-relaxed">
              <span className="font-bold">Important Notice:</span> If you lose your phone or are unable to receive email codes, these backup keys are the only way to recover access to your administrator account.
            </div>

            {loadingBackupCodes ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <span className="h-8 w-8 animate-spin rounded-full border-3 border-purple-600 border-t-transparent dark:border-purple-400" />
                <p className="mt-3 text-xs text-slate-500">Retrieving backup codes...</p>
              </div>
            ) : backupCodes.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No backup codes found for this account. Generate your emergency recovery codes below:
                </p>
                <button
                  type="button"
                  onClick={handleRegenerateBackup}
                  disabled={regeneratingBackup}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-600/20 hover:bg-purple-700 transition-all cursor-pointer"
                >
                  <KeyRound className="h-4 w-4" />
                  <span>Generate Backup Codes</span>
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* 2-column grid of codes */}
                <div className="grid grid-cols-2 gap-2.5 p-4 rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 font-mono text-xs">
                  {backupCodes.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                        item.used
                          ? 'border-slate-200 bg-slate-100 text-slate-400 line-through dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-600'
                          : 'border-slate-200 bg-white font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 shadow-2xs'
                      }`}
                    >
                      <span className="tracking-wider">{item.code}</span>
                      {item.used && (
                        <span className="text-[10px] font-sans font-semibold uppercase text-slate-400 no-underline">
                          Used
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Actions: Copy All, Download TXT, Regenerate */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyAllBackupCodes}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      {copiedAllCodes ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedAllCodes ? 'Copied' : 'Copy All'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadBackupCodes}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
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

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-right">
              <button
                type="button"
                onClick={() => setIsBackupModalOpen(false)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors cursor-pointer"
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
