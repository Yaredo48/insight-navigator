import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, CheckCircle, Clock, AlertTriangle, Send, Eye } from 'lucide-react';
import { format, isPast } from 'date-fns';
import type { StudentAssignment } from '@/hooks/useStudentAssignments';

interface StudentAssignmentCardProps {
  assignment: StudentAssignment;
  onSubmit: (assignment: StudentAssignment) => void;
  onViewGrade: (assignment: StudentAssignment) => void;
}

export function StudentAssignmentCard({ assignment, onSubmit, onViewGrade }: StudentAssignmentCardProps) {
  const submission = assignment.submission;
  const isOverdue = assignment.due_date && isPast(new Date(assignment.due_date));
  const isGraded = submission?.status === 'graded';
  const isSubmitted = submission?.status === 'submitted';

  const typeLabels: Record<string, string> = {
    written: '📝 Written',
    quiz: '❓ Quiz',
    project: '📊 Project',
    file: '📎 File Upload',
  };

  const getStatusBadge = () => {
    if (isGraded) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Graded: {submission.grade}/{assignment.max_points}
        </Badge>
      );
    }
    if (isSubmitted) {
      return (
        <Badge variant="secondary">
          <Clock className="w-3 h-3 mr-1" />
          Submitted
        </Badge>
      );
    }
    if (isOverdue && !assignment.allow_late_submissions) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Overdue
        </Badge>
      );
    }
    if (isOverdue) {
      return (
        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Late
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="font-semibold truncate">{assignment.title}</h3>
            {getStatusBadge()}
          </div>

          {assignment.classes?.name && (
            <p className="text-sm text-muted-foreground mb-1">{assignment.classes.name}</p>
          )}

          {assignment.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {assignment.description}
            </p>
          )}

          <div className="flex flex-wrap gap-3 text-sm">
            <span className="text-muted-foreground">
              {typeLabels[assignment.assignment_type] || '📄 Assignment'}
            </span>
            {assignment.due_date && (
              <span
                className={`flex items-center gap-1 ${
                  isOverdue && !isSubmitted && !isGraded ? 'text-destructive' : 'text-muted-foreground'
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
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          {isGraded ? (
            <Button size="sm" variant="outline" onClick={() => onViewGrade(assignment)}>
              <Eye className="w-4 h-4 mr-1" />
              View Grade
            </Button>
          ) : !isSubmitted || (isOverdue && assignment.allow_late_submissions && !isGraded) ? (
            <Button
              size="sm"
              onClick={() => onSubmit(assignment)}
              disabled={isOverdue && !assignment.allow_late_submissions}
            >
              <Send className="w-4 h-4 mr-1" />
              {isSubmitted ? 'Resubmit' : 'Submit'}
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => onViewGrade(assignment)}>
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
