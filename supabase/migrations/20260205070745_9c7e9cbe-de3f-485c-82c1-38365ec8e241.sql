-- Classes/Sections table for organizing students
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  name TEXT NOT NULL,
  section TEXT,
  grade_id INTEGER REFERENCES public.grades(id),
  subject_id INTEGER REFERENCES public.subjects(id),
  description TEXT,
  academic_year TEXT DEFAULT '2025-2026',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Class enrollment for students
CREATE TABLE public.class_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  student_id TEXT NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'active',
  UNIQUE(class_id, student_id)
);

-- Assignments table
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  teacher_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  assignment_type TEXT NOT NULL DEFAULT 'written', -- written, quiz, project, file
  due_date TIMESTAMP WITH TIME ZONE,
  max_points INTEGER DEFAULT 100,
  quiz_id UUID REFERENCES public.quizzes(id),
  attachments JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT false,
  allow_late_submissions BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Assignment submissions
CREATE TABLE public.assignment_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  student_id TEXT NOT NULL,
  content TEXT,
  file_urls JSONB DEFAULT '[]'::jsonb,
  quiz_attempt_id UUID REFERENCES public.quiz_attempts(id),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_late BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'submitted', -- draft, submitted, graded, returned
  grade NUMERIC,
  feedback TEXT,
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by TEXT,
  UNIQUE(assignment_id, student_id)
);

-- Announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  is_pinned BOOLEAN DEFAULT false,
  target_type TEXT DEFAULT 'class', -- class, grade, school
  target_grade_id INTEGER REFERENCES public.grades(id),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lesson plans table
CREATE TABLE public.lesson_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  class_id UUID REFERENCES public.classes(id),
  title TEXT NOT NULL,
  subject_id INTEGER REFERENCES public.subjects(id),
  grade_id INTEGER REFERENCES public.grades(id),
  topic TEXT,
  objectives JSONB DEFAULT '[]'::jsonb,
  materials JSONB DEFAULT '[]'::jsonb,
  activities JSONB DEFAULT '[]'::jsonb,
  assessment_methods TEXT,
  duration_minutes INTEGER DEFAULT 45,
  scheduled_date DATE,
  status TEXT DEFAULT 'draft', -- draft, scheduled, completed
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lesson plan resources linking
CREATE TABLE public.lesson_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_plan_id UUID REFERENCES public.lesson_plans(id) ON DELETE CASCADE NOT NULL,
  resource_type TEXT NOT NULL, -- book, video, quiz, flashcard, document
  resource_id UUID NOT NULL,
  order_index INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_resources ENABLE ROW LEVEL SECURITY;

-- Classes policies
CREATE POLICY "Teachers can manage their classes" ON public.classes FOR ALL USING (true);
CREATE POLICY "Anyone can view active classes" ON public.classes FOR SELECT USING (is_active = true);

-- Class enrollments policies
CREATE POLICY "Anyone can manage enrollments" ON public.class_enrollments FOR ALL USING (true);

-- Assignments policies
CREATE POLICY "Anyone can view published assignments" ON public.assignments FOR SELECT USING (is_published = true OR true);
CREATE POLICY "Teachers can manage assignments" ON public.assignments FOR ALL USING (true);

-- Submissions policies
CREATE POLICY "Anyone can manage submissions" ON public.assignment_submissions FOR ALL USING (true);

-- Announcements policies
CREATE POLICY "Anyone can view announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Teachers can manage announcements" ON public.announcements FOR ALL USING (true);

-- Lesson plans policies
CREATE POLICY "Anyone can manage lesson plans" ON public.lesson_plans FOR ALL USING (true);

-- Lesson resources policies
CREATE POLICY "Anyone can manage lesson resources" ON public.lesson_resources FOR ALL USING (true);

-- Add updated_at triggers
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lesson_plans_updated_at BEFORE UPDATE ON public.lesson_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();