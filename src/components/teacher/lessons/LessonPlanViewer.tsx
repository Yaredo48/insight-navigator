 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { Card } from '@/components/ui/card';
 import { Calendar, Clock, Target, Package, CheckSquare, FileText, Edit } from 'lucide-react';
 import { format } from 'date-fns';
 import type { LessonPlan } from '@/hooks/useLessonPlans';
 
 interface LessonPlanViewerProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   lessonPlan: LessonPlan | null;
   onEdit: (plan: LessonPlan) => void;
 }
 
 export function LessonPlanViewer({ open, onOpenChange, lessonPlan, onEdit }: LessonPlanViewerProps) {
   if (!lessonPlan) return null;
   
   const objectives = Array.isArray(lessonPlan.objectives) ? lessonPlan.objectives as string[] : [];
   const materials = Array.isArray(lessonPlan.materials) ? lessonPlan.materials as string[] : [];
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <div className="flex items-center justify-between">
             <DialogTitle>{lessonPlan.title}</DialogTitle>
             <Button variant="outline" size="sm" onClick={() => { onOpenChange(false); onEdit(lessonPlan); }}>
               <Edit className="w-4 h-4 mr-2" />
               Edit
             </Button>
           </div>
         </DialogHeader>
         
         <div className="space-y-6">
           {/* Meta info */}
           <div className="flex flex-wrap gap-3">
             <Badge>{lessonPlan.status}</Badge>
             {lessonPlan.grades?.name && <Badge variant="outline">{lessonPlan.grades.name}</Badge>}
             {lessonPlan.subjects?.name && <Badge variant="secondary">{lessonPlan.subjects.name}</Badge>}
           </div>
           
           <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
             {lessonPlan.scheduled_date && (
               <span className="flex items-center gap-1">
                 <Calendar className="w-4 h-4" />
                 {format(new Date(lessonPlan.scheduled_date), 'MMMM d, yyyy')}
               </span>
             )}
             <span className="flex items-center gap-1">
               <Clock className="w-4 h-4" />
               {lessonPlan.duration_minutes} minutes
             </span>
           </div>
           
           {lessonPlan.topic && (
             <Card className="p-4 bg-muted/30">
               <h4 className="font-medium mb-1">Topic</h4>
               <p>{lessonPlan.topic}</p>
             </Card>
           )}
           
           {/* Objectives */}
           {objectives.length > 0 && (
             <div>
               <h4 className="font-medium flex items-center gap-2 mb-3">
                 <Target className="w-4 h-4" />
                 Learning Objectives
               </h4>
               <ul className="space-y-2">
                 {objectives.map((obj, i) => (
                   <li key={i} className="flex items-start gap-2 text-sm">
                     <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                       {i + 1}
                     </span>
                     {obj}
                   </li>
                 ))}
               </ul>
             </div>
           )}
           
           {/* Materials */}
           {materials.length > 0 && (
             <div>
               <h4 className="font-medium flex items-center gap-2 mb-3">
                 <Package className="w-4 h-4" />
                 Materials Needed
               </h4>
               <ul className="grid grid-cols-2 gap-2">
                 {materials.map((mat, i) => (
                   <li key={i} className="flex items-center gap-2 text-sm">
                     <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                     {mat}
                   </li>
                 ))}
               </ul>
             </div>
           )}
           
           {/* Assessment */}
           {lessonPlan.assessment_methods && (
             <div>
               <h4 className="font-medium flex items-center gap-2 mb-2">
                 <CheckSquare className="w-4 h-4" />
                 Assessment Methods
               </h4>
               <p className="text-sm text-muted-foreground">{lessonPlan.assessment_methods}</p>
             </div>
           )}
           
           {/* Notes */}
           {lessonPlan.notes && (
             <div>
               <h4 className="font-medium flex items-center gap-2 mb-2">
                 <FileText className="w-4 h-4" />
                 Notes
               </h4>
               <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lessonPlan.notes}</p>
             </div>
           )}
         </div>
       </DialogContent>
     </Dialog>
   );
 }