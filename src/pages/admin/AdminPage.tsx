import React, { useState, useEffect, useMemo } from 'react';
import { 
  Briefcase, 
  Building, 
  MapPin, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Star, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  RefreshCw, 
  ArrowLeft, 
  ExternalLink,
  Eye, 
  Sparkles,
  Layers,
  Check,
  TrendingUp,
  LogOut,
  User,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  Menu,
  X,
  Copy,
  FolderTree,
  ShieldCheck,
  CheckCircle,
  Users,
  UserPlus,
  ShieldAlert,
  Shield,
  KeyRound
} from 'lucide-react';
import { Job, JobStatus, WorkArrangement, JobType } from '../../types/job';
import { 
  subscribeToAllJobsForAdmin, 
  createJob, 
  updateJob, 
  deleteJob, 
  seedInitialJobsIfEmpty 
} from '../../services/jobService';
import { 
  Category, 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  subscribeToCategories 
} from '../../services/categoryService';
import { 
  ManagedUser, 
  UserRole, 
  UserStatus, 
  ROLE_DEFINITIONS 
} from '../../types/user';
import { 
  getUsers, 
  subscribeToUsers, 
  createUser, 
  updateUser, 
  deleteUser 
} from '../../services/userService';
import { testSupabaseConnection } from '../../lib/supabase';
import { 
  getAdminSession, 
  signOutAdmin, 
  onAdminAuthStateChange, 
  AdminSessionUser 
} from '../../services/adminAuthService';
import { JobFormModal } from '../../components/admin/JobFormModal';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { CategoryModal } from '../../components/admin/CategoryModal';
import { DeleteCategoryModal } from '../../components/admin/DeleteCategoryModal';
import { UserModal } from '../../components/admin/UserModal';
import { DeleteUserModal } from '../../components/admin/DeleteUserModal';
import { AdminProfileView } from '../../components/admin/AdminProfileView';
import { AdminFooter } from '../../components/admin/AdminFooter';
import { AdminThemeToggle } from '../../components/admin/AdminThemeToggle';
import { AdminLoginPage } from './AdminLoginPage';
import { formatSalary } from '../../utils/jobUtils';
import { useTheme } from '../../context/ThemeContext';

interface AdminPageProps {
  onNavigate: (path: string) => void;
}

type AdminTab = 'jobs' | 'categories' | 'users' | 'system' | 'profile';

function getInitialAdminTab(): AdminTab {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['jobs', 'categories', 'users', 'system', 'profile'].includes(tabParam)) {
      return tabParam as AdminTab;
    }
    const savedTab = localStorage.getItem('admin_active_tab');
    if (savedTab && ['jobs', 'categories', 'users', 'system', 'profile'].includes(savedTab)) {
      return savedTab as AdminTab;
    }
  }
  return 'jobs';
}

interface ResendAccountMenuProps {
  adminUser: AdminSessionUser;
  onNavigateProfile: (section: 'profile' | 'security') => void;
  onNavigateHome: () => void;
  onSignOut: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const ResendAccountMenu: React.FC<ResendAccountMenuProps> = ({
  adminUser,
  onNavigateProfile,
  onNavigateHome,
  onSignOut,
  className = '',
  style,
}) => {
  return (
    <div 
      style={style}
      className={`w-56 sm:w-60 rounded-xl border border-slate-200/90 bg-white p-1.5 shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/50 z-50 animate-in fade-in-0 zoom-in-95 duration-150 ${className}`}
    >
      {/* Header: User Email */}
      <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 font-normal truncate select-none border-b border-slate-100 dark:border-slate-800/80 mb-1">
        {adminUser.email}
      </div>

      {/* Menu Option: My profile */}
      <button
        type="button"
        onClick={() => onNavigateProfile('profile')}
        className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer block font-normal"
      >
        My profile
      </button>

      {/* Menu Option: Security */}
      <button
        type="button"
        onClick={() => onNavigateProfile('security')}
        className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer block font-normal"
      >
        Security
      </button>

      {/* Divider */}
      <div className="border-t border-slate-100 dark:border-slate-800/80 my-1" />

      {/* Menu Option: Homepage ↗ */}
      <button
        type="button"
        onClick={onNavigateHome}
        className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer font-normal"
      >
        <span>Homepage</span>
        <ArrowUpRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
      </button>

      {/* Divider */}
      <div className="border-t border-slate-100 dark:border-slate-800/80 my-1" />

      {/* Menu Option: Log out */}
      <button
        type="button"
        onClick={onSignOut}
        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer block font-normal"
      >
        Log out
      </button>
    </div>
  );
};

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { theme, toggleTheme } = useTheme();

  // Authentication State
  const [adminUser, setAdminUser] = useState<AdminSessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Active Tab & Sidebar State
  const [activeTab, setActiveTab] = useState<AdminTab>(getInitialAdminTab);

