 import { Card } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Calendar, Clock, Edit, Trash2, MoreVertical, BookOpen, Target } from 'lucide-react';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 import { format } from 'date-fns';
 import type { LessonPlan } from '@/hooks/useLessonPlans';
 
 interface LessonPlanCardProps {
   lessonPlan: LessonPlan;
   onEdit: (plan: LessonPlan) => void;
   onDelete: (id: string) => void;
   onView: (plan: LessonPlan) => void;
 }
 
 const statusColors: Record<string, string> = {
   draft: 'bg-muted text-muted-foreground',
   scheduled: 'bg-blue-500/10 text-blue-600',
   completed: 'bg-green-500/10 text-green-600'
 };
 
 export function LessonPlanCard({ lessonPlan, onEdit, onDelete, onView }: LessonPlanCardProps) {
   const objectives = Array.isArray(lessonPlan.objectives) 
     ? lessonPlan.objectives as string[]
     : [];
   
   return (
     <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onView(lessonPlan)}>
       <div className="flex items-start justify-between">
         <div className="flex-1">
           <div className="flex items-center gap-2 mb-2">
             <h3 className="font-semibold">{lessonPlan.title}</h3>
             <Badge className={statusColors[lessonPlan.status || 'draft']}>
               {lessonPlan.status}
             </Badge>
           </div>
           
           {lessonPlan.topic && (
             <p className="text-sm text-muted-foreground mb-2">Topic: {lessonPlan.topic}</p>
           )}
           
           <div className="flex flex-wrap gap-2 text-sm mb-3">
             {lessonPlan.grades?.name && (
               <Badge variant="outline">{lessonPlan.grades.name}</Badge>
             )}
             {lessonPlan.subjects?.name && (
               <Badge variant="secondary">{lessonPlan.subjects.name}</Badge>
             )}
           </div>
           
           {objectives.length > 0 && (
             <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
               <Target className="w-4 h-4 mt-0.5 flex-shrink-0" />
               <span className="line-clamp-2">{objectives[0]}</span>
             </div>
           )}
           
           <div className="flex items-center gap-4 text-xs text-muted-foreground">
             {lessonPlan.scheduled_date && (
               <span className="flex items-center gap-1">
                 <Calendar className="w-3 h-3" />
                 {format(new Date(lessonPlan.scheduled_date), 'MMM d, yyyy')}
               </span>
             )}
             <span className="flex items-center gap-1">
               <Clock className="w-3 h-3" />
               {lessonPlan.duration_minutes} min
             </span>
           </div>
         </div>
         
         <DropdownMenu>
           <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
             <Button variant="ghost" size="icon">
               <MoreVertical className="w-4 h-4" />
             </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align="end">
             <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(lessonPlan); }}>
               <Edit className="w-4 h-4 mr-2" />
               Edit
             </DropdownMenuItem>
             <DropdownMenuItem 
               onClick={(e) => { e.stopPropagation(); onDelete(lessonPlan.id); }}
               className="text-destructive"
             >
               <Trash2 className="w-4 h-4 mr-2" />
               Delete
             </DropdownMenuItem>
           </DropdownMenuContent>
         </DropdownMenu>
       </div>
     </Card>
   );
 }