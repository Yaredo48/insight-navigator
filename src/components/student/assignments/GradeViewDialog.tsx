import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, Clock, Calendar, FileText, MessageSquare, Paperclip, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import type { StudentAssignment } from '@/hooks/useStudentAssignments';

interface GradeViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: StudentAssignment | null;
}

function parseFileUrls(fileUrls: any): string[] {
  if (!fileUrls) return [];
  try {
    const urls = typeof fileUrls === 'string' ? JSON.parse(fileUrls) : fileUrls;
    return Array.isArray(urls) ? urls : [];
  } catch {
    return [];
  }
}

export function GradeViewDialog({ open, onOpenChange, assignment }: GradeViewDialogProps) {
  if (!assignment) return null;

  const submission = assignment.submission;
  const isGraded = submission?.status === 'graded';
  const percentage = isGraded && assignment.max_points
    ? Math.round(((submission.grade || 0) / assignment.max_points) * 100)
    : null;
  const files = parseFileUrls(submission?.file_urls);

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return 'text-green-600 dark:text-green-400';
    if (pct >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{assignment.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Assignment info */}
          <div className="flex flex-wrap gap-3 text-sm">
            {assignment.classes?.name && (
              <Badge variant="outline">{assignment.classes.name}</Badge>
            )}
            {assignment.due_date && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Due: {format(new Date(assignment.due_date), 'MMM d, yyyy')}
              </span>
            )}
            <span className="flex items-center gap-1 text-muted-foreground">
              <FileText className="w-4 h-4" />
              {assignment.max_points} points
            </span>
          </div>

          {/* Grade display */}
          {isGraded && percentage !== null ? (
            <div className="bg-muted/40 rounded-lg p-5 text-center space-y-2">
              <div className={`text-4xl font-bold ${getScoreColor(percentage)}`}>
                {submission.grade}/{assignment.max_points}
              </div>
              <div className={`text-lg font-medium ${getScoreColor(percentage)}`}>
                {percentage}%
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Graded
                {submission.graded_at &&
                  ` on ${format(new Date(submission.graded_at), 'MMM d, yyyy')}`}
              </Badge>
            </div>
          ) : (
            <div className="bg-muted/40 rounded-lg p-5 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Awaiting grade</p>
              {submission && (
                <p className="text-sm text-muted-foreground mt-1">
                  Submitted {format(new Date(submission.submitted_at), 'MMM d, yyyy h:mm a')}
                </p>
              )}
            </div>
          )}

          {/* Your submission */}
          {submission?.content && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Your Submission
              </h4>
              <div className="bg-muted/30 p-3 rounded-lg text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                {submission.content}
              </div>
            </div>
          )}

          {/* Attached files */}
          {files.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Attached Files ({files.length})
              </h4>
              <div className="space-y-2">
                {files.map((url, i) => {
                  const fileName = url.split('/').pop() || `File ${i + 1}`;
                  return (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg text-sm hover:bg-muted/50 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="truncate flex-1">{fileName}</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Teacher feedback */}
          {submission?.feedback && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Teacher Feedback
              </h4>
              <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg text-sm whitespace-pre-wrap">
                {submission.feedback}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
