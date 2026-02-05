 import { useState, useEffect } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useToast } from '@/hooks/use-toast';
 import type { Tables } from '@/integrations/supabase/types';
 
 export type LessonPlan = Tables<'lesson_plans'> & {
   classes?: { name: string } | null;
   subjects?: { name: string } | null;
   grades?: { name: string } | null;
 };
 
 export type LessonResource = Tables<'lesson_resources'>;
 
 export function useLessonPlans(teacherId: string) {
   const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
   const [loading, setLoading] = useState(true);
   const { toast } = useToast();
 
   const fetchLessonPlans = async () => {
     try {
       const { data, error } = await supabase
         .from('lesson_plans')
         .select(`*, classes(name), subjects(name), grades(name)`)
         .eq('teacher_id', teacherId)
         .order('scheduled_date', { ascending: true, nullsFirst: false });
 
       if (error) throw error;
       setLessonPlans((data as LessonPlan[]) || []);
     } catch (error: any) {
       toast({ title: 'Error fetching lesson plans', description: error.message, variant: 'destructive' });
     } finally {
       setLoading(false);
     }
   };
 
   const createLessonPlan = async (data: Partial<LessonPlan>) => {
     try {
       const { data: created, error } = await supabase
         .from('lesson_plans')
         .insert([{ ...data, teacher_id: teacherId, title: data.title || 'New Lesson Plan' }])
         .select()
         .single();
 
       if (error) throw error;
       toast({ title: 'Lesson plan created!' });
       fetchLessonPlans();
       return created;
     } catch (error: any) {
       toast({ title: 'Error creating lesson plan', description: error.message, variant: 'destructive' });
       return null;
     }
   };
 
   const updateLessonPlan = async (id: string, updates: Partial<LessonPlan>) => {
     try {
       const { error } = await supabase
         .from('lesson_plans')
         .update(updates)
         .eq('id', id);
 
       if (error) throw error;
       toast({ title: 'Lesson plan updated!' });
       fetchLessonPlans();
     } catch (error: any) {
       toast({ title: 'Error updating lesson plan', description: error.message, variant: 'destructive' });
     }
   };
 
   const deleteLessonPlan = async (id: string) => {
     try {
       const { error } = await supabase.from('lesson_plans').delete().eq('id', id);
       if (error) throw error;
       toast({ title: 'Lesson plan deleted' });
       fetchLessonPlans();
     } catch (error: any) {
       toast({ title: 'Error deleting lesson plan', description: error.message, variant: 'destructive' });
     }
   };
 
   const addResource = async (lessonPlanId: string, resource: Partial<LessonResource>) => {
     try {
       const { error } = await supabase
         .from('lesson_resources')
         .insert([{ ...resource, lesson_plan_id: lessonPlanId, resource_type: resource.resource_type || 'document', resource_id: resource.resource_id! }]);
       if (error) throw error;
       toast({ title: 'Resource added!' });
     } catch (error: any) {
       toast({ title: 'Error adding resource', description: error.message, variant: 'destructive' });
     }
   };
 
   const getResources = async (lessonPlanId: string): Promise<LessonResource[]> => {
     const { data, error } = await supabase
       .from('lesson_resources')
       .select('*')
       .eq('lesson_plan_id', lessonPlanId)
       .order('order_index');
     if (error) throw error;
     return data || [];
   };
 
   useEffect(() => {
     fetchLessonPlans();
   }, [teacherId]);
 
   return {
     lessonPlans,
     loading,
     createLessonPlan,
     updateLessonPlan,
     deleteLessonPlan,
     addResource,
     getResources,
     refresh: fetchLessonPlans
   };
 }