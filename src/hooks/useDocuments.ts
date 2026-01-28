import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface Document {
  id: string;
  conversation_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  extracted_text: string | null;
  created_at: string;
}

export function useDocuments(conversationId: string | null) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Extract text from PDF
  const extractPdfText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const textParts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      textParts.push(pageText);
    }

    return textParts.join('\n\n');
  };

  // Extract text from text file
  const extractTextFileContent = async (file: File): Promise<string> => {
    return await file.text();
  };

  // Load documents for a conversation
  const loadDocuments = useCallback(async (convId: string) => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading documents:', error);
      return;
    }

    setDocuments(data || []);
  }, []);

  // Upload a document
  const uploadDocument = useCallback(async (file: File, convId: string): Promise<Document | null> => {
    if (!convId) {
      toast({
        title: 'Error',
        description: 'Please start a conversation first',
        variant: 'destructive',
      });
      return null;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB',
        variant: 'destructive',
      });
      return null;
    }

    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'text/csv',
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF, TXT, MD, or CSV file',
        variant: 'destructive',
      });
      return null;
    }

    setIsUploading(true);

    try {
      // Extract text based on file type
      let extractedText = '';
      if (file.type === 'application/pdf') {
        extractedText = await extractPdfText(file);
      } else {
        extractedText = await extractTextFileContent(file);
      }

      // Upload to storage
      const storagePath = `${convId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Save document record
      const { data, error: insertError } = await supabase
        .from('documents')
        .insert({
          conversation_id: convId,
          file_name: file.name,
          file_type: file.type || 'text/plain',
          file_size: file.size,
          storage_path: storagePath,
          extracted_text: extractedText,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setDocuments(prev => [data, ...prev]);
      
      toast({
        title: 'Document uploaded',
        description: `${file.name} is ready for questions`,
      });

      return data;
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload document',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  // Delete a document
  const deleteDocument = useCallback(async (documentId: string, storagePath: string) => {
    try {
      // Delete from storage
      await supabase.storage.from('documents').remove([storagePath]);

      // Delete record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(prev => prev.filter(d => d.id !== documentId));
      
      toast({
        title: 'Document deleted',
        description: 'The document has been removed',
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Get context from documents for AI
  const getDocumentContext = useCallback((): string => {
    if (documents.length === 0) return '';

    const contextParts = documents
      .filter(doc => doc.extracted_text)
      .map(doc => `[Document: ${doc.file_name}]\n${doc.extracted_text}`);

    if (contextParts.length === 0) return '';

    return `\n\n--- DOCUMENT CONTEXT ---\nThe user has uploaded the following documents. Use this information to answer their questions:\n\n${contextParts.join('\n\n---\n\n')}`;
  }, [documents]);

  return {
    documents,
    isUploading,
    loadDocuments,
    uploadDocument,
    deleteDocument,
    getDocumentContext,
  };
}
