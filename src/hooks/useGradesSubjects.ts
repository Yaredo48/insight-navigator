import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

export type Grade = Tables<'grades'>;
export type Subject = Tables<'subjects'>;

export function useGradesSubjects() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchGrades = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .order('grade_number', { ascending: true });

      if (error) throw error;
      setGrades(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching grades:', error);
      toast({
        title: 'Error',
        description: 'Failed to load grades',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  const fetchSubjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setSubjects(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subjects',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchGrades(), fetchSubjects()]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchGrades, fetchSubjects]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getGradeName = useCallback((gradeId: number | null): string => {
    if (!gradeId) return '-';
    const grade = grades.find(g => g.id === gradeId);
    return grade?.name || `Grade ${gradeId}`;
  }, [grades]);

  const getSubjectName = useCallback((subjectId: number | null): string => {
    if (!subjectId) return '-';
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || '-';
  }, [subjects]);

  return {
    grades,
    subjects,
    isLoading,
    fetchGrades,
    fetchSubjects,
    fetchAll,
    getGradeName,
    getSubjectName,
  };
}
