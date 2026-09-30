import React, { useState } from 'react';
import { 
  Briefcase, 
  Sun, 
  Moon, 
  Bell, 
  BellRing, 
  Menu, 
  X, 
  Shield, 
  Sparkles,
  ArrowRight,
  LogOut,
  Search
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { checkNotificationSupport, requestJobNotifications } from '../../services/notificationService';
import { NavbarSearch } from './NavbarSearch';
import { Job } from '../../types/job';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  jobs?: Job[];
  globalKeyword?: string;
  onSearchChange?: (keyword: string) => void;
  onSelectJob?: (slug: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentPath, 
  onNavigate,
  jobs = [],
  globalKeyword = '',
  onSearchChange = () => {},
  onSelectJob = () => {}
}) => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, isAdmin, isMfaVerified, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [notificationState, setNotificationState] = useState(checkNotificationSupport());
  const [showNotificationTip, setShowNotificationTip] = useState(false);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Remote', path: '/remote-jobs' },
    { label: 'On-Site', path: '/onsite-jobs' },
    { label: 'Hybrid', path: '/hybrid-jobs' },
    { label: 'Internships', path: '/internships' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  const handleNotificationToggle = async () => {
    if (!notificationState.isSupported) {
      alert('Desktop notifications are not supported in this browser environment.');
      return;
    }
    if (notificationState.isEnabled) {
      alert('Job alerts are already active. You will receive notifications as new roles are posted.');
      return;
    }
    const granted = await requestJobNotifications();
    setNotificationState(checkNotificationSupport());
    if (granted) {
      setShowNotificationTip(true);
      setTimeout(() => setShowNotificationTip(false), 4000);
    }
  };

  const handleNavClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  };

  const handleSearchSubmit = (keyword: string) => {
    onSearchChange(keyword);
    // If not currently on a listings view, navigate to home or jobs
    if (currentPath !== '/' && !currentPath.includes('-jobs') && currentPath !== '/jobs') {
      onNavigate('/');
    }
    setMobileSearchOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-3">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => handleNavClick('/')}
            className="flex items-center gap-2 text-left focus:outline-none group"
            aria-label="inaquired home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm transition-transform group-hover:scale-105 dark:bg-indigo-500">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                inaquired
              </span>
              <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 sm:inline-block ml-1.5 px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/50">
                Jobs
              </span>
            </div>
          </button>
        </div>

        {/* Desktop Global Search Component */}
        <div className="hidden md:flex flex-1 max-w-xs lg:max-w-sm mx-2">
          <NavbarSearch
            jobs={jobs}
            keyword={globalKeyword}
            onKeywordChange={onSearchChange}
            onSelectJob={(slug) => {
              onSelectJob(slug);
              setMobileMenuOpen(false);
            }}
            onSearchSubmit={handleSearchSubmit}
          />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => handleNavClick(link.path)}
                className={`px-2.5 py-1.5 text-xs lg:text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950/60 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right Action Icons & Admin Gateway */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Mobile Search Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            title="Search jobs"
            aria-label="Search jobs"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Notification Alert Bell */}
          <div className="relative">
            <button
              onClick={handleNotificationToggle}
              title={notificationState.isEnabled ? 'Job alerts active' : 'Turn on job alert notifications'}
              className={`p-2 rounded-lg border text-sm transition-colors relative ${
                notificationState.isEnabled
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
              aria-label="Notification subscription"
            >
              {notificationState.isEnabled ? (
                <BellRing className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              {notificationState.isEnabled && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                </span>
              )}
            </button>
            
            {showNotificationTip && (
              <div className="absolute right-0 mt-2 w-64 p-3 text-xs bg-indigo-900 text-white rounded-lg shadow-lg z-50 animate-fade-in">
                <p className="font-semibold mb-1">Alerts Activated!</p>
                <p className="text-indigo-200">You will receive instant alerts when verified openings match your interest.</p>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Admin Status / Login Shortcut */}
          {isAdmin && isMfaVerified ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => handleNavClick('/admin')}
                className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  currentPath.startsWith('/admin')
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'border-indigo-300 bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300'
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                CMS Panel
              </button>
              <button
                onClick={logout}
                title="Log out admin session"
                className="p-2 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleNavClick('/admin/login')}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors shadow-2xs"
            >
              <Shield className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Open navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Search Dropdown Bar */}
      {mobileSearchOpen && (
        <div className="md:hidden border-t border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/95">
          <NavbarSearch
            jobs={jobs}
            keyword={globalKeyword}
            onKeywordChange={onSearchChange}
            onSelectJob={(slug) => {
              onSelectJob(slug);
              setMobileSearchOpen(false);
            }}
            onSearchSubmit={handleSearchSubmit}
          />
        </div>
      )}

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-5 dark:border-slate-800 dark:bg-slate-900 shadow-xl space-y-3">
          {/* Mobile Search inside drawer */}
          <div className="md:hidden pb-2">
            <NavbarSearch
              jobs={jobs}
              keyword={globalKeyword}
              onKeywordChange={onSearchChange}
              onSelectJob={(slug) => {
                onSelectJob(slug);
                setMobileMenuOpen(false);
              }}
              onSearchSubmit={handleSearchSubmit}
            />
          </div>

          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => handleNavClick(link.path)}
                  className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleNavClick('/admin')}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950"
              >
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Admin CMS Panel
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
