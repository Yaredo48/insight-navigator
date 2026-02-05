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
 import { Plus, X } from 'lucide-react';
 import type { LessonPlan } from '@/hooks/useLessonPlans';
 
 interface LessonPlanCreatorProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onSave: (data: Partial<LessonPlan>) => void;
   editData?: LessonPlan | null;
   teacherId: string;
 }
 
 export function LessonPlanCreator({ open, onOpenChange, onSave, editData, teacherId }: LessonPlanCreatorProps) {
   const [title, setTitle] = useState('');
   const [topic, setTopic] = useState('');
   const [gradeId, setGradeId] = useState('');
   const [subjectId, setSubjectId] = useState('');
   const [classId, setClassId] = useState('');
   const [scheduledDate, setScheduledDate] = useState('');
   const [durationMinutes, setDurationMinutes] = useState(45);
   const [status, setStatus] = useState('draft');
   const [objectives, setObjectives] = useState<string[]>(['']);
   const [materials, setMaterials] = useState<string[]>(['']);
   const [assessmentMethods, setAssessmentMethods] = useState('');
   const [notes, setNotes] = useState('');
   
   const [grades, setGrades] = useState<{ id: number; name: string }[]>([]);
   const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
   const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
 
   useEffect(() => {
     const fetchData = async () => {
       const [gradesRes, subjectsRes, classesRes] = await Promise.all([
         supabase.from('grades').select('id, name').order('grade_number'),
         supabase.from('subjects').select('id, name').order('name'),
         supabase.from('classes').select('id, name').eq('teacher_id', teacherId)
       ]);
       setGrades(gradesRes.data || []);
       setSubjects(subjectsRes.data || []);
       setClasses(classesRes.data || []);
     };
     fetchData();
   }, [teacherId]);
 
   useEffect(() => {
     if (editData) {
       setTitle(editData.title);
       setTopic(editData.topic || '');
       setGradeId(editData.grade_id?.toString() || '');
       setSubjectId(editData.subject_id?.toString() || '');
       setClassId(editData.class_id || '');
       setScheduledDate(editData.scheduled_date || '');
       setDurationMinutes(editData.duration_minutes || 45);
       setStatus(editData.status || 'draft');
       const objs = Array.isArray(editData.objectives) ? editData.objectives as string[] : [];
       setObjectives(objs.length > 0 ? objs : ['']);
       const mats = Array.isArray(editData.materials) ? editData.materials as string[] : [];
       setMaterials(mats.length > 0 ? mats : ['']);
       setAssessmentMethods(editData.assessment_methods || '');
       setNotes(editData.notes || '');
     } else {
       resetForm();
     }
   }, [editData]);
 
   const resetForm = () => {
     setTitle('');
     setTopic('');
     setGradeId('');
     setSubjectId('');
     setClassId('');
     setScheduledDate('');
     setDurationMinutes(45);
     setStatus('draft');
     setObjectives(['']);
     setMaterials(['']);
     setAssessmentMethods('');
     setNotes('');
   };
 
   const handleSubmit = () => {
     if (!title.trim()) return;
     
     onSave({
       title,
       topic: topic || undefined,
       grade_id: gradeId ? parseInt(gradeId) : undefined,
       subject_id: subjectId ? parseInt(subjectId) : undefined,
       class_id: classId || undefined,
       scheduled_date: scheduledDate || undefined,
       duration_minutes: durationMinutes,
       status,
       objectives: objectives.filter(o => o.trim()),
       materials: materials.filter(m => m.trim()),
       assessment_methods: assessmentMethods || undefined,
       notes: notes || undefined
     });
     
     onOpenChange(false);
     resetForm();
   };
 
   const addObjective = () => setObjectives([...objectives, '']);
   const removeObjective = (index: number) => setObjectives(objectives.filter((_, i) => i !== index));
   const updateObjective = (index: number, value: string) => {
     const updated = [...objectives];
     updated[index] = value;
     setObjectives(updated);
   };
 
   const addMaterial = () => setMaterials([...materials, '']);
   const removeMaterial = (index: number) => setMaterials(materials.filter((_, i) => i !== index));
   const updateMaterial = (index: number, value: string) => {
     const updated = [...materials];
     updated[index] = value;
     setMaterials(updated);
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>{editData ? 'Edit Lesson Plan' : 'Create Lesson Plan'}</DialogTitle>
         </DialogHeader>
         
         <div className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
             <div className="col-span-2">
               <Label htmlFor="title">Title *</Label>
               <Input
                 id="title"
                 value={title}
                 onChange={(e) => setTitle(e.target.value)}
                 placeholder="Lesson plan title"
               />
             </div>
             
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
             <Label htmlFor="topic">Topic</Label>
             <Input
               id="topic"
               value={topic}
               onChange={(e) => setTopic(e.target.value)}
               placeholder="Main topic for this lesson"
             />
           </div>
           
           <div className="grid grid-cols-3 gap-4">
             <div>
               <Label>Class (optional)</Label>
               <Select value={classId} onValueChange={setClassId}>
                 <SelectTrigger>
                   <SelectValue placeholder="Select" />
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
             
             <div>
               <Label htmlFor="scheduledDate">Scheduled Date</Label>
               <Input
                 id="scheduledDate"
                 type="date"
                 value={scheduledDate}
                 onChange={(e) => setScheduledDate(e.target.value)}
               />
             </div>
             
             <div>
               <Label htmlFor="duration">Duration (min)</Label>
               <Input
                 id="duration"
                 type="number"
                 value={durationMinutes}
                 onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 45)}
               />
             </div>
           </div>
           
           <div>
             <div className="flex items-center justify-between mb-2">
               <Label>Learning Objectives</Label>
               <Button type="button" variant="ghost" size="sm" onClick={addObjective}>
                 <Plus className="w-4 h-4 mr-1" /> Add
               </Button>
             </div>
             {objectives.map((obj, index) => (
               <div key={index} className="flex gap-2 mb-2">
                 <Input
                   value={obj}
                   onChange={(e) => updateObjective(index, e.target.value)}
                   placeholder={`Objective ${index + 1}`}
                 />
                 {objectives.length > 1 && (
                   <Button type="button" variant="ghost" size="icon" onClick={() => removeObjective(index)}>
                     <X className="w-4 h-4" />
                   </Button>
                 )}
               </div>
             ))}
           </div>
           
           <div>
             <div className="flex items-center justify-between mb-2">
               <Label>Materials Needed</Label>
               <Button type="button" variant="ghost" size="sm" onClick={addMaterial}>
                 <Plus className="w-4 h-4 mr-1" /> Add
               </Button>
             </div>
             {materials.map((mat, index) => (
               <div key={index} className="flex gap-2 mb-2">
                 <Input
                   value={mat}
                   onChange={(e) => updateMaterial(index, e.target.value)}
                   placeholder={`Material ${index + 1}`}
                 />
                 {materials.length > 1 && (
                   <Button type="button" variant="ghost" size="icon" onClick={() => removeMaterial(index)}>
                     <X className="w-4 h-4" />
                   </Button>
                 )}
               </div>
             ))}
           </div>
           
           <div>
             <Label htmlFor="assessment">Assessment Methods</Label>
             <Textarea
               id="assessment"
               value={assessmentMethods}
               onChange={(e) => setAssessmentMethods(e.target.value)}
               placeholder="How will you assess student understanding?"
               rows={2}
             />
           </div>
           
           <div>
             <Label htmlFor="notes">Notes</Label>
             <Textarea
               id="notes"
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               placeholder="Additional notes..."
               rows={2}
             />
           </div>
           
           <div>
             <Label>Status</Label>
             <Select value={status} onValueChange={setStatus}>
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="draft">Draft</SelectItem>
                 <SelectItem value="scheduled">Scheduled</SelectItem>
                 <SelectItem value="completed">Completed</SelectItem>
               </SelectContent>
             </Select>
           </div>
           
           <div className="flex justify-end gap-2">
             <Button variant="outline" onClick={() => onOpenChange(false)}>
               Cancel
             </Button>
             <Button onClick={handleSubmit} disabled={!title.trim()}>
               {editData ? 'Update' : 'Create'}
             </Button>
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 }