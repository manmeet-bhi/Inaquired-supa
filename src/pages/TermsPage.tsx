import React from 'react';
import { ArrowLeft, FileText, AlertTriangle, ShieldCheck, Mail, CheckCircle2 } from 'lucide-react';

interface TermsPageProps {
  onNavigate: (path: string) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          User Agreement
        </span>
        <h1 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Terms of Service - Inaquired
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          Last Updated: February 2026
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
        
        {/* Agreement to Terms */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Agreement to Terms
            </h2>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            By accessing and using Inaquired, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        {/* Use License */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Use License
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Permission is granted to temporarily use Inaquired for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or for any public display</li>
            <li>Attempt to reverse engineer any software contained on the website</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
          </ul>
        </section>

        {/* User Experience (Anonymous Access) */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            User Experience (Anonymous Access)
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            You can access most features of Inaquired without creating an account. We do not require or collect personal information like your name, email, or phone number to browse the site.
          </p>
        </section>

        {/* User Content */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            User Content
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            By posting content on Inaquired, you grant us a non-exclusive, royalty-free license to use, modify, and display such content. You represent that:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <li>You own or have the necessary rights to the content</li>
            <li>The content does not violate any third-party rights</li>
            <li>The content is accurate and not misleading</li>
            <li>The content complies with applicable laws and regulations</li>
          </ul>
        </section>

        {/* Prohibited Uses */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Prohibited Uses
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            You may not use our service:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
            <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
            <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
            <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
            <li>To submit false or misleading information</li>
            <li>To upload or transmit viruses or any other type of malicious code</li>
          </ul>
        </section>

        {/* Job Postings */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Job Postings
          </h2>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                For Employers
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Job postings must be accurate and legal. Since we do not collect personal data, employers should provide external contact methods in their descriptions for applications.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Third-Party Job Listings
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Inaquired is a job aggregation platform that collects and shares job postings from publicly available sources such as company career pages, recruitment portals, and other job platforms. We do not guarantee:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <li>The accuracy of job information</li>
                <li>Hiring decisions made by companies</li>
                <li>The authenticity of external employers</li>
              </ul>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 pt-1 leading-relaxed">
                Users are advised to verify job details directly on the official company website before applying. Inaquired is not responsible for recruitment processes, interview scheduling, job offers, or employment decisions made by companies.
              </p>
            </div>
          </div>
        </section>

        {/* External Links & Accuracy of Listings */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-5">
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              External Links
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Our website may contain links to third-party websites or services that are not owned or controlled by Inaquired. We are not responsible for the content, policies, or practices of any third-party websites. Users access external websites at their own risk.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Accuracy of Listings
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              While we strive to keep job listings updated and accurate, we cannot guarantee that all information is complete, current, or error-free. Job postings may change or be removed by the original employer at any time.
            </p>
          </div>
        </section>

        {/* Fraud Warning */}
        <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 sm:p-8 dark:border-amber-900/60 dark:bg-amber-950/40 space-y-2">
          <div className="flex items-center gap-2.5 text-amber-700 dark:text-amber-400 font-bold text-base sm:text-lg">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>Fraud Warning</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            Inaquired does not charge job seekers for applying to jobs. If any person or company asks for payment in the name of recruitment, please verify carefully and report suspicious activity.
          </p>
        </section>

        {/* Disclaimer & Limitations */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-5">
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Disclaimer
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              The materials on Inaquired are provided on an 'as is' basis. Inaquired makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Limitations
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              In no event shall Inaquired or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Inaquired, even if Inaquired or its authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </div>
        </section>

        {/* Termination & Changes to Terms */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-5">
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Termination
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Changes to Terms
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new Terms of Service on this page and updating the "Last updated" date.
            </p>
          </div>
        </section>

        {/* Contact Information */}
        <section className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-6 sm:p-8 dark:border-indigo-900/60 dark:bg-indigo-950/40 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Contact Information
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            If you have any questions about these Terms of Service, please contact us at:
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
