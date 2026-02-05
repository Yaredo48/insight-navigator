 import { Card } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Calendar, FileText, Edit, Trash2, MoreVertical, CheckCircle, Clock } from 'lucide-react';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 import { format, isPast } from 'date-fns';
 import type { Assignment } from '@/hooks/useAssignments';
 
 interface AssignmentCardProps {
   assignment: Assignment;
   onEdit: (assignment: Assignment) => void;
   onDelete: (id: string) => void;
   onGrade: (assignment: Assignment) => void;
 }
 
 const typeIcons: Record<string, string> = {
   written: '📝',
   quiz: '❓',
   project: '📊',
   file: '📎'
 };
 
 export function AssignmentCard({ assignment, onEdit, onDelete, onGrade }: AssignmentCardProps) {
   const isOverdue = assignment.due_date && isPast(new Date(assignment.due_date));
   
   return (
     <Card className="p-5 hover:shadow-md transition-shadow">
       <div className="flex items-start justify-between">
         <div className="flex-1">
           <div className="flex items-center gap-2 mb-2">
             <span className="text-xl">{typeIcons[assignment.assignment_type] || '📄'}</span>
             <h3 className="font-semibold">{assignment.title}</h3>
             {!assignment.is_published && (
               <Badge variant="outline">Draft</Badge>
             )}
           </div>
           
           {assignment.classes?.name && (
             <p className="text-sm text-muted-foreground mb-2">{assignment.classes.name}</p>
           )}
           
           {assignment.description && (
             <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{assignment.description}</p>
           )}
           
           <div className="flex flex-wrap gap-3 text-sm">
             {assignment.due_date && (
               <span className={`flex items-center gap-1 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                 <Calendar className="w-4 h-4" />
                 Due: {format(new Date(assignment.due_date), 'MMM d, yyyy')}
               </span>
             )}
             <span className="flex items-center gap-1 text-muted-foreground">
               <FileText className="w-4 h-4" />
               {assignment.max_points} points
             </span>
           </div>
         </div>
         
         <DropdownMenu>
           <DropdownMenuTrigger asChild>
             <Button variant="ghost" size="icon">
               <MoreVertical className="w-4 h-4" />
             </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align="end">
             <DropdownMenuItem onClick={() => onGrade(assignment)}>
               <CheckCircle className="w-4 h-4 mr-2" />
               Grade Submissions
             </DropdownMenuItem>
             <DropdownMenuItem onClick={() => onEdit(assignment)}>
               <Edit className="w-4 h-4 mr-2" />
               Edit Assignment
             </DropdownMenuItem>
             <DropdownMenuItem 
               onClick={() => onDelete(assignment.id)}
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