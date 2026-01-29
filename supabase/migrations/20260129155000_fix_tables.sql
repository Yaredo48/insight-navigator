-- Repair migration: drop and recreate grades/subjects tables
-- This fixes the 404 error caused by missing tables

-- Drop existing tables if they exist (data will be preserved in seed migrations)
DROP TABLE IF EXISTS public.grades CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;

-- Create grades table
CREATE TABLE public.grades (
  id SERIAL PRIMARY KEY,
  grade_number INTEGER NOT NULL UNIQUE CHECK (grade_number BETWEEN 9 AND 12),
  name TEXT NOT NULL
);

-- Create subjects table
CREATE TABLE public.subjects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE
);

-- Enable RLS
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view grades" ON public.grades FOR SELECT USING (true);
CREATE POLICY "Anyone can view subjects" ON public.subjects FOR SELECT USING (true);

-- Seed grades
INSERT INTO public.grades (grade_number, name) VALUES
  (9, 'Grade 9'),
  (10, 'Grade 10'),
  (11, 'Grade 11'),
  (12, 'Grade 12');

-- Seed subjects
INSERT INTO public.subjects (name, code) VALUES
  ('English', 'ENG'),
  ('Mathematics', 'MATH'),
  ('Chemistry', 'CHEM'),
  ('Biology', 'BIO'),
  ('Physics', 'PHY'),
  ('Geography', 'GEO'),
  ('History', 'HIST');
