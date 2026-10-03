import React from 'react';

interface JobIconProps {
  className?: string;
}

/**
 * Custom JobIcon - replaces the lucide Briefcase icon project-wide.
 * Based on the search-alert style SVG (magnifying glass with exclamation indicator).
 */
export const JobIcon: React.FC<JobIconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
    <path d="M11 7v4" />
    <path d="M11 15h.01" />
  </svg>
);
