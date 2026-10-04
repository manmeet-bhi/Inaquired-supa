import { supabase } from '../lib/supabase';
import { Job } from '../types/job';
import { INITIAL_JOBS } from './seedData';

export type Unsubscribe = () => void;

function mapFromDb(row: any): Job {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    companyName: row.company_name || row.companyName,
    location: row.location,
    jobType: row.job_type || row.jobType,
    workArrangement: row.work_arrangement || row.workArrangement,
    category: row.category,
    experienceLevel: row.experience_level || row.experienceLevel,
    salaryMin: row.salary_min != null ? Number(row.salary_min) : row.salaryMin,
    salaryMax: row.salary_max != null ? Number(row.salary_max) : row.salaryMax,
    currency: row.currency || 'USD',
    description: row.description,
    responsibilities: row.responsibilities,
    requirements: row.requirements,
    benefits: row.benefits,
    applicationUrl: row.application_url || row.applicationUrl,
    applicationDeadline: row.application_deadline || row.applicationDeadline,
    tags: row.tags || [],
    status: row.status,
    featured: Boolean(row.featured),
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
    publishedAt: row.published_at || row.publishedAt,
    createdBy: row.created_by || row.createdBy,
    seoTitle: row.seo_title || row.seoTitle,
    seoDescription: row.seo_description || row.seoDescription,
    seoImageUrl: row.seo_image_url || row.seoImageUrl,
    canonicalUrl: row.canonical_url || row.canonicalUrl,
    noIndex: row.no_index !== undefined ? Boolean(row.no_index) : undefined,
  };
}

function mapToDb(job: Partial<Job>): Record<string, any> {
  const row: Record<string, any> = {};
  if (job.title !== undefined) row.title = job.title;
  if (job.slug !== undefined) row.slug = job.slug;
  if (job.companyName !== undefined) row.company_name = job.companyName;
  if (job.location !== undefined) row.location = job.location;
  if (job.jobType !== undefined) row.job_type = job.jobType;
  if (job.workArrangement !== undefined) row.work_arrangement = job.workArrangement;
  if (job.category !== undefined) row.category = job.category;
  if (job.experienceLevel !== undefined) row.experience_level = job.experienceLevel;
  if (job.salaryMin !== undefined) row.salary_min = job.salaryMin;
  if (job.salaryMax !== undefined) row.salary_max = job.salaryMax;
  if (job.currency !== undefined) row.currency = job.currency;
  if (job.description !== undefined) row.description = job.description;
  if (job.responsibilities !== undefined) row.responsibilities = job.responsibilities;
  if (job.requirements !== undefined) row.requirements = job.requirements;
  if (job.benefits !== undefined) row.benefits = job.benefits;
  if (job.applicationUrl !== undefined) row.application_url = job.applicationUrl;
  if (job.applicationDeadline !== undefined) row.application_deadline = job.applicationDeadline;
  if (job.tags !== undefined) row.tags = job.tags;
  if (job.status !== undefined) row.status = job.status;
  if (job.featured !== undefined) row.featured = job.featured;
  if (job.createdAt !== undefined) row.created_at = job.createdAt;
  if (job.updatedAt !== undefined) row.updated_at = job.updatedAt;
  if (job.publishedAt !== undefined) row.published_at = job.publishedAt;
  if (job.createdBy !== undefined) row.created_by = job.createdBy;
  if (job.seoTitle !== undefined) row.seo_title = job.seoTitle;
  if (job.seoDescription !== undefined) row.seo_description = job.seoDescription;
  if (job.seoImageUrl !== undefined) row.seo_image_url = job.seoImageUrl;
  if (job.canonicalUrl !== undefined) row.canonical_url = job.canonicalUrl;
  if (job.noIndex !== undefined) row.no_index = job.noIndex;
  return row;
}

async function fetchPublicJobs(params = ''): Promise<Job[]> {
  const response = await fetch(`/api/public/jobs${params}`);
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || `Public jobs request failed with status ${response.status}.`);
  }
  if (!Array.isArray(result.jobs)) {
    throw new Error('Public jobs endpoint returned an invalid response.');
  }
  return result.jobs.map(mapFromDb);
}

/**
 * Polls the server-side public jobs endpoint so archived jobs stay protected by RLS.
 */
