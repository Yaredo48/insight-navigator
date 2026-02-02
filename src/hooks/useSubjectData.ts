import { useState, useEffect, useCallback } from 'react';

export interface SubjectBook {
  id: string;
  title: string;
  author: string | null;
  publisher: string | null;
  description: string | null;
  chapter: number | null;
  file_name: string;
  file_size: number;
  download_url: string | null;
  page_count: number | null;
  is_processed: boolean;
}

export interface SubjectInfo {
  id: number;
  name: string;
  code: string;
}

export interface GradeInfo {
  id: number;
  name: string;
  grade_number: number;
}

export interface SubjectData {
  books: SubjectBook[];
  subject: SubjectInfo | null;
  grade: GradeInfo | null;
  bookCount: number;
}

// Static data for grades and subjects (until database tables are created)
const GRADES: GradeInfo[] = [
  { id: 9, name: 'Grade 9', grade_number: 9 },
  { id: 10, name: 'Grade 10', grade_number: 10 },
  { id: 11, name: 'Grade 11', grade_number: 11 },
  { id: 12, name: 'Grade 12', grade_number: 12 },
];

const SUBJECTS: SubjectInfo[] = [
  { id: 1, name: 'Mathematics', code: 'MATH' },
  { id: 2, name: 'Physics', code: 'PHY' },
  { id: 3, name: 'Chemistry', code: 'CHEM' },
  { id: 4, name: 'Biology', code: 'BIO' },
  { id: 5, name: 'English', code: 'ENG' },
  { id: 6, name: 'Amharic', code: 'AMH' },
  { id: 7, name: 'History', code: 'HIST' },
  { id: 8, name: 'Geography', code: 'GEO' },
];

export function useSubjectData(gradeId?: number, subjectId?: number) {
  const [data, setData] = useState<SubjectData>({
    books: [],
    subject: null,
    grade: null,
    bookCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSubjectData = useCallback(async () => {
    if (!gradeId || !subjectId) {
      setData({
        books: [],
        subject: null,
        grade: null,
        bookCount: 0,
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use static data since database tables don't exist yet
      const grade = GRADES.find(g => g.id === gradeId) || null;
      const subject = SUBJECTS.find(s => s.id === subjectId) || null;

      // Note: Books would be fetched from database when table exists
      // For now, return empty array
      setData({
        books: [],
        subject,
        grade,
        bookCount: 0,
      });
    } catch (err) {
      console.error('Error fetching subject data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch subject data'));
    } finally {
      setIsLoading(false);
    }
  }, [gradeId, subjectId]);

  // Fetch data when gradeId or subjectId changes
  useEffect(() => {
    fetchSubjectData();
  }, [fetchSubjectData]);

  // Refetch function for manual refresh
  const refetch = useCallback(() => {
    fetchSubjectData();
  }, [fetchSubjectData]);

  return {
    ...data,
    isLoading,
    error,
    refetch,
  };
}
