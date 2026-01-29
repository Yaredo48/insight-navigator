-- Enhanced documents table with curriculum metadata
ALTER TABLE public.documents
  ADD COLUMN document_type TEXT CHECK (document_type IN ('textbook', 'teacher_guide', 'lesson_plan', 'exercise', 'student_note')),
  ADD COLUMN grade_id INTEGER REFERENCES grades(id),
  ADD COLUMN subject_id INTEGER REFERENCES subjects(id),
  ADD COLUMN chapter TEXT,
  ADD COLUMN topics TEXT[];

-- Teacher resources
CREATE TABLE public.teacher_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT CHECK (resource_type IN ('lesson_plan', 'quiz', 'exercise', 'guide')),
  grade_id INTEGER REFERENCES grades(id),
  subject_id INTEGER REFERENCES subjects(id),
  content JSONB,
  file_url TEXT,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.teacher_resources ENABLE ROW LEVEL SECURITY;

-- Create public access policies
CREATE POLICY "Anyone can view teacher_resources" ON public.teacher_resources FOR SELECT USING (true);
CREATE POLICY "Anyone can create teacher_resources" ON public.teacher_resources FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update teacher_resources" ON public.teacher_resources FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete teacher_resources" ON public.teacher_resources FOR DELETE USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_teacher_resources_updated_at
BEFORE UPDATE ON public.teacher_resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_documents_grade_subject ON documents(grade_id, subject_id);
CREATE INDEX idx_documents_document_type ON documents(document_type);
CREATE INDEX idx_teacher_resources_grade_subject ON teacher_resources(grade_id, subject_id);
CREATE INDEX idx_teacher_resources_type ON teacher_resources(resource_type);
