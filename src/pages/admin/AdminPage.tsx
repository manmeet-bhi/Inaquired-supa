import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building, 
  MapPin,
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
  FolderOpen,
  ShieldCheck,
  CheckCircle,
  Users,
  ShieldAlert,
  Shield,
  KeyRound,
  LayoutDashboard,
  Globe
} from 'lucide-react';
import { JobIcon } from '../../components/icons/JobIcon';
import { Job, JobStatus, WorkArrangement, JobType } from '../../types/job';
import { 
  subscribeToAllJobsForAdmin, 
  createJob, 
  updateJob, 
  deleteJob 
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
  isAdminTwoFactorVerified,
  signOutAdmin,
  onAdminAuthStateChange,
  AdminSessionUser
} from '../../services/adminAuthService';
import { JobEditorPage } from '../../components/admin/JobEditorPage';
import { CategoryEditorPage } from '../../components/admin/CategoryEditorPage';
import { UserEditorPage } from '../../components/admin/UserEditorPage';
import { AdminHomeDashboard } from '../../components/admin/AdminHomeDashboard';
import { SeoPanel } from '../../components/admin/SeoPanel';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { DeleteCategoryModal } from '../../components/admin/DeleteCategoryModal';
import { DeleteUserModal } from '../../components/admin/DeleteUserModal';
import { AdminProfileView } from '../../components/admin/AdminProfileView';
import { AdminFooter } from '../../components/admin/AdminFooter';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminThemeToggle } from '../../components/admin/AdminThemeToggle';
import { AdminLoginPage } from './AdminLoginPage';
import { get2FaStatus } from '../../services/twoFactorService';
import { formatSalary } from '../../utils/jobUtils';
import { useTheme } from '../../context/ThemeContext';

interface AdminPageProps {
  onNavigate: (path: string) => void;
}

export type AdminTab = 'home' | 'jobs' | 'categories' | 'users' | 'seo' | 'profile';

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

export interface AdminRouteState {
  tab: AdminTab;
  isJobEditorOpen: boolean;
  editingJobId: string | null;
  isCategoryEditorOpen: boolean;
  editingCategoryId: string | null;
  isUserEditorOpen: boolean;
  editingUserId: string | null;
  statusFilter?: 'all' | JobStatus;
  page?: number;
}

