 import { useState } from 'react';
 import { Button } from '@/components/ui/button';
 import { Plus, Loader2, BookOpen, Calendar } from 'lucide-react';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { useLessonPlans, LessonPlan } from '@/hooks/useLessonPlans';
 import { LessonPlanCard } from './LessonPlanCard';
 import { LessonPlanCreator } from './LessonPlanCreator';
 import { LessonPlanViewer } from './LessonPlanViewer';
 
 interface LessonPlanManagerProps {
   userId: string;
 }
 
 export function LessonPlanManager({ userId }: LessonPlanManagerProps) {
   const { lessonPlans, loading, createLessonPlan, updateLessonPlan, deleteLessonPlan } = useLessonPlans(userId);
   
   const [creatorOpen, setCreatorOpen] = useState(false);
   const [editingPlan, setEditingPlan] = useState<LessonPlan | null>(null);
   const [viewingPlan, setViewingPlan] = useState<LessonPlan | null>(null);
 
   const handleSave = async (data: Partial<LessonPlan>) => {
     if (editingPlan) {
       await updateLessonPlan(editingPlan.id, data);
     } else {
       await createLessonPlan(data);
     }
     setEditingPlan(null);
   };
 
   const handleEdit = (plan: LessonPlan) => {
     setEditingPlan(plan);
     setCreatorOpen(true);
   };
 
   const draftPlans = lessonPlans.filter(p => p.status === 'draft');
   const scheduledPlans = lessonPlans.filter(p => p.status === 'scheduled');
   const completedPlans = lessonPlans.filter(p => p.status === 'completed');
 
   if (loading) {
     return (
       <div className="flex items-center justify-center py-12">
         <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
       </div>
     );
   }
 
   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between">
         <div>
           <h2 className="text-xl font-semibold">Lesson Plans</h2>
           <p className="text-sm text-muted-foreground">
             Plan and organize your lessons with objectives and materials
           </p>
         </div>
         <Button onClick={() => { setEditingPlan(null); setCreatorOpen(true); }}>
           <Plus className="w-4 h-4 mr-2" />
           New Lesson Plan
         </Button>
       </div>
 
       {lessonPlans.length === 0 ? (
         <div className="text-center py-12 bg-muted/30 rounded-lg">
           <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
           <h3 className="font-medium mb-2">No lesson plans yet</h3>
           <p className="text-sm text-muted-foreground mb-4">
             Create lesson plans to organize your teaching
           </p>
           <Button onClick={() => setCreatorOpen(true)}>
             <Plus className="w-4 h-4 mr-2" />
             Create Lesson Plan
           </Button>
         </div>
       ) : (
         <Tabs defaultValue="all">
           <TabsList>
             <TabsTrigger value="all">All ({lessonPlans.length})</TabsTrigger>
             <TabsTrigger value="draft">Drafts ({draftPlans.length})</TabsTrigger>
             <TabsTrigger value="scheduled">Scheduled ({scheduledPlans.length})</TabsTrigger>
             <TabsTrigger value="completed">Completed ({completedPlans.length})</TabsTrigger>
           </TabsList>
           
           <TabsContent value="all" className="mt-4">
             <div className="grid gap-4 md:grid-cols-2">
               {lessonPlans.map((plan) => (
                 <LessonPlanCard
                   key={plan.id}
                   lessonPlan={plan}
                   onEdit={handleEdit}
                   onDelete={deleteLessonPlan}
                   onView={setViewingPlan}
                 />
               ))}
             </div>
           </TabsContent>
           
           <TabsContent value="draft" className="mt-4">
             <div className="grid gap-4 md:grid-cols-2">
               {draftPlans.map((plan) => (
                 <LessonPlanCard
                   key={plan.id}
                   lessonPlan={plan}
                   onEdit={handleEdit}
                   onDelete={deleteLessonPlan}
                   onView={setViewingPlan}
                 />
               ))}
             </div>
           </TabsContent>
           
           <TabsContent value="scheduled" className="mt-4">
             <div className="grid gap-4 md:grid-cols-2">
               {scheduledPlans.map((plan) => (
                 <LessonPlanCard
                   key={plan.id}
                   lessonPlan={plan}
                   onEdit={handleEdit}
                   onDelete={deleteLessonPlan}
                   onView={setViewingPlan}
                 />
               ))}
             </div>
           </TabsContent>
           
           <TabsContent value="completed" className="mt-4">
             <div className="grid gap-4 md:grid-cols-2">
               {completedPlans.map((plan) => (
                 <LessonPlanCard
                   key={plan.id}
                   lessonPlan={plan}
                   onEdit={handleEdit}
                   onDelete={deleteLessonPlan}
                   onView={setViewingPlan}
                 />
               ))}
             </div>
           </TabsContent>
         </Tabs>
       )}
 
       <LessonPlanCreator
         open={creatorOpen}
         onOpenChange={setCreatorOpen}
         onSave={handleSave}
         editData={editingPlan}
         teacherId={userId}
       />
       
       <LessonPlanViewer
         open={!!viewingPlan}
         onOpenChange={(open) => !open && setViewingPlan(null)}
         lessonPlan={viewingPlan}
         onEdit={handleEdit}
       />
     </div>
   );
 }