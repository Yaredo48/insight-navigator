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
 import type { Announcement } from '@/hooks/useAnnouncements';
 
 interface AnnouncementComposerProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onSave: (data: Partial<Announcement>) => void;
   editData?: Announcement | null;
   teacherId: string;
 }
 
 export function AnnouncementComposer({ open, onOpenChange, onSave, editData, teacherId }: AnnouncementComposerProps) {
   const [title, setTitle] = useState('');
   const [content, setContent] = useState('');
   const [priority, setPriority] = useState('normal');
   const [targetType, setTargetType] = useState('class');
   const [classId, setClassId] = useState('');
   const [gradeId, setGradeId] = useState('');
   const [isPinned, setIsPinned] = useState(false);
   const [expiresAt, setExpiresAt] = useState('');
   
   const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
   const [grades, setGrades] = useState<{ id: number; name: string }[]>([]);
 
   useEffect(() => {
     const fetchData = async () => {
       const [classesRes, gradesRes] = await Promise.all([
         supabase.from('classes').select('id, name').eq('teacher_id', teacherId),
         supabase.from('grades').select('id, name').order('grade_number')
       ]);
       setClasses(classesRes.data || []);
       setGrades(gradesRes.data || []);
     };
     fetchData();
   }, [teacherId]);
 
   useEffect(() => {
     if (editData) {
       setTitle(editData.title);
       setContent(editData.content);
       setPriority(editData.priority || 'normal');
       setTargetType(editData.target_type || 'class');
       setClassId(editData.class_id || '');
       setGradeId(editData.target_grade_id?.toString() || '');
       setIsPinned(editData.is_pinned || false);
       setExpiresAt(editData.expires_at ? editData.expires_at.split('T')[0] : '');
     } else {
       resetForm();
     }
   }, [editData]);
 
   const resetForm = () => {
     setTitle('');
     setContent('');
     setPriority('normal');
     setTargetType('class');
     setClassId('');
     setGradeId('');
     setIsPinned(false);
     setExpiresAt('');
   };
 
   const handleSubmit = () => {
     if (!title.trim() || !content.trim()) return;
     
     onSave({
       title,
       content,
       priority,
       target_type: targetType,
       class_id: targetType === 'class' ? classId : undefined,
       target_grade_id: targetType === 'grade' ? parseInt(gradeId) : undefined,
       is_pinned: isPinned,
       expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined
     });
     
     onOpenChange(false);
     resetForm();
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-lg">
         <DialogHeader>
           <DialogTitle>{editData ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
         </DialogHeader>
         
         <div className="space-y-4">
           <div>
             <Label htmlFor="title">Title *</Label>
             <Input
               id="title"
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               placeholder="Announcement title"
             />
           </div>
           
           <div>
             <Label htmlFor="content">Content *</Label>
             <Textarea
               id="content"
               value={content}
               onChange={(e) => setContent(e.target.value)}
               placeholder="Write your announcement..."
               rows={4}
             />
           </div>
           
           <div className="grid grid-cols-2 gap-4">
             <div>
               <Label>Priority</Label>
               <Select value={priority} onValueChange={setPriority}>
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="low">Low</SelectItem>
                   <SelectItem value="normal">Normal</SelectItem>
                   <SelectItem value="high">High</SelectItem>
                   <SelectItem value="urgent">Urgent</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             
             <div>
               <Label>Target</Label>
               <Select value={targetType} onValueChange={setTargetType}>
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="class">Specific Class</SelectItem>
                   <SelectItem value="grade">Entire Grade</SelectItem>
                   <SelectItem value="school">School-wide</SelectItem>
                 </SelectContent>
               </Select>
             </div>
           </div>
           
           {targetType === 'class' && (
             <div>
               <Label>Class</Label>
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
           )}
           
           {targetType === 'grade' && (
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
           )}
           
           <div>
             <Label htmlFor="expiresAt">Expires (optional)</Label>
             <Input
               id="expiresAt"
               type="date"
               value={expiresAt}
               onChange={(e) => setExpiresAt(e.target.value)}
             />
           </div>
           
           <div className="flex items-center gap-2">
             <Switch checked={isPinned} onCheckedChange={setIsPinned} />
             <Label>Pin this announcement</Label>
           </div>
           
           <div className="flex justify-end gap-2">
             <Button variant="outline" onClick={() => onOpenChange(false)}>
               Cancel
             </Button>
             <Button onClick={handleSubmit} disabled={!title.trim() || !content.trim()}>
               {editData ? 'Update' : 'Post Announcement'}
             </Button>
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 }