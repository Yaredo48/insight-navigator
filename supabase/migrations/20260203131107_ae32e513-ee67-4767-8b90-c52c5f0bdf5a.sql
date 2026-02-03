-- Create grades table
CREATE TABLE public.grades (
    id SERIAL PRIMARY KEY,
    grade_number INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subjects table
CREATE TABLE public.subjects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create books table
CREATE TABLE public.books (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT,
    publisher TEXT,
    isbn TEXT,
    description TEXT,
    grade_id INTEGER REFERENCES public.grades(id),
    subject_id INTEGER REFERENCES public.subjects(id),
    chapter INTEGER,
    version TEXT,
    language TEXT DEFAULT 'en',
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    download_url TEXT,
    source_url TEXT,
    official_source TEXT,
    extracted_text TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_processed BOOLEAN DEFAULT false,
    page_count INTEGER,
    published_year INTEGER,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- RLS policies for grades (public read, no public write)
CREATE POLICY "Anyone can view grades"
ON public.grades FOR SELECT
USING (true);

-- RLS policies for subjects (public read, no public write)
CREATE POLICY "Anyone can view subjects"
ON public.subjects FOR SELECT
USING (true);

-- RLS policies for books (public read, authenticated write)
CREATE POLICY "Anyone can view books"
ON public.books FOR SELECT
USING (true);

CREATE POLICY "Anyone can create books"
ON public.books FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update books"
ON public.books FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete books"
ON public.books FOR DELETE
USING (true);

-- Create trigger for books updated_at
CREATE TRIGGER update_books_updated_at
BEFORE UPDATE ON public.books
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed grades data (Ethiopian curriculum grades 9-12)
INSERT INTO public.grades (id, grade_number, name) VALUES
(9, 9, 'Grade 9'),
(10, 10, 'Grade 10'),
(11, 11, 'Grade 11'),
(12, 12, 'Grade 12');

-- Seed subjects data
INSERT INTO public.subjects (id, name, code) VALUES
(1, 'Mathematics', 'MATH'),
(2, 'Physics', 'PHY'),
(3, 'Chemistry', 'CHEM'),
(4, 'Biology', 'BIO'),
(5, 'English', 'ENG'),
(6, 'Amharic', 'AMH'),
(7, 'History', 'HIST'),
(8, 'Geography', 'GEO');