export function subscribeToPublicJobs(
  onUpdate: (jobs: Job[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  let isSubscribed = true;
  let isFetching = false;

  const refreshPublicJobs = async () => {
    if (isFetching) return;
    isFetching = true;
    try {
      const jobs = await fetchPublicJobs();
      if (isSubscribed) onUpdate(jobs);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Public jobs endpoint request failed:', error);
      if (isSubscribed && onError) onError(error);
    } finally {
      isFetching = false;
    }
  };

  void refreshPublicJobs();
  const intervalId = window.setInterval(() => void refreshPublicJobs(), 30_000);

  return () => {
    isSubscribed = false;
    window.clearInterval(intervalId);
  };
}

/**
 * Subscribes to all jobs (for admin panel) directly from Supabase PostgreSQL.
 */
export function subscribeToAllJobsForAdmin(
  onUpdate: (jobs: Job[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  let isSubscribed = true;

  const fetchAllJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch all jobs error:', error.message);
        if (onError) onError(new Error(error.message));
        return;
      }

      if (isSubscribed && data) {
        onUpdate(data.map(mapFromDb));
      }
    } catch (err: any) {
      console.error('Network error in Supabase fetch all jobs:', err);
      if (onError) onError(err);
    }
  };

  fetchAllJobs();

  const channel = supabase
    .channel('public:admin_jobs')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'jobs' },
      () => {
        fetchAllJobs();
      }
    )
    .subscribe();

  return () => {
    isSubscribed = false;
    supabase.removeChannel(channel);
  };
}

/**
 * Fetches a single job by its unique slug or ID from Supabase.
 */
export async function getJobBySlug(slug: string): Promise<Job | null> {
  const cleanSlug = slug.replace(/[^a-zA-Z0-9._-]/g, '').trim();
  if (!cleanSlug) return null;

  try {
    const jobs = await fetchPublicJobs(`?slug=${encodeURIComponent(cleanSlug)}`);
    return jobs[0] || null;
  } catch (error) {
    console.error('Public job lookup failed:', error);
    throw error;
  }
}

/**
 * Searches public jobs through the server endpoint.
 */
export async function searchJobsInDatabase(query: string, limit: number = 20): Promise<Job[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];
  const params = new URLSearchParams({ q: cleanQuery, limit: String(limit) });
  return fetchPublicJobs(`?${params.toString()}`);
}

/**
 * Creates a new job in Supabase PostgreSQL.
 */
export async function createJob(jobData: Omit<Job, 'id'>, customId?: string): Promise<string> {
  const id = customId || `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullJob: Job = {
    id,
    ...jobData,
    createdAt: jobData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const row = {
    id,
    ...mapToDb(fullJob),
  };
  const { error } = await supabase.from('jobs').insert(row);
  if (error) {
    console.error('Supabase insert job error:', error.message);
    throw new Error(error.message);
  }

  return id;
}

/**
 * Updates an existing job in Supabase PostgreSQL.
 */
export async function updateJob(jobId: string, updates: Partial<Job>): Promise<void> {
  const row = {
    ...mapToDb(updates),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('jobs').update(row).eq('id', jobId);
  if (error) {
    console.error('Supabase update job error:', error.message);
    throw new Error(error.message);
  }
}

/**
 * Deletes a job permanently from Supabase PostgreSQL.
 */
export async function deleteJob(jobId: string): Promise<void> {
  const { error } = await supabase.from('jobs').delete().eq('id', jobId);
  if (error) {
    console.error('Supabase delete job error:', error.message);
    throw new Error(error.message);
  }
}

/**
 * Seeds initial jobs into Supabase ONLY if the table is completely empty.
 * Used for explicit administrator setup or initial provisioning.
 */
export async function seedInitialJobsIfEmpty(): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error checking jobs count for seed:', error.message);
      return false;
    }

    if (count === 0) {
      console.info('Seeding initial verified jobs into Supabase...');
      const rows = INITIAL_JOBS.map((j, idx) => ({
        id: `job_seed_${idx + 1}`,
        ...mapToDb(j),
      }));
      const { error: insertError } = await supabase.from('jobs').upsert(rows);
      if (insertError) {
        console.error('Error inserting initial jobs:', insertError.message);
        return false;
      }
      return true;
    }
    return false;
  } catch (err) {
    console.error('Initial seeding exception:', err);
    return false;
  }
}
