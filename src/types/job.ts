export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship';
export type WorkArrangement = 'remote' | 'on-site' | 'hybrid';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'internship';
export type JobStatus = 'published' | 'draft' | 'archived';

export interface Job {
  id: string;
  title: string;
  slug: string;
  companyName: string;
  location: string;
  jobType: JobType;
  workArrangement: WorkArrangement;
  category: string;
  experienceLevel: ExperienceLevel;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  description: string;
  responsibilities: string;
  requirements: string;
  benefits?: string;
  applicationUrl: string;
  applicationDeadline?: string;
  tags: string[];
  status: JobStatus;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  createdBy?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoImageUrl?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

export interface JobFiltersState {
  keyword: string;
  location: string;
  category: string;
  workArrangement: string; // 'all' | WorkArrangement
  jobType: string; // 'all' | JobType
  experienceLevel: string; // 'all' | ExperienceLevel
  sortBy: 'newest' | 'salary' | 'title';
}


export interface PushSubscriptionData {
  id: string;
  endpoint: string;
  subscribedAt: string;
  categories: string[];
}
