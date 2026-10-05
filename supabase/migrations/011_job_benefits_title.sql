ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS benefits_title TEXT;
