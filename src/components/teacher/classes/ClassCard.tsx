 import { Card } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Users, BookOpen, Edit, Trash2, MoreVertical } from 'lucide-react';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 import type { ClassData } from '@/hooks/useClasses';
 
 interface ClassCardProps {
   classData: ClassData;
   onEdit: (classData: ClassData) => void;
   onDelete: (id: string) => void;
   onManageStudents: (classData: ClassData) => void;
 }
 
 export function ClassCard({ classData, onEdit, onDelete, onManageStudents }: ClassCardProps) {
   return (
     <Card className="p-5 hover:shadow-md transition-shadow">
       <div className="flex items-start justify-between">
         <div className="flex-1">
           <div className="flex items-center gap-2 mb-2">
             <h3 className="font-semibold text-lg">{classData.name}</h3>
             {classData.section && (
               <Badge variant="outline">Section {classData.section}</Badge>
             )}
           </div>
           
           <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-3">
             {classData.grades?.name && (
               <span className="flex items-center gap-1">
                 <BookOpen className="w-4 h-4" />
                 {classData.grades.name}
               </span>
             )}
             {classData.subjects?.name && (
               <Badge variant="secondary">{classData.subjects.name}</Badge>
             )}
           </div>
           
           {classData.description && (
             <p className="text-sm text-muted-foreground line-clamp-2">{classData.description}</p>
           )}
           
           <div className="mt-3 text-xs text-muted-foreground">
             Academic Year: {classData.academic_year}
           </div>
         </div>
         
         <DropdownMenu>
           <DropdownMenuTrigger asChild>
             <Button variant="ghost" size="icon">
               <MoreVertical className="w-4 h-4" />
             </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align="end">
             <DropdownMenuItem onClick={() => onManageStudents(classData)}>
               <Users className="w-4 h-4 mr-2" />
               Manage Students
             </DropdownMenuItem>
             <DropdownMenuItem onClick={() => onEdit(classData)}>
               <Edit className="w-4 h-4 mr-2" />
               Edit Class
             </DropdownMenuItem>
             <DropdownMenuItem 
               onClick={() => onDelete(classData.id)}
               className="text-destructive"
             >
               <Trash2 className="w-4 h-4 mr-2" />
               Delete Class
             </DropdownMenuItem>
           </DropdownMenuContent>
         </DropdownMenu>
       </div>
     </Card>
   );
 }