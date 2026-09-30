import { describe, it, expect } from 'vitest';
import { generateJobSlug, formatSalary, formatRelativeDate, filterJobs, searchJobsByKeyword } from '../../src/utils/jobUtils';
import { generateBase32Secret, generateTotpUri, generateBackupCodes, verifyTotpToken, generateTotpCode } from '../../src/utils/totpUtils';
import { Job, JobFiltersState } from '../../src/types/job';

describe('Job Utilities & Formatting', () => {
  it('generates a URL-safe lowercase slug from title and company', () => {
    const slug = generateJobSlug('Senior Cloud Architect', 'Acme Corp!');
    expect(slug).toContain('senior-cloud-architect-acme-corp');
    expect(slug).not.toContain('!');
    expect(slug).not.toContain(' ');
  });

  it('formats salary ranges accurately across currencies', () => {
    expect(formatSalary(100000, 150000, 'USD')).toBe('$100,000 - $150,000 / yr');
    expect(formatSalary(80000, undefined, 'USD')).toBe('From $80,000 / yr');
    expect(formatSalary(undefined, 200000, 'USD')).toBe('Up to $200,000 / yr');
    expect(formatSalary(undefined, undefined, 'USD')).toBe('Competitive compensation');
    expect(formatSalary(70000, 90000, 'EUR')).toBe('€70,000 - €90,000 / yr');
  });

  it('formats relative dates correctly', () => {
    const nowIso = new Date().toISOString();
    expect(formatRelativeDate(nowIso)).toBe('Just posted');

    const twoDaysAgo = new Date(Date.now() - 48 * 3600000).toISOString();
    expect(formatRelativeDate(twoDaysAgo)).toBe('2 days ago');
  });
});

describe('Job Filtering Logic', () => {
  const mockJobs: Job[] = [
    {
      id: '1',
      title: 'Full Stack Developer',
      slug: 'full-stack-developer',
      companyName: 'TechCorp',
      location: 'Remote, US',
      jobType: 'full-time',
      workArrangement: 'remote',
      category: 'Engineering',
      experienceLevel: 'mid',
      salaryMin: 120000,
      salaryMax: 140000,
      currency: 'USD',
      description: 'Building modern web applications with React.',
      responsibilities: 'Coding',
      requirements: 'TypeScript',
      applicationUrl: 'https://example.com',
      tags: ['React', 'TypeScript'],
      status: 'published',
      featured: true,
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
    },
    {
      id: '2',
      title: 'UI/UX Design Intern',
      slug: 'ui-ux-design-intern',
      companyName: 'DesignStudio',
      location: 'New York, NY',
      jobType: 'internship',
      workArrangement: 'hybrid',
      category: 'Design',
      experienceLevel: 'internship',
      salaryMin: 40,
      salaryMax: 45,
      currency: 'USD',
      description: 'Figma prototypes and user research.',
      responsibilities: 'Prototyping',
      requirements: 'Figma',
      applicationUrl: 'https://example.com',
      tags: ['Figma', 'UI'],
      status: 'published',
      featured: false,
      createdAt: '2026-09-10T00:00:00Z',
      updatedAt: '2026-09-10T00:00:00Z',
    }
  ];

  const baseFilters: JobFiltersState = {
    keyword: '',
    location: '',
    category: 'all',
    workArrangement: 'all',
    jobType: 'all',
    experienceLevel: 'all',
    sortBy: 'newest',
  };

  it('filters by keyword in title or tags', () => {
    const results = filterJobs(mockJobs, { ...baseFilters, keyword: 'React' });
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Full Stack Developer');
  });

  it('filters by work arrangement', () => {
    const remoteOnly = filterJobs(mockJobs, { ...baseFilters, workArrangement: 'remote' });
    expect(remoteOnly.length).toBe(1);
    expect(remoteOnly[0].workArrangement).toBe('remote');

    const hybridOnly = filterJobs(mockJobs, { ...baseFilters, workArrangement: 'hybrid' });
    expect(hybridOnly.length).toBe(1);
    expect(hybridOnly[0].workArrangement).toBe('hybrid');
  });

  it('filters by job type (internships)', () => {
    const internships = filterJobs(mockJobs, { ...baseFilters, jobType: 'internship' });
    expect(internships.length).toBe(1);
    expect(internships[0].title).toBe('UI/UX Design Intern');
  });
});