  const changeTab = (tab: AdminTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('admin_active_tab', tab);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.replaceState(null, '', url.pathname + url.search);
      } catch (err) {
        console.warn('Tab state URL sync notice:', err);
      }
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('tab') !== activeTab) {
        url.searchParams.set('tab', activeTab);
        window.history.replaceState(null, '', url.pathname + url.search);
      }
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        if (tabParam && ['jobs', 'categories', 'users', 'system', 'profile'].includes(tabParam)) {
          setActiveTab(tabParam as AdminTab);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_sidebar_collapsed') === 'true';
    }
    return false;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Profile dropdown and active section state
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [profileSection, setProfileSection] = useState<'profile' | 'security'>('profile');
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number } | null>(null);
  const sidebarProfileRef = React.useRef<HTMLDivElement>(null);

  const toggleProfileDropdown = () => {
    if (!isProfileDropdownOpen && sidebarProfileRef.current) {
      const rect = sidebarProfileRef.current.getBoundingClientRect();
      setDropdownCoords({
        top: Math.max(12, rect.top),
        left: rect.right + 8,
      });
    }
    setIsProfileDropdownOpen((prev) => !prev);
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (sidebarProfileRef.current && !sidebarProfileRef.current.contains(target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on window resize or scroll
  useEffect(() => {
    if (!isProfileDropdownOpen) return;
    const handleDismiss = () => setIsProfileDropdownOpen(false);
    window.addEventListener('resize', handleDismiss);
    window.addEventListener('scroll', handleDismiss, true);
    return () => {
      window.removeEventListener('resize', handleDismiss);
      window.removeEventListener('scroll', handleDismiss, true);
    };
  }, [isProfileDropdownOpen]);

  // Close dropdown when sidebar collapsed state changes
  useEffect(() => {
    setIsProfileDropdownOpen(false);
  }, [isSidebarCollapsed]);

  // Compute user name first letter for avatar badge
  const userInitial = useMemo(() => {
    const raw = (adminUser?.fullName || adminUser?.email || 'A').trim();
    return raw.charAt(0).toUpperCase();
  }, [adminUser?.fullName, adminUser?.email]);

  // Compute user display name / handle
  const userDisplayName = useMemo(() => {
    if (adminUser?.fullName) return adminUser.fullName;
    if (adminUser?.email) return adminUser.email.split('@')[0];
    return 'Admin';
  }, [adminUser?.fullName, adminUser?.email]);

  // Jobs State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Categories State
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categorySearch, setCategorySearch] = useState('');

  // Supabase Connection State
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const [checkingConnection, setCheckingConnection] = useState(false);

  // Jobs Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | JobStatus>('all');
  const [arrangementFilter, setWorkArrangementFilter] = useState<string>('all');
  const [jobTypeFilter, setJobTypeFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'salary' | 'title'>('newest');

  // Job Modals
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isDeleteJobModalOpen, setIsDeleteJobModalOpen] = useState(false);
  const [deletingJob, setDeletingJob] = useState<Job | null>(null);
  const [isDeletingJob, setIsDeletingJob] = useState(false);

  // Category Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // Users State
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | UserRole>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | UserStatus>('all');

  // User Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Toggle sidebar collapse and save preference
  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Check active Supabase admin session
  useEffect(() => {
    let mounted = true;
    getAdminSession()
      .then((user) => {
        if (mounted) {
          setAdminUser(user);
          setAuthLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setAuthLoading(false);
        }
      });

    const unsubscribe = onAdminAuthStateChange((user) => {
      if (mounted) {
        setAdminUser(user);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Handle Admin Sign Out
  const handleSignOut = async () => {
    await signOutAdmin();
    setAdminUser(null);
    showToast('Signed out of Supabase Admin Console.');
  };

  // Test Supabase connection
  const checkConnection = async () => {
    setCheckingConnection(true);
    try {
      const isAlive = await testSupabaseConnection();
      setSupabaseConnected(isAlive);
    } catch {
      setSupabaseConnected(false);
    } finally {
      setCheckingConnection(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  // Real-time subscription to Jobs
  useEffect(() => {
    if (!adminUser) return;

    setLoadingJobs(true);
    const unsubscribe = subscribeToAllJobsForAdmin(
      (updatedJobs) => {
        setJobs(updatedJobs);
        setLoadingJobs(false);
      },
      (err) => {
        console.warn('Jobs admin subscription notice:', err.message);
        setLoadingJobs(false);
      }
    );

    return () => unsubscribe();
  }, [adminUser]);

  // Real-time subscription to Categories
  useEffect(() => {
    if (!adminUser) return;

    setLoadingCategories(true);
    const unsubscribe = subscribeToCategories((updatedCats) => {
      setCategories(updatedCats);
      setLoadingCategories(false);
    });

    return () => unsubscribe();
  }, [adminUser]);

  // Real-time subscription to Users
  useEffect(() => {
    if (!adminUser) return;

    setLoadingUsers(true);
    const unsubscribe = subscribeToUsers((updatedUsers) => {
      setUsers(updatedUsers);
      setLoadingUsers(false);
    });

    return () => unsubscribe();
  }, [adminUser]);

  // Filtered Users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = 
        !userSearch.trim() ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.fullName && u.fullName.toLowerCase().includes(userSearch.toLowerCase()));

      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, userSearch, userRoleFilter, userStatusFilter]);

  // User Stats breakdown
  const userStats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === 'superadmin' || u.role === 'admin').length;
    const recruiters = users.filter((u) => u.role === 'recruiter').length;
    const active = users.filter((u) => u.status === 'active').length;
    return { total, admins, recruiters, active };
  }, [users]);

  // Map of category name to count of active roles
  const categoryJobCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    jobs.forEach((job) => {
      const cat = job.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [jobs]);

  // Available category names for job form dropdown
  const availableCategoryNames = useMemo(() => {
    if (categories.length > 0) {
      return categories.map((c) => c.name);
    }
    return [
      'Engineering',
      'Design & Creative',
      'Product Management',
      'Marketing & Growth',
      'Sales & Business Dev',
      'Operations & Strategy',
      'Finance & Accounting',
      'Customer Success & Support',
      'Data & AI',
      'Human Resources',
      'Other'
    ];
  }, [categories]);

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (statusFilter !== 'all' && job.status !== statusFilter) return false;
      if (arrangementFilter !== 'all' && job.workArrangement !== arrangementFilter) return false;
      if (jobTypeFilter !== 'all' && job.jobType !== jobTypeFilter) return false;
      if (selectedCategoryFilter !== 'all' && job.category !== selectedCategoryFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesCompany = job.companyName.toLowerCase().includes(q);
        const matchesLocation = job.location.toLowerCase().includes(q);
        const matchesTags = (job.tags || []).some((t) => t.toLowerCase().includes(q));
        const matchesCategory = (job.category || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCompany && !matchesLocation && !matchesTags && !matchesCategory) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      }
      if (sortBy === 'salary') {
        const salA = a.salaryMax || a.salaryMin || 0;
        const salB = b.salaryMax || b.salaryMin || 0;
        return salB - salA;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [jobs, statusFilter, arrangementFilter, jobTypeFilter, selectedCategoryFilter, searchQuery, sortBy]);

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const q = categorySearch.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q)
    );
  }, [categories, categorySearch]);

  // Jobs Statistics
  const stats = useMemo(() => {
    const total = jobs.length;
    const published = jobs.filter((j) => j.status === 'published').length;
    const draft = jobs.filter((j) => j.status === 'draft').length;
    const archived = jobs.filter((j) => j.status === 'archived').length;
    const featured = jobs.filter((j) => j.featured).length;
    const remote = jobs.filter((j) => j.workArrangement === 'remote').length;
    return { total, published, draft, archived, featured, remote };
  }, [jobs]);

  // Handle Job Form Submit
  const handleJobFormSubmit = async (jobData: Omit<Job, 'id'>, jobId?: string) => {
    if (jobId) {
      await updateJob(jobId, jobData);
      showToast(`Updated "${jobData.title}" in Supabase.`);
    } else {
      await createJob(jobData);
      showToast(`Published "${jobData.title}" live to Supabase.`);
    }
    setEditingJob(null);
  };

  // Handle Quick Status Switch
  const handleToggleJobStatus = async (job: Job, newStatus: JobStatus) => {
    try {
      await updateJob(job.id, { 
        status: newStatus,
        publishedAt: newStatus === 'published' ? new Date().toISOString() : job.publishedAt
      });
      showToast(`Status updated to ${newStatus}.`);
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  // Handle Quick Featured Toggle
  const handleToggleJobFeatured = async (job: Job) => {
    try {
      await updateJob(job.id, { featured: !job.featured });
      showToast(`Spotlight ${!job.featured ? 'enabled' : 'disabled'} for "${job.title}".`);
    } catch (err: any) {
      alert(`Failed to toggle spotlight: ${err.message}`);
    }
  };

  // Handle Delete Job
  const handleDeleteJobConfirm = async (jobId: string) => {
    try {
      setIsDeletingJob(true);
      await deleteJob(jobId);
      showToast('Job listing deleted from Supabase.');
      setIsDeleteJobModalOpen(false);
      setDeletingJob(null);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setIsDeletingJob(false);
    }
  };

  // Handle Category Form Submit (Add or Edit)
  const handleCategorySubmit = async (
    data: { name: string; slug: string; description?: string },
    categoryId?: string
  ) => {
    if (categoryId) {
      await updateCategory(categoryId, data);
      showToast(`Department "${data.name}" updated successfully.`);
    } else {
      await createCategory(data);
      showToast(`Department "${data.name}" created with slug /category/${data.slug}.`);
    }
    setEditingCategory(null);
  };

  // Handle Delete Category
  const handleDeleteCategoryConfirm = async (categoryId: string) => {
    try {
      setIsDeletingCategory(true);
      await deleteCategory(categoryId);
      showToast('Department removed from Supabase.');
      setIsDeleteCategoryModalOpen(false);
      setDeletingCategory(null);
    } catch (err: any) {
      alert(`Failed to delete category: ${err.message}`);
    } finally {
      setIsDeletingCategory(false);
    }
  };

  // Handle User Submit (Create or Update)
  const handleUserSubmit = async (
    data: {
      fullName: string;
      email: string;
      role: UserRole;
      password?: string;
      status?: UserStatus;
    },
    userId?: string
  ) => {
    if (userId) {
      await updateUser(userId, {
        fullName: data.fullName,
        role: data.role,
        status: data.status,
        password: data.password
      });
      showToast(`User account "${data.email}" updated successfully.`);
    } else {
      if (!data.password) {
        throw new Error('Password is required for provisioning a new user.');
      }
      await createUser({
        fullName: data.fullName,
        email: data.email,
        role: data.role,
        password: data.password
      });
      showToast(`New user "${data.email}" provisioned and created in Supabase.`);
    }
    setEditingUser(null);
  };

  // Handle Delete User Confirm
  const handleDeleteUserConfirm = async (userId: string) => {
    try {
      setIsDeletingUser(true);
      await deleteUser(userId);
      showToast('User removed from platform directory.');
      setIsDeleteUserModalOpen(false);
      setDeletingUser(null);
    } catch (err: any) {
      alert(`Failed to delete user: ${err.message}`);
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Copy slug helper
  const handleCopySlug = (slug: string) => {
    const fullUrl = `${window.location.origin}/category/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    showToast(`Copied ${fullUrl} to clipboard!`);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // Handle Re-seed Sample Jobs
  const handleSeedData = async () => {
    if (confirm('Sync and ensure sample verified jobs are populated into Supabase?')) {
      await seedInitialJobsIfEmpty();
      showToast('Verified sample jobs synced to Supabase.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <span className="h-9 w-9 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent dark:border-indigo-400" />
        <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Verifying Supabase administrative credentials...
        </p>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <AdminLoginPage
        onLoginSuccess={(user) => {
          setAdminUser(user);
          showToast(`Welcome back, ${user.email}`);
        }}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className="h-screen h-[100dvh] flex overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900/95 px-4 py-3 text-xs font-semibold text-white shadow-2xl backdrop-blur-md dark:bg-white dark:text-slate-900 animate-in slide-in-from-bottom-5 duration-300 border border-slate-700 dark:border-slate-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* LEFT SIDE COLLAPSIBLE SIDEBAR - FIXED & NON-SCROLLABLE */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 flex flex-col h-full shrink-0 border-r border-slate-200 bg-white/95 backdrop-blur-md transition-all duration-300 dark:border-slate-800 dark:bg-slate-900/95 md:relative md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${
          isSidebarCollapsed ? 'md:w-20' : 'md:w-64'
        }`}
      >
        {/* Sidebar Brand Header - Text branding & Admin Panel text removed */}
        <div className={`flex h-16 items-center border-b border-slate-200 px-4 dark:border-slate-800 shrink-0 ${
          isSidebarCollapsed ? 'justify-center' : 'justify-between'
        }`}>
          <div className="flex items-center overflow-hidden">
            <button 
              onClick={() => onNavigate('/')}
              className="flex items-center group shrink-0 cursor-pointer"
              title="Return to public portal"
            >
              <img 
                src={isSidebarCollapsed ? "/logo/logo-q.svg" : "/logo/logo.svg"} 
                alt="inaquired" 
                className={`site-logo object-contain transition-all duration-200 group-hover:scale-105 ${
                  isSidebarCollapsed ? "h-7 w-7" : "h-8 w-auto max-w-[130px]"
                }`}
              />
            </button>
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden md:flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex md:hidden h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Resend-Style User Profile Switcher Trigger (Pinned at top, outside scrolling container) */}
        {adminUser && (
          <div className="p-3 border-b border-slate-100 dark:border-slate-800/60 shrink-0 relative" ref={sidebarProfileRef}>
            <button
              type="button"
              onClick={toggleProfileDropdown}
              className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group ${
                isProfileDropdownOpen ? 'bg-slate-100 dark:bg-slate-800' : ''
              } ${isSidebarCollapsed ? 'justify-center px-1' : ''}`}
              title="Account menu"
              aria-expanded={isProfileDropdownOpen}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {/* Rounded Square Letter Avatar like Resend */}
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#6d28d9] text-white font-bold text-xs shadow-xs select-none">
                  {userInitial}
                </div>
                {!isSidebarCollapsed && (
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {userDisplayName}
                  </span>
                )}
              </div>
              {!isSidebarCollapsed && (
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                  isProfileDropdownOpen ? 'rotate-180' : ''
                }`} />
              )}
            </button>

            {/* Resend-Style Dropdown Menu Popover */}
            {isProfileDropdownOpen && (
              <ResendAccountMenu
                adminUser={adminUser}
                onNavigateProfile={(section) => {
                  setProfileSection(section);
                  changeTab('profile');
                  setIsProfileDropdownOpen(false);
                  setIsMobileMenuOpen(false);
                }}
                onNavigateHome={() => {
                  setIsProfileDropdownOpen(false);
                  setIsMobileMenuOpen(false);
                  onNavigate('/');
                }}
                onSignOut={() => {
                  setIsProfileDropdownOpen(false);
                  setIsMobileMenuOpen(false);
                  handleSignOut();
                }}
                className={isSidebarCollapsed ? '!fixed z-[9999]' : 'absolute left-3 right-3 top-full mt-1.5 z-50'}
                style={
                  isSidebarCollapsed && dropdownCoords
                    ? {
                        position: 'fixed',
                        top: `${dropdownCoords.top}px`,
                        left: `${dropdownCoords.left}px`,
                        zIndex: 9999,
                      }
                    : undefined
                }
              />
            )}
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 space-y-1.5 p-3 overflow-y-auto">
          {/* Section: Main Features */}
          <div className="pt-1">
            {!isSidebarCollapsed && (
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Management
              </p>
            )}

            {/* Jobs Navigation Tab */}
            <button
              onClick={() => {
                changeTab('jobs');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'jobs'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 dark:bg-indigo-600'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title="Manage Job Listings"
            >
              <Briefcase className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && (
                <div className="flex flex-1 items-center justify-between text-left truncate">
                  <span>Job Listings</span>
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === 'jobs'
                      ? 'bg-indigo-700 text-white'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {jobs.length}
                  </span>
                </div>
              )}
            </button>

            {/* Categories & Departments Navigation Tab */}
            <button
              onClick={() => {
                changeTab('categories');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full mt-1.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'categories'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 dark:bg-indigo-600'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title="Manage Departments & URL Slugs"
            >
              <FolderTree className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && (
                <div className="flex flex-1 items-center justify-between text-left truncate">
                  <span>Departments</span>
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === 'categories'
                      ? 'bg-indigo-700 text-white'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {categories.length}
                  </span>
                </div>
              )}
            </button>

            {/* Users & Team Navigation Tab */}
            <button
              onClick={() => {
                changeTab('users');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full mt-1.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 dark:bg-indigo-600'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title="Manage Admin & Team Users"
            >
              <Users className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && (
                <div className="flex flex-1 items-center justify-between text-left truncate">
                  <span>Users & Access</span>
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === 'users'
                      ? 'bg-indigo-700 text-white'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {users.length}
                  </span>
                </div>
              )}
            </button>

            {/* Database & System Status Navigation Tab */}
            <button
              onClick={() => {
                changeTab('system');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full mt-1.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'system'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 dark:bg-indigo-600'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title="Supabase Database & System Settings"
            >
              <Database className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && (
                <div className="flex flex-1 items-center justify-between text-left truncate">
                  <span>Database Sync</span>
                  <span className={`h-2 w-2 rounded-full ${
                    supabaseConnected === true 
                      ? 'bg-emerald-500 animate-pulse' 
                      : supabaseConnected === false 
                      ? 'bg-amber-500' 
                      : 'bg-slate-400'
                  }`} />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* SIDEBAR FOOTER: THEME TOGGLE */}
        <div className="border-t border-slate-200 p-3 dark:border-slate-800 shrink-0">
          <AdminThemeToggle isCollapsed={isSidebarCollapsed} variant="sidebar" />
        </div>
      </aside>

      {/* MAIN VIEWPORT CONTAINER - SCROLLABLE PAGE CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        
        {/* TOP STATUS & CONTEXT BAR */}
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white/90 px-4 sm:px-6 lg:px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 transition-all duration-300">
          <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
            
            {/* Left: Mobile Toggle & Tab Breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Open navigation menu"
              >
                <Menu className="h-4 w-4" />
              </button>

              <div>
                <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white capitalize">
                  {activeTab === 'jobs' && 'Job Listings Management'}
                  {activeTab === 'categories' && 'Departments & URL Slugs'}
                  {activeTab === 'users' && 'Team & User Access Control'}
                  {activeTab === 'profile' && 'Administrator Profile & Credentials'}
                  {activeTab === 'system' && 'Database & System Settings'}
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  {activeTab === 'jobs' && 'Create, edit, spotlight, and publish open positions.'}
                  {activeTab === 'categories' && 'Add, update, or remove departments and customize URL slugs.'}
                  {activeTab === 'users' && 'Provision roles, manage administrative credentials, and audit users.'}
                  {activeTab === 'profile' && 'Manage your account name, contact email, and administrative password.'}
                  {activeTab === 'system' && 'Supabase PostgreSQL live connection and database synchronization.'}
                </p>
              </div>
            </div>

            {/* Right: Quick Contextual CTAs */}
            <div className="flex items-center gap-2.5">
              {/* Context Action Button */}
              {activeTab === 'jobs' && (
                <button
                  onClick={() => {
                    setEditingJob(null);
                    setIsJobModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Post New Job</span>
                </button>
              )}

              {activeTab === 'categories' && (
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setIsCategoryModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Department</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT AREA BASED ON ACTIVE TAB */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-6 transition-all duration-300 ease-in-out">

          {/* TAB 1: JOBS MANAGEMENT */}
          {activeTab === 'jobs' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Analytics Metric Cards */}
              <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Listings</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{stats.total}</p>
                </div>

                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 shadow-xs dark:border-emerald-950/60 dark:bg-emerald-950/20">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Published Live</p>
                  <p className="mt-1 text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">{stats.published}</p>
                </div>

                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-xs dark:border-amber-950/60 dark:bg-amber-950/20">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Drafts</p>
                  <p className="mt-1 text-2xl font-extrabold text-amber-700 dark:text-amber-300">{stats.draft}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Archived</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-700 dark:text-slate-300">{stats.archived}</p>
                </div>

                <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-4 shadow-xs dark:border-indigo-950/60 dark:bg-indigo-950/20">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Spotlight</p>
                  <p className="mt-1 text-2xl font-extrabold text-indigo-700 dark:text-indigo-300">{stats.featured}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Remote</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{stats.remote}</p>
                </div>
              </section>

              {/* Filter & Search Bar */}
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                  
                  {/* Keyword Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search roles by title, company, skills, or department..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Filter Dropdowns */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                    >
                      <option value="all">All Statuses</option>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>

                    {/* Department / Category Filter */}
                    <select
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                    >
                      <option value="all">All Departments</option>
                      {availableCategoryNames.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>

                    {/* Arrangement Filter */}
                    <select
                      value={arrangementFilter}
                      onChange={(e) => setWorkArrangementFilter(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                    >
                      <option value="all">All Workstyles</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="on-site">On-Site</option>
                    </select>

                    {/* Sort Order */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                    >
                      <option value="newest">Sort: Newest</option>
                      <option value="salary">Sort: Salary (High to Low)</option>
                      <option value="title">Sort: Title (A-Z)</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Jobs Table */}
              <section className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
                {loadingJobs ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <span className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent dark:border-indigo-400" />
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Loading listings from Supabase...</p>
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Briefcase className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                    <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">No job listings found</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {searchQuery || statusFilter !== 'all' || selectedCategoryFilter !== 'all'
                        ? 'Try clearing or relaxing your search filters.'
                        : 'Get started by creating your first job listing.'}
                    </p>
                    <button
                      onClick={() => {
                        setEditingJob(null);
                        setIsJobModalOpen(true);
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Post Job</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                        <tr>
                          <th className="py-3 pl-5 pr-3">Job & Organization</th>
                          <th className="px-3 py-3 w-40 whitespace-nowrap">Department</th>
                          <th className="px-3 py-3 w-32 whitespace-nowrap">Workstyle</th>
                          <th className="px-3 py-3 w-48 text-center whitespace-nowrap">Status</th>
                          <th className="px-3 py-3 w-24 text-center whitespace-nowrap">Spotlight</th>
                          <th className="py-3 pl-3 pr-5 w-32 text-right whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {filteredJobs.map((job) => {
                          const isPublished = job.status === 'published';
                          const isDraft = job.status === 'draft';
                          const isArchived = job.status === 'archived';

                          return (
                            <tr 
                              key={job.id}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              {/* Job Title & Company */}
                              <td className="py-3.5 pl-5 pr-3">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-900 dark:text-white line-clamp-1">
                                    {job.title}
                                  </span>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                    <span>{job.companyName}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {job.location}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Department */}
                              <td className="px-3 py-3.5 whitespace-nowrap">
                                <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                                  {job.category || 'Engineering'}
                                </span>
                              </td>

                              {/* Work Arrangement */}
                              <td className="px-3 py-3.5 whitespace-nowrap capitalize text-slate-600 dark:text-slate-400">
                                {job.workArrangement}
                              </td>

                              {/* Status Toggle Switcher */}
                              <td className="px-3 py-3.5 text-center whitespace-nowrap">
                                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-950">
                                  <button
                                    onClick={() => handleToggleJobStatus(job, 'published')}
                                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition-all ${
                                      isPublished
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                    }`}
                                    title="Publish live to candidates"
                                  >
                                    Live
                                  </button>
                                  <button
                                    onClick={() => handleToggleJobStatus(job, 'draft')}
                                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition-all ${
                                      isDraft
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                    }`}
                                    title="Save as Draft"
                                  >
                                    Draft
                                  </button>
                                  <button
                                    onClick={() => handleToggleJobStatus(job, 'archived')}
                                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition-all ${
                                      isArchived
                                        ? 'bg-slate-700 text-white shadow-xs'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                    }`}
                                    title="Archive role"
                                  >
                                    Archive
                                  </button>
                                </div>
                              </td>

                              {/* Featured Spotlight */}
                              <td className="px-3 py-3.5 text-center whitespace-nowrap">
                                <button
                                  onClick={() => handleToggleJobFeatured(job)}
                                  className={`p-1.5 rounded-lg border transition-colors ${
                                    job.featured
                                      ? 'bg-amber-50 text-amber-500 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800'
                                      : 'text-slate-400 hover:text-slate-600 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                                  }`}
                                  title={job.featured ? 'Remove featured badge' : 'Spotlight on homepage'}
                                >
                                  <Star className={`h-4 w-4 ${job.featured ? 'fill-amber-400' : ''}`} />
                                </button>
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => onNavigate(`/jobs/${job.slug}`)}
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                                    title="View role page on site"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingJob(job);
                                      setIsJobModalOpen(true);
                                    }}
                                    className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50 transition-colors"
                                    title="Edit listing"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeletingJob(job);
                                      setIsDeleteJobModalOpen(true);
                                    }}
                                    className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50 transition-colors"
                                    title="Delete from Supabase"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 2: CATEGORIES & DEPARTMENTS MANAGEMENT */}
          {activeTab === 'categories' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Category Management Info Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FolderTree className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Job Departments & URL Slugs</span>
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
                    Configure classifications, department descriptions, and SEO-friendly URL slugs (<code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] font-mono text-indigo-600 dark:bg-slate-800 dark:text-indigo-300">/category/:slug</code>). Real-time changes sync directly to Supabase.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setIsCategoryModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-all shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Department</span>
                </button>
              </div>

              {/* Search & Stats Filter */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Search departments by name or URL slug..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  {categorySearch && (
                    <button
                      onClick={() => setCategorySearch('')}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span>Showing <strong>{filteredCategories.length}</strong> of <strong>{categories.length}</strong> departments</span>
                </div>
              </div>

              {/* Categories Table */}
              <section className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
                {loadingCategories ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <span className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent dark:border-indigo-400" />
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Loading departments from Supabase...</p>
                  </div>
                ) : filteredCategories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Layers className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                    <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">No departments found</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {categorySearch ? 'Try a different search keyword.' : 'Add your first job department to get started.'}
                    </p>
                    <button
                      onClick={() => {
                        setEditingCategory(null);
                        setIsCategoryModalOpen(true);
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Department</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                        <tr>
                          <th className="py-3 pl-5 pr-3">Department Name</th>
                          <th className="px-3 py-3">URL Slug</th>
                          <th className="px-3 py-3">Description</th>
                          <th className="px-3 py-3 text-center">Active Roles</th>
                          <th className="py-3 pl-3 pr-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {filteredCategories.map((cat) => {
                          const roleCount = categoryJobCounts[cat.name] || 0;
                          const isCopied = copiedSlug === cat.slug;

                          return (
                            <tr 
                              key={cat.id}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              {/* Department Name */}
                              <td className="py-3.5 pl-5 pr-3 whitespace-nowrap">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                                    <Layers className="h-3.5 w-3.5" />
                                  </div>
                                  <span className="font-bold text-slate-900 dark:text-white">
                                    {cat.name}
                                  </span>
                                </div>
                              </td>

                              {/* URL Slug Pill with Copy */}
                              <td className="px-3 py-3.5 whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                                  <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                                    /category/{cat.slug}
                                  </span>
                                  <button
                                    onClick={() => handleCopySlug(cat.slug)}
                                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                    title="Copy category URL"
                                  >
                                    {isCopied ? (
                                      <Check className="h-3 w-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              {/* Description */}
                              <td className="px-3 py-3.5 max-w-xs truncate text-slate-500 dark:text-slate-400">
                                {cat.description || <span className="italic text-slate-400">No description provided</span>}
                              </td>

                              {/* Associated Job Count */}
                              <td className="px-3 py-3.5 text-center whitespace-nowrap">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                  roleCount > 0
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                  {roleCount} {roleCount === 1 ? 'role' : 'roles'}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingCategory(cat);
                                      setIsCategoryModalOpen(true);
                                    }}
                                    className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50 transition-colors"
                                    title="Edit department name and URL slug"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeletingCategory(cat);
                                      setIsDeleteCategoryModalOpen(true);
                                    }}
                                    className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50 transition-colors"
                                    title="Delete department"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 3: USERS & TEAM ACCESS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Users Header Info Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Team & User Access Control</span>
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
                    Provision administrator accounts, assign security roles, and manage access to the inaquired console. All users are authenticated directly against Supabase Auth.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingUser(null);
                    setIsUserModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-all shrink-0"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add User</span>
                </button>
              </div>

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Total Users</span>
                    <Users className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white">{userStats.total}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider dark:text-indigo-400">Administrators</span>
                    <Shield className="h-4 w-4 text-indigo-500" />
                  </div>
                  <p className="mt-2 text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{userStats.admins}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider dark:text-emerald-400">Recruiters</span>
                    <Briefcase className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="mt-2 text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{userStats.recruiters}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Active</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white">{userStats.active}</p>
                </div>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name or email address..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  {userSearch && (
                    <button
                      onClick={() => setUserSearch('')}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Role Filter */}
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value as any)}
                    className="rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="superadmin">Super Admin</option>
                    <option value="admin">Administrator</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="editor">Content Editor</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value as any)}
                    className="rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <section className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
                {loadingUsers ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <span className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent dark:border-indigo-400" />
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Loading user accounts from Supabase...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Users className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                    <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">No users found</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {userSearch ? 'Try a different search query or reset filters.' : 'Add your first administrator or team member.'}
                    </p>
                    <button
                      onClick={() => {
                        setEditingUser(null);
                        setIsUserModalOpen(true);
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Add User</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                        <tr>
                          <th className="py-3 pl-5 pr-3">User & Email</th>
                          <th className="px-3 py-3">Role</th>
                          <th className="px-3 py-3 text-center">Status</th>
                          <th className="px-3 py-3">Provisioned Date</th>
                          <th className="py-3 pl-3 pr-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {filteredUsers.map((u) => {
                          const isSelf = u.email.toLowerCase() === adminUser?.email.toLowerCase();
                          const roleDef = ROLE_DEFINITIONS[u.role] || { label: u.role, badgeColor: 'bg-slate-100 text-slate-700' };
                          const initials = (u.fullName || u.email)
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase();

                          return (
                            <tr 
                              key={u.id}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              {/* User Info */}
                              <td className="py-3.5 pl-5 pr-3 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-xs shadow-xs">
                                    {initials}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-900 dark:text-white">
                                        {u.fullName || 'Administrator'}
                                      </span>
                                      {isSelf && (
                                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                                          You
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                      {u.email}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Role */}
                              <td className="px-3 py-3.5 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold border ${roleDef.badgeColor}`}>
                                  <Shield className="h-3 w-3" />
                                  {roleDef.label}
                                </span>
                              </td>

                              {/* Status */}
                              <td className="px-3 py-3.5 text-center whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                  u.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50'
                                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/50'
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                  <span className="capitalize">{u.status}</span>
                                </span>
                              </td>

                              {/* Created Date */}
                              <td className="px-3 py-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400">
                                {new Date(u.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingUser(u);
                                      setIsUserModalOpen(true);
                                    }}
                                    className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50 transition-colors"
                                    title="Edit user details, role or reset password"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeletingUser(u);
                                      setIsDeleteUserModalOpen(true);
                                    }}
                                    disabled={isSelf}
                                    className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title={isSelf ? 'Cannot delete your active account' : 'Delete user'}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 4: SYSTEM & DATABASE SETTINGS */}
          {activeTab === 'system' && (
            <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl">
              
              {/* Connection Diagnostics Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        Supabase PostgreSQL Live Connection
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Primary relational database hosted at db.wnpsrdtlqxfiglhmalwq.supabase.co
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={checkConnection}
                    disabled={checkingConnection}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${checkingConnection ? 'animate-spin' : ''}`} />
                    <span>Test Latency</span>
                  </button>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Status</span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${supabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {supabaseConnected ? 'Online & Synchronized' : 'Offline Mode Active'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Schema Version</span>
                    <p className="mt-1 text-xs font-mono font-bold text-slate-900 dark:text-white">
                      002_categories_schema
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Realtime WebSockets</span>
                    <p className="mt-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Active (public:jobs, public:categories)
                    </p>
                  </div>
                </div>
              </div>

              {/* Maintenance & Data Actions */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Database Operations & Recovery
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Safely populate initial seed data or re-verify sample listings in case of fresh deployment.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleSeedData}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-2.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-300 dark:hover:bg-indigo-950/70 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Sync Sample Jobs into Supabase</span>
                  </button>

                  <button
                    onClick={() => {
                      checkConnection();
                      showToast('Database channels reconnected.');
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Re-verify Connection Channels</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && adminUser && (
            <AdminProfileView
              adminUser={adminUser}
              onUpdateAdminUser={(updated) => {
                setAdminUser(updated);
              }}
              onShowToast={showToast}
              initialSection={profileSection}
            />
          )}

          </div>
        </main>

        {/* Branded Admin Footer */}
        <AdminFooter
          onNavigate={onNavigate}
          supabaseConnected={supabaseConnected}
        />
      </div>

      {/* CREATE / EDIT JOB MODAL */}
      <JobFormModal
        isOpen={isJobModalOpen}
        onClose={() => {
          setIsJobModalOpen(false);
          setEditingJob(null);
        }}
        onSubmit={handleJobFormSubmit}
        initialJob={editingJob}
        categoriesList={availableCategoryNames}
      />

      {/* DELETE JOB CONFIRM MODAL */}
      <DeleteConfirmModal
        isOpen={isDeleteJobModalOpen}
        job={deletingJob}
        onClose={() => {
          setIsDeleteJobModalOpen(false);
          setDeletingJob(null);
        }}
        onConfirm={handleDeleteJobConfirm}
        isDeleting={isDeletingJob}
      />

      {/* CREATE / EDIT CATEGORY MODAL */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleCategorySubmit}
        initialCategory={editingCategory}
      />

      {/* DELETE CATEGORY CONFIRM MODAL */}
      <DeleteCategoryModal
        isOpen={isDeleteCategoryModalOpen}
        category={deletingCategory}
        onClose={() => {
          setIsDeleteCategoryModalOpen(false);
          setDeletingCategory(null);
        }}
        onConfirm={handleDeleteCategoryConfirm}
        isDeleting={isDeletingCategory}
        jobCount={deletingCategory ? categoryJobCounts[deletingCategory.name] || 0 : 0}
      />

      {/* CREATE / EDIT USER MODAL */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleUserSubmit}
        initialUser={editingUser}
        currentAdminEmail={adminUser?.email}
      />

      {/* DELETE USER CONFIRM MODAL */}
      <DeleteUserModal
        isOpen={isDeleteUserModalOpen}
        user={deletingUser}
        onClose={() => {
          setIsDeleteUserModalOpen(false);
          setDeletingUser(null);
        }}
        onConfirm={handleDeleteUserConfirm}
        isDeleting={isDeletingUser}
        currentAdminEmail={adminUser?.email}
      />

    </div>
  );
};
