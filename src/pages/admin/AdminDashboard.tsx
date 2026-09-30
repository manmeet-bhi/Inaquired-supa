import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Shield, 
  KeyRound, 
  FileText, 
  AlertTriangle, 
  Sparkles,
  Download,
  Smartphone,
  CheckCircle2,
  Clock,
  ExternalLink,
  Laptop,
  GraduationCap
} from 'lucide-react';
import { Job, JobStatus, AuditLogEntry } from '../../types/job';
import { useAuth } from '../../context/AuthContext';
import { JobEditorModal } from './JobEditorModal';
import { createJob, updateJob, deleteJob, seedInitialJobsIfEmpty } from '../../services/jobService';
import { 
  generateBase32Secret, 
  generateTotpUri, 
  verifyTotpToken, 
  generateBackupCodes 
} from '../../utils/totpUtils';
import { formatSalary, formatRelativeDate } from '../../utils/jobUtils';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface AdminDashboardProps {
  jobs: Job[];
  onNavigateHome: () => void;
  onPreviewJob: (slug: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  jobs,
  onNavigateHome,
  onPreviewJob,
}) => {
  const { 
    currentUser, 
    adminData, 
    saveMfaEnrollment, 
    disableMfa, 
    logout, 
    recordAuditLog 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'jobs' | 'security' | 'audit'>('jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | JobStatus>('all');
  
  // Job Editor Modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // 2FA Setup state
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [generatedSecret, setGeneratedSecret] = useState<string>('');
  const [generatedBackupCodes, setGeneratedBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [mfaSuccessMsg, setMfaSuccessMsg] = useState<string>('');
  const [mfaErrorMsg, setMfaErrorMsg] = useState<string>('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Listen to audit logs
  useEffect(() => {
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs: AuditLogEntry[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      } as AuditLogEntry));
      setAuditLogs(logs);
    }, (err) => {
      console.warn('Audit logs listener note:', err);
    });
    return unsubscribe;
  }, []);

  // Pre-generate QR code for 2FA when opening Security tab
  useEffect(() => {
    if (activeTab === 'security' && !adminData?.mfaEnabled && !generatedSecret) {
      startMfaEnrollmentFlow();
    }
  }, [activeTab, adminData]);

  const startMfaEnrollmentFlow = async () => {
    const secret = generateBase32Secret(20);
    setGeneratedSecret(secret);
    const backup = generateBackupCodes(8);
    setGeneratedBackupCodes(backup);

    const email = currentUser?.email || 'admin@inaquired.com';
    const uri = generateTotpUri('inaquired', email, secret);

    try {
      const url = await QRCode.toDataURL(uri, {
        width: 240,
        margin: 2,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff',
        },
      });
      setQrDataUrl(url);
    } catch (e) {
      console.error('Failed to generate QR code data URL:', e);
    }
  };

  const handleConfirmMfaActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaErrorMsg('');
    setMfaSuccessMsg('');

    const isValid = await verifyTotpToken(generatedSecret, verificationCode);
    if (!isValid) {
      setMfaErrorMsg('Invalid 6-digit code. Please enter the current code shown in your Authenticator app.');
      return;
    }

    try {
      await saveMfaEnrollment(generatedSecret, generatedBackupCodes);
      setMfaSuccessMsg('Two-Factor Authentication is now active! Store your backup recovery codes safely.');
    } catch (err: any) {
      setMfaErrorMsg(err?.message || 'Failed to persist 2FA status in database.');
    }
  };

  const handleDisableMfa = async () => {
    if (window.confirm('Are you sure you want to disable 2FA? This lowers administrative account protection.')) {
      await disableMfa();
      startMfaEnrollmentFlow();
    }
  };

  // Job Operations
  const handleSaveJob = async (jobData: Omit<Job, 'id'>, existingId?: string) => {
    if (existingId) {
      await updateJob(existingId, jobData);
      await recordAuditLog('JOB_UPDATED', `job/${existingId}`, `Updated job "${jobData.title}"`);
    } else {
      const newId = await createJob(jobData);
      await recordAuditLog('JOB_CREATED', `job/${newId}`, `Created job "${jobData.title}"`);
    }
  };

  const handleDeleteJob = async (job: Job) => {
    if (window.confirm(`Are you sure you want to permanently delete "${job.title}"?`)) {
      try {
        setActionLoading(true);
        await deleteJob(job.id);
        await recordAuditLog('JOB_DELETED', `job/${job.id}`, `Deleted job "${job.title}"`);
      } catch (err: any) {
        alert(err?.message || 'Failed to delete job.');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleToggleStatus = async (job: Job) => {
    const nextStatus: JobStatus = job.status === 'published' ? 'draft' : 'published';
    try {
      await updateJob(job.id, { 
        status: nextStatus,
        publishedAt: nextStatus === 'published' ? new Date().toISOString() : job.publishedAt 
      });
      await recordAuditLog('JOB_STATUS_CHANGED', `job/${job.id}`, `Changed status to ${nextStatus}`);
    } catch (err: any) {
      alert(err?.message || 'Failed to update job status.');
    }
  };

  const handleDuplicateJob = async (job: Job) => {
    const duplicated: Omit<Job, 'id'> = {
      ...job,
      title: `${job.title} (Copy)`,
      slug: `${job.slug}-copy-${Math.random().toString(36).substring(2, 6)}`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: undefined,
    };
    const newId = await createJob(duplicated);
    await recordAuditLog('JOB_DUPLICATED', `job/${newId}`, `Duplicated job from "${job.title}"`);
  };

  const handleSeedDatabase = async () => {
    if (window.confirm('Seed initial verified job listings into Firestore?')) {
      setActionLoading(true);
      await seedInitialJobsIfEmpty();
      setActionLoading(false);
    }
  };

  // KPI Calculations
  const totalJobs = jobs.length;
  const publishedCount = jobs.filter((j) => j.status === 'published').length;
  const draftCount = jobs.filter((j) => j.status === 'draft').length;
  const remoteCount = jobs.filter((j) => j.workArrangement === 'remote').length;
  const internshipCount = jobs.filter((j) => j.jobType === 'internship').length;

  // Filtered jobs table
  const displayedJobs = jobs.filter((j) => {
    if (statusFilter !== 'all' && j.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        j.title.toLowerCase().includes(q) ||
        j.companyName.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      
      {/* Top Banner: CMS Header & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <Shield className="h-3.5 w-3.5" />
              Administrator Control Center
            </span>
            {adminData?.mfaEnabled ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                2FA Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300">
                <AlertTriangle className="h-3 w-3" />
                2FA Recommended
              </span>
            )}
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Job Portal CMS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Authenticated as <strong className="text-slate-800 dark:text-slate-200">{currentUser?.email}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setEditingJob(null);
              setIsEditorOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-indigo-700 focus:outline-none transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Job</span>
          </button>
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>View Public Site</span>
          </button>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Positions</span>
          <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{totalJobs}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Published Live</span>
          <p className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{publishedCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Drafts / Review</span>
          <p className="mt-1 text-2xl font-extrabold text-amber-600 dark:text-amber-400">{draftCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Remote Roles</span>
          <p className="mt-1 text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{remoteCount}</p>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-sky-600 dark:text-sky-400">Internships</span>
          <p className="mt-1 text-2xl font-extrabold text-sky-600 dark:text-sky-400">{internshipCount}</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            activeTab === 'jobs'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <span>Job Openings ({displayedJobs.length})</span>
          {activeTab === 'jobs' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 text-sm font-semibold transition-colors relative flex items-center gap-1.5 ${
            activeTab === 'security'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <KeyRound className="h-4 w-4" />
          <span>Admin 2FA & Security</span>
          {activeTab === 'security' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-semibold transition-colors relative flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Audit Trails</span>
          {activeTab === 'audit' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
          )}
        </button>
      </div>

      {/* TAB 1: Job Management Table */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          
          {/* Table Search & Status Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search job title, company, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs font-medium text-slate-700 focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published Only</option>
                <option value="draft">Drafts Only</option>
                <option value="archived">Archived</option>
              </select>

              {totalJobs === 0 && (
                <button
                  onClick={handleSeedDatabase}
                  disabled={actionLoading}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  Seed Starter Roles
                </button>
              )}
            </div>
          </div>

          {/* Job Listings Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Title & Details</th>
                    <th className="py-3 px-4 font-semibold">Format</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Posted</th>
                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {displayedJobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                        No job openings found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    displayedJobs.map((job) => (
                      <tr 
                        key={job.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                            {job.title}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {job.companyName} • {job.location}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="capitalize inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {job.workArrangement}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="capitalize text-xs text-slate-600 dark:text-slate-400">
                            {job.jobType}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleStatus(job)}
                            title="Click to toggle publish status"
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border transition-all ${
                              job.status === 'published'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300'
                                : 'bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300'
                            }`}
                          >
                            {job.status === 'published' ? (
                              <>
                                <Eye className="h-3 w-3" />
                                <span>Published</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3" />
                                <span>Draft</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                          {formatRelativeDate(job.publishedAt || job.createdAt)}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onPreviewJob(job.slug || job.id)}
                              title="Preview Job Detail"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingJob(job);
                                setIsEditorOpen(true);
                              }}
                              title="Edit Job"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicateJob(job)}
                              title="Duplicate as Draft"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteJob(job)}
                              title="Delete Job"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 2FA & Security Settings */}
      {activeTab === 'security' && (
        <div className="max-w-3xl space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Authenticator App Two-Factor Authentication (TOTP)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enforces standard RFC 6238 time-based verification codes from Google Authenticator, Authy, or 1Password.
                </p>
              </div>

              {adminData?.mfaEnabled && (
                <button
                  onClick={handleDisableMfa}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                >
                  Disable 2FA
                </button>
              )}
            </div>

            {mfaSuccessMsg && (
              <div className="rounded-lg bg-emerald-50 p-4 text-xs text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{mfaSuccessMsg}</span>
              </div>
            )}

            {mfaErrorMsg && (
              <div className="rounded-lg bg-rose-50 p-4 text-xs text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{mfaErrorMsg}</span>
              </div>
            )}

            {adminData?.mfaEnabled ? (
              <div className="space-y-6">
                <div className="rounded-xl bg-emerald-50/70 p-4 border border-emerald-200/80 dark:bg-emerald-950/30 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    2FA Protection is currently active on your account
                  </p>
                  <p>
                    Every administrator sign-in challenge requires submitting a 6-digit TOTP code generated by your paired Authenticator app.
                  </p>
                </div>

                {/* Backup Codes Display */}
                {adminData.backupCodes && adminData.backupCodes.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Remaining Emergency Backup Codes ({adminData.backupCodes.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {adminData.backupCodes.map((code, idx) => (
                        <div 
                          key={idx} 
                          className="rounded-lg bg-slate-100 p-2 font-mono text-xs text-center text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                        >
                          {code}
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Each code can be used once if you lose access to your primary mobile Authenticator device.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Enrollment Step */
              <div className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* QR Code Container */}
                  <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
                    {qrDataUrl ? (
                      <img 
                        src={qrDataUrl} 
                        alt="2FA Setup QR Code" 
                        className="rounded-lg shadow-xs h-48 w-48 bg-white p-2"
                      />
                    ) : (
                      <div className="h-48 w-48 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse flex items-center justify-center text-xs">
                        Generating QR Code...
                      </div>
                    )}
                    <span className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 text-center">
                      Scan with Google Authenticator, Authy, or 1Password
                    </span>
                  </div>

                  {/* Manual Secret Key */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Manual Entry Secret Key
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={generatedSecret}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedSecret);
                            setCopiedSecret(true);
                            setTimeout(() => setCopiedSecret(false), 2000);
                          }}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                        >
                          {copiedSecret ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Verification Form */}
                    <form onSubmit={handleConfirmMfaActivation} className="space-y-3 pt-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Enter 6-digit confirmation code from app
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        pattern="[0-9]*"
                        placeholder="000 000"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center font-mono text-lg tracking-widest rounded-lg border border-slate-200 bg-white py-2 px-3 text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <button
                        type="submit"
                        className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                      >
                        Activate Two-Factor Authentication
                      </button>
                    </form>
                  </div>
                </div>

                {/* Backup codes preview */}
                {generatedBackupCodes.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30 space-y-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Emergency One-Time Recovery Codes
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Save these backup codes in a secure password manager. If your phone is lost, you can use these to sign in:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {generatedBackupCodes.map((code, idx) => (
                        <div 
                          key={idx} 
                          className="rounded bg-white p-1.5 font-mono text-[11px] text-center text-slate-800 dark:bg-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-800"
                        >
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      )}

      {/* TAB 3: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" />
              Administrative Audit Trail
            </h2>
            <span className="text-xs text-slate-400">Immutable security log</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                    <th className="py-3 px-4 font-semibold">Admin Account</th>
                    <th className="py-3 px-4 font-semibold">Action</th>
                    <th className="py-3 px-4 font-semibold">Resource Target</th>
                    <th className="py-3 px-4 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        No administrative actions recorded in audit log yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                          {log.adminEmail}
                        </td>
                        <td className="py-3 px-4">
                          <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-mono font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-500">
                          {log.targetResource}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Job Editor Modal */}
      <JobEditorModal
        job={editingJob}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingJob(null);
        }}
        onSave={handleSaveJob}
      />

    </div>
  );
};
