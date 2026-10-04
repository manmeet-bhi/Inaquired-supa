DROP POLICY IF EXISTS "Public users can view published jobs" ON public.jobs;

CREATE POLICY "Public users can view published jobs"
  ON public.jobs
  FOR SELECT
  USING (status IN ('published', 'archived'));
