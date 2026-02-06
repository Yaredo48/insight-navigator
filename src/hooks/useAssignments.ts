 import { useState, useEffect } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useToast } from '@/hooks/use-toast';
 import type { Tables } from '@/integrations/supabase/types';
 
 export type Assignment = Tables<'assignments'> & {
   classes?: { name: string } | null;
 };
 
 export type Submission = Tables<'assignment_submissions'>;
 
 export function useAssignments(teacherId: string) {
   const [assignments, setAssignments] = useState<Assignment[]>([]);
   const [loading, setLoading] = useState(true);
   const { toast } = useToast();
 
   const fetchAssignments = async () => {
     try {
       const { data, error } = await supabase
         .from('assignments')
         .select(`*, classes(name)`)
         .eq('teacher_id', teacherId)
         .order('created_at', { ascending: false });
 
       if (error) throw error;
       setAssignments((data as Assignment[]) || []);
     } catch (error: any) {
       toast({ title: 'Error fetching assignments', description: error.message, variant: 'destructive' });
     } finally {
       setLoading(false);
     }
   };
 
   const createAssignment = async (data: Partial<Assignment>) => {
     try {
       const { data: created, error } = await supabase
         .from('assignments')
         .insert([{ ...data, teacher_id: teacherId, title: data.title || 'New Assignment', class_id: data.class_id! }])
         .select()
         .single();
 
       if (error) throw error;
       toast({ title: 'Assignment created!' });
       fetchAssignments();
       return created;
     } catch (error: any) {
       toast({ title: 'Error creating assignment', description: error.message, variant: 'destructive' });
       return null;
     }
   };
 
   const updateAssignment = async (id: string, updates: Partial<Assignment>) => {
     try {
       const { error } = await supabase
         .from('assignments')
         .update(updates)
         .eq('id', id);
 
       if (error) throw error;
       toast({ title: 'Assignment updated!' });
       fetchAssignments();
     } catch (error: any) {
       toast({ title: 'Error updating assignment', description: error.message, variant: 'destructive' });
     }
   };
 
   const deleteAssignment = async (id: string) => {
     try {
       const { error } = await supabase.from('assignments').delete().eq('id', id);
       if (error) throw error;
       toast({ title: 'Assignment deleted' });
       fetchAssignments();
     } catch (error: any) {
       toast({ title: 'Error deleting assignment', description: error.message, variant: 'destructive' });
     }
   };
 
   const getSubmissions = async (assignmentId: string) => {
     const { data, error } = await supabase
       .from('assignment_submissions')
       .select('*')
       .eq('assignment_id', assignmentId)
       .order('submitted_at', { ascending: false });
 
     if (error) throw error;
     return (data as Submission[]) || [];
   };
 
  const gradeSubmission = async (submissionId: string, grade: number, feedback: string) => {
    try {
      // Get submission details for notification
      const { data: submission } = await supabase
        .from('assignment_submissions')
        .select('student_id, assignment_id')
        .eq('id', submissionId)
        .single();

      const { error } = await supabase
        .from('assignment_submissions')
        .update({
          grade,
          feedback,
          status: 'graded',
          graded_at: new Date().toISOString(),
          graded_by: teacherId
        })
        .eq('id', submissionId);

      if (error) throw error;
      toast({ title: 'Submission graded!' });

      // Send grade notification (fire and forget)
      if (submission) {
        const assignment = assignments.find((a) => a.id === submission.assignment_id);
        supabase.functions.invoke('send-notification', {
          body: {
            type: 'grade',
            student_id: submission.student_id,
            assignment_title: assignment?.title || 'Assignment',
            grade,
            max_points: assignment?.max_points || 100,
            feedback,
          },
        }).catch((err) => console.error('Notification error:', err));
      }
    } catch (error: any) {
      toast({ title: 'Error grading submission', description: error.message, variant: 'destructive' });
    }
  };
 
   useEffect(() => {
     fetchAssignments();
   }, [teacherId]);
 
   return {
     assignments,
     loading,
     createAssignment,
     updateAssignment,
     deleteAssignment,
     getSubmissions,
     gradeSubmission,
     refresh: fetchAssignments
   };
 }