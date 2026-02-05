 import { useState } from 'react';
 import { Button } from '@/components/ui/button';
 import { Plus, Loader2 } from 'lucide-react';
 import { useAssignments, Assignment } from '@/hooks/useAssignments';
 import { AssignmentCard } from './AssignmentCard';
 import { AssignmentCreator } from './AssignmentCreator';
 import { GradingPanel } from './GradingPanel';
 
 interface AssignmentManagerProps {
   userId: string;
 }
 
 export function AssignmentManager({ userId }: AssignmentManagerProps) {
   const { 
     assignments, 
     loading, 
     createAssignment, 
     updateAssignment, 
     deleteAssignment,
     getSubmissions,
     gradeSubmission
   } = useAssignments(userId);
   
   const [creatorOpen, setCreatorOpen] = useState(false);
   const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
   const [gradingAssignment, setGradingAssignment] = useState<Assignment | null>(null);
 
   const handleSave = async (data: Partial<Assignment>) => {
     if (editingAssignment) {
       await updateAssignment(editingAssignment.id, data);
     } else {
       await createAssignment(data);
     }
     setEditingAssignment(null);
   };
 
   const handleEdit = (assignment: Assignment) => {
     setEditingAssignment(assignment);
     setCreatorOpen(true);
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
           <h2 className="text-xl font-semibold">Assignments</h2>
           <p className="text-sm text-muted-foreground">
             Create assignments and grade student submissions
           </p>
         </div>
         <Button onClick={() => { setEditingAssignment(null); setCreatorOpen(true); }}>
           <Plus className="w-4 h-4 mr-2" />
           New Assignment
         </Button>
       </div>
 
       {assignments.length === 0 ? (
         <div className="text-center py-12 bg-muted/30 rounded-lg">
           <h3 className="font-medium mb-2">No assignments yet</h3>
           <p className="text-sm text-muted-foreground mb-4">
             Create your first assignment for your class
           </p>
           <Button onClick={() => setCreatorOpen(true)}>
             <Plus className="w-4 h-4 mr-2" />
             Create Assignment
           </Button>
         </div>
       ) : (
         <div className="grid gap-4 md:grid-cols-2">
           {assignments.map((assignment) => (
             <AssignmentCard
               key={assignment.id}
               assignment={assignment}
               onEdit={handleEdit}
               onDelete={deleteAssignment}
               onGrade={setGradingAssignment}
             />
           ))}
         </div>
       )}
 
       <AssignmentCreator
         open={creatorOpen}
         onOpenChange={setCreatorOpen}
         onSave={handleSave}
         editData={editingAssignment}
         teacherId={userId}
       />
       
       <GradingPanel
         open={!!gradingAssignment}
         onOpenChange={(open) => !open && setGradingAssignment(null)}
         assignment={gradingAssignment}
         getSubmissions={getSubmissions}
         gradeSubmission={gradeSubmission}
       />
     </div>
   );
 }