import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CookieBanner } from './components/layout/CookieBanner';
import { Job } from './types/job';
import { 
  subscribeToPublishedJobs 
} from './services/jobService';
import { triggerJobNotification } from './services/notificationService';
import { applyRouteSEO } from './utils/seoManager';

const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const CategoryJobsPage = lazy(() => import('./pages/CategoryJobsPage').then(m => ({ default: m.CategoryJobsPage })));
const JobDetailPage = lazy(() => import('./pages/JobDetailPage').then(m => ({ default: m.JobDetailPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const PostAJobPage = lazy(() => import('./pages/PostAJobPage').then(m => ({ default: m.PostAJobPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const CookiePolicyPage = lazy(() => import('./pages/CookiePolicyPage').then(m => ({ default: m.CookiePolicyPage })));
const DepartmentsPage = lazy(() => import('./pages/DepartmentsPage').then(m => ({ default: m.DepartmentsPage })));
const CompaniesPage = lazy(() => import('./pages/CompaniesPage').then(m => ({ default: m.CompaniesPage })));
const AdminPage = lazy(() => import('./pages/admin/AdminPage').then(m => ({ default: m.AdminPage })));
const AdminForgotPasswordPage = lazy(() => import('./pages/admin/AdminForgotPasswordPage').then(m => ({ default: m.AdminForgotPasswordPage })));
const AdminResetPasswordPage = lazy(() => import('./pages/admin/AdminResetPasswordPage').then(m => ({ default: m.AdminResetPasswordPage })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
}

function MainApp() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState<boolean>(true);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const previousJobsCountRef = useRef<number | null>(null);

  // Static per-page title fallbacks applied immediately on every navigation
  // (applyRouteSEO will later override with admin-configured titles from Supabase)
  const PAGE_TITLES: Record<string, string> = {
    '/': 'inaquired – Find Remote, On-Site & Hybrid Jobs & Internships',
    '/jobs': 'Explore Verified Job Openings | inaquired',
    '/remote-jobs': 'Remote Jobs – Work From Anywhere | inaquired',
    '/onsite-jobs': 'On-Site Jobs & In-Office Roles | inaquired',
    '/hybrid-jobs': 'Hybrid Jobs & Flexible Office Roles | inaquired',
    '/internships': 'Paid Internships & Early Career Roles | inaquired',
    '/departments': 'Browse Jobs by Department | inaquired',
    '/by-departments': 'Browse Jobs by Department | inaquired',
    '/companies': 'Browse Hiring Companies | inaquired',
    '/by-companies': 'Browse Hiring Companies | inaquired',
    '/about': 'About Us | inaquired',
    '/contact': 'Contact & Support | inaquired',
    '/post-a-job': 'Post a Job Listing | inaquired',
    '/post-job': 'Post a Job Listing | inaquired',
    '/privacy': 'Privacy Policy | inaquired',
    '/terms': 'Terms of Service | inaquired',
    '/cookies': 'Cookie Policy | inaquired',
    '/cookie-policy': 'Cookie Policy | inaquired',
    '/admin': 'Admin Control Panel | inaquired',
    '/admin/forgot-password': 'Reset Password | inaquired',
    '/admin/reset-password': 'Set New Password | inaquired',
  };

  const navigate = (path: string) => {
    if (path !== currentPath) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Apply per-page title & meta on every route change
  useEffect(() => {
    const path = currentPath || '/';
    // 1. Set static or dynamic title immediately (no async wait)
    if (path.startsWith('/category/')) {
      const slug = decodeURIComponent(path.replace('/category/', '')).trim();
      const formatted = slug.split(/[-_]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      document.title = `${formatted} Jobs | inaquired`;
    } else if (path.startsWith('/company/')) {
      const company = decodeURIComponent(path.replace('/company/', '')).trim();
      document.title = `Careers at ${company} | inaquired`;
    } else if (!path.startsWith('/jobs/')) {
      const staticTitle = PAGE_TITLES[path] || 'inaquired – Find Remote, On-Site & Hybrid Jobs & Internships';
      document.title = staticTitle;
    }

    // 2. Then override with admin-configured SEO from Supabase
    applyRouteSEO(path);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);

  // Real-time Supabase subscription for published jobs
  useEffect(() => {
    setLoadingJobs(true);

    const unsubscribe = subscribeToPublishedJobs(
      (publishedJobs) => {
        if (previousJobsCountRef.current !== null && publishedJobs.length > previousJobsCountRef.current) {
          const newestJob = publishedJobs[0];
          if (newestJob) {
            triggerJobNotification(newestJob);
          }
        }
        previousJobsCountRef.current = publishedJobs.length;
        setJobs(publishedJobs);
        setLoadingJobs(false);
      },
      (err) => {
        console.error('Published jobs fetch error:', err);
        setJobs([]);
        setLoadingJobs(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSelectJob = (slugOrId: string) => {
    navigate(`/jobs/${slugOrId}`);
  };

  const renderCurrentView = () => {
    if (currentPath.startsWith('/jobs/')) {
      const slug = currentPath.replace('/jobs/', '');
      return (
        <JobDetailPage
          slug={slug}
          jobs={jobs}
          onNavigate={navigate}
        />
      );
    }

    if (currentPath.startsWith('/category/')) {
      const slug = currentPath.replace('/category/', '');
      return (
        <CategoryJobsPage
          pageType="category"
          categorySlug={slug}
          jobs={jobs}
          loading={loadingJobs}
          onNavigate={navigate}
          onSelectJob={handleSelectJob}
          keyword={searchKeyword}
          onKeywordChange={setSearchKeyword}
        />
      );
    }

    if (currentPath === '/remote-jobs') {
      return (
        <CategoryJobsPage
          pageType="remote"
          jobs={jobs}
          loading={loadingJobs}
          onNavigate={navigate}
          onSelectJob={handleSelectJob}
          keyword={searchKeyword}
          onKeywordChange={setSearchKeyword}
        />
      );
    }

    if (currentPath === '/onsite-jobs') {
      return (
        <CategoryJobsPage
          pageType="onsite"
          jobs={jobs}
          loading={loadingJobs}
          onNavigate={navigate}
          onSelectJob={handleSelectJob}
          keyword={searchKeyword}
          onKeywordChange={setSearchKeyword}
        />
      );
    }

    if (currentPath === '/hybrid-jobs') {
      return (
        <CategoryJobsPage
          pageType="hybrid"
          jobs={jobs}
          loading={loadingJobs}
          onNavigate={navigate}
          onSelectJob={handleSelectJob}
          keyword={searchKeyword}
          onKeywordChange={setSearchKeyword}
        />
      );
    }

    if (currentPath === '/internships') {
      return (
        <CategoryJobsPage
          pageType="internship"
          jobs={jobs}
          loading={loadingJobs}
          onNavigate={navigate}
          onSelectJob={handleSelectJob}
          keyword={searchKeyword}
          onKeywordChange={setSearchKeyword}
        />
      );
    }

    if (currentPath === '/departments' || currentPath === '/by-departments') {
      return (
        <DepartmentsPage
          jobs={jobs}
          onNavigate={navigate}
          onSelectJob={handleSelectJob}
        />
      );
    }

    if (currentPath === '/companies' || currentPath === '/by-companies') {
      return (
        <CompaniesPage
          jobs={jobs}
          onNavigate={navigate}
          onSelectJob={handleSelectJob}
        />
      );
    }

    if (currentPath.startsWith('/company/')) {
      const companyParam = decodeURIComponent(currentPath.replace('/company/', ''));
      return (
        <CategoryJobsPage
          pageType="company"
          companyName={companyParam}
          jobs={jobs}
          loading={loadingJobs}
          onNavigate={navigate}
          onSelectJob={handleSelectJob}
          keyword={searchKeyword}
          onKeywordChange={setSearchKeyword}
        />
      );
    }

    if (currentPath === '/about') {
      return <AboutPage onNavigate={navigate} />;
    }

    if (currentPath === '/contact') {
      return <ContactPage onNavigate={navigate} />;
    }

    if (currentPath === '/post-a-job' || currentPath === '/post-job') {
      return <PostAJobPage onNavigate={navigate} />;
    }

    if (currentPath === '/privacy') {
      return <PrivacyPolicyPage onNavigate={navigate} />;
    }

    if (currentPath === '/terms') {
      return <TermsPage onNavigate={navigate} />;
    }

    if (currentPath === '/cookies' || currentPath === '/cookie-policy') {
      return <CookiePolicyPage onNavigate={navigate} />;
    }

    return (
      <HomePage
        jobs={jobs}
        loading={loadingJobs}
        onNavigate={navigate}
        onSelectJob={handleSelectJob}
        keyword={searchKeyword}
        onKeywordChange={setSearchKeyword}
      />
    );
  };

  if (currentPath === '/admin/forgot-password' || currentPath.startsWith('/admin/forgot-password') || currentPath === '/admin/recovery') {
    return (
      <Suspense fallback={<PageLoader />}>
        <AdminForgotPasswordPage onNavigate={navigate} />
      </Suspense>
    );
  }

  if (currentPath === '/admin/reset-password' || currentPath.startsWith('/admin/reset-password')) {
    return (
      <Suspense fallback={<PageLoader />}>
        <AdminResetPasswordPage onNavigate={navigate} />
      </Suspense>
    );
  }

  if (currentPath === '/admin' || currentPath.startsWith('/admin')) {
    return (
      <Suspense fallback={<PageLoader />}>
        <AdminPage onNavigate={navigate} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      <Navbar
        currentPath={currentPath}
        onNavigate={navigate}
        jobs={jobs}
        globalKeyword={searchKeyword}
        onSearchChange={setSearchKeyword}
        onSelectJob={handleSelectJob}
      />

      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          {renderCurrentView()}
        </Suspense>
      </main>

      <Footer onNavigate={navigate} />
      <CookieBanner onNavigate={navigate} />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

export default App;
