-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Storage policies for documents bucket
CREATE POLICY "Anyone can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Anyone can view documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

CREATE POLICY "Anyone can delete documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents');

-- Create documents table to store extracted text and metadata
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  extracted_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view documents"
ON public.documents FOR SELECT
USING (true);

CREATE POLICY "Anyone can create documents"
ON public.documents FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can delete documents"
ON public.documents FOR DELETE
USING (true);

-- Index for faster lookups
CREATE INDEX idx_documents_conversation_id ON public.documents(conversation_id);