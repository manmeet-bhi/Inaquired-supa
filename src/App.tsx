import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { CategoryJobsPage } from './pages/CategoryJobsPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Job } from './types/job';
import { 
  subscribeToPublishedJobs, 
  subscribeToAllJobsForAdmin, 
  seedInitialJobsIfEmpty 
} from './services/jobService';
import { triggerJobNotification } from './services/notificationService';
import { INITIAL_JOBS } from './services/seedData';

function MainApp() {
  const { currentUser, isAdmin, isMfaVerified, loading: authLoading } = useAuth();
  
  // Navigation state (browser pathname simulation with popstate support)
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

  // Synchronize browser history
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

  // Real-time Firestore subscription
  useEffect(() => {
    setLoadingJobs(true);

    // Initial check to seed if Firestore is empty
    seedInitialJobsIfEmpty().catch(() => {});

    // If an admin is authenticated & MFA-verified, subscribe to all jobs (including drafts).
    // Otherwise subscribe strictly to published jobs.
    const unsubscribe = (isAdmin && isMfaVerified)
      ? subscribeToAllJobsForAdmin((updatedJobs) => {
          setJobs(updatedJobs);
          setLoadingJobs(false);
        })
      : subscribeToPublishedJobs((publishedJobs) => {
          // Detect new jobs added in real-time for notification triggers
          if (previousJobsCountRef.current !== null && publishedJobs.length > previousJobsCountRef.current) {
            const newestJob = publishedJobs[0];
            if (newestJob) {
              triggerJobNotification(newestJob);
            }
          }
          previousJobsCountRef.current = publishedJobs.length;
          
          // If Firestore returned zero published jobs on first boot, load seed fallback
          if (publishedJobs.length === 0 && !isAdmin) {
            setJobs(INITIAL_JOBS.map((j, idx) => ({ id: `seed_${idx}`, ...j } as Job)));
          } else {
            setJobs(publishedJobs);
          }
          setLoadingJobs(false);
        }, (err) => {
          console.warn('Using client fallback jobs:', err);
          setJobs(INITIAL_JOBS.map((j, idx) => ({ id: `seed_${idx}`, ...j } as Job)));
          setLoadingJobs(false);
        });

    return () => unsubscribe();
  }, [isAdmin, isMfaVerified]);

  // View job detail handler
  const handleSelectJob = (slugOrId: string) => {
    navigate(`/jobs/${slugOrId}`);
  };

  // Route Rendering Logic
  const renderCurrentView = () => {
    // Admin routes
    if (currentPath === '/admin' || currentPath.startsWith('/admin/')) {
      if (currentPath === '/admin/login') {
        return (
          <AdminLoginPage
            onSuccess={() => navigate('/admin')}
            onNavigateHome={() => navigate('/')}
          />
        );
      }
      if (!isAdmin || !isMfaVerified) {
        return (
          <AdminLoginPage
            onSuccess={() => navigate('/admin')}
            onNavigateHome={() => navigate('/')}
          />
        );
      }
      return (
        <AdminDashboard
          jobs={jobs}
          onNavigateHome={() => navigate('/')}
          onPreviewJob={handleSelectJob}
        />
      );
    }

    // Job Detail route: /jobs/:slug
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

    // Public Category Routes
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

    if (currentPath === '/jobs') {
      return (
        <CategoryJobsPage
          pageType="all"
          jobs={jobs}
          loading={loadingJobs}
          onNavigate={navigate}
          onSelectJob={handleSelectJob}
          keyword={searchKeyword}
          onKeywordChange={setSearchKeyword}
        />
      );
    }

    // Content Pages
    if (currentPath === '/about') {
      return <AboutPage onNavigate={navigate} />;
    }

    if (currentPath === '/contact') {
      return <ContactPage onNavigate={navigate} />;
    }

    if (currentPath === '/privacy') {
      return <PrivacyPolicyPage onNavigate={navigate} />;
    }

    if (currentPath === '/terms') {
      return <TermsPage onNavigate={navigate} />;
    }

    // Default Home Page (/)
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

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors duration-150 dark:bg-slate-950 dark:text-slate-100">
      <Navbar 
        currentPath={currentPath} 
        onNavigate={navigate} 
        jobs={jobs}
        globalKeyword={searchKeyword}
        onSearchChange={setSearchKeyword}
        onSelectJob={handleSelectJob}
      />
      <main className="flex-1">
        {renderCurrentView()}
      </main>
      <Footer onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
