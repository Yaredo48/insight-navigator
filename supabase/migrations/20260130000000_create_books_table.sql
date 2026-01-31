-- Create books table for official educational PDFs
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT,
  publisher TEXT,
  isbn TEXT,
  description TEXT,
  grade_id INTEGER REFERENCES grades(id),
  subject_id INTEGER REFERENCES subjects(id),
  chapter INTEGER,
  version TEXT,
  language TEXT DEFAULT 'en',
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'application/pdf',
  storage_path TEXT NOT NULL UNIQUE,
  download_url TEXT,
  source_url TEXT,
  official_source TEXT,
  extracted_text TEXT,
  metadata JSONB DEFAULT '{}',
  is_processed BOOLEAN DEFAULT FALSE,
  page_count INTEGER,
  published_year INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_books_grade_id ON books(grade_id);
CREATE INDEX IF NOT EXISTS idx_books_subject_id ON books(subject_id);
CREATE INDEX IF NOT EXISTS idx_books_chapter ON books(grade_id, subject_id, chapter);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at DESC);

-- Enable RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public books are viewable by everyone" ON books
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert books" ON books
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own books" ON books
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Admins can delete any book" ON books
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'teacher')
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_books_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_books_updated_at ON books;
CREATE TRIGGER trigger_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION update_books_updated_at();
