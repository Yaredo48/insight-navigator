 import { useState, useEffect } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 
 export interface StudentPerformance {
   student_id: string;
   total_assignments: number;
   completed_assignments: number;
   average_grade: number;
   quizzes_taken: number;
   quiz_average: number;
   last_activity: string;
 }
 
 export interface ClassAnalytics {
   class_id: string;
   class_name: string;
   enrolled_count: number;
   assignment_count: number;
   average_completion: number;
   average_grade: number;
 }
 
 export function useTeacherAnalytics(teacherId: string) {
   const [loading, setLoading] = useState(true);
   const [classAnalytics, setClassAnalytics] = useState<ClassAnalytics[]>([]);
   const [totalStudents, setTotalStudents] = useState(0);
   const [totalAssignments, setTotalAssignments] = useState(0);
   const [pendingSubmissions, setPendingSubmissions] = useState(0);
 
   const fetchAnalytics = async () => {
     try {
       // Get teacher's classes
       const { data: classes } = await supabase
         .from('classes')
         .select('id, name')
         .eq('teacher_id', teacherId);
 
       if (!classes) return;
 
       const classIds = classes.map(c => c.id);
 
       // Get enrollments count
       const { count: enrollmentCount } = await supabase
         .from('class_enrollments')
         .select('*', { count: 'exact', head: true })
         .in('class_id', classIds);
 
       setTotalStudents(enrollmentCount || 0);
 
       // Get assignments
       const { data: assignments, count: assignmentCount } = await supabase
         .from('assignments')
         .select('*', { count: 'exact' })
         .eq('teacher_id', teacherId);
 
       setTotalAssignments(assignmentCount || 0);
 
       // Get pending submissions
       if (assignments && assignments.length > 0) {
         const assignmentIds = assignments.map(a => a.id);
         const { count: pendingCount } = await supabase
           .from('assignment_submissions')
           .select('*', { count: 'exact', head: true })
           .in('assignment_id', assignmentIds)
           .eq('status', 'submitted');
 
         setPendingSubmissions(pendingCount || 0);
       }
 
       // Build class analytics
       const analytics: ClassAnalytics[] = await Promise.all(
         classes.map(async (cls) => {
           const { count: enrolled } = await supabase
             .from('class_enrollments')
             .select('*', { count: 'exact', head: true })
             .eq('class_id', cls.id);
 
           const { count: assignCount } = await supabase
             .from('assignments')
             .select('*', { count: 'exact', head: true })
             .eq('class_id', cls.id);
 
           return {
             class_id: cls.id,
             class_name: cls.name,
             enrolled_count: enrolled || 0,
             assignment_count: assignCount || 0,
             average_completion: 0,
             average_grade: 0
           };
         })
       );
 
       setClassAnalytics(analytics);
     } catch (error) {
       console.error('Analytics error:', error);
     } finally {
       setLoading(false);
     }
   };
 
   const getStudentPerformance = async (classId: string): Promise<StudentPerformance[]> => {
     const { data: enrollments } = await supabase
       .from('class_enrollments')
       .select('student_id')
       .eq('class_id', classId);
 
     if (!enrollments) return [];
 
     const performances: StudentPerformance[] = enrollments.map(e => ({
       student_id: e.student_id,
       total_assignments: 0,
       completed_assignments: 0,
       average_grade: 0,
       quizzes_taken: 0,
       quiz_average: 0,
       last_activity: ''
     }));
 
     return performances;
   };
 
   useEffect(() => {
     fetchAnalytics();
   }, [teacherId]);
 
   return {
     loading,
     classAnalytics,
     totalStudents,
     totalAssignments,
     pendingSubmissions,
     getStudentPerformance,
     refresh: fetchAnalytics
   };
 }