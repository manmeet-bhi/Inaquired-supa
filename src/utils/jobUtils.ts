import { Job, JobFiltersState } from '../types/job';

/**
 * Creates a clean, URL-safe slug from a job title and company name
 */
export function generateJobSlug(title: string, companyName: string): string {
  const base = `${title}-${companyName}`
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base}-${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Formats salary into a human-readable display
 */
export function formatSalary(min?: number, max?: number, currency: string = 'USD'): string {
  if (!min && !max) return 'Not disclosed';
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : currency === 'CAD' ? 'CA$' : currency === 'AUD' ? 'A$' : `${currency} `;
  
  if (min && max) {
    return `${symbol}${min.toLocaleString('en-US')} - ${symbol}${max.toLocaleString('en-US')} / yr`;
  }
  if (min) {
    return `${symbol}${min.toLocaleString('en-US')} / yr`;
  }
  return `Up to ${symbol}${max?.toLocaleString('en-US')} / yr`;
}

/**
 * Formats a relative date string (e.g. "2 hours ago", "Yesterday", "3 days ago")
 */
export function formatRelativeDate(isoDateStr?: string): string {
  if (!isoDateStr) return 'Recently';
  const date = new Date(isoDateStr);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just posted';
  if (diffInHours === 1) return '1 hour ago';
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 30) return `${diffInDays} days ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function sortJobsByNewest(jobs: Job[]): Job[] {
  return [...jobs].sort((a, b) => {
    const dateA = Date.parse(a.publishedAt || a.createdAt);
    const dateB = Date.parse(b.publishedAt || b.createdAt);
    return (Number.isFinite(dateB) ? dateB : 0) - (Number.isFinite(dateA) ? dateA : 0);
  });
}

/**
 * Filters jobs according to filter state criteria
 */
export function filterJobs(jobs: Job[], filters: JobFiltersState): Job[] {
  return jobs.filter((job) => {
    // Keyword search in title, company, description, and tags
    if (filters.keyword.trim()) {
      const q = filters.keyword.toLowerCase();
      const matchTitle = job.title.toLowerCase().includes(q);
      const matchCompany = job.companyName.toLowerCase().includes(q);
      const matchDesc = job.description.toLowerCase().includes(q);
      const matchTags = job.tags.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchCompany && !matchDesc && !matchTags) {
        return false;
      }
    }

    // Location search
    if (filters.location.trim()) {
      const locQ = filters.location.toLowerCase();
      if (!job.location.toLowerCase().includes(locQ)) {
        return false;
      }
    }

    // Category filter
    if (filters.category && filters.category !== 'all') {
      if (job.category.toLowerCase() !== filters.category.toLowerCase()) {
        return false;
      }
    }

    // Work arrangement filter
    if (filters.workArrangement && filters.workArrangement !== 'all') {
      if (job.workArrangement !== filters.workArrangement) {
        return false;
      }
    }

    // Job type filter
    if (filters.jobType && filters.jobType !== 'all') {
      if (job.jobType !== filters.jobType) {
        return false;
      }
    }

    // Experience level filter
    if (filters.experienceLevel && filters.experienceLevel !== 'all') {
      if (job.experienceLevel !== filters.experienceLevel) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    if (filters.sortBy === 'newest') {
      const dateA = new Date(a.publishedAt || a.createdAt).getTime();
      const dateB = new Date(b.publishedAt || b.createdAt).getTime();
      return dateB - dateA;
    }
    if (filters.sortBy === 'salary') {
      return (b.salaryMax || 0) - (a.salaryMax || 0);
    }
    if (filters.sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });
}

/**
 * Real-time search filter matching jobs by title or company keywords
 */
export function searchJobsByKeyword(jobs: Job[], keyword: string): Job[] {
  if (!keyword || !keyword.trim()) return [];
  const q = keyword.toLowerCase().trim();
  return jobs.filter((job) => {
    const matchTitle = job.title.toLowerCase().includes(q);
    const matchCompany = job.companyName.toLowerCase().includes(q);
    return matchTitle || matchCompany;
  });
}
