export type UserRole = 'superadmin' | 'admin' | 'recruiter' | 'editor';

export type UserStatus = 'active' | 'suspended' | 'pending';

export interface ManagedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  lastSignInAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export interface UpdateUserData {
  fullName?: string;
  role?: UserRole;
  status?: UserStatus;
  password?: string;
}

export const ROLE_DEFINITIONS: Record<UserRole, { label: string; description: string; badgeColor: string }> = {
  superadmin: {
    label: 'Super Admin',
    description: 'Full unrestricted platform access, user management, and database governance.',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/50'
  },
  admin: {
    label: 'Administrator',
    description: 'Manage jobs, departments, categories, and review applicants.',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/50'
  },
  recruiter: {
    label: 'Recruiter',
    description: 'Post and manage job listings, track applications, and spotlight roles.',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/50'
  },
  editor: {
    label: 'Content Editor',
    description: 'Draft and review job descriptions, guidelines, and department content.',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/50'
  }
};
