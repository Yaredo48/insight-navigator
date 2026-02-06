import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Send, Loader2, Calendar, FileText } from 'lucide-react';
import { format, isPast } from 'date-fns';
import type { StudentAssignment } from '@/hooks/useStudentAssignments';

interface SubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: StudentAssignment | null;
  onSubmit: (assignmentId: string, content: string) => Promise<void>;
  onUpdate: (submissionId: string, content: string) => Promise<void>;
}

export function SubmissionDialog({
  open,
  onOpenChange,
  assignment,
  onSubmit,
  onUpdate,
}: SubmissionDialogProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const existing = assignment?.submission;
  const isLate = assignment?.due_date ? isPast(new Date(assignment.due_date)) : false;

  useEffect(() => {
    if (existing?.content) {
      setContent(existing.content);
    } else {
      setContent('');
    }
  }, [existing, open]);

  const handleSubmit = async () => {
    if (!assignment || !content.trim()) return;
    setSubmitting(true);
    try {
      if (existing) {
        await onUpdate(existing.id, content);
      } else {
        await onSubmit(assignment.id, content);
      }
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (!assignment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? 'Update Submission' : 'Submit Assignment'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Assignment info */}
          <div className="bg-muted/40 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold">{assignment.title}</h3>
            {assignment.classes?.name && (
              <p className="text-sm text-muted-foreground">{assignment.classes.name}</p>
            )}
            <div className="flex flex-wrap gap-3 text-sm">
              {assignment.due_date && (
                <span
                  className={`flex items-center gap-1 ${
                    isLate ? 'text-destructive' : 'text-muted-foreground'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Due: {format(new Date(assignment.due_date), 'MMM d, yyyy')}
                </span>
              )}
              <span className="flex items-center gap-1 text-muted-foreground">
                <FileText className="w-4 h-4" />
                {assignment.max_points} points
              </span>
            </div>
            {isLate && (
              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                Late submission
              </Badge>
            )}
          </div>

          {/* Instructions */}
          {assignment.instructions && (
            <div>
              <Label className="text-sm font-medium">Instructions</Label>
              <div className="bg-muted/30 p-3 rounded-lg text-sm mt-1 whitespace-pre-wrap">
                {assignment.instructions}
              </div>
            </div>
          )}

          {/* Submission content */}
          <div>
            <Label htmlFor="submission-content">Your Response *</Label>
            <Textarea
              id="submission-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your response here..."
              rows={8}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!content.trim() || submitting}>
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {existing ? 'Update Submission' : 'Submit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
