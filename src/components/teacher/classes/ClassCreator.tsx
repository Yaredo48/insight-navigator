 import { useState, useEffect } from 'react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
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
 import type { ClassData } from '@/hooks/useClasses';
 
 interface ClassCreatorProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onSave: (data: Partial<ClassData>) => void;
   editData?: ClassData | null;
 }
 
 export function ClassCreator({ open, onOpenChange, onSave, editData }: ClassCreatorProps) {
   const [name, setName] = useState('');
   const [section, setSection] = useState('');
   const [gradeId, setGradeId] = useState<string>('');
   const [subjectId, setSubjectId] = useState<string>('');
   const [description, setDescription] = useState('');
   const [academicYear, setAcademicYear] = useState('2025-2026');
   
   const [grades, setGrades] = useState<{ id: number; name: string }[]>([]);
   const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
 
   useEffect(() => {
     const fetchData = async () => {
       const [gradesRes, subjectsRes] = await Promise.all([
         supabase.from('grades').select('id, name').order('grade_number'),
         supabase.from('subjects').select('id, name').order('name')
       ]);
       setGrades(gradesRes.data || []);
       setSubjects(subjectsRes.data || []);
     };
     fetchData();
   }, []);
 
   useEffect(() => {
     if (editData) {
       setName(editData.name);
       setSection(editData.section || '');
       setGradeId(editData.grade_id?.toString() || '');
       setSubjectId(editData.subject_id?.toString() || '');
       setDescription(editData.description || '');
       setAcademicYear(editData.academic_year || '2025-2026');
     } else {
       resetForm();
     }
   }, [editData]);
 
   const resetForm = () => {
     setName('');
     setSection('');
     setGradeId('');
     setSubjectId('');
     setDescription('');
     setAcademicYear('2025-2026');
   };
 
   const handleSubmit = () => {
     if (!name.trim()) return;
     
     onSave({
       name,
       section: section || undefined,
       grade_id: gradeId ? parseInt(gradeId) : undefined,
       subject_id: subjectId ? parseInt(subjectId) : undefined,
       description: description || undefined,
       academic_year: academicYear
     });
     
     onOpenChange(false);
     resetForm();
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-md">
         <DialogHeader>
           <DialogTitle>{editData ? 'Edit Class' : 'Create New Class'}</DialogTitle>
         </DialogHeader>
         
         <div className="space-y-4">
           <div>
             <Label htmlFor="name">Class Name *</Label>
             <Input
               id="name"
               value={name}
               onChange={(e) => setName(e.target.value)}
               placeholder="e.g., Grade 10 Mathematics"
             />
           </div>
           
           <div className="grid grid-cols-2 gap-4">
             <div>
               <Label htmlFor="section">Section</Label>
               <Input
                 id="section"
                 value={section}
                 onChange={(e) => setSection(e.target.value)}
                 placeholder="e.g., A"
               />
             </div>
             
             <div>
               <Label htmlFor="academicYear">Academic Year</Label>
               <Input
                 id="academicYear"
                 value={academicYear}
                 onChange={(e) => setAcademicYear(e.target.value)}
                 placeholder="2025-2026"
               />
             </div>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
             <div>
               <Label>Grade</Label>
               <Select value={gradeId} onValueChange={setGradeId}>
                 <SelectTrigger>
                   <SelectValue placeholder="Select grade" />
                 </SelectTrigger>
                 <SelectContent>
                   {grades.map((g) => (
                     <SelectItem key={g.id} value={g.id.toString()}>
                       {g.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             
             <div>
               <Label>Subject</Label>
               <Select value={subjectId} onValueChange={setSubjectId}>
                 <SelectTrigger>
                   <SelectValue placeholder="Select subject" />
                 </SelectTrigger>
                 <SelectContent>
                   {subjects.map((s) => (
                     <SelectItem key={s.id} value={s.id.toString()}>
                       {s.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           </div>
           
           <div>
             <Label htmlFor="description">Description</Label>
             <Textarea
               id="description"
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               placeholder="Brief description of the class..."
               rows={3}
             />
           </div>
           
           <div className="flex justify-end gap-2">
             <Button variant="outline" onClick={() => onOpenChange(false)}>
               Cancel
             </Button>
             <Button onClick={handleSubmit} disabled={!name.trim()}>
               {editData ? 'Update Class' : 'Create Class'}
             </Button>
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 }