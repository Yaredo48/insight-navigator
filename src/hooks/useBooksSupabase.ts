import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, Json } from '@/integrations/supabase/types';

export type Book = Tables<'books'>;

export interface BookFilters {
  gradeId?: number;
  subjectId?: number;
  searchQuery?: string;
  tags?: string[];
  chapter?: number;
  isProcessed?: boolean;
}

export function useBooksSupabase() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const { toast } = useToast();

  // Fetch all books with optional filters
  const fetchBooks = useCallback(async (filters?: BookFilters) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.gradeId) {
        query = query.eq('grade_id', filters.gradeId);
      }
      if (filters?.subjectId) {
        query = query.eq('subject_id', filters.subjectId);
      }
      if (filters?.chapter) {
        query = query.eq('chapter', filters.chapter);
      }
      if (filters?.isProcessed !== undefined) {
        query = query.eq('is_processed', filters.isProcessed);
      }
      if (filters?.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%,author.ilike.%${filters.searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBooks(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching books:', error);
      toast({
        title: 'Error',
        description: 'Failed to load books',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Get a single book by ID
  const getBook = useCallback(async (bookId: string): Promise<Book | null> => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single();

      if (error) throw error;
      setCurrentBook(data);
      return data;
    } catch (error) {
      console.error('Error fetching book:', error);
      return null;
    }
  }, []);

  // Create a new book
  const createBook = useCallback(async (bookData: {
    title: string;
    author?: string;
    publisher?: string;
    description?: string;
    gradeId?: number;
    subjectId?: number;
    chapter?: number;
    language?: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    storagePath: string;
    downloadUrl?: string;
    extractedText?: string;
    pageCount?: number;
    tags?: string[];
    videoUrl?: string;
  }): Promise<Book | null> => {
    setIsLoading(true);
    try {
      const metadata: Record<string, unknown> = {};
      if (bookData.tags) metadata.tags = bookData.tags;
      if (bookData.videoUrl) metadata.video_url = bookData.videoUrl;

      const { data, error } = await supabase
        .from('books')
        .insert([{
          title: bookData.title,
          author: bookData.author ?? null,
          publisher: bookData.publisher ?? null,
          description: bookData.description ?? null,
          grade_id: bookData.gradeId ?? null,
          subject_id: bookData.subjectId ?? null,
          chapter: bookData.chapter ?? null,
          language: bookData.language ?? 'en',
          file_name: bookData.fileName,
          file_size: bookData.fileSize,
          file_type: bookData.fileType,
          storage_path: bookData.storagePath,
          download_url: bookData.downloadUrl ?? null,
          extracted_text: bookData.extractedText ?? null,
          is_processed: !!bookData.extractedText,
          page_count: bookData.pageCount ?? null,
          metadata: Object.keys(metadata).length > 0 ? (metadata as Json) : null,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Book "${data.title}" has been added successfully`,
      });

      await fetchBooks();
      return data;
    } catch (error) {
      console.error('Error creating book:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create book',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchBooks, toast]);

  // Update a book
  const updateBook = useCallback(async (bookId: string, updates: Partial<{
    title: string;
    author: string;
    publisher: string;
    description: string;
    gradeId: number;
    subjectId: number;
    chapter: number;
    language: string;
    extractedText: string;
    isProcessed: boolean;
    pageCount: number;
    tags: string[];
    videoUrl: string;
  }>): Promise<Book | null> => {
    try {
      const updateData: Record<string, unknown> = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.author !== undefined) updateData.author = updates.author;
      if (updates.publisher !== undefined) updateData.publisher = updates.publisher;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.gradeId !== undefined) updateData.grade_id = updates.gradeId;
      if (updates.subjectId !== undefined) updateData.subject_id = updates.subjectId;
      if (updates.chapter !== undefined) updateData.chapter = updates.chapter;
      if (updates.language !== undefined) updateData.language = updates.language;
      if (updates.extractedText !== undefined) updateData.extracted_text = updates.extractedText;
      if (updates.isProcessed !== undefined) updateData.is_processed = updates.isProcessed;
      if (updates.pageCount !== undefined) updateData.page_count = updates.pageCount;

      // Handle metadata updates
      if (updates.tags !== undefined || updates.videoUrl !== undefined) {
        const existingBook = await getBook(bookId);
        const existingMetadata = (existingBook?.metadata as Record<string, unknown>) || {};
        if (updates.tags !== undefined) existingMetadata.tags = updates.tags;
        if (updates.videoUrl !== undefined) existingMetadata.video_url = updates.videoUrl;
        updateData.metadata = existingMetadata;
      }

      const { data, error } = await supabase
        .from('books')
        .update(updateData)
        .eq('id', bookId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Book updated successfully',
      });

      await fetchBooks();
      return data;
    } catch (error) {
      console.error('Error updating book:', error);
      toast({
        title: 'Error',
        description: 'Failed to update book',
        variant: 'destructive',
      });
      return null;
    }
  }, [fetchBooks, getBook, toast]);

  // Delete a book
  const deleteBook = useCallback(async (bookId: string) => {
    try {
      // First get the book to find the storage path
      const { data: book } = await supabase
        .from('books')
        .select('storage_path')
        .eq('id', bookId)
        .single();

      // Delete from storage if exists
      if (book?.storage_path) {
        await supabase.storage
          .from('documents')
          .remove([book.storage_path]);
      }

      // Delete from database
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);

      if (error) throw error;

      setBooks(prev => prev.filter(b => b.id !== bookId));

      toast({
        title: 'Success',
        description: 'Book has been deleted',
      });
    } catch (error) {
      console.error('Error deleting book:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete book',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Upload file to storage and create book record
  const uploadBook = useCallback(async (
    file: File,
    bookData: {
      title: string;
      author?: string;
      publisher?: string;
      description?: string;
      gradeId?: number;
      subjectId?: number;
      chapter?: number;
      language?: string;
      tags?: string[];
      videoUrl?: string;
    }
  ): Promise<Book | null> => {
    setIsLoading(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const storagePath = `books/${bookData.gradeId || 'general'}/${bookData.subjectId || 'general'}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(storagePath);

      // Create book record
      const book = await createBook({
        ...bookData,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        storagePath,
        downloadUrl: urlData.publicUrl,
      });

      return book;
    } catch (error) {
      console.error('Error uploading book:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload book',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [createBook, toast]);

  // Get books by tags
  const getBooksByTags = useCallback(async (tags: string[]): Promise<Book[]> => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*');

      if (error) throw error;

      // Filter by tags in metadata
      return (data || []).filter(book => {
        const bookTags = (book.metadata as Record<string, unknown>)?.tags as string[] | undefined;
        if (!bookTags) return false;
        return tags.some(tag => bookTags.includes(tag));
      });
    } catch (error) {
      console.error('Error fetching books by tags:', error);
      return [];
    }
  }, []);

  // Search books across all fields
  const searchBooks = useCallback(async (query: string): Promise<Book[]> => {
    if (!query.trim()) {
      return fetchBooks();
    }

    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,author.ilike.%${query}%,extracted_text.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
      return data || [];
    } catch (error) {
      console.error('Error searching books:', error);
      return [];
    }
  }, [fetchBooks]);

  return {
    books,
    isLoading,
    currentBook,
    fetchBooks,
    getBook,
    createBook,
    updateBook,
    deleteBook,
    uploadBook,
    getBooksByTags,
    searchBooks,
  };
}