export function parseAdminPath(pathname: string): AdminRouteState {
  const [pathOnly, searchOnly] = pathname.split('?');
  const searchParams = new URLSearchParams(searchOnly || (typeof window !== 'undefined' ? window.location.search : ''));
  const clean = (pathOnly || '/admin').replace(/\/+$/, '') || '/admin';

  let initialStatusFilter: ('all' | JobStatus) | undefined;
  const statusParam = searchParams.get('status');
  if (statusParam && ['all', 'published', 'draft', 'archived'].includes(statusParam)) {
    initialStatusFilter = statusParam as 'all' | JobStatus;
  }

  let initialPage: number | undefined;
  const pageParam = parseInt(searchParams.get('page') || '', 10);
  if (!isNaN(pageParam) && pageParam > 0) {
    initialPage = pageParam;
  }

  // 1. Home Dashboard: /admin or /admin/home or /admin/dashboard
  if (clean === '/admin' || clean === '/admin/home' || clean === '/admin/dashboard') {
    return {
      tab: 'home',
      isJobEditorOpen: false,
      editingJobId: null,
      isCategoryEditorOpen: false,
      editingCategoryId: null,
      isUserEditorOpen: false,
      editingUserId: null,
      page: initialPage,
    };
  }

  // Dedicated Drafts route: /admin/drafts or /admin/jobs/drafts
  if (clean === '/admin/drafts' || clean === '/admin/jobs/drafts') {
    return {
      tab: 'jobs',
      isJobEditorOpen: false,
      editingJobId: null,
      isCategoryEditorOpen: false,
      editingCategoryId: null,
      isUserEditorOpen: false,
      editingUserId: null,
      statusFilter: 'draft',
      page: initialPage,
    };
  }

  // Dedicated Archived route: /admin/archived or /admin/jobs/archived
  if (clean === '/admin/archived' || clean === '/admin/jobs/archived') {
    return {
      tab: 'jobs',
      isJobEditorOpen: false,
      editingJobId: null,
      isCategoryEditorOpen: false,
      editingCategoryId: null,
      isUserEditorOpen: false,
      editingUserId: null,
      statusFilter: 'archived',
      page: initialPage,
    };
  }

  // 2. Jobs: /admin/jobs
  if (clean === '/admin/jobs') {
    return {
      tab: 'jobs',
      isJobEditorOpen: false,
      editingJobId: null,
      isCategoryEditorOpen: false,
      editingCategoryId: null,
      isUserEditorOpen: false,
      editingUserId: null,
      statusFilter: initialStatusFilter || 'all',
      page: initialPage,
    };
  }

  // 3. Add Job: /admin/add-new-job or /admin/jobs/new or /admin/new-job
  if (clean === '/admin/add-new-job' || clean === '/admin/jobs/new' || clean === '/admin/new-job') {
    return {
      tab: 'jobs',
      isJobEditorOpen: true,
      editingJobId: null,
      isCategoryEditorOpen: false,
      editingCategoryId: null,
      isUserEditorOpen: false,
      editingUserId: null,
    };
  }

  // 4. Edit Job: /admin/edit-job/:id
  const editJobMatch = clean.match(/^\/admin\/(?:edit-job|jobs\/edit)\/([^/]+)$/);
  if (editJobMatch) {
    return {
      tab: 'jobs',
      isJobEditorOpen: true,
      editingJobId: editJobMatch[1],
      isCategoryEditorOpen: false,
      editingCategoryId: null,
      isUserEditorOpen: false,
      editingUserId: null,
    };
  }

  // 5. Departments: /admin/departments or /admin/categories
  if (clean === '/admin/departments' || clean === '/admin/categories') {
    return {
      tab: 'categories',
      isJobEditorOpen: false,
      editingJobId: null,
      isCategoryEditorOpen: false,
      editingCategoryId: null,
      isUserEditorOpen: false,
      editingUserId: null,
      page: initialPage,
    };
  }

  // 6. Add Department: /admin/add-new-department or /admin/departments/new or /admin/add-new-category
  if (
    clean === '/admin/add-new-department' ||
    clean === '/admin/departments/new' ||
    clean === '/admin/new-department' ||
    clean === '/admin/add-new-category' ||
    clean === '/admin/categories/new'
  ) {
    return {
      tab: 'categories',
      isJobEditorOpen: false,
      editingJobId: null,
      isCategoryEditorOpen: true,
      editingCategoryId: null,
      isUserEditorOpen: false,
      editingUserId: null,
    };
  }

  // 7. Edit Department: /admin/edit-department/:id
  const editCategoryMatch = clean.match(/^\/admin\/(?:edit-department|departments\/edit|edit-category|categories\/edit)\/([^/]+)$/);
  if (editCategoryMatch) {
    return {
      tab: 'categories',
      isJobEditorOpen: false,
      editingJobId: null,
      isCategoryEditorOpen: true,
      editingCategoryId: editCategoryMatch[1],
      isUserEditorOpen: false,
      editingUserId: null,
    };
  }

  // 8. Users: /admin/users or /admin/team
  if (clean === '/admin/users' || clean === '/admin/team') {
    return {
      tab: 'users',
      isJobEditorOpen: false,
      editingJobId: null,
      isCategoryEditorOpen: false,
      editingCategoryId: null,
      isUserEditorOpen: false,
      editingUserId: null,
    };
  }

  // 9. Add User: /admin/add-new-user or /admin/users/new or /admin/new-user
  if (clean === '/admin/add-new-user' || clean === '/admin/users/new' || clean === '/admin/new-user') {
    return {
      tab: 'users',
      isJobEditorOpen: false,
      editingJobId: null,
      isCategoryEditorOpen: false,
      editingCategoryId: null,
      isUserEditorOpen: true,
      editingUserId: null,
    };
  }

  // 10. Edit User: /admin/edit-user/:id
  const editUserMatch = clean.match(/^\/admin\/(?:edit-user|users\/edit)\/([^/]+)$/);
  if (editUserMatch) {
    return {
      tab: 'users',
      isJobEditorOpen: false,
      editingJobId: null,
      isCategoryEditorOpen: false,
      editingCategoryId: null,
      isUserEditorOpen: true,
      editingUserId: editUserMatch[1],
    };
  }

  // 11. SEO Suite: /admin/seo or /admin/seo-settings
  if (clean === '/admin/seo' || clean === '/admin/seo-settings') {
    return {
      tab: 'seo',
      isJobEditorOpen: false,
      editingJobId: null,
      isCategoryEditorOpen: false,
      editingCategoryId: null,
      isUserEditorOpen: false,
      editingUserId: null,
    };
  }

  // 12. Profile: /admin/profile or /admin/account or /admin/security or /admin/2fa
  if (
    clean === '/admin/profile' || 
    clean === '/admin/account' || 
    clean === '/admin/security' || 
    clean === '/admin/2fa' || 
    clean === '/admin/two-factor'
  ) {
    return {
      tab: 'profile',
      isJobEditorOpen: false,
      editingJobId: null,
      isCategoryEditorOpen: false,
      editingCategoryId: null,
      isUserEditorOpen: false,
      editingUserId: null,
    };
  }

  // Fallback: check query parameter ?tab=... for backward compatibility
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['home', 'jobs', 'categories', 'users', 'seo', 'profile'].includes(tabParam)) {
      return {
        tab: tabParam as AdminTab,
        isJobEditorOpen: false,
        editingJobId: null,
        isCategoryEditorOpen: false,
        editingCategoryId: null,
        isUserEditorOpen: false,
        editingUserId: null,
        page: initialPage,
      };
    }
  }

  return {
    tab: 'home',
    isJobEditorOpen: false,
    editingJobId: null,
    isCategoryEditorOpen: false,
    editingCategoryId: null,
    isUserEditorOpen: false,
    editingUserId: null,
    page: initialPage,
  };
}

const ADMIN_LAST_PATH_KEY = 'admin_last_dashboard_path';

