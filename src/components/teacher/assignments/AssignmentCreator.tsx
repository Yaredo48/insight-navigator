 import { useState, useEffect } from 'react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Switch } from '@/components/ui/switch';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { supabase } from '@/integrations/supabase/client';
 import type { Assignment } from '@/hooks/useAssignments';
 
 interface AssignmentCreatorProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onSave: (data: Partial<Assignment>) => void;
   editData?: Assignment | null;
   teacherId: string;
 }
 
 export function AssignmentCreator({ open, onOpenChange, onSave, editData, teacherId }: AssignmentCreatorProps) {
   const [title, setTitle] = useState('');
   const [description, setDescription] = useState('');
   const [instructions, setInstructions] = useState('');
   const [classId, setClassId] = useState('');
   const [assignmentType, setAssignmentType] = useState('written');
   const [dueDate, setDueDate] = useState('');
   const [maxPoints, setMaxPoints] = useState(100);
   const [isPublished, setIsPublished] = useState(false);
   const [allowLate, setAllowLate] = useState(true);
   
   const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
 
   useEffect(() => {
     const fetchClasses = async () => {
       const { data } = await supabase
         .from('classes')
         .select('id, name')
         .eq('teacher_id', teacherId)
         .eq('is_active', true);
       setClasses(data || []);
     };
     fetchClasses();
   }, [teacherId]);
 
   useEffect(() => {
     if (editData) {
       setTitle(editData.title);
       setDescription(editData.description || '');
       setInstructions(editData.instructions || '');
       setClassId(editData.class_id);
       setAssignmentType(editData.assignment_type);
       setDueDate(editData.due_date ? editData.due_date.split('T')[0] : '');
       setMaxPoints(editData.max_points || 100);
       setIsPublished(editData.is_published || false);
       setAllowLate(editData.allow_late_submissions ?? true);
     } else {
       resetForm();
     }
   }, [editData]);
 
   const resetForm = () => {
     setTitle('');
     setDescription('');
     setInstructions('');
     setClassId('');
     setAssignmentType('written');
     setDueDate('');
     setMaxPoints(100);
     setIsPublished(false);
     setAllowLate(true);
   };
 
   const handleSubmit = () => {
     if (!title.trim() || !classId) return;
     
     onSave({
       title,
       description: description || undefined,
       instructions: instructions || undefined,
       class_id: classId,
       assignment_type: assignmentType,
       due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
       max_points: maxPoints,
       is_published: isPublished,
       allow_late_submissions: allowLate
     });
     
     onOpenChange(false);
     resetForm();
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>{editData ? 'Edit Assignment' : 'Create Assignment'}</DialogTitle>
         </DialogHeader>
         
         <div className="space-y-4">
           <div>
             <Label htmlFor="title">Title *</Label>
             <Input
               id="title"
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               placeholder="Assignment title"
             />
           </div>
           
           <div>
             <Label>Class *</Label>
             <Select value={classId} onValueChange={setClassId}>
               <SelectTrigger>
                 <SelectValue placeholder="Select class" />
               </SelectTrigger>
               <SelectContent>
                 {classes.map((c) => (
                   <SelectItem key={c.id} value={c.id}>
                     {c.name}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
             <div>
               <Label>Type</Label>
               <Select value={assignmentType} onValueChange={setAssignmentType}>
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="written">📝 Written</SelectItem>
                   <SelectItem value="quiz">❓ Quiz-based</SelectItem>
                   <SelectItem value="project">📊 Project</SelectItem>
                   <SelectItem value="file">📎 File Upload</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             
             <div>
               <Label htmlFor="maxPoints">Max Points</Label>
               <Input
                 id="maxPoints"
                 type="number"
                 value={maxPoints}
                 onChange={(e) => setMaxPoints(parseInt(e.target.value) || 100)}
               />
             </div>
           </div>
           
           <div>
             <Label htmlFor="dueDate">Due Date</Label>
             <Input
               id="dueDate"
               type="date"
               value={dueDate}
               onChange={(e) => setDueDate(e.target.value)}
             />
           </div>
           
           <div>
             <Label htmlFor="description">Description</Label>
             <Textarea
               id="description"
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               placeholder="Brief description..."
               rows={2}
             />
           </div>
           
           <div>
             <Label htmlFor="instructions">Instructions</Label>
             <Textarea
               id="instructions"
               value={instructions}
               onChange={(e) => setInstructions(e.target.value)}
               placeholder="Detailed instructions for students..."
               rows={4}
             />
           </div>
           
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <Switch
                 checked={allowLate}
                 onCheckedChange={setAllowLate}
               />
               <Label>Allow late submissions</Label>
             </div>
             
             <div className="flex items-center gap-2">
               <Switch
                 checked={isPublished}
                 onCheckedChange={setIsPublished}
               />
               <Label>Publish immediately</Label>
             </div>
           </div>
           
           <div className="flex justify-end gap-2">
             <Button variant="outline" onClick={() => onOpenChange(false)}>
               Cancel
             </Button>
             <Button onClick={handleSubmit} disabled={!title.trim() || !classId}>
               {editData ? 'Update' : 'Create'}
             </Button>
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 }