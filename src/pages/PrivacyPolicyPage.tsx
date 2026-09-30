import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onNavigate: (path: string) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigate }) => {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <div>
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 mb-4 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </button>

        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Transparency & Legal
        </span>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Privacy Policy
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Last revised: September 2026
        </p>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed text-slate-700 dark:text-slate-300 space-y-6">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Core Commitment: No Candidate Accounts</h2>
          <p>
            inaquired does not require or offer user account registration for job searchers. You can browse, filter, inspect, and apply to any job listing without creating a profile, submitting a password, or exposing personal contact records to our servers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Information Stored and Processed</h2>
          <p>
            When utilizing inaquired, the following limited data may be processed:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
            <li><strong>Theme Preference:</strong> Stored locally on your device via <code>localStorage</code> to maintain light/dark preference.</li>
            <li><strong>Push Notification Tokens:</strong> If you explicitly grant browser push notification permissions, an anonymous subscription token is saved to deliver real-time job opening alerts. You can revoke this anytime in browser settings.</li>
            <li><strong>Support Messages:</strong> If you contact us via the contact form, your name, email, and inquiry are held exclusively to address your inquiry and never sold to third parties.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Third-Party Job Links</h2>
          <p>
            inaquired aggregates and publishes direct links to employer application portals (e.g. Greenhouse, Lever, Ashby, Workday, direct corporate websites). When clicking "Apply Now", you leave inaquired and enter the employer's privacy domain. We advise reviewing their respective privacy policies.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Administrative Security & Authentication</h2>
          <p>
            Only vetted administrators are permitted to sign into the CMS panel. Administrative logins utilize Firebase Authentication with multi-factor authentication (TOTP 2FA) to safeguard database writes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">5. Contact Us</h2>
          <p>
            For questions regarding privacy practices, contact our team via the <button onClick={() => onNavigate('/contact')} className="text-indigo-600 underline dark:text-indigo-400">Contact page</button>.
          </p>
        </section>
      </div>
    </div>
  );
};
