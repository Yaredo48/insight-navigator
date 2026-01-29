-- Force add RLS policies for grades, subjects, and badges tables
-- These policies are needed for the dashboard to work

-- Drop existing policies if they exist (to ensure they're created correctly)
DROP POLICY IF EXISTS "Anyone can view grades" ON public.grades;
DROP POLICY IF EXISTS "Anyone can view subjects" ON public.subjects;
DROP POLICY IF EXISTS "Anyone can view badges" ON public.badges;
DROP POLICY IF EXISTS "Anyone can create badges" ON public.badges;

-- Enable RLS on tables that might not have it
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Create public access policies
CREATE POLICY "Anyone can view grades" ON public.grades FOR SELECT USING (true);
CREATE POLICY "Anyone can view subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Anyone can create badges" ON public.badges FOR INSERT WITH CHECK (true);

-- Verify the policies were created
SELECT
    tablename,
    policyname,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('grades', 'subjects', 'badges');