function getRememberedAdminPath(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const path = window.sessionStorage.getItem(ADMIN_LAST_PATH_KEY);
    if (!path || !path.startsWith('/admin/')) return null;
    if (path.startsWith('/admin/forgot-password') || path.startsWith('/admin/reset-password')) return null;
    return path;
  } catch {
    return null;
  }
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
        Security &amp; Password
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
  const [authLoadingMessage, setAuthLoadingMessage] = useState('Checking your session...');

  // Initial Route parsed from clean URL
  const initialRoute = useMemo(() => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search;
      const isAdminLanding = window.location.pathname.replace(/\/+$/, '') === '/admin';
      return parseAdminPath(
        isAdminLanding ? getRememberedAdminPath() || currentPath : currentPath
      );
    }
    return {
      tab: 'home' as AdminTab,
      isJobEditorOpen: false,
      editingJobId: null,
      isCategoryEditorOpen: false,
      editingCategoryId: null,
      isUserEditorOpen: false,
      editingUserId: null,
      statusFilter: 'all' as const
    };
  }, []);

  // Active Tab & Navigation State
  const [activeTab, setActiveTab] = useState<AdminTab>(initialRoute.tab);

  // Editor states with ID tracking for clean URL resolution
  const [isJobEditorOpen, setIsJobEditorOpen] = useState(initialRoute.isJobEditorOpen);
  const [editingJobId, setEditingJobId] = useState<string | null>(initialRoute.editingJobId);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const [isCategoryEditorOpen, setIsCategoryEditorOpen] = useState(initialRoute.isCategoryEditorOpen);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(initialRoute.editingCategoryId);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [isUserEditorOpen, setIsUserEditorOpen] = useState(initialRoute.isUserEditorOpen);
  const [editingUserId, setEditingUserId] = useState<string | null>(initialRoute.editingUserId);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  useEffect(() => {
    const { pathname, search } = window.location;
    if (!pathname.startsWith('/admin/') ||
      pathname.startsWith('/admin/forgot-password') ||
      pathname.startsWith('/admin/reset-password')) {
      return;
    }

    try {
      window.sessionStorage.setItem(ADMIN_LAST_PATH_KEY, pathname + search);
    } catch {
      // The URL remains the source of truth when session storage is unavailable.
    }
  }, []);

  const navigateToAdminPath = (path: string, push: boolean = true) => {
    if (typeof window !== 'undefined') {
      const currentFull = window.location.pathname + window.location.search;
      if (push && currentFull !== path) {
        window.history.pushState(null, '', path);
      } else if (!push) {
        window.history.replaceState(null, '', path);
      }
      if (path.startsWith('/admin/') && !path.startsWith('/admin/forgot-password') && !path.startsWith('/admin/reset-password')) {
        try {
          window.sessionStorage.setItem(ADMIN_LAST_PATH_KEY, path);
        } catch {
          // The URL remains the source of truth when session storage is unavailable.
        }
      }
    }
    const parsed = parseAdminPath(path);
    setActiveTab(parsed.tab);
    if (parsed.statusFilter !== undefined) {
      setStatusFilter(parsed.statusFilter);
    }
    if (parsed.tab === 'jobs') {
      setJobsPage(parsed.page || 1);
    } else if (parsed.tab === 'categories') {
      setDepartmentsPage(parsed.page || 1);
    }
    setIsJobEditorOpen(parsed.isJobEditorOpen);
    setEditingJobId(parsed.editingJobId);
    setIsCategoryEditorOpen(parsed.isCategoryEditorOpen);
    setEditingCategoryId(parsed.editingCategoryId);
    setIsUserEditorOpen(parsed.isUserEditorOpen);
    setEditingUserId(parsed.editingUserId);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('admin_active_tab', parsed.tab);
      } catch (e) {}
    }
  };

  const changeTab = (tab: AdminTab) => {
    let target = '/admin/home';
    if (tab === 'jobs') target = '/admin/jobs';
    else if (tab === 'categories') target = '/admin/departments';
    else if (tab === 'users') target = '/admin/users';
    else if (tab === 'seo') target = '/admin/seo';
    else if (tab === 'profile') target = '/admin/profile';
    navigateToAdminPath(target);
  };

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname + window.location.search;
        const parsed = parseAdminPath(currentPath);
        setActiveTab(parsed.tab);
        if (parsed.statusFilter !== undefined) {
          setStatusFilter(parsed.statusFilter);
        }
        if (parsed.tab === 'jobs') {
          setJobsPage(parsed.page || 1);
        } else if (parsed.tab === 'categories') {
          setDepartmentsPage(parsed.page || 1);
        }
        setIsJobEditorOpen(parsed.isJobEditorOpen);
        setEditingJobId(parsed.editingJobId);
        setIsCategoryEditorOpen(parsed.isCategoryEditorOpen);
        setEditingCategoryId(parsed.editingCategoryId);
        setIsUserEditorOpen(parsed.isUserEditorOpen);
        setEditingUserId(parsed.editingUserId);
        if (window.location.pathname.startsWith('/admin/') &&
          !window.location.pathname.startsWith('/admin/forgot-password') &&
          !window.location.pathname.startsWith('/admin/reset-password')) {
          try {
            window.sessionStorage.setItem(ADMIN_LAST_PATH_KEY, currentPath);
          } catch {
            // The URL remains the source of truth when session storage is unavailable.
          }
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
  const [profileSection, setProfileSection] = useState<'profile' | 'security' | 'two_factor'>(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      const path = window.location.pathname;
      if (search.includes('section=two_factor') || search.includes('tab=2fa') || path.includes('2fa') || path.includes('two-factor')) {
        return 'two_factor';
      }
      if (search.includes('section=security') || path.includes('security')) {
        return 'security';
      }
    }
    return 'profile';
  });
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
  const [statusFilter, setStatusFilter] = useState<'all' | JobStatus>(initialRoute.statusFilter || 'all');
  const [arrangementFilter, setWorkArrangementFilter] = useState<string>('all');
  const [jobTypeFilter, setJobTypeFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'salary' | 'title'>('newest');

  // Pagination States
  const [jobsPage, setJobsPage] = useState<number>(() => {
    return initialRoute.tab === 'jobs' && initialRoute.page ? initialRoute.page : 1;
  });
  const [departmentsPage, setDepartmentsPage] = useState<number>(() => {
    return initialRoute.tab === 'categories' && initialRoute.page ? initialRoute.page : 1;
  });
  const mainScrollRef = React.useRef<HTMLDivElement>(null);

  // Job Delete Modal States
  const [isDeleteJobModalOpen, setIsDeleteJobModalOpen] = useState(false);
  const [deletingJob, setDeletingJob] = useState<Job | null>(null);
  const [isDeletingJob, setIsDeletingJob] = useState(false);

  // Category Delete Modal States
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // Users State
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | UserRole>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | UserStatus>('all');

  // User Delete Modal States
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Synchronize editing entities with URL parameters
  useEffect(() => {
    if (editingJobId && jobs.length > 0) {
      const match = jobs.find((j) => j.id === editingJobId || j.slug === editingJobId);
      if (match) setEditingJob(match);
    } else if (!editingJobId && !isJobEditorOpen) {
      setEditingJob(null);
    }
  }, [editingJobId, jobs, isJobEditorOpen]);

  useEffect(() => {
    if (editingCategoryId && categories.length > 0) {
      const match = categories.find((c) => c.id === editingCategoryId || c.slug === editingCategoryId);
      if (match) setEditingCategory(match);
    } else if (!editingCategoryId && !isCategoryEditorOpen) {
      setEditingCategory(null);
    }
  }, [editingCategoryId, categories, isCategoryEditorOpen]);

  useEffect(() => {
    if (editingUserId && users.length > 0) {
      const match = users.find((u) => u.id === editingUserId);
      if (match) setEditingUser(match);
    } else if (!editingUserId && !isUserEditorOpen) {
      setEditingUser(null);
    }
  }, [editingUserId, users, isUserEditorOpen]);

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
      .then(async (user) => {
        if (mounted) {
          if (user) {
            // Check if user has 2FA enabled
            try {
              const twoFa = await get2FaStatus(user.email);
              if (twoFa && twoFa.twoFactorEnabled) {
                const isVerified = isAdminTwoFactorVerified(user.email);
                if (!isVerified) {
                  // User has not passed 2FA in this session. Require 2FA challenge.
                  setAdminUser(null);
                  setAuthLoading(false);
                  return;
                }
              }
            } catch (e) {
              console.warn('2FA session status verify notice:', e);
            }
          }
          setAdminUser(user);
          setAuthLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setAuthLoading(false);
        }
      });

    const unsubscribe = onAdminAuthStateChange(async (user) => {
      if (mounted) {
        if (user) {
          try {
            const twoFa = await get2FaStatus(user.email);
            if (twoFa && twoFa.twoFactorEnabled) {
              const isVerified = isAdminTwoFactorVerified(user.email);
              if (!isVerified) {
                setAdminUser(null);
                return;
              }
            }
          } catch (e) {}
        }
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
    setAuthLoadingMessage('Signing you out...');
    setAuthLoading(true);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('2fa_verified_email');
        localStorage.removeItem('2fa_verified_email');
        sessionStorage.removeItem('2fa_pending_email');
        sessionStorage.removeItem(ADMIN_LAST_PATH_KEY);
      }
    } catch (e) {}
    try {
      await signOutAdmin();
    } finally {
      setAdminUser(null);
      setAuthLoading(false);
      showToast('Signed out of Supabase Admin Console.');
    }
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
  }, [adminUser?.id]);

  // Real-time subscription to Categories
  useEffect(() => {
    if (!adminUser) return;

    setLoadingCategories(true);
    const unsubscribe = subscribeToCategories((updatedCats) => {
      setCategories(updatedCats);
      setLoadingCategories(false);
    });

    return () => unsubscribe();
  }, [adminUser?.id]);

  // Real-time subscription to Users
  useEffect(() => {
    if (!adminUser) return;

    setLoadingUsers(true);
    const unsubscribe = subscribeToUsers((updatedUsers) => {
      setUsers(updatedUsers);
      setLoadingUsers(false);
    });

    return () => unsubscribe();
  }, [adminUser?.id]);

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

  const availableJobTags = useMemo(() => {
    const tagsByNormalizedName = new Map<string, string>();
    jobs.forEach((job) => {
      (job.tags || []).forEach((tag) => {
        const normalizedTag = tag.trim().toLocaleLowerCase();
        if (normalizedTag && !tagsByNormalizedName.has(normalizedTag)) {
          tagsByNormalizedName.set(normalizedTag, tag.trim());
        }
      });
    });
    return Array.from(tagsByNormalizedName.values());
  }, [jobs]);

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

  // Pagination Constants
  const JOBS_PER_PAGE = 21;
  const DEPARTMENTS_PER_PAGE = 12;

  // Paginated Jobs (21 per page)
  const totalJobPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE));
  }, [filteredJobs.length]);

  const paginatedJobs = useMemo(() => {
    const start = (jobsPage - 1) * JOBS_PER_PAGE;
    return filteredJobs.slice(start, start + JOBS_PER_PAGE);
  }, [filteredJobs, jobsPage]);

  useEffect(() => {
    if (jobsPage > totalJobPages) {
      setJobsPage(totalJobPages);
    }
  }, [jobsPage, totalJobPages]);

  // Paginated Categories / Departments (12 per page)
  const totalDepartmentPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredCategories.length / DEPARTMENTS_PER_PAGE));
  }, [filteredCategories.length]);

  const paginatedCategories = useMemo(() => {
    const start = (departmentsPage - 1) * DEPARTMENTS_PER_PAGE;
    return filteredCategories.slice(start, start + DEPARTMENTS_PER_PAGE);
  }, [filteredCategories, departmentsPage]);

  useEffect(() => {
    if (departmentsPage > totalDepartmentPages) {
      setDepartmentsPage(totalDepartmentPages);
    }
  }, [departmentsPage, totalDepartmentPages]);

  const handleJobsPageChange = (newPage: number) => {
    setJobsPage(newPage);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (newPage > 1) {
        url.searchParams.set('page', String(newPage));
      } else {
        url.searchParams.delete('page');
      }
      window.history.pushState(null, '', url.pathname + url.search);
      try {
        window.sessionStorage.setItem(ADMIN_LAST_PATH_KEY, url.pathname + url.search);
      } catch {}
    }
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDepartmentsPageChange = (newPage: number) => {
    setDepartmentsPage(newPage);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (newPage > 1) {
        url.searchParams.set('page', String(newPage));
      } else {
        url.searchParams.delete('page');
      }
      window.history.pushState(null, '', url.pathname + url.search);
      try {
        window.sessionStorage.setItem(ADMIN_LAST_PATH_KEY, url.pathname + url.search);
      } catch {}
    }
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      setJobs((currentJobs) =>
        currentJobs.map((job) => job.id === jobId ? { ...job, ...jobData, id: jobId } : job)
      );
      showToast(`Updated "${jobData.title}" in Supabase.`);
    } else {
      const createdJobId = await createJob(jobData);
      setJobs((currentJobs) => [
        { ...jobData, id: createdJobId },
        ...currentJobs.filter((job) => job.id !== createdJobId),
      ]);
      showToast(`Published "${jobData.title}" live to Supabase.`);
    }
    navigateToAdminPath('/admin/jobs');
  };

  // Handle Quick Status Switch
  const handleToggleJobStatus = async (job: Job, newStatus: JobStatus) => {
    const publishedAt = newStatus === 'published' ? new Date().toISOString() : job.publishedAt;
    try {
      await updateJob(job.id, {
        status: newStatus,
        publishedAt,
      });
      setJobs((currentJobs) =>
        currentJobs.map((currentJob) =>
          currentJob.id === job.id
            ? { ...currentJob, status: newStatus, publishedAt }
            : currentJob
        )
      );
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
    navigateToAdminPath('/admin/departments');
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
        email: data.email,
        role: data.role,
        status: data.status,
        password: data.password
      });

      // If the current logged-in admin updated their own email or details, sync active session state & 2FA cache
      if (adminUser && (adminUser.id === userId || adminUser.email.toLowerCase() === editingUser?.email?.toLowerCase())) {
        const updatedAdmin: AdminSessionUser = {
          ...adminUser,
          fullName: data.fullName,
          email: data.email.toLowerCase(),
          role: data.role
        };
        setAdminUser(updatedAdmin);
        sessionStorage.setItem('2fa_verified_email', data.email.toLowerCase());
        try {
          localStorage.setItem('admin_user_cache', JSON.stringify(updatedAdmin));
        } catch (e) {}
      }

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
    navigateToAdminPath('/admin/users');
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

  const adminHeaderContent: Record<AdminTab, { title: string; description: string }> = {
    home: { title: 'Home', description: 'Platform activity, recent listings, and operational health.' },
    jobs: { title: 'Listings', description: 'Create, review, and organize job listings.' },
    categories: { title: 'Departments', description: 'Manage job categories and candidate browse pages.' },
    users: { title: 'Users & Access', description: 'Manage administrator accounts, roles, and access.' },
    seo: { title: 'SEO Suite', description: 'Manage search appearance and indexing settings.' },
    profile: { title: 'Account Settings', description: 'Manage your profile and account security.' },
  };

  useEffect(() => {
    if (!adminUser) {
      document.title = 'Admin Sign In | inaquired';
      return;
    }

    let title = adminHeaderContent[activeTab].title;
    if (isJobEditorOpen) {
      title = editingJob
        ? `Edit Listing: ${editingJob.title}`
        : 'Create Job Listing';
    } else if (isCategoryEditorOpen) {
      title = editingCategory
        ? `Edit Department: ${editingCategory.name}`
        : 'Create Department';
    } else if (isUserEditorOpen) {
      title = editingUser
        ? `Edit User: ${editingUser.fullName || editingUser.email}`
        : 'Add Administrator';
    } else if (activeTab === 'jobs' && statusFilter !== 'all') {
      title = statusFilter === 'draft' ? 'Draft Listings' : 'Archived Listings';
    }

    document.title = `${title} | Admin Console | inaquired`;
  }, [
    activeTab,
    adminUser,
    isJobEditorOpen,
    editingJob,
    isCategoryEditorOpen,
    editingCategory,
    isUserEditorOpen,
    editingUser,
    statusFilter,
  ]);

  if (authLoading) {
    return (
      <div role="status" aria-live="polite" className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <span className="h-9 w-9 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent dark:border-indigo-400" />
        <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {authLoadingMessage}
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
          navigateToAdminPath(getRememberedAdminPath() || '/admin/home', false);
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
            <div className="flex items-center group shrink-0" aria-label="inaquired">
              <img 
                src={isSidebarCollapsed ? "/logo/logo-q.svg" : "/logo/logo.svg"} 
                alt="inaquired" 
                className={`site-logo object-contain transition-all duration-200 group-hover:scale-105 ${
                  isSidebarCollapsed ? "h-7 w-7" : "h-8 w-auto max-w-[130px]"
                }`}
              />
            </div>
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
                onNavigateProfile={(section: 'profile' | 'security') => {
                  setProfileSection(section);
                  changeTab('profile');
                  setIsProfileDropdownOpen(false);
                  setIsMobileMenuOpen(false);
                }}
                onNavigateHome={() => {
                  setIsProfileDropdownOpen(false);
                  setIsMobileMenuOpen(false);
                  window.open('/', '_blank', 'noopener,noreferrer');
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

            {/* Home Navigation Tab */}
            <button
              onClick={() => {
                changeTab('home');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 dark:bg-indigo-600'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title="Executive Overview"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && (
                <div className="flex flex-1 items-center justify-between text-left truncate">
                  <span>Home</span>
                </div>
              )}
            </button>

            {/* Jobs Navigation Tab */}
            <button
              onClick={() => {
                changeTab('jobs');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full mt-1.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'jobs'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 dark:bg-indigo-600'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title="Manage Listings"
            >
              <FolderOpen className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && (
                <div className="flex flex-1 items-center justify-between text-left truncate">
                  <span>Listings</span>
                </div>
              )}
            </button>

            {/* Categories & Departments Navigation Tab */}
            <button
              onClick={() => {
                changeTab('categories');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full mt-1.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
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
                </div>
              )}
            </button>

            {/* Users & Team Navigation Tab */}
            <button
              onClick={() => {
                changeTab('users');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full mt-1.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
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
                </div>
              )}
            </button>

            {/* SEO & Indexing Navigation Tab */}
            <button
              onClick={() => {
                changeTab('seo');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full mt-1.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'seo'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 dark:bg-indigo-600'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title="SEO Suite & Search Engine Indexing"
            >
              <Globe className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && (
                <div className="flex flex-1 items-center justify-between text-left truncate">
                  <span>SEO Suite</span>
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
      <div ref={mainScrollRef} className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        {isJobEditorOpen && activeTab === 'jobs' ? (
          <JobEditorPage
            initialJob={editingJob}
            categoriesList={availableCategoryNames}
            availableTags={availableJobTags}
            onClose={() => {
              navigateToAdminPath('/admin/jobs');
            }}
            onSubmit={handleJobFormSubmit}
          />
        ) : isCategoryEditorOpen && activeTab === 'categories' ? (
          <CategoryEditorPage
            initialCategory={editingCategory}
            onClose={() => {
              navigateToAdminPath('/admin/departments');
            }}
            onSubmit={handleCategorySubmit}
          />
        ) : isUserEditorOpen && activeTab === 'users' ? (
          <UserEditorPage
            initialUser={editingUser}
            currentAdminEmail={adminUser?.email}
            onClose={() => {
              navigateToAdminPath('/admin/users');
            }}
            onSubmit={handleUserSubmit}
          />
        ) : (
          <>
            {/* TOP STATUS & CONTEXT BAR */}
            <AdminHeader
              title={adminHeaderContent[activeTab].title}
              description={adminHeaderContent[activeTab].description}
              onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
              actions={
                <>
                  {activeTab === 'jobs' && (
                    <button
                      onClick={() => navigateToAdminPath('/admin/add-new-job')}
                      className="inline-flex items-center rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 transition-all cursor-pointer"
                    >
                      <span>Post Job</span>
                    </button>
                  )}
                  {activeTab === 'categories' && (
                    <button
                      onClick={() => {
                        setEditingCategory(null);
                        setIsCategoryEditorOpen(true);
                      }}
                      className="inline-flex items-center rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 transition-all cursor-pointer"
                    >
                      <span>New Department</span>
                    </button>
                  )}
                  {activeTab === 'users' && (
                    <button
                      onClick={() => navigateToAdminPath('/admin/add-new-user')}
                      className="inline-flex items-center rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 transition-all cursor-pointer"
                    >
                      <span>Add User</span>
                    </button>
                  )}
                </>
              }
            />

            {/* CONTENT AREA BASED ON ACTIVE TAB */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
              <div className="w-full max-w-7xl mx-auto space-y-6 transition-all duration-300 ease-in-out">

              {/* TAB 0: HOME DASHBOARD */}
              {activeTab === 'home' && (
                <AdminHomeDashboard
                  adminEmail={adminUser?.email}
                  adminName={userDisplayName}
                  jobs={jobs}
                  categories={categories}
                  users={users}
                  supabaseConnected={Boolean(supabaseConnected)}
                  onNavigate={(route) => {
                    if (route.startsWith('/admin')) {
                      navigateToAdminPath(route);
                    } else {
                      onNavigate(route);
                    }
                  }}
                  onEditJob={(job) => {
                    setEditingJob(job);
                    navigateToAdminPath(`/admin/edit-job/${job.id}`);
                  }}
                />
              )}

              {/* TAB 1: JOBS MANAGEMENT */}
              {activeTab === 'jobs' && (
                <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Analytics Metric Cards */}
              <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <div 
                  onClick={() => {
                    setStatusFilter('all');
                    setJobsPage(1);
                    navigateToAdminPath('/admin/jobs?status=all');
                  }}
                  className={`rounded-2xl border p-4 shadow-xs cursor-pointer transition-all ${
                    statusFilter === 'all'
                      ? 'border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-500/20 dark:bg-indigo-950/40 dark:border-indigo-700'
                      : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 hover:border-indigo-300'
                  }`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Listings</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{stats.total}</p>
                </div>

                <div 
                  onClick={() => {
                    setStatusFilter('published');
                    setJobsPage(1);
                    navigateToAdminPath('/admin/jobs?status=published');
                  }}
                  className={`rounded-2xl border p-4 shadow-xs cursor-pointer transition-all ${
                    statusFilter === 'published'
                      ? 'border-emerald-400 bg-emerald-100/60 ring-2 ring-emerald-500/20 dark:bg-emerald-950/60 dark:border-emerald-700'
                      : 'border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-950/60 dark:bg-emerald-950/20 hover:border-emerald-300'
                  }`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Published Live</p>
                  <p className="mt-1 text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">{stats.published}</p>
                </div>

                <div 
                  onClick={() => {
                    setStatusFilter('draft');
                    setJobsPage(1);
                    navigateToAdminPath('/admin/jobs?status=draft');
                  }}
                  className={`rounded-2xl border p-4 shadow-xs cursor-pointer transition-all ${
                    statusFilter === 'draft'
                      ? 'border-amber-400 bg-amber-100/60 ring-2 ring-amber-500/20 dark:bg-amber-950/60 dark:border-amber-700'
                      : 'border-amber-200/80 bg-amber-50/40 dark:border-amber-950/60 dark:bg-amber-950/20 hover:border-amber-300'
                  }`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Drafts</p>
                  <p className="mt-1 text-2xl font-extrabold text-amber-700 dark:text-amber-300">{stats.draft}</p>
                </div>

                <div 
                  onClick={() => {
                    setStatusFilter('archived');
                    setJobsPage(1);
                    navigateToAdminPath('/admin/jobs?status=archived');
                  }}
                  className={`rounded-2xl border p-4 shadow-xs cursor-pointer transition-all ${
                    statusFilter === 'archived'
                      ? 'border-slate-400 bg-slate-100 ring-2 ring-slate-500/20 dark:bg-slate-800 dark:border-slate-600'
                      : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
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
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setJobsPage(1);
                      }}
                      placeholder="Search roles by title, company, skills, or department..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setJobsPage(1);
                        }}
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
                      onChange={(e) => {
                        const newStatus = e.target.value as any;
                        setStatusFilter(newStatus);
                        setJobsPage(1);
                        navigateToAdminPath(`/admin/jobs${newStatus !== 'all' ? `?status=${newStatus}` : ''}`);
                      }}
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
                      onChange={(e) => {
                        setSelectedCategoryFilter(e.target.value);
                        setJobsPage(1);
                      }}
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
                      onChange={(e) => {
                        setWorkArrangementFilter(e.target.value);
                        setJobsPage(1);
                      }}
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
                      onChange={(e) => {
                        setSortBy(e.target.value as any);
                        setJobsPage(1);
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                    >
                      <option value="newest">Sort: Newest</option>
                      <option value="salary">Sort: Salary (High to Low)</option>
                      <option value="title">Sort: Title (A-Z)</option>
                    </select>
                  </div>
                </div>

                {/* Range and count indicator */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span>
                    Showing{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {filteredJobs.length === 0 ? 0 : (jobsPage - 1) * JOBS_PER_PAGE + 1}–{Math.min(jobsPage * JOBS_PER_PAGE, filteredJobs.length)}
                    </strong>{' '}
                    of <strong className="text-slate-800 dark:text-slate-200">{filteredJobs.length}</strong> listings
                    {jobs.length !== filteredJobs.length && ` (filtered from ${jobs.length} total)`}
                  </span>
                  {totalJobPages > 1 && (
                    <span>
                      Page <strong className="text-slate-800 dark:text-slate-200">{jobsPage}</strong> of{' '}
                      <strong className="text-slate-800 dark:text-slate-200">{totalJobPages}</strong>
                    </span>
                  )}
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
                    <JobIcon className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                    <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">No job listings found</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {searchQuery || statusFilter !== 'all' || selectedCategoryFilter !== 'all'
                        ? 'Try clearing or relaxing your search filters.'
                        : 'Get started by creating your first job listing.'}
                    </p>
                    <button
                      onClick={() => navigateToAdminPath('/admin/add-new-job')}
                      className="mt-4 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                    >
                      <span>Post Job</span>
                    </button>
                  </div>
                ) : (
                  <>
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
                          {paginatedJobs.map((job) => {
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
                                        navigateToAdminPath(`/admin/edit-job/${job.id}`);
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

                    {/* Pagination Controls */}
                    {totalJobPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Showing{' '}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {(jobsPage - 1) * JOBS_PER_PAGE + 1}–{Math.min(jobsPage * JOBS_PER_PAGE, filteredJobs.length)}
                          </strong>{' '}
                          of <strong className="text-slate-800 dark:text-slate-200">{filteredJobs.length}</strong> listings
                        </p>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleJobsPageChange(Math.max(1, jobsPage - 1))}
                            disabled={jobsPage === 1}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            aria-label="Previous page"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                            <span>Prev</span>
                          </button>

                          {getPageNumbers(jobsPage, totalJobPages).map((p, idx) => {
                            if (p === '...') {
                              return (
                                <span
                                  key={`ellipsis-jobs-${idx}`}
                                  className="inline-flex h-8 w-8 items-center justify-center text-xs text-slate-400 select-none"
                                >
                                  …
                                </span>
                              );
                            }
                            const pageNum = p as number;
                            const isActive = pageNum === jobsPage;
                            return (
                              <button
                                key={`page-jobs-${pageNum}`}
                                onClick={() => handleJobsPageChange(pageNum)}
                                aria-current={isActive ? 'page' : undefined}
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                  isActive
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}

                          <button
                            onClick={() => handleJobsPageChange(Math.min(totalJobPages, jobsPage + 1))}
                            disabled={jobsPage === totalJobPages}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            aria-label="Next page"
                          >
                            <span>Next</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          )}

          {/* TAB 2: CATEGORIES & DEPARTMENTS MANAGEMENT */}
          {activeTab === 'categories' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Search & Stats Filter */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => {
                      setCategorySearch(e.target.value);
                      setDepartmentsPage(1);
                    }}
                    placeholder="Search departments by name or URL slug..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  {categorySearch && (
                    <button
                      onClick={() => {
                        setCategorySearch('');
                        setDepartmentsPage(1);
                      }}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span>
                    Showing{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {filteredCategories.length === 0 ? 0 : (departmentsPage - 1) * DEPARTMENTS_PER_PAGE + 1}–{Math.min(departmentsPage * DEPARTMENTS_PER_PAGE, filteredCategories.length)}
                    </strong>{' '}
                    of <strong className="text-slate-800 dark:text-slate-200">{filteredCategories.length}</strong> departments
                    {categories.length !== filteredCategories.length && ` (${categories.length} total)`}
                  </span>
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
                      onClick={() => navigateToAdminPath('/admin/add-new-department')}
                      className="mt-4 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 cursor-pointer"
                    >
                      <span>Add Department</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                          <tr>
                            <th className="py-3 pl-5 pr-3">Department Name</th>
                            <th className="px-3 py-3">URL Slug</th>
                            <th className="px-3 py-3 text-center">Active Roles</th>
                            <th className="py-3 pl-3 pr-5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {paginatedCategories.map((cat) => {
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
                                        navigateToAdminPath(`/admin/edit-department/${cat.id}`);
                                      }}
                                      className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
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

                    {/* Pagination Controls */}
                    {totalDepartmentPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Showing{' '}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {(departmentsPage - 1) * DEPARTMENTS_PER_PAGE + 1}–{Math.min(departmentsPage * DEPARTMENTS_PER_PAGE, filteredCategories.length)}
                          </strong>{' '}
                          of <strong className="text-slate-800 dark:text-slate-200">{filteredCategories.length}</strong> departments
                        </p>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDepartmentsPageChange(Math.max(1, departmentsPage - 1))}
                            disabled={departmentsPage === 1}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            aria-label="Previous page"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                            <span>Prev</span>
                          </button>

                          {getPageNumbers(departmentsPage, totalDepartmentPages).map((p, idx) => {
                            if (p === '...') {
                              return (
                                <span
                                  key={`ellipsis-dept-${idx}`}
                                  className="inline-flex h-8 w-8 items-center justify-center text-xs text-slate-400 select-none"
                                >
                                  …
                                </span>
                              );
                            }
                            const pageNum = p as number;
                            const isActive = pageNum === departmentsPage;
                            return (
                              <button
                                key={`page-dept-${pageNum}`}
                                onClick={() => handleDepartmentsPageChange(pageNum)}
                                aria-current={isActive ? 'page' : undefined}
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                  isActive
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}

                          <button
                            onClick={() => handleDepartmentsPageChange(Math.min(totalDepartmentPages, departmentsPage + 1))}
                            disabled={departmentsPage === totalDepartmentPages}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            aria-label="Next page"
                          >
                            <span>Next</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          )}

          {/* TAB 3: USERS & TEAM ACCESS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
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
                    <JobIcon className="h-4 w-4 text-emerald-500" />
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
                      onClick={() => navigateToAdminPath('/admin/add-new-user')}
                      className="mt-4 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 cursor-pointer"
                    >
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
                                      navigateToAdminPath(`/admin/edit-user/${u.id}`);
                                    }}
                                    className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
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

          {/* TAB 4: SEO SUITE & SEARCH ENGINE INDEXING */}
          {activeTab === 'seo' && (
            <SeoPanel onShowToast={showToast} />
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
        </>
      )}
      </div>

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
