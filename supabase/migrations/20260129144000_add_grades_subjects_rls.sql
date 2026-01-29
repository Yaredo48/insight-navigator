-- Add missing RLS policies for grades and subjects tables
-- These tables were created without RLS, which blocks all access

-- Enable RLS on grades and subjects tables
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Create public access policies (no auth required for demo)
CREATE POLICY "Anyone can view grades" ON public.grades FOR SELECT USING (true);
CREATE POLICY "Anyone can view subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Anyone can create badges" ON public.badges FOR INSERT WITH CHECK (true);
