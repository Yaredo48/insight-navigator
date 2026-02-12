-- Create missing tables that are referenced but don't exist

-- Classes table
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  grade_id INTEGER REFERENCES public.grades(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- RLS policies for classes
CREATE POLICY "Teachers can view their own classes"
  ON public.classes
  FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create their own classes"
  ON public.classes
  FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own classes"
  ON public.classes
  FOR UPDATE
  USING (auth.uid() = teacher_id);

-- Create trigger for classes
CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for classes
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_grade_id ON public.classes(grade_id);

-- Grant permissions
GRANT ALL ON public.classes TO authenticated;

-- Announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  grade_id INTEGER REFERENCES public.grades(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- RLS policies for announcements
CREATE POLICY "Teachers can manage their own announcements"
  ON public.announcements
  FOR ALL
  USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view announcements"
  ON public.announcements
  FOR SELECT
  USING (true);

-- Create trigger for announcements
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for announcements
CREATE INDEX IF NOT EXISTS idx_announcements_teacher_id ON public.announcements(teacher_id);
CREATE INDEX IF NOT EXISTS idx_announcements_class_id ON public.announcements(class_id);
CREATE INDEX IF NOT EXISTS idx_announcements_grade_id ON public.announcements(grade_id);

-- Grant permissions
GRANT ALL ON public.announcements TO authenticated;
GRANT SELECT ON public.announcements TO anon;
