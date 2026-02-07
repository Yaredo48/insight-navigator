
-- Create storage bucket for assignment submission files
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users (or anyone for now) to upload to submissions bucket
CREATE POLICY "Anyone can upload submission files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'submissions');

CREATE POLICY "Anyone can view submission files"
ON storage.objects FOR SELECT
USING (bucket_id = 'submissions');

CREATE POLICY "Anyone can delete their submission files"
ON storage.objects FOR DELETE
USING (bucket_id = 'submissions');

-- Create a profiles table for storing user emails (needed for notifications)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  display_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'student',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Anyone can create profiles"
ON public.profiles FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update profiles"
ON public.profiles FOR UPDATE
USING (true);

-- Create learning_sessions table for time tracking
CREATE TABLE IF NOT EXISTS public.learning_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  subject_id INTEGER REFERENCES public.subjects(id),
  grade_id INTEGER REFERENCES public.grades(id),
  session_type TEXT NOT NULL DEFAULT 'study',
  topic TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage learning sessions"
ON public.learning_sessions FOR ALL
USING (true);
