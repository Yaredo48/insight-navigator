import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// Django API base URL
const DJANGO_API_URL = import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8000/api/v1';

export interface Book {
  id: string;
  title: string;
  author: string | null;
  publisher: string | null;
  description: string | null;
  grade_id: number | null;
  subject_id: number | null;
  chapter: number | null;
  file_name: string;
  file_size: number;
  storage_path: string;
  download_url: string | null;
  extracted_text: string | null;
  is_processed: boolean | null;
  page_count: number | null;
  created_at: string | null;
  is_official?: boolean;
}

export interface BookContext {
  bookCount: number;
  context: string;
  books: Array<{
    id: string;
    title: string;
    chapter: number | null;
    downloadUrl: string | null;
  }>;
}

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const { toast } = useToast();

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('supabase_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  // Fetch all books with optional filters
  const fetchBooks = useCallback(async (filters?: { gradeId?: number; subjectId?: number }) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters?.gradeId) params.append('grade_id', filters.gradeId.toString());
      if (filters?.subjectId) params.append('subject_id', filters.subjectId.toString());

      const response = await fetch(
        `${DJANGO_API_URL}/books/?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }

      const data = await response.json();
      setBooks(data || []);
      return data;
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

  // Complete pipeline: Download official PDF → upload to storage → register in DB
  const downloadAndRegisterBook = useCallback(async (bookData: {
    sourceUrl: string;
    title?: string;
    author?: string;
    description?: string;
    gradeId?: number;
    subjectId?: number;
    gradeLevel?: string;
    subjectName?: string;
  }): Promise<Book | null> => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${DJANGO_API_URL}/books/download-register/`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            source_url: bookData.sourceUrl,
            title: bookData.title,
            author: bookData.author || '',
            description: bookData.description || '',
            grade_id: bookData.gradeId,
            subject_id: bookData.subjectId,
            grade_level: bookData.gradeLevel,
            subject_name: bookData.subjectName,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download and register book');
      }

      const data = await response.json();

      toast({
        title: 'Success',
        description: `Book "${data.title}" has been downloaded and registered successfully`,
      });

      // Refresh books list
      await fetchBooks();

      return data;
    } catch (error) {
      console.error('Error downloading and registering book:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to download and register book',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchBooks, toast]);

  // Bulk pipeline: Download multiple official PDFs → upload to storage → register in DB
  const bulkDownloadAndRegisterBooks = useCallback(async (
    books: Array<{
      sourceUrl: string;
      title?: string;
      author?: string;
      description?: string;
      gradeId?: number;
      subjectId?: number;
    }>,
    defaultGradeId?: number,
    defaultSubjectId?: number
  ): Promise<{ imported: number; errors: number }> => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${DJANGO_API_URL}/books/bulk-download-register/`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            books: books.map(b => ({
              source_url: b.sourceUrl,
              title: b.title,
              author: b.author || '',
              description: b.description || '',
              grade_id: b.gradeId,
              subject_id: b.subjectId,
            })),
            default_grade_id: defaultGradeId,
            default_subject_id: defaultSubjectId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to bulk download and register books');
      }

      const data = await response.json();

      toast({
        title: 'Import Complete',
        description: `Successfully imported ${data.total_imported} books, ${data.total_errors} errors`,
        variant: data.total_errors > 0 ? 'default' : 'default',
      });

      // Refresh books list
      await fetchBooks();

      return {
        imported: data.total_imported,
        errors: data.total_errors,
      };
    } catch (error) {
      console.error('Error bulk downloading and registering books:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to bulk import books',
        variant: 'destructive',
      });
      return { imported: 0, errors: books.length };
    } finally {
      setIsLoading(false);
    }
  }, [fetchBooks, toast]);

  // Delete a book
  const deleteBook = useCallback(async (bookId: string) => {
    try {
      const response = await fetch(
        `${DJANGO_API_URL}/books/${bookId}/`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok && response.status !== 204) {
        throw new Error('Failed to delete book');
      }

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

  // Get a single book by ID
  const getBook = useCallback(async (bookId: string): Promise<Book | null> => {
    try {
      const response = await fetch(
        `${DJANGO_API_URL}/books/${bookId}/`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch book');
      }

      const data = await response.json();
      setCurrentBook(data);
      return data;
    } catch (error) {
      console.error('Error fetching book:', error);
      return null;
    }
  }, []);

  // Get download URL for a book
  const getBookDownloadUrl = useCallback(async (bookId: string): Promise<string | null> => {
    try {
      const response = await fetch(
        `${DJANGO_API_URL}/books/${bookId}/download/`
      );

      if (!response.ok) {
        throw new Error('Failed to get download URL');
      }

      const data = await response.json();
      return data.download_url;
    } catch (error) {
      console.error('Error getting download URL:', error);
      return null;
    }
  }, []);

  return {
    books,
    isLoading,
    currentBook,
    fetchBooks,
    downloadAndRegisterBook,
    bulkDownloadAndRegisterBooks,
    deleteBook,
    getBook,
    getBookDownloadUrl,
  };
}
