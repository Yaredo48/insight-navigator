-- User roles enumeration
CREATE TYPE user_role AS ENUM ('student', 'teacher');

-- User profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Grades table
CREATE TABLE public.grades (
  id SERIAL PRIMARY KEY,
  grade_number INTEGER NOT NULL UNIQUE CHECK (grade_number BETWEEN 9 AND 12),
  name TEXT NOT NULL
);

-- Subjects table
CREATE TABLE public.subjects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE
);

-- Student progress tracking
CREATE TABLE public.student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  grade_id INTEGER REFERENCES grades(id),
  subject_id INTEGER REFERENCES subjects(id),
  topics_completed JSONB DEFAULT '[]',
  exercises_completed INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  total_interactions INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, grade_id, subject_id)
);

-- Badges and achievements
CREATE TABLE public.badges (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  criteria JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User badges (earned)
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  badge_id INTEGER REFERENCES badges(id),
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Create public access policies (no auth required for demo)
CREATE POLICY "Anyone can view user_profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can create user_profiles" ON public.user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update user_profiles" ON public.user_profiles FOR UPDATE USING (true);

CREATE POLICY "Anyone can view student_progress" ON public.student_progress FOR SELECT USING (true);
CREATE POLICY "Anyone can create student_progress" ON public.student_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update student_progress" ON public.student_progress FOR UPDATE USING (true);

CREATE POLICY "Anyone can view user_badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Anyone can create user_badges" ON public.user_badges FOR INSERT WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_progress_updated_at
BEFORE UPDATE ON public.student_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_student_progress_user_id ON student_progress(user_id);
CREATE INDEX idx_student_progress_grade_subject ON student_progress(grade_id, subject_id);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
