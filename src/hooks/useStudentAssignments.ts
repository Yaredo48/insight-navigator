import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

export type StudentAssignment = Tables<'assignments'> & {
  classes?: { name: string } | null;
  submission?: Tables<'assignment_submissions'> | null;
};

export type StudentSubmission = Tables<'assignment_submissions'>;

export function useStudentAssignments(studentId: string) {
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAssignments = async () => {
    try {
      // Get classes the student is enrolled in
      const { data: enrollments, error: enrollError } = await supabase
        .from('class_enrollments')
        .select('class_id')
        .eq('student_id', studentId)
        .eq('status', 'active');

      if (enrollError) throw enrollError;

      if (!enrollments || enrollments.length === 0) {
        setAssignments([]);
        setLoading(false);
        return;
      }

      const classIds = enrollments.map((e) => e.class_id);

      // Get published assignments for those classes
      const { data: assignmentsData, error: assignError } = await supabase
        .from('assignments')
        .select(`*, classes(name)`)
        .in('class_id', classIds)
        .eq('is_published', true)
        .order('due_date', { ascending: true });

      if (assignError) throw assignError;

      // Get student's submissions
      const { data: submissions, error: subError } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', studentId);

      if (subError) throw subError;

      // Merge submissions into assignments
      const merged = (assignmentsData || []).map((assignment) => {
        const submission = submissions?.find((s) => s.assignment_id === assignment.id) || null;
        return { ...assignment, submission } as StudentAssignment;
      });

      setAssignments(merged);
    } catch (error: any) {
      toast({
        title: 'Error fetching assignments',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const submitAssignment = async (
    assignmentId: string,
    content: string,
    fileUrls?: string[]
  ) => {
    try {
      const assignment = assignments.find((a) => a.id === assignmentId);
      const isLate = assignment?.due_date
        ? new Date() > new Date(assignment.due_date)
        : false;

      const { error } = await supabase.from('assignment_submissions').insert([
        {
          assignment_id: assignmentId,
          student_id: studentId,
          content,
          file_urls: fileUrls ? JSON.stringify(fileUrls) : null,
          status: 'submitted',
          is_late: isLate,
        },
      ]);

      if (error) throw error;
      toast({ title: 'Assignment submitted!' });
      fetchAssignments();
    } catch (error: any) {
      toast({
        title: 'Error submitting assignment',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateSubmission = async (
    submissionId: string,
    content: string,
    fileUrls?: string[]
  ) => {
    try {
      const { error } = await supabase
        .from('assignment_submissions')
        .update({
          content,
          file_urls: fileUrls ? JSON.stringify(fileUrls) : null,
          submitted_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (error) throw error;
      toast({ title: 'Submission updated!' });
      fetchAssignments();
    } catch (error: any) {
      toast({
        title: 'Error updating submission',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [studentId]);

  return {
    assignments,
    loading,
    submitAssignment,
    updateSubmission,
    refresh: fetchAssignments,
  };
}
