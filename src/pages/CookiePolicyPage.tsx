import React from 'react';
import { ArrowLeft, Cookie, Shield, Sliders, ExternalLink, Mail } from 'lucide-react';
import { openCookieBanner } from '../utils/cookieConsent';

interface CookiePolicyPageProps {
  onNavigate: (path: string) => void;
}

export const CookiePolicyPage: React.FC<CookiePolicyPageProps> = ({ onNavigate }) => {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Legal & Privacy
        </span>
        <h1 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Cookie Policy - Inaquired
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          Last Updated: February 2026
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
        
        {/* What Are Cookies */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400">
              <Cookie className="h-5 w-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              What Are Cookies
            </h2>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Cookies are small text files stored on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
          </p>
        </section>

        {/* How We Use Cookies */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            How We Use Cookies
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Inaquired uses cookies to enhance your browsing experience and provide personalized services. We use cookies for the following purposes:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <li>To remember user preferences and improve browsing experience</li>
            <li>To analyze website traffic and usage patterns</li>
            <li>To improve website functionality and user experience</li>
            <li>To prevent fraud and enhance security</li>
          </ul>
        </section>

        {/* Types of Cookies We Use */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Types of Cookies We Use
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Essential Cookies
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                These cookies are necessary for the website to function properly. They enable basic functions like page navigation, access to secure areas, and authentication.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Performance Cookies
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                These cookies collect information about how visitors use our website, such as which pages are visited most often. This data helps us improve website performance.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Functionality Cookies
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                These cookies allow the website to remember choices you make and provide enhanced, personalized features such as saved job preferences.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Analytics Cookies
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                We use analytics cookies to understand how our website is being used and to improve our services based on user behavior patterns.
              </p>
            </div>
          </div>
        </section>

        {/* Third-Party Cookies */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Third-Party Cookies
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Inaquired may use third-party services that place cookies on your device when you visit our website. These cookies help us understand how users interact with our platform and improve our services. These services may include:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <li>Google Analytics (to analyze website traffic)</li>
            <li>Content delivery networks (for faster website performance)</li>
            <li>Social media integrations (for sharing content)</li>
          </ul>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300 pt-1">
            These third-party services have their own privacy and cookie policies.
          </p>
        </section>

        {/* External Websites */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            External Websites
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Some links on Inaquired redirect users to external websites such as company career pages or job application portals. These external websites may use their own cookies and tracking technologies, which are not controlled by Inaquired. We recommend reviewing the cookie and privacy policies of those websites.
          </p>
        </section>

        {/* Managing Your Cookie Preferences */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Managing Your Cookie Preferences
            </h2>
            <button
              onClick={openCookieBanner}
              className="inline-flex items-center gap-1.5 self-start px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:text-indigo-400 dark:hover:bg-indigo-900 transition-colors cursor-pointer"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Review Banner Settings</span>
            </button>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            You can control and manage cookies through your browser settings. Most browsers allow you to:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <li>View what cookies are stored on your device</li>
            <li>Delete cookies individually or all at once</li>
            <li>Block cookies from specific websites</li>
            <li>Block all cookies</li>
            <li>Set preferences for different types of cookies</li>
          </ul>

          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 text-xs">
              <span className="font-bold text-slate-900 dark:text-white">Chrome:</span>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5">Settings → Privacy and Security → Cookies and other site data.</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 text-xs">
              <span className="font-bold text-slate-900 dark:text-white">Firefox:</span>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5">Options → Privacy & Security → Cookies and Site Data.</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 text-xs">
              <span className="font-bold text-slate-900 dark:text-white">Safari:</span>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5">Preferences → Privacy → Manage Website Data.</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 text-xs">
              <span className="font-bold text-slate-900 dark:text-white">Edge:</span>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5">Settings → Cookies and site permissions → Cookies and site data.</p>
            </div>
          </div>
        </section>

        {/* Cookie Consent & Impact */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Cookie Consent
            </h2>
            <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              By continuing to use our website, you agree to the use of cookies as described in this Cookie Policy. You can manage or disable cookies at any time through your browser settings.
            </p>
          </div>

          <div className="pt-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Impact of Disabling Cookies
            </h3>
            <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Please note that disabling cookies may affect the functionality of our website. Some features may not work properly, and you may not be able to access certain areas or receive personalized content.
            </p>
          </div>

          <div className="pt-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Updates to This Cookie Policy
            </h3>
            <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We encourage you to review this policy periodically.
            </p>
          </div>
        </section>

        {/* Questions About Cookies */}
        <section className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-6 sm:p-8 dark:border-indigo-900/60 dark:bg-indigo-950/40 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Questions About Cookies?
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            If you have any questions about our use of cookies or this Cookie Policy, please contact us at:
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
