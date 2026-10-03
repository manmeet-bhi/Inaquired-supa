import React from 'react';
import { ArrowLeft, Shield, Lock, EyeOff, Server, Mail, ExternalLink } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onNavigate: (path: string) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigate }) => {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Transparency & Legal
        </span>
        <h1 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Privacy Policy - Inaquired
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          Last Updated: February 2026
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
        
        {/* Introduction */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400">
              <Shield className="h-5 w-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Introduction
            </h2>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            At Inaquired, we value your privacy and are committed to protecting your information. This Privacy Policy explains how information is handled when you visit our website and use our services.
          </p>
        </section>

        {/* Information We Collect */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Information We Collect
          </h2>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-emerald-500" />
                <span>No Mandatory Personal Information</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Inaquired allows users to browse job listings without creating an account or submitting personal information such as name, email address, or phone number.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Server className="h-4 w-4 text-blue-500" />
                <span>Technical and Log Data</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Like most websites, we may automatically collect limited technical information when you visit our website, including:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <li>IP address (partially anonymized where possible)</li>
                <li>Browser type and device information</li>
                <li>Pages visited</li>
                <li>Date and time of access</li>
                <li>Referring website</li>
              </ul>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 pt-1">
                This information is used only for: Website performance, Security monitoring, and Improving user experience.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Cookies and Tracking Technologies
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                We use cookies and similar technologies to improve the functionality and performance of our website. Cookies help us understand how users interact with our platform and allow us to improve our services.
              </p>
            </div>
          </div>
        </section>

        {/* Third-Party Services */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Third-Party Services
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Inaquired may use trusted third-party services to operate and improve the website, such as analytics services, hosting providers, and content delivery networks (CDN). These providers may process limited technical data necessary for website functionality.
          </p>
        </section>

        {/* External Job Listings */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            External Job Listings
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Inaquired is a job aggregation platform that shares job opportunities collected from publicly available sources such as company career pages and recruitment portals. When you click on a job listing, you may be redirected to an external website to complete your application. These external websites operate independently and have their own privacy policies. We encourage users to review those policies before providing personal information.
          </p>
        </section>

        {/* How We Use Information */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            How We Use Information
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Since we do not collect personal data, we only use technical data to:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <li>Maintain and secure our website</li>
            <li>Monitor for technical issues or errors</li>
            <li>Analyze aggregate usage trends to improve the user experience</li>
          </ul>
        </section>

        {/* Information Sharing & Security */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-5">
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Information Sharing
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              We do not sell or rent personal information to third parties. Since we do not require personal information to use the website, most users browse the platform anonymously. Limited technical data may be processed by essential service providers only for website operation and security.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="h-4 w-4 text-indigo-500" />
              <span>Data Security</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              We implement reasonable security measures to protect the website and its users. However, no method of internet transmission or electronic storage is completely secure.
            </p>
          </div>
        </section>

        {/* Your Rights & Cookies */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-5">
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Your Rights
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Since we do not require personal accounts or collect personal details directly, most users interact with our website anonymously. However, you may:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <li>Control cookies through browser settings</li>
              <li>Disable tracking technologies</li>
              <li>Stop using the website at any time</li>
            </ul>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Cookies
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              We use cookies and similar technologies to enhance your experience on our website. You can control cookie settings through your browser preferences. For detailed information, please read our{' '}
              <button
                onClick={() => onNavigate('/cookies')}
                className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline font-semibold cursor-pointer"
              >
                Cookie Policy
              </button>.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Changes to This Privacy Policy
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </div>
        </section>

        {/* Contact Us */}
        <section className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-6 sm:p-8 dark:border-indigo-900/60 dark:bg-indigo-950/40 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Contact Us
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <a
            href="mailto:inaquired@gmail.com"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline underline-offset-2"
          >
            <span>Email: inaquired@gmail.com</span>
          </a>
        </section>

      </div>
    </div>
  );
};
