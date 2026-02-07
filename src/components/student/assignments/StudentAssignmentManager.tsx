import { useState } from 'react';
import { Loader2, ClipboardList } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStudentAssignments, StudentAssignment } from '@/hooks/useStudentAssignments';
import { StudentAssignmentCard } from './StudentAssignmentCard';
import { SubmissionDialog } from './SubmissionDialog';
import { GradeViewDialog } from './GradeViewDialog';

interface StudentAssignmentManagerProps {
  studentId: string;
}

export function StudentAssignmentManager({ studentId }: StudentAssignmentManagerProps) {
  const { assignments, loading, submitAssignment, updateSubmission } =
    useStudentAssignments(studentId);
  const [submissionTarget, setSubmissionTarget] = useState<StudentAssignment | null>(null);
  const [gradeTarget, setGradeTarget] = useState<StudentAssignment | null>(null);

  const pending = assignments.filter(
    (a) => !a.submission || a.submission.status === 'submitted'
  );
  const graded = assignments.filter((a) => a.submission?.status === 'graded');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">My Assignments</h2>
        <p className="text-sm text-muted-foreground">
          View assignments, submit your work, and check grades
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <ClipboardList className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium mb-2">No assignments yet</h3>
          <p className="text-sm text-muted-foreground">
            You'll see assignments here once your teacher publishes them
          </p>
        </div>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All ({assignments.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="graded">Graded ({graded.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {assignments.map((a) => (
              <StudentAssignmentCard
                key={a.id}
                assignment={a}
                onSubmit={setSubmissionTarget}
                onViewGrade={setGradeTarget}
              />
            ))}
          </TabsContent>

          <TabsContent value="pending" className="space-y-3">
            {pending.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No pending assignments
              </p>
            ) : (
              pending.map((a) => (
                <StudentAssignmentCard
                  key={a.id}
                  assignment={a}
                  onSubmit={setSubmissionTarget}
                  onViewGrade={setGradeTarget}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="graded" className="space-y-3">
            {graded.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No graded assignments yet
              </p>
            ) : (
              graded.map((a) => (
                <StudentAssignmentCard
                  key={a.id}
                  assignment={a}
                  onSubmit={setSubmissionTarget}
                  onViewGrade={setGradeTarget}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      <SubmissionDialog
        open={!!submissionTarget}
        onOpenChange={(open) => !open && setSubmissionTarget(null)}
        assignment={submissionTarget}
        studentId={studentId}
        onSubmit={submitAssignment}
        onUpdate={updateSubmission}
      />

      <GradeViewDialog
        open={!!gradeTarget}
        onOpenChange={(open) => !open && setGradeTarget(null)}
        assignment={gradeTarget}
      />
    </div>
  );
}
