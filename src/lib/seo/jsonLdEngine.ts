/**
 * Centralized Structured Data / JSON-LD Engine
 * Generates Google-compliant Schema.org markup for JobPosting, Breadcrumbs, Organization, and WebSite.
 */

export interface BreadcrumbItem {
  name: string;
  path: string;
}

/**
 * Maps database job types to standard Schema.org EmploymentType enum
 */
export function mapEmploymentType(jobType?: string): string {
  const norm = (jobType || '').toLowerCase().trim();
  switch (norm) {
    case 'full-time':
      return 'FULL_TIME';
    case 'part-time':
      return 'PART_TIME';
    case 'contract':
      return 'CONTRACTOR';
    case 'internship':
      return 'INTERN';
    default:
      return 'FULL_TIME';
  }
}

/**
 * Generate Schema.org JobPosting structured data
 */
export function generateJobPostingJsonLd(job: any, origin: string): Record<string, any> {
  const baseOrigin = origin.replace(/\/+$/, '');
  const isRemote = job.work_arrangement === 'remote';
  const isHybrid = job.work_arrangement === 'hybrid';

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    identifier: {
      '@type': 'PropertyValue',
      name: job.company_name,
      value: job.id
    },
    datePosted: job.published_at || job.created_at,
    validThrough: job.application_deadline || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    employmentType: mapEmploymentType(job.job_type),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company_name,
      sameAs: job.company_website || undefined,
      logo: job.attachment_url || undefined
    },
    directApply: Boolean(job.application_url)
  };

  // Remote vs On-Site Location Schema
  if (isRemote) {
    schema.jobLocationType = 'TELECOMMUTE';
    schema.applicantLocationRequirements = {
      '@type': 'Country',
      name: 'Worldwide'
    };
  } else {
    schema.jobLocation = {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location || 'Remote'
      }
    };
  }

  // Base Salary Schema
  if (job.salary_min) {
    schema.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: job.currency || 'USD',
      value: {
        '@type': 'QuantitativeValue',
        minValue: Number(job.salary_min),
        maxValue: Number(job.salary_max || job.salary_min),
        unitText: 'YEAR'
      }
    };
  }

  return schema;
}

/**
 * Generate Schema.org BreadcrumbList structured data
 */
export function generateBreadcrumbJsonLd(crumbs: BreadcrumbItem[], origin: string): Record<string, any> {
  const baseOrigin = origin.replace(/\/+$/, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: crumb.name,
      item: `${baseOrigin}${crumb.path === '/' ? '' : crumb.path}`
    }))
  };
}

/**
 * Generate Schema.org WebSite structured data
 */
export function generateWebSiteJsonLd(siteName: string, origin: string): Record<string, any> {
  const baseOrigin = origin.replace(/\/+$/, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName || 'inaquired',
    url: baseOrigin,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseOrigin}/jobs?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };
}

/**
 * Generate Schema.org Organization structured data
 */
export function generateOrganizationJsonLd(siteName: string, origin: string, twitterHandle?: string): Record<string, any> {
  const baseOrigin = origin.replace(/\/+$/, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName || 'inaquired',
    url: baseOrigin,
    logo: `${baseOrigin}/logo/logo.svg`,
    sameAs: twitterHandle ? [`https://x.com/${twitterHandle.replace('@', '')}`] : []
  };
}
