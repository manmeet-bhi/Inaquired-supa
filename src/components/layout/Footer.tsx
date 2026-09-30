import React from 'react';
import { Briefcase, Shield, Globe, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:gap-12">
          
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white dark:bg-indigo-500">
                <Briefcase className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                inaquired
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              A transparent, serverless job portal connecting ambitious talent with verified remote, on-site, hybrid opportunities and paid internships.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Globe className="h-3.5 w-3.5" />
              <span>Real-time cloud platform</span>
            </div>
          </div>

          {/* Job Categories */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Work Formats
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <button 
                  onClick={() => onNavigate('/remote-jobs')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Remote Jobs
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('/onsite-jobs')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  On-Site Opportunities
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('/hybrid-jobs')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Hybrid Roles
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('/internships')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Paid Internships
                </button>
              </li>
            </ul>
          </div>

          {/* Portal Information */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Company & Help
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <button 
                  onClick={() => onNavigate('/about')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  About inaquired
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('/contact')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Contact Support
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('/privacy')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('/terms')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Terms & Conditions
                </button>
              </li>
            </ul>
          </div>

          {/* Governance & Administration */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Platform Governance
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              inaquired maintains strict zero-spam standards. No registration is required for candidates.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => onNavigate('/admin')}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
              >
                <Shield className="h-3.5 w-3.5" />
                Staff CMS Portal
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500">
          <p>© {new Date().getFullYear()} inaquired. All rights reserved. Serverless architecture powered by Firestore.</p>
          <p className="flex items-center gap-1">
            Built for candidate transparency
          </p>
        </div>
      </div>
    </footer>
  );
};
