 import { useState, useEffect } from 'react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Textarea } from '@/components/ui/textarea';
 import { Badge } from '@/components/ui/badge';
 import { Card } from '@/components/ui/card';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { CheckCircle, Clock, User, Loader2 } from 'lucide-react';
 import { format } from 'date-fns';
 import type { Assignment, Submission } from '@/hooks/useAssignments';
 
 interface GradingPanelProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   assignment: Assignment | null;
   getSubmissions: (assignmentId: string) => Promise<Submission[]>;
   gradeSubmission: (submissionId: string, grade: number, feedback: string) => Promise<void>;
 }
 
 export function GradingPanel({ 
   open, 
   onOpenChange, 
   assignment,
   getSubmissions,
   gradeSubmission
 }: GradingPanelProps) {
   const [submissions, setSubmissions] = useState<Submission[]>([]);
   const [loading, setLoading] = useState(false);
   const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
   const [grade, setGrade] = useState('');
   const [feedback, setFeedback] = useState('');
   const [saving, setSaving] = useState(false);
 
   useEffect(() => {
     if (open && assignment) {
       loadSubmissions();
     }
   }, [open, assignment]);
 
   const loadSubmissions = async () => {
     if (!assignment) return;
     setLoading(true);
     try {
       const data = await getSubmissions(assignment.id);
       setSubmissions(data);
     } catch (error) {
       console.error('Error loading submissions:', error);
     } finally {
       setLoading(false);
     }
   };
 
   const handleSelectSubmission = (submission: Submission) => {
     setSelectedSubmission(submission);
     setGrade(submission.grade?.toString() || '');
     setFeedback(submission.feedback || '');
   };
 
   const handleGrade = async () => {
     if (!selectedSubmission || !grade) return;
     
     setSaving(true);
     try {
       await gradeSubmission(selectedSubmission.id, parseFloat(grade), feedback);
       await loadSubmissions();
       setSelectedSubmission(null);
       setGrade('');
       setFeedback('');
     } finally {
       setSaving(false);
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-4xl max-h-[90vh]">
         <DialogHeader>
           <DialogTitle>Grade Submissions: {assignment?.title}</DialogTitle>
         </DialogHeader>
         
         <div className="grid grid-cols-2 gap-4 h-[60vh]">
           {/* Submissions List */}
           <div className="border rounded-lg">
             <div className="p-3 border-b bg-muted/30">
               <h4 className="font-medium">Submissions ({submissions.length})</h4>
             </div>
             <ScrollArea className="h-[calc(60vh-3rem)]">
               {loading ? (
                 <div className="flex items-center justify-center py-8">
                   <Loader2 className="w-6 h-6 animate-spin" />
                 </div>
               ) : submissions.length === 0 ? (
                 <div className="text-center py-8 text-muted-foreground">
                   No submissions yet
                 </div>
               ) : (
                 <div className="p-2 space-y-2">
                   {submissions.map((sub) => (
                     <Card
                       key={sub.id}
                       className={`p-3 cursor-pointer transition-colors ${
                         selectedSubmission?.id === sub.id ? 'ring-2 ring-primary' : ''
                       }`}
                       onClick={() => handleSelectSubmission(sub)}
                     >
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <User className="w-4 h-4 text-muted-foreground" />
                           <span className="font-medium text-sm">{sub.student_id.slice(0, 8)}...</span>
                         </div>
                         <Badge variant={sub.status === 'graded' ? 'default' : 'secondary'}>
                           {sub.status === 'graded' ? (
                             <><CheckCircle className="w-3 h-3 mr-1" />{sub.grade}/{assignment?.max_points}</>
                           ) : (
                             <><Clock className="w-3 h-3 mr-1" />Pending</>
                           )}
                         </Badge>
                       </div>
                       <p className="text-xs text-muted-foreground mt-1">
                         Submitted: {format(new Date(sub.submitted_at), 'MMM d, h:mm a')}
                         {sub.is_late && <span className="text-destructive ml-2">(Late)</span>}
                       </p>
                     </Card>
                   ))}
                 </div>
               )}
             </ScrollArea>
           </div>
           
           {/* Grading Form */}
           <div className="border rounded-lg">
             <div className="p-3 border-b bg-muted/30">
               <h4 className="font-medium">Grading</h4>
             </div>
             
             {selectedSubmission ? (
               <div className="p-4 space-y-4">
                 <div>
                   <h5 className="font-medium mb-2">Student Response</h5>
                   <div className="bg-muted/30 p-3 rounded-lg text-sm max-h-40 overflow-y-auto">
                     {selectedSubmission.content || 'No text content submitted'}
                   </div>
                 </div>
                 
                 <div>
                   <label className="text-sm font-medium">
                     Grade (out of {assignment?.max_points})
                   </label>
                   <Input
                     type="number"
                     value={grade}
                     onChange={(e) => setGrade(e.target.value)}
                     max={assignment?.max_points}
                     min={0}
                   />
                 </div>
                 
                 <div>
                   <label className="text-sm font-medium">Feedback</label>
                   <Textarea
                     value={feedback}
                     onChange={(e) => setFeedback(e.target.value)}
                     placeholder="Provide feedback to the student..."
                     rows={4}
                   />
                 </div>
                 
                 <Button 
                   onClick={handleGrade} 
                   disabled={!grade || saving}
                   className="w-full"
                 >
                   {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                   Submit Grade
                 </Button>
               </div>
             ) : (
               <div className="flex items-center justify-center h-full text-muted-foreground">
                 Select a submission to grade
               </div>
             )}
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 }