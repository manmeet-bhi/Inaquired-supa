import { supabase, testSupabaseConnection } from '../src/lib/supabase';
import { INITIAL_JOBS } from '../src/services/seedData';
import dotenv from 'dotenv';

dotenv.config();

function mapToDb(job: any): Record<string, any> {
  return {
    title: job.title,
    slug: job.slug,
    company_name: job.companyName,
    location: job.location,
    job_type: job.jobType,
    work_arrangement: job.workArrangement,
    category: job.category,
    experience_level: job.experienceLevel,
    salary_min: job.salaryMin,
    salary_max: job.salaryMax,
    currency: job.currency || 'USD',
    description: job.description,
    responsibilities: job.responsibilities,
    requirements: job.requirements,
    benefits: job.benefits,
    application_url: job.applicationUrl,
    application_deadline: job.applicationDeadline,
    tags: job.tags || [],
    status: job.status || 'published',
    featured: Boolean(job.featured),
    created_at: job.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published_at: job.publishedAt || new Date().toISOString(),
    created_by: 'system_seed'
  };
}

async function seed() {
  console.log('Testing Supabase Client connection...');
  const isAlive = await testSupabaseConnection();
  console.log('Supabase Connection Status:', isAlive ? 'ONLINE & READY' : 'OFFLINE / UNREACHABLE');

  console.log(`Checking existing jobs in Supabase table "jobs"...`);
  const { count, error: countError } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error querying jobs table:', countError.message);
    process.exit(1);
  }

  console.log(`Current jobs count in Supabase: ${count}`);

  if (count === 0 || process.argv.includes('--force')) {
    console.log(`Seeding ${INITIAL_JOBS.length} verified jobs into Supabase...`);
    const rows = INITIAL_JOBS.map((j, idx) => ({
      id: `job_seed_${idx + 1}`,
      ...mapToDb(j),
    }));

    const { data, error: insertError } = await supabase
      .from('jobs')
      .upsert(rows, { onConflict: 'slug' })
      .select('id, title, company_name, status');

    if (insertError) {
      console.error('Seeding failed:', insertError.message);
      process.exit(1);
    }

    console.log(`Successfully seeded ${rows.length} jobs into Supabase:`);
    (data || []).forEach((j: any) => {
      console.log(`  • [${j.status}] ${j.title} at ${j.company_name} (${j.id})`);
    });
  } else {
    console.log('Jobs table already populated. Use --force to re-seed.');
  }
}

seed().catch(err => {
  console.error('Fatal Seed Error:', err);
  process.exit(1);
});
