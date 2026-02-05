 import { useState } from 'react';
 import { Button } from '@/components/ui/button';
 import { Plus, Loader2 } from 'lucide-react';
 import { useClasses, ClassData } from '@/hooks/useClasses';
 import { ClassCard } from './ClassCard';
 import { ClassCreator } from './ClassCreator';
 
 interface ClassManagerProps {
   userId: string;
 }
 
 export function ClassManager({ userId }: ClassManagerProps) {
   const { classes, loading, createClass, updateClass, deleteClass } = useClasses(userId);
   const [creatorOpen, setCreatorOpen] = useState(false);
   const [editingClass, setEditingClass] = useState<ClassData | null>(null);
 
   const handleSave = async (data: Partial<ClassData>) => {
     if (editingClass) {
       await updateClass(editingClass.id, data);
     } else {
       await createClass(data);
     }
     setEditingClass(null);
   };
 
   const handleEdit = (classData: ClassData) => {
     setEditingClass(classData);
     setCreatorOpen(true);
   };
 
   const handleManageStudents = (classData: ClassData) => {
     // TODO: Implement student management modal
     console.log('Manage students for:', classData.id);
   };
 
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
           <h2 className="text-xl font-semibold">My Classes</h2>
           <p className="text-sm text-muted-foreground">
             Manage your classes and student enrollments
           </p>
         </div>
         <Button onClick={() => { setEditingClass(null); setCreatorOpen(true); }}>
           <Plus className="w-4 h-4 mr-2" />
           New Class
         </Button>
       </div>
 
       {classes.length === 0 ? (
         <div className="text-center py-12 bg-muted/30 rounded-lg">
           <h3 className="font-medium mb-2">No classes yet</h3>
           <p className="text-sm text-muted-foreground mb-4">
             Create your first class to start managing students
           </p>
           <Button onClick={() => setCreatorOpen(true)}>
             <Plus className="w-4 h-4 mr-2" />
             Create Class
           </Button>
         </div>
       ) : (
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           {classes.map((cls) => (
             <ClassCard
               key={cls.id}
               classData={cls}
               onEdit={handleEdit}
               onDelete={deleteClass}
               onManageStudents={handleManageStudents}
             />
           ))}
         </div>
       )}
 
       <ClassCreator
         open={creatorOpen}
         onOpenChange={setCreatorOpen}
         onSave={handleSave}
         editData={editingClass}
       />
     </div>
   );
 }