import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, ArrowLeft, Shield } from 'lucide-react';

interface ContactPageProps {
  onNavigate: (path: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'job_inquiry',
    message: '',
    honeypot: '', // anti-bot spam prevention
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const encodeFormData = (data: Record<string, string>) => {
    return Object.keys(data)
      .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
      .join('&');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Spam honeypot trap
    if (formData.honeypot) {
      setSubmitted(true);
      return;
    }

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encodeFormData({
          'form-name': 'contact',
          'bot-field': formData.honeypot,
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject,
          message: formData.message.trim(),
        }),
      });
      if (!response.ok) {
        throw new Error(`Netlify rejected the contact submission (${response.status}).`);
      }
      setSubmitted(true);
    } catch (err) {
      console.error('Netlify contact form submission failed:', err);
      setError('We could not send your message. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Get in Touch
        </span>
        <h1 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Contact Support & Feedback
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Have an inquiry about a job listing, employer verification, or technical platform feedback? Send us a message below.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {submitted ? (
          <div className="py-12 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Message Dispatched</h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
              Thank you for contacting inaquired. Our moderation team reviews all candidate submissions within 1–2 business days.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({ name: '', email: '', subject: 'job_inquiry', message: '', honeypot: '' });
              }}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Send Another Inquiry
            </button>
          </div>
        ) : (
          <form
            name="contact"
            method="POST"
            data-netlify="true"
            data-netlify-honeypot="bot-field"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Hidden field for Netlify Form identification */}
            <input type="hidden" name="form-name" value="contact" />

            {/* Hidden honeypot field for bot spam prevention */}
            <p className="hidden" style={{ display: 'none' }}>
              <label>
                Don’t fill this out if you're human:
                <input
                  name="bot-field"
                  tabIndex={-1}
                  value={formData.honeypot}
                  onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                />
              </label>
            </p>

            {error && (
              <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="alex@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Inquiry Topic
              </label>
              <select
                name="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
              >
                <option value="job_inquiry">Listing Verification or Report an Expired Role</option>
                <option value="employer_submission">Employer Submission Request</option>
                <option value="bug_report">Technical or Accessibility Feedback</option>
                <option value="privacy">Privacy & Data Inquiry</option>
                <option value="other">Other Inquiries</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Your Message *
              </label>
              <textarea
                name="message"
                required
                rows={5}
                placeholder="How can we assist you?"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs sm:text-sm font-bold text-white hover:bg-indigo-700 focus:outline-none disabled:opacity-50 transition-all"
            >
              {loading ? (
                <span>Sending Message...</span>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

    </div>
  );
};
