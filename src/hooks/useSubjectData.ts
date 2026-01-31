import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
            // Fetch books
            const { data: booksData, error: booksError } = await supabase
                .from('books')
                .select('id, title, author, publisher, description, chapter, file_name, file_size, download_url, page_count, is_processed')
                .eq('grade_id', gradeId)
                .eq('subject_id', subjectId)
                .eq('is_processed', true)
                .order('chapter', { ascending: true, nullsFirst: false })
                .order('title', { ascending: true });

            if (booksError) throw booksError;

            // Fetch subject info
            const { data: subjectData, error: subjectError } = await supabase
                .from('subjects')
                .select('id, name, code')
                .eq('id', subjectId)
                .single();

            if (subjectError) throw subjectError;

            // Fetch grade info
            const { data: gradeData, error: gradeError } = await supabase
                .from('grades')
                .select('id, name, grade_number')
                .eq('id', gradeId)
                .single();

            if (gradeError) throw gradeError;

            setData({
                books: (booksData as SubjectBook[]) || [],
                subject: subjectData,
                grade: gradeData,
                bookCount: booksData?.length || 0,
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
