 import { useState, useEffect } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useToast } from '@/hooks/use-toast';
 import type { Tables } from '@/integrations/supabase/types';
 
 export type ClassData = Tables<'classes'> & {
   grades?: { name: string } | null;
   subjects?: { name: string } | null;
 };
 
 export interface ClassEnrollment {
   id: string;
   class_id: string;
   student_id: string;
   enrolled_at: string;
   status: string;
 }
 
 export function useClasses(teacherId: string) {
   const [classes, setClasses] = useState<ClassData[]>([]);
   const [loading, setLoading] = useState(true);
   const { toast } = useToast();
 
   const fetchClasses = async () => {
     try {
       const { data, error } = await supabase
         .from('classes')
         .select(`
           *,
           grades(name),
           subjects(name)
         `)
         .eq('teacher_id', teacherId)
         .order('created_at', { ascending: false });
 
       if (error) throw error;
       setClasses(data || []);
     } catch (error: any) {
       toast({ title: 'Error fetching classes', description: error.message, variant: 'destructive' });
     } finally {
       setLoading(false);
     }
   };
 
   const createClass = async (classData: Partial<ClassData>) => {
     try {
       const { data, error } = await supabase
         .from('classes')
         .insert([{ ...classData, teacher_id: teacherId, name: classData.name || 'New Class' }])
         .select()
         .single();
 
       if (error) throw error;
       toast({ title: 'Class created successfully!' });
       fetchClasses();
       return data;
     } catch (error: any) {
       toast({ title: 'Error creating class', description: error.message, variant: 'destructive' });
       return null;
     }
   };
 
   const updateClass = async (id: string, updates: Partial<ClassData>) => {
     try {
       const { error } = await supabase
         .from('classes')
         .update(updates)
         .eq('id', id);
 
       if (error) throw error;
       toast({ title: 'Class updated!' });
       fetchClasses();
     } catch (error: any) {
       toast({ title: 'Error updating class', description: error.message, variant: 'destructive' });
     }
   };
 
   const deleteClass = async (id: string) => {
     try {
       const { error } = await supabase.from('classes').delete().eq('id', id);
       if (error) throw error;
       toast({ title: 'Class deleted' });
       fetchClasses();
     } catch (error: any) {
       toast({ title: 'Error deleting class', description: error.message, variant: 'destructive' });
     }
   };
 
   const getEnrollments = async (classId: string) => {
     const { data, error } = await supabase
       .from('class_enrollments')
       .select('*')
       .eq('class_id', classId);
     if (error) throw error;
     return data || [];
   };
 
   const enrollStudent = async (classId: string, studentId: string) => {
     try {
       const { error } = await supabase
         .from('class_enrollments')
         .insert({ class_id: classId, student_id: studentId });
       if (error) throw error;
       toast({ title: 'Student enrolled!' });
     } catch (error: any) {
       toast({ title: 'Error enrolling student', description: error.message, variant: 'destructive' });
     }
   };
 
   const removeStudent = async (classId: string, studentId: string) => {
     try {
       const { error } = await supabase
         .from('class_enrollments')
         .delete()
         .eq('class_id', classId)
         .eq('student_id', studentId);
       if (error) throw error;
       toast({ title: 'Student removed' });
     } catch (error: any) {
       toast({ title: 'Error removing student', description: error.message, variant: 'destructive' });
     }
   };
 
   useEffect(() => {
     fetchClasses();
   }, [teacherId]);
 
   return {
     classes,
     loading,
     createClass,
     updateClass,
     deleteClass,
     getEnrollments,
     enrollStudent,
     removeStudent,
     refresh: fetchClasses
   };
 }