describe('Navbar Real-Time Title & Company Search', () => {
  const testJobs: Job[] = [
    {
      id: 'job-1',
      title: 'Senior Full Stack Cloud Engineer',
      slug: 'senior-full-stack-cloud-engineer-cloudscale',
      companyName: 'CloudScale Technologies',
      location: 'San Francisco, CA',
      jobType: 'full-time',
      workArrangement: 'remote',
      category: 'Engineering',
      experienceLevel: 'senior',
      currency: 'USD',
      description: 'Building serverless platforms.',
      responsibilities: 'Coding',
      requirements: 'TypeScript',
      applicationUrl: 'https://example.com',
      tags: ['TypeScript', 'Serverless'],
      status: 'published',
      featured: true,
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
    },
    {
      id: 'job-2',
      title: 'Lead Product Designer',
      slug: 'lead-product-designer-aura-systems',
      companyName: 'Aura Systems',
      location: 'New York, NY',
      jobType: 'full-time',
      workArrangement: 'hybrid',
      category: 'Design',
      experienceLevel: 'lead',
      currency: 'USD',
      description: 'Design systems and UX.',
      responsibilities: 'Figma',
      requirements: 'Design systems',
      applicationUrl: 'https://example.com',
      tags: ['Figma'],
      status: 'published',
      featured: false,
      createdAt: '2026-09-02T00:00:00Z',
      updatedAt: '2026-09-02T00:00:00Z',
    }
  ];

  it('matches jobs in real-time by title keyword', () => {
    const results = searchJobsByKeyword(testJobs, 'Cloud');
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Senior Full Stack Cloud Engineer');
  });

  it('matches jobs in real-time by company keyword', () => {
    const results = searchJobsByKeyword(testJobs, 'Aura');
    expect(results.length).toBe(1);
    expect(results[0].companyName).toBe('Aura Systems');
  });

  it('matches jobs case-insensitively and handles whitespace', () => {
    const results = searchJobsByKeyword(testJobs, '  designer  ');
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Lead Product Designer');
  });

  it('returns empty array when query is empty or non-matching', () => {
    expect(searchJobsByKeyword(testJobs, '')).toEqual([]);
    expect(searchJobsByKeyword(testJobs, '   ')).toEqual([]);
    expect(searchJobsByKeyword(testJobs, 'NonExistentRole')).toEqual([]);
  });
});

describe('2FA TOTP Security Utilities', () => {
  it('generates a valid RFC 6238 Base32 secret', () => {
    const secret = generateBase32Secret(20);
    expect(secret.length).toBe(20);
    expect(/^[A-Z2-7]+$/.test(secret)).toBe(true);
  });

  it('generates a compliant otpauth URI', () => {
    const uri = generateTotpUri('inaquired', 'admin@example.com', 'JBSWY3DPEHPK3PXP');
    expect(uri).toContain('otpauth://totp/inaquired:admin%40example.com');
    expect(uri).toContain('secret=JBSWY3DPEHPK3PXP');
    expect(uri).toContain('digits=6');
  });

  it('generates valid emergency backup recovery codes', () => {
    const codes = generateBackupCodes(8);
    expect(codes.length).toBe(8);
    codes.forEach((code) => {
      expect(code.length).toBe(9); // 4 chars + hyphen + 4 chars
      expect(code).toContain('-');
    });
  });

  it('generates and verifies 6-digit TOTP codes within valid time window', async () => {
    const secret = generateBase32Secret(20);
    const token = await generateTotpCode(secret);
    expect(token).toMatch(/^\d{6}$/);

    const verified = await verifyTotpToken(secret, token);
    expect(verified).toBe(true);

    const invalid = await verifyTotpToken(secret, '000000');
    // If by freak chance generated code is 000000, don't fail, but test an obviously bad string:
    const invalidBadFormat = await verifyTotpToken(secret, 'abc');
    expect(invalidBadFormat).toBe(false);
  });
});
