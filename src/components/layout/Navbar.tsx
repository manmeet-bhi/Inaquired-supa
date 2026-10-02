import React, { useState, useRef, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Search,
  ChevronDown,
  Laptop,
  Building2,
  Globe2,
  GraduationCap,
  Layers,
  Building
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [jobsDropdownOpen, setJobsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sub-items for the Jobs dropdown
  const jobsSubLinks = [
    { label: 'Remote', path: '/remote-jobs', icon: Laptop, desc: 'Work-from-anywhere roles' },
    { label: 'Onsite', path: '/onsite-jobs', icon: Building2, desc: 'In-office positions' },
    { label: 'Hybrid', path: '/hybrid-jobs', icon: Globe2, desc: 'Flexible office & home' },
    { label: 'Internships', path: '/internships', icon: GraduationCap, desc: 'Early career & co-ops' },
    { label: 'By Departments', path: '/departments', icon: Layers, desc: 'Browse by role category' },
    { label: 'By Companies', path: '/companies', icon: Building, desc: 'Browse hiring employers' },
  ];

  // Determine if the active route falls under Jobs
  const isJobsActive = 
    jobsSubLinks.some((item) => item.path === currentPath) ||
    currentPath.startsWith('/category/') ||
    currentPath.startsWith('/company/') ||
    currentPath.startsWith('/jobs/');

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setJobsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    };
  }, []);

  const handleNavClick = (path: string) => {
    onNavigate(path);
    setJobsDropdownOpen(false);
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  };

  const handleMouseEnter = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setJobsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setJobsDropdownOpen(false);
    }, 150);
  };

  const handleSearchSubmit = (keyword: string) => {
    onSearchChange(keyword);
    if (currentPath !== '/' && !currentPath.includes('-jobs') && currentPath !== '/jobs') {
      onNavigate('/');
    }
    setMobileSearchOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-3">
        
        {/* Brand Logo - Job tag removed per user requirement */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => handleNavClick('/')}
            className="flex items-center focus:outline-none group cursor-pointer"
            aria-label="inaquired home"
          >
            <img 
              src="/logo/logo.svg" 
              alt="inaquired" 
              className="site-logo h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105" 
            />
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

        {/* Desktop Navigation Links: Jobs (dropdown), About, Contact */}
        <nav className="hidden lg:flex items-center gap-1.5">
          
          {/* Jobs Dropdown Menu */}
          <div 
            className="relative"
            ref={dropdownRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => setJobsDropdownOpen(!jobsDropdownOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs lg:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                isJobsActive
                  ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950/60'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
              }`}
              aria-expanded={jobsDropdownOpen}
            >
              <span>Jobs</span>
              <ChevronDown 
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  jobsDropdownOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                }`} 
              />
            </button>

            {/* Dropdown Menu Popup */}
            {jobsDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-60 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900/95 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Browse Opportunities
                </div>
                <div className="space-y-0.5 mt-1">
                  {jobsSubLinks.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPath === item.path;
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNavClick(item.path)}
                        className={`flex items-center gap-2.5 w-full rounded-xl px-2.5 py-2 text-xs font-semibold text-left transition-colors cursor-pointer group ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-300'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
                        }`}
                      >
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-colors ${
                          isActive 
                            ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300' 
                            : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-indigo-950/80 dark:group-hover:text-indigo-400'
                        }`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 truncate">
                          <div className="leading-tight">{item.label}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal truncate">
                            {item.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* About Link */}
          <button
            type="button"
            onClick={() => handleNavClick('/about')}
            className={`px-3 py-1.5 text-xs lg:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
              currentPath === '/about'
                ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950/60'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
            }`}
          >
            About
          </button>

          {/* Contact Link */}
          <button
            type="button"
            onClick={() => handleNavClick('/contact')}
            className={`px-3 py-1.5 text-xs lg:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
              currentPath === '/contact'
                ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950/60'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
            }`}
          >
            Contact
          </button>

        </nav>

        {/* Right Header Action Controls: Bell removed, only theme toggle switch placed */}
        <div className="flex items-center gap-2 shrink-0">
          
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

          {/* Modern Theme Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={theme === 'dark'}
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle dark/light theme switch"
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
              theme === 'dark'
                ? 'border-indigo-500/40 bg-slate-800'
                : 'border-slate-300 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            <span className="sr-only">Toggle theme switch</span>

            {/* In-track Sun (light mode indicator) */}
            <span className="absolute left-1.5 flex items-center justify-center pointer-events-none">
              <Sun className={`h-3.5 w-3.5 transition-opacity ${theme === 'dark' ? 'opacity-25 text-slate-500' : 'opacity-100 text-amber-500'}`} />
            </span>

            {/* In-track Moon (dark mode indicator) */}
            <span className="absolute right-1.5 flex items-center justify-center pointer-events-none">
              <Moon className={`h-3.5 w-3.5 transition-opacity ${theme === 'dark' ? 'opacity-100 text-indigo-400' : 'opacity-25 text-slate-400'}`} />
            </span>

            {/* Sliding circular thumb */}
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-flex h-6 w-6 transform items-center justify-center rounded-full shadow-md ring-0 transition duration-200 ease-in-out ${
                theme === 'dark'
                  ? 'translate-x-6 bg-slate-900 border border-indigo-400/40'
                  : 'translate-x-0.5 bg-white border border-slate-200'
              }`}
            >
              {theme === 'dark' ? (
                <Moon className="h-3 w-3 text-indigo-300" />
              ) : (
                <Sun className="h-3 w-3 text-amber-500" />
              )}
            </span>
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
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
        <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 dark:border-slate-800 dark:bg-slate-900 shadow-xl space-y-4">
          <div className="md:hidden pb-1">
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

          {/* Mobile Navigation Links */}
          <div className="space-y-3">
            <div>
              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Jobs
              </div>
              <div className="mt-1 space-y-1">
                {jobsSubLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavClick(item.path)}
                      className={`flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                        isActive
                          ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950 font-bold'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="h-4 w-4 text-slate-400" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-1">
              <button
                onClick={() => handleNavClick('/about')}
                className={`block w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                  currentPath === '/about'
                    ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                About
              </button>
              <button
                onClick={() => handleNavClick('/contact')}
                className={`block w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                  currentPath === '/contact'
                    ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                Contact
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
